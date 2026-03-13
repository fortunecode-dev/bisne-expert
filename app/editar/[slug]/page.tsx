'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BusinessEditor } from '@/components/business/BusinessEditor'
import Link from 'next/link'

export default function EditarPage() {
  const params = useParams()
  const slug = params.slug as string

  const [authed, setAuthed] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginSlug, setLoginSlug] = useState(slug)
  const [loginPwd, setLoginPwd] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [initial, setInitial] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetPwd, setResetPwd] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetPwdVisible, setResetPwdVisible] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    fetch(`/api/biz-session?slug=${slug}`)
      .then(r => r.json())
      .then(d => { setAuthed(!!d.authed); setIsAdmin(!!d.isAdmin) })
      .catch(() => setAuthed(false))
  }, [slug])

  useEffect(() => {
    if (!authed) return
    // v10: un solo archivo por negocio — {slug}/business.json contiene todo
    Promise.all([
      fetch(`/api/data?file=${slug}/business`).then(r => r.ok ? r.json() : {}),
      fetch(`/api/data?file=${slug}/products`).then(r => r.ok ? r.json() : { products: [] }),
    ]).then(([bizData, prodData]) => {
      // business y detail son el mismo objeto en v10
      setInitial({ business: bizData ?? {}, detail: bizData ?? {}, products: prodData?.products ?? [] })
    })
  }, [authed, slug])

  const handleLogin = async () => {
    setLoginLoading(true); setLoginError('')
    const res = await fetch('/api/biz-auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: loginSlug.trim(), password: loginPwd }),
    })
    const data = await res.json()
    if (res.ok) { setAuthed(true) } else { setLoginError(data.error || 'Error de autenticación') }
    setLoginLoading(false)
  }

  const handleSave = async ({ business, detail, products }: any) => {
    // v10: fusionar business + detail en {slug}/business.json
    const merged = { ...business, ...detail, slug }

    if (isAdmin) {
      // Admin escribe directamente
      await fetch('/api/data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: `${slug}/business`, data: merged }),
      })
    } else {
      // Dueño: campos permitidos vía /api/biz-data
      const bizRes = await fetch('/api/biz-data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, updates: merged }),
      })
      if (!bizRes.ok) { const err = await bizRes.json(); throw new Error(err.error || 'Error') }
    }

    // Productos siempre via /api/data (auth por cookie biz_session_)
    await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: `${slug}/products`, data: { products: products ?? [] } }),
    })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const handleResetPassword = async () => {
    if (!resetPwd || resetPwd.length < 6) { setResetError('Mínimo 6 caracteres'); return }
    if (resetPwd !== resetConfirm) { setResetError('Las contraseñas no coinciden'); return }
    setResetLoading(true); setResetError('')
    try {
      const hashRes = await fetch('/api/biz-auth/hash', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password: resetPwd }),
      })
      const { hash, code } = await hashRes.json()
      // v10: actualizar directamente {slug}/business.json
      const bizRes = await fetch(`/api/data?file=${slug}/business`)
      const bizData = bizRes.ok ? await bizRes.json() : {}
      await fetch('/api/data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: `${slug}/business`, data: { ...bizData, ownerPasswordHash: hash, ownerCode: code } }),
      })
      setResetDone(true)
      setTimeout(() => { setShowReset(false); setResetDone(false); setResetPwd(''); setResetConfirm('') }, 2500)
    } catch { setResetError('Error al actualizar la contraseña') }
    setResetLoading(false)
  }

  if (authed === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="text-3xl animate-spin">⏳</div>
    </div>
  )

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm rounded-3xl p-8 space-y-5 border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="text-center">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>Editar negocio</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Ingresa con el slug o código de tu negocio</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold opacity-60 block mb-1">Slug o código</label>
            <input value={loginSlug} onChange={e => setLoginSlug(e.target.value)} placeholder={slug}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div>
            <label className="text-xs font-semibold opacity-60 block mb-1">Contraseña</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={loginPwd}
                onChange={e => setLoginPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Tu contraseña" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none pr-10"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <button onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100">
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {loginError && <p className="text-xs font-semibold text-red-400 text-center">{loginError}</p>}
          <button onClick={handleLogin} disabled={loginLoading || !loginPwd}
            className="w-full py-3 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: 'white' }}>
            {loginLoading ? '⏳ Verificando…' : 'Entrar →'}
          </button>
        </div>
        <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <Link href={`/${slug}`} className="block text-center text-xs opacity-50 hover:opacity-80">Ver negocio sin editar</Link>
          <Link href="/" className="block text-center text-xs opacity-40 hover:opacity-70">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )

  if (!initial) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <p className="text-sm opacity-50">Cargando…</p>
    </div>
  )

  return (
    <>
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <header className="sticky top-0 z-30 border-b px-4 h-14 flex items-center gap-3 justify-between"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <Link href={isAdmin ? '/admin' : `/${slug}`} style={{ color: 'var(--color-accent)' }}
            className="flex items-center gap-1 text-sm font-semibold flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            {isAdmin ? 'Admin' : 'Ver negocio'}
          </Link>
          <span className="opacity-30">·</span>
          <span className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>
            {initial.business?.name?.es || slug}
          </span>
          {isAdmin && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: '#a855f720', color: '#c084fc' }}>ADMIN</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && <span className="text-xs font-bold" style={{ color: '#22c55e' }}>✓ Guardado</span>}
          <Link href={`/${slug}?preview=1`} target="_blank"
            className="text-xs px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-all"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            👁️ Ver
          </Link>
        </div>
      </header>
      <div className="flex-1 max-w-3xl mx-auto w-full">
        <BusinessEditor slug={slug} initial={initial} isAdmin={isAdmin} onSave={handleSave} onResetPassword={() => setShowReset(true)} />
      </div>
    </div>

      {/* Reset password modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4 border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <p className="font-black text-lg" style={{ color: 'var(--color-text)' }}>🔑 Cambiar contraseña</p>
              <button onClick={() => { setShowReset(false); setResetError(''); setResetPwd(''); setResetConfirm('') }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>✕</button>
            </div>
            {resetDone ? (
              <div className="py-4 text-center">
                <p className="text-4xl mb-2">✅</p>
                <p className="font-bold text-sm" style={{ color: '#22c55e' }}>Contraseña actualizada</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold opacity-60 block mb-1">Nueva contraseña</label>
                  <div className="relative">
                    <input type={resetPwdVisible ? 'text' : 'password'} value={resetPwd}
                      onChange={e => setResetPwd(e.target.value)} placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none pr-10"
                      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                    <button onClick={() => setResetPwdVisible(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100">
                      {resetPwdVisible ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-60 block mb-1">Confirmar contraseña</label>
                  <input type="password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                </div>
                {resetError && <p className="text-xs font-semibold text-red-400">{resetError}</p>}
                <button onClick={handleResetPassword} disabled={resetLoading || !resetPwd}
                  className="w-full py-3 rounded-xl font-black text-sm transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--color-accent)', color: 'white' }}>
                  {resetLoading ? '⏳ Actualizando…' : '🔑 Actualizar contraseña'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
