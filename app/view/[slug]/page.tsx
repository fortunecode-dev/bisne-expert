import { headers } from 'next/headers'
import { fetchBusinesses, fetchBusinessDetail, fetchProducts } from '@/lib/api'
import { ViewPageClient } from './ViewPageClient'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

function getBaseUrl(): string {
  const h = headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const base = getBaseUrl()
  const businesses = await fetchBusinesses(base)
  const business = businesses.find(b => b.slug === params.slug)
  return {
    title: (business?.name.es || params.slug) + ' - Pedido compartido',
    description: 'Ver y editar pedido compartido',
  }
}

export default async function ViewPage({ params }: { params: { slug: string } }) {
  const base = getBaseUrl()
  const businesses = await fetchBusinesses(base)
  const business = businesses.find(b => b.slug === params.slug)
  if (!business) notFound()

  const [detail, products] = await Promise.all([
    fetchBusinessDetail(params.slug, base),
    fetchProducts(params.slug, base),
  ])

  const visibleProducts = products.filter(p => !p.hidden)

  return (
    <Suspense fallback={<div className="p-8 text-center" style={{ color: 'var(--color-text)' }}>Cargando…</div>}>
      <ViewPageClient business={business!} detail={detail} products={visibleProducts} slug={params.slug} />
    </Suspense>
  )
}
