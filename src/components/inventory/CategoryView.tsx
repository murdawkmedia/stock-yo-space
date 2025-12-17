import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageOpen } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, type Category } from '@/lib/inventoryTypes';
import { InventoryItemRow } from './InventoryItemRow';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CategoryViewProps {
  category: Category;
}

export function CategoryView({ category }: CategoryViewProps) {
  const { getItemsByCategory } = useInventory();
  const categoryItems = getItemsByCategory(category);

  if (categoryItems.length === 0) return null;

  // Sort by low stock first, then by name
  const sortedItems = [...categoryItems].sort((a, b) => {
    const aLow = a.quantity <= a.min_threshold;
    const bLow = b.quantity <= b.min_threshold;
    if (aLow && !bLow) return -1;
    if (!aLow && bLow) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card className="border-0 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{CATEGORY_LABELS[category]}</CardTitle>
            <CardDescription>{CATEGORY_DESCRIPTIONS[category]}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <InventoryItemRow key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}