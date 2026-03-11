"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Business, BusinessDetail, Product, CartItem } from "@/types"
import { buildProductIndexes, parseCartParam, getL } from "@/lib/data"
import { applyPalette, removePalette } from "@/lib/palette"
import { getScheduleStatus } from "@/lib/schedule"
import { useCart } from "@/hooks/useCart"
import { useLang } from "@/hooks/useLang"
import { CartSheet } from "@/components/cart/CartSheet"
import { LangToggle } from "@/components/ui/LangToggle"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Props {
  business: Business
  detail: BusinessDetail
  products: Product[]
  slug: string
}

export function ViewPageClient({ business, detail, products, slug }: Props) {
  const [lang, setLang] = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const indexes = buildProductIndexes(products, "es")
  const { items, add, remove, update, clear, setFromParam, total, count, cartParam, mounted } =
    useCart(slug, indexes.productsById)
  const [loaded, setLoaded] = useState(false)
  const [shared, setShared] = useState(false)

  // Apply business palette
  useEffect(() => {
    applyPalette(detail.palette)
    return () => removePalette()
  }, [detail.palette])

  useEffect(() => {
    if (!loaded && mounted) {
      const c = searchParams.get("c")
      if (c) {
        const parsed = parseCartParam(c, indexes.productsById)
        const cartItems: CartItem[] = parsed.map(({ product, quantity }) => ({
          productId: product.id, quantity,
        }))
        setFromParam(cartItems)
      }
      setLoaded(true)
    }
  }, [loaded, mounted, searchParams, indexes.productsById, setFromParam])

  const shareUrl = typeof window !== "undefined"
    ? window.location.origin + "/view/" + slug + "?c=" + cartParam
    : ""

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: getL(business.name, lang), url: shareUrl })
        return
      } catch {}
    }
    await navigator.clipboard.writeText(shareUrl)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const palette = detail.palette
  const accent = palette?.accent ?? "#f97316"
  const bg = palette?.bg ?? "#0f0f0f"
  const surface = palette?.surface ?? "#1a1a1a"
  const surface2 = palette?.surface2 ?? "#242424"
  const text = palette?.text ?? "#f0ece4"
  const textMuted = palette?.textMuted ?? "#888"
  const border = palette?.border ?? "#2e2e2e"

  const schedStatus = getScheduleStatus(detail.schedule, lang)
  const statusColor = business.unavailable ? "#f97316" : schedStatus.isOpen ? "#22c55e" : "#ef4444"

  const hasLogo = !!business.logo
  const emoji = "🏪"

  return (
    <div className="min-h-screen" style={{ background: bg, color: text }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ background: `color-mix(in srgb, ${bg} 95%, transparent)`, borderColor: border, backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-xl mx-auto px-3 h-14 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 py-2 pr-2 flex-shrink-0 transition-all active:scale-95"
            style={{ color: accent }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          {/* Business logo + name */}
          <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border"
            style={{ background: hasLogo ? surface2 : accent, borderColor: border }}>
            {hasLogo
              ? <img src={business.logo!} alt="" className="w-full h-full object-cover" />
              : <span className="text-sm">{emoji}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm truncate" style={{ fontFamily: 'var(--font-display)', color: text }}>
              {getL(business.name, lang)}
            </p>
            <p className="text-[10px] leading-none" style={{ color: statusColor }}>
              {schedStatus.label}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
              style={{ background: shared ? '#22c55e' : surface2, color: shared ? 'white' : textMuted }}
              title={lang === "es" ? "Compartir pedido" : "Share order"}
            >
              {shared
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4"><path d="M20 6L9 17l-5-5"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
              }
            </button>
            <LangToggle lang={lang} setLang={setLang} />
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Order summary card */}
        <div className="rounded-2xl overflow-hidden border mb-4"
          style={{ background: surface, borderColor: border }}>
          <div className="px-5 py-3 border-b flex items-center justify-between"
            style={{ borderColor: border }}>
            <div>
              <h1 className="font-black text-base" style={{ fontFamily: 'var(--font-display)', color: text }}>
                {lang === "es" ? "Pedido compartido" : "Shared order"}
              </h1>
              <p className="text-xs" style={{ color: textMuted }}>
                {count} {lang === "es" ? "items" : "items"} · ${total.toFixed(2)}
              </p>
            </div>
          </div>
          <div style={{ minHeight: 200 }}>
            <CartSheet
              items={items}
              productsById={indexes.productsById}
              business={detail}
              businessName={getL(business.name, lang)}
              slug={slug}
              lang={lang}
              cartParam={cartParam}
              total={total}
              onUpdate={update}
              onRemove={remove}
              onClear={clear}
              onClose={() => {}}
              donationsEnabled={!!detail.donationsEnabled}
            />
          </div>
        </div>

        <Link href={"/" + slug}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all active:scale-95"
          style={{ background: accent, color: 'white' }}>
          + {lang === "es" ? "Agregar más productos" : "Add more products"}
        </Link>
      </div>
    </div>
  )
}
