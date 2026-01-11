import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNDK } from '@/contexts/NDKContext';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';

const APP_SETTINGS_KIND = 30078 as NDKKind;
const D_TAG = 'inventory-tracker-settings';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  viewMode: 'list' | 'grid';
  showImages: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  viewMode: 'list',
  showImages: true,
};

export function useAppSettings() {
  const { ndk, activeUser } = useNDK();
  const queryClient = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['app-settings', activeUser?.pubkey],
    enabled: !!ndk && !!activeUser?.pubkey, // Ensure pubkey is present
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    queryFn: async () => {
      // Logic remains the same
      if (!ndk || !activeUser?.pubkey) return DEFAULT_SETTINGS;

      const event = await ndk.fetchEvent({
        kinds: [APP_SETTINGS_KIND],
        authors: [activeUser.pubkey],
        '#d': [D_TAG],
      });

      if (!event) return DEFAULT_SETTINGS;

      try {
        const parsed = JSON.parse(event.content);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Failed to parse app settings:', e);
        return DEFAULT_SETTINGS;
      }
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (newSettings: Partial<AppSettings>) => {
      if (!ndk || !activeUser) throw new Error('Not logged in');

      const mergedSettings = { ...settings, ...newSettings };

      const event = new NDKEvent(ndk);
      event.kind = APP_SETTINGS_KIND;
      event.content = JSON.stringify(mergedSettings);
      event.tags = [['d', D_TAG]];

      await event.publish();
      return mergedSettings;
    },
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(['app-settings', activeUser?.pubkey], savedSettings);
    },
  });

  return {
    settings,
    saveSettings,
    isLoading,
  };
}
