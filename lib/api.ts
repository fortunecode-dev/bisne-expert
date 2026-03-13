// ─── API client (v10) ─────────────────────────────────────────────────────────
// Helpers HTTP para componentes cliente.
// En server components usar directamente lib/cache.ts (sin HTTP round-trip).
//
// Formato de keys v10:
//   {slug}/business   (antes: business/{slug})
//   {slug}/products   (antes: products/{slug})
//   config
//   reports

import { Business, BusinessDetail, Product, ProductsData } from '@/types'

async function apiFetch(path: string): Promise<any> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function apiPost(path: string, body: unknown): Promise<boolean> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  return res.ok
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function fetchBusinessDetail(slug: string): Promise<BusinessDetail> {
  const data = await apiFetch(`/api/data?file=${slug}/business`)
  return (data as BusinessDetail) ?? { slug }
}

export async function fetchProducts(slug: string): Promise<Product[]> {
  const data = await apiFetch(`/api/data?file=${slug}/products`)
  return (data as ProductsData)?.products ?? []
}

export async function fetchConfig(): Promise<any> {
  const data = await apiFetch(`/api/data?file=config`)
  return data ?? {}
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function saveData(file: string, data: unknown): Promise<boolean> {
  return apiPost('/api/data', { file, data })
}

export async function deleteData(file: string): Promise<boolean> {
  const res = await fetch(`/api/data?file=${encodeURIComponent(file)}`, {
    method: 'DELETE', cache: 'no-store',
  })
  return res.ok
}
