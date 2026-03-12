import { cookies } from 'next/headers'
import { getCachedBusinesses, getCachedBusinessDetail, getCachedProducts, getCachedConfig } from '@/lib/cache'
import { BusinessPageClient } from '../business/[slug]/BusinessPageClient'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const businesses = await getCachedBusinesses()
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

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { preview?: string }
}) {
  const reserved = ['admin', 'login', 'view', 'api', '_next', 'editar', 'registrar', 'planes']
  if (reserved.includes(params.slug)) notFound()

  const businesses = await getCachedBusinesses()
  const business = businesses.find(b => b.slug === params.slug)
  if (!business) notFound()

  const isPreview = searchParams.preview === '1'
  if (business.hidden && !isPreview) notFound()

  const [detail, products, config] = await Promise.all([
    getCachedBusinessDetail(params.slug),
    getCachedProducts(params.slug),
    getCachedConfig(),
  ])

  const visibleProducts = products.filter(p => !p.hidden)

  // Check owner/admin cookie server-side
  const cookieStore = cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated'
  const isOwner = isAdmin || cookieStore.get(`biz_session_${params.slug}`)?.value === 'authenticated'

  return (
    <BusinessPageClient
      business={business}
      detail={detail}
      products={visibleProducts}
      slug={params.slug}
      isPreview={isPreview && !!business.hidden}
      isOwner={isOwner}
      appConfig={config}
    />
  )
}
