import type { ReactNode } from 'react'
import { EXTRAS, FLOWERS, PALETTES } from '../lib/decor'
import { useLang } from '../lib/i18n'
import type { Decor } from '../lib/types'
import { Toggle } from '../components/ui'

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? 'border-ink bg-ink text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

/** Colours, flowers and extras for the guest's table. */
export function DecorForm({
  enabled,
  onEnabled,
  decor,
  onChange,
}: {
  enabled: boolean
  onEnabled: (enabled: boolean) => void
  decor: Decor
  onChange: (decor: Decor) => void
}) {
  const { t } = useLang()
  const set = (patch: Partial<Decor>) => onChange({ ...decor, ...patch })
  const custom = decor.palette === 'custom'

  return (
    <section className="card px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold">{t('Table styling')}</h2>
          <p className="text-sm text-stone-500">{t('Decorate my table')}</p>
        </div>
        <Toggle checked={enabled} onChange={onEnabled} />
      </div>

      {enabled && (
        <div className="mt-5 animate-fade-up space-y-5 border-t border-stone-100 pt-5">
          <div>
            <div className="label">{t('Colour palette')}</div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set({ palette: p.id, cloth: p.cloth, accent: p.accent, bloom: p.bloom })}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    decor.palette === p.id ? 'border-ink' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="flex shrink-0 -space-x-1.5">
                    {[p.cloth, p.accent, p.bloom].map((color, i) => (
                      <span key={i} className="h-5 w-5 rounded-full border border-black/10" style={{ background: color }} />
                    ))}
                  </span>
                  <span className="min-w-0 truncate">{t(p.label)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => set({ palette: 'custom' })}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  custom ? 'border-ink' : 'border-dashed border-stone-300 text-stone-600 hover:border-stone-400'
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
                      className="h-8 w-8 cursor-pointer rounded-md border border-stone-200 bg-white p-0.5"
                    />
                    {t(label)}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="label">{t('Flowers')}</div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {FLOWERS.map((f) => (
                <Chip key={f.id} active={decor.flowers === f.id} onClick={() => set({ flowers: f.id })}>
                  {t(f.label)}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <div className="label">{t('Extras')}</div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {EXTRAS.map(([key, label]) => (
                <Chip key={key} active={!!decor[key]} onClick={() => set({ [key]: !decor[key] })}>
                  {t(label)}
                </Chip>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="label">{t('Special wishes')}</span>
            <input
              className="input mt-2.5"
              placeholder={t('e.g. Happy Birthday sign')}
              value={decor.note ?? ''}
              onChange={(e) => set({ note: e.target.value })}
            />
          </label>
        </div>
      )}
    </section>
  )
}
