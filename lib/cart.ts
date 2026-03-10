import { CartItem } from '@/types'

const CART_KEY_PREFIX = 'cart_'

export function getCart(slug: string): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY_PREFIX + slug)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCart(slug: string, items: CartItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY_PREFIX + slug, JSON.stringify(items))
}

export function addToCart(slug: string, productId: number, quantity = 1): CartItem[] {
  const items = getCart(slug)
  const existing = items.find(i => i.productId === productId)
  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({ productId, quantity })
  }
  saveCart(slug, items)
  return items
}

export function removeFromCart(slug: string, productId: number): CartItem[] {
  const items = getCart(slug).filter(i => i.productId !== productId)
  saveCart(slug, items)
  return items
}

export function updateQuantity(slug: string, productId: number, quantity: number): CartItem[] {
  if (quantity < 1) return removeFromCart(slug, productId)
  const items = getCart(slug)
  const item = items.find(i => i.productId === productId)
  if (item) item.quantity = quantity
  saveCart(slug, items)
  return items
}

export function clearCart(slug: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY_PREFIX + slug)
}
