import { CalendarDays, Clock, Pencil, Users } from 'lucide-react'
import { Counter, Segmented } from '../components/ui'
import { DEMO_MODE } from '../lib/demo'
import { useLang } from '../lib/i18n'
import { PURPOSE_LABEL } from '../lib/matching'
import { PURPOSE_ICON } from '../lib/purposes'
import type { Purpose } from '../lib/types'
import { dateRange, DAYS_AHEAD, DURATIONS, endTime, formatDate, formatDuration, timeSlots, visitError, type Visit } from '../lib/visit'

/** Date, arrival time, length of the visit and number of guests. */
export function VisitFields({
  visit,
  onChange,
  party,
  onParty,
  maxParty,
}: {
  visit: Visit
  onChange: (visit: Visit) => void
  party: number
  onParty: (party: number) => void
  maxParty: number
}) {
  const { t, lang } = useLang()
  const { min, max } = dateRange()
  const slots = timeSlots(visit.date)
  const error = visitError(visit)
  const hours = (minutes: number) =>
    t('{n} h', { n: new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU').format(minutes / 60) })

  const setDate = (date: string) => {
    const next = timeSlots(date)
    // Keep the chosen time when the new day still has it.
    onChange({ ...visit, date, time: next.includes(visit.time) ? visit.time : next[0] ?? visit.time })
  }

  return (
    <div className="card px-5 py-5 sm:px-6">
      <h2 className="text-[15px] font-semibold">{t('When are you coming?')}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-stone-600">{t('Date')}</span>
          <input
            type="date"
            className="input"
            min={min}
            max={max}
            value={visit.date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-describedby={error ? 'visit-error' : undefined}
            aria-invalid={!!error}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-stone-600">{t('Arrival time')}</span>
          <select
            className="input"
            value={slots.includes(visit.time) ? visit.time : ''}
            onChange={(e) => onChange({ ...visit, time: e.target.value })}
            disabled={!slots.length}
          >
            {!slots.includes(visit.time) && <option value="">—</option>}
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <div id="visit-duration" className="mb-1.5 flex items-baseline justify-between gap-3 text-sm text-stone-600">
          <span>{t('Length of visit')}</span>
          {!error && <span className="tabular-nums">{t('Until {time}', { time: endTime(visit) })}</span>}
        </div>
        <Segmented
          full
          label={t('Length of visit')}
          value={visit.duration}
          options={DURATIONS.map((value) => ({ value, label: hours(value) }))}
          onChange={(duration) => onChange({ ...visit, duration })}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-stone-600" id="party-label">
          {t('Party size')}
        </span>
        <div role="group" aria-labelledby="party-label">
          <Counter value={party} min={1} max={maxParty} onChange={onParty} less={t('Fewer guests')} more={t('More guests')} />
        </div>
      </div>

      {error && (
        <p id="visit-error" role="alert" className="mt-4 text-sm font-medium text-bronze-deep">
          {t(error, { n: DAYS_AHEAD })}
        </p>
      )}
      {DEMO_MODE && (
        <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-600">
          {t('Demo: free tables do not depend on the date and time yet, and the restaurant’s opening hours are not connected.')}
        </p>
      )}
    </div>
  )
}

/** One line with everything chosen so far, and a way back to change it. */
export function VisitSummary({
  visit,
  party,
  purpose,
  onEdit,
}: {
  visit: Visit
  party: number
  purpose: Purpose
  onEdit: () => void
}) {
  const { t, lang } = useLang()
  const Icon = PURPOSE_ICON[purpose]
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm">
      <span className="flex items-center gap-1.5">
        <Icon size={14} strokeWidth={1.75} className="text-bronze-deep" aria-hidden />
        <span className="font-medium">{t(PURPOSE_LABEL[purpose])}</span>
      </span>
      <span className="flex items-center gap-1.5 text-stone-600">
        <CalendarDays size={14} strokeWidth={1.75} aria-hidden />
        {formatDate(visit.date, lang)}
      </span>
      <span className="flex items-center gap-1.5 tabular-nums text-stone-600">
        <Clock size={14} strokeWidth={1.75} aria-hidden />
        {visit.time}–{endTime(visit)}
        <span className="sr-only">, {formatDuration(visit.duration, t)}</span>
      </span>
      <span className="flex items-center gap-1.5 text-stone-600">
        <Users size={14} strokeWidth={1.75} aria-hidden />
        {t('Guests: {n}', { n: party })}
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="ml-auto flex min-h-[32px] items-center gap-1.5 rounded-md px-2 text-sm font-medium text-ink underline-offset-4 transition hover:bg-stone-100 hover:underline"
      >
        <Pencil size={13} strokeWidth={1.75} aria-hidden />
        {t('Change')}
      </button>
    </div>
  )
}
