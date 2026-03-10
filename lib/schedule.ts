import { StructuredSchedule, Weekday, WEEKDAYS } from '@/types'

export const DAY_NAMES_ES: Record<Weekday, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
  thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
}
export const DAY_NAMES_EN: Record<Weekday, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

export function isOpenNow(schedule?: StructuredSchedule): boolean {
  if (!schedule) return true
  if (schedule.alwaysOpen) return true

  const now = new Date()
  const jsDay = now.getDay() // 0=Sun,1=Mon...
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1 // Mon=0..Sun=6
  const day = WEEKDAYS[dayIndex]
  const ds = schedule.days[day]

  if (!ds || ds.closed) return false
  if (ds.h24) return true

  const [oh, om] = ds.open.split(':').map(Number)
  const [ch, cm] = ds.close.split(':').map(Number)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const openMins = oh * 60 + om
  const closeMins = ch * 60 + cm

  if (closeMins < openMins) {
    // Overnight (e.g. 22:00 - 02:00)
    return nowMins >= openMins || nowMins < closeMins
  }
  return nowMins >= openMins && nowMins < closeMins
}

export function getScheduleSummary(schedule?: StructuredSchedule, lang: 'es'|'en' = 'es'): string {
  if (!schedule) return ''
  if (schedule.alwaysOpen) return lang === 'es' ? '24/7 Siempre abierto' : '24/7 Always open'

  const names = lang === 'es' ? DAY_NAMES_ES : DAY_NAMES_EN
  const parts: string[] = []

  WEEKDAYS.forEach(day => {
    const ds = schedule.days[day]
    if (!ds || ds.closed) return
    const label = names[day]
    if (ds.h24) {
      parts.push(`${label}: 24h`)
    } else {
      parts.push(`${label}: ${ds.open}–${ds.close}`)
    }
  })

  return parts.slice(0, 3).join(' · ') + (parts.length > 3 ? ` +${parts.length - 3}` : '')
}
