import { type NostrEvent, type NostrMetadata, NSchema as n } from '@nostrify/nostrify';
import { useNDK } from '@/contexts/NDKContext';
import { useQuery } from '@tanstack/react-query';
import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';

export function useAuthor(pubkey: string | undefined) {
  const { ndk } = useNDK();

  return useQuery<{ event?: NostrEvent; metadata?: NostrMetadata }>({
    queryKey: ['author', pubkey ?? ''],
    queryFn: async ({ signal }) => {
      if (!pubkey || !ndk) {
        return {};
      }

      // Create a transient user to fetch profile
      const user = new NDKUser({ pubkey });
      user.ndk = ndk;

      // We want the raw event for compatibility with the existing return type
      // But fetchProfile mainly returns the profile object. 
      // Let's use fetchEvent to get the raw kind 0

      try {
        const ndkEvent = await ndk.fetchEvent(
          { kinds: [0], authors: [pubkey] },
          { groupable: true }, // optimization
          // NDK doesn't support AbortSignal directly in fetchEvent usually, but we can try to respect it if we wrapped it.
          // For now, standard NDK fetch.
        );

        if (!ndkEvent) {
          throw new Error('No event found');
        }

        const event: NostrEvent = {
          id: ndkEvent.id,
          pubkey: ndkEvent.pubkey,
          created_at: ndkEvent.created_at!,
          kind: ndkEvent.kind!,
          tags: ndkEvent.tags,
          content: ndkEvent.content,
          sig: ndkEvent.sig!,
        };

        try {
          const metadata = n.json().pipe(n.metadata()).parse(event.content);
          return { metadata, event };
        } catch {
          return { event };
        }

      } catch (e) {
        // If fetch fails or no event
        throw new Error('No event found or fetch error');
      }
    },
    enabled: !!pubkey && !!ndk,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
