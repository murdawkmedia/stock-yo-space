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

  // Query: Get the keychain event (either mine or one shared with me)
  const { data: keychainEvent, isLoading: isLoadingKeychain } = useQuery({
    queryKey: ['inventory-keychain', activeUser?.pubkey],
    queryFn: async () => {
      if (!ndk || !activeUser) return null;

      // 1. Try to fetch my own keychain first
      const myEvent = await ndk.fetchEvent({
        kinds: [KEYCHAIN_KIND],
        authors: [activeUser.pubkey],
        '#d': [KEYCHAIN_D_TAG],
      });

      if (myEvent) return myEvent;

      // 2. If I don't have a keychain, check who has shared with me
      // We can't use useSharing() here to avoid circular dependency
      const sharedWithMeEvents = await ndk.fetchEvents({
        kinds: [30078], // SHARING_KIND
        '#d': ['inventory-shares'], // SHARING_D_TAG
        '#p': [activeUser.pubkey],
      });

      const sharers = Array.from(sharedWithMeEvents).map(e => e.pubkey);
      if (sharers.length === 0) return null;

      // 3. Fetch keychains from those sharers
      const sharedKeychains = await ndk.fetchEvents({
        kinds: [KEYCHAIN_KIND],
        authors: sharers,
        '#d': [KEYCHAIN_D_TAG],
      });

      // 4. Find one that has a key for me
      for (const event of sharedKeychains) {
        const hasKeyForMe = event.tags.some(t => t[0] === 'p' && t[1] === activeUser.pubkey);
        if (hasKeyForMe) return event;
      }

      return null;
    },
    enabled: !!ndk && !!activeUser
  });

  // Query: Extract and decrypt the symmetric key for the current user
  const { data: sharedKey, isLoading: isLoadingKey } = useQuery({
    queryKey: ['inventory-shared-key', activeUser?.pubkey, keychainEvent?.id],
    queryFn: async () => {
      if (!ndk || !activeUser || !keychainEvent) return null;
      if (!ndk.signer) return null;

      // Find tag for me: ['p', my_pub, encrypted_key]
      const myTag = keychainEvent.tags.find(t => t[0] === 'p' && t[1] === activeUser.pubkey);
      if (!myTag || !myTag[2]) return null;

      const encryptedKey = myTag[2];
      // The sender is the author of the keychain event (could be self or sharer)
      const senderUser = new NDKUser({ pubkey: keychainEvent.pubkey });

      try {
        // NDK decrypt: (sender, value)
        const decryptedHex = await ndk.signer.decrypt(senderUser, encryptedKey);
        return hexToBytes(decryptedHex);
      } catch (e) {
        console.error('Decryption failed:', e);
        return null;
      }
    },
    enabled: !!ndk && !!activeUser && !!keychainEvent
  });

  // Mutation: Initialize standard key if missing
  const initializeKey = useMutation({
    mutationFn: async () => {
      if (!ndk || !activeUser || !ndk.signer) throw new Error('Not logged in');
      if (sharedKey) return sharedKey;

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
      queryClient.invalidateQueries({ queryKey: ['inventory-keychain'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-shared-key'] });
    }
  });

  // Mutation: Add Reader
  const addReader = useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!ndk || !activeUser || !sharedKey || !keychainEvent) throw new Error('Not ready');
      if (!ndk.signer) throw new Error('No signer');

      const keyHex = bytesToHex(sharedKey);
      const targetUser = new NDKUser({ pubkey: targetPubkey });

      const encryptedForTarget = await ndk.signer.encrypt(targetUser, keyHex);

      const existingTags = keychainEvent.tags.filter(t => t[0] !== 'd');
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
      queryClient.invalidateQueries({ queryKey: ['inventory-keychain'] });
    }
  });

  // Mutation: Remove Reader
  const removeReader = useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!ndk || !keychainEvent) return;
      if (targetPubkey === activeUser?.pubkey) return;

      const newTags = keychainEvent.tags.filter(t => !(t[0] === 'p' && t[1] === targetPubkey));

      const event = new NDKEvent(ndk);
      event.kind = KEYCHAIN_KIND;
      event.tags = newTags;

      await event.publish();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-keychain'] });
    }
  });

  return {
    sharedKey,
    isLoading: isLoadingKeychain || isLoadingKey,
    initializeKey,
    addReader,
    removeReader
  };
}
