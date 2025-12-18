import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Wifi, History, Lock, Download, Upload, ArrowLeft } from 'lucide-react';
import { RelayListManager } from '@/components/RelayListManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';

// Lazy load heavy components
const InventoryHistory = React.lazy(() => import('@/components/inventory/InventoryHistory').then(m => ({ default: m.InventoryHistory })));
const EncryptedItemsManager = React.lazy(() => import('@/components/inventory/EncryptedItemsManager').then(m => ({ default: m.EncryptedItemsManager })));
const ExportImport = React.lazy(() => import('@/components/inventory/ExportImport').then(m => ({ default: m.ExportImport })));

export function Settings() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('relays');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 pb-20">
        <div className="max-w-5xl mx-auto p-4">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-4"
            >
              <Link to="/inventory" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Inventory
              </Link>
            </Button>
          </div>
          <Card className="border-0 shadow-xl">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
                <h2 className="text-2xl font-bold">Login Required</h2>
                <p className="text-muted-foreground">
                  Please log in to access settings and manage your inventory.
                </p>
                <LoginArea className="max-w-60 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 pb-20">
      <div className="max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-4"
          >
            <Link to="/inventory" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-primary to-indigo-600 rounded-lg shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-primary to-indigo-600 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage your relays, view history, and configure privacy options
          </p>
        </div>

        {/* Settings Tabs */}
        <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="relays" className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Relays
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
                <TabsTrigger value="encryption" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Encryption
                </TabsTrigger>
                <TabsTrigger value="backup" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Backup
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Relays Tab */}
              <TabsContent value="relays">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Configure Your Relays</h3>
                    <p className="text-muted-foreground mb-4">
                      Choose which Nostr relays to use for storing and syncing your inventory.
                      Add your own trusted relays for extra backup.
                    </p>
                    <RelayListManager />
                  </div>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>💡 Tips:</strong></p>
                    <p>• Use 3-5 relays for optimal redundancy</p>
                    <p>• Public relays are fine for most items</p>
                    <p>• For sensitive items, consider self-hosting a relay</p>
                    <p>• Add relays in different geographic regions for better availability</p>
                  </div>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Inventory History</h3>
                    <p className="text-muted-foreground mb-4">
                      View how your inventory has changed over time. See what items you've
                      used, restocked, or added to your shopping list.
                    </p>
                  </div>
                  <React.Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading history...</div>}>
                    <InventoryHistory />
                  </React.Suspense>
                </div>
              </TabsContent>

              {/* Encryption Tab */}
              <TabsContent value="encryption">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Encrypted Items</h3>
                    <p className="text-muted-foreground mb-4">
                      Mark specific items to be stored encrypted with NIP-04. Only you can
                      read these items - they're encrypted with your private key.
                      Perfect for sensitive inventory like medications or valuables.
                    </p>
                  </div>
                  <React.Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading encryption settings...</div>}>
                    <EncryptedItemsManager />
                  </React.Suspense>
                </div>
              </TabsContent>

              {/* Backup Tab */}
              <TabsContent value="backup">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Backup & Export</h3>
                    <p className="text-muted-foreground mb-4">
                      Export your inventory to file for backup or import it later.
                      Your data is always portable - you own it.
                    </p>
                  </div>
                  <React.Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading backup options...</div>}>
                    <ExportImport />
                  </React.Suspense>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}