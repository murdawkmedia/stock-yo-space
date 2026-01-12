import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useInventory } from '@/hooks/useInventory';
import { CATEGORIES, CATEGORY_LABELS, type Category } from '@/lib/inventoryTypes';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory?: Category;
}

export function AddItemDialog({ open, onOpenChange, initialCategory }: AddItemDialogProps) {
  const { addItem } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(initialCategory || 'pantry');
  const [quantity, setQuantity] = useState('0');
  const [minThreshold, setMinThreshold] = useState('1');
  const [unit, setUnit] = useState('units');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Suggested units by category
  const unitSuggestions: Record<string, string[]> = {
    nursery: ['packs', 'boxes', 'tubes', 'jars', 'bottles'],
    freezer: ['lbs', 'steaks', 'bags', 'containers'],
    fridge: ['gallons', 'cartons', 'packages', 'units'],
    pantry: ['cans', 'boxes', 'bags', 'jars', 'packages'],
    household: ['rolls', 'bottles', 'boxes', 'bags', 'packages']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const itemId = `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      await addItem({
        name,
        category,
        quantity: parseInt(quantity) || 0,
        min_threshold: parseInt(minThreshold) || 1,
        unit,
        on_shopping_list: false,
        priority
      });

      // Reset form
      setName('');
      setQuantity('0');
      setMinThreshold('1');
      setUnit('units');
      setPriority('medium');

      onOpenChange(false);
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-suggest unit based on category
  React.useEffect(() => {
    if (category && unit === 'units' && unitSuggestions[category]) {
      setUnit(unitSuggestions[category][0]);
    }
  }, [category]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add an item to your inventory. Set thresholds to automatically add to your shopping list.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Item Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Size 1 Diapers, Ground Beef"
                required
              />
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="quantity">Current Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* Min Threshold */}
            <div className="grid gap-2">
              <Label htmlFor="threshold">Stock Up When Below</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                required
              />
            </div>

            {/* Unit of Measurement */}
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={(value) => setUnit(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitSuggestions[category]?.map((suggestedUnit) => (
                    <SelectItem key={suggestedUnit} value={suggestedUnit}>
                      {suggestedUnit}
                    </SelectItem>
                  ))}
                  <SelectItem value="units">units</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name}>
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}