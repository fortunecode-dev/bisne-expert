"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Business, BusinessDetail } from "@/types";
import { applyHomeTheme } from "@/lib/palette";
import { isOpenNow } from "@/lib/schedule";
import { BusinessCard } from "@/components/business/BusinessCard";
import { LangToggle } from "@/components/ui/LangToggle";
import { MarqueeBanner } from "@/components/ui/MarqueeBanner";
import { useLang } from "@/hooks/useLang";
import Link from "next/link";

// ─── Dev Contact Modal ────────────────────────────────────────────────────────
function DevContactModal({
  dev,
  onClose,
}: {
  dev: {
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    telegram?: string;
    website?: string;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-4 animate-slide-up"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="font-black text-lg"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text)",
            }}
          >
            🧑‍💻 {dev.name}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{
              background: "var(--color-surface-2)",
              color: "var(--color-text-muted)",
            }}
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          {dev.email && (
            <a
              href={`mailto:${dev.email}`}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-80"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface-2)",
              }}
            >
              <span className="text-lg">✉️</span>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Email
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {dev.email}
                </p>
              </div>
            </a>
          )}
          {dev.whatsapp && (
            <a
              href={`https://wa.me/${dev.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#25d366", color: "white" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <div>
                <p className="text-xs opacity-80">WhatsApp</p>
                <p className="text-sm font-bold">+{dev.whatsapp}</p>
              </div>
            </a>
          )}
          {dev.telegram && (
            <a
              href={`https://t.me/${dev.telegram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: "#2ca5e0", color: "white" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              <div>
                <p className="text-xs opacity-80">Telegram</p>
                <p className="text-sm font-bold">{dev.telegram}</p>
              </div>
            </a>
          )}
          {dev.website && (
            <a
              href={dev.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-80"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface-2)",
              }}
            >
              <span className="text-lg">🌐</span>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Web
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-accent)" }}
                >
                  {dev.website}
                </p>
              </div>
            </a>
          )}
          {dev.phone && (
            <a
              href={`tel:${dev.phone}`}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-80"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface-2)",
              }}
            >
              <span className="text-lg">📞</span>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Teléfono
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {dev.phone}
                </p>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap"
      style={
        active
          ? {
              background: "var(--color-accent)",
              color: "white",
              borderColor: "var(--color-accent)",
            }
          : {
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              borderColor: "var(--color-border)",
            }
      }
    >
      {children}
    </button>
  );
}



// ─── Main client component (receives data from server) ────────────────────────
interface HomeClientProps {
  initialBusinesses: Business[]
  initialDetails: Record<string, BusinessDetail>
  initialConfig: any
}

export default function HomeClient({ initialBusinesses, initialDetails, initialConfig }: HomeClientProps) {
  const [lang, setLang] = useLang()
  const [businesses] = useState<Business[]>(initialBusinesses)
  const [details] = useState<Record<string, BusinessDetail>>(initialDetails)
  const [config] = useState<any>(initialConfig)
  const [showDevContact, setShowDevContact] = useState(false)
  const [promotedProducts, setPromotedProducts] = useState<Array<{biz: Business; product: any}>>([])

  // Fetch promoted products from premium businesses
  useEffect(() => {
    const premiumBiz = businesses.filter(b => b.premium)
    if (premiumBiz.length === 0) return
    Promise.all(
      premiumBiz.map(biz =>
        fetch(`/api/data?file=${biz.slug}-products`)
          .then(r => r.ok ? r.json() : { products: [] })
          .then(data => (data.products ?? [])
            .filter((p: any) => p.promote && p.promote !== 'NO' && !p.hidden)
            .map((p: any) => ({ biz, product: p }))
          )
          .catch(() => [])
      )
    ).then(results => setPromotedProducts(results.flat()))
  }, [businesses])

  // Apply theme from config on mount
  useEffect(() => {
    if (config?.homePalette) applyHomeTheme(config.homePalette)
  }, [])

  // Filters
  const [search, setSearch] = useState("")
  const [filterOpen, setFilterOpen] = useState<boolean | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterProvince, setFilterProvince] = useState<string | null>(null)
  const [filterMunicipality, setFilterMunicipality] = useState<string | null>(null)
  const [filterPayment, setFilterPayment] = useState<string | null>(null)

  // Derive filter options from available data
  const allCategories = useMemo(() => {
    const s = new Set<string>();
    businesses.forEach((b) => (b.categories ?? []).forEach((c) => s.add(c)));
    return Array.from(s).sort();
  }, [businesses]);

  const allProvinces = useMemo(() => {
    const s = new Set<string>();
    businesses.forEach((b) => {
      const d = details[b.slug];
      if (d?.province) s.add(d.province);
    });
    return Array.from(s).sort();
  }, [businesses, details]);

  const allMunicipalities = useMemo(() => {
    const s = new Set<string>();
    businesses.forEach((b) => {
      const d = details[b.slug];
      if (d?.municipality && (!filterProvince || d.province === filterProvince))
        s.add(d.municipality);
    });
    return Array.from(s).sort();
  }, [businesses, details, filterProvince]);

  const allPayments = useMemo(() => {
    const s = new Set<string>();
    businesses.forEach((b) => {
      const d = details[b.slug];
      (d?.paymentMethods ?? []).forEach((p) => s.add(p));
    });
    return Array.from(s).sort();
  }, [businesses, details]);

  const PM_LABELS: Record<string, string> = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
    crypto: "Cripto",
    paypal: "PayPal",
  };

  // Sort: premium > sponsored > common
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return businesses
      .sort((a, b) => {
        const tierA = a.premium ? 2 : a.sponsored ? 1 : 0;
        const tierB = b.premium ? 2 : b.sponsored ? 1 : 0;
        return tierB - tierA;
      })
      .filter((biz) => {
        const d = details[biz.slug];
        // Search
        if (q) {
          const name = (biz.name.es + " " + biz.name.en).toLowerCase();
          const desc = (
            (biz.description?.es ?? "") +
            " " +
            (biz.description?.en ?? "")
          ).toLowerCase();
          const addr = (
            (d?.address?.es ?? "") +
            " " +
            (d?.address?.en ?? "")
          ).toLowerCase();
          if (!name.includes(q) && !desc.includes(q) && !addr.includes(q))
            return false;
        }
        // Open/Closed
        if (filterOpen !== null) {
          const open = isOpenNow(d?.schedule);
          if (filterOpen !== open) return false;
        }
        // Category
        if (filterCategory && !(biz.categories ?? []).includes(filterCategory))
          return false;
        // Province
        if (filterProvince && d?.province !== filterProvince) return false;
        // Municipality
        if (filterMunicipality && d?.municipality !== filterMunicipality)
          return false;
        // Payment
        if (filterPayment && !(d?.paymentMethods ?? []).includes(filterPayment))
          return false;
        return true;
      });
  }, [
    businesses,
    details,
    search,
    filterOpen,
    filterCategory,
    filterProvince,
    filterMunicipality,
    filterPayment,
  ]);

  const hasFilters =
    search ||
    filterOpen !== null ||
    filterCategory ||
    filterProvince ||
    filterMunicipality ||
    filterPayment;
  const clearFilters = () => {
    setSearch("");
    setFilterOpen(null);
    setFilterCategory(null);
    setFilterProvince(null);
    setFilterMunicipality(null);
    setFilterPayment(null);
  };

  const dev = config?.developer ?? {};

  // Build marquee items: configured items + promoted products from premium businesses
  const marqueeItems = useMemo(() => {
    const configured = (config?.marqueeItems ?? []) as Array<{slug: string; promoType: string; active: boolean}>
    const items: any[] = []

    // Admin-configured business items
    if (configured.length > 0) {
      configured
        .filter(m => m.active !== false)
        .forEach(m => {
          const biz = businesses.find(b => b.slug === m.slug)
          if (!biz) return
          items.push({ biz, detail: details[m.slug], promo: { ...m, promoType: m.promoType as any } })
        })
    } else {
      // Auto: sponsored/premium businesses
      const featured = businesses.filter(b => b.sponsored || b.premium)
      const pool = featured.length >= 3 ? featured : businesses.slice(0, 8)
      pool.forEach(biz => items.push({ biz, detail: details[biz.slug] }))
    }

    // Add promoted products from premium businesses (interleaved)
    promotedProducts.forEach(({ biz, product }) => {
      items.push({
        biz,
        detail: details[biz.slug],
        promo: { promoType: product.promote },
        productName: (lang === 'es' ? product.name?.es : product.name?.en) || product.name?.es,
        productImage: product.image,
      })
    })

    return items
  }, [businesses, details, config, promotedProducts, lang])

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* ── Header with sticky marquee ── */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl">🏪</span>
            <span
              className="font-black text-lg"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text)",
              }}
            >
              CatalogOS
            </span>
          </div>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
        {/* Marquee below nav — always visible at top */}
        {marqueeItems.length > 0 && (
          <div className="border-t" style={{ borderColor: "var(--color-border)" }}>
            <MarqueeBanner items={marqueeItems} lang={lang} size="lg" />
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-accent)" }}
        >
          {lang === "es" ? "Catálogos digitales" : "Digital catalogs"}
        </p>
        <h1
          className="text-3xl md:text-5xl font-black mb-3 leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text)",
          }}
        >
          {lang === "es" ? "Descubre los " : "Discover the "}
          <span style={{ color: "var(--color-accent)" }}>
            {lang === "es" ? "mejores negocios" : "best businesses"}
          </span>
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {lang === "es"
            ? "Navega catálogos, agrega productos y pide por WhatsApp."
            : "Browse catalogs, add products and order via WhatsApp."}
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="max-w-5xl mx-auto px-4 mb-4">
        <div className="relative">
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: "var(--color-text-muted)" }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === "es"
                ? "Buscar por nombre, descripción o dirección…"
                : "Search by name, description or address…"
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border text-sm outline-none transition-all"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* Open/Closed */}
          <Chip
            active={filterOpen === true}
            onClick={() => setFilterOpen(filterOpen === true ? null : true)}
          >
            🟢 {lang === "es" ? "Abiertos" : "Open"}
          </Chip>
          <Chip
            active={filterOpen === false}
            onClick={() => setFilterOpen(filterOpen === false ? null : false)}
          >
            🔴 {lang === "es" ? "Cerrados" : "Closed"}
          </Chip>

          {/* Divider */}
          {allCategories.length > 0 && (
            <div
              className="w-px flex-shrink-0"
              style={{ background: "var(--color-border)" }}
            />
          )}

          {/* Categories */}
          {allCategories.map((cat) => (
            <Chip
              key={cat}
              active={filterCategory === cat}
              onClick={() =>
                setFilterCategory(filterCategory === cat ? null : cat)
              }
            >
              {cat}
            </Chip>
          ))}

          {/* Provinces */}
          {allProvinces.length > 0 && (
            <div
              className="w-px flex-shrink-0"
              style={{ background: "var(--color-border)" }}
            />
          )}
          {allProvinces.map((prov) => (
            <Chip
              key={prov}
              active={filterProvince === prov}
              onClick={() => {
                setFilterProvince(filterProvince === prov ? null : prov);
                setFilterMunicipality(null);
              }}
            >
              📍 {prov}
            </Chip>
          ))}

          {/* Municipalities (only if province selected) */}
          {filterProvince &&
            allMunicipalities.map((mun) => (
              <Chip
                key={mun}
                active={filterMunicipality === mun}
                onClick={() =>
                  setFilterMunicipality(filterMunicipality === mun ? null : mun)
                }
              >
                🏘️ {mun}
              </Chip>
            ))}

          {/* Payments */}
          {allPayments.length > 0 && (
            <div
              className="w-px flex-shrink-0"
              style={{ background: "var(--color-border)" }}
            />
          )}
          {allPayments.map((pm) => (
            <Chip
              key={pm}
              active={filterPayment === pm}
              onClick={() => setFilterPayment(filterPayment === pm ? null : pm)}
            >
              💳 {PM_LABELS[pm] ?? pm}
            </Chip>
          ))}

          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ml-1 transition-all hover:opacity-80"
              style={{
                borderColor: "#dc262640",
                color: "#f87171",
                background: "#dc262610",
              }}
            >
              ✕ {lang === "es" ? "Limpiar" : "Clear"}
            </button>
          )}
        </div>
      </div>

      {/* ── Business grid ── */}
      <main className="max-w-5xl mx-auto px-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--color-text-muted)" }}
          >
            {filtered.length} {lang === "es" ? "negocios" : "businesses"}
            {hasFilters && (
              <span className="ml-2 text-yellow-500">· filtrado</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((biz) => (
            <div key={biz.id} className="relative">
              {/* Sponsored badge */}
              {biz.sponsored && (
                <div
                  className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm"
                  style={{
                    background: "var(--color-accent)",
                    color: "white",
                    fontSize: 10,
                  }}
                >
                  ⭐ {lang === "es" ? "Patrocinado" : "Sponsored"}
                </div>
              )}
              <BusinessCard
                business={biz}
                detail={details[biz.slug]}
                lang={lang}
              />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div
            className="text-center py-24"
            style={{ color: "var(--color-text-muted)" }}
          >
            <div className="text-6xl mb-4 opacity-20">🔍</div>
            <p
              className="font-semibold text-lg mb-2"
              style={{ color: "var(--color-text)" }}
            >
              {lang === "es" ? "Sin resultados" : "No results found"}
            </p>
            <p className="text-sm mb-4">
              {lang === "es"
                ? "Prueba con otros filtros o términos de búsqueda"
                : "Try different filters or search terms"}
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              {lang === "es" ? "Ver todos" : "Show all"}
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        className="border-t py-10"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              {lang === "es" ? "Desarrollado por" : "Developed by"}
            </p>
            <p className="font-bold text-sm mb-3" style={{ color: "var(--color-text)" }}>
              {dev.name || "Dev Studio"}
            </p>
            <button
              onClick={() => setShowDevContact(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-80 active:scale-95"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
                background: "var(--color-surface)",
              }}
            >
              💬 {lang === "es" ? "Contactar" : "Contact"}
            </button>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-3">
            <Link
              href="/planes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
              style={{
                borderColor: "var(--color-accent)",
                color: "var(--color-accent)",
                background: "var(--color-accent)" + "10",
              }}
            >
              💎 {lang === "es" ? "Ver planes" : "View plans"}
            </Link>
            <Link
              href="/registrar"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "var(--color-accent)",
                color: "white",
              }}
            >
              🏪 {lang === "es" ? "Registrar mi negocio" : "Register my business"}
            </Link>
          </div>
        </div>
      </footer>

      {showDevContact && config?.developer && (
        <DevContactModal
          dev={config.developer}
          onClose={() => setShowDevContact(false)}
        />
      )}
    </div>
  );
}
