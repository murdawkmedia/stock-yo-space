import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingCart, Package, TrendingDown } from 'lucide-react';

import { useInventory } from '@/hooks/useInventory';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from '@/lib/inventoryTypes';
import { CategoryView } from '@/components/inventory/CategoryView';
import { ShoppingListView } from '@/components/inventory/ShoppingListView';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { QuickStats } from '@/components/inventory/QuickStats';

export function Inventory() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Baby Stock</h1>
          <p className="text-muted-foreground">
            Track inventory, manage shopping lists, and never run out again
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

                <Button onClick={() => setAddDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
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
      </div>
    </div>
  );
}