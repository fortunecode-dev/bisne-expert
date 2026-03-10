// Pure utility functions — safe to import from client components (no fs/node deps)
import { Business, BusinessDetail, Product, ProductIndexes, Lang } from '@/types'

export function getL(obj: { es: string; en: string }, lang: Lang): string {
  return obj[lang] ?? obj.es
}

export function buildProductIndexes(products: Product[], lang: Lang = 'es'): ProductIndexes {
  const productsById = new Map<number, Product>()
  const productsByCategory = new Map<string, Product[]>()
  const featuredProducts: Product[] = []
  const categoriesSet = new Set<string>()

  for (const product of products) {
    productsById.set(product.id, product)
    if (product.featured) featuredProducts.push(product)
    const cat = product.category[lang]
    categoriesSet.add(cat)
    if (!productsByCategory.has(cat)) productsByCategory.set(cat, [])
    productsByCategory.get(cat)!.push(product)
  }

  return { productsById, productsByCategory, featuredProducts, allCategories: Array.from(categoriesSet) }
}

export function parseCartParam(cartParam: string, productsById: Map<number, Product>): Array<{ product: Product; quantity: number }> {
  if (!cartParam) return []
  return cartParam.split(',').map(item => {
    const [idStr, qtyStr] = item.split('x')
    const id = parseInt(idStr), quantity = parseInt(qtyStr)
    const product = productsById.get(id)
    if (!product || isNaN(quantity) || quantity < 1) return null
    return { product, quantity }
  }).filter(Boolean) as Array<{ product: Product; quantity: number }>
}

export function encodeCartParam(items: Array<{ productId: number; quantity: number }>): string {
  return items.map(i => `${i.productId}x${i.quantity}`).join(',')
}
