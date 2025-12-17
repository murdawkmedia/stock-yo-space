import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ShoppingCart, TrendingDown } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';

export function QuickStats() {
  const { items, shoppingListItems, lowStockItems } = useInventory();

  const totalItems = items.length;
  const outOfStockCount = items.filter(item => item.quantity === 0).length;
  const lowStockCount = lowStockItems.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalItems}</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <TrendingDown className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{lowStockCount}</p>
            <p className="text-sm text-muted-foreground">Low Stock</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{shoppingListItems.length}</p>
            <p className="text-sm text-muted-foreground">To Buy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}