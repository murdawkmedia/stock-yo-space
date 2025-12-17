# Stock Your Space - Complete Household Inventory Tracker

A modern, privacy-first inventory management system for tracking everything in your home - from pantry staples and baby supplies to freezer inventory and household essentials, with real-time synchronization across all devices.

## 🌟 What is Stock Your Space?

Stock Your Space is the ultimate household inventory tracker designed for modern families who want to:
- **Never run out** of essentials again
- **Track everything** from diapers to dinner ingredients in one place
- **Automate shopping lists** that update in real-time across all devices
- **Scale to any need** - today's diapers, tomorrow's furniture and automotive parts

### Why It's Different

Unlike manual shopping lists or single-purpose apps, Stock Your Space:
- **Automatically adds** items to your shopping list when running low
- **Syncs instantly** across all devices (your partner's changes appear in real-time)
- **Scales infinitely** - start with baby supplies, grow to full household assets
- **Private by design** - your data lives on decentralized Nostr relays, not our servers

## 🎯 Key Features

### 🏠 Complete Home Coverage

**Kitchen & Pantry**
- Spices, oils, condiments, sauces
- Cereal, pasta, rice, canned goods
- Coffee, tea, beverages

**Nursery & Kids**
- Diapers, wipes, formula, baby food
- Rash cream, baby care items
- Toys, school supplies, kids essentials

**Freezer & Fridge**
- Meat cuts (steaks, ground beef, roasts)
- Frozen vegetables, ice cream
- Dairy, cheese, leftovers

**Household Essentials**
- Paper towels, toilet paper
- Cleaning supplies, laundry detergent
- Pet food, medicine cabinet items

**Future-Ready Expansion**
- Furniture assets & room inventory
- Automotive parts & tools
- Garage & storage organization

### 🧊 Smart Category Management

- **Flexible organization** - by room, type, or custom categories
- **Unique attributes** - lbs for meat, packs for diapers, rolls for paper towels
- **Visual hierarchy** - badges, colors, and priority indicators
- **Infinite scaling** - add new categories as your needs grow

### 🛒 The Grocery Run (Shopping List)

**Automated Magic**
- Items automatically added when running low
- Real-time sync across all devices
- Priority sorting (High → Medium → Low)

**One-Tap Shopping**
- Simple checkboxes for quick check-off
- Confirms purchased quantity automatically
- Removes from list and updates inventory

### ⚡ Real-Time Synchronization

Powered by **Nostr protocol**:
- Changes appear **instantly** on all devices
- Wife checks off eggs in Aisle 4 → your phone updates in Aisle 2
- Decentralized and secure by design
- No central server required

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, TailwindCSS 3.4+, shadcn/ui
- **Backend**: Nostr protocol (decentralized)
- **Real-time Sync**: Nostr relays
- **Build Tool**: Vite 6.x
- **Type System**: TypeScript 5.x

### Custom Nostr Protocol (NIP-35871)

The app uses a custom addressable event kind (35871) to store inventory items:

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

Complete protocol documentation available in [NIP.md](./NIP.md).

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
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

### Production Build

```bash
npm run build
```

### Deployment Options

- **Cloudflare Pages** (recommended): `npm run deploy`
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir=dist`
- **GitHub Pages**: Push `dist/` to gh-pages branch

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📱 User Experience

### Mobile-Optimized Design

- **Thumb-friendly** large buttons and quick actions
- **Responsive layout** optimized for phones, tablets, and desktop
- **Touch gestures** for fast inventory adjustments
- **Dark mode** for low-light environments

### Progressive Disclosure

The interface shows only what you need, when you need it:
- **Inventory view** for daily tracking
- **Shopping list** when at the store
- **Quick stats** for overview

### Smart Categories

- 🥫 **Pantry** - Dry goods and staples
- 🧊 **Freezer** - Frozen goods and meat cuts
- 🥶 **Fridge** - Refrigerated items
- 👶 **Nursery** - Baby and kids supplies
- 🏠 **Household** - Non-food essentials

## 🎨 Design Philosophy

### Inspired by Modern Design Systems

Stock Your Space follows the same design principles as:
- **Stripe** - Clean, professional, and accessible
- **Apple** - Minimalist, user-focused, and elegant
- **Linear** - Fast, keyboard-friendly, and powerful

### Key Design Elements

- **Gradients** - Modern color transitions with depth
- **Cards** - Clean information hierarchy
- **Shadows** - Subtle depth and visual separation
- **Icons** - Clear visual communication
- **Typography** - Readable at all sizes
- **Spacing** - Consistent 8px grid system

### Accessibility Features

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatible
- High contrast color options
- Reduced motion preferences

## 🔧 Development

### Project Structure

```
src/
├── components/
│   ├── inventory/
│   │   ├── CategoryView.tsx      # Category-organized items
│   │   ├── InventoryItemRow.tsx  # Individual item with controls
│   │   ├── ShoppingListView.tsx  # Auto-generated shopping list
│   │   ├── QuickStats.tsx        # Dashboard statistics
│   │   └── AddItemDialog.tsx     # New item form
│   ├── auth/                     # Authentication components
│   ├── dm/                       # Direct messaging (future)
│   ├── ui/                       # shadcn/ui components (48+ components)
│   └── ...
├── hooks/
│   ├── useInventory.ts           # Inventory management logic
│   ├── useNostr.ts               # Nostr protocol integration
│   ├── useCurrentUser.ts         # Authentication
│   └── ...
├── lib/
│   ├── inventoryTypes.ts         # TypeScript types
│   ├── utils.ts                  # Utility functions
│   └── ...
├── pages/
│   ├── Index.tsx                 # Landing page
│   ├── Inventory.tsx             # Main inventory view
│   ├── NIP19Page.tsx             # Nostr URI handling
│   └── NotFound.tsx              # 404 page
├── contexts/
│   └── AppContext.ts             # Global app state
└── App.tsx                        # Main app component
```

### Key Components

#### `useInventory()` Hook

Centralized inventory management with:
- Query items from Nostr relays
- Add/update/delete items with optimistic updates
- Automatic shopping list logic
- Real-time synchronization
- Error handling and toast notifications

#### `InventoryItemRow`

Individual item display with:
- Quantity controls (+ and - buttons)
- Direct quantity input
- Color-coded stock status
- Delete with confirmation
- Mobile-optimized touch targets

#### `ShoppingListView`

Intelligent shopping list with:
- Auto-population from low-stock items
- Priority-based sorting
- Check-off with quantity confirmation
- Real-time updates
- Empty state guidance

### State Logic

Every item has four possible states:

1. **In Stock**: `quantity > min_threshold`
2. **Low Stock**: `0 < quantity <= min_threshold`
3. **Out of Stock**: `quantity == 0`
4. **To Buy**: `on_shopping_list == "true"`

### Workflow Automation

```typescript
// Automatic shopping list trigger
if (newQuantity <= item.min_threshold) {
  setOnShoppingList(true);
  showToast('Added to shopping list');
}
```

### Nostr Integration

Using custom addressable events (kind 35871):
- **Addressable by d-tag** - Replaceable events ensure latest state
- **All data in tags** - Queryable at relay level
- **Real-time updates** - Subscribe to changes instantly
- **Multi-device sync** - All logged-in devices receive updates

## 🔐 Security & Privacy

### Privacy-First Approach

- **No central server** - Your data lives on Nostr relays you choose
- **End-to-end encryption** - Private by design, controlled by your keys
- **Your keys, your data** - Only you can access your inventory
- **Decentralized** - No single point of failure or censorship

### Data Ownership

- Users control their keys (nsec, npub, bunker)
- Inventory stored as Nostr events
- No account required - login with Nostr identity
- Auditable - open source client and protocol

### Security Features

- NIP-07 extension support
- NIP-46 bunker support
- WebLN integration for Lightning payments
- Server-side event validation
- Automatic backup via relays

## 📊 Use Cases

### For Busy Parents

- Track diaper sizes and quantities automatically
- Monitor formula and baby food supplies
- Never forget rash cream or wipes again
- Sync shopping list with partner instantly

### For Meal Planners

- Track freezer inventory (quarter cow cuts)
- Monitor refrigerator contents and leftovers
- Pantry stock management for ingredients
- Automatic grocery list generation

### For Household Management

- Paper towels, cleaning supplies tracking
- Pet food and pet care items
- Spices and pantry staples inventory
- Medicine cabinet organization

### For Future Needs

- **Furniture assets** - Catalog by room, condition, value
- **Automotive parts** - Track oil, filters, maintenance items
- **Tool inventory** - Organize by type, location, use frequency
- **Clothing management** - Seasonal items, sizes, rotations

## 🚦 Real-World Workflow

### Example: Diaper Replenishment

1. **Start**: 5 packs of Size 1 diapers (min threshold: 2)
2. **Daily use**: Tap - button as you open packs
3. **Alert trigger**: Quantity drops to 2 (≤ min threshold)
4. **Auto-add**: "Size 1 Diapers" added to shopping list
5. **At store**: Partner sees item on list
6. **Check-off**: Partner checks item, enters "6 packs purchased"
7. **Restock**: App updates inventory to 6, removes from shopping list
8. **Real-time sync**: Your device shows updated inventory instantly

### Example: Freezer Management

1. **Quarter cow delivery**: Add "Ground Beef - 12 lbs", "Ribeye - 4 steaks"
2. **Meal prep**: Use - button when you cook with items
3. **Smart alerts**: Ground Beef hits 3 lbs (threshold: 4 lbs)
4. **Grocery list**: Automatically adds "Ground Beef" with priority "High"
5. **Check-off**: Buy ground beef, app updates inventory
6. **Planning**: View freezer contents before shopping

## 🔄 Real-Time Sync Details

### Powered by Nostr Relays

When you update an item:

1. **Sign event** - Your Nostr identity signs the update
2. **Publish to relays** - Broadcast to all configured relays
3. **Relay validates** - Relays check event signature and schema
4. **Subscriptions notify** - All connected devices receive update
5. **UI updates** - Interface reflects changes instantly

### Conflict Resolution

- **Addressable events** - Same d-tag replaces previous version
- **Last write wins** - Latest timestamp determines current state
- **Offline support** - Changes queue when offline, sync when connected

## 🤝 Contributing

Contributions welcome! Areas to contribute:

### Feature Requests
- New category types (furniture, automotive, clothing)
- Additional units of measurement
- Barcode scanner integration
- Recipe integration with ingredients
- Multi-language support

### Design Improvements
- Dark mode optimizations
- Mobile PWA features
- Custom themes and branding
- Animation and micro-interactions
- Accessibility enhancements

### Technical Improvements
- Export/import functionality
- Backup and restore
- Performance optimizations
- Test coverage
- Documentation

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

Built with love using:

- **[Nostr Protocol](https://nostr.com/)** - Decentralized real-time communication
- **[React](https://reactjs.org/)** - Modern UI framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible, unstyled components
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[MKStack Template](https://gitlab.com/soapbox-pub/mkstack)** - Nostr client foundation

### Design Inspiration

- **[Stripe](https://stripe.com/)** - Clean, professional design language
- **[Linear](https://linear.app/)** - Fast, keyboard-first experience
- **[Kits by Envato](https://kits.rometheme.net/)** - Modern card layouts and gradients

## 🔮 Roadmap

### Short-Term (v1.x)
- ✅ Core inventory tracking
- ✅ Real-time shopping list
- ✅ Category management
- ✅ Mobile optimization
- 🔄 Dark mode improvements
- 🔄 PWA app installation
- 🔄 Export/import data

### Medium-Term (v2.x)
- 📅 Recipe integration
- 📅 Barcode scanner
- 📅 Photo storage
- 📅 Multi-language support
- 📅 Family sharing
- 📅 Price tracking

### Long-Term (v3.x)
- ⏳ Furniture asset tracking
- ⏳ Automotive parts catalog
- ⏳ Tool and equipment management
- ⏳ Clothing and wardrobe organization
- ⏳ AI-powered shopping suggestions
- ⏳ Integration with smart home systems

## 📞 Support & Community

### Documentation

- **[README.md](./README.md)** - You are here!
- **[NIP.md](./NIP.md)** - Custom Nostr protocol specification
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide

### Getting Help

- **Questions**: Open an issue on the project repository
- **Bug Reports**: Include steps to reproduce, expected vs actual behavior
- **Feature Requests**: Describe use case and value proposition
- **Nostr**: Connect via your favorite Nostr client

### Stay Updated

- Watch the repository for releases and updates
- Follow on Nostr for announcements and tips
- Check documentation for breaking changes

## ⚡ Quick Links

- [Getting Started](#getting-started)
- [Demo](https://stock-your-space.murdawkmedia.workers.dev) (Coming Soon)
- [Changelog](./CHANGELOG.md) (Coming Soon)
- [Contributing Guide](./CONTRIBUTING.md) (Coming Soon)

---

**Made with ❤️ for organized homes everywhere.**

*Stock Your Space. Know what you have. Know what you need. Keep your home perfectly stocked.* 🏠✨

**Edit with Shakespeare**: [![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2Fmurdawkmedia%2Finventory-tracker.git)