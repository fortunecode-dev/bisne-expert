'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get('from') || '/admin'

  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const submit = async () => {
    if (!pw.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.ok) {
        router.replace(from)
      } else {
        const d = await res.json()
        setError(d.error || 'Error desconocido')
        setPw('')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏪</div>
          <h1 className="text-2xl font-black mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
            CatalogOS
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Panel de administración
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border p-6 space-y-5"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>

          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
              Acceso restringido
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Introduce la contraseña maestra para continuar
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide block"
              style={{ color: 'var(--color-text-muted)' }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="••••••••"
                autoFocus
                className="w-full px-4 py-3 pr-12 rounded-2xl border text-sm outline-none"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: error ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
              <button onClick={() => setShow(s => !s)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg select-none"
                style={{ color: 'var(--color-text-muted)' }}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
            {error && (
              <p className="text-xs font-semibold flex items-center gap-1 text-red-400">
                ⚠️ {error}
              </p>
            )}
          </div>

          <button
            onClick={submit}
            disabled={loading || !pw.trim()}
            className="w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-accent)', color: 'white' }}>
            {loading ? '⏳ Verificando…' : '🔐 Entrar al panel'}
          </button>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--color-text-muted)' }}>
          La contraseña está configurada por el desarrollador en el servidor
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg)' }}>
        <div className="text-4xl animate-pulse">🔐</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
