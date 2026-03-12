// ─── API client ───────────────────────────────────────────────────────────────
// Server pages: use cached direct-driver reads (no HTTP, 7-day cache).
// Client components: HTTP fetch to /api/data (cookies needed for auth).
//
// Rule: if baseUrl is not provided AND we're in a server context, prefer
// the cached driver functions from lib/cache.ts. Pass baseUrl only from
// client code that needs HTTP.

import { Business, BusinessDetail, BusinessesData, Product, ProductsData } from '@/types'

// ─── HTTP helpers (client-side / server with baseUrl) ─────────────────────────

async function apiFetch(path: string, baseUrl?: string): Promise<any> {
  const url = baseUrl ? `${baseUrl}${path}` : path
  // Use Next.js Data Cache when called server-side (no baseUrl = server context assumed)
  const cacheOpts: RequestInit = baseUrl
    ? { cache: 'no-store' }  // client-side HTTP — no Next.js cache
    : {
        // Server-side fetch — tag-based caching via Next.js
        next: {
          revalidate: 604800,  // 7 days
          tags: pathToTags(path),
        } as any,
      }
  const res = await fetch(url, cacheOpts)
  if (!res.ok) return null
  return res.json()
}

// Map a /api/data path to cache tags
function pathToTags(path: string): string[] {
  if (path.includes('file=businesses')) return ['businesses']
  if (path.includes('file=config')) return ['config']
  if (path.includes('file=reports')) return ['reports']
  const bizMatch = path.match(/file=business\/([^&]+)/)
  if (bizMatch) return ['businesses', `business:${bizMatch[1]}`]
  const prodMatch = path.match(/file=products\/([^&]+)/)
  if (prodMatch) return ['products', `products:${prodMatch[1]}`]
  return []
}

async function apiPost(path: string, body: unknown, baseUrl?: string): Promise<boolean> {
  const url = baseUrl ? `${baseUrl}${path}` : path
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  return res.ok
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

export async function fetchBusinesses(baseUrl?: string): Promise<Business[]> {
  const data = await apiFetch(`/api/data?file=businesses`, baseUrl)
  return (data as BusinessesData)?.businesses ?? []
}

export async function fetchBusinessDetail(slug: string, baseUrl?: string): Promise<BusinessDetail> {
  const data = await apiFetch(`/api/data?file=business/${slug}`, baseUrl)
  return (data as BusinessDetail) ?? { slug }
}

export async function fetchProducts(slug: string, baseUrl?: string): Promise<Product[]> {
  const data = await apiFetch(`/api/data?file=products/${slug}`, baseUrl)
  return (data as ProductsData)?.products ?? []
}

export async function fetchConfig(baseUrl?: string): Promise<any> {
  const data = await apiFetch(`/api/data?file=config`, baseUrl)
  return data ?? {}
}

// ─── Write helpers (client-side, authenticated via cookie) ───────────────────

export async function saveData(file: string, data: unknown): Promise<boolean> {
  return apiPost('/api/data', { file, data })
}

export async function deleteData(file: string): Promise<boolean> {
  const res = await fetch(`/api/data?file=${encodeURIComponent(file)}`, {
    method: 'DELETE',
    cache: 'no-store',
  })
  return res.ok
}
