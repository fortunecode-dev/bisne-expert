import { getAllBusinessSlugs, getBusinessBySlug, getBusinessDetail, getProducts } from '@/lib/data'
import { BusinessPageClient } from './BusinessPageClient'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  const slugs = getAllBusinessSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const business = getBusinessBySlug(params.slug)
  const detail = await getBusinessDetail(params.slug)
  
  return {
    title: business?.seo.title.es || business?.name.es,
    description: business?.seo.description.es || business?.description.es,
    keywords: business?.seo.keywords,
    openGraph: {
      title: business?.seo.title.es,
      description: business?.seo.description.es,
    }
  }
}

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const business = getBusinessBySlug(params.slug)
  const detail = await getBusinessDetail(params.slug)
  const products = await getProducts(params.slug)

  if (!business) return <div className="p-8 text-center text-white">Business not found</div>

  return <BusinessPageClient business={business} detail={detail} products={products} slug={params.slug} />
}
