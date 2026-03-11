'use client'
import { Lang } from '@/types'

export function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <button
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border transition-all hover:opacity-80 flex-shrink-0"
      style={{
        border: '1px solid var(--biz-border, var(--color-border))',
        color: 'var(--biz-accent, var(--color-accent))',
        background: 'var(--biz-surface2, var(--color-surface-2))',
        fontFamily: 'var(--font-display)',
        fontSize: 11,
      }}
    >
      {lang === 'es' ? 'EN' : 'ES'}
    </button>
  )
}
