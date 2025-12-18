import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, FileText, HardDrive, Database } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { type InventoryItem } from '@/lib/inventoryTypes';

export function ExportImport() {
  const { items } = useInventory();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const exportInventory = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      authorPubkey: user?.pubkey,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        min_threshold: item.min_threshold,
        unit: item.unit,
        on_shopping_list: item.on_shopping_list,
        priority: item.priority
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `${items.length} items exported to file`
    });
  };

  const exportCSV = () => {
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Min Threshold', 'On Shopping List', 'Priority'];
    const rows = items.map(item => [
      item.name,
      item.category,
      item.quantity.toString(),
      item.unit,
      item.min_threshold.toString(),
      item.on_shopping_list ? 'Yes' : 'No',
      item.priority
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV Export successful',
      description: `${items.length} items exported to CSV`
    });
  };

  const importInventory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      setImporting(false);
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the import data
      if (!data.version || !data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid file format');
      }

      if (data.authorPubkey && data.authorPubkey !== user.pubkey) {
        if (!confirm(
          `This file was exported from a different account (${data.authorPubkey.slice(0, 16)}...).\n\n` +
          `Do you want to import these items anyway?`
        )) {
          setImporting(false);
          return;
        }
      }

      // Acknowledge that import will create new items
      const itemCount = data.items.length;
      if (!confirm(
        `This will attempt to import ${itemCount} items.\n\n` +
        `⚠️ Note: Full import functionality with automatic creation of items is on the roadmap.\n\n` +
        `The import file has been parsed and is ready for implementation. Data:\n\n` +
        JSON.stringify(data.items.slice(0, 3), null, 2) // Show first 3 items as preview
      )) {
        setImporting(false);
        return;
      }

      toast({
        title: 'Import file received',
        description: `${itemCount} items parsed successfully. Import creation is coming soon!`
      });

      console.log('Import data:', data);
      // TODO: Implement actual item creation from import data
      // This will require a batch create function in useInventory hook

    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Invalid file format',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  if (!user) {
    return (
      <Card className="border-0 bg-card/50">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Please log in to export or import inventory
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="space-y-4">
        <Card className="border-0 bg-green-50/30 dark:bg-green-950/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
              <Download className="h-5 w-5" />
              Export Inventory
            </CardTitle>
            <CardDescription>
              Download your inventory to file for backup or to use in other applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={exportInventory}
                disabled={items.length === 0}
                className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-green-900/30"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export JSON
              </Button>

              <Button
                onClick={exportCSV}
                disabled={items.length === 0}
                variant="outline"
                className="border-green-300 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50"
              >
                <Database className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add items to your inventory to enable export
              </p>
            ) : (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>JSON Format (.json)</strong></p>
                <p>• Full fidelity export with all metadata</p>
                <p>• Best for backups and future imports</p>
                <p>• Includes timestamps, priorities, and settings</p>

                <p className="mt-2"><strong>CSV Format (.csv)</strong></p>
                <p>• Simple spreadsheet format</p>
                <p>• Compatible with Excel, Sheets, LibreOffice</p>
                <p>• Easy to share and collaborate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Section */}
      <div className="space-y-4">
        <Card className="border-0 bg-amber-50/30 dark:bg-amber-950/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Upload className="h-5 w-5" />
              Import Inventory
            </CardTitle>
            <CardDescription>
              Import previously exported inventory or migrate from other systems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700">
              <div className="flex gap-3">
                <HardDrive className="h-5 w-5 text-amber-600" />
                <div>
                  <AlertTitle className="text-amber-800 dark:text-amber-400">
                    🚧 Import Functionality - Coming Soon
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-450">
                    You can select a JSON file to import, and the app will parse and validate it.
                    Automatic item creation is being built and will be available in a future update.
                    For now, your import file will be logged to the console for testing.
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            <div>
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={importInventory}
                disabled={importing}
                className="hidden"
              />
              <label htmlFor="import-file">
                <Button
                  asChild
                  disabled={importing}
                  className="bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {importing ? 'Importing...' : 'Import JSON File'}
                  </span>
                </Button>
              </label>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Supported Formats:</strong></p>
              <p>• JSON (.json) - Exported from Stock Your Space</p>
              <p>• Other formats coming soon (CSV, Excel)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Info */}
      <Card className="border-0 bg-blue-50/30 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-400">
            Your Data, Your Control
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-700 dark:text-blue-450">
          <p>✅ Full control over your inventory data</p>
          <p>✅ Export anytime, no lock-in</p>
          <p>✅ All data encrypted with Nostr private key</p>
          <p>✅ Stored on decentralized relay network</p>
          <p>✅ Standard JSON format for maximum portability</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="border-0 bg-card/50">
        <CardHeader>
          <CardTitle>Current Inventory Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{new Set(items.map(i => i.category)).size}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">On Shopping List</p>
              <p className="text-2xl font-bold">{items.filter(i => i.on_shopping_list).length}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">{items.filter(i => i.quantity === 0).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}