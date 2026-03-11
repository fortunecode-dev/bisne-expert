import { BusinessPalette, DEFAULT_PALETTE } from '@/types'

export function applyPalette(palette?: BusinessPalette) {
  const p = palette ?? DEFAULT_PALETTE
  if (typeof document === 'undefined') return
  const r = document.documentElement
  r.style.setProperty('--biz-accent', p.accent)
  r.style.setProperty('--biz-accent-text', p.accentText)
  r.style.setProperty('--biz-accent-soft', p.accentSoft)
  r.style.setProperty('--biz-bg', p.bg)
  r.style.setProperty('--biz-surface', p.surface)
  r.style.setProperty('--biz-surface2', p.surface2)
  r.style.setProperty('--biz-border', p.border)
  r.style.setProperty('--biz-text', p.text)
  r.style.setProperty('--biz-text-muted', p.textMuted)
  r.style.setProperty('--biz-price', p.priceColor)
  // Animated themes
  if (p.animated && p.animationKey) {
    injectAnimatedThemeCSS(p.animationKey)
  } else {
    removeAnimatedThemeCSS()
  }
}

export function applyHomeTheme(palette?: BusinessPalette) {
  const p = palette ?? DEFAULT_PALETTE
  if (typeof document === 'undefined') return
  const r = document.documentElement
  r.style.setProperty('--color-accent', p.accent)
  r.style.setProperty('--color-accent-text', p.accentText)
  r.style.setProperty('--color-accent-soft', p.accentSoft)
  r.style.setProperty('--color-bg', p.bg)
  r.style.setProperty('--color-surface', p.surface)
  r.style.setProperty('--color-surface-2', p.surface2)
  r.style.setProperty('--color-border', p.border)
  r.style.setProperty('--color-text', p.text)
  r.style.setProperty('--color-text-muted', p.textMuted)
}

export function removePalette() {
  if (typeof document === 'undefined') return
  const r = document.documentElement
  ;['--biz-accent','--biz-accent-text','--biz-accent-soft','--biz-bg','--biz-surface','--biz-surface2','--biz-border','--biz-text','--biz-text-muted','--biz-price']
    .forEach(v => r.style.removeProperty(v))
}

// ═══════════════════════════════════════════════════════
// DARK PALETTES — 20 total
// ═══════════════════════════════════════════════════════
export const DARK_PALETTES: { name: string; palette: BusinessPalette }[] = [
  // Original 10
  { name: '🔥 Amber Night', palette: { accent:'#f97316',accentText:'#fff',accentSoft:'#fff7ed',bg:'#0f0f0f',surface:'#1a1a1a',surface2:'#242424',border:'#2e2e2e',text:'#f0ece4',textMuted:'#888',priceColor:'#fbbf24' }},
  { name: '🩸 Crimson Dark', palette: { accent:'#c0392b',accentText:'#fff',accentSoft:'#fdf0ee',bg:'#0d0a0a',surface:'#1a1212',surface2:'#231818',border:'#3a2020',text:'#f5eeee',textMuted:'#8a6868',priceColor:'#e8b86d' }},
  { name: '🌊 Ocean Deep', palette: { accent:'#0ea5e9',accentText:'#fff',accentSoft:'#e0f2fe',bg:'#080e14',surface:'#0f1a24',surface2:'#162130',border:'#1e3044',text:'#e8f4f8',textMuted:'#5a8098',priceColor:'#38bdf8' }},
  { name: '🌲 Forest Night', palette: { accent:'#16a34a',accentText:'#fff',accentSoft:'#f0fdf4',bg:'#080f0a',surface:'#101a12',surface2:'#16241a',border:'#1e3624',text:'#e8f4ec',textMuted:'#5a8068',priceColor:'#4ade80' }},
  { name: '👑 Royal Purple', palette: { accent:'#7c3aed',accentText:'#fff',accentSoft:'#f5f3ff',bg:'#0a080f',surface:'#130f1a',surface2:'#1a1524',border:'#2e2040',text:'#f0eef8',textMuted:'#7060a0',priceColor:'#a78bfa' }},
  { name: '🌹 Rose Noir', palette: { accent:'#e11d48',accentText:'#fff',accentSoft:'#fff1f2',bg:'#0f080a',surface:'#1a1014',surface2:'#241518',border:'#3a1f24',text:'#f8eff2',textMuted:'#9a6070',priceColor:'#fb7185' }},
  { name: '🤍 Zinc Dark', palette: { accent:'#e4e4e7',accentText:'#18181b',accentSoft:'#fafafa',bg:'#09090b',surface:'#18181b',surface2:'#27272a',border:'#3f3f46',text:'#fafafa',textMuted:'#a1a1aa',priceColor:'#e4e4e7' }},
  { name: '🌙 Midnight Blue', palette: { accent:'#6366f1',accentText:'#fff',accentSoft:'#eef2ff',bg:'#06070f',surface:'#0f1122',surface2:'#161830',border:'#1e2140',text:'#eef0ff',textMuted:'#6065a0',priceColor:'#818cf8' }},
  { name: '🟡 Gold Dark', palette: { accent:'#eab308',accentText:'#1a1400',accentSoft:'#fefce8',bg:'#0c0b00',surface:'#1a1800',surface2:'#242200',border:'#3a3600',text:'#fef9c3',textMuted:'#a09030',priceColor:'#fde047' }},
  { name: '🩵 Teal Dark', palette: { accent:'#14b8a6',accentText:'#fff',accentSoft:'#f0fdfa',bg:'#030c0c',surface:'#0a1a1a',surface2:'#102424',border:'#153838',text:'#e0fdf8',textMuted:'#4a8880',priceColor:'#2dd4bf' }},
  // New 10
  { name: '🎸 Neon Punk', palette: { accent:'#f0ff44',accentText:'#0a0a00',accentSoft:'#fffff0',bg:'#05050a',surface:'#0d0d14',surface2:'#141420',border:'#1e1e30',text:'#f8f8ee',textMuted:'#808040',priceColor:'#ff44aa' }},
  { name: '🔮 Deep Violet', palette: { accent:'#a855f7',accentText:'#fff',accentSoft:'#faf5ff',bg:'#07040f',surface:'#100820',surface2:'#180c2e',border:'#281540',text:'#f5eeff',textMuted:'#7850a0',priceColor:'#e879f9' }},
  { name: '🌋 Volcanic', palette: { accent:'#ff4500',accentText:'#fff',accentSoft:'#fff4f0',bg:'#0c0500',surface:'#1e0a00',surface2:'#2c1000',border:'#451800',text:'#fff0e8',textMuted:'#aa5530',priceColor:'#ff8c00' }},
  { name: '🧊 Arctic Dark', palette: { accent:'#22d3ee',accentText:'#001a22',accentSoft:'#ecfeff',bg:'#020a0e',surface:'#061420',surface2:'#0a1e2e',border:'#0f2c40',text:'#e0f8ff',textMuted:'#3888aa',priceColor:'#a5f3fc' }},
  { name: '🍷 Bordeaux', palette: { accent:'#9c2b3b',accentText:'#fff',accentSoft:'#fce8eb',bg:'#0a0406',surface:'#160810',surface2:'#200c18',border:'#381028',text:'#f8e8ee',textMuted:'#804058',priceColor:'#d4a0a8' }},
  { name: '🌺 Magenta Noir', palette: { accent:'#e879f9',accentText:'#fff',accentSoft:'#fdf4ff',bg:'#080408',surface:'#120810',surface2:'#1c0c1c',border:'#2e1030',text:'#fdf0ff',textMuted:'#906090',priceColor:'#f0abfc' }},
  { name: '🏴 Slate Obsidian', palette: { accent:'#94a3b8',accentText:'#0a0e14',accentSoft:'#f8fafc',bg:'#02040a',surface:'#080c14',surface2:'#0e1420',border:'#1a2030',text:'#e2e8f0',textMuted:'#4a6080',priceColor:'#64748b' }},
  { name: '☕ Espresso', palette: { accent:'#d97706',accentText:'#fff',accentSoft:'#fffbeb',bg:'#0c0806',surface:'#1a1410',surface2:'#241c18',border:'#3c2e24',text:'#f5ede4',textMuted:'#907060',priceColor:'#f59e0b' }},
  { name: '🌿 Moss Dark', palette: { accent:'#84cc16',accentText:'#0a1000',accentSoft:'#f7fee7',bg:'#050802',surface:'#0c1404',surface2:'#121e06',border:'#1e3008',text:'#ecfccb',textMuted:'#608030',priceColor:'#a3e635' }},
  { name: '🐙 Deep Sea', palette: { accent:'#06b6d4',accentText:'#fff',accentSoft:'#ecfeff',bg:'#020810',surface:'#04101e',surface2:'#06182e',border:'#0a2840',text:'#cff3ff',textMuted:'#2a7090',priceColor:'#67e8f9' }},
]

// ═══════════════════════════════════════════════════════
// LIGHT PALETTES — 20 total
// ═══════════════════════════════════════════════════════
export const LIGHT_PALETTES: { name: string; palette: BusinessPalette }[] = [
  // Original 10
  { name: '☀️ Warm White', palette: { accent:'#d97706',accentText:'#fff',accentSoft:'#fffbeb',bg:'#fafaf8',surface:'#ffffff',surface2:'#f5f5f2',border:'#e5e3de',text:'#1c1a18',textMuted:'#888068',priceColor:'#d97706' }},
  { name: '💎 Slate Clean', palette: { accent:'#6366f1',accentText:'#fff',accentSoft:'#eef2ff',bg:'#f8fafc',surface:'#ffffff',surface2:'#f1f5f9',border:'#e2e8f0',text:'#0f172a',textMuted:'#64748b',priceColor:'#6366f1' }},
  { name: '🌸 Sakura', palette: { accent:'#ec4899',accentText:'#fff',accentSoft:'#fdf2f8',bg:'#fdf6f9',surface:'#ffffff',surface2:'#fce7f3',border:'#fbcfe8',text:'#500724',textMuted:'#9d174d',priceColor:'#db2777' }},
  { name: '🌿 Mint Fresh', palette: { accent:'#059669',accentText:'#fff',accentSoft:'#ecfdf5',bg:'#f6fdf9',surface:'#ffffff',surface2:'#d1fae5',border:'#a7f3d0',text:'#064e3b',textMuted:'#047857',priceColor:'#10b981' }},
  { name: '🌤️ Sky Light', palette: { accent:'#0284c7',accentText:'#fff',accentSoft:'#e0f2fe',bg:'#f0f9ff',surface:'#ffffff',surface2:'#e0f2fe',border:'#bae6fd',text:'#0c4a6e',textMuted:'#0369a1',priceColor:'#0ea5e9' }},
  { name: '🍊 Citrus', palette: { accent:'#ea580c',accentText:'#fff',accentSoft:'#fff7ed',bg:'#fffbf5',surface:'#ffffff',surface2:'#ffedd5',border:'#fed7aa',text:'#431407',textMuted:'#c2410c',priceColor:'#f97316' }},
  { name: '🪻 Lavender', palette: { accent:'#7c3aed',accentText:'#fff',accentSoft:'#f5f3ff',bg:'#faf8ff',surface:'#ffffff',surface2:'#ede9fe',border:'#ddd6fe',text:'#2e1065',textMuted:'#6d28d9',priceColor:'#8b5cf6' }},
  { name: '🌺 Coral', palette: { accent:'#e11d48',accentText:'#fff',accentSoft:'#fff1f2',bg:'#fff5f6',surface:'#ffffff',surface2:'#ffe4e6',border:'#fecdd3',text:'#4c0519',textMuted:'#be123c',priceColor:'#f43f5e' }},
  { name: '🫐 Blueberry', palette: { accent:'#2563eb',accentText:'#fff',accentSoft:'#eff6ff',bg:'#f8faff',surface:'#ffffff',surface2:'#dbeafe',border:'#bfdbfe',text:'#1e1b4b',textMuted:'#3730a3',priceColor:'#3b82f6' }},
  { name: '🍋 Lemon', palette: { accent:'#ca8a04',accentText:'#fff',accentSoft:'#fefce8',bg:'#fefef0',surface:'#ffffff',surface2:'#fef9c3',border:'#fde68a',text:'#451a03',textMuted:'#a16207',priceColor:'#eab308' }},
  // New 10
  { name: '🍑 Peach Cream', palette: { accent:'#f97316',accentText:'#fff',accentSoft:'#fff7ed',bg:'#fff8f4',surface:'#ffffff',surface2:'#ffede0',border:'#ffd0b0',text:'#3d1a00',textMuted:'#b06030',priceColor:'#ea580c' }},
  { name: '🌾 Sand Dune', palette: { accent:'#b45309',accentText:'#fff',accentSoft:'#fffbeb',bg:'#fdf9f0',surface:'#ffffff',surface2:'#fef3c7',border:'#fde68a',text:'#292524',textMuted:'#78716c',priceColor:'#92400e' }},
  { name: '🩶 Silver Stone', palette: { accent:'#4b5563',accentText:'#fff',accentSoft:'#f9fafb',bg:'#f9fafb',surface:'#ffffff',surface2:'#f3f4f6',border:'#d1d5db',text:'#111827',textMuted:'#6b7280',priceColor:'#374151' }},
  { name: '🌷 Rosé', palette: { accent:'#be185d',accentText:'#fff',accentSoft:'#fdf2f8',bg:'#fff5fb',surface:'#ffffff',surface2:'#fce7f3',border:'#fbcfe8',text:'#3d0a26',textMuted:'#9d174d',priceColor:'#ec4899' }},
  { name: '🦋 Butterfly Blue', palette: { accent:'#1d4ed8',accentText:'#fff',accentSoft:'#eff6ff',bg:'#f5f8ff',surface:'#ffffff',surface2:'#e0e7ff',border:'#c7d2fe',text:'#0f0640',textMuted:'#4338ca',priceColor:'#3b82f6' }},
  { name: '🥦 Broccoli', palette: { accent:'#166534',accentText:'#fff',accentSoft:'#f0fdf4',bg:'#f4fef6',surface:'#ffffff',surface2:'#dcfce7',border:'#bbf7d0',text:'#052e16',textMuted:'#15803d',priceColor:'#22c55e' }},
  { name: '🌻 Sunflower', palette: { accent:'#d97706',accentText:'#fff',accentSoft:'#fffbeb',bg:'#fffef0',surface:'#ffffff',surface2:'#fef9c3',border:'#fef08a',text:'#1c1400',textMuted:'#a16207',priceColor:'#eab308' }},
  { name: '🍇 Grape', palette: { accent:'#7e22ce',accentText:'#fff',accentSoft:'#faf5ff',bg:'#faf6ff',surface:'#ffffff',surface2:'#f3e8ff',border:'#e9d5ff',text:'#2e1065',textMuted:'#7c3aed',priceColor:'#a855f7' }},
  { name: '🏔️ Alpine', palette: { accent:'#0369a1',accentText:'#fff',accentSoft:'#e0f2fe',bg:'#f0f8ff',surface:'#ffffff',surface2:'#e0f2fe',border:'#7dd3fc',text:'#0c2840',textMuted:'#0369a1',priceColor:'#0ea5e9' }},
  { name: '🌹 White Rose', palette: { accent:'#e11d48',accentText:'#fff',accentSoft:'#fff1f2',bg:'#fefefe',surface:'#ffffff',surface2:'#f9f9f9',border:'#f0f0f0',text:'#18181b',textMuted:'#71717a',priceColor:'#e11d48' }},
]

// ═══════════════════════════════════════════════════════
// HOLIDAY PALETTES — dark + light for each
// ═══════════════════════════════════════════════════════
export const HOLIDAY_PALETTES: { name: string; palette: BusinessPalette }[] = [
  // Navidad
  { name: '🎄 Navidad Oscura', palette: { accent:'#16a34a',accentText:'#fff',accentSoft:'#f0fdf4',bg:'#060e07',surface:'#0d1a0e',surface2:'#122014',border:'#1e3820',text:'#f0fdf4',textMuted:'#5a8060',priceColor:'#dc2626' }},
  { name: '🎄 Navidad Clara', palette: { accent:'#16a34a',accentText:'#fff',accentSoft:'#f0fdf4',bg:'#f0fdf4',surface:'#ffffff',surface2:'#dcfce7',border:'#bbf7d0',text:'#052e16',textMuted:'#15803d',priceColor:'#dc2626' }},
  // Halloween
  { name: '🎃 Halloween Oscura', palette: { accent:'#ea580c',accentText:'#fff',accentSoft:'#fff7ed',bg:'#080300',surface:'#160800',surface2:'#201200',border:'#3a2000',text:'#fff7e6',textMuted:'#a05830',priceColor:'#9333ea' }},
  { name: '🎃 Halloween Clara', palette: { accent:'#ea580c',accentText:'#fff',accentSoft:'#fff7ed',bg:'#fff8f0',surface:'#ffffff',surface2:'#ffedd5',border:'#fed7aa',text:'#1c0a00',textMuted:'#c2410c',priceColor:'#9333ea' }},
  // San Valentín
  { name: '💘 San Valentín Oscura', palette: { accent:'#e11d48',accentText:'#fff',accentSoft:'#fff1f2',bg:'#0e0608',surface:'#1c0c10',surface2:'#261018',border:'#3c1420',text:'#fdf2f4',textMuted:'#904050',priceColor:'#fb7185' }},
  { name: '💘 San Valentín Clara', palette: { accent:'#e11d48',accentText:'#fff',accentSoft:'#fff1f2',bg:'#fff5f7',surface:'#ffffff',surface2:'#ffe4e6',border:'#fecdd3',text:'#4c0519',textMuted:'#be123c',priceColor:'#fb7185' }},
  // Pascua
  { name: '🐣 Pascua Oscura', palette: { accent:'#a855f7',accentText:'#fff',accentSoft:'#faf5ff',bg:'#060408',surface:'#100818',surface2:'#180c24',border:'#2a1440',text:'#fdf4ff',textMuted:'#7040a0',priceColor:'#4ade80' }},
  { name: '🐣 Pascua Clara', palette: { accent:'#a855f7',accentText:'#fff',accentSoft:'#faf5ff',bg:'#fdf8ff',surface:'#ffffff',surface2:'#f3e8ff',border:'#e9d5ff',text:'#2e1065',textMuted:'#7c3aed',priceColor:'#22c55e' }},
  // Año Nuevo
  { name: '🎆 Año Nuevo Oscuro', palette: { accent:'#eab308',accentText:'#1a1400',accentSoft:'#fefce8',bg:'#040408',surface:'#08081a',surface2:'#0e0e26',border:'#1e1e40',text:'#fefce8',textMuted:'#7070a0',priceColor:'#f9f9a0' }},
  { name: '🎆 Año Nuevo Claro', palette: { accent:'#eab308',accentText:'#fff',accentSoft:'#fefce8',bg:'#fffef0',surface:'#ffffff',surface2:'#fef9c3',border:'#fde68a',text:'#1a1400',textMuted:'#a16207',priceColor:'#ca8a04' }},
  // Día de la Madre
  { name: '🌹 Día de la Madre Oscuro', palette: { accent:'#db2777',accentText:'#fff',accentSoft:'#fdf2f8',bg:'#0c0408',surface:'#1c0814',surface2:'#26101e',border:'#3c1830',text:'#fdf2f8',textMuted:'#9a3868',priceColor:'#f9a8d4' }},
  { name: '🌹 Día de la Madre Claro', palette: { accent:'#db2777',accentText:'#fff',accentSoft:'#fdf2f8',bg:'#fff5fb',surface:'#ffffff',surface2:'#fce7f3',border:'#fbcfe8',text:'#3d0a26',textMuted:'#9d174d',priceColor:'#ec4899' }},
  // Día del Padre
  { name: '👨 Día del Padre Oscuro', palette: { accent:'#1d4ed8',accentText:'#fff',accentSoft:'#eff6ff',bg:'#04060e',surface:'#080e1e',surface2:'#0e1630',border:'#162040',text:'#eff6ff',textMuted:'#4060a0',priceColor:'#60a5fa' }},
  { name: '👨 Día del Padre Claro', palette: { accent:'#1d4ed8',accentText:'#fff',accentSoft:'#eff6ff',bg:'#f5f8ff',surface:'#ffffff',surface2:'#dbeafe',border:'#bfdbfe',text:'#1e1b4b',textMuted:'#3730a3',priceColor:'#3b82f6' }},
  // Día del Niño
  { name: '👶 Día del Niño Oscuro', palette: { accent:'#f59e0b',accentText:'#fff',accentSoft:'#fffbeb',bg:'#080600',surface:'#140e00',surface2:'#1e1400',border:'#342000',text:'#fef3c7',textMuted:'#887020',priceColor:'#34d399' }},
  { name: '👶 Día del Niño Claro', palette: { accent:'#f59e0b',accentText:'#fff',accentSoft:'#fffbeb',bg:'#fffbf0',surface:'#ffffff',surface2:'#fef9c3',border:'#fde68a',text:'#1c0e00',textMuted:'#a16207',priceColor:'#10b981' }},
  // Hanukkah
  { name: '🔵 Hanukkah Oscuro', palette: { accent:'#1d4ed8',accentText:'#fff',accentSoft:'#eff6ff',bg:'#02060e',surface:'#060e1e',surface2:'#0a162e',border:'#10224a',text:'#eff6ff',textMuted:'#4060a0',priceColor:'#93c5fd' }},
  { name: '🔵 Hanukkah Claro', palette: { accent:'#1d4ed8',accentText:'#fff',accentSoft:'#eff6ff',bg:'#f0f5ff',surface:'#ffffff',surface2:'#dbeafe',border:'#bfdbfe',text:'#1e3a70',textMuted:'#2563eb',priceColor:'#60a5fa' }},
  // Ramadán
  { name: '🌙 Ramadán Oscuro', palette: { accent:'#d97706',accentText:'#fff',accentSoft:'#fffbeb',bg:'#04040e',surface:'#0a0a1c',surface2:'#10102a',border:'#1e1e44',text:'#fef9e7',textMuted:'#806840',priceColor:'#fcd34d' }},
  { name: '🌙 Ramadán Claro', palette: { accent:'#d97706',accentText:'#fff',accentSoft:'#fffbeb',bg:'#fdf9f0',surface:'#ffffff',surface2:'#fef3c7',border:'#fde68a',text:'#1c1400',textMuted:'#b45309',priceColor:'#eab308' }},
  // Diwali
  { name: '🪔 Diwali Oscuro', palette: { accent:'#f97316',accentText:'#fff',accentSoft:'#fff7ed',bg:'#080400',surface:'#160c00',surface2:'#201400',border:'#3c2400',text:'#fff8e8',textMuted:'#a06020',priceColor:'#facc15' }},
  { name: '🪔 Diwali Claro', palette: { accent:'#f97316',accentText:'#fff',accentSoft:'#fff7ed',bg:'#fff9f0',surface:'#ffffff',surface2:'#ffedd5',border:'#fed7aa',text:'#1c0800',textMuted:'#c2410c',priceColor:'#eab308' }},
  // Carnaval
  { name: '🎊 Carnaval Oscuro', palette: { accent:'#a855f7',accentText:'#fff',accentSoft:'#fdf4ff',bg:'#060010',surface:'#0c0020',surface2:'#12003a',border:'#200060',text:'#fdf4ff',textMuted:'#8040c0',priceColor:'#facc15' }},
  { name: '🎊 Carnaval Claro', palette: { accent:'#9333ea',accentText:'#fff',accentSoft:'#fdf4ff',bg:'#fdf8ff',surface:'#ffffff',surface2:'#f3e8ff',border:'#e9d5ff',text:'#2e1065',textMuted:'#7c3aed',priceColor:'#f59e0b' }},
  // Año Nuevo Chino
  { name: '🐲 Año Nuevo Chino Oscuro', palette: { accent:'#dc2626',accentText:'#fff',accentSoft:'#fef2f2',bg:'#0c0400',surface:'#1e0800',surface2:'#2e1000',border:'#481800',text:'#fff5e8',textMuted:'#aa4820',priceColor:'#fbbf24' }},
  { name: '🐲 Año Nuevo Chino Claro', palette: { accent:'#dc2626',accentText:'#fff',accentSoft:'#fef2f2',bg:'#fff5f5',surface:'#ffffff',surface2:'#fee2e2',border:'#fecaca',text:'#3d0000',textMuted:'#b91c1c',priceColor:'#d97706' }},
  // Eid al-Fitr
  { name: '🌟 Eid Oscuro', palette: { accent:'#16a34a',accentText:'#fff',accentSoft:'#f0fdf4',bg:'#020a04',surface:'#061408',surface2:'#0a1e0c',border:'#103618',text:'#f0fdf4',textMuted:'#3a7848',priceColor:'#fbbf24' }},
  { name: '🌟 Eid Claro', palette: { accent:'#15803d',accentText:'#fff',accentSoft:'#f0fdf4',bg:'#f4fef6',surface:'#ffffff',surface2:'#dcfce7',border:'#bbf7d0',text:'#052e16',textMuted:'#166534',priceColor:'#ca8a04' }},
  // Kwanzaa
  { name: '🕯️ Kwanzaa Oscuro', palette: { accent:'#dc2626',accentText:'#fff',accentSoft:'#fef2f2',bg:'#050301',surface:'#100800',surface2:'#1a1000',border:'#342000',text:'#fdf6e8',textMuted:'#886030',priceColor:'#16a34a' }},
  { name: '🕯️ Kwanzaa Claro', palette: { accent:'#dc2626',accentText:'#fff',accentSoft:'#fef2f2',bg:'#fff8f0',surface:'#ffffff',surface2:'#fee2e2',border:'#fecaca',text:'#200000',textMuted:'#b91c1c',priceColor:'#166534' }},
  // St. Patrick
  { name: '🍀 San Patricio Oscuro', palette: { accent:'#15803d',accentText:'#fff',accentSoft:'#f0fdf4',bg:'#020a04',surface:'#061608',surface2:'#0a2010',border:'#103c16',text:'#f0fdf4',textMuted:'#3a7848',priceColor:'#86efac' }},
  { name: '🍀 San Patricio Claro', palette: { accent:'#15803d',accentText:'#fff',accentSoft:'#f0fdf4',bg:'#f0fdf4',surface:'#ffffff',surface2:'#dcfce7',border:'#bbf7d0',text:'#052e16',textMuted:'#166534',priceColor:'#4ade80' }},
  // Thanksgiving
  { name: '🦃 Thanksgiving Oscuro', palette: { accent:'#b45309',accentText:'#fff',accentSoft:'#fffbeb',bg:'#0c0500',surface:'#1c1000',surface2:'#281800',border:'#402800',text:'#fef3c7',textMuted:'#9a6030',priceColor:'#f59e0b' }},
  { name: '🦃 Thanksgiving Claro', palette: { accent:'#b45309',accentText:'#fff',accentSoft:'#fffbeb',bg:'#fffbf0',surface:'#ffffff',surface2:'#fef3c7',border:'#fde68a',text:'#1c0a00',textMuted:'#92400e',priceColor:'#d97706' }},
  // Verano
  { name: '🏖️ Verano Oscuro', palette: { accent:'#0891b2',accentText:'#fff',accentSoft:'#ecfeff',bg:'#020c10',surface:'#04181e',surface2:'#06242e',border:'#0c3a48',text:'#cffafe',textMuted:'#206080',priceColor:'#f97316' }},
  { name: '🏖️ Verano Claro', palette: { accent:'#0891b2',accentText:'#fff',accentSoft:'#ecfeff',bg:'#f0fdff',surface:'#ffffff',surface2:'#cffafe',border:'#a5f3fc',text:'#083344',textMuted:'#0e7490',priceColor:'#f97316' }},
  // Oktoberfest
  { name: '🍺 Oktoberfest Oscuro', palette: { accent:'#b45309',accentText:'#fff',accentSoft:'#fffbeb',bg:'#080400',surface:'#140c00',surface2:'#201400',border:'#3a2400',text:'#fef3c7',textMuted:'#907030',priceColor:'#fbbf24' }},
  { name: '🍺 Oktoberfest Claro', palette: { accent:'#d97706',accentText:'#fff',accentSoft:'#fffbeb',bg:'#fffbf0',surface:'#ffffff',surface2:'#fef9c3',border:'#fde68a',text:'#1c0a00',textMuted:'#b45309',priceColor:'#dc2626' }},
]

export const ALL_PALETTES = [...DARK_PALETTES, ...LIGHT_PALETTES, ...HOLIDAY_PALETTES]
export const PRESET_PALETTES = ALL_PALETTES

export function applyGlobalPalette(palette: BusinessPalette) {
  applyHomeTheme(palette)
}

// ═══════════════════════════════════════════════════════
// ANIMATED PALETTES — Premium only
// Base colors + animation key; CSS handles the animation
// ═══════════════════════════════════════════════════════
export const ANIMATED_PALETTES: { name: string; palette: import('@/types').BusinessPalette }[] = [
  {
    name: '🎮 Gamer',
    palette: {
      name: '🎮 Gamer', tier: 'premium', animated: true, animationKey: 'gamer',
      accent: '#00ff88', accentText: '#000', accentSoft: '#00ff8820',
      bg: '#030609', surface: '#0a1020', surface2: '#101830',
      border: '#1a2840', text: '#e0f8ff', textMuted: '#4a8898', priceColor: '#00ff88',
    }
  },
  {
    name: '🌌 Aurora',
    palette: {
      name: '🌌 Aurora', tier: 'premium', animated: true, animationKey: 'aurora',
      accent: '#a855f7', accentText: '#fff', accentSoft: '#a855f720',
      bg: '#02040a', surface: '#080c1a', surface2: '#0e1428',
      border: '#1a2040', text: '#e8f0ff', textMuted: '#5868a0', priceColor: '#38bdf8',
    }
  },
  {
    name: '💜 Neon Pulse',
    palette: {
      name: '💜 Neon Pulse', tier: 'premium', animated: true, animationKey: 'neon-pulse',
      accent: '#ff00aa', accentText: '#fff', accentSoft: '#ff00aa20',
      bg: '#040010', surface: '#0c0020', surface2: '#14003a',
      border: '#200060', text: '#fdf0ff', textMuted: '#8040c0', priceColor: '#00ffee',
    }
  },
  {
    name: '🤖 Cyber',
    palette: {
      name: '🤖 Cyber', tier: 'premium', animated: true, animationKey: 'cyber',
      accent: '#ffee00', accentText: '#000', accentSoft: '#ffee0020',
      bg: '#000508', surface: '#020e18', surface2: '#041828',
      border: '#083040', text: '#c8f8ff', textMuted: '#306880', priceColor: '#ff4400',
    }
  },
  {
    name: '🌈 Rainbow Flow',
    palette: {
      name: '🌈 Rainbow Flow', tier: 'premium', animated: true, animationKey: 'rainbow',
      accent: '#f97316', accentText: '#fff', accentSoft: '#f9731620',
      bg: '#04040a', surface: '#0c0c1c', surface2: '#14142c',
      border: '#1e1e3e', text: '#faf8ff', textMuted: '#6060a0', priceColor: '#f97316',
    }
  },
]

// Add tier markers to existing palettes
export const STANDARD_PALETTES = DARK_PALETTES.concat(LIGHT_PALETTES).map(p => ({
  ...p, palette: { ...p.palette, tier: 'standard' as const }
}))
export const FESTIVE_PALETTES = HOLIDAY_PALETTES.map(p => ({
  ...p, palette: { ...p.palette, tier: 'sponsored' as const }
}))

export const ALL_PALETTES_TIERED = [
  ...STANDARD_PALETTES,
  ...FESTIVE_PALETTES,
  ...ANIMATED_PALETTES,
]

// ─── Animated theme CSS injection ───────────────────────────────────────────
export function injectAnimatedThemeCSS(animationKey?: string) {
  if (typeof document === 'undefined' || !animationKey) return
  // Clean up previous
  document.getElementById('bisne-animated-theme')?.remove()
  const el = document.createElement('style')
  el.id = 'bisne-animated-theme'

  const css: Record<string, string> = {
    // 🎮 Gamer = Aurora RGB: blobs of green/cyan/magenta cycling like an RGB backlight
    gamer: `
      @keyframes gamer-blob1 { 0%,100%{transform:translate(-10%,-20%) scale(1.1)} 33%{transform:translate(30%,10%) scale(1.4)} 66%{transform:translate(10%,30%) scale(0.9)} }
      @keyframes gamer-blob2 { 0%,100%{transform:translate(30%,10%) scale(1.2)} 33%{transform:translate(-20%,30%) scale(0.9)} 66%{transform:translate(20%,-20%) scale(1.3)} }
      @keyframes gamer-blob3 { 0%,100%{transform:translate(10%,30%) scale(0.9)} 33%{transform:translate(10%,-20%) scale(1.3)} 66%{transform:translate(-20%,10%) scale(1.1)} }
      @keyframes gamer-hue   { 0%{filter:hue-rotate(0deg) blur(60px)} 100%{filter:hue-rotate(360deg) blur(60px)} }
      .biz-page-anim-layer { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; }
      .biz-page-anim-blob1 { position:fixed; width:60vw; height:60vw; border-radius:50%; background:#00ff88; opacity:0.18; pointer-events:none; z-index:0; animation:gamer-blob1 7s ease-in-out infinite; filter:blur(80px); }
      .biz-page-anim-blob2 { position:fixed; width:50vw; height:50vw; border-radius:50%; background:#00ccff; opacity:0.16; pointer-events:none; z-index:0; animation:gamer-blob2 9s ease-in-out infinite; filter:blur(70px); }
      .biz-page-anim-blob3 { position:fixed; width:45vw; height:45vw; border-radius:50%; background:#ff00cc; opacity:0.14; pointer-events:none; z-index:0; animation:gamer-blob3 11s ease-in-out infinite; filter:blur(90px); }
    `,
    // 🌌 Aurora: purple/teal/pink nebula lights
    aurora: `
      @keyframes aurora-blob1 { 0%,100%{transform:translate(-20%,-10%) scale(1.2) rotate(-15deg)} 50%{transform:translate(20%,15%) scale(1.5) rotate(15deg)} }
      @keyframes aurora-blob2 { 0%,100%{transform:translate(25%,15%) scale(1.3) rotate(10deg)} 50%{transform:translate(-15%,-5%) scale(1.0) rotate(-20deg)} }
      @keyframes aurora-blob3 { 0%,100%{transform:translate(-5%,20%) scale(1.0) rotate(5deg)} 50%{transform:translate(15%,-25%) scale(1.4) rotate(-10deg)} }
      .biz-page-anim-blob1 { position:fixed; width:80vw; height:50vh; border-radius:50%; background:#a855f7; opacity:0.22; pointer-events:none; z-index:0; animation:aurora-blob1 9s ease-in-out infinite; filter:blur(60px); }
      .biz-page-anim-blob2 { position:fixed; width:70vw; height:60vh; border-radius:50%; background:#06b6d4; opacity:0.18; pointer-events:none; z-index:0; animation:aurora-blob2 11s ease-in-out infinite; filter:blur(70px); }
      .biz-page-anim-blob3 { position:fixed; width:60vw; height:40vh; border-radius:50%; background:#ec4899; opacity:0.16; pointer-events:none; z-index:0; animation:aurora-blob3 8s ease-in-out infinite; filter:blur(80px); }
    `,
    // 💜 Neon Pulse: color-cycling scanline + pulse glow
    'neon-pulse': `
      @keyframes np-blob1 { 0%,100%{transform:translate(-30%,-20%) scale(1.1)} 50%{transform:translate(20%,20%) scale(1.4)} }
      @keyframes np-blob2 { 0%,100%{transform:translate(20%,20%) scale(1.3)} 50%{transform:translate(-20%,-10%) scale(0.9)} }
      @keyframes np-hue    { 0%{filter:hue-rotate(0deg) blur(70px)} 100%{filter:hue-rotate(360deg) blur(70px)} }
      @keyframes np-scan   { 0%{top:-4px;opacity:0.4} 80%{opacity:0.3} 100%{top:100%;opacity:0} }
      @keyframes np-flicker { 0%,90%,100%{opacity:1} 93%{opacity:0.85} 96%{opacity:0.9} }
      .biz-page-anim-blob1 { position:fixed; width:70vw; height:70vw; border-radius:50%; background:#ff00aa; opacity:0.20; pointer-events:none; z-index:0; animation:np-blob1 8s ease-in-out infinite, np-hue 6s linear infinite; filter:blur(70px); }
      .biz-page-anim-blob2 { position:fixed; width:60vw; height:60vw; border-radius:50%; background:#00ffee; opacity:0.15; pointer-events:none; z-index:0; animation:np-blob2 10s ease-in-out infinite; filter:blur(80px); }
      .biz-page-anim-scan  { position:fixed; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,#ff00aa80,#aa00ff80,transparent); pointer-events:none; z-index:1; animation:np-scan 4s linear infinite; }
      .biz-page { animation: np-flicker 8s steps(1) infinite; }
    `,
    // 🤖 Cyber: yellow scanlines + teal/red corner glow + glitch
    cyber: `
      @keyframes cy-scan  { 0%{transform:translateY(-100vh)} 100%{transform:translateY(100vh)} }
      @keyframes cy-glitch { 0%,94%,100%{clip-path:none;transform:none} 95%{clip-path:inset(30% 0 40% 0);transform:translateX(6px)} 96%{clip-path:inset(60% 0 10% 0);transform:translateX(-4px)} 97%{clip-path:inset(10% 0 70% 0);transform:translateX(3px)} 98%{clip-path:none;transform:none} }
      .biz-page-anim-scan  { position:fixed; inset:0; pointer-events:none; z-index:0; background:repeating-linear-gradient(0deg,transparent,transparent 3px,#ffee0006 3px,#ffee0006 4px); animation:cy-scan 12s linear infinite; }
      .biz-page-anim-blob1 { position:fixed; bottom:-10%; right:-10%; width:40vw; height:40vw; border-radius:50%; background:#ffee00; opacity:0.12; pointer-events:none; z-index:0; filter:blur(80px); }
      .biz-page-anim-blob2 { position:fixed; top:-10%; left:-10%; width:40vw; height:40vw; border-radius:50%; background:#00aaff; opacity:0.10; pointer-events:none; z-index:0; filter:blur(80px); }
      .biz-page { animation: cy-glitch 12s steps(1) infinite; }
    `,
    // 🌈 Rainbow Flow: rotating conic gradient blobs
    rainbow: `
      @keyframes rb-spin   { 0%{transform:rotate(0deg) scale(1.8)} 100%{transform:rotate(360deg) scale(1.8)} }
      @keyframes rb-spin2  { 0%{transform:rotate(180deg) scale(1.5)} 100%{transform:rotate(540deg) scale(1.5)} }
      @keyframes rb-pulse  { 0%,100%{opacity:0.25} 50%{opacity:0.40} }
      .biz-page-anim-blob1 { position:fixed; top:50%; left:50%; width:100vw; height:100vw; margin:-50vw 0 0 -50vw; border-radius:50%; background:conic-gradient(#f97316,#eab308,#22c55e,#06b6d4,#6366f1,#ec4899,#f97316); opacity:0.25; pointer-events:none; z-index:0; animation:rb-spin 10s linear infinite, rb-pulse 5s ease-in-out infinite; filter:blur(60px); }
      .biz-page-anim-blob2 { position:fixed; top:50%; left:50%; width:80vw; height:80vw; margin:-40vw 0 0 -40vw; border-radius:50%; background:conic-gradient(#ec4899,#6366f1,#06b6d4,#22c55e,#eab308,#f97316,#ec4899); opacity:0.15; pointer-events:none; z-index:0; animation:rb-spin2 14s linear infinite; filter:blur(80px); }
    `,
  }

  el.textContent = css[animationKey] ?? ''
  document.head.appendChild(el)

  // Inject real DOM blob elements (can't do multiple animated layers with ::before alone)
  document.getElementById('bisne-animated-blobs')?.remove()
  const blobContainer = document.createElement('div')
  blobContainer.id = 'bisne-animated-blobs'

  const classMap: Record<string, string[]> = {
    gamer:       ['biz-page-anim-blob1','biz-page-anim-blob2','biz-page-anim-blob3'],
    aurora:      ['biz-page-anim-blob1','biz-page-anim-blob2','biz-page-anim-blob3'],
    'neon-pulse':['biz-page-anim-blob1','biz-page-anim-blob2','biz-page-anim-scan'],
    cyber:       ['biz-page-anim-scan','biz-page-anim-blob1','biz-page-anim-blob2'],
    rainbow:     ['biz-page-anim-blob1','biz-page-anim-blob2'],
  }

  ;(classMap[animationKey] ?? []).forEach(cls => {
    const div = document.createElement('div')
    div.className = cls
    blobContainer.appendChild(div)
  })

  document.body.appendChild(blobContainer)
}

export function removeAnimatedThemeCSS() {
  if (typeof document === 'undefined') return
  document.getElementById('bisne-animated-theme')?.remove()
  document.getElementById('bisne-animated-blobs')?.remove()
}
