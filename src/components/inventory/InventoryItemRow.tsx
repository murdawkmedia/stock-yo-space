import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/lib/inventoryTypes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface InventoryItemRowProps {
  item: InventoryItem;
}

export function InventoryItemRow({ item }: InventoryItemRowProps) {
  const { updateQuantity, deleteItem } = useInventory();
  const [isDecrementing, setIsDecrementing] = useState(false);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [quantityInput, setQuantityInput] = useState(String(item.quantity));

  const isLowStock = item.quantity <= item.min_threshold;
  const isOutOfStock = item.quantity === 0;

  const handleQuickAdd = async (delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);

    if (delta < 0) {
      setIsDecrementing(true);
    } else {
      setIsIncrementing(true);
    }

    try {
      await updateQuantity({
        item,
        newQuantity
      });
      setQuantityInput(String(newQuantity));
    } finally {
      if (delta < 0) {
        setIsDecrementing(false);
      } else {
        setIsIncrementing(false);
      }
    }
  };

  const handleQuantityInputChange = async (value: string) => {
    setQuantityInput(value);

    if (value === '') return;

    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 0) return;

    try {
      await updateQuantity({
        item,
        newQuantity
      });
    } catch (error) {
      // Revert on error
      setQuantityInput(String(item.quantity));
    }
  };

  const handleDelete = async () => {
    await deleteItem(item.id);
  };

  const stockStatusBadge = () => {
    if (item.on_shopping_list) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">To Buy</Badge>;
    } else if (isOutOfStock) {
      return <Badge variant="destructive">Out</Badge>;
    } else if (isLowStock) {
      return <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Low</Badge>;
    } else {
      return <Badge variant="outline">In Stock</Badge>;
    }
  };

  return (
    <Card className={cn(
      "p-3 transition-all duration-200 hover:shadow-sm border-0 bg-card/50",
      isLowStock && "border-l-2 border-l-yellow-400 bg-yellow-50/30",
      isOutOfStock && "border-l-2 border-l-destructive/50 bg-destructive/10"
    )}>
      <div className="flex items-center justify-between gap-3">
        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{item.name}</h3>
            {stockStatusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">
            Stock up at: {item.min_threshold} {item.unit} • Priority: {item.priority}
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAdd(-1)}
              disabled={isDecrementing || isIncrementing || item.quantity === 0}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>

            <div className="min-w-[60px] text-center">
              <Input
                type="number"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                onBlur={(e) => handleQuantityInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuantityInputChange(e.currentTarget.value);
                  }
                }}
                className="h-8 text-center px-2"
                min="0"
                disabled={isDecrementing || isIncrementing}
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAdd(1)}
              disabled={isDecrementing || isIncrementing}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <span className="text-sm text-muted-foreground min-w-[40px] text-right">
            {item.unit}
          </span>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{item.name}" from your inventory?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}