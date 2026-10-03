import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Box, Plus, ReceiptText, Settings2, X } from 'lucide-react'
import { TableInfo } from '../components/TableInfo'
import { Button } from '../components/ui'
import { useLang } from '../lib/i18n'
import { guestMatch, PURPOSE_LABEL, rankTables, scoreTable } from '../lib/matching'
import { useOrders } from '../lib/orders'
import { PURPOSE_ICON } from '../lib/purposes'
import { useDecors, useOccasions, useStats, useStore } from '../lib/store'
import { Legend, RestaurantScene } from '../three/RestaurantScene'
import { AddModelModal } from './AddModelModal'
import { GuestBrief } from './GuestBrief'
import { ManageTables } from './ManageTables'
import { TableQr } from './TableQr'

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3.5">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="mt-1 font-serif text-4xl leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 text-xs text-stone-400">{hint}</div>
    </div>
  )
}

/**
 * The main working screen for staff. Left: who is arriving. Centre: the floor.
 * Right: the brief for the selected guest or table, or tonight's numbers when nothing is selected.
 */
export function Floor({ focusTable, onOrders }: { focusTable: number | null; onOrders: () => void }) {
  const { tables, guests, modelReady, restaurantName, selectedGuestId, selectGuest, seatGuest, clearTable } = useStore()
  const stats = useStats()
  const { t } = useLang()
  const [tableSel, setTableSel] = useState<number | null>(focusTable)
  const [override, setOverride] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [managing, setManaging] = useState<{ id: number | null } | null>(null)
  const [sceneKey, setSceneKey] = useState(0)

  // Coming from an order card: show that table rather than whichever guest was open.
  useEffect(() => {
    if (focusTable !== null) selectGuest(null)
  }, [focusTable, selectGuest])

  const guest = guests.find((x) => x.id === selectedGuestId) ?? null
  const arriving = guests.filter((x) => x.status === 'waiting')
  const seated = guest?.status === 'seated'

  const matches = useMemo(
    () => (guest && !seated ? rankTables(guest.prefs, tables, guest.tableId) : []),
    [guest, seated, tables],
  )
  const targetId = guest ? (seated ? guest.tableId : (override ?? guest.tableId ?? matches[0]?.table.id)) : undefined
  const target = tables.find((x) => x.id === targetId)
  const targetScore = guest && target ? scoreTable(guest.prefs, target) : null
  const selectedTable = tables.find((x) => x.id === tableSel)
  const highlight = guest ? target?.id : tableSel

  const decors = useDecors({ tableId: target?.id, decor: guest?.decor })
  const occasions = useOccasions()
  const fresh = useOrders().filter((o) => o.status === 'new')
  const latest = fresh[0]
  // Tables waiting for someone to pick up an order are flagged on the floor.
  const flags = Object.fromEntries(fresh.map((o) => [o.tableId, t('order')]))

  const bookings = guests
    .filter((x) => x.status !== 'seated')
    .map((x) => ({ guest: x, match: guestMatch(x, tables) }))
    .sort((a, b) => a.guest.time.localeCompare(b.guest.time))

  const pickGuest = (id: number | null) => {
    selectGuest(id)
    setOverride(null)
    setTableSel(null)
  }

  const onTable = (id: number | null) => {
    if (id === null) return setTableSel(null)
    if (guest && !seated && matches.some((m) => m.table.id === id)) return setOverride(id)
    pickGuest(null)
    setTableSel(id)
  }

  return (
    <main className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[272px_1fr_340px] lg:overflow-hidden">
      <aside className="order-2 flex flex-col border-stone-200 bg-white p-5 lg:order-none lg:overflow-y-auto lg:border-r">
        <div className="label">{restaurantName}</div>
        <h1 className="mt-1 font-serif text-3xl">{t("Today's Floor")}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {t('{a} free · {b} occupied · {c} reserved', { a: stats.available, b: stats.occupied, c: stats.reserved })}
        </p>

        <div className="label mt-7">
          {t('Arriving')} · {arriving.length}
        </div>
        <div className="mt-2 space-y-1.5">
          {arriving.map((x) => {
            const Icon = PURPOSE_ICON[x.prefs.purpose]
            const active = x.id === guest?.id
            return (
              <button
                key={x.id}
                onClick={() => pickGuest(x.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition duration-200 ${
                  active ? 'border-ink bg-white shadow-soft' : 'border-transparent hover:bg-stone-50'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    active ? 'bg-ink text-white' : 'bg-stone-100 text-graphite'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.6} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {x.name}
                    {x.allergy && <AlertTriangle size={12} strokeWidth={2} className="text-bronze" />}
                  </span>
                  <span className="block truncate text-xs text-stone-500">
                    {t(PURPOSE_LABEL[x.prefs.purpose])} · {x.prefs.party}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-stone-400">{x.time}</span>
              </button>
            )
          })}
          {arriving.length === 0 && (
            <div className="rounded-lg border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
              {t('Everyone is seated.')}
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-8">
          <Button variant="secondary" full disabled={!modelReady} onClick={() => setManaging({ id: null })}>
            <Settings2 size={15} strokeWidth={1.75} />
            {t('Manage Tables')}
          </Button>
          <Button variant="secondary" full onClick={() => setAdding(true)}>
            <Plus size={15} strokeWidth={2} />
            {t('Add Restaurant Model')}
          </Button>
        </div>
      </aside>

      <div className="relative order-1 h-[52vh] bg-gradient-to-b from-white to-stone-100 lg:order-none lg:h-auto">
        {modelReady ? (
          <RestaurantScene
            key={sceneKey}
            tables={tables}
            decors={decors}
            occasions={occasions}
            tone={(table) => (guest && !seated && table.id === target?.id ? 'recommended' : table.status)}
            selectedId={highlight}
            focusId={highlight}
            labels={guest && !seated && target && targetScore !== null ? { ...flags, [target.id]: `${targetScore}%` } : flags}
            onSelect={onTable}
          >
            <Legend />
            {latest && (
              <button
                key={latest.id}
                onClick={onOrders}
                className="card absolute right-4 top-4 z-30 flex max-w-[280px] animate-scale-in items-center gap-3 border-bronze/50 px-4 py-3 text-left transition hover:shadow-lift"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bronze text-white">
                  <ReceiptText size={16} strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t('Table {n} ordered', { n: latest.tableId })}</span>
                  <span className="block truncate text-xs text-stone-500">
                    {latest.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-stone-400" />
              </button>
            )}
          </RestaurantScene>
        ) : (
          <div className="flex h-full animate-fade-up flex-col items-center justify-center p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-500 shadow-soft">
              <Box size={20} strokeWidth={1.5} />
            </span>
            <h2 className="mt-5 font-serif text-3xl">{t('No restaurant model yet')}</h2>
            <p className="mt-1.5 max-w-xs text-sm text-stone-500">
              {t('Upload a few photos and we will build the floor your team works on.')}
            </p>
            <Button className="mt-6" onClick={() => setAdding(true)}>
              <Plus size={15} strokeWidth={2} />
              {t('Add Restaurant Model')}
            </Button>
          </div>
        )}
      </div>

      <aside
        className={`order-3 border-t border-stone-200 p-6 lg:order-none lg:overflow-y-auto lg:border-l lg:border-t-0 ${
          guest || selectedTable ? 'bg-white' : 'bg-stone-50'
        }`}
      >
        {guest ? (
          <div className="relative h-full">
            <button
              aria-label={t('Back')}
              onClick={() => pickGuest(null)}
              className="absolute -right-2 -top-2 z-10 rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-ink"
            >
              <X size={16} />
            </button>
            <GuestBrief
              guest={guest}
              table={target}
              score={targetScore}
              matches={matches}
              onPick={setOverride}
              onSeat={() => {
                if (!target) return
                seatGuest(guest.id, target.id)
                setOverride(null)
              }}
            />
          </div>
        ) : selectedTable ? (
          <div className="relative">
            <button
              aria-label={t('Back')}
              onClick={() => setTableSel(null)}
              className="absolute -right-2 -top-2 z-10 rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-ink"
            >
              <X size={16} />
            </button>
            <TableInfo
              key={selectedTable.id}
              table={selectedTable}
              actions={
                <>
                  {selectedTable.status === 'occupied' && (
                    <Button full onClick={() => clearTable(selectedTable.id)}>
                      {t('Clear table')}
                    </Button>
                  )}
                  <Button variant="secondary" full onClick={() => setManaging({ id: selectedTable.id })}>
                    {t('Edit table')}
                  </Button>
                </>
              }
            />
            <TableQr key={`qr-${selectedTable.id}`} tableId={selectedTable.id} />
          </div>
        ) : (
          <div className="animate-fade-up">
            <div className="label">{t('Tonight')}</div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Metric label={t('Guest Experience')} value={`${stats.averageMatch}%`} hint={t('Average seating match')} />
              <Metric
                label={t('Current Occupancy')}
                value={`${stats.occupancy}%`}
                hint={t('{a} of {b} tables', { a: stats.occupied, b: stats.total })}
              />
              <Metric label={t('Special Requests')} value={String(stats.specialRequests)} hint={t('Allergies, notes and styling')} />
              <Metric label={t('Unresolved')} value={String(stats.unresolved)} hint={t('Preferences below 75%')} />
            </div>

            <div className="label mt-7">{t('Recent bookings')}</div>
            <div className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
              {bookings.slice(0, 5).map(({ guest: x, match }) => (
                <button
                  key={x.id}
                  onClick={() => pickGuest(x.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-stone-50"
                >
                  <span className="font-medium">{match ? t('Table {n}', { n: match.tableId }) : t('Unassigned')}</span>
                  <span className="truncate text-stone-500">{t(PURPOSE_LABEL[x.prefs.purpose])}</span>
                </button>
              ))}
              {bookings.length === 0 && <div className="px-4 py-6 text-center text-sm text-stone-500">{t('No upcoming bookings.')}</div>}
            </div>
          </div>
        )}
      </aside>

      {adding && (
        <AddModelModal
          onClose={() => setAdding(false)}
          onReady={() => {
            setSceneKey((k) => k + 1)
            setTableSel(null)
          }}
        />
      )}
      {managing && <ManageTables initialId={managing.id} onClose={() => setManaging(null)} onFocus={setTableSel} />}
    </main>
  )
}
