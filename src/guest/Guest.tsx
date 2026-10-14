import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, UtensilsCrossed } from 'lucide-react'
import { DecorForm, DecorTotal } from './Atmosphere'
import { TablePicker } from './Recommendation'
import { BookingDone, BookingReview, type Draft } from './Review'
import { VisitFields, VisitSummary } from './VisitForm'
import { DemoBadge, DemoBanner } from '../components/Demo'
import { Button, LangSwitch, Logo, Segmented, Toggle } from '../components/ui'
import { DEMO_MODE } from '../lib/demo'
import { FLOWERS, paletteLabel, startDecor } from '../lib/decor'
import { useLang } from '../lib/i18n'
import { PRESETS, PURPOSE_LABEL, rankTables } from '../lib/matching'
import { PURPOSES } from '../lib/purposes'
import { useDecors, useOccasions, useStore } from '../lib/store'
import type { Decor, Level, Prefs, Purpose } from '../lib/types'
import { defaultVisit, visitError, type Visit } from '../lib/visit'
import { DecorPreview } from '../three/DecorPreview'
import { Legend, RestaurantScene } from '../three/RestaurantScene'

type Step = 1 | 2 | 3 | 4 | 5 | 'done'

const rank = (purpose: Purpose) => (purpose === 'birthday' ? 0 : purpose === 'romantic' ? 1 : 2)

const STEPS = ['Visit', 'Preferences', 'Atmosphere', 'Seating', 'Confirmation']
const LEVELS: Level[] = [1, 2, 3]
const LEVEL_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' }

function Stepper({ step }: { step: Step }) {
  const { t } = useLang()
  const current = step === 'done' ? STEPS.length + 1 : step
  return (
    <ol className="hidden items-center gap-2.5 text-sm md:flex" aria-label={t('Booking steps')}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'now' : 'next'
        return (
          <li key={label} className="flex items-center gap-2.5" aria-current={state === 'now' ? 'step' : undefined}>
            {i > 0 && <span className="h-px w-5 bg-stone-200" aria-hidden />}
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                state === 'next' ? 'border border-stone-300 text-stone-500' : 'bg-ink text-white'
              }`}
              aria-hidden
            >
              {state === 'done' ? <Check size={12} strokeWidth={2.5} /> : n}
            </span>
            <span className={state === 'now' ? 'font-medium text-ink' : 'sr-only text-stone-500 xl:not-sr-only'}>{t(label)}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** Thin progress line for phones, where the full stepper does not fit. */
function MobileProgress({ step }: { step: Step }) {
  const { t } = useLang()
  if (step === 'done') return null
  return (
    <div className="shrink-0 border-b border-stone-200 bg-white px-5 py-2 md:hidden">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{t(STEPS[step - 1])}</span>
        <span className="text-stone-600">{t('Step {n} of {total}', { n: step, total: STEPS.length })}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100" aria-hidden>
        <div className="h-full rounded-full bg-ink transition-all duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }} />
      </div>
    </div>
  )
}

export default function Guest() {
  const { tables, addGuest, go, selectGuest, setGuestTable, restaurantName } = useStore()
  const { t } = useLang()
  const [step, setStep] = useState<Step>(1)
  /** Step the guest left to change the visit details, to return to it afterwards */
  const [editFrom, setEditFrom] = useState<Step | null>(null)
  const [visit, setVisit] = useState<Visit>(defaultVisit)
  const [purpose, setPurpose] = useState<Purpose | null>(null)
  const [prefs, setPrefs] = useState<Prefs>({ purpose: 'casual', party: 2, ...PRESETS.casual })
  const [name, setName] = useState('')
  const [allergy, setAllergy] = useState('')
  const [decorOn, setDecorOn] = useState(false)
  const [decor, setDecor] = useState<Decor>(startDecor('casual'))
  const [search, setSearch] = useState(0)
  const [matching, setMatching] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState<Draft | null>(null)

  /** A party can be as large as the biggest table in the restaurant. */
  const maxParty = Math.max(6, ...tables.map((x) => x.seats))
  const visitProblem = visitError(visit)

  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => setPrefs((p) => ({ ...p, [key]: value }))

  const matches = useMemo(() => rankTables(prefs, tables), [prefs, tables])
  const best = matches[0]
  const current = matches.find((m) => m.table.id === chosen) ?? best
  const labels = useMemo(
    () => Object.fromEntries(matches.slice(0, 3).map((m) => [m.table.id, `${m.score}%`])),
    [matches],
  )
  const choosing = step === 4 && !matching
  const shownTable = confirmed?.table.id ?? (matching ? undefined : current?.table.id)
  const decors = useDecors({ tableId: shownTable, decor: decorOn ? decor : undefined })
  const occasions = useOccasions()
  const [peek, setPeek] = useState<number | null>(null)
  // Taken tables with something going on, so the guest knows the mood of each corner.
  const around = tables
    .filter((x) => occasions[x.id] && occasions[x.id] !== 'casual' && x.id !== confirmed?.table.id)
    // Celebrations first: they change the mood of a corner the most.
    .sort((a, b) => rank(occasions[a.id]) - rank(occasions[b.id]) || a.id - b.id)
    .slice(0, 5)
  // The guest's own table shows only what they ordered: without styling, no occasion props that look included.
  const sceneOccasions = { ...occasions }
  if (shownTable !== undefined) {
    if (decorOn) sceneOccasions[shownTable] = prefs.purpose
    else delete sceneOccasions[shownTable]
  }
  const largestFree = Math.max(0, ...tables.filter((x) => x.status === 'available').map((x) => x.seats))

  // Short pause so the recommendation reads as a result, not a page load.
  useEffect(() => {
    if (!search) return
    setMatching(true)
    setChosen(null)
    setPeek(null)
    const timer = setTimeout(() => setMatching(false), 900)
    return () => clearTimeout(timer)
  }, [search])

  const pickPurpose = (id: Purpose) => {
    setPurpose(id)
    setPrefs((p) => ({ purpose: id, party: p.party, ...PRESETS[id] }))
    // The occasion's colours, but nothing paid until the guest picks it.
    setDecor(startDecor(id))
  }

  const findTable = () => {
    setSearch((n) => n + 1)
    setStep(4)
  }

  const editVisit = () => {
    setEditFrom(step)
    setStep(1)
  }

  const leaveVisit = () => {
    const back = editFrom
    setEditFrom(null)
    if (back === 4 || back === 5) findTable()
    else setStep(back ?? 2)
  }

  const draft: Draft | null = current
    ? {
        table: current.table,
        score: current.score,
        prefs,
        visit,
        name,
        allergy,
        decor: decorOn ? { ...decor, note: decor.note?.trim() || undefined } : undefined,
      }
    : null

  const confirm = () => {
    if (!draft) return
    const id = addGuest({
      name: name.trim() || t('Guest'),
      prefs,
      tableId: draft.table.id,
      time: visit.time,
      date: visit.date,
      duration: visit.duration,
      allergy: allergy.trim() || undefined,
      decor: draft.decor,
    })
    selectGuest(id)
    setGuestTable(draft.table.id)
    setConfirmed(draft)
    setStep('done')
  }

  const restart = () => {
    setStep(1)
    setEditFrom(null)
    setPurpose(null)
    setConfirmed(null)
    setChosen(null)
    setDecorOn(false)
    setName('')
    setAllergy('')
    setVisit(defaultVisit())
  }

  const summary = purpose && <VisitSummary visit={visit} party={prefs.party} purpose={prefs.purpose} onEdit={editVisit} />

  return (
    <div className="flex h-full flex-col">
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-stone-200 bg-white/80 px-4 backdrop-blur sm:px-5">
        <button onClick={restart} aria-label={t('New booking')} className="rounded-lg">
          <Logo />
        </button>
        <Stepper step={step} />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <DemoBadge />
          <Button variant="ghost" className="h-8 px-2 text-xs sm:px-2.5" onClick={() => go('menu')} aria-label={t('Menu')}>
            <UtensilsCrossed size={14} strokeWidth={1.75} />
            <span className="hidden min-[400px]:inline">{t('Menu')}</span>
          </Button>
          <LangSwitch />
        </div>
      </header>
      <MobileProgress step={step} />

      {step === 1 && (
        <main key="1" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl animate-fade-up px-4 py-8 sm:px-6 sm:py-12">
            <DemoBanner className="mb-8" />
            <div className="label">
              {restaurantName} · {t('Step {n} of {total}', { n: 1, total: STEPS.length })}
            </div>
            <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">{t('What brings you here?')}</h1>

            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3" role="group" aria-label={t('Purpose')}>
              {PURPOSES.map((p) => {
                const active = purpose === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pickPurpose(p.id)}
                    className={`group relative rounded-xl border bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-soft sm:p-5 ${
                      active ? 'border-ink shadow-soft ring-1 ring-ink' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        active ? 'bg-ink text-white' : 'bg-stone-100 text-graphite'
                      }`}
                      aria-hidden
                    >
                      <p.icon size={18} strokeWidth={1.6} />
                    </span>
                    <span className="mt-4 block text-[15px] font-semibold leading-snug sm:mt-5">{t(p.label)}</span>
                    <span className="mt-0.5 block text-sm text-stone-600">{t(p.hint)}</span>
                    {active && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 animate-scale-in items-center justify-center rounded-full bg-ink text-white sm:right-4 sm:top-4" aria-hidden>
                        <Check size={12} strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-6">
              <VisitFields
                visit={visit}
                onChange={setVisit}
                party={prefs.party}
                onParty={(n) => set('party', n)}
                maxParty={maxParty}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-stone-200 pt-6">
              {!purpose && <span className="text-sm text-stone-600">{t('Choose the purpose of your visit to continue')}</span>}
              <Button size="lg" disabled={!purpose || !!visitProblem} onClick={leaveVisit}>
                {t(editFrom ? 'Apply changes' : 'Continue')}
                <ArrowRight size={16} strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        </main>
      )}

      {step === 2 && (
        <main key="2" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl animate-fade-up px-4 py-8 sm:px-6 sm:py-12">
            {summary}
            <div className="label mt-8">{t('Step {n} of {total}', { n: 2, total: STEPS.length })}</div>
            <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">{t('How would you like to sit?')}</h1>
            <p className="mt-3 text-stone-600">{t('We started with what suits your occasion. Adjust anything.')}</p>

            <div className="card mt-8 divide-y divide-stone-100 px-5 sm:px-6">
              {(
                [
                  ['privacy', 'Privacy', 'How secluded the table feels'],
                  ['quiet', 'Quietness', 'How calm the surroundings are'],
                  ['spacing', 'Distance from other tables', 'Space between you and neighbours'],
                ] as const
              ).map(([key, label, hint]) => (
                <div key={key} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <div className="text-sm font-medium">{t(label)}</div>
                    <div className="text-sm text-stone-600">{t(hint)}</div>
                  </div>
                  <Segmented
                    label={t(label)}
                    value={prefs[key]}
                    options={LEVELS.map((value) => ({ value, label: t(LEVEL_LABEL[value]) }))}
                    onChange={(v) => set(key, v)}
                  />
                </div>
              ))}
              {(
                [
                  ['window', 'By the window'],
                  ['nearEntrance', 'Near entrance'],
                  ['nearBar', 'Near bar'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3 py-4">
                  <div id={`pref-${key}`} className="text-sm font-medium">
                    {t(label)}
                  </div>
                  <Toggle checked={prefs[key]} onChange={(v) => set(key, v)} labelledBy={`pref-${key}`} />
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-stone-600">{t('Your name')}</span>
                <input className="input" autoComplete="given-name" placeholder={t('Optional')} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-stone-600">{t('Allergies')}</span>
                <input className="input" placeholder={t('e.g. Nuts')} value={allergy} onChange={(e) => setAllergy(e.target.value)} />
              </label>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={16} strokeWidth={1.75} />
                {t('Back')}
              </Button>
              <Button size="lg" onClick={() => setStep(3)}>
                {t('Continue')}
                <ArrowRight size={16} strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        </main>
      )}

      {step === 3 && (
        <main key="3" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl animate-fade-up px-4 py-8 sm:px-6 sm:py-12">
            {summary}
            <div className="label mt-8">{t('Step {n} of {total}', { n: 3, total: STEPS.length })}</div>
            <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">{t('Set the mood')}</h1>
            <p className="mt-3 text-stone-600">{t('Optional. You can skip this step.')}</p>

            <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1fr_420px]">
              <DecorForm enabled={decorOn} onEnabled={setDecorOn} decor={decor} onChange={setDecor} purpose={prefs.purpose} />

              <div className="space-y-5 lg:sticky lg:top-0">
                <figure className="card overflow-hidden">
                  <div className="relative h-[300px] bg-gradient-to-b from-white to-stone-100 sm:h-[340px] lg:h-[400px]">
                    <DecorPreview decor={decorOn ? decor : undefined} occasion={decorOn ? prefs.purpose : undefined} seats={prefs.party} />
                    <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-stone-200 bg-white/95 px-3 py-1 text-xs font-medium text-stone-600 backdrop-blur">
                      {t('Approximate preview')}
                    </div>
                    <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs text-stone-600">
                      {t('Drag to look around')}
                    </div>
                  </div>
                  <figcaption className="border-t border-stone-200 px-5 py-3.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{t(PURPOSE_LABEL[prefs.purpose])}</span>
                      <span className="min-w-0 truncate text-stone-600">
                        {decorOn
                          ? `${t(paletteLabel(decor))} · ${t(FLOWERS.find((f) => f.id === decor.flowers)!.label)}`
                          : t('Seats: {n}', { n: prefs.party })}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-stone-600">
                      {t(
                        'The 3D view is only a guide: real colours, flowers, tableware and placement will differ. What counts is the list of items below, once the restaurant confirms it.',
                      )}
                    </p>
                  </figcaption>
                </figure>

                <section className="card px-5 py-4" aria-label={t('Styling total')}>
                  <h2 className="label">{t('What you pay for')}</h2>
                  <div className="mt-2.5">
                    <DecorTotal decor={decor} enabled={decorOn} />
                  </div>
                  {DEMO_MODE && decorOn && (
                    <p className="mt-3 text-xs text-stone-600">{t('In the demo nothing is ordered or charged.')}</p>
                  )}
                </section>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft size={16} strokeWidth={1.75} />
                {t('Back')}
              </Button>
              <Button size="lg" onClick={findTable}>
                {t('Find my table')}
                <ArrowRight size={16} strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        </main>
      )}

      {(step === 4 || step === 5 || step === 'done') && (
        <main key="4" className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_400px] lg:overflow-hidden">
          <div className="relative h-[48vh] min-h-[300px] bg-gradient-to-b from-white to-stone-100 lg:h-auto">
            <RestaurantScene
              tables={tables}
              decors={decors}
              occasions={sceneOccasions}
              tone={(table) => {
                if (table.id === shownTable && step !== 4) return 'recommended'
                if (table.status !== 'available') return table.status
                if (choosing && table.id === best?.table.id) return 'recommended'
                return !choosing || table.seats >= prefs.party ? 'available' : 'muted'
              }}
              selectedId={shownTable}
              focusId={peek ?? shownTable}
              labels={choosing ? labels : undefined}
              onSelect={
                choosing
                  ? (id) => {
                      setPeek(null)
                      if (id !== null && matches.some((m) => m.table.id === id)) setChosen(id)
                    }
                  : undefined
              }
            >
              <Legend />
            </RestaurantScene>
          </div>

          <aside className="border-t border-stone-200 bg-white lg:overflow-y-auto lg:border-l lg:border-t-0">
            {step === 'done' && confirmed ? (
              <BookingDone draft={confirmed} onMenu={() => go('menu')} onRestart={restart} />
            ) : matching ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center" role="status">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-stone-200 border-t-ink" aria-hidden />
                <div>
                  <div className="font-medium">{t('Finding your table')}</div>
                  <div className="mt-1 text-sm text-stone-600">
                    {t('Comparing {n} tables with your preferences', { n: tables.length })}
                  </div>
                </div>
              </div>
            ) : !current || !best || !draft ? (
              <div className="flex h-full min-h-[280px] flex-col justify-center p-6 text-center sm:p-8" role="status">
                <div className="font-medium">{t('No free table for {n} right now', { n: prefs.party })}</div>
                <p className="mt-1 text-sm text-stone-600">
                  {largestFree > 0
                    ? t('The largest free table seats: {n}.', { n: largestFree })
                    : t('Every table is taken at the moment.')}{' '}
                  {t('Try a smaller party or ask the host for the next opening.')}
                </p>
                {DEMO_MODE && (
                  <p className="mt-3 text-xs text-stone-600">{t('In the demo, occupancy is a fixed example and does not change with the time you pick.')}</p>
                )}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button variant="secondary" onClick={editVisit}>
                    {t('Change party size')}
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    {t('Back to preferences')}
                  </Button>
                </div>
              </div>
            ) : step === 5 ? (
              <BookingReview draft={draft} onBack={() => setStep(4)} onConfirm={confirm} />
            ) : (
              <>
                <div className="px-5 pt-5 sm:px-7 sm:pt-7">{summary}</div>
                <TablePicker
                  matches={matches}
                  current={current}
                  best={best}
                  prefs={prefs}
                  tables={tables}
                  around={around}
                  occasions={occasions}
                  peek={peek}
                  onPeek={setPeek}
                  onChoose={(id) => {
                    setPeek(null)
                    setChosen(id)
                  }}
                  onBack={() => setStep(3)}
                  onNext={() => setStep(5)}
                />
              </>
            )}
          </aside>
        </main>
      )}
    </div>
  )
}
