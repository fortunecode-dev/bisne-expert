'use client'
import { Product, Lang } from '@/types'
import { getL } from '@/lib/data'

interface ProductCardProps {
  product: Product
  lang: Lang
  onAdd: (productId: number) => void
  inCart?: boolean
  quantity?: number
}

const CATEGORY_EMOJI: Record<string, string> = {
  hambur: '🍔', burger: '🍔',
  side: '🍟', acomp: '🍟',
  pizza: '🍕',
  postre: '🍮', dessert: '🍮',
  bebida: '🥤', drink: '🥤',
  ensalada: '🥗', salad: '🥗',
  pasta: '🍝',
  sopa: '🍲', soup: '🍲',
  sandwich: '🥪',
  taco: '🌮',
  sushi: '🍣',
}

function getCategoryEmoji(cat: string) {
  const lower = cat.toLowerCase()
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '🍽️'
}

export function ProductCard({ product, lang, onAdd, inCart, quantity }: ProductCardProps) {
  const emoji = getCategoryEmoji(product.category.es + ' ' + product.category.en)
  const hasImage = product.image && product.image.trim() !== ''
  const isSoldOut = product.available === false

  return (
    <div
      className="product-card rounded-2xl overflow-hidden border flex flex-col"
      style={{
        background: 'var(--biz-surface)',
        borderColor: inCart ? 'var(--biz-accent)' : 'var(--biz-border)',
        opacity: isSoldOut ? 0.7 : 1,
        transition: 'border-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Image — square aspect ratio, large */}
      <div className="relative w-full" style={{ paddingBottom: '80%', flexShrink: 0 }}>
        <div
          className="absolute inset-0"
          style={{ background: 'var(--biz-surface2)' }}
        >
          {hasImage ? (
            <img
              src={product.image}
              alt={getL(product.name, lang)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl md:text-6xl" style={{ opacity: 0.35 }}>{emoji}</span>
            </div>
          )}

          {/* Bottom gradient for readability */}
          <div
            className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{ background: 'linear-gradient(to top, var(--biz-surface) 0%, transparent 100%)' }}
          />
        </div>

        {/* Featured badge */}
        {product.featured && !isSoldOut && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold z-10"
            style={{ background: 'var(--biz-accent)', color: 'var(--biz-accent-text)' }}
          >
            ★ {lang === 'es' ? 'Top' : 'Top'}
          </div>
        )}

        {/* Custom tags */}
        {product.tags && product.tags.length > 0 && !isSoldOut && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 items-end">
            {product.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: tag.color, color: tag.textColor || '#fff' }}
              >
                {getL(tag.label, lang)}
              </span>
            ))}
          </div>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: '#71717a', color: '#fff' }}
            >
              {lang === 'es' ? 'Agotado' : 'Sold Out'}
            </span>
          </div>
        )}

        {/* Cart quantity badge */}
        {inCart && quantity && !isSoldOut && (
          <div
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10"
            style={{
              background: 'var(--biz-accent)',
              color: 'var(--biz-accent-text)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {quantity}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex-1">
          <h3
            className="font-bold text-sm leading-tight line-clamp-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--biz-text)' }}
          >
            {getL(product.name, lang)}
          </h3>
          <p
            className="text-xs leading-relaxed mt-1 line-clamp-2"
            style={{ color: 'var(--biz-text-muted)' }}
          >
            {getL(product.description, lang)}
          </p>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold" style={{ color: 'var(--biz-price)' }}>
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs line-through" style={{ color: 'var(--biz-text-muted)' }}>
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => !isSoldOut && onAdd(product.id)}
            disabled={isSoldOut}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all active:scale-90 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isSoldOut ? 'var(--biz-surface2)' : 'var(--biz-accent)',
              color: isSoldOut ? 'var(--biz-text-muted)' : 'var(--biz-accent-text)',
            }}
          >
            {inCart ? '✓' : '+'}
          </button>
        </div>
      </div>
    </div>
  )
}
