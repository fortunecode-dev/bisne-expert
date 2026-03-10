import { ReactNode } from 'react'

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'accent' | 'outline' }) {
  const styles = {
    default: 'bg-white/10 text-white/70',
    accent: 'bg-[var(--color-accent)] text-white',
    outline: 'border border-white/20 text-white/60',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}
