import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, Package, TrendingDown, Home, Share2, Settings } from 'lucide-react';

import { useInventory } from '@/hooks/useInventory';
import { useSharing } from '@/hooks/useSharing';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from '@/lib/inventoryTypes';
import { CategoryView } from '@/components/inventory/CategoryView';
import { ShoppingListView } from '@/components/inventory/ShoppingListView';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { ShareInventoryModal } from '@/components/inventory/ShareInventoryModal';
import { QuickStats } from '@/components/inventory/QuickStats';

export function Inventory() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { sharedWithMe } = useSharing();
  const { items, shoppingListItems, loading } = useInventory();

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-primary to-indigo-600 rounded-lg shadow-lg">
              <Home className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-primary to-indigo-600 bg-clip-text text-transparent">
              Stock Your Space
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Your complete household inventory tracker
          </p>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Main Content */}
        <Card className="border-0 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="inventory" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger value="shopping" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Shopping List
                    {shoppingListItems.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                        {shoppingListItems.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="px-2 sm:px-3 hidden sm:flex"
                    title="Settings"
                  >
                    <Link to="/settings">
                      <Settings className="h-4 w-4" />
                      <span className="sm:ml-2">Settings</span>
                    </Link>
                  </Button>
                  <Button
                    onClick={() => setShareDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="relative flex-1 sm:flex-none"
                  >
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Share</span>
                    {sharedWithMe.length > 0 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                        {sharedWithMe.length}
                      </span>
                    )}
                  </Button>
                  <Button onClick={() => setAddDialogOpen(true)} size="sm" className="flex-1 sm:flex-none">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Add Item</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-6">
                {CATEGORIES.map((category) => (
                  <CategoryView key={category} category={category} />
                ))}
              </TabsContent>

              {/* Shopping List Tab */}
              <TabsContent value="shopping">
                <ShoppingListView />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Add Item Dialog */}
        <AddItemDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

        {/* Share Inventory Modal */}
        <ShareInventoryModal open={shareDialogOpen} onOpenChange={setShareDialogOpen} />
      </div>
    </div>
  );
}