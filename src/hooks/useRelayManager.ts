import { useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useNDK } from '@/contexts/NDKContext';
import { NDKKind } from '@nostr-dev-kit/ndk';

export interface Relay {
  url: string;
  read: boolean;
  write: boolean;
}

export function useRelayManager() {
  const { config, updateConfig } = useAppContext();
  const { user } = useCurrentUser();
  const { ndk } = useNDK();
  const { mutate: publishEvent } = useNostrPublish();
  const { toast } = useToast();

  const relays = config.relayMetadata.relays;

  // Sync NIP-65 Relays on Login
  useEffect(() => {
    async function syncUserRelays() {
      if (!user || !ndk) return;

      try {
        const event = await ndk.fetchEvent({
          kinds: [10002 as NDKKind],
          authors: [user.pubkey],
        });

        if (event) {
          const fetchedRelays: Relay[] = event.tags
            .filter(tag => tag[0] === 'r')
            .map(tag => {
              const url = tag[1];
              const marker = tag[2];
              return {
                url,
                read: marker === 'read' || !marker,
                write: marker === 'write' || !marker,
              };
            });

          // Simple length check + one value check to avoid deep recursion if not needed
          // We rely on the dependency array to prevent loops (removing 'relays' from deps)
          // Deep comparison of relays
          const areRelaysEqual = (a: Relay[], b: Relay[]) => {
            if (a.length !== b.length) return false;
            // Sort by URL to ensure order doesn't matter
            const sortedA = [...a].sort((x, y) => x.url.localeCompare(y.url));
            const sortedB = [...b].sort((x, y) => x.url.localeCompare(y.url));

            return sortedA.every((r, i) =>
              r.url === sortedB[i].url &&
              r.read === sortedB[i].read &&
              r.write === sortedB[i].write
            );
          };

          if (!areRelaysEqual(fetchedRelays, relays)) {
            updateConfig(current => ({
              ...current,
              relayMetadata: {
                relays: fetchedRelays,
                updatedAt: Math.floor(Date.now() / 1000),
              },
            }));
            toast({
              title: 'Relays Synced',
              description: `Loaded ${fetchedRelays.length} relays from your profile.`,
            });
          }
        }
      } catch (e) {
        console.error('Failed to sync user relays:', e);
      }
    }

    syncUserRelays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.pubkey, ndk]); // Only run when user changes (login/logout). DO NOT add 'relays' here.

  const publishNIP65RelayList = (relayList: Relay[]) => {
    const tags = relayList.map(relay => {
      if (relay.read && relay.write) {
        return ['r', relay.url];
      } else if (relay.read) {
        return ['r', relay.url, 'read'];
      } else if (relay.write) {
        return ['r', relay.url, 'write'];
      }
      return null;
    }).filter((tag): tag is string[] => tag !== null);

    publishEvent(
      {
        kind: 10002,
        content: '',
        tags,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Relay list published',
            description: 'Your relay list has been synced to Nostr.',
          });
        },
        onError: (error) => {
          console.error('Failed to publish relay list:', error);
          toast({
            title: 'Sync failed',
            description: 'Could not sync relay list to Nostr.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const updateRelays = (newRelays: Relay[]) => {
    const now = Math.floor(Date.now() / 1000);

    // 1. Update local config (UI updates immediately)
    updateConfig((current) => ({
      ...current,
      relayMetadata: {
        relays: newRelays,
        updatedAt: now,
      },
    }));

    // 2. Side Effect: Sync to Nostr Network
    if (user) {
      publishNIP65RelayList(newRelays);
    }
  };

  const addRelay = (url: string) => {
    const normalized = url.trim(); // Assume valid URL (caller validates)
    if (relays.some(r => r.url === normalized)) return; // No dupe

    const newRelays = [...relays, { url: normalized, read: true, write: true }];
    updateRelays(newRelays);
  };

  const removeRelay = (url: string) => {
    const newRelays = relays.filter(r => r.url !== url);
    updateRelays(newRelays);
  };

  const toggleRead = (url: string) => {
    const newRelays = relays.map(r =>
      r.url === url ? { ...r, read: !r.read } : r
    );
    updateRelays(newRelays);
  };

  const toggleWrite = (url: string) => {
    const newRelays = relays.map(r =>
      r.url === url ? { ...r, write: !r.write } : r
    );
    updateRelays(newRelays);
  };

  return {
    relays,
    addRelay,
    removeRelay,
    toggleRead,
    toggleWrite,
  };
}
