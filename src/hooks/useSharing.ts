import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';
import type { SharedInventory } from '@/lib/inventoryTypes';

// Kind 30078 is for application-specific data (replaceable parameterized)
const SHARING_KIND = 30078;
const SHARING_D_TAG = 'inventory-shares';

// Helper to decode npub to hex pubkey
function npubToHex(npub: string): string | null {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type === 'npub') {
      return decoded.data;
    }
    return null;
  } catch {
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
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Get current sharing settings
  const { data: sharedUsers = [], isLoading } = useQuery({
    queryKey: ['inventory-shares', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        {
          kinds: [SHARING_KIND],
          authors: [user.pubkey],
          '#d': [SHARING_D_TAG],
          limit: 1
        }
      ], { signal });

      if (events.length === 0) return [];

      const event = events[0];
      const shares: SharedInventory[] = [];

      for (const tag of event.tags) {
        if (tag[0] === 'p' && tag[1]) {
          shares.push({
            pubkey: tag[1],
            npub: hexToNpub(tag[1]),
            addedAt: event.created_at
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
      if (!user) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      // Search for share events that have the current user as a 'p' tag
      const events = await nostr.query([
        {
          kinds: [SHARING_KIND],
          '#d': [SHARING_D_TAG],
          '#p': [user.pubkey],
          limit: 50
        }
      ], { signal });

      // Extract the authors (people who shared with us)
      return events.map(e => ({
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

      // Build new tags with existing shares + new one
      const newTags: string[][] = [
        ['d', SHARING_D_TAG],
        ...sharedUsers.map(s => ['p', s.pubkey]),
        ['p', pubkey]
      ];

      const event = await user.signer.signEvent({
        kind: SHARING_KIND,
        content: '',
        tags: newTags,
        created_at: Math.floor(Date.now() / 1000)
      });

      await nostr.event(event);
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

      // Build new tags without the removed user
      const newTags: string[][] = [
        ['d', SHARING_D_TAG],
        ...sharedUsers
          .filter(s => s.pubkey !== pubkey)
          .map(s => ['p', s.pubkey])
      ];

      const event = await user.signer.signEvent({
        kind: SHARING_KIND,
        content: '',
        tags: newTags,
        created_at: Math.floor(Date.now() / 1000)
      });

      await nostr.event(event);
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
