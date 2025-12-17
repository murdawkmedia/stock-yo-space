export interface InventoryItem {
  id: string; // d tag value (e.g., "nursery-diapers-size-1")
  name: string;
  category: string; // nursery, freezer, fridge, pantry
  quantity: number;
  min_threshold: number;
  unit: string; // packs, lbs, cans, etc.
  on_shopping_list: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: number;
  event_id?: string;
  author_pubkey?: string; // pubkey of the item owner (for shared items)
}

export interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
}

export type Category = 'nursery' | 'freezer' | 'fridge' | 'pantry' | 'household';

export const CATEGORIES: Category[] = ['nursery', 'freezer', 'fridge', 'pantry', 'household'];

export const CATEGORY_LABELS: Record<Category, string> = {
  nursery: '👶 Nursery',
  freezer: '🧊 Freezer',
  fridge: '🥶 Fridge',
  pantry: '🥫 Pantry',
  household: '🏠 Household'
};

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  nursery: 'Baby & kids supplies',
  freezer: 'Frozen goods & meat',
  fridge: 'Refrigerated items',
  pantry: 'Dry goods & staples',
  household: 'Household essentials'
};

export interface QuantityUpdate {
  item: InventoryItem;
  newQuantity: number;
  purchased?: number; // for shopping list checkoffs
}

export interface SharedInventory {
  pubkey: string;     // hex pubkey of the person sharing with you
  npub?: string;      // npub format for display
  addedAt: number;    // timestamp when sharing was added
}