import { lazy, Suspense, useEffect } from 'react'
import Guest from './guest/Guest'
import Menu from './guest/Menu'
import { useLang } from './lib/i18n'
import { useStore } from './lib/store'

// The staff area is a separate bundle: guests never download its screens.
const Staff = lazy(() => import('./staff/Staff'))

/**
 * Two guest entrances and one for staff:
 * the main site opens the booking flow, a table's QR code opens the menu for that table.
 */
export default function App() {
  const { route, qrTable } = useStore()
  const { lang, t } = useLang()
  // Screen readers and the browser's own translation need to know the page language.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return (
    <div key={`${route}-${qrTable}`} className="h-full animate-fade-in">
      {route === 'staff' ? (
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center gap-3 text-sm text-stone-600" role="status">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-ink" aria-hidden />
              {t('Loading…')}
            </div>
          }
        >
          <Staff />
        </Suspense>
      ) : route === 'table' && qrTable !== null ? (
        <Menu qrTable={qrTable} />
      ) : route === 'menu' ? (
        <Menu />
      ) : (
        <Guest />
      )}
    </div>
  )
}
