# CatalogOS — Catalog of Catalogs

A fully static Next.js app for digital business catalogs with WhatsApp ordering.

## Features

- 🏪 Multi-business catalog
- 🌍 Bilingual (ES/EN)
- 🛒 Per-business cart with localStorage persistence
- 🔗 Shareable cart URLs (`/view/[slug]?c=1x2,3x1`)
- 💬 WhatsApp ordering
- 💛 Donation QR support
- ⚙️ Admin panel (hidden at `/admin`)
- 📤 Export ZIP with all data
- 📥 Import businesses.json
- 🔍 SEO: generateStaticParams + generateMetadata

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build & Export (static site)

```bash
npm run build
# Output in /out directory — ready to deploy to any static host
```

## Project Structure

```
/app
  page.tsx              # Home: business list
  /business/[slug]/     # Business catalog page
  /view/[slug]/         # Shared cart view
  /admin/               # Hidden admin panel

/components
  /business/            # BusinessCard
  /product/             # ProductCard, CategoryFilter
  /cart/                # CartSheet, CartButton
  /ui/                  # LangToggle, Button, Badge

/data
  businesses.json       # All businesses
  /business/*.json      # Business details
  /products/*.json      # Products per business

/hooks
  useCart.ts            # Cart state + localStorage
  useLang.ts            # Language state

/lib
  data.ts               # Data loaders + indexes
  cart.ts               # Cart CRUD

/types
  index.ts              # All TypeScript types
```

## Adding a New Business

1. Add entry to `data/businesses.json`
2. Create `data/business/[slug].json`
3. Create `data/products/[slug].json`

## Cart URL Format

```
/view/burger-house?c=1x2,3x1,5x4
```
`productId x quantity` pairs, comma-separated.

## Shareable Cart

In the cart sheet, click "Share" to copy the URL. Anyone opening it sees the same cart reconstructed from the URL.

## WhatsApp Ordering

The cart generates a WhatsApp link using:
```
https://wa.me/PHONE?text=ENCODED_MESSAGE
```
Message includes item list, totals, and the shareable cart URL.

## Admin Panel

Visit `/admin` to:
- View/hide/delete businesses
- Manage products per business
- Import `businesses.json`
- Export a ZIP with all JSON data

## Deployment

Since `output: 'export'` is set in `next.config.js`, run:
```bash
npm run build
```
Then deploy the `/out` folder to Netlify, Vercel, GitHub Pages, etc.
