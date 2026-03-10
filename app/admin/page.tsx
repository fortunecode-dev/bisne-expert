"use client";
import { useState, useEffect, useRef } from "react";
import {
  Business,
  BusinessDetail,
  Product,
  ProductTag,
  BusinessPalette,
  Lang,
  LocalizedString,
  SeoMeta,
  StructuredSchedule,
  Weekday,
  WEEKDAYS,
  DEFAULT_PALETTE,
  makeDefaultSchedule,
  DEFAULT_DAY_SCHEDULE,
} from "@/types";
import {
  DARK_PALETTES,
  LIGHT_PALETTES,
  HOLIDAY_PALETTES,
  applyGlobalPalette,
} from "@/lib/palette";
// Config and custom palettes are persisted via /api/data on the server
import { getL } from "@/lib/data";
import { isOpenNow, DAY_NAMES_ES } from "@/lib/schedule";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const emptyLocale = (): LocalizedString => ({ es: "", en: "" });
const emptySeo = (): SeoMeta => ({
  title: emptyLocale(),
  description: emptyLocale(),
  keywords: [],
});

type AdminBiz = Business & { detail: BusinessDetail };

function emptyBusiness(id: number): AdminBiz {
  return {
    id,
    slug: "",
    name: { es: "", en: "" },
    description: { es: "", en: "" },
    logo: "",
    image: "",
    hidden: false,
    seo: emptySeo(),
    detail: {
      slug: "",
      province: "",
      municipality: "",
      address: emptyLocale(),
      phone: "",
      cardNumber: "",
      paymentMethods: ["cash"],
      donationsEnabled: false,
      website: "",
      schedule: makeDefaultSchedule(),
      currency: "USD",
      socialLinks: {},
      palette: { ...DEFAULT_PALETTE },
      seo: emptySeo(),
    },
  };
}

function emptyProduct(id: number): Product {
  return {
    id,
    name: emptyLocale(),
    description: emptyLocale(),
    price: 0,
    image: "",
    imageKeywords: [],
    category: emptyLocale(),
    featured: false,
    hidden: false,
    available: true,
    position: id,
    tags: [],
    seo: emptySeo(),
  };
}

// ─── Small UI components ──────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2 rounded-xl text-sm border outline-none";
const inputStyle = {
  background: "var(--color-surface-2)",
  borderColor: "var(--color-border)",
  color: "var(--color-text)",
};

function TF({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
        style={inputStyle}
      />
    </div>
  );
}

function LF({
  label,
  value,
  onChange,
  multiline,
  required,
}: {
  label: string;
  value: LocalizedString;
  onChange: (v: LocalizedString) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className="space-y-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {(["es", "en"] as const).map((l) => (
          <div key={l} className="relative">
            <Tag
              value={value[l]}
              onChange={(e: any) => onChange({ ...value, [l]: e.target.value })}
              placeholder={l.toUpperCase()}
              className={
                inputCls + (multiline ? " resize-none min-h-[64px]" : "")
              }
              style={inputStyle}
              rows={multiline ? 2 : undefined}
            />
            <span
              className="absolute top-2 right-2 text-xs font-bold opacity-25"
              style={{ color: "var(--color-text)" }}
            >
              {l.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sec({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <div
        className="px-4 py-2.5 border-b"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-2)",
        }}
      >
        <h3
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function Chk({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer"
      onClick={() => onChange(!value)}
    >
      <div
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
        style={{
          borderColor: value ? "var(--color-accent)" : "var(--color-border)",
          background: value ? "var(--color-accent)" : "transparent",
        }}
      >
        {value && <span className="text-white text-xs font-bold">✓</span>}
      </div>
      <span className="text-sm" style={{ color: "var(--color-text)" }}>
        {label}
      </span>
    </label>
  );
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
function ImgUpload({
  label,
  value,
  onChange,
  nameHint = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  nameHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      if (nameHint) fd.append("name", nameHint);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        onChange(url);
      } else {
        alert("Error al subir imagen al servidor");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </label>
      <div
        className="relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        style={{
          borderColor: drag ? "var(--color-accent)" : value ? "var(--color-accent)" : "var(--color-border)",
          minHeight: value ? "auto" : 90,
          background: "var(--color-surface-2)",
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        {uploading ? (
          <div className="py-6 text-center">
            <div className="text-2xl mb-1">⏳</div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Subiendo al servidor…</p>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="" className="w-full max-h-36 object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
              <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full">
                🔄 Cambiar
              </span>
            </div>
          </>
        ) : (
          <div className="py-5 text-center">
            <div className="text-2xl mb-1">📷</div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Arrastra o haz click · se sube al servidor
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <input
        value={value.startsWith("/uploads/") || value === "" ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="O pega URL externa…"
        className={`${inputCls} text-xs`}
        style={inputStyle}
      />
      {value.startsWith("/uploads/") && (
        <p className="text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
          ✓ Imagen guardada en el servidor
        </p>
      )}
    </div>
  );
}

// ─── Schedule Editor ──────────────────────────────────────────────────────────
function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: StructuredSchedule;
  onChange: (s: StructuredSchedule) => void;
}) {
  const upd = (partial: Partial<StructuredSchedule>) =>
    onChange({ ...schedule, ...partial });
  const updDay = (
    day: Weekday,
    partial: Partial<typeof schedule.days.monday>,
  ) =>
    onChange({
      ...schedule,
      days: { ...schedule.days, [day]: { ...schedule.days[day], ...partial } },
    });

  return (
    <div className="space-y-3">
      <Chk
        label="⚡ Siempre abierto (24/7)"
        value={schedule.alwaysOpen}
        onChange={(v) => upd({ alwaysOpen: v })}
      />

      {!schedule.alwaysOpen && (
        <div className="space-y-2">
          {WEEKDAYS.map((day) => {
            const ds = schedule.days[day] ?? { ...DEFAULT_DAY_SCHEDULE };
            return (
              <div
                key={day}
                className="flex items-center gap-2 p-2 rounded-xl border"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface-2)",
                }}
              >
                <span
                  className="text-xs font-bold w-8 flex-shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {DAY_NAMES_ES[day]}
                </span>
                <label
                  className="flex items-center gap-1.5 cursor-pointer"
                  onClick={() => updDay(day, { closed: !ds.closed })}
                >
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: ds.closed
                        ? "#dc2626"
                        : "var(--color-border)",
                      background: ds.closed ? "#dc2626" : "transparent",
                    }}
                  >
                    {ds.closed && <span className="text-white text-xs">✕</span>}
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      color: ds.closed ? "#f87171" : "var(--color-text-muted)",
                    }}
                  >
                    Cerrado
                  </span>
                </label>
                {!ds.closed && (
                  <>
                    <label
                      className="flex items-center gap-1.5 cursor-pointer ml-1"
                      onClick={() => updDay(day, { h24: !ds.h24 })}
                    >
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: ds.h24
                            ? "var(--color-accent)"
                            : "var(--color-border)",
                          background: ds.h24
                            ? "var(--color-accent)"
                            : "transparent",
                        }}
                      >
                        {ds.h24 && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{
                          color: ds.h24
                            ? "var(--color-accent)"
                            : "var(--color-text-muted)",
                        }}
                      >
                        24h
                      </span>
                    </label>
                    {!ds.h24 && (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="time"
                          value={ds.open}
                          onChange={(e) =>
                            updDay(day, { open: e.target.value })
                          }
                          className="flex-1 px-2 py-1 rounded-lg text-xs border outline-none"
                          style={{
                            background: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                            minWidth: 0,
                          }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          –
                        </span>
                        <input
                          type="time"
                          value={ds.close}
                          onChange={(e) =>
                            updDay(day, { close: e.target.value })
                          }
                          className="flex-1 px-2 py-1 rounded-lg text-xs border outline-none"
                          style={{
                            background: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                            minWidth: 0,
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
      )}
    </div>
  );
}

// ─── Tags Editor ─────────────────────────────────────────────────────────────
function TagsEditor({
  tags,
  onChange,
}: {
  tags: ProductTag[];
  onChange: (t: ProductTag[]) => void;
}) {
  const add = () =>
    onChange([
      ...tags,
      {
        label: { es: "Nuevo", en: "New" },
        color: "#e8500a",
        textColor: "#ffffff",
      },
    ]);
  const del = (i: number) => onChange(tags.filter((_, j) => j !== i));
  const upd = (i: number, t: ProductTag) =>
    onChange(tags.map((o, j) => (j === i ? t : o)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-text-muted)" }}
        >
          Etiquetas
        </label>
        <button
          onClick={add}
          className="text-xs px-2.5 py-1 rounded-lg font-bold"
          style={{ background: "var(--color-accent)", color: "white" }}
        >
          + Añadir
        </button>
      </div>
      {tags.length === 0 && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Sin etiquetas
        </p>
      )}
      {tags.map((tag, i) => (
        <div
          key={i}
          className="p-3 rounded-xl border space-y-2"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface-2)",
          }}
        >
          {/* Label bilingual */}
          <div className="grid grid-cols-2 gap-2">
            <input
              value={tag.label.es}
              onChange={(e) =>
                upd(i, { ...tag, label: { ...tag.label, es: e.target.value } })
              }
              placeholder="ES"
              className={`${inputCls} text-xs`}
              style={inputStyle}
            />
            <input
              value={tag.label.en}
              onChange={(e) =>
                upd(i, { ...tag, label: { ...tag.label, en: e.target.value } })
              }
              placeholder="EN"
              className={`${inputCls} text-xs`}
              style={inputStyle}
            />
          </div>
          {/* Colors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="relative w-8 h-8 rounded-lg overflow-hidden border flex-shrink-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                <input
                  type="color"
                  value={tag.color}
                  onChange={(e) => upd(i, { ...tag, color: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: tag.color }}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Fondo
                </p>
                <input
                  value={tag.color}
                  onChange={(e) => upd(i, { ...tag, color: e.target.value })}
                  className="text-xs w-full bg-transparent outline-none font-mono"
                  style={{ color: "var(--color-text)" }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div
                className="relative w-8 h-8 rounded-lg overflow-hidden border flex-shrink-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                <input
                  type="color"
                  value={tag.textColor ?? "#ffffff"}
                  onChange={(e) =>
                    upd(i, { ...tag, textColor: e.target.value })
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: tag.textColor ?? "#ffffff" }}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Texto
                </p>
                <input
                  value={tag.textColor ?? "#ffffff"}
                  onChange={(e) =>
                    upd(i, { ...tag, textColor: e.target.value })
                  }
                  className="text-xs w-full bg-transparent outline-none font-mono"
                  style={{ color: "var(--color-text)" }}
                />
              </div>
            </div>
            {/* Preview */}
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
              style={{ background: tag.color, color: tag.textColor ?? "#fff" }}
            >
              {tag.label.es || "Tag"}
            </span>
            <button
              onClick={() => del(i)}
              className="text-red-400 text-sm flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Palette Editor ───────────────────────────────────────────────────────────
function PaletteEditor({
  palette,
  onChange,
}: {
  palette: BusinessPalette;
  onChange: (p: BusinessPalette) => void;
}) {
  const [tab, setTab] = useState<"presets" | "custom">("presets");
  const [customName, setCustomName] = useState(palette.name ?? "");
  const [savedCustom, setSavedCustom] = useState<
    { name: string; palette: BusinessPalette }[]
  >([]);

  // Load custom palettes from config on mount
  useEffect(() => {
    fetch('/api/data?file=config').then(r => r.ok ? r.json() : null).then(cfg => {
      if (cfg?.customPalettes) setSavedCustom(cfg.customPalettes)
    }).catch(() => {})
  }, [])

  const saveCustom = async () => {
    const name = customName.trim() || "Mi paleta";
    const entry = { name, palette: { ...palette, name } }
    const updated = [...savedCustom.filter(p => p.name !== name), entry]
    setSavedCustom(updated)
    onChange({ ...palette, name })
    // Persist to server — merge into existing config
    const cfg = await fetch('/api/data?file=config').then(r => r.ok ? r.json() : {}).catch(() => ({}))
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: 'config', data: { ...cfg, customPalettes: updated } }) })
  };

  const deleteCustom = async (name: string) => {
    const updated = savedCustom.filter(p => p.name !== name)
    setSavedCustom(updated)
    const cfg = await fetch('/api/data?file=config').then(r => r.ok ? r.json() : {}).catch(() => ({}))
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: 'config', data: { ...cfg, customPalettes: updated } }) })
  };

  const fields: { key: keyof BusinessPalette; label: string }[] = [
    { key: "accent", label: "Color principal" },
    { key: "accentText", label: "Texto sobre acento" },
    { key: "accentSoft", label: "Acento suave" },
    { key: "bg", label: "Fondo de página" },
    { key: "surface", label: "Superficie (cards)" },
    { key: "surface2", label: "Superficie 2 (inputs)" },
    { key: "border", label: "Bordes" },
    { key: "text", label: "Texto principal" },
    { key: "textMuted", label: "Texto secundario" },
    { key: "priceColor", label: "Color precios" },
  ];

  const groups = [
    { label: "🌑 Oscuras (10)", items: DARK_PALETTES },
    { label: "☀️ Claras (10)", items: LIGHT_PALETTES },
    { label: "🎉 Festividades", items: HOLIDAY_PALETTES },
    ...(savedCustom.length > 0
      ? [{ label: "⭐ Mis paletas", items: savedCustom }]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["presets", "custom"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={
              tab === t
                ? { background: "var(--color-accent)", color: "white" }
                : {
                    background: "var(--color-surface-2)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                  }
            }
          >
            {t === "presets" ? "🎨 Predefinidas" : "✏️ Personalizar"}
          </button>
        ))}
      </div>

      {tab === "presets" && (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p
                className="text-xs font-bold uppercase tracking-wide mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                {group.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.items.map((preset) => {
                  const p = preset.palette;
                  const isActive = palette.name === (preset.name || p.name);
                  return (
                    <button
                      key={preset.name}
                      onClick={() => onChange({ ...p, name: preset.name })}
                      className="rounded-xl p-2.5 border text-left transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: p.bg,
                        borderColor: isActive ? p.accent : p.border,
                        boxShadow: isActive ? `0 0 0 2px ${p.accent}` : "none",
                      }}
                    >
                      <div className="flex gap-1 mb-1.5">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ background: p.accent }}
                        />
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ background: p.surface }}
                        />
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ background: p.priceColor }}
                        />
                      </div>
                      <p
                        className="text-xs font-semibold leading-tight"
                        style={{ color: p.text, fontSize: 10 }}
                      >
                        {preset.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "custom" && (
        <div className="space-y-4">
          {/* Color pickers grid */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="relative w-9 h-9 rounded-lg border overflow-hidden flex-shrink-0 cursor-pointer"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <input
                    type="color"
                    value={(palette as any)[key] ?? "#000000"}
                    onChange={(e) =>
                      onChange({ ...palette, [key]: e.target.value })
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{ background: (palette as any)[key] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--color-text)", fontSize: 10 }}
                  >
                    {label}
                  </p>
                  <input
                    value={(palette as any)[key] ?? ""}
                    onChange={(e) =>
                      onChange({ ...palette, [key]: e.target.value })
                    }
                    className="text-xs w-full bg-transparent outline-none font-mono"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Save custom palette */}
          <div className="flex gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nombre de la paleta..."
              className={`${inputCls} flex-1 text-xs`}
              style={inputStyle}
            />
            <button
              onClick={saveCustom}
              className="px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              💾 Guardar
            </button>
          </div>

          {savedCustom.length > 0 && (
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wide mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Mis paletas guardadas
              </p>
              {savedCustom.map((cp) => (
                <div key={cp.name} className="flex items-center gap-2 mb-1.5">
                  <button
                    onClick={() => onChange({ ...cp.palette, name: cp.name })}
                    className="flex-1 flex items-center gap-2 p-2 rounded-xl border text-left"
                    style={{
                      background: cp.palette.bg,
                      borderColor: cp.palette.border,
                    }}
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ background: cp.palette.accent }}
                      />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ background: cp.palette.priceColor }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold truncate"
                      style={{ color: cp.palette.text }}
                    >
                      {cp.name}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteCustom(cp.name)}
                    className="text-red-400 text-sm px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Live preview */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wide mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              Vista previa
            </p>
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ background: palette.bg, borderColor: palette.border }}
            >
              <div
                className="h-16"
                style={{
                  background: `linear-gradient(135deg,${palette.accent}30,${palette.bg})`,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl opacity-20">🏪</span>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2"
                    style={{
                      background: palette.accent,
                      borderColor: palette.bg,
                    }}
                  >
                    🏪
                  </div>
                  <div>
                    <p
                      className="font-black text-sm"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: palette.text,
                      }}
                    >
                      Nombre del negocio
                    </p>
                    <p className="text-xs" style={{ color: palette.textMuted }}>
                      Descripción breve
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden border"
                      style={{
                        background: palette.surface,
                        borderColor: palette.border,
                      }}
                    >
                      <div
                        className="h-14"
                        style={{ background: palette.surface2 }}
                      >
                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">
                          🍔
                        </div>
                      </div>
                      <div className="p-2 flex justify-between items-center">
                        <span
                          className="text-xs font-bold"
                          style={{ color: palette.priceColor }}
                        >
                          $5.50
                        </span>
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            background: palette.accent,
                            color: palette.accentText,
                          }}
                        >
                          +
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Draggable Product List ───────────────────────────────────────────────────
function DraggableProducts({
  products,
  lang,
  onEdit,
  onHide,
  onDelete,
  onReorder,
}: {
  products: Product[];
  lang: Lang;
  onEdit: (p: Product) => void;
  onHide: (id: number) => void;
  onDelete: (id: number) => void;
  onReorder: (p: Product[]) => void;
}) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const sorted = [...products].sort(
    (a, b) => (a.position ?? 99) - (b.position ?? 99),
  );

  return (
    <div className="space-y-2">
      {sorted.map((p, idx) => (
        <div
          key={p.id}
          draggable
          onDragStart={() => setDraggingId(p.id)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIdx(idx);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggingId === null) return;
            const from = sorted.findIndex((x) => x.id === draggingId);
            if (from === idx) {
              setDraggingId(null);
              setOverIdx(null);
              return;
            }
            const r = [...sorted];
            const [m] = r.splice(from, 1);
            r.splice(idx, 0, m);
            onReorder(r.map((x, i) => ({ ...x, position: i + 1 })));
            setDraggingId(null);
            setOverIdx(null);
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setOverIdx(null);
          }}
          className="flex items-center gap-3 p-3 rounded-2xl border transition-all"
          style={{
            borderColor:
              overIdx === idx ? "var(--color-accent)" : "var(--color-border)",
            background:
              draggingId === p.id
                ? "var(--color-surface-2)"
                : "var(--color-surface)",
            opacity: draggingId === p.id ? 0.5 : 1,
            cursor: "grab",
          }}
        >
          <div
            className="text-base select-none flex-shrink-0"
            style={{ color: "var(--color-border)", letterSpacing: -2 }}
          >
            ⠿⠿
          </div>
          <div
            className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-2)",
            }}
          >
            {p.image ? (
              <img
                src={p.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-30">
                🍽️
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-sm truncate"
              style={{
                fontFamily: "var(--font-display)",
                color: p.hidden
                  ? "var(--color-text-muted)"
                  : "var(--color-text)",
              }}
            >
              {getL(p.name, lang)}
              {p.featured && (
                <span
                  className="ml-1 text-xs"
                  style={{ color: "var(--color-accent)" }}
                >
                  ★
                </span>
              )}
              {p.hidden && (
                <span className="ml-1 text-xs text-zinc-500">(oculto)</span>
              )}
              {p.available === false && (
                <span className="ml-1 text-xs text-zinc-500">(agotado)</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className="text-xs font-bold"
                style={{ color: "var(--color-accent)" }}
              >
                ${p.price.toFixed(2)}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {getL(p.category, lang)}
              </span>
              {(p.tags ?? []).map((t, i) => (
                <span
                  key={i}
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: t.color, color: t.textColor ?? "#fff" }}
                >
                  {getL(t.label, lang)}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => onEdit(p)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              ✏️
            </button>
            <button
              onClick={() => onHide(p.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              {p.hidden ? "👁️" : "🙈"}
            </button>
            <button
              onClick={() => {
                if (confirm("¿Eliminar?")) onDelete(p.id);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
              style={{ borderColor: "#dc262640", color: "#f87171" }}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({
  product,
  onSave,
  onClose,
}: {
  product: Product;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const [p, setP] = useState<Product>({
    ...product,
    tags: [...(product.tags ?? [])],
  });
  const upd = (x: Partial<Product>) => setP((prev) => ({ ...prev, ...x }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl animate-slide-up flex flex-col overflow-hidden"
        style={{
          background: "var(--color-surface)",
          maxHeight: "95vh",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2
            className="font-bold text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {product.name.es || "Nuevo Producto"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Sec title="📷 Imagen">
            <ImgUpload
              label="Foto del producto"
              value={p.image}
              onChange={(v) => upd({ image: v })}
              nameHint={(p.name?.es || "product").slice(0, 30)}
            />
            <TF
              label="Keywords SEO de imagen"
              value={p.imageKeywords.join(", ")}
              onChange={(v) =>
                upd({
                  imageKeywords: v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="burger, artisan"
            />
          </Sec>
          <Sec title="📝 Información">
            <LF
              label="Nombre"
              value={p.name}
              onChange={(v) => upd({ name: v })}
              required
            />
            <LF
              label="Descripción"
              value={p.description}
              onChange={(v) => upd({ description: v })}
              multiline
            />
            <LF
              label="Categoría"
              value={p.category}
              onChange={(v) => upd({ category: v })}
            />
          </Sec>
          <Sec title="💰 Precio y disponibilidad">
            <div className="grid grid-cols-2 gap-3">
              <TF
                label="Precio"
                value={String(p.price)}
                type="number"
                onChange={(v) => upd({ price: parseFloat(v) || 0 })}
                placeholder="0.00"
              />
              <TF
                label="Precio original (tachado)"
                value={String(p.originalPrice ?? "")}
                type="number"
                onChange={(v) =>
                  upd({ originalPrice: v ? parseFloat(v) : undefined })
                }
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-4 flex-wrap">
              <Chk
                label="★ Destacado"
                value={p.featured}
                onChange={(v) => upd({ featured: v })}
              />
              <Chk
                label="Agotado"
                value={p.available === false}
                onChange={(v) => upd({ available: !v })}
              />
              <Chk
                label="Ocultar"
                value={p.hidden}
                onChange={(v) => upd({ hidden: v })}
              />
            </div>
            <TF
              label="Posición"
              value={String(p.position ?? "")}
              type="number"
              onChange={(v) => upd({ position: parseInt(v) || undefined })}
              placeholder="1"
            />
          </Sec>
          <Sec title="🏷️ Etiquetas">
            <TagsEditor
              tags={p.tags ?? []}
              onChange={(v) => upd({ tags: v })}
            />
          </Sec>
          <Sec title="🔍 SEO">
            <LF
              label="Título SEO"
              value={p.seo.title}
              onChange={(v) => upd({ seo: { ...p.seo, title: v } })}
            />
            <LF
              label="Descripción SEO"
              value={p.seo.description}
              onChange={(v) => upd({ seo: { ...p.seo, description: v } })}
              multiline
            />
            <TF
              label="Keywords"
              value={p.seo.keywords.join(", ")}
              onChange={(v) =>
                upd({
                  seo: {
                    ...p.seo,
                    keywords: v
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </Sec>
        </div>
        <div
          className="flex gap-3 px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={() => onSave(p)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            ✓ Guardar producto
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm border"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Business Modal ───────────────────────────────────────────────────────────
function BusinessModal({
  biz,
  onSave,
  onClose,
}: {
  biz: AdminBiz;
  onSave: (b: AdminBiz) => void;
  onClose: () => void;
}) {
  const [b, setB] = useState<AdminBiz>({
    ...biz,
    detail: {
      ...biz.detail,
      schedule: biz.detail.schedule ?? makeDefaultSchedule(),
      palette: biz.detail.palette ?? { ...DEFAULT_PALETTE },
    },
  });
  const [section, setSection] = useState<
    "info" | "contact" | "schedule" | "palette" | "seo"
  >("info");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const upd = (x: Partial<Business>) => setB((prev) => ({ ...prev, ...x }));
  const updD = (x: Partial<BusinessDetail>) =>
    setB((prev) => ({ ...prev, detail: { ...prev.detail, ...x } }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!b.slug.trim()) e.slug = "El slug es obligatorio";
    if (!b.name.es.trim()) e.name = "El nombre en español es obligatorio";
    if (!/^[a-z0-9-]+$/.test(b.slug))
      e.slugFormat = "Solo letras minúsculas, números y guiones";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(b);
  };

  const PAYMENT_OPTIONS = ["cash", "transfer", "card", "crypto", "paypal"];
  const tabs = [
    { id: "info", label: "📝 Info" },
    { id: "contact", label: "📞 Contacto" },
    { id: "schedule", label: "🕐 Horario" },
    { id: "palette", label: "🎨 Paleta" },
    { id: "seo", label: "🔍 SEO" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl animate-slide-up flex flex-col overflow-hidden"
        style={{
          background: "var(--color-surface)",
          maxHeight: "95vh",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2
            className="font-bold text-lg truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {b.name.es || "Nuevo negocio"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b flex-shrink-0 overflow-x-auto"
          style={{ borderColor: "var(--color-border)" }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className="flex-shrink-0 py-3 text-xs font-semibold transition-all px-3 whitespace-nowrap"
              style={{
                color:
                  section === t.id
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                borderBottom:
                  section === t.id
                    ? "2px solid var(--color-accent)"
                    : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ── INFO ── */}
          {section === "info" && (
            <>
              {(errors.slug || errors.name || errors.slugFormat) && (
                <div
                  className="p-3 rounded-xl text-xs"
                  style={{
                    background: "#dc262620",
                    color: "#f87171",
                    border: "1px solid #dc262640",
                  }}
                >
                  {errors.name && <p>• {errors.name}</p>}
                  {errors.slug && <p>• {errors.slug}</p>}
                  {errors.slugFormat && <p>• {errors.slugFormat}</p>}
                </div>
              )}
              <Sec title="🏪 Identidad">
                <LF
                  label="Nombre del negocio"
                  value={b.name}
                  onChange={(v) => {
                    upd({ name: v });
                    if (errors.name) setErrors((e) => ({ ...e, name: "" }));
                  }}
                  required
                />
                <LF
                  label="Descripción"
                  value={b.description ?? emptyLocale()}
                  onChange={(v) => upd({ description: v })}
                  multiline
                />
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Slug (URL) <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={b.slug}
                    onChange={(e) => {
                      const s = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-");
                      upd({ slug: s });
                      updD({ slug: s });
                      if (errors.slug)
                        setErrors((e) => ({ ...e, slug: "", slugFormat: "" }));
                    }}
                    placeholder="mi-restaurante"
                    className={inputCls}
                    style={{
                      ...inputStyle,
                      borderColor:
                        errors.slug || errors.slugFormat
                          ? "#dc2626"
                          : "var(--color-border)",
                    }}
                  />
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Solo letras, números y guiones. Ej:{" "}
                    <code>burger-house</code>
                  </p>
                </div>
              </Sec>
              <Sec title="🖼️ Imágenes">
                <ImgUpload
                  label="Logo"
                  value={b.logo ?? ""}
                  onChange={(v) => upd({ logo: v })}
                  nameHint={`${b.slug}-logo`}
                />
                <ImgUpload
                  label="Foto de portada"
                  value={b.image ?? ""}
                  onChange={(v) => upd({ image: v })}
                  nameHint={`${b.slug}-cover`}
                />
              </Sec>
              <Sec title="⚙️ Config">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Moneda
                    </label>
                    <select
                      value={b.detail.currency ?? "USD"}
                      onChange={(e) => updD({ currency: e.target.value })}
                      className={inputCls}
                      style={inputStyle}
                    >
                      {["USD", "CUP", "EUR", "MXN", "COP", "ARS", "BRL"].map(
                        (c) => (
                          <option key={c}>{c}</option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <Chk
                  label="Ocultar negocio"
                  value={b.hidden ?? false}
                  onChange={(v) => upd({ hidden: v })}
                />
                <Chk
                  label="⭐ Patrocinado (aparece primero)"
                  value={b.sponsored ?? false}
                  onChange={(v) => upd({ sponsored: v })}
                />
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide block"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Categorías (para filtros)
                  </label>
                  <input
                    value={(b.categories ?? []).join(", ")}
                    onChange={(e) =>
                      upd({
                        categories: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Comida, Hamburguesas, Fast Food"
                    className={inputCls}
                    style={inputStyle}
                  />
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Separa con comas. Aparecen como filtros en la página
                    principal.
                  </p>
                </div>
              </Sec>
            </>
          )}

          {/* ── CONTACT ── */}
          {section === "contact" && (
            <>
              <Sec title="📍 Ubicación">
                <div className="grid grid-cols-2 gap-3">
                  <TF
                    label="Provincia"
                    value={b.detail.province ?? ""}
                    onChange={(v) => updD({ province: v })}
                    placeholder="La Habana"
                  />
                  <TF
                    label="Municipio"
                    value={b.detail.municipality ?? ""}
                    onChange={(v) => updD({ municipality: v })}
                    placeholder="Vedado"
                  />
                </div>
                <LF
                  label="Dirección (calle / número)"
                  value={b.detail.address ?? emptyLocale()}
                  onChange={(v) => updD({ address: v })}
                />
              </Sec>
              <Sec title="📞 Contacto">
                <TF
                  label="Teléfono (para WhatsApp)"
                  value={b.detail.phone ?? ""}
                  onChange={(v) => updD({ phone: v })}
                  placeholder="5312345678"
                />
                <TF
                  label="Sitio web"
                  value={b.detail.website ?? ""}
                  onChange={(v) => updD({ website: v })}
                  placeholder="https://..."
                />
              </Sec>
              <Sec title="💳 Pagos">
                <TF
                  label="Número de tarjeta"
                  value={b.detail.cardNumber ?? ""}
                  onChange={(v) => updD({ cardNumber: v })}
                  placeholder="9204-XXXX-XXXX-XXXX"
                />
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wide block mb-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Métodos de pago
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_OPTIONS.map((opt) => {
                      const active = (b.detail.paymentMethods ?? []).includes(
                        opt,
                      );
                      return (
                        <button
                          key={opt}
                          onClick={() =>
                            updD({
                              paymentMethods: active
                                ? (b.detail.paymentMethods ?? []).filter(
                                    (p) => p !== opt,
                                  )
                                : [...(b.detail.paymentMethods ?? []), opt],
                            })
                          }
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                          style={
                            active
                              ? {
                                  background: "var(--color-accent)",
                                  color: "white",
                                  borderColor: "var(--color-accent)",
                                }
                              : {
                                  borderColor: "var(--color-border)",
                                  color: "var(--color-text-muted)",
                                }
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Chk
                  label="💛 Habilitar donaciones/propinas"
                  value={b.detail.donationsEnabled ?? false}
                  onChange={(v) => updD({ donationsEnabled: v })}
                />
              </Sec>
              <Sec title="🔗 Redes sociales">
                {(
                  [
                    "instagram",
                    "facebook",
                    "telegram",
                    "twitter",
                    "whatsapp",
                    "tiktok",
                  ] as const
                ).map((net) => (
                  <TF
                    key={net}
                    label={net.charAt(0).toUpperCase() + net.slice(1)}
                    value={b.detail.socialLinks?.[net] ?? ""}
                    onChange={(v) =>
                      updD({
                        socialLinks: { ...b.detail.socialLinks, [net]: v },
                      })
                    }
                    placeholder={`https://${net}.com/...`}
                  />
                ))}
              </Sec>
            </>
          )}

          {/* ── SCHEDULE ── */}
          {section === "schedule" && (
            <Sec title="🕐 Horario de atención">
              <ScheduleEditor
                schedule={b.detail.schedule ?? makeDefaultSchedule()}
                onChange={(s) => updD({ schedule: s })}
              />
            </Sec>
          )}

          {/* ── PALETTE ── */}
          {section === "palette" && (
            <Sec title="🎨 Paleta de colores del catálogo">
              <PaletteEditor
                palette={b.detail.palette ?? DEFAULT_PALETTE}
                onChange={(p) => updD({ palette: p })}
              />
            </Sec>
          )}

          {/* ── SEO ── */}
          {section === "seo" && (
            <>
              <Sec title="🔍 SEO del negocio">
                <LF
                  label="Título SEO"
                  value={b.seo?.title ?? emptyLocale()}
                  onChange={(v) =>
                    upd({ seo: { ...(b.seo ?? emptySeo()), title: v } })
                  }
                />
                <LF
                  label="Descripción SEO"
                  value={b.seo?.description ?? emptyLocale()}
                  onChange={(v) =>
                    upd({ seo: { ...(b.seo ?? emptySeo()), description: v } })
                  }
                  multiline
                />
                <TF
                  label="Keywords"
                  value={(b.seo?.keywords ?? []).join(", ")}
                  onChange={(v) =>
                    upd({
                      seo: {
                        ...(b.seo ?? emptySeo()),
                        keywords: v
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </Sec>
              <Sec title="🔍 SEO del catálogo">
                <LF
                  label="Título del catálogo"
                  value={b.detail.seo?.title ?? emptyLocale()}
                  onChange={(v) =>
                    updD({ seo: { ...(b.detail.seo ?? emptySeo()), title: v } })
                  }
                />
                <LF
                  label="Descripción"
                  value={b.detail.seo?.description ?? emptyLocale()}
                  onChange={(v) =>
                    updD({
                      seo: { ...(b.detail.seo ?? emptySeo()), description: v },
                    })
                  }
                  multiline
                />
              </Sec>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            ✓ Guardar negocio
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm border"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiGet(file: string) {
  const res = await fetch(`/api/data?file=${encodeURIComponent(file)}`)
  return res.ok ? res.json() : null
}
async function apiSave(file: string, data: unknown) {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, data }),
  })
  return res.ok
}
async function apiDel(file: string) {
  const res = await fetch(`/api/data?file=${encodeURIComponent(file)}`, { method: 'DELETE' })
  return res.ok
}

export default function AdminPage() {
  const [lang, setLang] = useState<Lang>("es");
  const [tab, setTab] = useState<"businesses" | "products" | "config">("businesses");
  const [businesses, setBusinesses] = useState<AdminBiz[]>([]);
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [editingBiz, setEditingBiz] = useState<AdminBiz | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({ customPalettes: [], developer: {} });
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load everything from the server on mount ──
  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const bizData = await apiGet('businesses')
        if (!bizData) return
        const bizList: Business[] = bizData.businesses

        const [detailResults, prodResults, cfg] = await Promise.all([
          Promise.allSettled(bizList.map(b => apiGet(`business/${b.slug}`).then(d => ({ slug: b.slug, d: d ?? { slug: b.slug } })))),
          Promise.allSettled(bizList.map(b => apiGet(`products/${b.slug}`).then(d => ({ slug: b.slug, p: d?.products ?? [] })))),
          apiGet('config'),
        ])

        const detailMap: Record<string, any> = {}
        detailResults.forEach(r => { if (r.status === 'fulfilled') detailMap[r.value.slug] = r.value.d })

        const prodMap: Record<string, Product[]> = {}
        prodResults.forEach(r => { if (r.status === 'fulfilled') prodMap[r.value.slug] = r.value.p })

        setBusinesses(bizList.map(b => ({ ...b, detail: detailMap[b.slug] ?? { slug: b.slug } })))
        setProducts(prodMap)
        if (cfg) setConfig(cfg)
      } finally {
        setLoading(false)
      }
    })()
  }, []);

  // ── Persist businesses list helper ──
  const persistBizList = async (list: AdminBiz[]) => {
    await apiSave('businesses', { businesses: list.map(({ detail, ...b }) => b) })
  }

  const saveBiz = async (b: AdminBiz) => {
    const newList = businesses.some(x => x.id === b.id)
      ? businesses.map(x => x.id === b.id ? b : x)
      : [...businesses, b]
    setBusinesses(newList)
    if (!products[b.slug]) setProducts(prev => ({ ...prev, [b.slug]: [] }))
    setEditingBiz(null)
    await persistBizList(newList)
    await apiSave(`business/${b.slug}`, b.detail)
    if (!products[b.slug]) await apiSave(`products/${b.slug}`, { products: [] })
    showToast("✓ Negocio guardado en el servidor")
  };

  const deleteBiz = async (slug: string) => {
    if (!confirm("¿Eliminar negocio?")) return;
    const newList = businesses.filter(b => b.slug !== slug)
    setBusinesses(newList)
    setProducts(prev => { const n = { ...prev }; delete n[slug]; return n })
    if (selectedSlug === slug) setSelectedSlug(null)
    await persistBizList(newList)
    await apiDel(`business/${slug}`)
    await apiDel(`products/${slug}`)
    showToast("Negocio eliminado")
  };

  const saveProduct = async (p: Product) => {
    if (!selectedSlug) return;
    const list = products[selectedSlug] ?? []
    const newList = list.some(x => x.id === p.id) ? list.map(x => x.id === p.id ? p : x) : [...list, p]
    setProducts(prev => ({ ...prev, [selectedSlug]: newList }))
    setEditingProduct(null)
    await apiSave(`products/${selectedSlug}`, { products: newList })
    showToast("✓ Producto guardado en el servidor")
  };

  const deleteProduct = async (id: number) => {
    if (!selectedSlug) return;
    const newList = (products[selectedSlug] ?? []).filter(p => p.id !== id)
    setProducts(prev => ({ ...prev, [selectedSlug]: newList }))
    await apiSave(`products/${selectedSlug}`, { products: newList })
    showToast("Producto eliminado")
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const handleBackup = async () => {
    showToast('⏳ Generando backup…')
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) { showToast('⚠️ Error al generar backup'); return }
      const blob = await res.blob()
      const cd = res.headers.get('content-disposition') ?? ''
      const filename = cd.match(/filename="(.+?)"/)?.[1] ?? 'catalogos-backup.zip'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      showToast('✓ Backup descargado')
    } catch {
      showToast('⚠️ Error al descargar backup')
    }
  }

  const selectedProducts = selectedSlug ? (products[selectedSlug] ?? []) : [];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
      <div className="text-center space-y-3">
        <div className="text-5xl animate-pulse">🏪</div>
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
          Cargando datos del servidor…
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full text-sm font-semibold shadow-2xl animate-slide-down"
          style={{ background: "var(--color-accent)", color: "white" }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          background: "rgba(15,15,15,0.92)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            ←
          </Link>
          <span
            className="font-black flex-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ⚙️ Admin
          </span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="px-2 py-1.5 rounded-lg text-xs border outline-none"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = (ev) => {
                try {
                  const d = JSON.parse(ev.target?.result as string);
                  if (d.businesses) {
                    setBusinesses(
                      d.businesses.map((b: Business) => ({
                        ...b,
                        detail: { slug: b.slug },
                      })),
                    );
                    showToast("✓ Importado");
                  }
                } catch {
                  showToast("❌ JSON inválido");
                }
              };
              r.readAsText(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            📥 Importar
          </button>
          <button
            onClick={handleBackup}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-all"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            title="Descargar backup ZIP de todos los datos e imágenes"
          >
            💾 Backup
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-all"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
          >
            🚪 Salir
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["businesses", "products", "config"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={
                tab === t
                  ? { background: "var(--color-accent)", color: "white" }
                  : {
                      background: "var(--color-surface)",
                      color: "var(--color-text-muted)",
                      border: "1px solid var(--color-border)",
                    }
              }
            >
              {t === "businesses"
                ? "🏪 Negocios"
                : t === "products"
                  ? "📦 Productos"
                  : "⚙️ Config"}
            </button>
          ))}
        </div>

        {/* ── BUSINESSES ── */}
        {tab === "businesses" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xl font-black"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Negocios
              </h2>
              <button
                onClick={() =>
                  setEditingBiz(emptyBusiness(businesses.length + 1))
                }
                className="px-4 py-2 rounded-xl text-sm font-bold active:scale-95"
                style={{ background: "var(--color-accent)", color: "white" }}
              >
                + Nuevo negocio
              </button>
            </div>
            <div className="space-y-3">
              {businesses.map((b) => {
                const palette = b.detail.palette ?? DEFAULT_PALETTE;
                const isOpen = isOpenNow(b.detail.schedule);
                const location = [b.detail.municipality, b.detail.province]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <div
                    key={b.slug}
                    className="rounded-2xl border overflow-hidden transition-all hover:border-white/15"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    {/* Mini cover preview */}
                    <div
                      className="relative h-14 overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg,${palette.accent}25,${palette.bg})`,
                      }}
                    >
                      {b.image && (
                        <img
                          src={b.image}
                          alt=""
                          className="w-full h-full object-cover opacity-40"
                        />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to right, rgba(0,0,0,0.4), transparent)",
                        }}
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {[
                          palette.accent,
                          palette.surface,
                          palette.priceColor,
                        ].map((c, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full border"
                            style={{
                              background: c,
                              borderColor: "rgba(255,255,255,0.2)",
                            }}
                          />
                        ))}
                      </div>
                      <div
                        className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: isOpen
                            ? `${palette.accent}30`
                            : "rgba(80,80,80,0.3)",
                          color: isOpen ? palette.accent : "#888",
                          border: `1px solid ${isOpen ? palette.accent + "40" : "#88888830"}`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: isOpen ? palette.accent : "#888",
                          }}
                        />
                        {isOpen
                          ? lang === "es"
                            ? "Abierto"
                            : "Open"
                          : lang === "es"
                            ? "Cerrado"
                            : "Closed"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3">
                      {/* Logo */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border flex-shrink-0 -mt-6 shadow-lg border-2"
                        style={{
                          background: b.logo ? "transparent" : palette.accent,
                          borderColor: "var(--color-surface)",
                        }}
                      >
                        {b.logo ? (
                          <img
                            src={b.logo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            {b.slug === "burger-house"
                              ? "🍔"
                              : b.slug === "pizza-palace"
                                ? "🍕"
                                : "🏪"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="font-black truncate"
                            style={{
                              fontFamily: "var(--font-display)",
                              color: b.hidden
                                ? "var(--color-text-muted)"
                                : "var(--color-text)",
                            }}
                          >
                            {getL(b.name, lang) || (
                              <span className="opacity-40">Sin nombre</span>
                            )}
                          </p>
                          {b.hidden && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                              oculto
                            </span>
                          )}
                          {b.sponsored && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: "#eab30820",
                                color: "#eab308",
                                border: "1px solid #eab30840",
                              }}
                            >
                              ⭐ patrocinado
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          /{b.slug} {location ? `· 📍 ${location}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        <button
                          onClick={() => {
                            setSelectedSlug(b.slug);
                            setTab("products");
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          📦 {(products[b.slug] ?? []).length}
                        </button>
                        <button
                          onClick={() =>
                            setBusinesses((prev) =>
                              prev.map((x) =>
                                x.slug === b.slug
                                  ? { ...x, sponsored: !x.sponsored }
                                  : x,
                              ),
                            )
                          }
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80"
                          style={{
                            borderColor: b.sponsored
                              ? "#eab308"
                              : "var(--color-border)",
                            color: b.sponsored
                              ? "#eab308"
                              : "var(--color-text-muted)",
                            background: b.sponsored
                              ? "#eab30820"
                              : "transparent",
                          }}
                        >
                          {b.sponsored ? "⭐ Patrocinado" : "☆ Patrocinar"}
                        </button>
                        <button
                          onClick={() => setEditingBiz(b)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80"
                          style={{
                            borderColor: "var(--color-accent)",
                            color: "var(--color-accent)",
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <Link
                          href={`/business/${b.slug}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          👁️ Ver
                        </Link>
                        <button
                          onClick={() => deleteBiz(b.slug)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center border text-sm hover:opacity-80"
                          style={{ borderColor: "#dc262640", color: "#f87171" }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {businesses.length === 0 && (
                <div
                  className="text-center py-16"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <div className="text-5xl mb-3 opacity-20">🏪</div>
                  <p>No hay negocios. Crea el primero.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2
                  className="text-xl font-black"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Productos
                </h2>
                <select
                  value={selectedSlug ?? ""}
                  onChange={(e) => setSelectedSlug(e.target.value || null)}
                  className="px-3 py-2 rounded-xl text-sm border outline-none"
                  style={{
                    background: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="">Seleccionar negocio...</option>
                  {businesses.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {getL(b.name, lang) || b.slug}
                    </option>
                  ))}
                </select>
              </div>
              {selectedSlug && (
                <button
                  onClick={() =>
                    setEditingProduct(emptyProduct(selectedProducts.length + 1))
                  }
                  className="px-4 py-2 rounded-xl text-sm font-bold active:scale-95"
                  style={{ background: "var(--color-accent)", color: "white" }}
                >
                  + Nuevo producto
                </button>
              )}
            </div>
            {!selectedSlug ? (
              <div
                className="text-center py-20"
                style={{ color: "var(--color-text-muted)" }}
              >
                <div className="text-5xl mb-3 opacity-20">📦</div>
                <p>Selecciona un negocio</p>
              </div>
            ) : (
              <>
                <p
                  className="text-xs mb-3"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ⠿ Arrastra para reordenar · {selectedProducts.length}{" "}
                  productos
                </p>
                <DraggableProducts
                  products={selectedProducts}
                  lang={lang}
                  onEdit={setEditingProduct}
                  onHide={(id) =>
                    setProducts((prev) => ({
                      ...prev,
                      [selectedSlug]: (prev[selectedSlug] ?? []).map((p) =>
                        p.id === id ? { ...p, hidden: !p.hidden } : p,
                      ),
                    }))
                  }
                  onDelete={deleteProduct}
                  onReorder={(r) =>
                    setProducts((prev) => ({ ...prev, [selectedSlug]: r }))
                  }
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── CONFIG ── */}
      {tab === "config" && (
        <div className="space-y-5">
          <h2
            className="text-xl font-black"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ⚙️ Configuración
          </h2>

          {/* Home palette */}
          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <div
              className="px-4 py-2.5 border-b"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface-2)",
              }}
            >
              <h3
                className="text-sm font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                🎨 Tema de la página de negocios
              </h3>
            </div>
            <div className="p-4">
              <p
                className="text-xs mb-3"
                style={{ color: "var(--color-text-muted)" }}
              >
                Selecciona el tema visual para la pantalla principal del
                catálogo de negocios.
              </p>
              <PaletteEditor
                palette={config.homePalette ?? DEFAULT_PALETTE}
                onChange={(p) => {
                  const updated = { ...config, homePalette: p };
                  setConfig(updated);
                  apiSave('config', updated).then(() => showToast("✓ Tema guardado"))
                  applyGlobalPalette(p);
                }}
              />
            </div>
          </div>

          {/* Developer info */}
          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <div
              className="px-4 py-2.5 border-b"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface-2)",
              }}
            >
              <h3
                className="text-sm font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                👨‍💻 Datos del desarrollador
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Aparece en el footer de la página principal como créditos y
                botón de contacto.
              </p>
              {(
                [
                  "name",
                  "email",
                  "phone",
                  "whatsapp",
                  "telegram",
                  "website",
                ] as const
              ).map((field) => (
                <div key={field} className="space-y-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {field}
                  </label>
                  <input
                    value={(config.developer as any)?.[field] ?? ""}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        developer: {
                          ...(config.developer ?? {}),
                          [field]: e.target.value,
                        },
                      };
                      setConfig(updated);
                      apiSave('config', updated);
                    }}
                    placeholder={
                      field === "name"
                        ? "Dev Studio"
                        : field === "email"
                          ? "dev@email.com"
                          : field === "website"
                            ? "https://..."
                            : `Tu ${field}`
                    }
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{
                      background: "var(--color-surface-2)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingBiz && (
        <BusinessModal
          biz={editingBiz}
          onSave={saveBiz}
          onClose={() => setEditingBiz(null)}
        />
      )}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onSave={saveProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}
