"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Business,
  BusinessDetail,
  Product,
  BusinessPalette,
  PromoCode,
  DEFAULT_PALETTE,
  makeDefaultSchedule,
  WEEKDAYS,
  Lang,
  LocalizedString,
} from "@/types";
import {
  DARK_PALETTES,
  LIGHT_PALETTES,
  HOLIDAY_PALETTES,
  ANIMATED_PALETTES,
  applyPalette,
} from "@/lib/palette";

type TabId =
  | "info"
  | "details"
  | "schedule"
  | "theme"
  | "products"
  | "sponsored"
  | "premium";

interface EditorBiz {
  business: Partial<Business>;
  detail: Partial<BusinessDetail>;
  products: Product[];
}
interface Props {
  slug?: string;
  initial?: EditorBiz;
  isAdmin?: boolean;
  onSave: (data: EditorBiz & { password?: string }) => Promise<void>;
  onCancel?: () => void;
  lang?: Lang;
  onResetPassword?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const S = {
  bg: "var(--editor-surface)",
  bg2: "var(--editor-surface2)",
  border: "var(--editor-border)",
  text: "var(--editor-text)",
  muted: "var(--editor-muted)",
  accent: "var(--editor-accent)",
} as const;

function inp(extra?: React.CSSProperties): React.CSSProperties {
  return { background: S.bg, borderColor: S.border, color: S.text, ...extra };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: S.muted }}
      >
        {label}
      </label>
      {hint && (
        <p
          className="text-[11px] leading-tight mb-0.5"
          style={{ color: S.muted, opacity: 0.7 }}
        >
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${className}`}
      style={inp()}
    />
  );
}

function PwdInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Contraseña"}
        className="w-full px-3 py-2 pr-10 rounded-xl border text-sm outline-none"
        style={inp()}
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100"
        style={{ color: S.muted }}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

// Bilingual tab input (ES / EN tabs)
function BiField({
  label,
  hint,
  val,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  hint?: string;
  val: LocalizedString;
  onChange: (v: LocalizedString) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [lTab, setLTab] = useState<"es" | "en">("es");
  const current = val?.[lTab] ?? "";
  const otherHas = lTab === "es" ? !!val?.en : !!val?.es;
  const update = (v: string) =>
    onChange({ es: val?.es ?? "", en: val?.en ?? "", [lTab]: v });
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: S.muted }}
        >
          {label}
        </label>
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: S.border }}
        >
          {(["es", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLTab(l)}
              className="px-2.5 py-0.5 text-[10px] font-black transition-all flex items-center gap-1"
              style={{
                background: lTab === l ? S.accent : S.bg2,
                color: lTab === l ? "#fff" : S.muted,
              }}
            >
              {l.toUpperCase()}
              {l !== lTab && otherHas && (
                <span className="w-1 h-1 rounded-full bg-green-400 inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>
      {hint && (
        <p className="text-[11px]" style={{ color: S.muted, opacity: 0.7 }}>
          {hint}
        </p>
      )}
      {multiline ? (
        <textarea
          value={current}
          rows={3}
          onChange={(e) => update(e.target.value)}
          placeholder={`${placeholder ?? ""}${lTab === "en" ? " (English)" : ""}`}
          className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
          style={inp()}
        />
      ) : (
        <Input
          value={current}
          onChange={update}
          placeholder={`${placeholder ?? ""}${lTab === "en" ? " (English)" : ""}`}
        />
      )}
    </div>
  );
}

// Image uploader — square with object-cover
function ImgUpload({
  value,
  onChange,
  label,
  square = false,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  square?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  // localPreview holds a data:// URL while uploading so we always show an image
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const upload = async (f: File) => {
    // Show local data: preview immediately (iOS + Supabase latency fix)
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(f);
    setLoading(true);
    const fd = new FormData();
    fd.append("image", f);
    fd.append("name", label ?? "img");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const j = await res.json();
        onChange(j.url); // parent state updated → value prop will change
      }
    } finally {
      setLocalPreview(null); // always clear preview, show value (or empty)
      setLoading(false);
    }
  };

  // Show local preview while uploading, otherwise the saved URL, otherwise empty
  const displayUrl = localPreview || value;
  const aspect = square ? "aspect-square" : "h-28";

  return (
    <div
      className={`relative ${aspect} rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:opacity-80`}
      style={{ borderColor: S.border }}
      onClick={() => !loading && ref.current?.click()}
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-1 opacity-40">
          <span className="text-2xl">＋</span>
          <span className="text-xs">{label ?? "Imagen"}</span>
        </div>
      )}
      {displayUrl && !loading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
          <span className="text-white text-xs font-bold">Cambiar</span>
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-sm animate-pulse">⏳ Subiendo…</span>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
    </div>
  );
}

// Autocomplete input
function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);
  const filtered = options.filter(
    (o) => o.toLowerCase().includes(q.toLowerCase()) && o !== q,
  );

  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(v) => {
          setQ(v);
          onChange(v);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full"
      />
      {open && filtered.length > 0 && (
        <div
          className="absolute z-20 w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
          style={{ background: S.bg, borderColor: S.border }}
        >
          {filtered.slice(0, 8).map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={() => {
                setQ(opt);
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-all"
              style={{ color: S.text }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Chip input — values as removable chips, Enter to add new
function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const addValue = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || values.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...values, trimmed]);
    setInput("");
  };
  return (
    <div
      className="min-h-[40px] flex flex-wrap gap-1.5 px-3 py-2 rounded-xl border cursor-text"
      style={{ borderColor: S.border, background: S.bg }}
      onClick={(e) =>
        (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()
      }
    >
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
          style={{
            background: S.accent + "25",
            color: S.accent,
            border: `1px solid ${S.accent}40`,
          }}
        >
          {v}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(values.filter((x) => x !== v));
            }}
            className="hover:opacity-70 leading-none text-[10px]"
          >
            ✕
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addValue(input);
          } else if (e.key === "Backspace" && !input && values.length > 0)
            onChange(values.slice(0, -1));
        }}
        onBlur={() => input.trim() && addValue(input)}
        placeholder={values.length === 0 ? (placeholder ?? "Agregar…") : ""}
        className="flex-1 min-w-[80px] bg-transparent outline-none text-sm"
        style={{ color: S.text }}
      />
    </div>
  );
}

// Tab nav
const BASE_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "info", label: "Negocio", icon: "🏪" },
  { id: "details", label: "Detalles", icon: "📍" },
  { id: "schedule", label: "Horario", icon: "🕐" },
  { id: "products", label: "Productos", icon: "🛍️" },
  { id: "theme", label: "Tema", icon: "🎨" },
];
const ADMIN_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "sponsored", label: "Patroc.", icon: "⭐" },
  { id: "premium", label: "Premium", icon: "💎" },
];

// ─── Main editor ─────────────────────────────────────────────────────────────
export function BusinessEditor({
  slug,
  initial,
  isAdmin = false,
  onSave,
  onCancel,
  lang = "es",
  onResetPassword,
}: Props) {
  const [tab, setTab] = useState<TabId>("info");
  const [biz, setBiz] = useState<Partial<Business>>(initial?.business ?? {});
  const [det, setDet] = useState<Partial<BusinessDetail>>(
    initial?.detail ?? {},
  );
  const [prods, setProds] = useState<Product[]>(initial?.products ?? []);
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const isNew = !slug;

  const updBiz = (x: Partial<Business>) => setBiz((p) => ({ ...p, ...x }));
  const updDet = (x: Partial<BusinessDetail>) =>
    setDet((p) => ({ ...p, ...x }));

  const TABS = isAdmin ? [...BASE_TABS, ...ADMIN_TABS] : BASE_TABS;

  // All saved categories and tags from this business's products + detail
  const savedCategories: string[] = Array.from(
    new Set([
      ...(det.businessCategories ?? []),
      ...(prods.map((p) => p.category?.es).filter(Boolean) as string[]),
    ]),
  );
  const savedTags: string[] = Array.from(
    new Set([
      ...(det.businessTags ?? []),
      ...(prods
        .flatMap((p) => p.tags?.map((t) => t.label?.es) ?? [])
        .filter(Boolean) as string[]),
    ]),
  );

  const handleSave = async () => {
    if (!biz.name?.es) {
      setError("El nombre del negocio en español es requerido");
      return;
    }
    if (isNew && !password) {
      setError("La contraseña es requerida");
      return;
    }
    if (isNew && password !== confirmPwd) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (isNew && password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        business: biz,
        detail: det,
        products: prods,
        password: isNew ? password : undefined,
      });
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    }
    setSaving(false);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={
        {
          "--editor-surface": "var(--color-surface, #1a1a1a)",
          "--editor-surface2": "var(--color-surface-2, #242424)",
          "--editor-border": "var(--color-border, #2e2e2e)",
          "--editor-text": "var(--color-text, #f0ece4)",
          "--editor-muted": "var(--color-text-muted, #888)",
          "--editor-accent": "var(--color-accent, #f97316)",
        } as any
      }
    >
      {/* Tab nav */}
      <div
        className="flex border-b overflow-x-auto"
        style={{ borderColor: S.border }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-bold flex-shrink-0 border-b-2 transition-all"
            style={{
              borderColor: tab === t.id ? S.accent : "transparent",
              color: tab === t.id ? S.accent : S.muted,
            }}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── INFO ── */}
        {tab === "info" && (
          <>
            {/* Images — logo + portada + 4 cover slots */}
            <div>
              {/* Row 1: logo + portada */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <Field label="Logo">
                  <ImgUpload
                    value={biz.logo ?? ""}
                    onChange={(v) => updBiz({ logo: v })}
                    label="Logo"
                    square
                  />
                </Field>
                <Field label="Portada">
                  <ImgUpload
                    value={biz.image ?? ""}
                    onChange={(v) => updBiz({ image: v })}
                    label="Portada"
                    square
                  />
                </Field>
              </div>
              {/* Row 2: 4 cover image slots (Premium) */}
              <div>
                <p
                  className="text-[10px] mb-1.5 flex items-center gap-1.5"
                  style={{ color: S.muted }}
                >
                  Portadas adicionales (slideshow)
                  {!biz.premium && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: "#a855f720", color: "#c084fc" }}
                    >
                      💎 Premium
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const covers: string[] = biz.coverImages ?? [];
                    if (!biz.premium) {
                      return (
                        <div
                          key={i}
                          className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center opacity-30"
                          style={{ borderColor: S.border }}
                        >
                          <span className="text-base">🔒</span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="relative">
                        <ImgUpload
                          value={covers[i] ?? ""}
                          onChange={(v) => {
                            const arr = [...covers];
                            if (v) arr[i] = v;
                            else arr.splice(i, 1);
                            updBiz({ coverImages: arr.filter(Boolean) });
                          }}
                          label={`Portada ${i + 1}`}
                          square
                        />
                        {covers[i] && (
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...covers];
                              arr[i] = "";
                              updBiz({ coverImages: arr.filter(Boolean) });
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black z-10"
                            style={{ background: "#ef4444", color: "white" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <BiField
              label="Nombre"
              val={biz.name ?? { es: "", en: "" }}
              onChange={(v) => updBiz({ name: v })}
              placeholder="Nombre del negocio"
            />

            {/* Slug */}
            {isNew && (
              <Field
                label="URL del negocio"
                hint='La dirección única de tu negocio en el catálogo. Ej: "mi-pizzeria" → bisne.app/mi-pizzeria. Solo letras, números y guiones. Si lo dejas vacío se genera del nombre.'
              >
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                    style={{ color: S.muted, opacity: 0.6 }}
                  >
                    bisne.app/
                  </span>
                  <input
                    value={biz.slug ?? ""}
                    onChange={(e) => {
                      // Allow typing spaces and hyphens without deleting — convert space to hyphen on the fly
                      const raw = e.target.value;
                      const s = raw
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\s+/g, "-") // space → hyphen
                        .replace(/[^a-z0-9-]/g, "") // strip invalid chars
                        .replace(/-{2,}/g, "-") // collapse multiple hyphens
                        .replace(/^-/, ""); // no leading hyphen
                      updBiz({ slug: s });
                    }}
                    placeholder="mi-negocio"
                    className="w-full pl-24 pr-3 py-2 rounded-xl border text-sm outline-none"
                    style={inp()}
                  />
                </div>
              </Field>
            )}

            <BiField
              label="Slogan"
              hint="Frase corta que describe tu negocio. Aparece debajo del nombre en tu página."
              val={biz.slogan ?? { es: "", en: "" }}
              onChange={(v) => updBiz({ slogan: v })}
              placeholder="Tu mejor calidad al mejor precio"
            />

            <BiField
              label="Descripción"
              multiline
              val={biz.description ?? { es: "", en: "" }}
              onChange={(v) => updBiz({ description: v })}
              placeholder="Cuéntale a tus clientes qué ofreces"
            />

            {/* Categories as chips */}
            <Field
              label="Categorías"
              hint="Haz clic en ✕ para eliminar. Escribe y presiona Enter para agregar."
            >
              <ChipInput
                values={biz.categories ?? []}
                onChange={(cats) => {
                  updBiz({ categories: cats });
                  updDet({
                    businessCategories: Array.from(
                      new Set([...(det.businessCategories ?? []), ...cats]),
                    ),
                  });
                }}
                placeholder="Agregar categoría…"
              />
            </Field>

            {/* Admin state toggles */}
            {isAdmin && (
              <Field label="Estado (solo admin)">
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: "premium", label: "💎 Premium", color: "#a855f7" },
                    {
                      key: "sponsored",
                      label: "⭐ Patrocinado",
                      color: "#eab308",
                    },
                    {
                      key: "unavailable",
                      label: "🚫 No disponible",
                      color: "#f97316",
                    },
                    { key: "hidden", label: "👁️ Oculto", color: "#888" },
                  ].map(({ key, label, color }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!(biz as any)[key]}
                        onChange={(e) => updBiz({ [key]: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-xs font-semibold" style={{ color }}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
            )}

            {/* Owner: unavailable toggle with explanation */}
            {!isAdmin && (
              <Field label="Estado">
                <div
                  className="p-3 rounded-xl border"
                  style={{ borderColor: "#f9731630", background: "#f9731608" }}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!biz.unavailable}
                      onChange={(e) =>
                        updBiz({ unavailable: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4"
                    />
                    <div>
                      <p
                        className="text-xs font-bold"
                        style={{ color: "#f97316" }}
                      >
                        🚫 No disponible por el momento
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: S.muted }}
                      >
                        Activa esto si tu negocio aún no ha comenzado a
                        funcionar, está temporalmente cerrado, o no puede
                        atender pedidos. Seguirá visible pero marcado como no
                        disponible.
                      </p>
                    </div>
                  </label>
                </div>
              </Field>
            )}

            {/* Password section for new registrations */}
            {isNew && (
              <div
                className="rounded-2xl border p-4 space-y-3"
                style={{ borderColor: S.border }}
              >
                <p className="text-sm font-bold" style={{ color: S.text }}>
                  🔐 Contraseña del negocio
                </p>
                <p className="text-xs" style={{ color: S.muted }}>
                  Usarás esta contraseña para <strong>editar tu negocio</strong>{" "}
                  en el futuro desde{" "}
                  <strong>/editar/{biz.slug || "[slug]"}</strong>. Guárdala bien
                  — si la pierdes, contacta al administrador.
                </p>
                <Field label="Contraseña">
                  <PwdInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Mínimo 6 caracteres"
                  />
                </Field>
                <Field label="Confirmar contraseña">
                  <PwdInput
                    value={confirmPwd}
                    onChange={setConfirmPwd}
                    placeholder="Repite la contraseña"
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {/* ── DETAILS ── */}
        {tab === "details" && (
          <>
            <Field label="Provincia">
              <Input
                value={det.province ?? ""}
                onChange={(v) => updDet({ province: v })}
                placeholder="Ej: La Habana"
              />
            </Field>
            <Field label="Municipio">
              <Input
                value={det.municipality ?? ""}
                onChange={(v) => updDet({ municipality: v })}
                placeholder="Ej: Centro Habana"
              />
            </Field>

            {/* Multiple addresses */}
            <Field
              label="Direcciones"
              hint="Puedes agregar varias ubicaciones. La primera se muestra en la página; las demás en un botón 'Ver más'."
            >
              <div className="space-y-2">
                {(
                  det.addresses ??
                  (det.address ? [det.address] : [{ es: "", en: "" }])
                ).map((addr, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <BiField
                        label={
                          i === 0 ? "Dirección principal" : `Dirección ${i + 1}`
                        }
                        val={addr}
                        onChange={(v) => {
                          const arr = [
                            ...(det.addresses ??
                              (det.address ? [det.address] : [])),
                          ];
                          arr[i] = v;
                          updDet({ addresses: arr, address: arr[0] });
                        }}
                        placeholder="Calle, número, local…"
                      />
                    </div>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const arr = (det.addresses ?? []).filter(
                            (_, j) => j !== i,
                          );
                          updDet({ addresses: arr, address: arr[0] });
                        }}
                        className="mt-6 w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 flex-shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const arr = [
                      ...(det.addresses ??
                        (det.address ? [det.address] : [{ es: "", en: "" }])),
                      { es: "", en: "" },
                    ];
                    updDet({ addresses: arr });
                  }}
                  className="w-full py-2 rounded-xl border-2 border-dashed text-xs font-bold transition-all hover:opacity-80"
                  style={{ borderColor: S.border, color: S.muted }}
                >
                  + Agregar dirección
                </button>
              </div>
            </Field>

            <Field label="Teléfono (sin +)">
              <Input
                value={det.phone ?? ""}
                onChange={(v) => updDet({ phone: v })}
                placeholder="5351234567"
              />
            </Field>
            <Field label="Sitio web">
              <Input
                value={det.website ?? ""}
                onChange={(v) => updDet({ website: v })}
                placeholder="https://…"
              />
            </Field>

            {/* Payment methods — table with modifier */}
            <Field
              label="Métodos de pago"
              hint="Puedes agregar un % de descuento (negativo) o recargo (positivo) por método de pago."
            >
              <PaymentMethodsEditor
                details={
                  det.paymentMethodDetails ??
                  (det.paymentMethods ?? []).map((id) => ({ id }))
                }
                onChange={(d) =>
                  updDet({
                    paymentMethodDetails: d,
                    paymentMethods: d.map((x) => x.id),
                  })
                }
              />
            </Field>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!det.donationsEnabled}
                onChange={(e) => updDet({ donationsEnabled: e.target.checked })}
              />
              <span className="text-xs font-semibold">
                💛 Habilitar propinas / donaciones
              </span>
            </label>
            {det.donationsEnabled && (
              <Field label="Número de tarjeta">
                <Input
                  value={det.cardNumber ?? ""}
                  onChange={(v) => updDet({ cardNumber: v })}
                  placeholder="Tarjeta TRANSFERMOVIL"
                />
              </Field>
            )}

            <Field label="Redes sociales">
              {[
                "instagram",
                "facebook",
                "telegram",
                "whatsapp",
                "tiktok",
                "youtube",
                "twitter",
                "linkedin",
              ].map((net) => (
                <div key={net} className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs w-20 capitalize"
                    style={{ color: S.muted }}
                  >
                    {net}
                  </span>
                  <Input
                    value={(det.socialLinks as any)?.[net] ?? ""}
                    onChange={(v) =>
                      updDet({
                        socialLinks: { ...(det.socialLinks ?? {}), [net]: v },
                      })
                    }
                    placeholder={`https://${net}.com/…`}
                  />
                </div>
              ))}
            </Field>

            {/* Client instructions */}
            <BiField
              label="Instrucciones para el cliente"
              multiline
              hint="Aparece debajo de tus redes sociales. Ej: horario de recogida, cómo hacer pedidos, políticas, etc."
              val={det.clientInstructions ?? { es: "", en: "" }}
              onChange={(v) => updDet({ clientInstructions: v })}
              placeholder="Ej: Los pedidos se recogen de lunes a viernes de 9am a 5pm en nuestra tienda principal."
            />
          </>
        )}

        {/* ── SCHEDULE ── */}
        {tab === "schedule" && (
          <ScheduleEditor
            schedule={det.schedule ?? makeDefaultSchedule()}
            onChange={(s) => updDet({ schedule: s })}
          />
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <ProductsTab
            products={prods}
            onChange={setProds}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            palette={det.palette ?? DEFAULT_PALETTE}
            isPremium={!!biz.premium}
            isSponsored={!!biz.sponsored}
            savedCategories={savedCategories}
            savedTags={savedTags}
            onCategoryCreated={(cat) =>
              updDet({
                businessCategories: Array.from(
                  new Set([...(det.businessCategories ?? []), cat]),
                ),
              })
            }
            onTagCreated={(tag) =>
              updDet({
                businessTags: Array.from(
                  new Set([...(det.businessTags ?? []), tag]),
                ),
              })
            }
            onAutoSave={async (updatedProds) => {
              try {
                await fetch("/api/data", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    file: `products/${slug}`,
                    data: { products: updatedProds },
                  }),
                });
              } catch {}
            }}
          />
        )}

        {/* ── THEME ── */}
        {tab === "theme" && (
          <ThemeEditor
            palette={det.palette ?? DEFAULT_PALETTE}
            onChange={(p) => updDet({ palette: p })}
            isSponsored={biz.sponsored}
            isPremium={biz.premium}
          />
        )}

        {/* ── PATROCINIO (Admin) ── */}
        {tab === "sponsored" && isAdmin && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl border space-y-4"
              style={{ borderColor: "#eab30840", background: "#eab30808" }}
            >
              <p className="text-sm font-black" style={{ color: "#eab308" }}>
                ⭐ Plan Patrocinado
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!biz.sponsored}
                  onChange={(e) => updBiz({ sponsored: e.target.checked })}
                  className="w-4 h-4"
                />
                <div>
                  <p className="text-sm font-bold">Activar plan Patrocinado</p>
                  <p className="text-xs opacity-60">
                    Hasta 20 productos · 6 fotos · Temas festivos · Badge ⭐
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── PREMIUM (Admin) ── */}
        {tab === "premium" && isAdmin && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl border space-y-4"
              style={{ borderColor: "#a855f740", background: "#a855f708" }}
            >
              <p className="text-sm font-black" style={{ color: "#a855f7" }}>
                💎 Plan Premium
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!biz.premium}
                  onChange={(e) => updBiz({ premium: e.target.checked })}
                  className="w-4 h-4"
                />
                <div>
                  <p className="text-sm font-bold">Activar plan Premium</p>
                  <p className="text-xs opacity-60">
                    Productos ilimitados · 9 fotos · Slideshow · Temas animados
                    · Códigos promo
                  </p>
                </div>
              </label>
            </div>
            <label
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border"
              style={{ borderColor: S.border }}
            >
              <input
                type="checkbox"
                checked={!!biz.unavailable}
                onChange={(e) => updBiz({ unavailable: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <p className="text-sm font-bold">
                  🚫 Marcar como no disponible
                </p>
                <p className="text-xs opacity-50">
                  El negocio aún no ha comenzado o está temporalmente cerrado
                </p>
              </div>
            </label>
            <label
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border"
              style={{ borderColor: S.border }}
            >
              <input
                type="checkbox"
                checked={!!biz.hidden}
                onChange={(e) => updBiz({ hidden: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <p className="text-sm font-bold">👁️ Ocultar negocio</p>
                <p className="text-xs opacity-50">
                  Solo accesible con preview link
                </p>
              </div>
            </label>
            <div className="space-y-2">
              <p className="text-xs font-bold opacity-60 uppercase">
                🎟️ Códigos promocionales
              </p>
              <PromoCodes
                codes={det.promoCodes ?? []}
                onChange={(codes) => updDet({ promoCodes: codes })}
                isPremium={!!biz.premium}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="border-t p-4 flex flex-col gap-2"
        style={{ borderColor: S.border }}
      >
        {error && (
          <p className="text-xs text-red-400 font-semibold text-center">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
              style={{ borderColor: S.border, color: S.muted }}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: S.accent, color: "white" }}
          >
            {saving
              ? "⏳ Guardando…"
              : isNew
                ? "🚀 Registrar negocio"
                : "✓ Guardar cambios"}
          </button>
        </div>
        {!isNew && onResetPassword && (
          <button
            onClick={onResetPassword}
            className="w-full py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: S.border, color: S.muted }}
          >
            🔑 Cambiar contraseña del negocio
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Payment Methods Table ────────────────────────────────────────────────────
const PM_OPTIONS = [
  { id: "cash", label: "Efectivo", icon: "💵" },
  { id: "transfer", label: "Transferencia", icon: "🏦" },
  { id: "card", label: "Tarjeta", icon: "💳" },
  { id: "zelle", label: "Zelle", icon: "⚡" },
  { id: "paypal", label: "PayPal", icon: "🅿️" },
  { id: "crypto", label: "Criptomoneda", icon: "🪙" },
  { id: "custom", label: "Otro", icon: "💰" },
];

function PaymentMethodsEditor({
  details,
  onChange,
}: {
  details: import("@/types").PaymentMethodDetail[];
  onChange: (d: import("@/types").PaymentMethodDetail[]) => void;
}) {
  const upd = (i: number, p: Partial<import("@/types").PaymentMethodDetail>) =>
    onChange(details.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const toggle = (id: string) => {
    if (details.find((d) => d.id === id)) {
      onChange(details.filter((d) => d.id !== id));
    } else {
      onChange([...details, { id }]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {PM_OPTIONS.map((pm) => {
          const active = details.some((d) => d.id === pm.id);
          return (
            <button
              key={pm.id}
              type="button"
              onClick={() => toggle(pm.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
              style={{
                borderColor: active ? S.accent : S.border,
                background: active ? S.accent + "20" : "transparent",
                color: active ? S.accent : S.muted,
              }}
            >
              {pm.icon} {pm.label}
            </button>
          );
        })}
      </div>
      {/* Detail rows */}
      {details.length > 0 && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: S.border }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: S.bg2 }}>
                <th
                  className="text-left px-3 py-2 font-semibold"
                  style={{ color: S.muted }}
                >
                  Método
                </th>
                <th
                  className="text-center px-2 py-2 font-semibold"
                  style={{ color: S.muted }}
                >
                  % (negativo=desc.)
                </th>
                <th
                  className="text-left px-2 py-2 font-semibold"
                  style={{ color: S.muted }}
                >
                  Nota
                </th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {details.map((d, i) => {
                const pm = PM_OPTIONS.find((p) => p.id === d.id);
                return (
                  <tr key={i} style={{ borderTop: `1px solid ${S.border}` }}>
                    <td className="px-3 py-2" style={{ color: S.text }}>
                      <span>
                        {pm?.icon ?? "💰"} {d.label || pm?.label || d.id}
                      </span>
                      {d.id === "custom" && (
                        <input
                          value={d.label ?? ""}
                          onChange={(e) => upd(i, { label: e.target.value })}
                          placeholder="Nombre…"
                          className="ml-2 px-2 py-0.5 rounded-lg border text-xs w-24"
                          style={{
                            background: S.bg2,
                            borderColor: S.border,
                            color: S.text,
                          }}
                        />
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        value={d.modifier ?? ""}
                        min={-100}
                        max={100}
                        step={0.5}
                        onChange={(e) =>
                          upd(i, {
                            modifier: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="0"
                        className="w-16 px-2 py-0.5 rounded-lg border text-xs text-center"
                        style={{
                          background: S.bg2,
                          borderColor: S.border,
                          color:
                            (d.modifier ?? 0) < 0
                              ? "#22c55e"
                              : (d.modifier ?? 0) > 0
                                ? "#f97316"
                                : S.text,
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={d.note ?? ""}
                        onChange={(e) => upd(i, { note: e.target.value })}
                        placeholder="Opcional…"
                        className="w-full px-2 py-0.5 rounded-lg border text-xs"
                        style={{
                          background: S.bg2,
                          borderColor: S.border,
                          color: S.text,
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          onChange(details.filter((_, j) => j !== i))
                        }
                        className="text-red-400 hover:text-red-300 text-xs px-1"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
import type { StructuredSchedule, Weekday } from "@/types";
import BusinessPalettePreview from "./BusinessPalettePreview";
const DAY_LABELS: Record<Weekday, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};
function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: StructuredSchedule;
  onChange: (s: StructuredSchedule) => void;
}) {
  const updDay = (
    day: Weekday,
    partial: Partial<StructuredSchedule["days"][Weekday]>,
  ) => {
    onChange({
      ...schedule,
      days: { ...schedule.days, [day]: { ...schedule.days[day], ...partial } },
    });
  };
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={schedule.alwaysOpen}
          onChange={(e) =>
            onChange({ ...schedule, alwaysOpen: e.target.checked })
          }
        />
        <span className="text-sm font-bold">⚡ 24/7 Siempre abierto</span>
      </label>
      {!schedule.alwaysOpen &&
        WEEKDAYS.map((day) => {
          const ds = schedule.days[day];
          return (
            <div
              key={day}
              className="flex items-center gap-2 p-2.5 rounded-xl"
              style={{ background: S.bg }}
            >
              <span className="text-xs font-bold w-8">{DAY_LABELS[day]}</span>
              <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={!ds.closed}
                  onChange={(e) => updDay(day, { closed: !e.target.checked })}
                />
                <span className="text-xs">
                  {ds.closed ? "Cerrado" : "Abierto"}
                </span>
              </label>
              {!ds.closed && (
                <>
                  <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={ds.h24}
                      onChange={(e) => updDay(day, { h24: e.target.checked })}
                    />
                    <span className="text-xs">24h</span>
                  </label>
                  {!ds.h24 && (
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <input
                        type="time"
                        value={ds.open}
                        onChange={(e) => updDay(day, { open: e.target.value })}
                        className="px-2 py-1 rounded-lg text-xs border"
                        style={{
                          background: S.bg,
                          borderColor: S.border,
                          color: S.text,
                        }}
                      />
                      <span className="text-xs opacity-40">–</span>
                      <input
                        type="time"
                        value={ds.close}
                        onChange={(e) => updDay(day, { close: e.target.value })}
                        className="px-2 py-1 rounded-lg text-xs border"
                        style={{
                          background: S.bg,
                          borderColor: S.border,
                          color: S.text,
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
function ProductsTab({
  products,
  onChange,
  editingProduct,
  setEditingProduct,
  palette,
  isPremium = false,
  isSponsored = false,
  savedCategories,
  savedTags,
  onCategoryCreated,
  onTagCreated,
  onAutoSave,
}: {
  products: Product[];
  onChange: (p: Product[]) => void;
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
  palette: BusinessPalette;
  isPremium?: boolean;
  isSponsored?: boolean;
  savedCategories: string[];
  savedTags: string[];
  onCategoryCreated: (c: string) => void;
  onTagCreated: (t: string) => void;
  onAutoSave?: (products: Product[]) => Promise<void>;
}) {
  const { accent, surface, surface2, text, textMuted, border } = palette;
  const maxProducts = isPremium ? Infinity : isSponsored ? 20 : 10;
  const maxImages = isPremium ? 9 : isSponsored ? 6 : 3;
  const atLimit = products.length >= maxProducts;
  const limitLabel = isPremium ? "∞" : String(maxProducts);

  const newProduct = (): Product => ({
    id: Date.now(),
    name: { es: "", en: "" },
    description: { es: "", en: "" },
    price: 0,
    image: "",
    images: [],
    imageKeywords: [],
    category: { es: "General", en: "General" },
    featured: false,
    hidden: false,
    available: true,
    seo: {
      title: { es: "", en: "" },
      description: { es: "", en: "" },
      keywords: [],
    },
  });

  if (editingProduct)
    return (
      <ProductForm
        product={editingProduct}
        palette={palette}
        maxImages={maxImages}
        savedCategories={savedCategories}
        savedTags={savedTags}
        onCategoryCreated={onCategoryCreated}
        onTagCreated={onTagCreated}
        onSave={async (p) => {
          if (p.category?.es) onCategoryCreated(p.category.es);
          const idx = products.findIndex((x) => x.id === p.id);
          const updated =
            idx >= 0
              ? products.map((x, i) => (i === idx ? p : x))
              : [...products, p];
          onChange(updated);
          setEditingProduct(null);
          if (onAutoSave) await onAutoSave(updated);
        }}
        onCancel={() => setEditingProduct(null)}
      />
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">
          {products.length}/{limitLabel} producto
          {products.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => {
            if (atLimit) {
              alert(`Máximo ${maxProducts} productos`);
              return;
            }
            setEditingProduct(newProduct());
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            background: atLimit ? "#888" : accent,
            color: "white",
            opacity: atLimit ? 0.6 : 1,
          }}
        >
          {atLimit ? "🔒 Límite" : "+ Agregar"}
        </button>
      </div>
      {products.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 p-3 rounded-2xl border"
          style={{ background: surface, borderColor: border }}
        >
          <div
            className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: surface2 }}
          >
            {p.image ? (
              <img
                src={p.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl">📦</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: text }}>
              {p.name.es || "Sin nombre"}
            </p>
            <p className="text-xs" style={{ color: textMuted }}>
              {p.category.es} · ${p.price}
            </p>
          </div>
          <button
            onClick={() => setEditingProduct(p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
            style={{ background: surface2 }}
          >
            ✏️
          </button>
          <button
            onClick={() => onChange(products.filter((x) => x.id !== p.id))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10"
          >
            ✕
          </button>
        </div>
      ))}
      {products.length === 0 && (
        <div className="text-center py-10" style={{ color: textMuted }}>
          <p className="text-3xl mb-2 opacity-20">🛍️</p>
          <p className="text-sm">Sin productos aún</p>
        </div>
      )}
    </div>
  );
}

function ProductForm({
  product,
  palette,
  onSave,
  onCancel,
  maxImages = 8,
  savedCategories,
  savedTags,
  onCategoryCreated,
  onTagCreated,
}: {
  product: Product;
  palette: BusinessPalette;
  onSave: (p: Product) => void;
  onCancel: () => void;
  maxImages?: number;
  savedCategories: string[];
  savedTags: string[];
  onCategoryCreated: (c: string) => void;
  onTagCreated: (t: string) => void;
}) {
  const [p, setP] = useState(product);
  const upd = (x: Partial<Product>) => setP((prev) => ({ ...prev, ...x }));
  const { accent, surface, border, text, textMuted } = palette;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onCancel}
          className="text-sm opacity-60 hover:opacity-100"
        >
          ← Volver
        </button>
        <p className="font-bold text-sm">
          {!product.name.es ? "Nuevo producto" : "Editar producto"}
        </p>
      </div>

      <div className="mt-1">
        <p className="text-[10px] mb-1.5" style={{ color: S.muted }}>
          Imágenes ({(p.images ?? []).length}/{maxImages})
        </p>
        {/* Images shown 3-per-row always */}
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <ImgUpload
              value={p.image}
              onChange={(v) => upd({ image: v })}
              label="Foto principal"
              square
            />
          </div>

          {(p.images ?? []).map((img, i) => (
            <div key={i} className="relative">
              <ImgUpload
                value={img}
                onChange={(v) => {
                  const imgs = [...(p.images ?? [])];
                  imgs[i] = v;
                  upd({ images: imgs });
                }}
                label={`Foto ${i + 2}`}
                square
              />
              <button
                onClick={() =>
                  upd({ images: (p.images ?? []).filter((_, j) => j !== i) })
                }
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black z-10"
                style={{ background: "#ef4444", color: "white" }}
              >
                ✕
              </button>
            </div>
          ))}
          {(p.images ?? []).length < maxImages - 1 && (
            <button
              onClick={() => upd({ images: [...(p.images ?? []), ""] })}
              className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-lg font-bold hover:opacity-80 transition-all"
              style={{ borderColor: S.border, color: S.muted }}
            >
              + Agregar imagen
            </button>
          )}
        </div>
      </div>
      <BiField
        label="Nombre"
        val={p.name}
        onChange={(v) => upd({ name: v })}
        placeholder="Nombre del producto"
      />
      <BiField
        label="Descripción"
        multiline
        val={p.description}
        onChange={(v) => upd({ description: v })}
        placeholder="Descripción"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio">
          <input
            type="number"
            value={p.price}
            min={0}
            step={0.01}
            onChange={(e) => upd({ price: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={inp()}
          />
        </Field>
        <Field label="Precio original">
          <input
            type="number"
            value={p.originalPrice ?? ""}
            min={0}
            step={0.01}
            onChange={(e) =>
              upd({
                originalPrice: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            placeholder="Antes de rebaja"
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={inp()}
          />
        </Field>
      </div>
      <Field label="Categoría">
        {/* Chips list of saved categories */}
        {savedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {savedCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  upd({ category: { es: cat, en: p.category.en } });
                  onCategoryCreated(cat);
                }}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:opacity-80 active:scale-95"
                style={
                  p.category.es === cat
                    ? {
                        background: S.accent,
                        color: "white",
                        borderColor: S.accent,
                      }
                    : {
                        background: S.bg2,
                        color: S.muted,
                        borderColor: S.border,
                      }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        {/* Manual input — adds to chips list on blur/enter */}
        <input
          value={p.category.es}
          onChange={(e) =>
            upd({ category: { es: e.target.value, en: p.category.en } })
          }
          onBlur={() => {
            if (p.category.es.trim()) onCategoryCreated(p.category.es.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (p.category.es.trim()) onCategoryCreated(p.category.es.trim());
            }
          }}
          placeholder="O escribe una categoría nueva…"
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={inp()}
        />
      </Field>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={p.featured}
            onChange={(e) => upd({ featured: e.target.checked })}
          />
          <span className="text-xs">★ Destacado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!p.available}
            onChange={(e) => upd({ available: !e.target.checked })}
          />
          <span className="text-xs">No disponible</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={p.hidden}
            onChange={(e) => upd({ hidden: e.target.checked })}
          />
          <span className="text-xs">Ocultar</span>
        </label>
      </div>
      <button
        onClick={() => onSave(p)}
        className="w-full py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90 active:scale-95"
        style={{ background: accent, color: "white" }}
      >
        ✓ Guardar producto
      </button>
    </div>
  );
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────
function PromoCodes({
  codes,
  onChange,
  isPremium,
}: {
  codes: PromoCode[];
  onChange: (c: PromoCode[]) => void;
  isPremium?: boolean;
}) {
  const upd = (i: number, c: Partial<PromoCode>) =>
    onChange(codes.map((x, j) => (j === i ? { ...x, ...c } : x)));
  if (!isPremium)
    return (
      <div
        className="p-4 rounded-2xl text-center opacity-50 border border-dashed"
        style={{ borderColor: S.border }}
      >
        <p className="text-2xl mb-1">🎟️</p>
        <p className="text-xs font-semibold">Solo disponible en plan Premium</p>
      </div>
    );
  return (
    <div className="space-y-3">
      {codes.map((code, i) => (
        <div
          key={i}
          className="p-3 rounded-2xl border space-y-2"
          style={{ borderColor: S.border, background: S.bg }}
        >
          <div className="flex items-center gap-2">
            <input
              value={code.id}
              placeholder="PROMO10"
              onChange={(e) => upd(i, { id: e.target.value.toUpperCase() })}
              className="flex-1 px-2 py-1 rounded-lg border text-sm font-bold uppercase"
              style={{
                background: S.bg2,
                borderColor: S.border,
                color: S.text,
              }}
            />
            <button
              onClick={() => onChange(codes.filter((_, j) => j !== i))}
              className="text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-400/10"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={code.discount}
              min={1}
              max={100}
              onChange={(e) => upd(i, { discount: Number(e.target.value) })}
              className="w-20 px-2 py-1 rounded-lg border text-sm"
              style={{
                background: S.bg2,
                borderColor: S.border,
                color: S.text,
              }}
            />
            <select
              value={code.type}
              onChange={(e) => upd(i, { type: e.target.value as any })}
              className="flex-1 px-2 py-1 rounded-lg border text-sm"
              style={{
                background: S.bg2,
                borderColor: S.border,
                color: S.text,
              }}
            >
              <option value="percent">% descuento</option>
              <option value="fixed">$ fijo</option>
            </select>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={code.active}
                onChange={(e) => upd(i, { active: e.target.checked })}
              />
              <span className="text-xs">Activo</span>
            </label>
          </div>
        </div>
      ))}
      <button
        onClick={() =>
          onChange([
            ...codes,
            { id: "", discount: 10, type: "percent", active: true },
          ])
        }
        className="w-full py-2 rounded-xl border-2 border-dashed text-xs font-bold hover:opacity-80"
        style={{ borderColor: "#a855f740", color: "#c084fc" }}
      >
        + Agregar código
      </button>
    </div>
  );
}

// ─── Theme Editor ─────────────────────────────────────────────────────────────
const COLOR_FIELDS: { key: keyof BusinessPalette; label: string }[] = [
  { key: "accent", label: "Acento" },
  { key: "bg", label: "Fondo" },
  { key: "surface", label: "Superficie" },
  { key: "text", label: "Texto" },
  { key: "textMuted", label: "Texto suave" },
  { key: "priceColor", label: "Precio" },
  { key: "border", label: "Borde" },
];

function ThemeEditor({
  palette,
  onChange,
  isSponsored = false,
  isPremium = false,
}: {
  palette: BusinessPalette;
  onChange: (p: BusinessPalette) => void;
  isSponsored?: boolean;
  isPremium?: boolean;
}) {
  const [tab, setTab] = useState<"presets" | "custom">("presets");
  const [lockedMsg, setLockedMsg] = useState("");
  const [previewPalette, setPreviewPalette] = useState<BusinessPalette | null>(
    null,
  );

  // Apply palette whenever it changes (handles custom color picker live preview)
  useEffect(() => {
    applyPalette(palette);
  }, [palette]); // palette changes → live page theme update

  const handleHover = (p: BusinessPalette) => {
    setPreviewPalette(p);
    applyPalette(p);
  };
  const handleHoverEnd = () => {
    setPreviewPalette(null);
    applyPalette(palette);
  };
  const handleSelect = (p: BusinessPalette, name: string) => {
    const newP = { ...p, name };
    onChange(newP);
    applyPalette(newP);
    setPreviewPalette(null);
  };

  const groups = [
    {
      label: "🎨 Estándar",
      locked: false,
      lockLabel: "",
      items: DARK_PALETTES.concat(LIGHT_PALETTES),
    },
    {
      label: "🎉 Festivos",
      locked: !isSponsored && !isPremium,
      lockLabel: "Solo Patrocinado ⭐",
      items: HOLIDAY_PALETTES,
    },
    {
      label: "✨ Animados",
      locked: !isPremium,
      lockLabel: "Solo Premium 💎",
      items: ANIMATED_PALETTES,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTab("presets")}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={
            tab === "presets"
              ? { background: S.accent, color: "white" }
              : {
                  background: S.bg,
                  border: `1px solid ${S.border}`,
                  color: S.muted,
                }
          }
        >
          🎨 Temas
        </button>
        <button
          onClick={() => {
            if (!isPremium) {
              setLockedMsg("Personalizar es exclusivo del plan Premium 💎");
              setTimeout(() => setLockedMsg(""), 3000);
              return;
            }
            setTab("custom");
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          style={
            tab === "custom"
              ? { background: S.accent, color: "white" }
              : {
                  background: S.bg,
                  border: `1px solid ${S.border}`,
                  color: isPremium ? S.muted : "#c084fc",
                  opacity: isPremium ? 1 : 0.75,
                }
          }
        >
          ✏️ Personalizar{" "}
          {!isPremium && (
            <span
              className="text-[9px] font-black px-1 py-0.5 rounded-full"
              style={{ background: "#a855f730", color: "#c084fc" }}
            >
              💎
            </span>
          )}
        </button>
      </div>

      {lockedMsg && (
        <div
          className="p-3 rounded-xl text-xs font-semibold text-center"
          style={{
            background: "#a855f720",
            color: "#c084fc",
            border: "1px solid #a855f740",
          }}
        >
          🔒 {lockedMsg}
        </div>
      )}
      <BusinessPalettePreview {...palette} />
      {tab === "presets" && (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold opacity-60 uppercase">
                  {group.label}
                </p>
                {group.locked && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "#a855f720", color: "#c084fc" }}
                  >
                    {group.lockLabel}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((pr) => {
                  const p = pr.palette;
                  const isActive = palette.name === (pr.name || p.name);
                  const isAnimated = (p as any).animated;
                  return (
                    <button
                      key={pr.name}
                      onClick={() => {
                        if (group.locked) {
                          setLockedMsg(group.lockLabel);
                          setTimeout(() => setLockedMsg(""), 3000);
                          return;
                        }
                        handleSelect(p, pr.name);
                      }}
                      onMouseEnter={() => !group.locked && handleHover(p)}
                      onMouseLeave={() => !group.locked && handleHoverEnd()}
                      className="p-2 rounded-xl border text-xs font-semibold transition-all relative overflow-hidden"
                      style={{
                        background: p.bg,
                        borderColor: isActive ? p.accent : p.accent + "30",
                        boxShadow: isActive ? `0 0 0 2px ${p.accent}` : "none",
                        opacity: group.locked ? 0.45 : 1,
                      }}
                    >
                      {isAnimated && (
                        <div
                          className="absolute top-1 right-1 text-[8px] font-black px-1 py-0.5 rounded-full"
                          style={{ background: "#a855f7", color: "#fff" }}
                        >
                          ✨
                        </div>
                      )}
                      <div
                        className="w-6 h-6 rounded-full mx-auto mb-1"
                        style={{ background: p.accent }}
                      />
                      <p
                        className="leading-tight truncate"
                        style={{ color: p.text, fontSize: 9 }}
                      >
                        {pr.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "custom" && isPremium && (
        <div className="space-y-4">
          {/* Live mini-preview */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: palette.border ?? "#333" }}
          >
            {/* Header bar */}
            <div
              className="px-3 py-2 flex items-center gap-2"
              style={{ background: palette.accent }}
            >
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  background: palette.accentText ?? "#fff",
                  opacity: 0.3,
                }}
              />
              <p
                className="text-xs font-black"
                style={{ color: palette.accentText ?? "#fff" }}
              >
                Mi Negocio
              </p>
            </div>
            {/* Body */}
            <div className="p-3 space-y-2" style={{ background: palette.bg }}>
              <p
                className="text-xs font-semibold"
                style={{ color: palette.textMuted }}
              >
                Descripción del negocio de ejemplo
              </p>
              <div
                className="p-2 rounded-xl border"
                style={{
                  background: palette.surface,
                  borderColor: palette.border ?? "#333",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ background: palette.surface2 ?? palette.surface }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-xs font-bold"
                      style={{ color: palette.text }}
                    >
                      Producto ejemplo
                    </p>
                    <p
                      className="text-xs font-black"
                      style={{ color: palette.priceColor ?? palette.accent }}
                    >
                      $99.99
                    </p>
                  </div>
                  <div
                    className="px-2 py-1 rounded-lg text-[10px] font-black"
                    style={{
                      background: palette.accent,
                      color: palette.accentText ?? "#fff",
                    }}
                  >
                    +
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={(palette as any)[key] ?? "#000000"}
                  onChange={(e) => {
                    const updated = { ...palette, [key]: e.target.value };
                    onChange(updated);
                  }}
                  className="w-8 h-8 rounded-lg border cursor-pointer flex-shrink-0"
                  style={{ borderColor: S.border }}
                />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
