import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { RelayListManager } from '@/components/RelayListManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useInventoryKey } from '@/hooks/useInventoryKey';
import { LoginArea } from '@/components/auth/LoginArea';

export function Settings() {
  const { user } = useCurrentUser();

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
                <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground" />
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
          <Link to="/" className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity w-fit">
            <div className="p-2 bg-gradient-to-br from-primary to-indigo-600 rounded-lg shadow-lg">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-primary to-indigo-600 bg-clip-text text-transparent">
              Settings
            </h1>
          </Link>
          <p className="text-lg text-muted-foreground">
            Manage your relays, view history, and configure privacy options
          </p>
        </div>

        {/* Relay Settings */}
        <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm mt-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Troubleshooting</h3>
                <p className="text-muted-foreground text-sm">
                  If you are experiencing issues with sharing or data persistence (e.g. "Not ready or no personal key"), try resetting your encryption key.
                  <br /><strong>Warning:</strong> This will invalidate existing shares. You will need to re-share your inventory.
                </p>
              </div>
              <ResetKeyButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResetKeyButton() {
  const { initializeKey, isLoading, myKey } = useInventoryKey();
  const [status, setStatus] = React.useState<string>('');

  const handleReset = async () => {
    try {
      setStatus('Resetting...');
      await initializeKey.mutateAsync();
      setStatus('Success! Key reset.');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      console.error(e);
      setStatus('Error: ' + (e as Error).message);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="destructive"
        onClick={handleReset}
        disabled={isLoading || initializeKey.isPending}
      >
        {initializeKey.isPending ? 'Resetting...' : 'Reset Inventory Key'}
      </Button>
      {status && <span className="text-sm font-medium">{status}</span>}
      {myKey && <span className="text-xs text-green-600">Active Key Present</span>}
    </div>
  );
}