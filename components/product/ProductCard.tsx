'use client'
import { useState } from 'react'
import { Product, Lang } from '@/types'
import { getL } from '@/lib/data'
import { ProductGallery } from './ProductGallery'

interface ProductCardProps {
  product: Product
  lang: Lang
  onAdd: (productId: number) => void
  inCart?: boolean
  quantity?: number
  // Palette vars from parent business
  accent?: string
  bg?: string
  surface?: string
  surface2?: string
  text?: string
  textMuted?: string
  border?: string
  priceColor?: string
  defaultEmoji?: string
  defaultImage?: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  hambur: '🍔', burger: '🍔', side: '🍟', acomp: '🍟', pizza: '🍕',
  postre: '🍮', dessert: '🍮', bebida: '🥤', drink: '🥤',
  ensalada: '🥗', salad: '🥗', pasta: '🍝', sopa: '🍲', soup: '🍲',
  sandwich: '🥪', taco: '🌮', sushi: '🍣',
}
function getCategoryEmoji(cat: string) {
  const lower = cat.toLowerCase()
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '🍽️'
}

export function ProductCard({
  product, lang, onAdd, inCart, quantity,
  accent, bg, surface, surface2, text, textMuted, border, priceColor,
  defaultEmoji, defaultImage,
}: ProductCardProps) {
  const [showGallery, setShowGallery] = useState(false)
  const emoji = defaultEmoji || getCategoryEmoji(product.category.es + ' ' + product.category.en)
  const hasImage = (product.image && product.image.trim() !== '') || !!defaultImage
  const hasGallery = (product.images?.length ?? 0) > 0
  const displayImage = product.image && product.image.trim() !== '' ? product.image : defaultImage
  const isSoldOut = product.available === false

  // CSS var fallbacks for when used without explicit palette props
  const a = accent ?? 'var(--biz-accent)'
  const bg_ = bg ?? 'var(--biz-bg)'
  const s = surface ?? 'var(--biz-surface)'
  const s2 = surface2 ?? 'var(--biz-surface2)'
  const t = text ?? 'var(--biz-text)'
  const tm = textMuted ?? 'var(--biz-text-muted)'
  const b = border ?? 'var(--biz-border)'
  const pc = priceColor ?? 'var(--biz-price)'

  return (
    <>
      <div
        className="product-card rounded-2xl overflow-hidden border flex flex-col cursor-pointer"
        style={{
          background: s,
          borderColor: inCart ? a : b,
          opacity: isSoldOut ? 0.7 : 1,
          transition: 'border-color 0.2s ease, opacity 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
        }}
        onClick={() => setShowGallery(true)}
      >
        {/* Image */}
        <div className="relative w-full" style={{ paddingBottom: '80%', flexShrink: 0 }}>
          <div className="absolute inset-0" style={{ background: s2 }}>
            {hasImage ? (
              <img src={displayImage} alt={getL(product.name, lang)}
                className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl md:text-6xl" style={{ opacity: 0.35 }}>{emoji}</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
              style={{ background: `linear-gradient(to top, ${s} 0%, transparent 100%)` }} />
          </div>

          {/* Gallery indicator */}
          {hasGallery && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {(product.images?.length ?? 0) + 1}
            </div>
          )}

          {product.featured && !isSoldOut && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold z-10"
              style={{ background: a, color: 'white' }}>
              ★ Top
            </div>
          )}

          {product.tags && product.tags.length > 0 && !isSoldOut && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 items-end">
              {product.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: tag.color, color: tag.textColor || '#fff' }}>
                  {getL(tag.label, lang)}
                </span>
              ))}
            </div>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: '#71717a', color: '#fff' }}>
                {lang === 'es' ? 'Agotado' : 'Sold Out'}
              </span>
            </div>
          )}

          {inCart && quantity && !isSoldOut && (
            <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10"
              style={{ background: a, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {quantity}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-sm leading-tight line-clamp-2"
              style={{ fontFamily: 'var(--font-display)', color: t }}>
              {getL(product.name, lang)}
            </h3>
            <p className="text-xs leading-relaxed mt-1 line-clamp-2" style={{ color: tm }}>
              {getL(product.description, lang)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold" style={{ color: pc }}>
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xs line-through" style={{ color: tm }}>
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); !isSoldOut && onAdd(product.id) }}
              disabled={isSoldOut}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all active:scale-90 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isSoldOut ? s2 : a,
                color: isSoldOut ? tm : 'white',
              }}>
              {inCart ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>

      {/* Gallery modal */}
      {showGallery && (
        <ProductGallery
          product={product} lang={lang}
          accent={typeof a === 'string' && !a.includes('var') ? a : '#f97316'}
          bg={typeof bg_ === 'string' && !bg_.includes('var') ? bg_ : '#0f0f0f'}
          surface={typeof s === 'string' && !s.includes('var') ? s : '#1a1a1a'}
          surface2={typeof s2 === 'string' && !s2.includes('var') ? s2 : '#242424'}
          text={typeof t === 'string' && !t.includes('var') ? t : '#f0ece4'}
          textMuted={typeof tm === 'string' && !tm.includes('var') ? tm : '#888'}
          border={typeof b === 'string' && !b.includes('var') ? b : '#2e2e2e'}
          priceColor={typeof pc === 'string' && !pc.includes('var') ? pc : '#fbbf24'}
          onClose={() => setShowGallery(false)}
          onAdd={onAdd}
          inCart={inCart}
        />
      )}
    </>
  )
}
