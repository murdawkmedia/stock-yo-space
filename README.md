# Baby Stock - Smart Inventory & Shopping List

A modern, privacy-first inventory tracking application built for busy parents who need to manage baby supplies, freezer inventory, and shopping lists with real-time synchronization across all devices.

## 🎯 The Problem

Managing household inventory is hard, especially when you have:
- Multiple diaper sizes (Size 1, Size 2, etc.)
- A quarter cow in the freezer (Ribeye, Ground Beef, Roasts)
- Formula, baby food, rash cream
- A partner who needs to know what to buy

Traditional solutions require manual entry or don't sync in real-time. Baby Stock solves this with **automatic inventory tracking** and **instant multi-device synchronization**.

## ✨ Key Features

### 🧸 The Baby Station (Nursery)
- **Quick-tap counters** for diapers, wipes, formula, rash cream
- Track multiple diaper sizes separately
- Large + and - buttons for fast logging
- Automatic shopping list alerts when running low

### 🧊 The Deep Freeze (Freezer Management)
- List individual cuts (Ribeye, Ground Beef, Roasts)
- Digital freezer inventory sorted by cut type
- Track quantities with appropriate units (lbs, steaks, bags)

### 🛒 The Grocery Run (Shopping List)
- **Automatically populated** when items run low
- Real-time sync across all devices (wife checks eggs in Aisle 4, they disappear from your phone in Aisle 2)
- Simple checkboxes for easy check-off
- Priority-based sorting (High → Medium → Low)

### ⚡ Real-Time Synchronization
- Powered by **Nostr protocol** for instant updates
- Decentralized and secure
- No central server required
- Works offline and syncs when back online

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TailwindCSS, shadcn/ui
- **Backend**: Nostr protocol (decentralized)
- **Real-time Sync**: Nostr relays
- **Build Tool**: Vite

### Data Model (NIP-35871)
Custom Nostr event kind for inventory items:

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

See `NIP.md` for complete protocol documentation.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Nostr login method (NIP-07 extension, nsec, or bunker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd baby-stock
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## 📱 Mobile-Optimized Interface

Designed for thumb-friendly mobile use:

- **Bottom navigation** (easy reach with thumb)
- **Quick actions** (swipe, tap, large buttons)
- **Dark mode** (for late-night diaper logging)
- **Progressive disclosure** (shows only what you need)

## 🎨 User Experience

### Main Views

1. **Inventory View**
   - Items organized by category
   - Color-coded by stock status (In Stock, Low, Out)
   - Quick + and - buttons for quantity adjustment
   - Shows category and priority

2. **Shopping List View**
   - Aggregated from low-stock items
   - Checkboxes for quick check-off
   - Shows how much more you need to buy
   - Priority sorting for efficient shopping

3. **Quick Stats**
   - Total items
   - Low stock items
   - Items to buy

### State Logic

Every item has a state:

- **In Stock**: `quantity > min_threshold`
- **Low Stock**: `0 < quantity <= min_threshold`
- **Out of Stock**: `quantity == 0`
- **To Buy**: `on_shopping_list == "true"`

### Workflow

1. **Use an item** → Tap minus button
2. **Opened a new box** → Tap plus button  
3. **Running low** → Automatically added to shopping list
4. **At the store** → Check off items as you shop
5. **Partner sees updates** → Real-time sync

## 🔧 Development

### Project Structure

```
src/
├── components/
│   ├── inventory/
│   │   ├── CategoryView.tsx      # Items organized by category
│   │   ├── InventoryItemRow.tsx  # Individual item with controls
│   │   ├── ShoppingListView.tsx  # Shopping list UI
│   │   ├── QuickStats.tsx        # Dashboard stats
│   │   └── AddItemDialog.tsx     # Add new item form
│   └── ui/                       # shadcn/ui components
├── hooks/
│   └── useInventory.ts           # Inventory management logic
├── lib/
│   ├── inventoryTypes.ts         # TypeScript types
│   └── utils.ts                  # Utility functions
├── pages/
│   ├── Index.tsx                 # Landing page
│   └── Inventory.tsx             # Main inventory view
└── AppRouter.tsx                 # Routing configuration
```

### Key Components

#### `useInventory()` Hook
Manages all inventory operations:
- Query items from Nostr relays
- Add/update/delete items
- Update quantities with automatic shopping list
- Real-time sync across devices

#### `InventoryItemRow`
Displays individual items with:
- Quantity controls (+ and - buttons)
- Direct quantity input
- Delete button with confirmation
- Color-coded stock status badges

#### `ShoppingListView`
Automatically populated shopping list:
- Items from low stock inventory
- Priority sorting (High → Medium → Low)
- Check-off with quantity confirmation
- Real-time updates

## 🔐 Security & Privacy

- **No central server**: Your data lives on Nostr relays, not our servers
- **End-to-end encrypted**: Private by design
- **Your keys, your data**: Only you can access your inventory
- **Decentralized**: No single point of failure

## 🎯 Use Cases

### For Parents
- Track diaper sizes and quantities
- Monitor formula and baby food
- Never forget rash cream again
- Sync with partner's device

### For Meal Planners
- Track freezer inventory (quarter cow cuts)
- Monitor refrigerator contents
- Pantry stock management
- Automatic shopping list generation

### For Households
- Paper towels, cleaning supplies
- Pet food and supplies
- Spices and pantry staples
- Medicine cabinet items

## 🚦 State Flow

### Example: Diaper Consumption

1. **Start**: 5 packs of Size 1 diapers (min threshold: 2)
2. **Use 3 packs**: Tap minus button 3 times
3. **Alert Trigger**: 2 packs left (≤ min threshold)
4. **Auto-Add**: "Size 1 Diapers" added to shopping list
5. **Store**: Check off in app
6. **Reset**: Confirm purchased quantity (e.g., 6 new packs)
7. **Status**: Removed from shopping list, back to in-stock

## 🔄 Real-Time Sync

Powered by Nostr relays:
- Changes appear **instantly** on all devices
- Works offline, syncs when online
- Conflict resolution via addressable events
- Replaceable events ensure only latest state

## 📊 Categories

1. **Nursery** 🧸 - Baby supplies (diapers, wipes, formula)
2. **Freezer** 🧊 - Frozen goods (meat, vegetables)
3. **Fridge** 🥶 - Refrigerated items (milk, cheese)
4. **Pantry** 🥫 - Dry goods (cereal, pasta)
5. **Household** 🏠 - Non-food items (paper towels)

## 🎬 Quick Start Guide

### For New Users

1. **Login or Sign Up**
   - Use NIP-07 extension or create account
   - Login with your Nostr credentials

2. **Add Your First Item**
   - Click "Add Item" button
   - Enter item details (name, quantity, threshold)
   - Choose category (Nursery, Freezer, etc.)

3. **Start Tracking**
   - Use + and - buttons when you use or restock
   - App automatically adds items to shopping list

4. **Shop Smarter**
   - Check shopping list when at store
   - Check off items as you buy them
   - App tracks what you still need

### For Early Adopters

This is a production-ready application built with:
- TypeScript for type safety
- React Testing Library for testing
- TailwindCSS for consistent styling
- shadcn/ui for accessible components
- Nostr for decentralized sync

## 🤝 Contributing

Contributions welcome! Areas to contribute:
- New category suggestions
- Additional units of measurement
- Dark mode improvements
- Mobile PWA features
- Export/import functionality

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

Built with:
- [Nostr Protocol](https://nostr.com/) for real-time sync
- [React](https://reactjs.org/) for the UI
- [shadcn/ui](https://ui.shadcn.com/) for accessible components
- [TailwindCSS](https://tailwindcss.com/) for styling
- [MKStack Template](https://gitlab.com/soapbox-pub/mkstack) for the foundation

## 🔮 Future Features

- [ ] Recipe integration with ingredient inventory
- [ ] Barcode scanner for easy item addition
- [ ] Photo storage for item identification
- [ ] Share list with non-Nostr users
- [ ] Price tracking and comparison
- [ ] Meal planning based on inventory
- [ ] Expiration date tracking
- [ ] Location tracking (which freezer/room)

## 📞 Support

For questions, issues, or feature requests:
- Open an issue
- Contact on Nostr

---

**Made with ❤️ for busy parents who need one less thing to worry about.**

*Never run out of diapers again.* 🚼