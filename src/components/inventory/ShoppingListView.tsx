import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, PackageCheck } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/lib/inventoryTypes';

export function ShoppingListView() {
  const { shoppingListItems, updateShoppingList } = useInventory();
  const [checkedOutItem, setCheckedOutItem] = useState<InventoryItem | null>(null);
  const [purchasedQuantity, setPurchasedQuantity] = useState('');

  const sortedItems = [...shoppingListItems].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.name.localeCompare(b.name);
  });

  const handleCheckItem = (item: InventoryItem) => {
    setCheckedOutItem(item);
    setPurchasedQuantity('');
  };

  const handleConfirmPurchase = async () => {
    if (!checkedOutItem) return;

    let quantity: number;
    if (purchasedQuantity === '') {
      // If no quantity provided, ask user
      const input = prompt(`How many ${checkedOutItem.unit} of "${checkedOutItem.name}" did you buy?`, String(checkedOutItem.min_threshold + 1));
      if (!input) return;
      quantity = parseInt(input);
    } else {
      quantity = parseInt(purchasedQuantity);
    }

    if (isNaN(quantity) || quantity < 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      await updateShoppingList({
        item: checkedOutItem,
        onShoppingList: false,
        purchased: quantity
      });
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setCheckedOutItem(null);
      setPurchasedQuantity('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return '';
    }
  };

  if (sortedItems.length === 0) {
    return (
      <div className="py-12 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Your shopping list is empty</h3>
        <p className="text-muted-foreground mb-4">
          Items will appear here automatically when they run low
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sortedItems.map((item) => (
          <Card
            key={item.id}
            className="p-4 transition-all duration-200 hover:shadow-sm cursor-pointer border-0 bg-card/50"
            onClick={() => handleCheckItem(item)}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={false}
                onCheckedChange={() => handleCheckItem(item)}
                className="h-5 w-5"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <Badge variant="outline" className={cn("text-xs", getPriorityColor(item.priority))}>
                    {item.priority}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Current: {item.quantity} {item.unit}</span>
                  <span>•</span>
                  <span>Need: {item.min_threshold + 1 - item.quantity} more</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!checkedOutItem} onOpenChange={(open) => !open && setCheckedOutItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Off Item</DialogTitle>
            <DialogDescription>
              How many {checkedOutItem?.unit} of "{checkedOutItem?.name}" did you purchase?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              type="number"
              placeholder={`Suggested: ${checkedOutItem ? checkedOutItem.min_threshold + 1 : ''}`}
              value={purchasedQuantity}
              onChange={(e) => setPurchasedQuantity(e.target.value)}
              min="0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmPurchase();
                }
              }}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckedOutItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPurchase}>
              <PackageCheck className="h-4 w-4 mr-2" />
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}