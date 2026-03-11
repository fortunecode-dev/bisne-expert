'use client'
import { useState } from 'react'
import { Product, Lang } from '@/types'
import { getL } from '@/lib/data'

interface Props {
  product: Product
  lang: Lang
  accent: string
  bg: string
  surface: string
  surface2: string
  text: string
  textMuted: string
  border: string
  priceColor: string
  onClose: () => void
  onAdd?: (id: number) => void
  inCart?: boolean
}

export function ProductGallery({
  product, lang, accent, bg, surface, surface2, text, textMuted, border, priceColor,
  onClose, onAdd, inCart,
}: Props) {
  const allImages = [product.image, ...(product.images ?? [])].filter(Boolean) as string[]
  const [activeIdx, setActiveIdx] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    const url = window.location.href + `?product=${product.id}`
    const title = getL(product.name, lang)
    if (navigator.share) {
      try { await navigator.share({ title, url }); return } catch {}
    }
    await navigator.clipboard.writeText(url)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const isSoldOut = product.available === false

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: bg }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0 border-b"
        style={{ borderColor: border }}>
        <button onClick={onClose}
          className="flex items-center gap-1 py-2 pr-3 transition-all active:scale-95"
          style={{ color: accent }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button onClick={handleShare}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: shared ? '#22c55e' : surface2, color: shared ? 'white' : textMuted }}>
          {shared
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4"><path d="M20 6L9 17l-5-5"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
          }
        </button>
      </div>

      {/* ── Main image with gradient overlay ── */}
      <div className="relative flex-shrink-0 cursor-pointer" style={{ height: '55vw', maxHeight: 340 }}
        onClick={() => allImages[activeIdx] && setFullscreen(true)}>
        {allImages[activeIdx] ? (
          <img src={allImages[activeIdx]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl opacity-20" style={{ background: surface2 }}>
            📦
          </div>
        )}
        {/* Bottom gradient with info */}
        <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-4"
          style={{ background: `linear-gradient(to top, ${bg} 0%, ${bg}cc 50%, transparent 100%)` }}>
          <h2 className="text-xl font-black leading-tight mb-0.5"
            style={{ fontFamily: 'var(--font-display)', color: text }}>
            {getL(product.name, lang)}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black" style={{ color: priceColor }}>
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm line-through" style={{ color: textMuted }}>
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        {/* Tap to zoom hint */}
        {allImages[activeIdx] && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)' }}>
            🔍
          </div>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Description */}
        <div className="px-4 py-4 border-b" style={{ borderColor: border }}>
          <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
            {getL(product.description, lang)}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ borderColor: `${accent}40`, color: accent, background: `${accent}10` }}>
              {getL(product.category, lang)}
            </span>
            {product.featured && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${accent}22`, color: accent }}>★ Destacado</span>
            )}
            {isSoldOut && (
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: '#71717a33', color: '#a1a1aa' }}>
                {lang === 'es' ? 'Agotado' : 'Sold out'}
              </span>
            )}
          </div>
        </div>

        {/* Gallery grid — Instagram-style feed */}
        {allImages.length > 1 && (
          <div className="px-4 py-4 border-b" style={{ borderColor: border }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3 opacity-40">
              {lang === 'es' ? 'Galería' : 'Gallery'} · {allImages.length}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {allImages.map((img, i) => (
                <div key={i}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all hover:opacity-90 active:scale-95"
                  style={{
                    outline: i === activeIdx ? `2px solid ${accent}` : 'none',
                    outlineOffset: 2,
                  }}
                  onClick={() => { setActiveIdx(i); setFullscreen(true) }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Add to cart ── */}
      {onAdd && (
        <div className="flex-shrink-0 px-4 py-4 border-t" style={{ borderColor: border, background: bg }}>
          <button
            onClick={() => !isSoldOut && onAdd(product.id)}
            disabled={isSoldOut}
            className="w-full py-3.5 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-40"
            style={{ background: inCart ? `${accent}cc` : accent, color: 'white' }}>
            {isSoldOut
              ? (lang === 'es' ? 'Agotado' : 'Sold out')
              : inCart
                ? (lang === 'es' ? '✓ En el carrito' : '✓ In cart')
                : (lang === 'es' ? '+ Agregar al pedido' : '+ Add to order')}
          </button>
        </div>
      )}

      {/* ── Fullscreen image viewer ── */}
      {fullscreen && allImages[activeIdx] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: `${bg}f5` }}
          onClick={() => setFullscreen(false)}>
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-sm z-10 transition-all active:scale-95"
            style={{ background: surface2, color: text, border: `1px solid ${border}` }}
            onClick={() => setFullscreen(false)}>✕</button>
          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full z-10 transition-all active:scale-95 hover:opacity-80"
                style={{ background: surface2, color: accent, border: `1px solid ${border}` }}
                onClick={e => { e.stopPropagation(); setActiveIdx(i => (i - 1 + allImages.length) % allImages.length) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full z-10 transition-all active:scale-95 hover:opacity-80"
                style={{ background: surface2, color: accent, border: `1px solid ${border}` }}
                onClick={e => { e.stopPropagation(); setActiveIdx(i => (i + 1) % allImages.length) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </>
          )}
          <img src={allImages[activeIdx]} alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()} />
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
              {allImages.map((_, i) => (
                <div key={i}
                  className="rounded-full transition-all cursor-pointer"
                  style={{
                    width: i === activeIdx ? 20 : 6,
                    height: 6,
                    background: i === activeIdx ? accent : border,
                  }}
                  onClick={e => { e.stopPropagation(); setActiveIdx(i) }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
