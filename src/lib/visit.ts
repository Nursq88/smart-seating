import type { Lang } from './i18n'

/** When the guest comes and for how long. */
export interface Visit {
  /** Local date, YYYY-MM-DD */
  date: string
  /** Arrival, HH:MM */
  time: string
  /** Minutes */
  duration: number
}

export const DURATIONS = [60, 90, 120, 180]

/** How far ahead a booking can be made. */
export const DAYS_AHEAD = 30

// Arrival times offered in the form. The restaurant's real hours are not connected in the demo.
const FIRST = 10 * 60
const LAST = 22 * 60 + 30
const STEP = 30

const pad = (n: number) => String(n).padStart(2, '0')
const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function isoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(date: Date, days: number) {
  const out = new Date(date)
  out.setDate(out.getDate() + days)
  return out
}

export function dateRange(now = new Date()) {
  return { min: isoDate(now), max: isoDate(addDays(now, DAYS_AHEAD)) }
}

/** Arrival times for a date; for today only those at least half an hour away. */
export function timeSlots(date: string, now = new Date()) {
  const earliest = date === isoDate(now) ? now.getHours() * 60 + now.getMinutes() + 30 : 0
  const out: string[] = []
  for (let m = FIRST; m <= LAST; m += STEP) if (m >= earliest) out.push(toTime(m))
  return out
}

/** The nearest evening slot that is still possible. */
export function defaultVisit(now = new Date()): Visit {
  const today = isoDate(now)
  const slots = timeSlots(today, now)
  if (!slots.length) return { date: isoDate(addDays(now, 1)), time: '19:00', duration: 120 }
  return { date: today, time: slots.includes('19:00') ? '19:00' : slots[0], duration: 120 }
}

/** Problems with a visit typed or kept from earlier, as translation keys; empty when it is fine. */
export function visitError(visit: Visit, now = new Date()) {
  const { min, max } = dateRange(now)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visit.date) || visit.date < min) return 'Choose today or a later date'
  if (visit.date > max) return 'Bookings open {n} days ahead'
  if (!timeSlots(visit.date, now).includes(visit.time)) return 'Choose another time'
  return ''
}

export function endTime(visit: Visit) {
  return toTime(toMinutes(visit.time) + visit.duration)
}

const LOCALE: Record<Lang, string> = { en: 'en-GB', ru: 'ru-RU', kk: 'kk-KZ' }

export function formatDate(date: string, lang: Lang) {
  const [y, m, d] = date.split('-').map(Number)
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
  } catch {
    return date
  }
}

/** "1 h 30 min" in the interface language, built from translated units. */
export function formatDuration(minutes: number, t: (key: string, vars?: Record<string, number>) => string) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!m) return t('{n} h', { n: h })
  if (!h) return t('{n} min', { n: m })
  return `${t('{n} h', { n: h })} ${t('{n} min', { n: m })}`
}
