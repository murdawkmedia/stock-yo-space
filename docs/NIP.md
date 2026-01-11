# Baby Stock Inventory (NIP-35871)

## Summary

This NIP defines a custom event kind (35871) for managing household inventory and shopping lists on the Nostr network. It enables real-time synchronization of inventory items across multiple devices for applications like baby supplies tracking, freezer management, and grocery shopping.

## Event Kind

**Kind:** `35871` (addressable event)

## Tags

### Required Tags

- **`d`** (identifier): Unique identifier for the item. Format: `{category}-{normalized-name}` (e.g., `nursery-diapers-size-1`, `freezer-ground-beef`)
- **`name`**: Human-readable item name (e.g., "Size 1 Diapers", "Ground Beef")

### Optional Tags

- **`category`**: Category for grouping items (e.g., "nursery", "freezer", "fridge", "pantry")
- **`quantity`**: Current quantity available (integer). Defaults to 0.
- **`min_threshold`**: Low stock threshold (integer). When quantity ≤ this value, item appears on shopping list. Defaults to 1.
- **`unit`**: Unit of measurement (e.g., "packs", "lbs", "cans", "boxes"). Defaults to "units".
- **`on_shopping_list`**: Boolean flag indicating if item is on shopping list ("true" or "false"). Defaults to "false".
- **`priority`**: Shopping priority ("low", "medium", "high"). Defaults to "medium".

## Event Structure

```json
{
  "kind": 35871,
  "content": "",
  "tags": [
    ["d", "nursery-diapers-size-1"],
    ["name", "Size 1 Diapers"],
    ["category", "nursery"],
    ["quantity", "3"],
    ["min_threshold", "2"],
    ["unit", "packs"],
    ["on_shopping_list", "false"],
    ["priority", "high"]
  ]
}
```

## State Logic

### Item States

1. **In Stock**: `quantity > min_threshold`
2. **Low Stock**: `0 < quantity <= min_threshold`
3. **Out of Stock**: `quantity == 0`
4. **To Buy**: `on_shopping_list == "true"`

### Workflow Triggers

- When user decrements quantity and `quantity <= min_threshold`:
  - Set `on_shopping_list` to "true"
  - Publish updated event
- When item is checked off shopping list:
  - Set `on_shopping_list` to "false"
  - Prompt user to enter quantity purchased
  - Update quantity accordingly

## Query Filters

### Get All Items
```json
[{
  "kinds": [35871],
  "authors": [<user-pubkey>],
  "limit": 100
}]
```

### Get Items by Category
```json
[{
  "kinds": [35871],
  "authors": [<user-pubkey>],
  "#category": ["nursery"],
  "limit": 100
}]
```

### Get Shopping List Items
```json
[{
  "kinds": [35871],
  "authors": [<user-pubkey>],
  "#on_shopping_list": ["true"],
  "limit": 100
}]
```

## Categories

Common categories for organization:
- **nursery**: Baby supplies (diapers, wipes, formula, rash cream)
- **freezer**: Frozen goods (meat cuts, frozen vegetables, ice cream)
- **fridge**: Refrigerated items (milk, cheese, leftovers)
- **pantry**: Dry goods (cereal, pasta, canned goods)
- **household**: Non-food items (paper towels, cleaning supplies)

## User Experience

### Mobile-Optimized Interface

1. **Bottom Navigation**: Easy thumb access on mobile
   - Inventory tab
   - Shopping List tab
   - Settings tab

2. **Quick Actions**:
   - Large + and - buttons for rapid quantity adjustment
   - Swipe actions for common tasks
   - Dark mode for late-night diaper logging

3. **Real-Time Sync**: Changes appear instantly across all logged-in devices via Nostr relays

## Client Implementation

### Adding/Updating Items

1. Generate `d` tag from category and normalized name
2. Validate required tags (`name`, `d`)
3. Publish kind 35871 event with item data
4. Event is automatically synchronized to all connected relays

### Quantity Adjustment

1. Query existing item by `d` tag
2. Calculate new quantity (current + adjustment)
3. Check if `new_quantity <= min_threshold`
4. If true, set `on_shopping_list` to "true"
5. Publish updated event with new quantity

### Shopping List Management

1. Query all items where `on_shopping_list == "true"`
2. Display items with checkboxes
3. On check, prompt for purchased quantity
4. Update quantity and set `on_shopping_list` to "false"
5. Publish updated event

## Notes

- Events are addressable by `d` tag (same `d` value replaces previous event)
- Content field is empty (all data in tags for queryability)
- Unit field allows flexible measurement (packs, lbs, cans, etc.)
- Priority field helps organize shopping list
- Real-time synchronization via Nostr relays enables multi-device coordination