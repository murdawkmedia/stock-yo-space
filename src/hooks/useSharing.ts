import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNDK } from '@/contexts/NDKContext';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';
import type { SharedInventory } from '@/lib/inventoryTypes';
import { useInventoryKey } from './useInventoryKey';

// Kind 30078 is for application-specific data (replaceable parameterized)
const SHARING_KIND = 30078;
const SHARING_D_TAG = 'inventory-shares';

// Helper to decode npub to hex pubkey
function npubToHex(npub: string): string | null {
  try {
    const decoded = nip19.decode(npub);
    console.log('🔍 nip19 decode result:', decoded);
    if (decoded.type === 'npub') {
      // Handle strictnostr/nostr-tools v2 which might return string or specific data type
      // If it's already a string, return it.
      if (typeof decoded.data === 'string') return decoded.data;
      // If it's bytes (Uint8Array), convert to hex
      // We can't easily import utils here without making it messy, so let's try to assume string for now or check if it is not string.
      // Actually, nostr-tools v2 decode returns { type, data: string } for npub usually.
      return decoded.data as string;
    }
    return null;
  } catch (e) {
    console.error('❌ nip19 decode failed:', e);
    return null;
  }
}

// Helper to encode hex pubkey to npub
function hexToNpub(hex: string): string {
  try {
    return nip19.npubEncode(hex);
  } catch {
    return hex;
  }
}

export function useSharing() {
  const { ndk, activeUser: user } = useNDK();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addReader, removeReader } = useInventoryKey();

  // Query: Get current sharing settings
  const { data: sharedUsers = [], isLoading } = useQuery({
    queryKey: ['inventory-shares', user?.pubkey],
    queryFn: async (c) => {
      if (!user || !ndk) return [];

      const events = await ndk.fetchEvents({
        kinds: [SHARING_KIND as number],
        authors: [user.pubkey],
        '#d': [SHARING_D_TAG],
        limit: 1
      });

      if (events.size === 0) return [];

      const event = Array.from(events)[0];
      const shares: SharedInventory[] = [];

      for (const tag of event.tags) {
        if (tag[0] === 'p' && tag[1]) {
          shares.push({
            pubkey: tag[1],
            npub: hexToNpub(tag[1]),
            addedAt: event.created_at || Math.floor(Date.now() / 1000)
          });
        }
      }

      return shares;
    },
    enabled: !!user
  });

  // Query: Get users who have shared WITH the current user
  const { data: sharedWithMe = [] } = useQuery({
    queryKey: ['inventory-shared-with-me', user?.pubkey],
    queryFn: async (c) => {
      if (!user || !ndk) return [];

      // Search for share events that have the current user as a 'p' tag
      const events = await ndk.fetchEvents({
        kinds: [SHARING_KIND as number],
        '#d': [SHARING_D_TAG],
        '#p': [user.pubkey],
        limit: 50
      });

      console.log('🔌 useSharing: Checking connected relays:', ndk.pool.connectedRelays().map(r => r.url));

      // (Debug block for specific owner removed - general logging below is sufficient)

      console.log('🔗 useSharing: Found share events:', events.size);
      events.forEach(e => console.log('   - From:', e.pubkey));

      // Extract the authors (people who shared with us)
      return Array.from(events).map(e => ({
        pubkey: e.pubkey,
        npub: hexToNpub(e.pubkey),
        addedAt: e.created_at
      }));
    },
    enabled: !!user
  });

  // Mutation: Add a user to share with
  const addSharedUser = useMutation({
    mutationFn: async (npubOrHex: string) => {
      console.log('🔗 Sharing mutation started for:', npubOrHex);
      if (!user) throw new Error('Must be logged in');

      // Decode npub if needed
      let pubkey = npubOrHex;
      if (npubOrHex.startsWith('npub')) {
        const decoded = npubToHex(npubOrHex);
        if (!decoded) throw new Error('Invalid npub format');
        pubkey = decoded;
      }

      // Check if already shared
      if (sharedUsers.some(s => s.pubkey === pubkey)) {
        throw new Error('Already sharing with this user');
      }

      // 1. Grant Access to the Key
      await addReader.mutateAsync(pubkey);

      // 2. Add to Sharing List (Discovery)
      const newTags: string[][] = [
        ['d', SHARING_D_TAG],
        ...sharedUsers.map(s => ['p', s.pubkey]),
        ['p', pubkey]
      ];

      const event = new NDKEvent(ndk);
      event.kind = SHARING_KIND;
      event.tags = newTags;

      await event.publish();
      return { pubkey, npub: hexToNpub(pubkey) };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-shares'] });
      toast({
        title: 'Shared successfully',
        description: `Inventory shared with ${data.npub?.slice(0, 12)}...`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to share',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation: Remove a shared user
  const removeSharedUser = useMutation({
    mutationFn: async (pubkey: string) => {
      if (!user) throw new Error('Must be logged in');

      // 1. Revoke Access to the Key (future updates wont include them)
      await removeReader.mutateAsync(pubkey);

      // 2. Remove from Sharing List
      const newTags: string[][] = [
        ['d', SHARING_D_TAG],
        ...sharedUsers
          .filter(s => s.pubkey !== pubkey)
          .map(s => ['p', s.pubkey])
      ];

      const event = new NDKEvent(ndk);
      event.kind = SHARING_KIND;
      event.tags = newTags;

      await event.publish();
      return pubkey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-shares'] });
      toast({
        title: 'Sharing removed',
        description: 'User can no longer see your inventory'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove sharing',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Combined pubkeys to query for (my items + items shared with me)
  const allAuthorPubkeys = user
    ? [user.pubkey, ...sharedWithMe.map(s => s.pubkey)]
    : [];

  return {
    sharedUsers,
    sharedWithMe,
    allAuthorPubkeys,
    isLoading,
    addSharedUser: addSharedUser.mutateAsync,
    removeSharedUser: removeSharedUser.mutateAsync,
    isAddingUser: addSharedUser.isPending,
    isRemovingUser: removeSharedUser.isPending
  };
}
