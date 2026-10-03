import { AlertTriangle, Check, Sparkles } from 'lucide-react'
import { Button, Row } from '../components/ui'
import { EXTRAS, FLOWERS, paletteLabel } from '../lib/decor'
import { useLang } from '../lib/i18n'
import { LEVEL, PURPOSE_LABEL, SPACING, unmet } from '../lib/matching'
import type { Guest, GuestStatus, Match, Table } from '../lib/types'

export const GUEST_STATUS: Record<GuestStatus, string> = { waiting: 'Arriving', reserved: 'Reserved', seated: 'Seated' }

function preferences(guest: Guest) {
  const p = guest.prefs
  const extras = [p.window && 'By the window', p.nearEntrance && 'Near entrance', p.nearBar && 'Near bar'].filter(
    (x): x is string => !!x,
  )
  return { p, extras }
}

export function GuestBrief({
  guest,
  table,
  score,
  matches,
  onPick,
  onSeat,
}: {
  guest: Guest
  table: Table | undefined
  score: number | null
  matches: Match[]
  onPick: (id: number) => void
  onSeat: () => void
}) {
  const { t } = useLang()
  const { p, extras } = preferences(guest)
  const { decor } = guest
  const decorItems = decor
    ? [
        t(paletteLabel(decor)),
        t(FLOWERS.find((f) => f.id === decor.flowers)!.label),
        ...EXTRAS.filter(([key]) => decor[key]).map(([, label]) => t(label)),
      ]
    : []
  const seated = guest.status === 'seated'
  const gaps = table ? unmet(guest.prefs, table) : []

  return (
    <div key={guest.id} className="flex h-full animate-fade-up flex-col">
      <div className="label">{t('Guest #{n}', { n: guest.id })}</div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-4xl leading-tight">{guest.name}</h2>
        <span className="text-sm text-stone-400">
          {t('Guests: {n}', { n: p.party })} · {guest.time}
        </span>
      </div>

      <section className="mt-6">
        <div className="label">{t('Purpose')}</div>
        <div className="mt-1.5 text-[15px] font-medium">{t(PURPOSE_LABEL[p.purpose])}</div>
      </section>

      <section className="mt-5">
        <div className="label">{t('Preferences')}</div>
        <div className="mt-1 divide-y divide-stone-100">
          <Row label={t('Privacy')}>{t(LEVEL[p.privacy])}</Row>
          <Row label={t('Noise')}>{t(LEVEL[(4 - p.quiet) as 1 | 2 | 3])}</Row>
          <Row label={t('Distance')}>{t(SPACING[p.spacing])}</Row>
          {extras.map((x) => (
            <Row key={x} label={t(x)}>
              {t('Preferred')}
            </Row>
          ))}
        </div>
      </section>

      {(guest.allergy || guest.note) && (
        <section className="mt-5">
          <div className="label">{t('Important')}</div>
          <div className="mt-2 space-y-1.5 rounded-lg border border-bronze/25 bg-bronze-soft px-3.5 py-3 text-sm text-bronze-deep">
            {guest.allergy && (
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle size={15} strokeWidth={1.75} />
                {t('Allergy')}: {t(guest.allergy)}
              </div>
            )}
            {guest.note && <div>{t(guest.note)}</div>}
          </div>
        </section>
      )}

      {decor && (
        <section className="mt-5">
          <div className="label">{t('Atmosphere')}</div>
          <div className="mt-2 space-y-3 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm">
            {decor && (
              <div className="flex gap-2.5">
                <Sparkles size={15} strokeWidth={1.6} className="mt-0.5 shrink-0 text-bronze" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">
                    {t('Table styling')}
                    <span className="flex -space-x-1">
                      {[decor.cloth, decor.accent, decor.bloom].map((color, i) => (
                        <span key={i} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: color }} />
                      ))}
                    </span>
                  </div>
                  <div className="text-stone-500">{decorItems.join(' · ')}</div>
                  {decor.note && <div className="text-stone-500">“{t(decor.note)}”</div>}
                  {!seated && <div className="mt-0.5 text-xs text-bronze-deep">{t('Prepare before arrival')}</div>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-5">
        <div className="label">{t(seated ? 'Seated at' : 'Recommended')}</div>
        {table ? (
          <>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-[15px] font-medium">
                {t('Table {n}', { n: table.id })} <span className="font-normal text-stone-400">· {t(table.zone)}</span>
              </span>
              {score !== null && <span className="text-sm font-semibold tabular-nums text-bronze-deep">{t('{n}% match', { n: score })}</span>}
            </div>
            {gaps.length > 0 && (
              <div className="mt-1 text-sm text-stone-500">{t('Not fully met')}: {gaps.map((x) => t(x)).join(', ').toLowerCase()}</div>
            )}
          </>
        ) : (
          <div className="mt-1.5 text-sm text-stone-500">{t('No free table fits this party yet.')}</div>
        )}
        {!seated && matches.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {matches.slice(0, 3).map((m) => (
              <button
                key={m.table.id}
                onClick={() => onPick(m.table.id)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  m.table.id === table?.id
                    ? 'border-ink bg-ink text-white'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {t('Table {n}', { n: m.table.id })} · {m.score}%
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="mt-auto pt-8">
        {seated ? (
          <div className="flex animate-scale-in items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 py-3 text-sm font-medium">
            <Check size={16} strokeWidth={2} />
            {t('Seated at Table {n}', { n: guest.tableId ?? '' })}
          </div>
        ) : (
          <Button size="lg" full disabled={!table} onClick={onSeat}>
            {t('Seat Guest')}
          </Button>
        )}
      </div>
    </div>
  )
}
