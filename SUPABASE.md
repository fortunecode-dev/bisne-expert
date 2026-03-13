# Supabase Migration Guide

## Overview

This app now uses **Supabase Storage** as the primary storage backend, replacing Vercel Blob. Local filesystem is still used in development when Supabase env vars are not set.

---

## Architecture

```
Storage buckets (Supabase):
  data/           ← JSON data files (private bucket, service role only)
    businesses.json
    business/{slug}.json
    products/{slug}.json
    config.json
    reports.json

  uploads/        ← Image files (public bucket, CDN-served)
    {timestamp}-{name}.{ext}

Caching (Next.js Data Cache):
  GET /api/data   → 7-day cache, tagged by resource type
  Server pages    → direct driver reads, wrapped in unstable_cache()
  Mutations       → revalidateTag() called after every successful write
```

---

## Environment Variables

### Required (production)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...   # from Supabase dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### Still required

```env
ADMIN_PASSWORD=your-admin-password
BIZ_SALT=your-custom-salt-2025        # optional, defaults to 'catalogos-salt-2025'
```

### Remove (no longer needed)

```env
# Delete this from Vercel env vars:
BLOB_READ_WRITE_TOKEN=...
```

---

## First-Time Setup

### 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **service_role** key (Settings → API)

### 2. Create storage buckets

**Option A — Automatic (via migration script):**
The script creates buckets automatically.

**Option B — Manual:**
Go to Supabase dashboard → Storage → New bucket:
- Name: `data`, Public: **OFF**
- Name: `uploads`, Public: **ON**

**Option C — SQL:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('data', 'data', false), ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;
```

### 3. Migrate existing data

If you have data in local `data/` and `public/uploads/`:

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
tsx scripts/migrate-to-supabase.ts
```

This will:
- Upload all JSON files to the `data` bucket
- Upload all images to the `uploads` bucket
- Rewrite local `/uploads/` image URLs in JSON data to Supabase CDN URLs

### 4. Deploy to Vercel

Add environment variables in Vercel dashboard → Settings → Environment Variables:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
ADMIN_PASSWORD=...
```

---

## Caching Strategy

### Cache duration: 7 days (604800 seconds)

| Resource | Cache Tag | Invalidated by |
|----------|-----------|----------------|
| `businesses` | `businesses` | Any biz write |
| `business/{slug}` | `business:{slug}` | Biz detail write |
| `products/{slug}` | `products:{slug}` | Product write |
| `config` | `config` | Config write |
| `reports` | `reports` | Report write |

### How it works

**Reads** — server pages call `getCachedBusinesses()`, `getCachedProducts()`, etc. from `lib/cache.ts`. These use `unstable_cache()` wrapping the Supabase driver read, tagged for 7 days.

**Mutations** — every POST/DELETE in `/api/data`, `/api/biz-data`, and `/api/reports` calls `invalidateKey(key)` **after** a successful write. This calls `revalidateTag()` for all related tags, purging the cache immediately.

**Images** — uploaded to Supabase with `cacheControl: '604800'` so the Supabase CDN caches them for 7 days. `next.config.js` sets `minimumCacheTTL: 604800` for the Next.js image optimizer.

---

## Local Development

Without `SUPABASE_URL`, the app uses the local filesystem driver:
- JSON data: `data/*.json`
- Images: `public/uploads/`

No Supabase account needed for local dev.

---

## Supabase Storage Bucket Policies

⚠️ **Important:** Supabase Storage RLS applies to **all** clients including the service role key. Unlike database table RLS, the service role does NOT automatically bypass storage RLS. You must run `scripts/supabase-setup.sql` to create the required policies, otherwise all writes will fail with `new row violates row-level security policy`.

The `data` bucket is **private** — the SQL grants full access for all operations. Since `SUPABASE_SERVICE_ROLE_KEY` is only ever used server-side, this is secure.

The `uploads` bucket is **public** — public read + unrestricted write via policy. Write access is enforced by the Next.js API route auth layer.

---

## Troubleshooting

**`SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set`**
→ Check Vercel env vars are set and deployed.

**Images not loading after migration**
→ Verify the `uploads` bucket is set to **public**. Check the public URL pattern in Supabase dashboard → Storage → uploads → any file → Get URL.

**Cache not invalidating**
→ Ensure you're on Next.js 14+ and `revalidateTag` is called in a Server Action or Route Handler context (not in a Client Component).

**Migration script fails with "bucket not found"**
→ Run the SQL setup first, or let the script create buckets automatically (it will try).

---

## v10 — Nueva estructura de buckets

### Cambio de estructura de datos

En v10 cada negocio es **completamente independiente** — no hay un `businesses.json` central que se pueda pisar:

```
bucket "data"
  {slug}/business.json    ← datos del negocio (antes: businesses.json array + business/{slug}.json)
  {slug}/products.json    ← productos (antes: products/{slug}.json)
  config.json             ← sin cambios
  reports.json            ← sin cambios

bucket "uploads"  (público)
  {slug}/{timestamp}-{name}.ext   ← imágenes agrupadas por negocio

bucket "backup"   (privado — NUEVO)
  {YYYY-MM-DD}_{HH-MM}_{slug}.zip ← backup automático al registrar un negocio nuevo
```

### Crear el bucket "backup" en Supabase

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('backup', 'backup', false);
```

O desde el dashboard: Storage → New bucket → nombre `backup` → privado.

### Migración desde v9

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
npx tsx scripts/migrate-to-v10.ts
```

El script lee `businesses.json` y `business/{slug}.json` / `products/{slug}.json` y escribe los archivos nuevos. Los archivos viejos **no se eliminan** automáticamente — puedes borrarlos manualmente después de verificar.
