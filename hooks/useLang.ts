'use client'
import { useState, useEffect } from 'react'
import { Lang } from '@/types'

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null
    if (stored === 'es' || stored === 'en') {
      setLangState(stored)
    } else {
      const browser = navigator.language.startsWith('es') ? 'es' : 'en'
      setLangState(browser)
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return [lang, setLang]
}
