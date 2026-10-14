import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleAlert, Hand } from 'lucide-react'
import { StatusPill, TableAttributes } from '../components/TableInfo'
import { Button, Segmented } from '../components/ui'
import { useLang } from '../lib/i18n'
import { compromises, PURPOSE_LABEL, scoreParts } from '../lib/matching'
import { PURPOSE_ICON } from '../lib/purposes'
import type { Match, Prefs, Purpose, Table } from '../lib/types'
import { sceneHint } from '../three/RestaurantScene'

/** How the percentage was reached, criterion by criterion, straight from the scoring code. */
function ScoreExplainer({ prefs, table, score }: { prefs: Prefs; table: Table; score: number }) {
  const { t } = useLang()
  const parts = scoreParts(prefs, table)
  const total = parts.reduce((sum, x) => sum + x.weight, 0)
  return (
    <details className="group rounded-lg border border-stone-200">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium hover:bg-stone-50">
        {t('How is {n}% calculated?', { n: score })}
        <span className="text-stone-500 transition-transform group-open:rotate-90" aria-hidden>
          ›
        </span>
      </summary>
      <div className="border-t border-stone-100 px-3.5 pb-3.5 pt-3 text-sm">
        <p className="text-stone-600">
          {t(
            'The match is a weighted average of the criteria below. How much each counts depends on the purpose of your visit; window, entrance and bar count only if you turned them on. A table that falls short of a wish loses half of that criterion per level; one that goes beyond it loses a tenth. Spare seats lower the size score.',
          )}
        </p>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="text-xs text-stone-600">
              <th scope="col" className="pb-1.5 font-medium">
                {t('Criterion')}
              </th>
              <th scope="col" className="pb-1.5 text-right font-medium">
                {t('Weight')}
              </th>
              <th scope="col" className="pb-1.5 pl-3 text-right font-medium">
                {t('Met')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {parts.map((part) => (
              <tr key={part.label}>
                <th scope="row" className="py-1.5 pr-2 font-normal">
                  {t(part.label)}
                </th>
                <td className="py-1.5 text-right tabular-nums text-stone-600">{Math.round((part.weight / total) * 100)}%</td>
                <td className="py-1.5 pl-3">
                  <span className="flex items-center justify-end gap-2">
                    <span className="hidden h-1 w-10 overflow-hidden rounded-full bg-stone-100 min-[360px]:block" aria-hidden>
                      <span className="block h-full rounded-full bg-bronze" style={{ width: `${part.value * 100}%` }} />
                    </span>
                    <span className="w-9 text-right tabular-nums">{Math.round(part.value * 100)}%</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-stone-200 font-medium">
              <th scope="row" colSpan={2} className="pt-2 text-left">
                {t('Match')}
              </th>
              <td className="pt-2 text-right tabular-nums">{score}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  )
}

/** Every table with its size and status, the keyboard- and screen-reader-friendly way to pick one. */
function TableList({
  tables,
  matches,
  party,
  current,
  onChoose,
}: {
  tables: Table[]
  matches: Match[]
  party: number
  current: number
  onChoose: (id: number) => void
}) {
  const { t } = useLang()
  const [all, setAll] = useState(false)
  const score = new Map(matches.map((m) => [m.table.id, m.score]))
  const rows = (all ? tables : matches.map((m) => m.table))
    .slice()
    .sort((a, b) => (score.get(b.id) ?? -1) - (score.get(a.id) ?? -1) || a.id - b.id)

  return (
    <section className="mt-7" aria-labelledby="table-list-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="table-list-title" className="label">
          {t('Tables')}
        </h3>
        <Segmented
          label={t('Which tables to show')}
          value={all ? 'all' : 'fit'}
          options={[
            { value: 'fit', label: t('Suitable ({n})', { n: matches.length }) },
            { value: 'all', label: t('All ({n})', { n: tables.length }) },
          ]}
          onChange={(v) => setAll(v === 'all')}
        />
      </div>
      <ul className="mt-2 space-y-1.5">
        {rows.map((table) => {
          const fits = score.has(table.id)
          const active = table.id === current
          const reason =
            table.status !== 'available' ? null : table.seats < party ? t('Too few seats') : null
          return (
            <li key={table.id}>
              <button
                type="button"
                disabled={!fits}
                aria-pressed={active}
                onClick={() => onChoose(table.id)}
                className={`flex min-h-[48px] w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3.5 py-2 text-left text-sm transition ${
                  active
                    ? 'border-ink bg-white ring-1 ring-ink'
                    : fits
                      ? 'border-stone-200 hover:border-stone-300'
                      : 'cursor-not-allowed border-stone-100 bg-stone-50'
                }`}
              >
                <span className="font-medium">{t('Table {n}', { n: table.id })}</span>
                <span className="text-stone-600">{t('Seats: {n}', { n: table.seats })}</span>
                <span className="text-stone-600">{t(table.zone)}</span>
                <span className="ml-auto flex items-center gap-2">
                  {reason && <span className="text-xs text-stone-600">{reason}</span>}
                  {fits ? (
                    <span className="font-medium tabular-nums">
                      {score.get(table.id)}%<span className="sr-only"> {t('match')}</span>
                    </span>
                  ) : (
                    <StatusPill status={table.status} />
                  )}
                  {active && <Check size={15} strokeWidth={2.5} aria-hidden />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Side panel of the seating step: the recommended table, why, and every alternative. */
export function TablePicker({
  matches,
  current,
  best,
  prefs,
  tables,
  around,
  occasions,
  peek,
  onPeek,
  onChoose,
  onBack,
  onNext,
}: {
  matches: Match[]
  current: Match
  best: Match
  prefs: Prefs
  tables: Table[]
  around: Table[]
  occasions: Record<number, Purpose>
  peek: number | null
  onPeek: (id: number | null) => void
  onChoose: (id: number) => void
  onBack: () => void
  onNext: () => void
}) {
  const { t } = useLang()
  const touch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches
  const gaps = compromises(prefs, current.table)

  return (
    <div className="flex h-full flex-col p-5 sm:p-7">
      <p className="mb-5 flex items-start gap-2 rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600 lg:hidden">
        <Hand size={14} strokeWidth={1.75} className="mt-px shrink-0" aria-hidden />
        <span>
          {sceneHint(t, touch, true)}. {t('You can also pick a table from the list below.')}
        </span>
      </p>

      <div key={current.table.id} className="animate-fade-up" aria-live="polite">
        <div className="label">{t(current.table.id === best.table.id ? 'Best match for your visit' : 'Your selection')}</div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h2 className="font-serif text-5xl leading-none">{t('Table {n}', { n: current.table.id })}</h2>
          <div className="text-right">
            <div className="text-2xl font-semibold tabular-nums text-bronze-deep">{current.score}%</div>
            <div className="text-xs text-stone-600">{t('match')}</div>
          </div>
        </div>

        {current.reasons.length > 0 && (
          <div className="mt-5">
            <h3 className="label">{t('Why this table')}</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {current.reasons.map((r) => (
                <li key={r} className="flex items-center gap-1 rounded-full bg-bronze-soft px-2.5 py-1 text-xs font-medium text-bronze-deep">
                  <Check size={11} strokeWidth={2.5} aria-hidden />
                  {t(r)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {gaps.length > 0 && (
          <div className="mt-4">
            <h3 className="label">{t('Worth knowing')}</h3>
            <ul className="mt-2 space-y-1 text-sm text-stone-600">
              {gaps.map((g) => (
                <li key={g} className="flex items-start gap-2">
                  <CircleAlert size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-bronze" aria-hidden />
                  {t(g)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <TableAttributes table={current.table} />
        </div>

        <div className="mt-4">
          <ScoreExplainer prefs={prefs} table={current.table} score={current.score} />
        </div>
      </div>

      <TableList tables={tables} matches={matches} party={prefs.party} current={current.table.id} onChoose={onChoose} />

      {around.length > 0 && (
        <div className="mt-7">
          <h3 className="label">{t('Tonight in the room')}</h3>
          <p className="mt-1 text-xs text-stone-600">{t('Show on the floor plan')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {around.map((x) => {
              const Icon = PURPOSE_ICON[occasions[x.id]]
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={peek === x.id}
                  onClick={() => onPeek(peek === x.id ? null : x.id)}
                  className={`flex min-h-[32px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    peek === x.id ? 'border-ink bg-ink text-white' : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <Icon size={12} strokeWidth={1.75} aria-hidden />
                  {t('Table {n}', { n: x.id })} · {t(PURPOSE_LABEL[occasions[x.id]])}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 mt-auto flex gap-2 bg-gradient-to-t from-white from-70% px-5 pb-5 pt-8 sm:-mx-7 sm:-mb-7 sm:px-7 sm:pb-7">
        <Button variant="secondary" size="lg" className="shrink-0 !px-4" onClick={onBack} aria-label={t('Back')}>
          <ArrowLeft size={16} strokeWidth={1.75} />
        </Button>
        <Button size="lg" full onClick={onNext}>
          {t('Review booking')}
          <ArrowRight size={16} strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  )
}
