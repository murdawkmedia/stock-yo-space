// NOTE: This file should normally not be modified unless you are adding a new provider.
// To add new routes, edit the AppRouter.tsx file.

import { Suspense, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { createUnhead } from '@unhead/react';
// import { UnheadProvider } from '@unhead/react';
// import { InferSeoMetaPlugin } from '@unhead/addons'; // or unhead? Let's try to find where it lives or omit if unsure.
// Actually InferSeoMetaPlugin usually comes from @unhead/schema-org? No.
// Let's guess simple imports first or check source if possible.
// If I can't check, I'll comment out the plugin usage if it's not critical. 
// But UnheadProvider is critical.

import { HelmetProvider } from 'react-helmet-async';
import { NDKProvider } from '@/contexts/NDKContext';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed old providers: NostrProvider, NostrLoginProvider, NostrSync
// import { NWCProvider } from '@/contexts/NWCContext'; // Keeping for now, might need refactor
import { AppProvider } from '@/components/AppProvider';
import { AppConfig } from '@/contexts/AppContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import AppRouter from './AppRouter';

// const head = createUnhead({
//   plugins: [
//     InferSeoMetaPlugin(),
//   ],
// });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

const defaultConfig: AppConfig = {
  theme: "light",
  relayMetadata: {
    relays: [
      { url: 'wss://relay.primal.net', read: true, write: true },
      { url: 'wss://relay.damus.io', read: true, write: true },
      { url: 'wss://nos.lol', read: true, write: true },
      { url: 'wss://relay.snort.social', read: true, write: true },
      // { url: 'wss://relay.bitcoiner.social', read: true, write: true }, // Commented out for now, let's stick to known good general relays
    ],
    updatedAt: 0,
  },
};

export function App() {
  // Memoize the relay list to prevent infinite re-renders/connection resets in NDKContext
  const relayUrls = useMemo(() => defaultConfig.relayMetadata.relays.map(r => r.url), []);

  return (
    // <UnheadProvider head={head}>
    <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig}>
      <HelmetProvider>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <QueryClientProvider client={queryClient}>
              <NDKProvider relays={relayUrls}>
                <TooltipProvider>
                  <Toaster />
                  <Suspense>
                    <AppRouter />
                  </Suspense>
                </TooltipProvider>
              </NDKProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </AppProvider>
    // </UnheadProvider>
  );
}

export default App;
