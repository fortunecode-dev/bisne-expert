import businessesData from '@/data/businesses.json'
import { Business, BusinessDetail, BusinessesData, Product, ProductIndexes, ProductsData, Lang } from '@/types'

export function getBusinesses(): Business[] {
  const data = businessesData as BusinessesData
  return data.businesses.filter(b => !b.hidden)
}

export function getAllBusinessSlugs(): string[] {
  const data = businessesData as BusinessesData
  return data.businesses.map(b => b.slug)
}

export function getBusinessBySlug(slug: string): Business | undefined {
  const data = businessesData as BusinessesData
  return data.businesses.find(b => b.slug === slug)
}

export async function getBusinessDetail(slug: string): Promise<BusinessDetail> {
  const detail = await import(`@/data/business/${slug}.json`)
  return detail.default as BusinessDetail
}

export async function getProducts(slug: string): Promise<Product[]> {
  const data = await import(`@/data/products/${slug}.json`)
  const productsData = data.default as ProductsData
  return productsData.products.filter(p => !p.hidden)
}

export function buildProductIndexes(products: Product[], lang: Lang = 'es'): ProductIndexes {
  const productsById = new Map<number, Product>()
  const productsByCategory = new Map<string, Product[]>()
  const featuredProducts: Product[] = []
  const categoriesSet = new Set<string>()

  for (const product of products) {
    productsById.set(product.id, product)

    if (product.featured) {
      featuredProducts.push(product)
    }

    const categoryKey = product.category[lang]
    categoriesSet.add(categoryKey)

    if (!productsByCategory.has(categoryKey)) {
      productsByCategory.set(categoryKey, [])
    }
    productsByCategory.get(categoryKey)!.push(product)
  }

  return {
    productsById,
    productsByCategory,
    featuredProducts,
    allCategories: Array.from(categoriesSet),
  }
}

export function parseCartParam(cartParam: string, productsById: Map<number, Product>): Array<{ product: Product; quantity: number }> {
  if (!cartParam) return []
  
  return cartParam
    .split(',')
    .map(item => {
      const [idStr, qtyStr] = item.split('x')
      const id = parseInt(idStr)
      const quantity = parseInt(qtyStr)
      const product = productsById.get(id)
      if (!product || isNaN(quantity) || quantity < 1) return null
      return { product, quantity }
    })
    .filter(Boolean) as Array<{ product: Product; quantity: number }>
}

export function encodeCartParam(items: Array<{ productId: number; quantity: number }>): string {
  return items.map(i => `${i.productId}x${i.quantity}`).join(',')
}

export function getL(obj: { es: string; en: string }, lang: Lang): string {
  return obj[lang] ?? obj.es
}
