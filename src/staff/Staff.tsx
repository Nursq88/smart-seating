import { useEffect, useState } from 'react'
import { Delete, Lock } from 'lucide-react'
import { Button, LangSwitch, Logo } from '../components/ui'
import { lockSeconds, lockStaff, unlockStaff, useStaffSession } from '../lib/auth'
import { useLang } from '../lib/i18n'
import { useOrders } from '../lib/orders'
import { Floor } from './Floor'
import { GuestsTab } from './GuestsTab'
import { ItemsEditor } from './ItemsEditor'
import { MenuUpload } from './MenuUpload'
import { OrdersBoard } from './OrdersBoard'
import { SettingsTab } from './SettingsTab'

const PIN_LENGTH = 4

/** PIN pad shown instead of the panel until a member of staff signs in. */
function StaffLogin() {
  const { t } = useLang()
  const [pin, setPin] = useState('')
  const [wrong, setWrong] = useState(false)
  const [wait, setWait] = useState(lockSeconds())

  useEffect(() => {
    if (wait <= 0) return
    const timer = setInterval(() => setWait(lockSeconds()), 500)
    return () => clearInterval(timer)
  }, [wait])

  const press = (digit: string) => {
    if (wait > 0 || pin.length >= PIN_LENGTH) return
    const next = pin + digit
    setWrong(false)
    setPin(next)
    if (next.length < PIN_LENGTH) return
    if (!unlockStaff(next)) {
      setWrong(true)
      setWait(lockSeconds())
      setTimeout(() => setPin(''), 350)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      if (e.key === 'Backspace') setPin((p) => p.slice(0, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <Logo />
        <LangSwitch />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[280px] animate-fade-up text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white">
            <Lock size={18} strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 font-serif text-4xl">{t('Staff')}</h1>
          <p className="mt-1.5 h-5 text-sm text-stone-500">
            {wait > 0 ? t('Too many attempts. Try again in {n} s.', { n: wait }) : wrong ? t('Wrong PIN') : t('Enter your PIN')}
          </p>

          <div className={`mt-6 flex justify-center gap-3 ${wrong ? 'animate-[shake_0.3s]' : ''}`}>
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full border transition-colors ${
                  i < pin.length ? (wrong ? 'border-bronze bg-bronze' : 'border-ink bg-ink') : 'border-stone-300'
                }`}
              />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                disabled={wait > 0}
                onClick={() => press(d)}
                className="h-16 rounded-xl border border-stone-200 bg-white text-xl font-medium transition hover:border-stone-300 hover:bg-stone-50 active:scale-95 disabled:opacity-40"
              >
                {d}
              </button>
            ))}
            <span />
            <button
              disabled={wait > 0}
              onClick={() => press('0')}
              className="h-16 rounded-xl border border-stone-200 bg-white text-xl font-medium transition hover:border-stone-300 hover:bg-stone-50 active:scale-95 disabled:opacity-40"
            >
              0
            </button>
            <button
              aria-label={t('Delete')}
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="flex h-16 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-ink"
            >
              <Delete size={20} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

type Tab = 'floor' | 'orders' | 'guests' | 'menu' | 'settings'

/** The staff area: one working panel for waiters and managers, behind the PIN. */
export default function Staff() {
  const unlocked = useStaffSession()
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>('floor')
  const [focusTable, setFocusTable] = useState<number | null>(null)
  const fresh = useOrders().filter((o) => o.status === 'new').length

  if (!unlocked) return <StaffLogin />

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'floor', label: 'Floor' },
    { id: 'orders', label: 'Orders', badge: fresh },
    { id: 'guests', label: 'Guests' },
    { id: 'menu', label: 'Menu' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="flex h-full flex-col">
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-stone-200 bg-white/80 px-5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-6">
          <button onClick={() => setTab('floor')} aria-label={t('Floor')}>
            <Logo />
          </button>
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((x) => (
              <button
                key={x.id}
                onClick={() => setTab(x.id)}
                className={`flex shrink-0 items-center rounded-md px-3 py-1.5 text-sm transition-colors ${
                  x.id === tab ? 'bg-stone-100 font-medium text-ink' : 'text-stone-500 hover:text-ink'
                }`}
              >
                {t(x.label)}
                {!!x.badge && (
                  <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] animate-scale-in items-center justify-center rounded-full bg-bronze px-1 text-[11px] font-semibold text-white">
                    {x.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" className="h-8 px-3 text-xs" onClick={lockStaff}>
            <Lock size={13} strokeWidth={1.75} />
            <span className="hidden sm:inline">{t('Lock')}</span>
          </Button>
          <LangSwitch />
        </div>
      </header>

      {tab === 'floor' && <Floor focusTable={focusTable} onOrders={() => setTab('orders')} />}
      {tab === 'orders' && (
        <main className="flex-1 overflow-y-auto">
          <OrdersBoard
            onTable={(id) => {
              setFocusTable(id)
              setTab('floor')
            }}
          />
        </main>
      )}
      {tab === 'guests' && <GuestsTab onOpen={() => setTab('floor')} />}
      {tab === 'menu' && (
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl animate-fade-up space-y-5 px-6 py-10">
            <h1 className="font-serif text-4xl">{t('Menu')}</h1>
            <MenuUpload />
            <ItemsEditor />
          </div>
        </main>
      )}
      {tab === 'settings' && <SettingsTab onModel={() => setTab('floor')} />}
    </div>
  )
}
