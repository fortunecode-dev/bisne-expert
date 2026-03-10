'use client'

interface CartButtonProps {
  count: number
  total: number
  onClick: () => void
  lang: 'es' | 'en'
}

export function CartButton({ count, total, onClick, lang }: CartButtonProps) {
  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 animate-slide-up"
      style={{
        background: 'var(--biz-accent)',
        color: 'var(--biz-accent-text)',
        boxShadow: '0 8px 32px color-mix(in srgb, var(--biz-accent) 40%, transparent)',
        maxWidth: 'calc(100vw - 32px)',
        width: 'max-content',
      }}
    >
      <div className="relative flex-shrink-0">
        <span className="text-lg">🛒</span>
        <span
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--biz-accent-text)' }}
        >
          {count}
        </span>
      </div>
      <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        {lang === 'es' ? 'Ver pedido' : 'View order'} ·{' '}
        <span style={{ color: 'var(--biz-price)' }}>${total.toFixed(2)}</span>
      </span>
    </button>
  )
}
