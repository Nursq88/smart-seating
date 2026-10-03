import { CalendarCheck, QrCode } from 'lucide-react'
import { Button, LangSwitch, Logo } from '../components/ui'
import { useLang } from '../lib/i18n'
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

  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200 bg-milk/85 px-5 backdrop-blur">
        {qr ? (
          <Logo />
        ) : (
          <button onClick={() => go('guest')} aria-label={t('Book a table')}>
            <Logo />
          </button>
        )}
        <div className="flex items-center gap-2">
          {qr ? (
            known && (
              <span className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-medium text-white">
                <QrCode size={13} strokeWidth={1.75} />
                {t('Table {n}', { n: qrTable })}
              </span>
            )
          ) : (
            <Button variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => go('guest')}>
              <CalendarCheck size={14} strokeWidth={1.75} />
              {t('Book a table')}
            </Button>
          )}
          <LangSwitch />
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 pb-20">
        <div className={`animate-fade-up text-center ${qr ? 'py-8' : 'py-12'}`}>
          <div className="label">{t('Our menu')}</div>
          <h1 className={`mt-3 font-serif tracking-tight ${qr ? 'text-5xl' : 'text-6xl'}`}>{restaurantName}</h1>
        </div>
        <div className="animate-fade-up">
          {known ? (
            <OrderPanel lockedTable={qrTable} />
          ) : (
            <div className="card px-6 py-12 text-center">
              <div className="font-medium">{t('This table code is not recognised')}</div>
              <p className="mt-1 text-sm text-stone-500">{t('Please ask your waiter for help.')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
