import { headers } from 'next/headers'
import { fetchBusinesses, fetchBusinessDetail, fetchProducts } from '@/lib/api'
import { BusinessPageClient } from '../business/[slug]/BusinessPageClient'
import type { Metadata } from 'next'
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
  if (!business) return { title: 'No encontrado' }
  return {
    title: business.seo?.title?.es || business.name.es,
    description: business.seo?.description?.es || business.description?.es,
    keywords: business.seo?.keywords,
    openGraph: {
      title: business.seo?.title?.es || business.name.es,
      description: business.seo?.description?.es || business.description?.es,
    },
  }
}

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const reserved = ['admin', 'login', 'view', 'api', '_next']
  if (reserved.includes(params.slug)) notFound()

  const base = getBaseUrl()
  const businesses = await fetchBusinesses(base)
  const business = businesses.find(b => b.slug === params.slug)
  if (!business) notFound()

  const [detail, products] = await Promise.all([
    fetchBusinessDetail(params.slug, base),
    fetchProducts(params.slug, base),
  ])

  const visibleProducts = products.filter(p => !p.hidden)

  return <BusinessPageClient business={business} detail={detail} products={visibleProducts} slug={params.slug} />
}
