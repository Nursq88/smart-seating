import { useId, type ReactNode } from 'react'
import { Check, Sparkles } from 'lucide-react'
import {
  BASE_STYLING,
  basePrice,
  DECOR_PRICES_ARE_DEMO,
  decorLines,
  decorTotal,
  EXTRAS,
  extraPrice,
  flowerPrice,
  FLOWERS,
  PALETTES,
  suggestions,
} from '../lib/decor'
import { useLang } from '../lib/i18n'
import { PURPOSE_LABEL } from '../lib/matching'
import { formatPrice } from '../lib/orders'
import type { Decor, Purpose } from '../lib/types'
import { Toggle } from '../components/ui'

function Chip({
  active,
  onClick,
  suggested,
  children,
}: {
  active: boolean
  onClick: () => void
  suggested?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? 'border-ink bg-ink text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-ink'
      }`}
    >
      {active ? (
        <Check size={13} strokeWidth={2.5} aria-hidden />
      ) : (
        suggested && <Sparkles size={13} strokeWidth={1.75} className="text-bronze" aria-hidden />
      )}
      {children}
    </button>
  )
}

function Price({ value, active }: { value: number; active: boolean }) {
  const { lang } = useLang()
  return <span className={`tabular-nums ${active ? 'text-white/80' : 'text-stone-500'}`}>+{formatPrice(value, lang)}</span>
}

/** Colours, flowers and extras for the guest's table, each with its price. Nothing paid is picked for the guest. */
export function DecorForm({
  enabled,
  onEnabled,
  decor,
  onChange,
  purpose,
}: {
  enabled: boolean
  onEnabled: (enabled: boolean) => void
  decor: Decor
  onChange: (decor: Decor) => void
  purpose: Purpose
}) {
  const { t, lang } = useLang()
  const titleId = useId()
  const set = (patch: Partial<Decor>) => onChange({ ...decor, ...patch })
  const custom = decor.palette === 'custom'
  const suggested = suggestions(purpose)

  return (
    <section className="card px-5 py-5 sm:px-6" aria-labelledby={titleId}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-[15px] font-semibold">
            {t('Table styling')}
          </h2>
          <p className="text-sm text-stone-600">{t('Optional, at extra cost. Nothing is added unless you choose it.')}</p>
        </div>
        <Toggle checked={enabled} onChange={onEnabled} labelledBy={titleId} />
      </div>

      {enabled && (
        <div className="mt-5 animate-fade-up space-y-5 border-t border-stone-100 pt-5">
          {DECOR_PRICES_ARE_DEMO && (
            <p className="rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600">
              {t('Demo prices: the restaurant has not published what styling costs. They only show how the total adds up.')}
            </p>
          )}

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <div className="label">{t('Colour palette')}</div>
              <div className="text-xs text-stone-600">
                {t(BASE_STYLING)} · <span className="tabular-nums">{formatPrice(basePrice(), lang)}</span>
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={decor.palette === p.id}
                  onClick={() => set({ palette: p.id, cloth: p.cloth, accent: p.accent, bloom: p.bloom })}
                  className={`flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    decor.palette === p.id ? 'border-ink ring-1 ring-ink' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="flex shrink-0 -space-x-1.5" aria-hidden>
                    {[p.cloth, p.accent, p.bloom].map((color, i) => (
                      <span key={i} className="h-5 w-5 rounded-full border border-black/10" style={{ background: color }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">{t(p.label)}</span>
                  {decor.palette === p.id && <Check size={14} strokeWidth={2.5} aria-hidden />}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={custom}
                onClick={() => set({ palette: 'custom' })}
                className={`min-h-[44px] rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  custom ? 'border-ink ring-1 ring-ink' : 'border-dashed border-stone-300 text-stone-600 hover:border-stone-400'
                }`}
              >
                {t('Custom colours')}
              </button>
            </div>
            {custom && (
              <div className="mt-3 flex animate-fade-up flex-wrap gap-4">
                {(
                  [
                    ['cloth', 'Tablecloth'],
                    ['accent', 'Accent'],
                    ['bloom', 'Flowers'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-stone-600">
                    <input
                      type="color"
                      value={decor[key]}
                      onChange={(e) => set({ [key]: e.target.value })}
                      className="h-9 w-9 cursor-pointer rounded-md border border-stone-200 bg-white p-0.5"
                    />
                    {t(label)}
                  </label>
                ))}
              </div>
            )}
          </div>

          {(suggested.flowers || suggested.extras.length > 0) && (
            <p className="flex items-start gap-2 text-sm text-stone-600">
              <Sparkles size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-bronze" aria-hidden />
              {t('Marked items suit the occasion “{p}”. Add them only if you want them.', { p: t(PURPOSE_LABEL[purpose]) })}
            </p>
          )}

          <fieldset>
            <legend className="label">{t('Flowers')}</legend>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {FLOWERS.map((f) => {
                const active = decor.flowers === f.id
                return (
                  <Chip key={f.id} active={active} suggested={suggested.flowers === f.id} onClick={() => set({ flowers: f.id })}>
                    {t(f.label)}
                    {f.id !== 'none' && <Price value={flowerPrice(f.id)} active={active} />}
                  </Chip>
                )
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">{t('Extras')}</legend>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {EXTRAS.map(([key, label]) => {
                const active = !!decor[key]
                return (
                  <Chip key={key} active={active} suggested={suggested.extras.includes(key)} onClick={() => set({ [key]: !decor[key] })}>
                    {t(label)}
                    <Price value={extraPrice(key)} active={active} />
                  </Chip>
                )
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="label">{t('Special wishes')}</span>
            <input
              className="input mt-2.5"
              placeholder={t('e.g. Happy Birthday sign')}
              value={decor.note ?? ''}
              onChange={(e) => set({ note: e.target.value })}
            />
            <span className="mt-1.5 block text-xs text-stone-600">{t('The restaurant would price special wishes separately.')}</span>
          </label>
        </div>
      )}
    </section>
  )
}

/** The chosen styling as a bill: one line per item and the total. */
export function DecorTotal({ decor, enabled }: { decor: Decor; enabled: boolean }) {
  const { t, lang } = useLang()
  if (!enabled)
    return <p className="text-sm text-stone-600">{t('No styling chosen, so nothing to pay for styling.')}</p>
  const lines = decorLines(decor)
  return (
    <div className="text-sm">
      <ul className="space-y-1">
        {lines.map((line) => (
          <li key={line.label} className="flex justify-between gap-3">
            <span className="text-stone-600">{t(line.label)}</span>
            <span className="shrink-0 tabular-nums">{formatPrice(line.price, lang)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-stone-200 pt-2">
        <span className="font-medium">
          {t('Styling total')}
          {DECOR_PRICES_ARE_DEMO && <span className="ml-1.5 text-xs font-normal text-bronze-deep">{t('demo prices')}</span>}
        </span>
        <span className="text-base font-semibold tabular-nums">{formatPrice(decorTotal(decor), lang)}</span>
      </div>
    </div>
  )
}
