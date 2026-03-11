'use client'
import Link from 'next/link'
import { Business, BusinessDetail, Lang } from '@/types'
import { getL } from '@/lib/data'
import { getScheduleStatus } from '@/lib/schedule'
import { DEFAULT_PALETTE } from '@/types'

function getDefaultEmoji(slug: string, name?: string): string {
  const s = (slug + ' ' + (name ?? '')).toLowerCase()
  if (s.match(/burger|hambur/)) return '🍔'
  if (s.match(/pizza/)) return '🍕'
  if (s.match(/sushi|japones|japon/)) return '🍣'
  if (s.match(/taco|mexic/)) return '🌮'
  if (s.match(/coffee|cafe|café/)) return '☕'
  if (s.match(/bar|bebid|drink|cervez/)) return '🍺'
  if (s.match(/bakery|panad|pastele/)) return '🥐'
  if (s.match(/helad|ice.?cream/)) return '🍦'
  if (s.match(/pollo|chicken/)) return '🍗'
  if (s.match(/pasta|italian/)) return '🍝'
  if (s.match(/pesc|seafood|marin/)) return '🐟'
  if (s.match(/vegan|veggie|ensalad/)) return '🥗'
  if (s.match(/chin|asian|wok/)) return '🥡'
  if (s.match(/grill|bbq|asad|carne/)) return '🥩'
  if (s.match(/dulce|dessert|postre|cake|torta/)) return '🍰'
  if (s.match(/farma|pharmac/)) return '💊'
  if (s.match(/flor|flower/)) return '🌸'
  if (s.match(/beauty|salon|spa/)) return '💄'
  if (s.match(/tech|electr|comput/)) return '💻'
  if (s.match(/ropa|cloth|fashion|moda/)) return '👕'
  if (s.match(/fruta|fruit|verdur/)) return '🥬'
  if (s.match(/super|mercado|tienda/)) return '🛒'
  if (s.match(/ferret|tool|herram/)) return '🔧'
  if (s.match(/libro|book|papele/)) return '📚'
  if (s.match(/joyeri|jewel/)) return '💍'
  if (s.match(/mascot|pet/)) return '🐾'
  return '🏪'
}

const PAYMENT_LABELS: Record<string, { es: string; en: string; icon: string }> = {
  cash:     { es: 'Efectivo',       en: 'Cash',     icon: '💵' },
  transfer: { es: 'Transferencia',  en: 'Transfer', icon: '📲' },
  card:     { es: 'Tarjeta',        en: 'Card',     icon: '💳' },
  crypto:   { es: 'Cripto',         en: 'Crypto',   icon: '₿'  },
  paypal:   { es: 'PayPal',         en: 'PayPal',   icon: '🅿️' },
}

interface Props {
  business: Business
  detail?: BusinessDetail
  lang: Lang
}

export function BusinessCard({ business, detail, lang }: Props) {
  const palette = detail?.palette ?? DEFAULT_PALETTE
  const { accent, bg, surface, surface2, text, textMuted, priceColor, border } = palette

  const status = getScheduleStatus(detail?.schedule, lang)
  const hasLogo = !!business.logo
  const hasCover = !!business.image
  const location = [detail?.municipality, detail?.province].filter(Boolean).join(', ')
  const payments = detail?.paymentMethods ?? []
  const emoji = getDefaultEmoji(business.slug, business.name?.es)

  // Status color
  const statusColor = business.unavailable
    ? '#f97316'  // orange = unavailable
    : status.isOpen
      ? '#22c55e'  // green = open
      : '#ef4444'  // red = closed
  const statusBg = statusColor + '18'
  const statusBorder = statusColor + '40'
  const statusLabel = business.unavailable
    ? (lang === 'es' ? 'No disponible' : 'Unavailable')
    : status.isOpen
      ? (lang === 'es' ? 'Abierto' : 'Open')
      : (lang === 'es' ? 'Cerrado' : 'Closed')

  const coverBg = `linear-gradient(145deg, ${accent}28 0%, ${surface} 60%, ${bg} 100%)`
  const radialGlow = `radial-gradient(circle at 30% 60%, ${accent}30 0%, transparent 55%), radial-gradient(circle at 75% 25%, ${priceColor}20 0%, transparent 50%)`

  // "Nuevo" badge: less than 7 days since created_at
  const isNew = (() => {
    if (!business.created_at) return false
    const age = Date.now() - new Date(business.created_at).getTime()
    return age < 7 * 24 * 60 * 60 * 1000
  })()

  return (
    <Link
      href={`/${business.slug}`}
      className="group block rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
      style={{
        background: surface,
        border: `1px solid ${isNew ? 'var(--color-accent)' : business.premium ? accent + '60' : accent + '28'}`,
        boxShadow: isNew
          ? `0 4px 32px var(--color-accent, #f97316)30, 0 0 0 1px var(--color-accent, #f97316)40`
          : business.premium ? `0 4px 32px ${accent}20` : `0 4px 32px ${accent}0a`,
      }}
    >
      {/* ── Cover ── */}
      <div className="relative h-40 overflow-hidden" style={{ background: bg }}>
        {hasCover ? (
          <img src={business.image!} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0" style={{ background: coverBg }}>
            <div className="absolute inset-0" style={{ backgroundImage: radialGlow }} />
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 12px)`,
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[100px] select-none transition-transform duration-500 group-hover:scale-110"
                style={{ opacity: 0.12, filter: 'blur(1px)' }}>
                {emoji}
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${surface}, transparent)` }} />

        {/* Tier badges — stacked vertically */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black"
              style={{ background: 'var(--color-accent, #f97316)', color: '#fff', fontSize: 10 }}>
              ✨ {lang === 'es' ? 'Nuevo' : 'New'}
            </div>
          )}
          {(business.premium || business.sponsored) && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black"
              style={{
                background: business.premium ? '#a855f7' : '#eab308',
                color: '#fff', fontSize: 10,
              }}>
              {business.premium ? '💎 Premium' : `⭐ ${lang === 'es' ? 'Patrocinado' : 'Sponsored'}`}
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm"
          style={{ background: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: statusColor, boxShadow: business.unavailable ? 'none' : `0 0 6px ${statusColor}` }} />
          {statusLabel}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-4 -mt-7 relative">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border-2 mb-3 shadow-xl"
          style={{ background: hasLogo ? surface2 : accent, borderColor: surface }}>
          {hasLogo
            ? <img src={business.logo!} alt="" className="w-full h-full object-cover" />
            : <span className="text-2xl">{emoji}</span>
          }
        </div>

        <h2 className="text-base font-black mb-0 leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: text }}>
          {getL(business.name, lang)}
        </h2>

        {/* Slogan */}
        {business.slogan && (
          <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: accent }}>
            {getL(business.slogan, lang)}
          </p>
        )}

        {business.description && (
          <p className="text-xs leading-relaxed line-clamp-2 mb-3 mt-0.5" style={{ color: textMuted }}>
            {getL(business.description, lang)}
          </p>
        )}

        {location && (
          <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: textMuted }}>
            <span>📍</span>
            <span className="truncate">{location}</span>
          </div>
        )}

        {payments.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs mb-3 flex-wrap">
            <span style={{ color: textMuted }}>💳</span>
            {payments.map((pm) => {
              const info = PAYMENT_LABELS[pm]
              return info ? (
                <span key={pm} className="px-2 py-0.5 rounded-full border text-xs"
                  style={{ borderColor: `${accent}30`, background: `${accent}0e`, color: text, fontSize: 10 }}>
                  {info.icon} {lang === 'es' ? info.es : info.en}
                </span>
              ) : null
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold transition-all duration-200 group-hover:gap-2.5"
            style={{ color: accent }}>
            {lang === 'es' ? 'Ver catálogo' : 'View catalog'}
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, opacity: 0.35 }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: priceColor, opacity: 0.35 }} />
          </div>
        </div>
      </div>
    </Link>
  )
}
