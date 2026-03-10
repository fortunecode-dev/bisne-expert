// ─── API client — works in both server and client contexts ───────────────────
// All data access goes through these functions, which call /api/data.
// Server pages: provide baseUrl for absolute fetch. Client components: relative fetch.

import { Business, BusinessDetail, BusinessesData, Product, ProductsData } from '@/types'

async function apiFetch(path: string, baseUrl?: string): Promise<any> {
  const url = baseUrl ? `${baseUrl}${path}` : path
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function apiPost(path: string, body: unknown, baseUrl?: string): Promise<boolean> {
  const url = baseUrl ? `${baseUrl}${path}` : path
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
  const res = await fetch(`/api/data?file=${encodeURIComponent(file)}`, { method: 'DELETE' })
  return res.ok
}
