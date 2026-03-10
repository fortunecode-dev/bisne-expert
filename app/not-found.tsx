import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div>
        <div className="text-8xl mb-6">🏪</div>
        <h1 className="text-4xl font-black mb-3" style={{ fontFamily: 'var(--font-display)' }}>404</h1>
        <p className="text-lg mb-6" style={{ color: 'var(--color-text-muted)' }}>Página no encontrada</p>
        <Link href="/" className="px-6 py-3 rounded-xl font-semibold text-white" style={{ background: 'var(--color-accent)' }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
