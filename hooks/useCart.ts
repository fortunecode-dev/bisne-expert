'use client'
import { useState, useEffect, useCallback } from 'react'
import { CartItem, Product } from '@/types'
import { getCart, saveCart, addToCart, removeFromCart, updateQuantity, clearCart } from '@/lib/cart'

export function useCart(slug: string, productsById: Map<number, Product>) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setItems(getCart(slug))
  }, [slug])

  const add = useCallback((productId: number, quantity = 1) => {
    setItems(addToCart(slug, productId, quantity))
  }, [slug])

  const remove = useCallback((productId: number) => {
    setItems(removeFromCart(slug, productId))
  }, [slug])

  const update = useCallback((productId: number, quantity: number) => {
    setItems(updateQuantity(slug, productId, quantity))
  }, [slug])

  const clear = useCallback(() => {
    clearCart(slug)
    setItems([])
  }, [slug])

  const setFromParam = useCallback((cartItems: CartItem[]) => {
    saveCart(slug, cartItems)
    setItems(cartItems)
  }, [slug])

  const total = items.reduce((sum, item) => {
    const product = productsById.get(item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)

  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  const cartParam = items.map(i => `${i.productId}x${i.quantity}`).join(',')

  return { items, add, remove, update, clear, setFromParam, total, count, cartParam, mounted }
}
