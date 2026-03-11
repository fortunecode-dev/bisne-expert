'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Business, BusinessDetail, Product, BusinessPalette, PromoCode, DEFAULT_PALETTE,
         makeDefaultSchedule, WEEKDAYS, Lang, LocalizedString } from '@/types'
import { getL } from '@/lib/data'
import { DARK_PALETTES, LIGHT_PALETTES, HOLIDAY_PALETTES, ANIMATED_PALETTES } from '@/lib/palette'

// ─── Types ─────────────────────────────────────────────────────────────────
type TabId = 'info' | 'details' | 'schedule' | 'theme' | 'products' | 'sponsored' | 'premium'

interface EditorBiz {
  business: Partial<Business>
  detail: Partial<BusinessDetail>
  products: Product[]
}

interface Props {
  slug?: string          // if editing existing; undefined = registering new
  initial?: EditorBiz
  isAdmin?: boolean      // admin can set premium/sponsored
  onSave: (data: EditorBiz & { password?: string }) => Promise<void>
  onCancel?: () => void
  lang?: Lang
}

// ─── Small helpers ──────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold opacity-60 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all"
      style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }}
    />
  )
}
function LBiInput({ label, val, onChange, placeholder }: { label: string; val: LocalizedString; onChange: (v: LocalizedString) => void; placeholder?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-[10px] opacity-50 block mb-0.5">ES</label>
        <Input value={val?.es ?? ''} onChange={v => onChange({ ...val, en: val?.en ?? '', es: v })} placeholder={placeholder} />
      </div>
      <div>
        <label className="text-[10px] opacity-50 block mb-0.5">EN</label>
        <Input value={val?.en ?? ''} onChange={v => onChange({ ...val, es: val?.es ?? '', en: v })} placeholder={`${placeholder} (English)`} />
      </div>
    </div>
  )
}

// ─── Image uploader ─────────────────────────────────────────────────────────
function ImgUpload({ value, onChange, label }: { value: string; onChange: (url: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const upload = async (f: File) => {
    setLoading(true)
    const fd = new FormData()
    fd.append('image', f)
    fd.append('name', label ?? 'img')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const j = await res.json()
      onChange(j.url)
    }
    setLoading(false)
  }

  return (
    <div
      className="relative h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:opacity-80"
      style={{ borderColor: 'var(--editor-border)' }}
      onClick={() => ref.current?.click()}
    >
      {value
        ? <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : loading
          ? <span className="text-sm opacity-50">⏳ Subiendo…</span>
          : <span className="text-sm opacity-40">＋ {label ?? 'Imagen'}</span>
      }
      {value && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
        <span className="text-white text-xs font-bold">Cambiar</span>
      </div>}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  )
}

// ─── Tab nav ────────────────────────────────────────────────────────────────
const BASE_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'info',     label: 'Negocio',  icon: '🏪' },
  { id: 'details',  label: 'Detalles', icon: '📍' },
  { id: 'schedule', label: 'Horario',  icon: '🕐' },
  { id: 'products', label: 'Productos', icon: '🛍️' },
  { id: 'theme',    label: 'Tema',     icon: '🎨' },
]
const ADMIN_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'sponsored', label: 'Patrocinio', icon: '⭐' },
  { id: 'premium',   label: 'Premium',    icon: '💎' },
]

// ─── Main editor ────────────────────────────────────────────────────────────
export function BusinessEditor({ slug, initial, isAdmin = false, onSave, onCancel, lang = 'es' }: Props) {
  const [tab, setTab] = useState<TabId>('info')
  const [biz, setBiz] = useState<Partial<Business>>(initial?.business ?? {})
  const [det, setDet] = useState<Partial<BusinessDetail>>(initial?.detail ?? {})
  const [prods, setProds] = useState<Product[]>(initial?.products ?? [])
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const isNew = !slug

  const updBiz = (x: Partial<Business>) => setBiz(p => ({ ...p, ...x }))
  const updDet = (x: Partial<BusinessDetail>) => setDet(p => ({ ...p, ...x }))

  const TABS = isAdmin ? [...BASE_TABS, ...ADMIN_TABS] : BASE_TABS

  const handleSave = async () => {
    if (!biz.name?.es) { setError('El nombre del negocio en español es requerido'); return }
    if (isNew && !password) { setError('La contraseña es requerida'); return }
    if (isNew && password !== confirmPwd) { setError('Las contraseñas no coinciden'); return }
    if (isNew && password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({ business: biz, detail: det, products: prods, password: isNew ? password : undefined })
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full" style={{
      '--editor-surface': 'var(--color-surface, #1a1a1a)',
      '--editor-surface2': 'var(--color-surface-2, #242424)',
      '--editor-border': 'var(--color-border, #2e2e2e)',
      '--editor-text': 'var(--color-text, #f0ece4)',
      '--editor-muted': 'var(--color-text-muted, #888)',
      '--editor-accent': 'var(--color-accent, #f97316)',
    } as any}>

      {/* Tab nav */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--editor-border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold flex-shrink-0 border-b-2 transition-all"
            style={{
              borderColor: tab === t.id ? 'var(--editor-accent)' : 'transparent',
              color: tab === t.id ? 'var(--editor-accent)' : 'var(--editor-muted)',
            }}>
            <span>{t.icon}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── INFO ── */}
        {tab === 'info' && (
          <>
            <Field label="Imágenes">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] opacity-50 mb-1">Logo</p>
                  <ImgUpload value={biz.logo ?? ''} onChange={v => updBiz({ logo: v })} label="logo" />
                </div>
                <div>
                  <p className="text-[10px] opacity-50 mb-1">Portada</p>
                  <ImgUpload value={biz.image ?? ''} onChange={v => updBiz({ image: v })} label="cover" />
                </div>
              </div>
            </Field>
            <Field label="Nombre">
              <LBiInput label="" val={biz.name ?? { es: '', en: '' }} onChange={v => updBiz({ name: v })} placeholder="Nombre del negocio" />
            </Field>
            {/* Slug - only editable when creating new */}
            {isNew && (
              <Field label="URL del negocio (slug)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-40">bisne.app/</span>
                  <input
                    value={biz.slug ?? ''}
                    onChange={e => {
                      const s = e.target.value.toLowerCase().normalize('NFD')
                        .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '-')
                        .replace(/-+/g, '-').replace(/^-|-$/g, '')
                      updBiz({ slug: s })
                    }}
                    placeholder="mi-negocio"
                    className="w-full pl-20 pr-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }}
                  />
                </div>
                <p className="text-[10px] opacity-40 mt-0.5">
                  Solo letras, números y guiones. Se genera automáticamente del nombre si lo dejas vacío.
                </p>
              </Field>
            )}

            <Field label="Slogan">
              <LBiInput label="" val={biz.slogan ?? { es: '', en: '' }} onChange={v => updBiz({ slogan: v })} placeholder="Frase corta del negocio" />
            </Field>
            <Field label="Descripción">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-[10px] opacity-50 block mb-0.5">ES</label>
                  <textarea
                    value={biz.description?.es ?? ''} rows={2}
                    onChange={e => updBiz({ description: { es: e.target.value, en: biz.description?.en ?? '' } })}
                    placeholder="Descripción en español"
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                    style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] opacity-50 block mb-0.5">EN</label>
                  <textarea
                    value={biz.description?.en ?? ''} rows={2}
                    onChange={e => updBiz({ description: { en: e.target.value, es: biz.description?.es ?? '' } })}
                    placeholder="Description in English"
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                    style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }}
                  />
                </div>
              </div>
            </Field>
            <Field label="Categorías (separadas por coma)">
              <Input value={(biz.categories ?? []).join(', ')}
                onChange={v => updBiz({ categories: v.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="comida, bebidas, ropa…" />
            </Field>

            {/* Admin-only: premium, sponsored, unavailable */}
            {isAdmin && (
              <Field label="Estado (solo admin)">
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'premium',     label: '💎 Premium',         color: '#a855f7' },
                    { key: 'sponsored',   label: '⭐ Patrocinado',      color: '#eab308' },
                    { key: 'unavailable', label: '🚫 No disponible',   color: '#f97316' },
                    { key: 'hidden',      label: '👁️ Oculto',          color: '#888' },
                  ].map(({ key, label, color }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={!!(biz as any)[key]}
                        onChange={e => updBiz({ [key]: e.target.checked })}
                        className="w-4 h-4 rounded" />
                      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                    </label>
                  ))}
                </div>
              </Field>
            )}

            {/* Owner state — visible to owner */}
            {!isAdmin && (
              <Field label="Estado">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={!!biz.unavailable}
                    onChange={e => updBiz({ unavailable: e.target.checked })} />
                  <span className="text-xs font-semibold" style={{ color: '#f97316' }}>
                    🚫 Marcar como no disponible por el momento
                  </span>
                </label>
              </Field>
            )}

            {/* Password section for new registrations */}
            {isNew && (
              <div className="rounded-2xl border p-4 space-y-3"
                style={{ borderColor: 'var(--editor-border)', background: 'var(--editor-surface)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--editor-text)' }}>🔐 Contraseña del negocio</p>
                <p className="text-xs" style={{ color: 'var(--editor-muted)' }}>
                  Se usará para editar tu negocio en <strong>/editar/{biz.slug || '[slug]'}</strong>
                </p>
                <Field label="Contraseña">
                  <Input type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
                </Field>
                <Field label="Confirmar contraseña">
                  <Input type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Repite la contraseña" />
                </Field>
              </div>
            )}
          </>
        )}

        {/* ── DETAILS ── */}
        {tab === 'details' && (
          <>
            <Field label="Provincia">
              <Input value={det.province ?? ''} onChange={v => updDet({ province: v })} placeholder="Ej: La Habana" />
            </Field>
            <Field label="Municipio">
              <Input value={det.municipality ?? ''} onChange={v => updDet({ municipality: v })} placeholder="Ej: Centro Habana" />
            </Field>
            <Field label="Dirección">
              <LBiInput label="" val={det.address ?? { es: '', en: '' }} onChange={v => updDet({ address: v })} placeholder="Dirección completa" />
            </Field>
            <Field label="Teléfono (sin +)">
              <Input value={det.phone ?? ''} onChange={v => updDet({ phone: v })} placeholder="5351234567" />
            </Field>
            <Field label="Sitio web">
              <Input value={det.website ?? ''} onChange={v => updDet({ website: v })} placeholder="https://…" />
            </Field>
            <Field label="Métodos de pago">
              <div className="flex flex-wrap gap-2">
                {['cash','transfer','card','crypto','paypal'].map(pm => (
                  <label key={pm} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox"
                      checked={(det.paymentMethods ?? []).includes(pm)}
                      onChange={e => {
                        const cur = det.paymentMethods ?? []
                        updDet({ paymentMethods: e.target.checked ? [...cur, pm] : cur.filter(p => p !== pm) })
                      }} />
                    <span className="text-xs font-medium capitalize">{pm}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Redes sociales">
              {['instagram','facebook','telegram','whatsapp','tiktok','youtube','twitter','linkedin'].map(net => (
                <div key={net} className="flex items-center gap-2 mb-2">
                  <span className="text-xs w-20 capitalize opacity-60">{net}</span>
                  <Input value={(det.socialLinks as any)?.[net] ?? ''}
                    onChange={v => updDet({ socialLinks: { ...(det.socialLinks ?? {}), [net]: v } })}
                    placeholder={`https://${net}.com/…`} />
                </div>
              ))}
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!det.donationsEnabled} onChange={e => updDet({ donationsEnabled: e.target.checked })} />
              <span className="text-xs font-semibold">💛 Habilitar propinas / donaciones</span>
            </label>
            {det.donationsEnabled && (
              <>
                <Field label="Número de tarjeta">
                  <Input value={det.cardNumber ?? ''} onChange={v => updDet({ cardNumber: v })} placeholder="Tarjeta TRANSFERMOVIL" />
                </Field>
              </>
            )}
          </>
        )}

        {/* ── SCHEDULE ── */}
        {tab === 'schedule' && (
          <ScheduleEditor
            schedule={det.schedule ?? makeDefaultSchedule()}
            onChange={s => updDet({ schedule: s })}
          />
        )}

        {/* ── PRODUCTS ── */}
        {tab === 'products' && (
          <ProductsTab
            products={prods}
            onChange={setProds}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            palette={det.palette ?? DEFAULT_PALETTE}
            isPremium={!!biz.premium}
            isSponsored={!!biz.sponsored}
          />
        )}

        {/* ── THEME ── */}
        {tab === 'theme' && (
          <ThemeEditor
            palette={det.palette ?? DEFAULT_PALETTE}
            onChange={p => updDet({ palette: p })}
            isSponsored={biz.sponsored}
            isPremium={biz.premium}
          />
        )}

        {/* ── PATROCINIO (Admin only) ── */}
        {tab === 'sponsored' && isAdmin && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border space-y-4"
              style={{ borderColor: '#eab30840', background: '#eab30808' }}>
              <p className="text-sm font-black" style={{ color: '#eab308' }}>⭐ Plan Patrocinado</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={!!biz.sponsored}
                  onChange={e => updBiz({ sponsored: e.target.checked })} className="w-4 h-4" />
                <div>
                  <p className="text-sm font-bold">Activar plan Patrocinado</p>
                  <p className="text-xs opacity-60">Hasta 20 productos · 6 fotos por producto · Temas festivos · Badge ⭐ · Aparece antes que negocios comunes</p>
                </div>
              </label>
            </div>
            <div className="p-4 rounded-2xl border space-y-3"
              style={{ borderColor: 'var(--editor-border)', background: 'var(--editor-surface)' }}>
              <p className="text-xs font-bold opacity-60 uppercase">📢 Marquee</p>
              <p className="text-xs opacity-50">Configura la aparición de este negocio en el banner superior desde la sección de Configuración del admin.</p>
            </div>
          </div>
        )}

        {/* ── PREMIUM (Admin only) ── */}
        {tab === 'premium' && isAdmin && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border space-y-4"
              style={{ borderColor: '#a855f740', background: '#a855f708' }}>
              <p className="text-sm font-black" style={{ color: '#a855f7' }}>💎 Plan Premium</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={!!biz.premium}
                  onChange={e => updBiz({ premium: e.target.checked })} className="w-4 h-4" />
                <div>
                  <p className="text-sm font-bold">Activar plan Premium</p>
                  <p className="text-xs opacity-60">Productos ilimitados · 9 fotos · Slideshow portada · Temas animados · Códigos promo · Productos en marquee</p>
                </div>
              </label>
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border"
              style={{ borderColor: 'var(--editor-border)' }}>
              <input type="checkbox" checked={!!biz.unavailable}
                onChange={e => updBiz({ unavailable: e.target.checked })} className="w-4 h-4" />
              <div>
                <p className="text-sm font-bold">🚫 Marcar como no disponible</p>
                <p className="text-xs opacity-50">El negocio aparece bloqueado en el catálogo</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border"
              style={{ borderColor: 'var(--editor-border)' }}>
              <input type="checkbox" checked={!!biz.hidden}
                onChange={e => updBiz({ hidden: e.target.checked })} className="w-4 h-4" />
              <div>
                <p className="text-sm font-bold">👁️ Ocultar negocio</p>
                <p className="text-xs opacity-50">Solo accesible con preview link</p>
              </div>
            </label>
            {/* Promo Codes */}
            <div className="space-y-2">
              <p className="text-xs font-bold opacity-60 uppercase">🎟️ Códigos promocionales</p>
              <PromoCodes
                codes={det.promoCodes ?? []}
                onChange={codes => updDet({ promoCodes: codes })}
                isPremium={!!biz.premium}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer: error + save */}
      <div className="border-t p-4 flex flex-col gap-2" style={{ borderColor: 'var(--editor-border)' }}>
        {error && (
          <p className="text-xs text-red-400 font-semibold text-center">{error}</p>
        )}
        <div className="flex gap-2">
          {onCancel && (
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
              style={{ borderColor: 'var(--editor-border)', color: 'var(--editor-muted)' }}>
              Cancelar
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--editor-accent)', color: 'white' }}>
            {saving ? '⏳ Guardando…' : isNew ? '🚀 Registrar negocio' : '✓ Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Schedule sub-editor ────────────────────────────────────────────────────
import type { StructuredSchedule, Weekday } from '@/types'

const DAY_LABELS: Record<Weekday, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
  thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
}

function ScheduleEditor({ schedule, onChange }: { schedule: StructuredSchedule; onChange: (s: StructuredSchedule) => void }) {
  const updDay = (day: Weekday, partial: Partial<StructuredSchedule['days'][Weekday]>) => {
    onChange({ ...schedule, days: { ...schedule.days, [day]: { ...schedule.days[day], ...partial } } })
  }
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={schedule.alwaysOpen}
          onChange={e => onChange({ ...schedule, alwaysOpen: e.target.checked })} />
        <span className="text-sm font-bold">⚡ 24/7 Siempre abierto</span>
      </label>
      {!schedule.alwaysOpen && WEEKDAYS.map(day => {
        const ds = schedule.days[day]
        return (
          <div key={day} className="flex items-center gap-2 p-2.5 rounded-xl"
            style={{ background: 'var(--editor-surface)' }}>
            <span className="text-xs font-bold w-8">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
              <input type="checkbox" checked={!ds.closed}
                onChange={e => updDay(day, { closed: !e.target.checked })} />
              <span className="text-xs">{ds.closed ? 'Cerrado' : 'Abierto'}</span>
            </label>
            {!ds.closed && (
              <>
                <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                  <input type="checkbox" checked={ds.h24} onChange={e => updDay(day, { h24: e.target.checked })} />
                  <span className="text-xs">24h</span>
                </label>
                {!ds.h24 && (
                  <div className="flex items-center gap-1 flex-1 justify-end">
                    <input type="time" value={ds.open}
                      onChange={e => updDay(day, { open: e.target.value })}
                      className="px-2 py-1 rounded-lg text-xs border"
                      style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }} />
                    <span className="text-xs opacity-40">–</span>
                    <input type="time" value={ds.close}
                      onChange={e => updDay(day, { close: e.target.value })}
                      className="px-2 py-1 rounded-lg text-xs border"
                      style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }} />
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Products sub-tab ───────────────────────────────────────────────────────
function ProductsTab({ products, onChange, editingProduct, setEditingProduct, palette, isPremium = false, isSponsored = false }:
  { products: Product[]; onChange: (p: Product[]) => void; editingProduct: Product | null;
    setEditingProduct: (p: Product | null) => void; palette: BusinessPalette;
    isPremium?: boolean; isSponsored?: boolean }) {

  const { accent, surface, surface2, text, textMuted, border } = palette
  const maxProducts = isPremium ? Infinity : isSponsored ? 20 : 10
  const maxImages = isPremium ? 9 : isSponsored ? 6 : 3
  const atLimit = products.length >= maxProducts
  const limitLabel = isPremium ? '∞' : String(maxProducts)

  const newProduct = (): Product => ({
    id: Date.now(), name: { es: '', en: '' }, description: { es: '', en: '' },
    price: 0, image: '', images: [], imageKeywords: [], category: { es: 'General', en: 'General' },
    featured: false, hidden: false, available: true,
    seo: { title: { es: '', en: '' }, description: { es: '', en: '' }, keywords: [] },
  })

  if (editingProduct) {
    return <ProductForm
      product={editingProduct}
      palette={palette}
      maxImages={maxImages}
      onSave={p => {
        const idx = products.findIndex(x => x.id === p.id)
        if (idx >= 0) onChange(products.map((x, i) => i === idx ? p : x))
        else onChange([...products, p])
        setEditingProduct(null)
      }}
      onCancel={() => setEditingProduct(null)}
    />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{products.length}/{limitLabel} producto{products.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => {
            if (atLimit) {
              alert(`Plan ${isPremium ? 'Premium' : isSponsored ? 'Patrocinado' : 'Común'}: máximo ${maxProducts} productos. Actualiza tu plan en /planes.`)
              return
            }
            setEditingProduct(newProduct())
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ background: atLimit ? '#888' : accent, color: 'white', opacity: atLimit ? 0.6 : 1 }}>
          {atLimit ? '🔒 Límite' : '+ Agregar'}
        </button>
      </div>
      {products.map(p => (
        <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl border"
          style={{ background: surface, borderColor: border }}>
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: surface2 }}>
            {p.image
              ? <img src={p.image} alt="" className="w-full h-full object-cover" />
              : <span className="text-xl">📦</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: text }}>{p.name.es || 'Sin nombre'}</p>
            <p className="text-xs" style={{ color: textMuted }}>{p.category.es} · ${p.price}</p>
          </div>
          <button onClick={() => setEditingProduct(p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: surface2, color: textMuted }}>
            ✏️
          </button>
          <button onClick={() => onChange(products.filter(x => x.id !== p.id))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-all">
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
  )
}

function ProductForm({ product, palette, onSave, onCancel, maxImages = 8 }:
  { product: Product; palette: BusinessPalette; onSave: (p: Product) => void; onCancel: () => void; maxImages?: number }) {
  const [p, setP] = useState(product)
  const upd = (x: Partial<Product>) => setP(prev => ({ ...prev, ...x }))
  const { accent, surface, border, text, textMuted } = palette

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onCancel} className="text-sm opacity-60 hover:opacity-100">← Volver</button>
        <p className="font-bold text-sm">{p.id === product.id && !product.name.es ? 'Nuevo producto' : 'Editar producto'}</p>
      </div>
      <Field label="Imágenes">
        <ImgUpload value={p.image} onChange={v => upd({ image: v })} label="Foto principal" />
        <div className="mt-2">
        <p className="text-[10px] opacity-40 mb-1.5">Imágenes adicionales ({(p.images ?? []).length}/{maxImages - 1}) — Plan {maxImages >= 9 ? 'Premium 💎' : maxImages >= 6 ? 'Patrocinado ⭐' : 'Común'}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(p.images ?? []).map((img, i) => (
              <div key={i} className="relative">
                <ImgUpload value={img}
                  onChange={v => { const imgs = [...(p.images ?? [])]; imgs[i] = v; upd({ images: imgs }) }}
                  label={`Foto ${i+2}`} />
                <button onClick={() => upd({ images: (p.images ?? []).filter((_, j) => j !== i) })}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black z-10"
                  style={{ background: '#ef4444', color: 'white' }}>✕</button>
              </div>
            ))}
            {(p.images ?? []).length < (maxImages - 1) && (
              <button onClick={() => upd({ images: [...(p.images ?? []), ''] })}
                className="h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-[10px] font-bold transition-all hover:opacity-80"
                style={{ borderColor: 'var(--editor-border)', color: 'var(--editor-muted)' }}>
                +
              </button>
            )}
          </div>
        </div>
      </Field>
      <Field label="Nombre">
        <LBiInput label="" val={p.name} onChange={v => upd({ name: v })} placeholder="Nombre del producto" />
      </Field>
      <Field label="Descripción">
        <LBiInput label="" val={p.description} onChange={v => upd({ description: v })} placeholder="Descripción" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio">
          <input type="number" value={p.price} min={0} step={0.01}
            onChange={e => upd({ price: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }} />
        </Field>
        <Field label="Precio original (opcional)">
          <input type="number" value={p.originalPrice ?? ''} min={0} step={0.01}
            onChange={e => upd({ originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="Antes de rebaja"
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }} />
        </Field>
      </div>
      <Field label="Categoría">
        <LBiInput label="" val={p.category} onChange={v => upd({ category: v })} placeholder="Categoría" />
      </Field>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={p.featured} onChange={e => upd({ featured: e.target.checked })} />
          <span className="text-xs">★ Destacado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!p.available} onChange={e => upd({ available: !e.target.checked })} />
          <span className="text-xs">No disponible</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={p.hidden} onChange={e => upd({ hidden: e.target.checked })} />
          <span className="text-xs">Ocultar</span>
        </label>
      </div>
      <Field label="📢 Promocionar (Premium)">
        <select
          value={p.promote ?? 'NO'}
          onChange={e => upd({ promote: e.target.value as any })}
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }}>
          <option value="NO">No promocionar</option>
          <option value="standard">🏷️ Estándar</option>
          <option value="sale">🏷️ Rebaja</option>
          <option value="new">✨ Nuevo</option>
          <option value="special">⭐ Especial</option>
          <option value="limited">⏳ Limitado</option>
        </select>
      </Field>
      <button onClick={() => onSave(p)}
        className="w-full py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90 active:scale-95"
        style={{ background: accent, color: 'white' }}>
        ✓ Guardar producto
      </button>
    </div>
  )
}

// ─── Promo Codes editor ─────────────────────────────────────────────────────
function PromoCodes({ codes, onChange, isPremium }: { codes: PromoCode[]; onChange: (c: PromoCode[]) => void; isPremium?: boolean }) {
  const upd = (i: number, c: Partial<PromoCode>) =>
    onChange(codes.map((x, j) => j === i ? { ...x, ...c } : x))

  const shareUrl = (code: PromoCode) => {
    if (typeof window === 'undefined') return ''
    const slug = window.location.pathname.split('/').filter(Boolean).pop() ?? ''
    return `${window.location.origin}/${slug}?code=${code.id}`
  }

  if (!isPremium) {
    return (
      <div className="p-4 rounded-2xl text-center opacity-50 border border-dashed" style={{ borderColor: 'var(--editor-border)' }}>
        <p className="text-2xl mb-1">🎟️</p>
        <p className="text-xs font-semibold">Solo disponible en plan Premium</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {codes.map((code, i) => (
        <div key={i} className="p-3 rounded-2xl border space-y-2" style={{ borderColor: 'var(--editor-border)', background: 'var(--editor-surface)' }}>
          <div className="flex items-center gap-2">
            <input value={code.id} placeholder="PROMO10" onChange={e => upd(i, { id: e.target.value.toUpperCase() })}
              className="flex-1 px-2 py-1 rounded-lg border text-sm font-bold uppercase"
              style={{ background: 'var(--editor-surface2)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }} />
            <button onClick={() => onChange(codes.filter((_, j) => j !== i))} className="text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-400/10">✕</button>
          </div>
          <div className="flex gap-2">
            <input type="number" value={code.discount} min={1} max={100} onChange={e => upd(i, { discount: Number(e.target.value) })}
              className="w-20 px-2 py-1 rounded-lg border text-sm"
              style={{ background: 'var(--editor-surface2)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }} />
            <select value={code.type} onChange={e => upd(i, { type: e.target.value as any })}
              className="flex-1 px-2 py-1 rounded-lg border text-sm"
              style={{ background: 'var(--editor-surface2)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }}>
              <option value="percent">% descuento</option>
              <option value="fixed">$ fijo</option>
            </select>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={code.active} onChange={e => upd(i, { active: e.target.checked })} />
              <span className="text-xs">Activo</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={code.expiresAt?.split('T')[0] ?? ''} onChange={e => upd(i, { expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="flex-1 px-2 py-1 rounded-lg border text-[10px]"
              style={{ background: 'var(--editor-surface2)', borderColor: 'var(--editor-border)', color: 'var(--editor-text)' }} />
            <button onClick={() => { const url = shareUrl(code); if (url) { navigator.clipboard?.writeText(url); alert('Link copiado: ' + url) } }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: '#a855f720', color: '#c084fc' }}>🔗 Link</button>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...codes, { id: '', discount: 10, type: 'percent', active: true }])}
        className="w-full py-2 rounded-xl border-2 border-dashed text-xs font-bold transition-all hover:opacity-80"
        style={{ borderColor: '#a855f740', color: '#c084fc' }}>
        + Agregar código
      </button>
    </div>
  )
}

// ─── Theme Editor with tiers ─────────────────────────────────────────────────

const COLOR_FIELDS: { key: keyof BusinessPalette; label: string }[] = [
  { key: 'accent',      label: 'Acento' },
  { key: 'bg',          label: 'Fondo' },
  { key: 'surface',     label: 'Superficie' },
  { key: 'text',        label: 'Texto' },
  { key: 'textMuted',   label: 'Texto suave' },
  { key: 'priceColor',  label: 'Precio' },
  { key: 'border',      label: 'Borde' },
]

function ThemeEditor({
  palette, onChange, isSponsored = false, isPremium = false
}: {
  palette: BusinessPalette
  onChange: (p: BusinessPalette) => void
  isSponsored?: boolean
  isPremium?: boolean
}) {
  const [tab, setTab] = useState<'presets' | 'custom'>('presets')
  const [lockedMsg, setLockedMsg] = useState('')

  const groups = [
    {
      label: '🎨 Estándar',
      tier: 'standard' as const,
      locked: false,
      items: DARK_PALETTES.concat(LIGHT_PALETTES),
    },
    {
      label: '🎉 Festivos',
      tier: 'sponsored' as const,
      locked: !isSponsored && !isPremium,
      lockLabel: 'Solo para Patrocinado ⭐',
      items: HOLIDAY_PALETTES,
    },
    {
      label: '✨ Animados',
      tier: 'premium' as const,
      locked: !isPremium,
      lockLabel: 'Solo para Premium 💎',
      items: ANIMATED_PALETTES,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['presets', 'custom'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={tab === t
              ? { background: 'var(--editor-accent)', color: 'white' }
              : { background: 'var(--editor-surface)', borderColor: 'var(--editor-border)', border: '1px solid', color: 'var(--editor-muted)' }}>
            {t === 'presets' ? '🎨 Temas' : '✏️ Personalizar'}
          </button>
        ))}
      </div>

      {lockedMsg && (
        <div className="p-3 rounded-xl text-xs font-semibold text-center"
          style={{ background: '#a855f720', color: '#c084fc', border: '1px solid #a855f740' }}>
          🔒 {lockedMsg}
        </div>
      )}

      {tab === 'presets' && (
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold opacity-60 uppercase">{group.label}</p>
                {group.locked && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#a855f720', color: '#c084fc' }}>
                    {group.lockLabel}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map(pr => {
                  const p = pr.palette
                  const isActive = palette.name === (pr.name || p.name)
                  const isAnimated = (p as any).animated
                  return (
                    <button key={pr.name}
                      onClick={() => {
                        if (group.locked) {
                          setLockedMsg(group.lockLabel ?? '')
                          setTimeout(() => setLockedMsg(''), 3000)
                          return
                        }
                        onChange({ ...p, name: pr.name })
                      }}
                      className="p-2 rounded-xl border text-xs font-semibold transition-all relative overflow-hidden"
                      style={{
                        background: p.bg,
                        borderColor: isActive ? p.accent : isAnimated ? p.accent + '60' : p.accent + '30',
                        boxShadow: isActive ? `0 0 0 2px ${p.accent}` : isAnimated ? `0 0 8px ${p.accent}30` : 'none',
                        opacity: group.locked ? 0.45 : 1,
                      }}>
                      {isAnimated && (
                        <div className="absolute top-1 right-1 text-[8px] font-black px-1 py-0.5 rounded-full"
                          style={{ background: '#a855f7', color: '#fff' }}>✨</div>
                      )}
                      <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ background: p.accent }} />
                      <p className="leading-tight truncate" style={{ color: p.text, fontSize: 9 }}>{pr.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input type="color" value={(palette as any)[key] ?? '#000000'}
                onChange={e => onChange({ ...palette, [key]: e.target.value })}
                className="w-8 h-8 rounded-lg border cursor-pointer flex-shrink-0"
                style={{ borderColor: 'var(--editor-border)' }} />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
