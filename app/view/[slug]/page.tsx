import { getAllBusinessSlugs, getBusinessBySlug, getBusinessDetail, getProducts } from '@/lib/data'
import { ViewPageClient } from './ViewPageClient'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  const slugs = getAllBusinessSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const business = getBusinessBySlug(params.slug)
  return {
    title: (business?.name.es || params.slug) + ' - Pedido compartido',
    description: 'Ver y editar pedido compartido',
  }
}

export default async function ViewPage({ params }: { params: { slug: string } }) {
  const business = getBusinessBySlug(params.slug)
  const detail = await getBusinessDetail(params.slug)
  const products = await getProducts(params.slug)

  if (!business) return <div className="p-8 text-center text-white">Business not found</div>

  return <ViewPageClient business={business} detail={detail} products={products} slug={params.slug} />
}
