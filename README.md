# ZamSolar — Cloudflare Pages Production Deployment Guide

High-performance, conversion-optimized solar sizing engine and verified Tier-1 hardware portal for **Zambezi Amigo Solar Energies Ltd.** (Woodlands, Lusaka, Zambia).

---

## ⚡ Cloudflare Pages Deployment Configuration

### 1. Dashboard Settings (Git Integration)
When connecting your GitHub/GitLab repository to **Cloudflare Pages**, configure the following build settings in the project wizard:

| Setting | Value |
| :--- | :--- |
| **Framework preset** | `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (leave blank) |

### 2. Environment Variables
Cloudflare Pages uses modern Node.js runtimes. To ensure 100% build compatibility with Vite 8 + React 19:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `NODE_VERSION` | `22.14.0` | Enforces LTS Node 22 on Cloudflare build runners |

*(Note: `.node-version` and `.nvmrc` files are already present in the root repository and will be automatically detected by Cloudflare Pages Build System v2).*

---

## 🚀 Direct Deployment via Wrangler CLI

You can also deploy instantly to Cloudflare Pages from your terminal without connecting Git:

```bash
# 1. Install dependencies
npm ci

# 2. Build the production bundle
npm run build

# 3. Deploy directly to Cloudflare Pages
npm run deploy
```

---

## 🛡️ Architecture & Production Priming

This repository was specifically architected to avoid common pitfalls on Cloudflare Pages:

1. **Pinned Node.js Version (`.node-version`, `.nvmrc`, `package.json:engines`)**:
   - Cloudflare Pages defaults to older Node.js runtimes if unspecified, which breaks modern Vite 8 / React 19 builds.
   - Pinned to `22.14.0` across all config surfaces for deterministic builds.

2. **Airtight HTTP Headers (`public/_headers`)**:
   - Implements strict security policies: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and calibrated `Content-Security-Policy`.
   - Optimized cache headers: `public, max-age=31536000, immutable` for hashed `/assets/*`, long-term caching for `/images/*`, and `must-revalidate` on HTML to guarantee zero stale cache during deployments.

3. **No Infinite Redirect Loops**:
   - Avoids conventional `/* /index.html 200` rewrite rules that cause canonicalization loop warnings in Cloudflare's asset engine.
   - Automatically generates a companion `404.html` SPA fallback directly via Vite plugin during bundle closure.

4. **Authentic Assets & SEO Priming**:
   - All social media and equipment images from ZamSolar's Facebook are stored locally in `/images/` with immutable edge caching.
   - Comprehensive Open Graph, Twitter card, Canonical URL, `robots.txt`, and `sitemap.xml` files included.

---

## 🧪 Local Preview & Emulation

```bash
# Preview via standard Vite preview
npm run preview

# Emulate full Cloudflare Pages edge runtime (headers, caching, and asset serving)
npx wrangler pages dev dist --port 8788
```
