# Deployment Guide for Baby Stock

This guide covers how to deploy the Baby Stock application to various platforms.

## 📦 Prerequisites

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Verify build output**:
   ```bash
   ls dist/
   # Should contain: index.html, main-*.js, main-*.css, etc.
   ```

## 🚀 Deployment Options

### Option 1: Cloudflare Pages (Recommended)

1. **Install Wrangler CLI**:
   ```bash
   npm install -g @cloudflare/wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

   Or manually:
   ```bash
   wrangler pages deploy dist/ --project-name=baby-stock
   ```

### Option 2: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option 3: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Option 4: GitHub Pages

1. Add to `vite.config.ts`:
   ```typescript
   export default {
     base: '/baby-stock/',
     // ...other config
   }
   ```

2. Build and deploy:
   ```bash
   npm run build
   # Push dist/ folder to gh-pages branch
   ```

### Option 5: IPFS (Decentralized)

1. **Install IPFS Desktop** or use **Pinata**:
   ```bash
   # Using IPFS Desktop
   ipfs add -r dist/
   ```

2. **Pin to IPFS**:
   ```bash
   # Your site is now available at:
   # https://ipfs.io/ipfs/<CID>/
   ```

## 🔧 Configuration

### Environment Variables

The project uses Nostr relays by default:
```typescript
// Default relays in App.tsx
relays: [
  'wss://relay.ditto.pub',
  'wss://relay.nostr.band',
  'wss://relay.damus.io',
]
```

### Custom Relays

Users can add their own relays through the settings interface once logged in.

## 📱 PWA Installation

The app is a Progressive Web App (PWA):

1. **Install on mobile**:
   - Visit the deployed URL
   - Add to home screen or install from browser menu

2. **Offline functionality**:
   - Basic functionality works offline
   - Syncs when connection restored

## 🔍 SEO & Meta Tags

The app includes SEO meta tags via `@unhead/react`:

```typescript
useSeoMeta({
  title: 'Baby Stock',
  description: 'Smart inventory tracking for busy parents',
});
```

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Issues

1. **Check `_redirects` file** in public/
2. **Verify base path** in vite.config.ts
3. **Check build logs** for TypeScript errors

### Nostr Issues

If users can't connect:
1. Check relay status: https://nostr.info/relays
2. Try different relays
3. Ensure browser supports WebSocket

## 📊 Monitoring

### Success Metrics
- First item added within 1 minute
- Shopping list used at least once
- User returns within 3 days

### User Feedback
- "Added to shopping list" toasts indicate automation working
- Real-time sync test: check item on two devices

## 🔄 Updates

When updating the app:
1. Increment version in package.json
2. Update changelog
3. Redeploy
4. Users get new version automatically

## 🛡️ Security Notes

- No API keys required
- Uses client-side Nostr (no backend)
- User data lives on Nostr relays
- HTTPS for browser crypto APIs

## 📝 Deployment Checklist

- [ ] Build succeeds without errors
- [ ] Test on mobile device
- [ ] Test on desktop
- [ ] Verify PWA installation
- [ ] Test real-time sync
- [ ] Check offline functionality
- [ ] Verify redirects work
- [ ] Test error boundaries
- [ ] Update README with live URL
- [ ] Share on Nostr channels

## 🎯 Quick Deploy Commands

### Cloudflare (Recommended)
```bash
npm run build && npm run deploy
```

### Manual Cloudflare
```bash
npm run build && cd dist && zip -r ../baby-stock.zip . && cd ..
# Upload baby-stock.zip to Cloudflare dashboard
```

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

---

**Your Baby Stock app is now ready for deployment!** 🚀