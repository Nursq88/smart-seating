import { CalendarCheck, QrCode } from 'lucide-react'
import { DemoBadge, DemoBanner } from '../components/Demo'
import { Button, LangSwitch, Logo } from '../components/ui'
import { DEMO_SOURCE } from '../lib/demoMenu'
import { useLang } from '../lib/i18n'
import { useItems } from '../lib/orders'
import { useStore } from '../lib/store'
import { OrderPanel } from './OrderPanel'

/**
 * The menu, ready to order from. Reached two ways:
 * - after booking on the main site, where the guest can still change the table or go back to booking;
 * - by scanning a table's QR code (`qrTable`), where the table is fixed and nothing else is offered.
 */
export default function Menu({ qrTable }: { qrTable?: number }) {
  const { t } = useLang()
  const { restaurantName, go, tables } = useStore()
  const qr = qrTable !== undefined
  const known = !qr || tables.some((x) => x.id === qrTable)
  // Credit the source only while the example menu is the one on show.
  const example = useItems().some((x) => x.id.startsWith('demo-'))

  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-stone-200 bg-milk/90 px-4 backdrop-blur sm:px-5">
        {qr ? (
          <Logo />
        ) : (
          <button onClick={() => go('guest')} aria-label={t('Book a table')} className="rounded-lg">
            <Logo />
          </button>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <DemoBadge />
          {qr ? (
            known && (
              <span className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-2.5 text-xs font-medium text-white">
                <QrCode size={13} strokeWidth={1.75} aria-hidden />
                {t('Table {n}', { n: qrTable })}
              </span>
            )
          ) : (
            <Button variant="ghost" className="h-8 px-2 text-xs sm:px-2.5" onClick={() => go('guest')} aria-label={t('Book a table')}>
              <CalendarCheck size={14} strokeWidth={1.75} />
              <span className="hidden min-[400px]:inline">{t('Book a table')}</span>
            </Button>
          )}
          <LangSwitch />
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pb-32 sm:px-6">
        <div className={`animate-fade-up text-center ${qr ? 'py-7' : 'py-10'}`}>
          <div className="label">{t('Our menu')}</div>
          <h1 className={`mt-3 font-serif tracking-tight ${qr ? 'text-5xl' : 'text-5xl sm:text-6xl'}`}>{restaurantName}</h1>
        </div>
        <DemoBanner className="mb-2" />
        <div className="animate-fade-up">
          {known ? (
            <OrderPanel lockedTable={qrTable} />
          ) : (
            <div className="card px-6 py-12 text-center" role="alert">
              <div className="font-medium">{t('This table code is not recognised')}</div>
              <p className="mt-1 text-sm text-stone-600">{t('Please ask your waiter for help.')}</p>
            </div>
          )}
        </div>
        <p className="mt-8 text-center text-xs text-stone-600">
          {t('Hackathon demo. Not an official restaurant website.')}
          {example && ` ${t('Dishes and prices: the restaurant’s public menu ({source}).', { source: DEMO_SOURCE })}`}
        </p>
      </div>
    </div>
  )
}
