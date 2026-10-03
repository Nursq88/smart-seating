import { lazy, Suspense } from 'react'
import Guest from './guest/Guest'
import Menu from './guest/Menu'
import { useStore } from './lib/store'

// The staff area is a separate bundle: guests never download its screens.
const Staff = lazy(() => import('./staff/Staff'))

/**
 * Two guest entrances and one for staff:
 * the main site opens the booking flow, a table's QR code opens the menu for that table.
 */
export default function App() {
  const { route, qrTable } = useStore()
  return (
    <div key={`${route}-${qrTable}`} className="h-full animate-fade-in">
      {route === 'staff' ? (
        <Suspense fallback={null}>
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
