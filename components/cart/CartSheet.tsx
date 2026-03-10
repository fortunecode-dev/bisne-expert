'use client'
import { CartItem, Product, Lang, BusinessDetail } from '@/types'
import { getL } from '@/lib/data'
import { useState } from 'react'

interface CartSheetProps {
  items: CartItem[]
  productsById: Map<number, Product>
  business: BusinessDetail
  businessName: string
  slug: string
  lang: Lang
  cartParam: string
  total: number
  onUpdate: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  onClear: () => void
  onClose: () => void
  donationsEnabled: boolean
}

export function CartSheet({ items, productsById, business, businessName, slug, lang, cartParam, total, onUpdate, onRemove, onClear, onClose, donationsEnabled }: CartSheetProps) {
  const [copied, setCopied] = useState(false)
  const [showDonation, setShowDonation] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/view/${slug}?c=${cartParam}`
    : ''

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const buildWhatsApp = () => {
    const lines = items.map(item => {
      const product = productsById.get(item.productId)
      if (!product) return ''
      return `${item.quantity}x ${getL(product.name, lang)} — $${(product.price * item.quantity).toFixed(2)}`
    }).filter(Boolean)

    const msg = (lang === 'es' ? `Hola *${businessName}*! Me gustaría ordenar:\n\n` : `Hello *${businessName}*! I'd like to order:\n\n`)
      + lines.join('\n')
      + `\n\n*Total: $${total.toFixed(2)}*`
      + (shareUrl ? `\n\n🔗 ${shareUrl}` : '')

    return `https://wa.me/${business.phone}?text=${encodeURIComponent(msg)}`
  }

  const donationQR = `TRANSFERMOVIL _ETECSA, TRANSFERENCIA, ${business.cardNumber}, ${business.phone}`

  const btnStyle = {
    background: 'var(--biz-accent)',
    color: 'var(--biz-accent-text)',
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8 min-h-[200px]">
        <div className="text-5xl mb-3 opacity-20">🛒</div>
        <p className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--biz-text)' }}>
          {lang === 'es' ? 'Carrito vacío' : 'Empty cart'}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--biz-text-muted)' }}>
          {lang === 'es' ? 'Agrega productos del catálogo' : 'Add products from the catalog'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }}>
      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5" style={{ maxHeight: '50vh' }}>
        {items.map(item => {
          const product = productsById.get(item.productId)
          if (!product) return null
          return (
            <div
              key={item.productId}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'var(--biz-surface2)' }}
            >
              {/* Thumbnail */}
              {product.image && (
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border" style={{ borderColor: 'var(--biz-border)' }}>
                  <img src={product.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--biz-text)' }}>
                  {getL(product.name, lang)}
                </p>
                <p className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
                  ${product.price.toFixed(2)} / ud.
                </p>
              </div>
              {/* Quantity controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onUpdate(item.productId, item.quantity - 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors"
                  style={{ background: 'var(--biz-border)', color: 'var(--biz-text)' }}
                >−</button>
                <span className="w-5 text-center font-bold text-sm" style={{ color: 'var(--biz-text)' }}>{item.quantity}</span>
                <button
                  onClick={() => onUpdate(item.productId, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-all"
                  style={btnStyle}
                >+</button>
              </div>
              {/* Subtotal + remove */}
              <div className="w-14 text-right flex-shrink-0">
                <p className="font-bold text-sm" style={{ color: 'var(--biz-price)' }}>
                  ${(product.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => onRemove(item.productId)}
                  className="text-xs transition-colors"
                  style={{ color: '#f87171' }}
                >✕</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Donation toggle */}
      {donationsEnabled && (
        <div className="px-4 py-2">
          <button
            onClick={() => setShowDonation(!showDonation)}
            className="w-full py-2 rounded-xl text-sm font-semibold border transition-colors"
            style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-price)' }}
          >
            💛 {lang === 'es' ? 'Dejar propina' : 'Leave a tip'}
          </button>
          {showDonation && (
            <div className="mt-2 p-3 rounded-xl text-xs font-mono break-all" style={{ background: 'var(--biz-surface2)', color: 'var(--biz-text-muted)', border: '1px solid var(--biz-border)' }}>
              {donationQR}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--biz-border)' }}>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: 'var(--biz-text-muted)' }}>Total</span>
          <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--biz-price)' }}>
            ${total.toFixed(2)}
          </span>
        </div>

        <button
          onClick={() => window.open(buildWhatsApp(), '_blank')}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
          style={btnStyle}
        >
          💬 {lang === 'es' ? 'Pedir por WhatsApp' : 'Order via WhatsApp'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
            style={{ borderColor: 'var(--biz-border)', color: copied ? 'var(--biz-accent)' : 'var(--biz-text-muted)' }}
          >
            {copied ? `✓ ${lang === 'es' ? 'Copiado!' : 'Copied!'}` : `🔗 ${lang === 'es' ? 'Compartir' : 'Share'}`}
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all"
            style={{ borderColor: '#dc262640', color: '#f87171' }}
          >
            {lang === 'es' ? 'Vaciar' : 'Clear'}
          </button>
        </div>
      </div>
    </div>
  )
}
