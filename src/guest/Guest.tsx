import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Sparkles, UtensilsCrossed } from 'lucide-react'
import { DecorForm } from './Atmosphere'
import { TableAttributes } from '../components/TableInfo'
import { Button, LangSwitch, Logo, Segmented, Toggle } from '../components/ui'
import { defaultDecor, FLOWERS, isCelebration, paletteLabel } from '../lib/decor'
import { useLang } from '../lib/i18n'
import { PRESETS, PURPOSE_LABEL, rankTables } from '../lib/matching'
import { PURPOSE_ICON, PURPOSES } from '../lib/purposes'
import { useDecors, useOccasions, useStore } from '../lib/store'
import type { Decor, Level, Prefs, Purpose } from '../lib/types'
import { DecorPreview } from '../three/DecorPreview'
import { Legend, RestaurantScene } from '../three/RestaurantScene'

type Step = 1 | 2 | 3 | 4 | 'done'

const rank = (purpose: Purpose) => (purpose === 'birthday' ? 0 : purpose === 'romantic' ? 1 : 2)

const STEPS = ['Purpose', 'Preferences', 'Atmosphere', 'Seating']
const LEVELS: Level[] = [1, 2, 3]
const LEVEL_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' }

function Stepper({ step }: { step: Step }) {
  const { t } = useLang()
  const current = step === 'done' ? STEPS.length + 1 : step
  return (
    <ol className="hidden items-center gap-2.5 text-sm md:flex">
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'now' : 'next'
        return (
          <li key={label} className="flex items-center gap-2.5">
            {i > 0 && <span className="h-px w-6 bg-stone-200" />}
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                state === 'next' ? 'border border-stone-300 text-stone-400' : 'bg-ink text-white'
              }`}
            >
              {state === 'done' ? <Check size={12} strokeWidth={2.5} /> : n}
            </span>
            <span className={state === 'now' ? 'font-medium text-ink' : 'hidden text-stone-400 lg:inline'}>{t(label)}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default function Guest() {
  const { tables, addGuest, go, selectGuest, setGuestTable, restaurantName } = useStore()
  const { t } = useLang()
  const [step, setStep] = useState<Step>(1)
  const [purpose, setPurpose] = useState<Purpose | null>(null)
  const [prefs, setPrefs] = useState<Prefs>({ purpose: 'casual', party: 2, ...PRESETS.casual })
  const [name, setName] = useState('')
  const [allergy, setAllergy] = useState('')
  const [decorOn, setDecorOn] = useState(false)
  const [decor, setDecor] = useState<Decor>(defaultDecor('casual'))
  const [matching, setMatching] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState<{ tableId: number; score: number } | null>(null)

  /** A party can be as large as the biggest table in the restaurant. */
  const maxParty = Math.max(6, ...tables.map((x) => x.seats))

  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => setPrefs((p) => ({ ...p, [key]: value }))

  const matches = useMemo(() => rankTables(prefs, tables), [prefs, tables])
  const best = matches[0]
  const current = matches.find((m) => m.table.id === chosen) ?? best
  const labels = useMemo(
    () => Object.fromEntries(matches.slice(0, 3).map((m) => [m.table.id, `${m.score}%`])),
    [matches],
  )
  const shownTable = confirmed?.tableId ?? (matching ? undefined : current?.table.id)
  const decors = useDecors({ tableId: shownTable, decor: decorOn ? decor : undefined })
  const occasions = useOccasions()
  const [peek, setPeek] = useState<number | null>(null)
  // Taken tables with something going on, so the guest knows the mood of each corner.
  const around = tables
    .filter((x) => occasions[x.id] && occasions[x.id] !== 'casual' && x.id !== confirmed?.tableId)
    // Celebrations first: they change the mood of a corner the most.
    .sort((a, b) => rank(occasions[a.id]) - rank(occasions[b.id]) || a.id - b.id)
    .slice(0, 5)

  // Short pause so the recommendation reads as a result, not a page load.
  useEffect(() => {
    if (step !== 4) return
    setMatching(true)
    setChosen(null)
    const timer = setTimeout(() => setMatching(false), 1100)
    return () => clearTimeout(timer)
  }, [step])

  const pickPurpose = (id: Purpose) => {
    setPurpose(id)
    setPrefs((p) => ({ purpose: id, party: p.party, ...PRESETS[id] }))
    setDecor(defaultDecor(id))
    setDecorOn(isCelebration(id))
  }

  const confirm = () => {
    if (!current) return
    const now = new Date()
    const id = addGuest({
      name: name.trim() || t('Guest'),
      prefs,
      tableId: current.table.id,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      allergy: allergy.trim() || undefined,
      decor: decorOn ? { ...decor, note: decor.note?.trim() || undefined } : undefined,
    })
    selectGuest(id)
    setGuestTable(current.table.id)
    setConfirmed({ tableId: current.table.id, score: current.score })
    setStep('done')
  }

  const restart = () => {
    setStep(1)
    setPurpose(null)
    setConfirmed(null)
    setChosen(null)
    setName('')
    setAllergy('')
  }

  const findTable = () => {
    setMatching(true)
    setStep(4)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white/80 px-5 backdrop-blur">
        <button onClick={restart} aria-label={t('New booking')}>
          <Logo />
        </button>
        <Stepper step={step} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => go('menu')}>
            <UtensilsCrossed size={14} strokeWidth={1.75} />
            {t('Menu')}
          </Button>
          <LangSwitch />
        </div>
      </header>

      {step === 1 && (
        <main key="1" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl animate-fade-up px-6 py-14">
            <div className="label">
              {restaurantName} · {t('Step {n} of {total}', { n: 1, total: 4 })}
            </div>
            <h1 className="mt-2 font-serif text-5xl tracking-tight">{t('What brings you here?')}</h1>

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
              {PURPOSES.map((p) => {
                const active = purpose === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => pickPurpose(p.id)}
                    className={`group relative rounded-xl border bg-white p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-soft ${
                      active ? 'border-ink shadow-soft' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        active ? 'bg-ink text-white' : 'bg-stone-100 text-graphite'
                      }`}
                    >
                      <p.icon size={18} strokeWidth={1.6} />
                    </span>
                    <span className="mt-5 block text-[15px] font-semibold">{t(p.label)}</span>
                    <span className="mt-0.5 block text-sm text-stone-500">{t(p.hint)}</span>
                    {active && (
                      <span className="absolute right-4 top-4 flex h-5 w-5 animate-scale-in items-center justify-center rounded-full bg-ink text-white">
                        <Check size={12} strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-stone-500">{t('Party size')}</span>
                <div className="flex items-center rounded-lg border border-stone-200 bg-white">
                  <button
                    aria-label="Fewer guests"
                    className="p-2.5 text-stone-500 transition hover:text-ink disabled:text-stone-300"
                    disabled={prefs.party <= 1}
                    onClick={() => set('party', prefs.party - 1)}
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{prefs.party}</span>
                  <button
                    aria-label="More guests"
                    className="p-2.5 text-stone-500 transition hover:text-ink disabled:text-stone-300"
                    disabled={prefs.party >= maxParty}
                    onClick={() => set('party', prefs.party + 1)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <Button size="lg" disabled={!purpose} onClick={() => setStep(2)}>
                {t('Continue')}
                <ArrowRight size={16} strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        </main>
      )}

      {step === 2 && (
        <main key="2" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl animate-fade-up px-6 py-14">
            <div className="label">{t('Step {n} of {total}', { n: 2, total: 4 })}</div>
            <h1 className="mt-2 font-serif text-5xl tracking-tight">{t('How would you like to sit?')}</h1>
            <p className="mt-3 text-stone-500">{t('We started with what suits your occasion. Adjust anything.')}</p>

            <div className="card mt-8 divide-y divide-stone-100 px-6">
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
                    <div className="text-sm text-stone-500">{t(hint)}</div>
                  </div>
                  <Segmented
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
                <div key={key} className="flex items-center justify-between py-4">
                  <div className="text-sm font-medium">{t(label)}</div>
                  <Toggle checked={prefs[key]} onChange={(v) => set(key, v)} />
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-stone-500">{t('Your name')}</span>
                <input className="input" placeholder={t('Optional')} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-stone-500">{t('Allergies')}</span>
                <input className="input" placeholder={t('e.g. Nuts')} value={allergy} onChange={(e) => setAllergy(e.target.value)} />
              </label>
            </div>

            <div className="mt-8 flex items-center justify-between">
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
          <div className="mx-auto max-w-6xl animate-fade-up px-6 py-12">
            <div className="label">{t('Step {n} of {total}', { n: 3, total: 4 })}</div>
            <h1 className="mt-2 font-serif text-5xl tracking-tight">{t('Set the mood')}</h1>
            <p className="mt-3 text-stone-500">{t('Optional. Everything will be ready before you arrive.')}</p>

            <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1fr_420px]">
              <div className="space-y-5">
                <DecorForm enabled={decorOn} onEnabled={setDecorOn} decor={decor} onChange={setDecor} />
              </div>

              <div className="card overflow-hidden lg:sticky lg:top-0">
                <div className="relative h-[340px] bg-gradient-to-b from-white to-stone-100 lg:h-[420px]">
                  <DecorPreview decor={decorOn ? decor : undefined} occasion={decorOn ? prefs.purpose : undefined} seats={prefs.party} />
                  <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-stone-200 bg-white/90 px-3 py-1 text-xs text-stone-600 backdrop-blur">
                    {t('Approximate preview')}
                  </div>
                  <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-stone-400">{t('Drag to look around')}</div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-5 py-3.5 text-sm">
                  <span className="font-medium">{t(PURPOSE_LABEL[prefs.purpose])}</span>
                  <span className="truncate text-stone-500">
                    {decorOn
                      ? `${t(paletteLabel(decor))} · ${t(FLOWERS.find((f) => f.id === decor.flowers)!.label)}`
                      : t('Seats: {n}', { n: prefs.party })}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
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

      {(step === 4 || step === 'done') && (
        <main key="4" className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_380px] lg:overflow-hidden">
          <div className="relative h-[52vh] bg-gradient-to-b from-white to-stone-100 lg:h-auto">
            <RestaurantScene
              tables={tables}
              decors={decors}
              occasions={shownTable !== undefined ? { ...occasions, [shownTable]: prefs.purpose } : occasions}
              tone={(table) => {
                if (confirmed?.tableId === table.id) return 'recommended'
                if (table.status !== 'available') return table.status
                if (!confirmed && !matching && table.id === best?.table.id) return 'recommended'
                return confirmed || matching || table.seats >= prefs.party ? 'available' : 'muted'
              }}
              selectedId={shownTable}
              focusId={peek ?? shownTable}
              labels={confirmed || matching ? undefined : labels}
              onSelect={
                confirmed || matching
                  ? undefined
                  : (id) => {
                      setPeek(null)
                      if (id !== null && matches.some((m) => m.table.id === id)) setChosen(id)
                    }
              }
            >
              <Legend />
            </RestaurantScene>
          </div>

          <aside className="border-t border-stone-200 bg-white lg:overflow-y-auto lg:border-l lg:border-t-0">
            {matching ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-stone-200 border-t-ink" />
                <div>
                  <div className="font-medium">{t('Finding your table')}</div>
                  <div className="mt-1 text-sm text-stone-500">
                    {t('Comparing {n} tables with your preferences', { n: tables.length })}
                  </div>
                </div>
              </div>
            ) : confirmed ? (
              <div className="flex h-full animate-fade-up flex-col p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white">
                  <Check size={20} strokeWidth={2} />
                </span>
                <h2 className="mt-6 font-serif text-4xl leading-tight">{t('Table {n} is yours', { n: confirmed.tableId })}</h2>
                <p className="mt-3 text-stone-500">
                  {t('Your waiter already knows the occasion and your preferences. Nothing to explain when you arrive.')}
                </p>
                <div className="mt-6 space-y-2.5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3.5 text-sm">
                  <div>
                    <div className="font-medium">{t(PURPOSE_LABEL[prefs.purpose])}</div>
                    <div className="mt-0.5 text-stone-500">
                      {t('Guests: {n}', { n: prefs.party })} · {t('{n}% match', { n: confirmed.score })}
                      {allergy.trim() && ` · ${t('Allergy')}: ${allergy.trim()}`}
                    </div>
                  </div>
                  {decorOn && (
                    <div className="flex items-center gap-2 text-stone-600">
                      <Sparkles size={14} strokeWidth={1.6} className="shrink-0 text-bronze" />
                      {t(paletteLabel(decor))} · {t(FLOWERS.find((f) => f.id === decor.flowers)!.label)}
                    </div>
                  )}
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-8">
                  <Button size="lg" full onClick={() => go('menu')}>
                    <UtensilsCrossed size={16} strokeWidth={1.75} />
                    {t('Order from the menu')}
                  </Button>
                  <Button variant="ghost" full onClick={restart}>
                    {t('New booking')}
                  </Button>
                </div>
              </div>
            ) : !current ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center p-8 text-center">
                <div className="font-medium">{t('No free table for {n} right now', { n: prefs.party })}</div>
                <p className="mt-1 text-sm text-stone-500">{t('Try a smaller party or ask the host for the next opening.')}</p>
                <Button variant="secondary" className="mt-5" onClick={() => setStep(1)}>
                  {t('Change details')}
                </Button>
              </div>
            ) : (
              <div key={current.table.id} className="flex h-full animate-fade-up flex-col p-7">
                <div className="label">
                  {t(current.table.id === best.table.id ? 'Best match for your visit' : 'Your selection')}
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <h2 className="font-serif text-5xl leading-none">{t('Table {n}', { n: current.table.id })}</h2>
                  <div className="text-right">
                    <div className="text-2xl font-semibold tabular-nums text-bronze-deep">{current.score}%</div>
                    <div className="text-xs text-stone-400">{t('match')}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <TableAttributes table={current.table} />
                </div>

                {current.reasons.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {current.reasons.map((r) => (
                      <span key={r} className="rounded-full bg-bronze-soft px-2.5 py-1 text-xs font-medium text-bronze-deep">
                        {t(r)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-7">
                  <div className="label">{t('Top matches')}</div>
                  <div className="mt-2 space-y-1.5">
                    {matches.slice(0, 3).map((m) => {
                      const active = m.table.id === current.table.id
                      return (
                        <button
                          key={m.table.id}
                          onClick={() => {
                            setPeek(null)
                            setChosen(m.table.id)
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition ${
                            active ? 'border-ink bg-white' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <span className="shrink-0 font-medium">{t('Table {n}', { n: m.table.id })}</span>
                          <span className="min-w-0 truncate text-stone-400">{t(m.table.zone)}</span>
                          <span className="ml-auto h-1 w-12 shrink-0 overflow-hidden rounded-full bg-stone-100">
                            <span className="block h-full rounded-full bg-bronze" style={{ width: `${m.score}%` }} />
                          </span>
                          <span className="w-9 shrink-0 text-right font-medium tabular-nums">{m.score}%</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {around.length > 0 && (
                  <div className="mt-7">
                    <div className="label">{t('Tonight in the room')}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {around.map((x) => {
                        const Icon = PURPOSE_ICON[occasions[x.id]]
                        return (
                          <button
                            key={x.id}
                            onClick={() => setPeek(peek === x.id ? null : x.id)}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                              peek === x.id ? 'border-ink bg-ink text-white' : 'border-stone-200 text-stone-600 hover:border-stone-300'
                            }`}
                          >
                            <Icon size={12} strokeWidth={1.75} />
                            {t('Table {n}', { n: x.id })} · {t(PURPOSE_LABEL[occasions[x.id]])}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="sticky bottom-0 -mx-7 -mb-7 mt-auto flex gap-2 bg-gradient-to-t from-white from-70% px-7 pb-7 pt-8">
                  <Button variant="secondary" size="lg" onClick={() => setStep(3)} aria-label={t('Back')}>
                    <ArrowLeft size={16} strokeWidth={1.75} />
                  </Button>
                  <Button size="lg" full onClick={confirm}>
                    {t('Choose this table')}
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </main>
      )}
    </div>
  )
}
