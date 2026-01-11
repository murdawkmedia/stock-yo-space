# Stock Your Space - Decentralized Inventory Tracker

**A private-first, offline-capable inventory management system powered by the Nostr protocol.**

Track everything in your home—from pantry staples to household assets—with real-time synchronization across devices, fully controlled by **your** keys. No central server. No data mining. Just you and your inventory.

---

## 🌟 The Nostr Ethos
This application is built on the principles of **sovereignty** and **decentralization**:
- **Your Keys, Your Data**: Login with your Nostr `nsec` (private key) or extension (NIP-07). Your inventory is signed by you and belongs to you forever.
- **Unstoppable**: Data is stored on decentralized relays (like Damus, Primal, etc.). There is no central database to go down or be sold.
- **Privacy First**: Sensitive data can be encrypted. Only you (and those you explicitly share with) can decrypt it.

## 🚀 Key Features

### 🏠 Complete Home Management
- **Smart Tracking**: Manage pantry, freezer, nursery, and garage items.
- **Auto-Shopping List**: Items automatically jump to your shopping list when stock gets low.
- **History & Analytics**: See consumption trends over time.

### ⚡ Real-Time Sync & Sharing
- **Multi-Device**: Update your fridge stock on your phone, see it change instantly on your tablet.
- **Family Sharing**: securely share your inventory with a spouse or roommate using their Nostr Public Key (`npub`). They get real-time access without sharing your private key.
- **Offline Capable**: Works without internet. Changes sync automatically when you reconnect.

### 🛡️ Robust Architecture
- **Single Page Application (SPA)**: Runs entirely in your browser.
- **Relay Management**: Connect to multiple relays for redundancy.
- **Encryption**: Optional encryption for private items using NIP-44/NIP-04 standards.

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS, shadcn/ui
- **Protocol**: [Nostr](https://nostr.com/) (NDK)
- **State Management**: TanStack Query + Zustand
- **Storage**: IndexedDB (Local Cache) + Nostr Relays (Cloud)

## 📦 Installation & Development

### Prerequisites
- Node.js 18+
- A Nostr identity (optional, can generate one in-app)

### Quick Start
1.  **Clone the repo**
    ```bash
    git clone https://github.com/murdawkmedia/inventory-tracker.git
    cd inventory-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run locally**
    ```bash
    npm run dev
    ```
    Open `http://localhost:8080` to see the app.

### Testing
Run the integration tests (powered by Vitest):
```bash
npm test
```

## 🚢 Deployment

### Cloudflare Pages (Recommended)
This app is designed to run perfectly on Cloudflare Pages.

1.  Fork this repository.
2.  Log in to Cloudflare Dashboard > **Pages**.
3.  Connect your GitHub account and select this repo.
4.  **Build Settings**:
    - **Framework**: Vite
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
5.  Deploy!

*Note: The build script automatically handles client-side routing configuration for Cloudflare.*

---

## 🤝 Contributing
Open source is in our DNA. Issues and Pull Requests are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.