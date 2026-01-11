import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useNDK } from "@/contexts/NDKContext";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import type { NostrEvent } from "@nostrify/nostrify"; // Keep for input types if needed, or define locally

export function useNostrPublish(): UseMutationResult<NDKEvent, Error, Partial<NostrEvent>> {
  const { ndk, activeUser } = useNDK();

  return useMutation({
    mutationFn: async (t: Partial<NostrEvent>) => {
      if (!ndk || !activeUser) {
        throw new Error("NDK/User not initialized");
      }

      const event = new NDKEvent(ndk);
      if (t.kind === undefined) throw new Error("Kind is required");
      event.kind = t.kind;
      event.content = t.content || "";
      event.tags = t.tags || [];
      event.created_at = t.created_at || Math.floor(Date.now() / 1000);
      event.pubkey = activeUser.pubkey;

      // Add client tag if protocol is https
      if (typeof location !== 'undefined' && location.protocol === "https:" && !event.tags.some(([name]) => name === "client")) {
        event.tags.push(["client", location.hostname]);
      }

      await event.publish();
      return event;
    },
    onError: (error) => {
      console.error("Failed to publish event:", error);
    },
    onSuccess: (data) => {
      console.log("Event published successfully:", data.id);
    },
  });
}