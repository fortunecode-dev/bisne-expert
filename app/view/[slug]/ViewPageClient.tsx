"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Business, BusinessDetail, Product, CartItem } from "@/types";
import { buildProductIndexes, parseCartParam, getL } from "@/lib/data";
import { useCart } from "@/hooks/useCart";
import { useLang } from "@/hooks/useLang";
import { CartSheet } from "@/components/cart/CartSheet";
import { LangToggle } from "@/components/ui/LangToggle";
import Link from "next/link";

interface Props {
  business: Business;
  detail: BusinessDetail;
  products: Product[];
  slug: string;
}

const EMOJI_MAP: Record<string, string> = {
  "burger-house": "🍔",
  "pizza-palace": "🍕",
};

export function ViewPageClient({ business, detail, products, slug }: Props) {
  const [lang, setLang] = useLang();
  const searchParams = useSearchParams();
  const indexes = buildProductIndexes(products, "es");
  const {
    items,
    add,
    remove,
    update,
    clear,
    setFromParam,
    total,
    count,
    cartParam,
    mounted,
  } = useCart(slug, indexes.productsById);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loaded && mounted) {
      const c = searchParams.get("c");
      if (c) {
        const parsed = parseCartParam(c, indexes.productsById);
        const cartItems: CartItem[] = parsed.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        }));
        setFromParam(cartItems);
      }
      setLoaded(true);
    }
  }, [loaded, mounted, searchParams, indexes.productsById, setFromParam]);

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.origin + "/view/" + slug + "?c=" + cartParam
      : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const emoji = EMOJI_MAP[slug] || "🏪";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <header
        className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-md"
        style={{ background: "rgba(15,15,15,0.9)" }}
      >
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link
            href={"/" + "business/" + slug}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            ←
          </Link>
          <span
            className="font-bold flex-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {emoji} {lang === "es" ? "Pedido compartido" : "Shared order"}
          </span>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div
          className="rounded-2xl overflow-hidden border border-white/5"
          style={{ background: "var(--color-surface)" }}
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h1
                className="font-bold text-lg"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {getL(business.name, lang)}
              </h1>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {count}{" "}
                {lang === "es" ? "items en el carrito" : "items in cart"}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all border border-white/10 hover:border-white/30"
              style={{
                color: copied
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              }}
            >
              {copied
                ? "✓ " + (lang === "es" ? "Copiado" : "Copied")
                : "🔗 " + (lang === "es" ? "Copiar link" : "Copy link")}
            </button>
          </div>

          <div style={{ minHeight: 300 }}>
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

        <div className="mt-4 text-center">
          <Link
            href={"/business/" + slug}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ color: "var(--color-accent)" }}
          >
            + {lang === "es" ? "Agregar más productos" : "Add more products"}
          </Link>
        </div>
      </div>
    </div>
  );
}
