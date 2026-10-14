import { Info } from 'lucide-react'
import { DEMO_MODE } from '../lib/demo'
import { useLang } from '../lib/i18n'

/** Small header mark that stays on every guest screen while the site runs as a demo. */
export function DemoBadge() {
  const { t } = useLang()
  if (!DEMO_MODE) return null
  return (
    <span
      title={t('Demo mode: nothing is sent to the restaurant')}
      className="flex h-8 shrink-0 items-center rounded-lg border border-bronze/40 bg-bronze-soft px-2 text-xs font-semibold text-bronze-deep"
    >
      {t('Demo')}
    </span>
  )
}

/** The plain-words warning a visitor reads before anything else. */
export function DemoBanner({ className = '' }: { className?: string }) {
  const { t } = useLang()
  if (!DEMO_MODE) return null
  return (
    <aside
      aria-label={t('Demo mode')}
      className={`flex gap-3 rounded-xl border border-bronze/30 bg-bronze-soft/70 px-4 py-3.5 text-sm text-ink ${className}`}
    >
      <Info size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-bronze-deep" aria-hidden />
      <div>
        <div className="font-semibold">{t('Demo mode')}</div>
        <p className="mt-0.5 text-graphite">
          {t(
            'This site is not connected to the restaurant’s booking system. Tables, occupancy and decor prices are examples; no booking or order reaches the restaurant.',
          )}
        </p>
      </div>
    </aside>
  )
}
