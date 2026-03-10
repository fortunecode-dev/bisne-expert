import { BusinessPalette } from '@/types'

const CONFIG_KEY = 'catalogos_config'

export interface AppConfig {
  homePalette?: BusinessPalette
  customPalettes?: { name: string; palette: BusinessPalette }[]
  developer?: {
    name?: string
    email?: string
    phone?: string
    whatsapp?: string
    telegram?: string
    website?: string
  }
}

const DEFAULT_CONFIG: AppConfig = {
  homePalette: undefined,
  customPalettes: [],
  developer: { name: 'Dev Studio', email: '', phone: '', whatsapp: '', telegram: '', website: '' },
}

export function loadConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(config: AppConfig): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch (e) {
    console.error('Config save failed', e)
  }
}

export function getCustomPalettes(): { name: string; palette: BusinessPalette }[] {
  return loadConfig().customPalettes ?? []
}

export function saveCustomPalette(name: string, palette: BusinessPalette): { name: string; palette: BusinessPalette }[] {
  const config = loadConfig()
  const existing = config.customPalettes ?? []
  const updated = [...existing.filter(p => p.name !== name), { name, palette }]
  saveConfig({ ...config, customPalettes: updated })
  return updated
}

export function deleteCustomPalette(name: string): { name: string; palette: BusinessPalette }[] {
  const config = loadConfig()
  const updated = (config.customPalettes ?? []).filter(p => p.name !== name)
  saveConfig({ ...config, customPalettes: updated })
  return updated
}
