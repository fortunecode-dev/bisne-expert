import { getCachedBusinesses, getCachedBusinessDetail, getCachedProducts } from '@/lib/cache'
import { ViewPageClient } from './ViewPageClient'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const businesses = await getCachedBusinesses()
  const business = businesses.find(b => b.slug === params.slug)
  return {
    title: (business?.name.es || params.slug) + ' - Pedido compartido',
    description: 'Ver y editar pedido compartido',
  }
}

export default async function ViewPage({ params }: { params: { slug: string } }) {
  const businesses = await getCachedBusinesses()
  const business = businesses.find(b => b.slug === params.slug)
  if (!business) notFound()

  const [detail, products] = await Promise.all([
    getCachedBusinessDetail(params.slug),
    getCachedProducts(params.slug),
  ])

  const visibleProducts = products.filter(p => !p.hidden)

  return (
    <Suspense fallback={<div className="p-8 text-center" style={{ color: 'var(--color-text)' }}>Cargando…</div>}>
      <ViewPageClient business={business!} detail={detail} products={visibleProducts} slug={params.slug} />
    </Suspense>
  )
}
