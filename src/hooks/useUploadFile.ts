import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

import { useNDK } from "@/contexts/NDKContext";
import { NDKEvent } from "@nostr-dev-kit/ndk";

export function useUploadFile() {
  const { ndk, activeUser } = useNDK();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!ndk || !activeUser || !ndk.signer) {
        throw new Error('Must be logged in to upload files');
      }

      // Adapter to make NDK signer compatible with Nostrify's expected signer interface for Blossom
      const signerAdapter = {
        signEvent: async (event: any) => {
          const ndkEvent = new NDKEvent(ndk, event);
          await ndkEvent.sign(ndk.signer);
          return ndkEvent.toNostrEvent();
        },
        getPublicKey: async () => activeUser.pubkey,
        nip04: { encrypt: () => "", decrypt: () => "" }, // unused by blossom
        nip44: { encrypt: () => "", decrypt: () => "" }, // unused by blossom
      };

      const uploader = new BlossomUploader({
        servers: [
          'https://blossom.primal.net/',
        ],
        signer: signerAdapter as any, // Cast to avoid strict type matching issues if types persist
      });

      const tags = await uploader.upload(file);
      return tags;
    },
  });
}