// ─── Next.js Data Cache (v10) ─────────────────────────────────────────────────
// Cache de servidor: 7 días, invalidación quirúrgica por tag.
//
// Cambio principal vs v9:
//   ANTES: getCachedBusinesses() leía un solo businesses.json con un array
//   AHORA: getCachedBusinesses() lista el bucket "data", detecta todas las
//          carpetas {slug}/, lee cada {slug}/business.json en paralelo y
//          arma el array — nunca hay un archivo central que se pueda pisar.

import { unstable_cache, revalidateTag } from 'next/cache'
import { getDriver, getCacheTags, storageKeys } from './storage'
import type { Business, BusinessDetail, Product, ProductsData } from '@/types'

export const CACHE_TTL = 604800 // 7 días

export const TAGS = {
  businesses:  'businesses',
  products:    'products',
  config:      'config',
  reports:     'reports',
  business:    (slug: string) => `business:${slug}`,
  productList: (slug: string) => `products:${slug}`,
} as const

// ─── Lectura genérica cacheada ────────────────────────────────────────────────

export function cachedReadJSON(key: string): Promise<unknown | null> {
  const tags = getCacheTags(key)
  return unstable_cache(
    async () => { const d = await getDriver(); return d.readJSON(key) },
    [key],
    { revalidate: CACHE_TTL, tags }
  )()
}

// ─── Lista de negocios ────────────────────────────────────────────────────────
// Lista las keys del bucket, filtra las que terminan en "/{slug}/business",
// lee cada una en paralelo y devuelve el array ordenado por created_at.
// Tag: "businesses" — se invalida cuando se escribe cualquier {slug}/business.json

export async function getCachedBusinesses(): Promise<Business[]> {
  return unstable_cache(
    async (): Promise<Business[]> => {
      const driver = await getDriver()
      const allKeys = await driver.listJSONKeys()
      // Matchear exactamente "{slug}/business" — no config ni reports
      const bizKeys = allKeys.filter(k => /^[a-z0-9-]+\/business$/.test(k))

      const settled = await Promise.allSettled(
        bizKeys.map(k => driver.readJSON(k))
      )

      const list: Business[] = []
      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value && typeof r.value === 'object') {
          list.push(r.value as Business)
        }
      }

      // Ordenar por created_at ascendente (más antiguos primero)
      list.sort((a, b) => {
        const ta = (a as any).created_at ?? ''
        const tb = (b as any).created_at ?? ''
        return ta < tb ? -1 : ta > tb ? 1 : 0
      })

      return list
    },
    ['businesses-list'],
    { revalidate: CACHE_TTL, tags: [TAGS.businesses] }
  )()
}

// ─── Detalle y productos por slug ─────────────────────────────────────────────

export async function getCachedBusinessDetail(slug: string): Promise<BusinessDetail> {
  // En v10 el "detail" es el mismo archivo {slug}/business.json
  const data = await cachedReadJSON(storageKeys.business(slug)) as BusinessDetail | null
  return data ?? { slug }
}

export async function getCachedProducts(slug: string): Promise<Product[]> {
  const data = await cachedReadJSON(storageKeys.products(slug)) as ProductsData | null
  return data?.products ?? []
}

export async function getCachedConfig(): Promise<any> {
  return (await cachedReadJSON(storageKeys.config())) ?? {}
}

// ─── Invalidación de cache ────────────────────────────────────────────────────

export function invalidateKey(key: string): void {
  for (const tag of getCacheTags(key)) revalidateTag(tag)
}

export function invalidateKeys(keys: string[]): void {
  const seen = new Set<string>()
  for (const key of keys)
    for (const tag of getCacheTags(key))
      if (!seen.has(tag)) { seen.add(tag); revalidateTag(tag) }
}
