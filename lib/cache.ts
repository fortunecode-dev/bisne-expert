// ─── Next.js Data Cache layer ─────────────────────────────────────────────────
// All server-side reads go through cachedFetch() or cachedDriverRead().
// All mutations call invalidateKeys() AFTER a successful write.
//
// Cache duration: 7 days (604800 seconds).
// Tags allow surgical invalidation on mutation.

import { unstable_cache, revalidateTag } from 'next/cache'
import { getDriver, getCacheTags } from './storage'

export const CACHE_TTL = 604800 // 7 days in seconds

// ─── Tag constants ────────────────────────────────────────────────────────────
export const TAGS = {
  businesses: 'businesses',
  products: 'products',
  config: 'config',
  reports: 'reports',
  business: (slug: string) => `business:${slug}`,
  productList: (slug: string) => `products:${slug}`,
} as const

// ─── Cached driver read ───────────────────────────────────────────────────────
// Wraps driver.readJSON() with Next.js unstable_cache so the result is cached
// server-side for CACHE_TTL seconds and tagged for fine-grained invalidation.

export function cachedReadJSON(key: string): Promise<unknown | null> {
  const tags = getCacheTags(key)
  return unstable_cache(
    async () => {
      const driver = await getDriver()
      return driver.readJSON(key)
    },
    [key],
    { revalidate: CACHE_TTL, tags }
  )()
}

// ─── Cache invalidation after mutations ──────────────────────────────────────
// Call this AFTER a successful write to storage.
// Pass the storage key that was modified — all related tags will be invalidated.

export function invalidateKey(key: string): void {
  const tags = getCacheTags(key)
  for (const tag of tags) {
    revalidateTag(tag)
  }
}

// Invalidate multiple keys at once
export function invalidateKeys(keys: string[]): void {
  const seen = new Set<string>()
  for (const key of keys) {
    for (const tag of getCacheTags(key)) {
      if (!seen.has(tag)) {
        seen.add(tag)
        revalidateTag(tag)
      }
    }
  }
}

// ─── Cached API fetchers (server pages) ──────────────────────────────────────
// These replace the no-store fetch() calls in lib/api.ts when running server-side.
// They go directly to the driver (no HTTP round-trip) and use Next.js cache.

import type { Business, BusinessDetail, Product, BusinessesData, ProductsData } from '@/types'

export async function getCachedBusinesses(): Promise<Business[]> {
  const data = await cachedReadJSON('businesses') as BusinessesData | null
  return data?.businesses ?? []
}

export async function getCachedBusinessDetail(slug: string): Promise<BusinessDetail> {
  const data = await cachedReadJSON(`business/${slug}`) as BusinessDetail | null
  return data ?? { slug }
}

export async function getCachedProducts(slug: string): Promise<Product[]> {
  const data = await cachedReadJSON(`products/${slug}`) as ProductsData | null
  return data?.products ?? []
}

export async function getCachedConfig(): Promise<any> {
  const data = await cachedReadJSON('config')
  return data ?? {}
}
