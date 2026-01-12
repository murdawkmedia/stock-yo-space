import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNDK } from '@/contexts/NDKContext';
import { useToast } from '@/hooks/useToast';
import { generateInventoryKey, hexToBytes, bytesToHex } from '@/lib/encryption';
import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';

const KEYCHAIN_KIND = 30078;
const KEYCHAIN_D_TAG = 'inventory-keys';

export function useInventoryKey() {
  const { ndk, activeUser } = useNDK();
  const { toast } = useToast();
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
      const sharedPromise = (async () => {
        const sharedWithMeEvents = await ndk.fetchEvents({
          kinds: [30078], // SHARING_KIND
          '#d': ['inventory-shares'], // SHARING_D_TAG
          '#p': [activeUser.pubkey],
        });

        const sharers = Array.from(sharedWithMeEvents).map(e => e.pubkey);
        if (sharers.length === 0) return [];

        const events = await ndk.fetchEvents({
          kinds: [KEYCHAIN_KIND],
          authors: sharers,
          '#d': [KEYCHAIN_D_TAG],
        });
        return Array.from(events);
      })();

      const [myEvent, sharedEvents] = await Promise.all([myPromise, sharedPromise]);

      const allEvents = sharedEvents;
      if (myEvent) allEvents.push(myEvent);

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

        try {
          const encryptedKey = myTag[2];
          const senderUser = new NDKUser({ pubkey: event.pubkey });

          const decryptedHex = await ndk!.signer!.decrypt(senderUser, encryptedKey);
          const keyBytes = hexToBytes(decryptedHex);

          keys.set(event.pubkey, keyBytes);

          if (event.pubkey === activeUser.pubkey) {
            myKey = keyBytes;
            myKeychain = event;
          }
        } catch (e) {
          console.warn(`Failed to decrypt key from ${event.pubkey}`, e);
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

      // Encrypt for self
      const encryptedForSelf = await ndk.signer.encrypt(activeUser, newKeyHex);

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
      if (!ndk || !activeUser || !myKey || !myKeychain) throw new Error('Not ready or no personal key');
      if (!ndk.signer) throw new Error('No signer');

      const keyHex = bytesToHex(myKey);
      const targetUser = new NDKUser({ pubkey: targetPubkey });

      const encryptedForTarget = await ndk.signer.encrypt(targetUser, keyHex);

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


