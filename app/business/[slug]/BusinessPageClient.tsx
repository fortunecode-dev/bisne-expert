"use client";
import { useState, useEffect } from "react";
import {
  Business,
  BusinessDetail,
  Product,
  Lang,
  WEEKDAYS,
  PaymentMethodDetail,
} from "@/types";
import { buildProductIndexes, getL } from "@/lib/data";
import { applyPalette, removePalette } from "@/lib/palette";
import { getScheduleStatus, DAY_NAMES_ES, DAY_NAMES_EN } from "@/lib/schedule";
import { useCart } from "@/hooks/useCart";
import { useLang } from "@/hooks/useLang";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryFilter } from "@/components/product/CategoryFilter";
import { CartButton } from "@/components/cart/CartButton";
import { CartSheet } from "@/components/cart/CartSheet";
import { LangToggle } from "@/components/ui/LangToggle";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Default emoji ─────────────────────────────────────────────────────────────
function getDefaultEmoji(slug: string, name?: string): string {
  const s = (slug + " " + (name ?? "")).toLowerCase();
  if (s.match(/burger|hambur/)) return "🍔";
  if (s.match(/pizza/)) return "🍕";
  if (s.match(/sushi|japon/)) return "🍣";
  if (s.match(/taco|mexic/)) return "🌮";
  if (s.match(/coffee|cafe|café/)) return "☕";
  if (s.match(/bar|bebid|drink|cervez/)) return "🍺";
  if (s.match(/bakery|panad/)) return "🥐";
  if (s.match(/helad|ice.?cream/)) return "🍦";
  if (s.match(/pollo|chicken/)) return "🍗";
  if (s.match(/pasta|italian/)) return "🍝";
  if (s.match(/pesc|seafood/)) return "🐟";
  if (s.match(/vegan|veggie/)) return "🥗";
  if (s.match(/chin|asian|wok/)) return "🥡";
  if (s.match(/grill|bbq|asad/)) return "🥩";
  if (s.match(/dulce|dessert|postre/)) return "🍰";
  return "🏪";
}

// ─── Real social icons (SVG) ──────────────────────────────────────────────────
const SOCIAL: Record<
  string,
  { bg: string; fg: string; svg: string; label: string }
> = {
  instagram: {
    bg: "#e1306c",
    fg: "#fff",
    label: "Instagram",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
  },
  facebook: {
    bg: "#1877f2",
    fg: "#fff",
    label: "Facebook",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  },
  telegram: {
    bg: "#2ca5e0",
    fg: "#fff",
    label: "Telegram",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  },
  twitter: {
    bg: "#000",
    fg: "#fff",
    label: "X / Twitter",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.841L1.254 2.25H8.08l4.259 5.63L18.243 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  },
  whatsapp: {
    bg: "#25d366",
    fg: "#fff",
    label: "WhatsApp",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  },
  tiktok: {
    bg: "#010101",
    fg: "#fff",
    label: "TikTok",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  },
  youtube: {
    bg: "#ff0000",
    fg: "#fff",
    label: "YouTube",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>',
  },
  linkedin: {
    bg: "#0a66c2",
    fg: "#fff",
    label: "LinkedIn",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  },
};

// ─── Payment method names ──────────────────────────────────────────────────────
const PM_ES: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  crypto: "Criptomoneda",
  paypal: "PayPal",
  zelle: "Zelle",
  custom: "Otro",
};
const PM_EN: Record<string, string> = {
  cash: "Cash",
  transfer: "Bank Transfer",
  card: "Card",
  crypto: "Crypto",
  paypal: "PayPal",
  zelle: "Zelle",
  custom: "Other",
};

// ─── Schedule modal ───────────────────────────────────────────────────────────
function ScheduleModal({
  schedule,
  lang,
  onClose,
}: {
  schedule: any;
  lang: Lang;
  onClose: () => void;
}) {
  const names = lang === "es" ? DAY_NAMES_ES : DAY_NAMES_EN;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl animate-slide-up p-6 flex flex-col gap-4"
        style={{
          background: "var(--biz-surface)",
          border: "1px solid var(--biz-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="font-black text-lg"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--biz-text)",
            }}
          >
            🕐 {lang === "es" ? "Horario completo" : "Full schedule"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "var(--biz-surface2)",
              color: "var(--biz-text-muted)",
            }}
          >
            ✕
          </button>
        </div>
        {schedule?.alwaysOpen ? (
          <p
            className="font-bold text-center py-4"
            style={{ color: "var(--biz-accent)" }}
          >
            ⚡ 24/7 {lang === "es" ? "Siempre abierto" : "Always open"}
          </p>
        ) : (
          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const ds = schedule?.days?.[day];
              const isClosed = !ds || ds.closed;
              const dayName = names[day];
              return (
                <div
                  key={day}
                  className="flex items-center justify-between p-2.5 rounded-xl"
                  style={{ background: "var(--biz-surface2)" }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: isClosed
                        ? "var(--biz-text-muted)"
                        : "var(--biz-text)",
                    }}
                  >
                    {dayName}
                  </span>
                  {isClosed ? (
                    <span className="text-xs font-bold text-red-400">
                      {lang === "es" ? "Cerrado" : "Closed"}
                    </span>
                  ) : ds.h24 ? (
                    <span
                      className="text-xs font-bold"
                      style={{ color: "var(--biz-accent)" }}
                    >
                      24h
                    </span>
                  ) : (
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--biz-text)" }}
                    >
                      {ds.open} – {ds.close}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QR / Donation modal ──────────────────────────────────────────────────────
function DonationModal({
  cardNumber,
  phone,
  onClose,
}: {
  cardNumber: string;
  phone: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl animate-slide-up p-6 flex flex-col gap-4"
        style={{
          background: "var(--biz-surface)",
          border: "1px solid var(--biz-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="font-black text-lg"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--biz-text)",
            }}
          >
            💛 Propina / Donación
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "var(--biz-surface2)",
              color: "var(--biz-text-muted)",
            }}
          >
            ✕
          </button>
        </div>
        <p className="text-sm" style={{ color: "var(--biz-text-muted)" }}>
          Escanea con TRANSFERMOVIL o copia los datos:
        </p>
        {/* QR visual (inline SVG-based QR representation) */}
        <div
          className="flex flex-col items-center gap-3 p-4 rounded-2xl"
          style={{
            background: "var(--biz-surface2)",
            border: "1px solid var(--biz-border)",
          }}
        >
          <div className="w-40 h-40 rounded-2xl bg-white flex items-center justify-center p-2">
            {/* SVG QR-like pattern for visual */}
            <svg
              viewBox="0 0 41 41"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="41" height="41" fill="white" />
              {/* Top-left finder */}
              <rect x="1" y="1" width="9" height="9" rx="1" fill="#000" />
              <rect x="2" y="2" width="7" height="7" rx="0.5" fill="white" />
              <rect x="3" y="3" width="5" height="5" rx="0.5" fill="#000" />
              {/* Top-right finder */}
              <rect x="31" y="1" width="9" height="9" rx="1" fill="#000" />
              <rect x="32" y="2" width="7" height="7" rx="0.5" fill="white" />
              <rect x="33" y="3" width="5" height="5" rx="0.5" fill="#000" />
              {/* Bottom-left finder */}
              <rect x="1" y="31" width="9" height="9" rx="1" fill="#000" />
              <rect x="2" y="32" width="7" height="7" rx="0.5" fill="white" />
              <rect x="3" y="33" width="5" height="5" rx="0.5" fill="#000" />
              {/* Data dots */}
              {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((x, i) =>
                [12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((y, j) =>
                  (i + j + cardNumber.length) % 3 === 0 &&
                  !(x < 11 && y < 11) &&
                  !(x > 30 && y < 11) &&
                  !(x < 11 && y > 30) ? (
                    <rect
                      key={`${x}${y}`}
                      x={x}
                      y={y}
                      width="2"
                      height="2"
                      fill="#000"
                      rx="0.3"
                    />
                  ) : null,
                ),
              )}
              {/* Center icon placeholder */}
              <rect x="17" y="17" width="7" height="7" rx="1" fill="white" />
              <rect
                x="18"
                y="18"
                width="5"
                height="5"
                rx="0.5"
                fill="#000"
                opacity="0.8"
              />
            </svg>
          </div>
          <p
            className="text-xs text-center font-mono break-all opacity-60"
            style={{ color: "var(--biz-text)" }}
          >
            TRANSFERMOVIL · {cardNumber}
          </p>
        </div>
        {/* Data rows */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => copy(cardNumber)}
            className="p-3 rounded-xl text-left transition-all active:scale-95"
            style={{
              background: "var(--biz-surface2)",
              border: "1px solid var(--biz-border)",
            }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: "var(--biz-text-muted)" }}
            >
              💳 Tarjeta
            </p>
            <p
              className="font-bold text-xs font-mono break-all"
              style={{ color: "var(--biz-text)" }}
            >
              {cardNumber}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--biz-accent)" }}>
              tap para copiar
            </p>
          </button>
          <button
            onClick={() => copy(phone)}
            className="p-3 rounded-xl text-left transition-all active:scale-95"
            style={{
              background: "var(--biz-surface2)",
              border: "1px solid var(--biz-border)",
            }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: "var(--biz-text-muted)" }}
            >
              📞 Teléfono
            </p>
            <p
              className="font-bold text-sm font-mono"
              style={{ color: "var(--biz-text)" }}
            >
              {phone}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--biz-accent)" }}>
              tap para copiar
            </p>
          </button>
        </div>
        {copied && (
          <div
            className="text-center text-xs font-bold py-1.5 rounded-xl animate-pulse"
            style={{ background: "var(--biz-accent)", color: "white" }}
          >
            ✓ Copiado al portapapeles
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  business: Business;
  detail: BusinessDetail;
  products: Product[];
  slug: string;
  isPreview?: boolean;
  isOwner?: boolean;
  appConfig?: any;
}

export function BusinessPageClient({
  business,
  detail,
  products,
  slug,
  isPreview = false,
  isOwner = false,
  appConfig,
}: Props) {
  const [lang, setLang] = useLang();
  const indexes = buildProductIndexes(products, "es");
  const {
    items,
    add,
    remove,
    update,
    clear,
    total,
    count,
    cartParam,
    mounted,
  } = useCart(slug, indexes.productsById);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFeatured, setShowFeatured] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [shared, setShared] = useState(false);
  const [coverIdx, setCoverIdx] = useState(0);
  // Preview auth gate
  const [previewAuthed, setPreviewAuthed] = useState(false);
  const [previewPwd, setPreviewPwd] = useState("");
  const [previewPwdVisible, setPreviewPwdVisible] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  // Multiple addresses modal
  const [showAddresses, setShowAddresses] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPromoCode = searchParams?.get("code") ?? undefined;

  // Apply business palette
  useEffect(() => {
    applyPalette(detail.palette);
    return () => removePalette();
  }, [detail.palette]);

  // Cover slideshow for premium businesses
  const coverImages = (business.coverImages ?? []).filter(Boolean);
  const allCovers = [business.image, ...coverImages].filter(
    Boolean,
  ) as string[];
  useEffect(() => {
    if (allCovers.length <= 1) return;
    const t = setInterval(
      () => setCoverIdx((i) => (i + 1) % allCovers.length),
      4000,
    );
    return () => clearInterval(t);
  }, [allCovers.length]);

  // Track scroll for header
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const palette = detail.palette;
  const accent = palette?.accent ?? "#f97316";
  const bg = palette?.bg ?? "#0f0f0f";
  const surface = palette?.surface ?? "#1a1a1a";
  const surface2 = palette?.surface2 ?? "#242424";
  const text = palette?.text ?? "#f0ece4";
  const textMuted = palette?.textMuted ?? "#888";
  const border = palette?.border ?? "#2e2e2e";

  const schedStatus = getScheduleStatus(detail.schedule, lang);
  const isOpen = schedStatus.isOpen;
  const emoji = getDefaultEmoji(slug, business.name?.es);

  // Status colors: green=open, red=closed, orange=unavailable
  const statusColor = business.unavailable
    ? "#f97316"
    : isOpen
      ? "#22c55e"
      : "#ef4444";
  const statusLabel = business.unavailable
    ? lang === "es"
      ? "No disponible"
      : "Unavailable"
    : schedStatus.label;

  const catLang = indexes.allCategories.map((catEs) => {
    const prod = products.find((p) => p.category.es === catEs);
    return prod ? getL(prod.category, lang) : catEs;
  });
  let filtered = [...products].sort(
    (a, b) => (a.position ?? 99) - (b.position ?? 99),
  );
  if (showFeatured) filtered = filtered.filter((p) => p.featured);
  else if (selectedCategory)
    filtered = filtered.filter(
      (p) => getL(p.category, lang) === selectedCategory,
    );
  if (productSearch.trim()) {
    const q = productSearch.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        getL(p.name, lang).toLowerCase().includes(q) ||
        getL(p.description, lang).toLowerCase().includes(q) ||
        getL(p.category, lang).toLowerCase().includes(q),
    );
  }
  const cartMap = new Map(items.map((i) => [i.productId, i.quantity]));

  // Share handler
  const handleShare = async () => {
    const url = window.location.href;
    const title = getL(business.name, lang);
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };
  const hasLogo = !!business.logo;
  const hasCover = !!business.image;
  const location = [detail.municipality, detail.province]
    .filter(Boolean)
    .join(", ");

  // Header opacity/blur: 0-200px scroll → transparent to tinted solid
  const headerProgress = Math.min(scrollY / 200, 1);
  const headerBg = `color-mix(in srgb, ${bg} ${Math.round(headerProgress * 96)}%, transparent)`;
  const headerBlur = `blur(${Math.round(headerProgress * 16)}px)`;
  const headerBorder = headerProgress > 0.5 ? border : "transparent";

  // Preview auth gate: show password prompt if not yet authed
  // Auto-auth if they have a valid token cookie (set after login)
  useEffect(() => {
    if (isPreview && !previewAuthed) {
      // Check session via API (handles both cookie + token)
      fetch(`/api/biz-session?slug=${slug}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.authed) setPreviewAuthed(true);
        })
        .catch(() => {});
    }
  }, [isPreview, slug]);

  const handlePreviewLogin = async () => {
    setPreviewLoading(true);
    setPreviewError("");
    const res = await fetch("/api/biz-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, password: previewPwd }),
    });
    if (res.ok) {
      setPreviewAuthed(true);
    } else {
      setPreviewError(
        lang === "es" ? "Contraseña incorrecta" : "Wrong password",
      );
    }
    setPreviewLoading(false);
  };

  if (isPreview && !previewAuthed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: bg }}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-8 space-y-5 border"
          style={{ background: surface, borderColor: border }}
        >
          <div className="text-center">
            <div className="text-5xl mb-3">👁️</div>
            <h1 className="text-xl font-black" style={{ color: text }}>
              {lang === "es" ? "Vista previa privada" : "Private preview"}
            </h1>
            <p className="text-xs mt-1" style={{ color: textMuted }}>
              {lang === "es"
                ? "Este negocio está pendiente de aprobación. Ingresa tu contraseña para ver la vista previa."
                : "This business is pending approval. Enter your password to preview."}
            </p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={previewPwdVisible ? "text" : "password"}
                value={previewPwd}
                onChange={(e) => setPreviewPwd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePreviewLogin()}
                placeholder={lang === "es" ? "Tu contraseña" : "Your password"}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none pr-10"
                style={{
                  background: surface2,
                  borderColor: border,
                  color: text,
                }}
              />
              <button
                type="button"
                onClick={() => setPreviewPwdVisible((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100"
                style={{ color: textMuted }}
              >
                {previewPwdVisible ? "🙈" : "👁️"}
              </button>
            </div>
            {previewError && (
              <p className="text-xs text-red-400 text-center">{previewError}</p>
            )}
            <button
              onClick={handlePreviewLogin}
              disabled={previewLoading || !previewPwd}
              className="w-full py-3 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: accent, color: "white" }}
            >
              {previewLoading
                ? "⏳…"
                : lang === "es"
                  ? "Ver mi negocio →"
                  : "Preview →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="biz-page" style={{ background: bg, color: text }}>
      {/* ── Preview banner + Edit button ── */}
      {isPreview && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl border text-sm font-bold"
            style={{
              background: "#eab308",
              color: "#1a1400",
              borderColor: "#ca9a00",
            }}
          >
            👁️{" "}
            {lang === "es"
              ? "Vista previa — pendiente de aprobación"
              : "Preview — pending approval"}
          </div>
          <a
            href={`/editar/${slug}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-black transition-all hover:opacity-90 active:scale-95"
            style={{
              background: accent,
              color: "white",
              boxShadow: `0 8px 30px ${accent}60`,
            }}
          >
            ✏️ {lang === "es" ? "Modificar negocio" : "Edit business"}
          </a>
        </div>
      )}
      {/* ── Sticky header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-200"
        style={{
          background: headerBg,
          backdropFilter: headerBlur,
          WebkitBackdropFilter: headerBlur,
          borderBottom: `1px solid ${headerBorder}`,
        }}
      >
        <div className="max-w-5xl mx-auto px-3 flex flex-col">
          <div className="h-14 flex items-center gap-2">
            {/* iOS-style back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 pl-0 pr-3 py-2 rounded-xl transition-all active:scale-95 flex-shrink-0"
              style={{ color: accent }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="w-5 h-5"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="text-sm font-semibold hidden sm:block">
                {lang === "es" ? "Atrás" : "Back"}
              </span>
            </button>

            {/* Logo + name (appear on scroll) */}
            <div
              className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
              style={{
                opacity: headerProgress,
                transform: `translateY(${(1 - headerProgress) * 6}px)`,
                transition: "all 0.2s",
              }}
            >
              {/* Logo pill */}
              <div
                className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border"
                style={{
                  background: hasLogo ? surface2 : accent,
                  borderColor: border,
                }}
              >
                {hasLogo ? (
                  <img
                    src={business.logo!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm">{emoji}</span>
                )}
              </div>
              <div className="min-w-0">
                <a
                  href={`/${slug}`}
                  className="font-bold text-sm leading-tight truncate block hover:opacity-80 transition-all"
                  style={{ fontFamily: "var(--font-display)", color: text }}
                >
                  {getL(business.name, lang)}
                </a>
                <p
                  className="text-[10px] font-semibold leading-none truncate"
                  style={{ color: statusColor }}
                >
                  {statusLabel}
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {/* Product search toggle */}
              <button
                onClick={() => {
                  setShowProductSearch(!showProductSearch);
                  if (showProductSearch) setProductSearch("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{
                  background: showProductSearch
                    ? accent
                    : headerProgress > 0.5
                      ? surface2
                      : "rgba(0,0,0,0.4)",
                  color: showProductSearch
                    ? "white"
                    : headerProgress > 0.5
                      ? textMuted
                      : "#fff",
                }}
                title={lang === "es" ? "Buscar producto" : "Search product"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-4 h-4"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              {/* Share */}
              <button
                onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{
                  background: shared
                    ? "#22c55e"
                    : headerProgress > 0.5
                      ? surface2
                      : "rgba(0,0,0,0.4)",
                  color: shared
                    ? "white"
                    : headerProgress > 0.5
                      ? textMuted
                      : "#fff",
                }}
                title={lang === "es" ? "Compartir" : "Share"}
              >
                {shared ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="w-4 h-4"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-4 h-4"
                  >
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                )}
              </button>
              <LangToggle lang={lang} setLang={setLang} />
            </div>
          </div>

          {/* Product search bar — expands below header */}
          {showProductSearch && (
            <div className="pb-2 px-1">
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: textMuted }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-4 h-4"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <input
                  autoFocus
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={
                    lang === "es" ? "Buscar producto…" : "Search product…"
                  }
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none border"
                  style={{
                    background: surface2,
                    borderColor: border,
                    color: text,
                  }}
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: textMuted }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Cover hero ── */}
      <div className="relative" style={{ background: bg }}>
        <div className="relative h-56 md:h-72 w-full overflow-hidden">
          {allCovers.length > 0 ? (
            <>
              {allCovers.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                  style={{ opacity: i === coverIdx ? 1 : 0 }}
                />
              ))}
              {/* Slideshow dots */}
              {allCovers.length > 1 && (
                <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                  {allCovers.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background:
                          i === coverIdx ? "white" : "rgba(255,255,255,0.4)",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className="w-full h-full relative"
              style={{
                background: `linear-gradient(135deg, ${accent}30 0%, ${bg}ee 60%, ${bg} 100%)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 60%, ${accent} 0%, transparent 55%), radial-gradient(circle at 80% 30%, ${palette?.priceColor ?? "#fbbf24"} 0%, transparent 50%)`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[120px] opacity-15 select-none">
                  {emoji}
                </span>
              </div>
              {/* Subtle grid pattern */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `linear-gradient(${border} 1px, transparent 1px), linear-gradient(90deg, ${border} 1px, transparent 1px)`,
                  backgroundSize: "32px 32px",
                }}
              />
            </div>
          )}
          <div
            className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
            style={{
              background: `linear-gradient(to top, ${bg} 0%, ${bg}cc 25%, transparent 100%)`,
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-28 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
            }}
          />
        </div>

        {/* ── Profile row ── */}
        <div className="relative max-w-5xl mx-auto px-4 -mt-14 pb-4">
          <div className="flex items-end gap-4 mb-4">
            {/* Logo with donation button */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border-4"
                style={{
                  background: hasLogo ? surface2 : accent,
                  borderColor: bg,
                }}
              >
                {hasLogo ? (
                  <img
                    src={business.logo!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">{emoji}</span>
                )}
              </div>
              {/* Donation button near logo */}
              {detail.donationsEnabled && detail.cardNumber && detail.phone && (
                <button
                  onClick={() => setShowDonation(true)}
                  className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full flex items-center justify-center text-base shadow-lg border-2 transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: "#eab308",
                    color: "#1a1400",
                    borderColor: bg,
                  }}
                  title={lang === "es" ? "Dejar propina" : "Leave a tip"}
                >
                  💛
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              {/* Name + status badge inline */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1
                  className="text-2xl md:text-3xl font-black leading-tight"
                  style={{ fontFamily: "var(--font-display)", color: text }}
                >
                  {getL(business.name, lang)}
                </h1>
              </div>
              {business.slogan && (
                <p
                  className="text-xs font-semibold mb-0.5"
                  style={{ color: accent }}
                >
                  {getL(business.slogan, lang)}
                </p>
              )}
              {business.description && (
                <p
                  className="text-sm mb-1 whitespace-pre-line"
                  style={{ color: textMuted }}
                >
                  {getL(business.description, lang)}
                </p>
              )}
              {/* Schedule label below description */}
              {!business.unavailable &&
                schedStatus.label &&
                schedStatus.label !== "24/7" && (
                  <p
                    className="text-xs font-semibold"
                    style={{ color: statusColor }}
                  >
                    🕐 {schedStatus.label}{" "}
                    {!detail.schedule?.alwaysOpen && (
                      <button
                        onClick={() => setShowSchedule(true)}
                        className="font-bold underline-offset-2 hover:underline text-xs ml-0.5 flex-shrink-0"
                        style={{ color: accent }}
                      >
                        {lang === "es" ? "ver más" : "more"}
                      </button>
                    )}
                  </p>
                )}
            </div>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-2 text-xs mb-2">
            {location && (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                style={{
                  borderColor: border,
                  color: textMuted,
                  background: surface,
                }}
              >
                📍 {location}
              </span>
            )}
            {(detail.addresses ?? (detail.address ? [detail.address] : []))
              .length > 0 &&
              (() => {
                const addrs =
                  detail.addresses ?? (detail.address ? [detail.address] : []);
                const first = addrs[0];
                const hasMore = addrs.length > 1;
                return (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: border,
                      color: textMuted,
                      background: surface,
                    }}
                  >
                    🏠 {getL(first, lang)}
                    {hasMore && (
                      <button
                        onClick={() => setShowAddresses(true)}
                        className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all hover:opacity-80"
                        style={{ background: accent + "20", color: accent }}
                      >
                        +{addrs.length - 1} {lang === "es" ? "más" : "more"}
                      </button>
                    )}
                  </span>
                );
              })()}
            {/* Schedule chip */}
            {/* {detail.schedule && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                style={{
                  borderColor: statusColor + "40",
                  color: statusColor,
                  background: statusColor + "10",
                }}
              >
                <span>🕐</span>
                <span className="text-xs">{schedStatus.label}</span>
                {!detail.schedule?.alwaysOpen && (
                  <button
                    onClick={() => setShowSchedule(true)}
                    className="font-bold underline-offset-2 hover:underline text-xs ml-0.5 flex-shrink-0"
                    style={{ color: accent }}
                  >
                    {lang === "es" ? "ver más" : "more"}
                  </button>
                )}
              </div>
            )} */}
            {detail.phone && (
              <a
                href={`tel:+${detail.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border hover:opacity-80"
                style={{
                  borderColor: border,
                  color: textMuted,
                  background: surface,
                }}
              >
                📞 +{detail.phone}
              </a>
            )}
          </div>

          {/* Social links with brand icons */}
          {detail.socialLinks &&
            Object.entries(detail.socialLinks).some(([, v]) => !!v) && (
              <div className="flex gap-2 flex-wrap">
                {Object.entries(detail.socialLinks).map(([key, url]) => {
                  if (!url) return null;
                  const s = SOCIAL[key];
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 hover:scale-105"
                      style={{
                        background: s?.bg ?? "#555",
                        color: s?.fg ?? "#fff",
                      }}
                    >
                      {s && (
                        <span
                          className="w-3.5 h-3.5 flex-shrink-0"
                          dangerouslySetInnerHTML={{
                            __html: s.svg.replace(
                              "<svg ",
                              '<svg width="14" height="14" ',
                            ),
                          }}
                        />
                      )}
                      <span>{s?.label ?? key}</span>
                    </a>
                  );
                })}
              </div>
            )}
          {/* Client instructions */}
          {detail.clientInstructions &&
            (getL(detail.clientInstructions, lang) ||
              detail.clientInstructions.es) && (
              <div
                className="mt-3 p-3 rounded-2xl border"
                style={{ borderColor: border, background: surface }}
              >
                <p className="text-xs font-bold mb-1" style={{ color: accent }}>
                  📋 {lang === "es" ? "Instrucciones" : "Instructions"}
                </p>
                <p
                  className="text-sm whitespace-pre-line"
                  style={{ color: text }}
                >
                  {getL(detail.clientInstructions, lang) ||
                    detail.clientInstructions.es}
                </p>
              </div>
            )}

          {((detail.paymentMethodDetails ?? []).length > 0 ||
            (detail.paymentMethods ?? []).length > 0) &&
            (() => {
              const pmds: PaymentMethodDetail[] = detail.paymentMethodDetails
                ?.length
                ? detail.paymentMethodDetails
                : (detail.paymentMethods ?? []).map((id) => ({ id }));
              const PM = lang === "es" ? PM_ES : PM_EN;
              return (
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: textMuted }}
                  >
                    {lang === "es" ? "Métodos de pago" : "Payment methods"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pmds.map((pmd) => {
                      const lbl = pmd.label || PM[pmd.id] || pmd.id;
                      const mod = pmd.modifier;
                      const hasDiscount = mod !== undefined && mod < 0;
                      const hasSurcharge = mod !== undefined && mod > 0;
                      return (
                        <div
                          key={pmd.id}
                          className="inline-flex flex-col items-start px-2 py-1 rounded-lg border"
                          style={{
                            borderColor: hasDiscount
                              ? "#22c55e40"
                              : hasSurcharge
                                ? "#f9731640"
                                : `${accent}30`,
                            background: hasDiscount
                              ? "#22c55e08"
                              : hasSurcharge
                                ? "#f9731608"
                                : `${accent}08`,
                            width: "fit-content",
                          }}
                        >
                          <span
                            className="text-xs font-semibold whitespace-nowrap"
                            style={{ color: text }}
                          >
                            {lbl}
                          </span>
                          {mod !== undefined && mod !== 0 && (
                            <span
                              className="text-[10px] font-bold whitespace-nowrap"
                              style={{
                                color: hasDiscount ? "#22c55e" : "#f97316",
                              }}
                            >
                              {hasDiscount
                                ? `${Math.abs(mod)}% dto.`
                                : `+${mod}% recargo`}
                            </span>
                          )}
                          {pmd.note && (
                            <span
                              className="text-[10px] opacity-60 whitespace-nowrap"
                              style={{ color: textMuted }}
                            >
                              {pmd.note}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
        </div>
      </div>

      {/* ── Category filter bar ── */}
      <div
        className="sticky z-30 border-b overflow-x-auto"
        style={{
          top: 56,
          borderColor: border,
          background: `color-mix(in srgb, ${bg} 97%, transparent)`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-2.5">
          <CategoryFilter
            categories={catLang}
            selected={selectedCategory}
            onSelect={(cat) => {
              setSelectedCategory(cat);
              setShowFeatured(false);
            }}
            showFeatured={showFeatured}
            onFeaturedToggle={() => {
              setShowFeatured(!showFeatured);
              setSelectedCategory(null);
            }}
            lang={lang}
          />
        </div>
      </div>

      {/* ── Products ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-36">
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-xs font-bold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-display)", color: textMuted }}
          >
            {selectedCategory ||
              (showFeatured
                ? lang === "es"
                  ? "★ Destacados"
                  : "★ Featured"
                : lang === "es"
                  ? "Todo el catálogo"
                  : "Full catalog")}
          </p>
          <span className="text-xs" style={{ color: textMuted }}>
            {filtered.filter((p) => !p.hidden).length}{" "}
            {lang === "es" ? "productos" : "products"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered
            .filter((p) => !p.hidden)
            .map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                onAdd={add}
                inCart={cartMap.has(product.id)}
                quantity={cartMap.get(product.id) as number | undefined}
                accent={accent}
                bg={bg}
                surface={surface}
                surface2={surface2}
                text={text}
                textMuted={textMuted}
                border={border}
                priceColor={palette?.priceColor ?? "#fbbf24"}
                defaultEmoji={appConfig?.defaultProductEmoji}
                defaultImage={appConfig?.defaultProductImage}
              />
            ))}
        </div>
        {filtered.filter((p) => !p.hidden).length === 0 && (
          <div className="text-center py-20" style={{ color: textMuted }}>
            <div className="text-5xl mb-3 opacity-20">🍽️</div>
            <p className="text-sm">
              {lang === "es" ? "Sin productos aquí" : "No products here"}
            </p>
          </div>
        )}

        {/* Report + Edit links */}
        <div className="flex flex-col items-center gap-2 pb-8 pt-4">
          <button
            onClick={() => setShowReport(true)}
            className="text-xs opacity-30 hover:opacity-60 transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ color: textMuted }}
          >
            🚩 {lang === "es" ? "Reportar negocio" : "Report business"}
          </button>
          <a
            href={`/editar/${slug}`}
            className="text-xs opacity-25 hover:opacity-50 transition-all flex items-center gap-1"
            style={{ color: textMuted }}
          >
            ✏️ {lang === "es" ? "Editar negocio" : "Edit business"}
          </a>
        </div>
      </main>

      {mounted && (
        <CartButton
          count={count}
          total={total}
          onClick={() => setCartOpen(true)}
          lang={lang}
        />
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setCartOpen(false)}
          />
          <div
            className="relative rounded-t-3xl flex flex-col animate-slide-up"
            style={{
              background: surface,
              maxHeight: "90vh",
              borderTop: `1px solid ${border}`,
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: border }}
            >
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-display)", color: text }}
              >
                🛒 {lang === "es" ? "Tu pedido" : "Your order"}
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: surface2, color: textMuted }}
              >
                ✕
              </button>
            </div>
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
              onClose={() => setCartOpen(false)}
              donationsEnabled={detail.donationsEnabled ?? false}
              promoCodes={detail.promoCodes ?? []}
              initialPromoCode={urlPromoCode}
            />
          </div>
        </div>
      )}

      {showDonation && detail.cardNumber && detail.phone && (
        <DonationModal
          cardNumber={detail.cardNumber}
          phone={detail.phone}
          onClose={() => setShowDonation(false)}
        />
      )}
      {showSchedule && (
        <ScheduleModal
          schedule={detail.schedule}
          lang={lang}
          onClose={() => setShowSchedule(false)}
        />
      )}
      {/* ── Addresses modal ── */}
      {showAddresses && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAddresses(false)}
          />
          <div
            className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-4 animate-slide-up"
            style={{ background: surface, border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg" style={{ color: text }}>
                📍 {lang === "es" ? "Direcciones" : "Addresses"}
              </h2>
              <button
                onClick={() => setShowAddresses(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: bg, color: textMuted }}
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {(
                detail.addresses ?? (detail.address ? [detail.address] : [])
              ).map((addr, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl"
                  style={{ background: surface2 }}
                >
                  <p
                    className="text-xs font-bold mb-0.5"
                    style={{ color: accent }}
                  >
                    {i === 0
                      ? lang === "es"
                        ? "Principal"
                        : "Main"
                      : `${lang === "es" ? "Dirección" : "Address"} ${i + 1}`}
                  </p>
                  <p className="text-sm" style={{ color: text }}>
                    {getL(addr, lang) || addr.es}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ── Report modal ── */}
      {showReport && (
        <ReportModal
          slug={slug}
          lang={lang}
          bg={bg}
          surface={surface}
          border={border}
          text={text}
          textMuted={textMuted}
          accent={accent}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({
  slug,
  lang,
  bg,
  surface,
  border,
  text,
  textMuted,
  accent,
  onClose,
}: {
  slug: string;
  lang: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("spam");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const REASONS = [
    {
      value: "spam",
      label: lang === "es" ? "Spam o publicidad falsa" : "Spam or fake ads",
    },
    {
      value: "fraud",
      label: lang === "es" ? "Fraude o estafa" : "Fraud or scam",
    },
    {
      value: "offensive",
      label: lang === "es" ? "Contenido ofensivo" : "Offensive content",
    },
    {
      value: "closed",
      label:
        lang === "es" ? "Negocio cerrado/inexistente" : "Closed / non-existent",
    },
    { value: "other", label: lang === "es" ? "Otro" : "Other" },
  ];

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, email, reason, description }),
    });
    setLoading(false);
    setDone(true);
  };

  const inputStyle = { background: bg, borderColor: border, color: text };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-4 animate-slide-up"
        style={{ background: surface, border: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg" style={{ color: text }}>
            🚩 {lang === "es" ? "Reportar negocio" : "Report business"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: bg, color: textMuted }}
          >
            ✕
          </button>
        </div>
        {done ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-bold" style={{ color: text }}>
              {lang === "es" ? "¡Reporte enviado!" : "Report sent!"}
            </p>
            <p className="text-sm mt-1" style={{ color: textMuted }}>
              {lang === "es"
                ? "Lo revisaremos pronto."
                : "We will review it shortly."}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl text-sm font-bold"
              style={{ background: accent, color: "white" }}
            >
              {lang === "es" ? "Cerrar" : "Close"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs opacity-50 block mb-0.5">
                {lang === "es" ? "Tu nombre *" : "Your name *"}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === "es" ? "Nombre" : "Name"}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-0.5">
                {lang === "es"
                  ? "Email o contacto (opcional)"
                  : "Email or contact (optional)"}
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-0.5">
                {lang === "es" ? "Motivo *" : "Reason *"}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={inputStyle}
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-0.5">
                {lang === "es" ? "Descripción" : "Description"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                rows={3}
                placeholder={
                  lang === "es"
                    ? "Cuéntanos qué ocurrió…"
                    : "Tell us what happened…"
                }
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              className="w-full py-3 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: accent, color: "white" }}
            >
              {loading
                ? "⏳…"
                : lang === "es"
                  ? "Enviar reporte"
                  : "Send report"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
