import { ArrowLeft, Check, Info, UtensilsCrossed } from 'lucide-react'
import { Button, Row } from '../components/ui'
import { DEMO_MODE } from '../lib/demo'
import { useLang } from '../lib/i18n'
import { PURPOSE_LABEL } from '../lib/matching'
import type { Decor, Prefs, Table } from '../lib/types'
import { endTime, formatDate, formatDuration, type Visit } from '../lib/visit'
import { DecorTotal } from './Atmosphere'

export interface Draft {
  table: Table
  score: number
  prefs: Prefs
  visit: Visit
  name: string
  allergy: string
  decor?: Decor
}

/** Everything the guest is about to book, in one place. */
function Summary({ draft }: { draft: Draft }) {
  const { t, lang } = useLang()
  const { table, prefs, visit } = draft
  return (
    <>
      <div className="divide-y divide-stone-100">
        <Row label={t('Table')}>
          {t('Table {n}', { n: table.id })} · {t(table.zone)}
        </Row>
        <Row label={t('Purpose')}>{t(PURPOSE_LABEL[prefs.purpose])}</Row>
        <Row label={t('Date')}>{formatDate(visit.date, lang)}</Row>
        <Row label={t('Time')}>
          <span className="tabular-nums">
            {visit.time}–{endTime(visit)}
          </span>{' '}
          <span className="font-normal text-stone-600">({formatDuration(visit.duration, t)})</span>
        </Row>
        <Row label={t('Guests')}>
          {prefs.party} · {t('Seats: {n}', { n: table.seats })}
        </Row>
        {draft.name.trim() && <Row label={t('Your name')}>{draft.name.trim()}</Row>}
        {draft.allergy.trim() && <Row label={t('Allergies')}>{draft.allergy.trim()}</Row>}
        <Row label={t('Match')}>{draft.score}%</Row>
      </div>
      <div className="mt-5">
        <h3 className="label">{t('Table styling')}</h3>
        <div className="mt-2">
          <DecorTotal decor={draft.decor ?? ({} as Decor)} enabled={!!draft.decor} />
        </div>
        {draft.decor?.note?.trim() && (
          <p className="mt-2 text-sm text-stone-600">
            {t('Special wishes')}: {draft.decor.note.trim()}
          </p>
        )}
      </div>
      <p className="mt-4 text-xs text-stone-600">
        {t('Dishes are paid separately, at menu prices. Deposit and cancellation terms are set by the restaurant.')}
      </p>
    </>
  )
}

export function BookingReview({ draft, onBack, onConfirm }: { draft: Draft; onBack: () => void; onConfirm: () => void }) {
  const { t } = useLang()
  return (
    <div className="flex h-full animate-fade-up flex-col p-5 sm:p-7">
      <div className="label">{t('Confirmation')}</div>
      <h2 className="mt-2 font-serif text-4xl leading-tight">{t('Check your booking')}</h2>

      <div className="mt-5">
        <Summary draft={draft} />
      </div>

      {DEMO_MODE && (
        <p className="mt-5 flex gap-2.5 rounded-lg border border-bronze/30 bg-bronze-soft/70 px-3.5 py-3 text-sm">
          <Info size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-bronze-deep" aria-hidden />
          <span>
            {t(
              'This is a demo. Confirming does not book a table at the restaurant and nothing is charged. The request stays in this browser tab only.',
            )}
          </span>
        </p>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 mt-auto flex gap-2 bg-gradient-to-t from-white from-70% px-5 pb-5 pt-8 sm:-mx-7 sm:-mb-7 sm:px-7 sm:pb-7">
        <Button variant="secondary" size="lg" className="shrink-0 !px-4" onClick={onBack} aria-label={t('Back')}>
          <ArrowLeft size={16} strokeWidth={1.75} />
        </Button>
        <Button size="lg" full onClick={onConfirm}>
          <Check size={16} strokeWidth={2} />
          {t(DEMO_MODE ? 'Confirm demo booking' : 'Confirm booking')}
        </Button>
      </div>
    </div>
  )
}

export function BookingDone({ draft, onMenu, onRestart }: { draft: Draft; onMenu: () => void; onRestart: () => void }) {
  const { t } = useLang()
  return (
    <div className="flex h-full animate-fade-up flex-col p-5 sm:p-7" role="status">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white">
        <Check size={20} strokeWidth={2} aria-hidden />
      </span>
      <h2 className="mt-6 font-serif text-4xl leading-tight">
        {t(DEMO_MODE ? 'Demo booking for table {n} is done' : 'Table {n} is yours', { n: draft.table.id })}
      </h2>
      <p className="mt-3 text-stone-600">
        {t(
          DEMO_MODE
            ? 'The restaurant has not received it and the table is not held for you. It shows only in the demo staff panel of this tab and disappears when the page reloads.'
            : 'Your waiter already knows the occasion and your preferences. Nothing to explain when you arrive.',
        )}
      </p>
      <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3.5">
        <Summary draft={draft} />
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button size="lg" full onClick={onMenu}>
          <UtensilsCrossed size={16} strokeWidth={1.75} />
          {t('Order from the menu')}
        </Button>
        <Button variant="ghost" full onClick={onRestart}>
          {t('New booking')}
        </Button>
      </div>
    </div>
  )
}
