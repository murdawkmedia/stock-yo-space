# Inventory Tracker Roadmap

## Version 1.0 (Current)
**Status:** Stable / Beta
**Core Tech:** React + Vite + @nostr-dev-kit/ndk
**Focus:** Household Inventory & Sync

### Completed Features
- [x] **Authentication:** Login via NIP-07 (Extension), NIP-46 (Bunker), and Nsec (Private Key).
- [x] **Inventory Management:** Create, Read, Update, Delete (CRUD) items.
- [x] **Encryption:** NIP-44 (XChaCha20-Poly1305) via Shared Key.
- [x] **Sync:** Real-time updates via NDK subscription.
- [x] **Architecture:** Robust `NDKContext` and decoupled hooks.

---

## Active Development (v1.x)

### Features to Polish
- [ ] **NIP-78 (App Settings):** Sync UI preferences (Dark mode, Sort order).
- [ ] **NIP-05 (Verification):** Verified badges.

### New Product Directions (Brainstorm)
- [ ] **"House Manual" / Notes:** A strictly encrypted section for "How to use the remote", "Wifi Password", "Emergency Contacts". Useful for the household, but also sharable.
- [ ] **"Guest Mode" (Sitter View):**
    - A simplified, read-only (or limited write) view.
    - Share a *different* key that only decrypts specific categories (e.g., "Emergency", "Kids Needs", "Food") but hides "Valuables" or "Financial Documents".
    - Ephemeral access (key rotation or time-bound access).

---

## Future Considerations (v2.0+)

### Privacy & Security
- **NIP-59 (Gift Wrap):** "Ghost Mode" visibility.
- **Key Rotation:** For revoking access to guests/sitters.

### Enhancements
- **Consumption Analytics:** "You go through 5 gallons of milk a week."
- **Barcode Scanning:** Speed up entry for pantry items.

---

## Known Bugs / Tech Debt
- **UI:** "Empty State" could be more interactive.
- **Login:** Error handling for cancelled NIP-07 requests.
