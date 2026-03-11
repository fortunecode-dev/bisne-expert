import { StructuredSchedule, Weekday, WEEKDAYS } from '@/types'

export const DAY_NAMES_ES: Record<Weekday, string> = {
  monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles',
  thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo',
}
export const DAY_NAMES_ES_SHORT: Record<Weekday, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
  thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
}
export const DAY_NAMES_EN: Record<Weekday, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

export function isOpenNow(schedule?: StructuredSchedule): boolean {
  if (!schedule) return true
  if (schedule.alwaysOpen) return true

  const now = new Date()
  const jsDay = now.getDay()
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1
  const day = WEEKDAYS[dayIndex]
  const ds = schedule.days[day]

  if (!ds || ds.closed) return false
  if (ds.h24) return true

  const [oh, om] = ds.open.split(':').map(Number)
  const [ch, cm] = ds.close.split(':').map(Number)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const openMins = oh * 60 + om
  const closeMins = ch * 60 + cm

  if (closeMins < openMins) return nowMins >= openMins || nowMins < closeMins
  return nowMins >= openMins && nowMins < closeMins
}

// Format time like "4:00 PM"
function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

// Humanize duration: "2h 30min", "45min", "3h"
function humanDuration(minutes: number): string {
  if (minutes < 0) minutes += 24 * 60
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export type ScheduleStatus = {
  isOpen: boolean
  label: string          // "abierto hasta 4:00 PM (2h)" | "cerrado hasta el lunes 8:00 AM (14h)"
  timeStr: string        // just the time part
  color: 'green' | 'red'
}

export function getScheduleStatus(schedule?: StructuredSchedule, lang: 'es' | 'en' = 'es'): ScheduleStatus {
  const open = isOpenNow(schedule)

  if (!schedule || schedule.alwaysOpen) {
    return { isOpen: true, label: '24/7', timeStr: '24/7', color: 'green' }
  }

  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const jsDay = now.getDay()
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1

  if (open) {
    // Find today's closing time
    const day = WEEKDAYS[todayIndex]
    const ds = schedule.days[day]
    if (ds?.h24) return { isOpen: true, label: '24h', timeStr: '24h', color: 'green' }
    if (ds && !ds.closed) {
      const [ch, cm] = ds.close.split(':').map(Number)
      const closeMins = ch * 60 + cm
      const diff = closeMins - nowMins
      const timeStr = fmtTime(ds.close)
      const dur = humanDuration(diff)
      const label = lang === 'es'
        ? `abierto hasta ${timeStr} (${dur})`
        : `open until ${timeStr} (${dur})`
      return { isOpen: true, label, timeStr, color: 'green' }
    }
    return { isOpen: true, label: lang === 'es' ? 'abierto' : 'open', timeStr: '', color: 'green' }
  } else {
    // Find next opening: walk days forward (up to 7)
    for (let offset = 1; offset <= 7; offset++) {
      const nextIndex = (todayIndex + offset) % 7
      const day = WEEKDAYS[nextIndex]
      const ds = schedule.days[day]
      if (!ds || ds.closed) continue
      const openStr = ds.h24 ? '00:00' : ds.open
      const [oh, om] = openStr.split(':').map(Number)
      const openMins = oh * 60 + om
      const timeStr = ds.h24 ? '12:00 AM' : fmtTime(openStr)
      const dayName = lang === 'es' ? DAY_NAMES_ES[day] : DAY_NAMES_EN[day]

      let diff: number
      let label: string
      if (offset === 1) {
        // Tomorrow
        diff = (24 * 60 - nowMins) + openMins
        const dur = humanDuration(diff)
        label = lang === 'es'
          ? `cerrado hasta ${timeStr} (${dur})`
          : `closed until ${timeStr} (${dur})`
      } else {
        diff = (offset - 1) * 24 * 60 + (24 * 60 - nowMins) + openMins
        const dur = humanDuration(diff)
        label = lang === 'es'
          ? `cerrado hasta el ${dayName} ${timeStr} (${dur})`
          : `closed until ${dayName} ${timeStr} (${dur})`
      }
      return { isOpen: false, label, timeStr, color: 'red' }
    }
    // Permanently closed
    return {
      isOpen: false,
      label: lang === 'es' ? 'cerrado' : 'closed',
      timeStr: '',
      color: 'red',
    }
  }
}

export function getScheduleSummary(schedule?: StructuredSchedule, lang: 'es'|'en' = 'es'): string {
  if (!schedule) return ''
  if (schedule.alwaysOpen) return lang === 'es' ? '24/7 Siempre abierto' : '24/7 Always open'

  const names = lang === 'es' ? DAY_NAMES_ES_SHORT : DAY_NAMES_EN
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
