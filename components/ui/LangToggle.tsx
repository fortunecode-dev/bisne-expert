'use client'
import { Lang } from '@/types'

export function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <button
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:opacity-80"
      style={{
        border: '1px solid var(--biz-border, var(--color-border))',
        color: 'var(--biz-text-muted, var(--color-text-muted))',
        background: 'var(--biz-surface2, var(--color-surface-2))',
        fontFamily: 'var(--font-display)',
      }}
    >
      <span style={{ color: lang === 'es' ? 'var(--biz-accent, var(--color-accent))' : undefined }}>ES</span>
      <span className="opacity-30">/</span>
      <span style={{ color: lang === 'en' ? 'var(--biz-accent, var(--color-accent))' : undefined }}>EN</span>
    </button>
  )
}
