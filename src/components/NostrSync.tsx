import { useEffect } from 'react';
import { useNDK } from '@/contexts/NDKContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';

/**
 * NostrSync - Syncs user's Nostr data
 *
 * This component runs globally to sync various Nostr data when the user logs in.
 * Currently syncs:
 * - NIP-65 relay list (kind 10002)
 */
export function NostrSync() {
  const { ndk } = useNDK(); // useNostr replacement
  const { user } = useCurrentUser();
  const { config, updateConfig } = useAppContext();

  useEffect(() => {
    if (!user) return;

    const syncRelaysFromNostr = async () => {
      try {
        if (!ndk) return;
        const events = await ndk.fetchEvents({
          kinds: [10002], authors: [user.pubkey], limit: 1
        });

        const eventArray = Array.from(events);

        if (eventArray.length > 0) {
          const event = eventArray[0];

          // Only update if the event is newer than our stored data
          if (event.created_at && event.created_at > config.relayMetadata.updatedAt) {
            const fetchedRelays = event.tags
              .filter(([name]) => name === 'r')
              .map(([_, url, marker]) => ({
                url,
                read: !marker || marker === 'read',
                write: !marker || marker === 'write',
              }));

            if (fetchedRelays.length > 0) {
              console.log('Syncing relay list from Nostr:', fetchedRelays);
              updateConfig((current) => ({
                ...current,
                relayMetadata: {
                  relays: fetchedRelays,
                  updatedAt: event.created_at || Math.floor(Date.now() / 1000),
                },
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync relays from Nostr:', error);
      }
    };

    syncRelaysFromNostr();
  }, [user, config.relayMetadata.updatedAt, ndk, updateConfig]);

  return null;
}