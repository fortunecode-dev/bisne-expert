'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessEditor } from '@/components/business/BusinessEditor'
import Link from 'next/link'

export default function RegistrarPage() {
  const router = useRouter()
  const [done, setDone] = useState<{ slug: string; code: string } | null>(null)

  const handleSave = async ({ business, detail, products, password }: any) => {
    // Use editor-provided slug or auto-generate from name
    const autoSlug = (business.name?.es ?? 'negocio')
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    const slug = (business.slug?.trim() || autoSlug || 'negocio').slice(0, 40)

    if (!slug) throw new Error('El nombre es requerido para generar un slug')

    // Hash password
    const hashRes = await fetch('/api/biz-auth/hash', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!hashRes.ok) {
      const err = await hashRes.json()
      throw new Error(err.error || 'Error al cifrar contraseña')
    }
    const { hash, code } = await hashRes.json()

    // Create business entry via /api/biz-data (no auth required for isNew)
    const bizRes = await fetch('/api/biz-data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug, isNew: true, ownerPasswordHash: hash, ownerCode: code,
        updates: {
          ...business,
          id: Date.now(),
          slug,
        },
      }),
    })
    if (!bizRes.ok) {
      const err = await bizRes.json()
      throw new Error(err.error || 'Error al registrar negocio')
    }

    // Auth as owner (set cookie) so subsequent writes are authorized
    const authRes = await fetch('/api/biz-auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, password }),
    })
    if (!authRes.ok) throw new Error('Negocio creado pero error al autenticar')

    // Save detail (now owner-authed)
    await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: `business/${slug}`, data: { ...detail, slug } }),
    })

    // Save products if any
    if ((products?.length ?? 0) > 0) {
      await fetch('/api/data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: `products/${slug}`, data: { products } }),
      })
    } else {
      await fetch('/api/data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: `products/${slug}`, data: { products: [] } }),
      })
    }

    setDone({ slug, code })
    // Redirect to preview after short delay so user sees the success screen
    setTimeout(() => router.push(`/${slug}?preview=1`), 2000)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-sm w-full rounded-3xl p-8 text-center space-y-4 border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>
            ¡Negocio registrado!
          </h1>
          <div className="rounded-2xl p-3 border flex items-start gap-2 text-left"
            style={{ background: '#eab30815', borderColor: '#eab30840' }}>
            <span>⏳</span>
            <p className="text-xs" style={{ color: '#fde68a' }}>
              Tu negocio está <strong>pendiente de aprobación</strong>. El equipo lo revisará y lo publicará pronto. Puedes verlo en vista previa con tu contraseña.
            </p>
          </div>
          <div className="rounded-2xl p-4 text-left space-y-3"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-xs opacity-50 mb-0.5">Tu negocio (vista previa)</p>
              <p className="font-mono font-bold text-sm" style={{ color: 'var(--color-accent)' }}>
                /{done.slug}?preview=1
              </p>
            </div>
            <div>
              <p className="text-xs opacity-50 mb-0.5">Código de acceso (para editar)</p>
              <p className="font-mono font-black text-2xl tracking-widest" style={{ color: 'var(--color-accent)' }}>
                {done.code}
              </p>
              <p className="text-xs opacity-40 mt-1">
                Usa este código + tu contraseña en /editar/{done.slug}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/${done.slug}?preview=1`}
              className="block py-2.5 rounded-xl text-sm font-black text-center"
              style={{ background: 'var(--color-accent)', color: 'white' }}>
              👁️ Ver mi negocio (vista previa) →
            </Link>
            <Link href={`/editar/${done.slug}`}
              className="block py-2.5 rounded-xl text-sm font-bold text-center border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              ✏️ Editar mi negocio
            </Link>
            <Link href="/"
              className="block py-2 text-xs text-center opacity-50 hover:opacity-80">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <header className="sticky top-0 z-30 border-b px-4 h-14 flex items-center gap-3"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
        <Link href="/" style={{ color: 'var(--color-accent)' }}
          className="flex items-center gap-1 text-sm font-semibold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Inicio
        </Link>
        <h1 className="font-black text-base" style={{ color: 'var(--color-text)' }}>
          🏪 Registrar negocio
        </h1>
      </header>
      <div className="flex-1 max-w-2xl mx-auto w-full">
        <BusinessEditor
          isAdmin={false}
          onSave={handleSave}
          onCancel={() => window.history.back()}
        />
      </div>
    </div>
  )
}
