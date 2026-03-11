'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Business, BusinessDetail, PromoType } from '@/types'
import { getL } from '@/lib/data'
import { Lang } from '@/types'

const PROMO_LABELS: Record<PromoType, { es: string; en: string; color: string }> = {
  standard:  { es: 'Promo',         en: 'Promo',          color: '#f97316' },
  sale:      { es: '🏷️ Rebaja',    en: '🏷️ Sale',       color: '#ef4444' },
  new:       { es: '✨ Nuevo',      en: '✨ New',          color: '#22c55e' },
  special:   { es: '⭐ Especial',   en: '⭐ Special',     color: '#a855f7' },
  limited:   { es: '⏳ Limitado',   en: '⏳ Limited',     color: '#f59e0b' },
}

interface MarqueeItem {
  biz: Business
  detail?: BusinessDetail
  promo?: { promoType: PromoType; label?: { es: string; en: string } }
  productName?: string
  productImage?: string
}

interface Props {
  items: MarqueeItem[]
  lang: Lang
  size?: 'sm' | 'lg'        // sm = inside page, lg = homepage hero
  className?: string
}

export function MarqueeBanner({ items, lang, size = 'sm', className = '' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Duplicate items for seamless loop
  const doubled = [...items, ...items, ...items]

  if (items.length === 0) return null

  const itemW = size === 'lg' ? 260 : 200
  const gap = size === 'lg' ? 16 : 12
  const speed = size === 'lg' ? 40 : 30 // seconds per full cycle
  const totalW = items.length * (itemW + gap)

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.05) 100%)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex"
        style={{
          gap,
          width: 'max-content',
          animation: `marquee-scroll ${speed}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
          '--marquee-w': `${totalW}px`,
        } as any}
      >
        {doubled.map((item, i) => (
          <MarqueeCard key={i} item={item} lang={lang} size={size} width={itemW} />
        ))}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-1 * var(--marquee-w) - ${gap}px)); }
        }
      `}</style>
    </div>
  )
}

function MarqueeCard({ item, lang, size, width }: { item: MarqueeItem; lang: Lang; size: 'sm' | 'lg'; width: number }) {
  const { biz, detail, promo, productName, productImage } = item
  const palette = detail?.palette
  const accent = palette?.accent ?? '#f97316'
  const surface = palette?.surface ?? '#1a1a1a'
  const border = palette?.border ?? '#2e2e2e'
  const text = palette?.text ?? '#f0ece4'

  const promoInfo = promo ? PROMO_LABELS[promo.promoType] : null
  const promoLabel = promoInfo
    ? (promo?.label ? getL(promo.label, lang) : (lang === 'es' ? promoInfo.es : promoInfo.en))
    : null

  const image = productImage || biz.image || biz.logo
  const name = productName || getL(biz.name, lang)

  if (size === 'lg') {
    return (
      <Link
        href={`/${biz.slug}`}
        className="flex-shrink-0 flex items-center gap-3 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ width, background: surface, border: `1px solid ${border}`, padding: '10px 14px' }}
      >
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: accent + '22' }}>
          {image
            ? <img src={image} alt="" className="w-full h-full object-cover" />
            : <span className="text-2xl">🏪</span>
          }
        </div>
        <div className="min-w-0 flex-1">
          {promoLabel && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full mb-1 inline-block"
              style={{ background: (promoInfo?.color ?? accent) + '22', color: promoInfo?.color ?? accent }}>
              {promoLabel}
            </span>
          )}
          <p className="font-bold text-sm truncate" style={{ color: text }}>{name}</p>
          <p className="text-xs truncate" style={{ color: accent }}>{getL(biz.name, lang)}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/${biz.slug}`}
      className="flex-shrink-0 flex items-center gap-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
      style={{ width, background: surface, border: `1px solid ${border}`, padding: '8px 12px' }}
    >
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: accent + '22' }}>
        {image
          ? <img src={image} alt="" className="w-full h-full object-cover" />
          : <span className="text-sm">🏪</span>
        }
      </div>
      <div className="min-w-0 flex-1">
        {promoLabel && (
          <span className="text-[10px] font-bold mr-1"
            style={{ color: promoInfo?.color ?? accent }}>{promoLabel} ·</span>
        )}
        <span className="text-xs font-semibold truncate block" style={{ color: text }}>{name}</span>
      </div>
    </Link>
  )
}
