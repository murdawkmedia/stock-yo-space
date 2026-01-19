import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNDK } from '@/contexts/NDKContext';
import { generateInventoryKey, hexToBytes, bytesToHex } from '@/lib/encryption';
import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';

const KEYCHAIN_KIND = 30078;
const KEYCHAIN_D_TAG = 'inventory-keys';

export function useInventoryKey() {
  const { ndk, activeUser } = useNDK();
  const queryClient = useQueryClient();

  // Query: Get all relevant keychain events (mine + those shared with me)
  const { data: keychains = [], isLoading: isLoadingKeychains } = useQuery({
    queryKey: ['inventory-keychains', activeUser?.pubkey],
    queryFn: async () => {
      if (!ndk || !activeUser) return [];

      // 1. Fetch own keychain
      const myPromise = ndk.fetchEvent({
        kinds: [KEYCHAIN_KIND],
        authors: [activeUser.pubkey],
        '#d': [KEYCHAIN_D_TAG],
      });

      // 2. Fetch shared keychains
      // 2. Fetch shared keychains (with timeout/error handling)
      const sharedPromise = (async () => {
        try {
          // Add a timeout race
          const fetchShared = async () => {
            const sharedWithMeEvents = await ndk.fetchEvents({
              kinds: [30078],
              '#d': ['inventory-shares'],
              '#p': [activeUser.pubkey],
            }, { closeOnEose: true });

            const sharers = Array.from(sharedWithMeEvents).map(e => e.pubkey);
            if (sharers.length === 0) return [];

            const events = await ndk.fetchEvents({
              kinds: [KEYCHAIN_KIND],
              authors: sharers,
              '#d': [KEYCHAIN_D_TAG],
            }, { closeOnEose: true }); // Ensure we close on EOSE
            return Array.from(events);
          };

          // 10s timeout for shared keys (increased for reliability)
          const timeout = new Promise<NDKEvent[]>((_, reject) =>
            setTimeout(() => reject(new Error('Shared key fetch timeout')), 10000)
          );

          return await Promise.race([fetchShared(), timeout]);
        } catch (e) {
          console.warn('Failed to fetch shared keychains:', e);
          return [];
        }
      })();

      // Use allSettled to ensure myKey doesn't fail if shared fails
      const [myResult, sharedResult] = await Promise.allSettled([myPromise, sharedPromise]);

      const allEvents: NDKEvent[] = [];

      // Process Shared
      if (sharedResult.status === 'fulfilled') {
        allEvents.push(...sharedResult.value);
      }

      // Process Mine
      // Critical: If my fetch failed, we can't really do much, but we generally expect it to work or be cached.
      if (myResult.status === 'fulfilled' && myResult.value) {
        allEvents.push(myResult.value);
      } else if (myResult.status === 'rejected') {
        console.error('Failed to fetch my keychain:', myResult.reason);
      }

      return allEvents;
    },
    enabled: !!ndk && !!activeUser
  });

  // Query: Extract and decrypt keys
  const { data: keysData, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['inventory-keys', activeUser?.pubkey, keychains.length],
    queryFn: async () => {
      if (!ndk || !activeUser || !ndk.signer || keychains.length === 0) {
        return { keys: new Map<string, Uint8Array>(), myKey: null as Uint8Array | null, myKeychain: null as NDKEvent | null };
      }

      const keys = new Map<string, Uint8Array>();
      let myKey: Uint8Array | null = null;
      let myKeychain: NDKEvent | null = null;

      await Promise.all(keychains.map(async (event) => {
        // Find tag for me: ['p', my_pub, encrypted_key]
        const myTag = event.tags.find(t => t[0] === 'p' && t[1] === activeUser.pubkey);
        if (!myTag || !myTag[2]) return;


        // Try NIP-44 Decryption
        try {
          const encryptedKey = myTag[2];
          const senderUser = new NDKUser({ pubkey: event.pubkey });

          // Attempt NIP-44 first
          const decryptedHex = await ndk!.signer!.decrypt(senderUser, encryptedKey, 'nip44');
          const keyBytes = hexToBytes(decryptedHex);

          keys.set(event.pubkey, keyBytes);

          if (event.pubkey === activeUser.pubkey) {
            myKey = keyBytes;
            myKeychain = event;
          }
        } catch (e) {
          console.warn(`Failed to decrypt key from ${event.pubkey} (NIP-44)`, e);
          // Fallback to NIP-04? No, strict upgrade for Phase 2.
        }
      }));

      return { keys, myKey, myKeychain };
    },
    enabled: !!ndk && !!activeUser && keychains.length > 0
  });

  const keys = keysData?.keys || new Map<string, Uint8Array>();
  const myKey = keysData?.myKey || null;
  const myKeychain = keysData?.myKeychain || null; // For mutations

  // Mutation: Initialize standard key if missing
  const initializeKey = useMutation({
    mutationFn: async () => {
      if (!ndk || !activeUser || !ndk.signer) throw new Error('Not logged in');
      if (myKey) return myKey;

      const newKey = generateInventoryKey();
      const newKeyHex = bytesToHex(newKey);

      // Encrypt for self (NIP-44)
      const encryptedForSelf = await ndk.signer.encrypt(activeUser, newKeyHex, 'nip44');

      const event = new NDKEvent(ndk);
      event.kind = KEYCHAIN_KIND;
      event.tags = [
        ['d', KEYCHAIN_D_TAG],
        ['p', activeUser.pubkey, encryptedForSelf]
      ];
      await event.publish();

      return newKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-keychains'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-keys'] });
    }
  });

  // Mutation: Add Reader
  const addReader = useMutation({
    mutationFn: async (targetPubkey: string) => {
      console.log('➕ addReader mutation started for:', targetPubkey);
      console.log('   State:', {
        hasNDK: !!ndk,
        hasUser: !!activeUser,
        hasMyKey: !!myKey,
        hasKeychain: !!myKeychain,
        hasSigner: !!ndk?.signer
      });

      if (!ndk || !activeUser || !myKey || !myKeychain) throw new Error('Not ready or no personal key');
      if (!ndk.signer) throw new Error('No signer');

      const keyHex = bytesToHex(myKey);
      const targetUser = new NDKUser({ pubkey: targetPubkey });

      // Encrypt for target (NIP-44)
      const encryptedForTarget = await ndk.signer.encrypt(targetUser, keyHex, 'nip44');

      const existingTags = myKeychain.tags.filter(t => t[0] !== 'd');
      const filteredTags = existingTags.filter(t => !(t[0] === 'p' && t[1] === targetPubkey));

      const event = new NDKEvent(ndk);
      event.kind = KEYCHAIN_KIND;
      event.tags = [
        ['d', KEYCHAIN_D_TAG],
        ...filteredTags,
        ['p', targetPubkey, encryptedForTarget]
      ];
      await event.publish();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-keychains'] }); // To update myKeychain ref
    }
  });

  // Mutation: Remove Reader
  const removeReader = useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!ndk || !myKeychain) return;
      if (targetPubkey === activeUser?.pubkey) return;

      const newTags = myKeychain.tags.filter(t => !(t[0] === 'p' && t[1] === targetPubkey));

      const event = new NDKEvent(ndk);
      event.kind = KEYCHAIN_KIND;
      event.tags = newTags;

      await event.publish();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-keychains'] });
    }
  });

  // Auto-initialize key if missing
  useEffect(() => {
    // Debug logging for key initialization state
    if (activeUser && process.env.NODE_ENV === 'development') {
      console.debug('useInventoryKey check:', {
        hasActiveUser: !!activeUser,
        isLoadingKeychains,
        isLoadingKeys,
        hasMyKey: !!myKey,
        isInitializing: initializeKey.isPending
      });
    }

    if (activeUser && ndk?.signer && !isLoadingKeychains && !isLoadingKeys && !myKey && !initializeKey.isPending) {
      console.log('Auto-initializing inventory key (NIP-44 Upgrade or Missing Key)');
      initializeKey.mutate();
    }
  }, [activeUser, ndk?.signer, isLoadingKeychains, isLoadingKeys, myKey, initializeKey.isPending]);

  return {
    keys,
    sharedKey: myKey || keys.values().next().value || null, // Fallback for backward compatibility
    myKey, // Explicitly expose myKey for writing
    isLoading: isLoadingKeychains || isLoadingKeys,
    initializeKey,
    addReader,
    removeReader
  };
}


