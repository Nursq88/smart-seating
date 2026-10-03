import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { INITIAL_GUESTS, INITIAL_TABLES, SLOTS } from './data'
import { guestMatch } from './matching'
import { clearOrders } from './orders'
import type { Decor, Guest, Purpose, Route, Table } from './types'

interface State {
  tables: Table[]
  guests: Guest[]
  modelReady: boolean
  restaurantName: string
}

const INITIAL: State = {
  tables: INITIAL_TABLES,
  guests: INITIAL_GUESTS,
  modelReady: true,
  restaurantName: 'Maison Lumière',
}

export const MIN_TABLES = 12
export const MAX_TABLES = SLOTS.length

function freeSlot(tables: Table[]): [number, number] | null {
  return SLOTS.find(([x, z]) => !tables.some((t) => Math.abs(t.x - x) < 0.5 && Math.abs(t.z - z) < 0.5)) ?? null
}

function blankTable(id: number, [x, z]: [number, number]): Table {
  return {
    id, x, z, seats: 4, shape: 'rect', privacy: 2, noise: 2, spacing: 2,
    window: false, nearEntrance: false, nearBar: false, zone: 'Main room', status: 'available',
  }
}

interface Store extends State {
  route: Route
  go: (route: Exclude<Route, 'table'>) => void
  /** Table from the scanned QR code; null for visitors who came through the main site */
  qrTable: number | null
  selectedGuestId: number | null
  selectGuest: (id: number | null) => void
  /** Table the person ordering from the menu is sitting at */
  guestTableId: number | null
  setGuestTable: (id: number | null) => void
  /** Adds an arriving guest holding the given table. Returns the new guest id. */
  addGuest: (guest: Omit<Guest, 'id' | 'status'>) => number
  seatGuest: (guestId: number, tableId: number) => void
  clearTable: (tableId: number) => void
  canAddTable: boolean
  addTable: (table: Omit<Table, 'x' | 'z' | 'status'>) => void
  updateTable: (id: number, patch: Partial<Table>) => void
  removeTable: (id: number) => void
  setTableCount: (count: number) => void
  setModelReady: (ready: boolean) => void
  setRestaurantName: (name: string) => void
  reset: () => void
}

/**
 * Where a visitor lands, read from the address:
 * - `#/` (or anything unknown): the booking flow for people coming to the main site
 * - `#/table/12` (also `/table/12` and `?mode=qr&table=12`): a guest who scanned the QR code on table 12,
 *   taken straight to the menu with the order tied to that table
 * - `#/menu`: the menu for a guest who has just booked
 * - `#/staff`: the staff area
 * Unknown addresses fall back to booking, so mistyped links never reveal that a staff area exists.
 */
function readAddress(): { route: Route; qrTable: number | null } {
  const { hash, pathname, search } = window.location
  const query = new URLSearchParams(search)
  const table =
    hash.match(/^#\/?table\/(\d+)$/)?.[1] ??
    pathname.match(/\/table\/(\d+)\/?$/)?.[1] ??
    (query.get('mode') === 'qr' ? query.get('table') : null)
  if (table && /^\d+$/.test(table)) return { route: 'table', qrTable: Number(table) }
  const name = hash.replace(/^#\/?/, '')
  return { route: name === 'staff' || name === 'menu' ? name : 'guest', qrTable: null }
}

/** The address printed as a QR code on a table. */
export function tableLink(tableId: number) {
  // Keep the folder the site is served from (GitHub Pages serves it under /repo-name/).
  const folder = window.location.pathname.replace(/\/table\/\d+\/?$/, '/')
  return `${window.location.origin}${folder}#/table/${tableId}`
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(INITIAL)
  const [address, setAddress] = useState(readAddress)
  const { route, qrTable } = address

  useEffect(() => {
    const onHash = () => setAddress(readAddress())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((next: Exclude<Route, 'table'>) => {
    window.location.hash = next === 'guest' ? '/' : `/${next}`
    setAddress({ route: next, qrTable: null })
  }, [])

  const [selectedGuestId, selectGuest] = useState<number | null>(null)
  const [guestTableId, setGuestTable] = useState<number | null>(null)

  const addGuest = useCallback<Store['addGuest']>(
    (guest) => {
      const id = Math.max(...state.guests.map((x) => x.id), 114) + 1
      setState((s) => ({
        ...s,
        guests: [{ ...guest, id, status: 'waiting' }, ...s.guests],
        tables: s.tables.map((x) => (x.id === guest.tableId ? { ...x, status: 'reserved' } : x)),
      }))
      return id
    },
    [state.guests],
  )

  const seatGuest = useCallback<Store['seatGuest']>((guestId, tableId) => {
    setState((s) => {
      const held = s.guests.find((x) => x.id === guestId)?.tableId
      return {
        ...s,
        guests: s.guests.map((x) => (x.id === guestId ? { ...x, status: 'seated', tableId } : x)),
        tables: s.tables.map((x) => {
          if (x.id === tableId) return { ...x, status: 'occupied' }
          if (x.id === held) return { ...x, status: 'available' }
          return x
        }),
      }
    })
  }, [])

  const clearTable = useCallback<Store['clearTable']>((tableId) => {
    setState((s) => ({
      ...s,
      guests: s.guests.filter((x) => x.tableId !== tableId),
      tables: s.tables.map((x) => (x.id === tableId ? { ...x, status: 'available' } : x)),
    }))
  }, [])

  const addTable = useCallback<Store['addTable']>((table) => {
    setState((s) => {
      const slot = freeSlot(s.tables)
      if (!slot || s.tables.some((x) => x.id === table.id)) return s
      return { ...s, tables: [...s.tables, { ...table, x: slot[0], z: slot[1], status: 'available' }] }
    })
  }, [])

  const updateTable = useCallback<Store['updateTable']>((id, patch) => {
    setState((s) => ({
      ...s,
      tables: s.tables.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      // Renumbering a table keeps its guests attached.
      guests:
        patch.id !== undefined && patch.id !== id
          ? s.guests.map((x) => (x.tableId === id ? { ...x, tableId: patch.id } : x))
          : s.guests,
    }))
  }, [])

  const removeTable = useCallback<Store['removeTable']>((id) => {
    setState((s) => ({
      ...s,
      tables: s.tables.filter((x) => x.id !== id),
      guests: s.guests.filter((x) => x.tableId !== id),
    }))
  }, [])

  const setTableCount = useCallback<Store['setTableCount']>((count) => {
    setState((s) => {
      const target = Math.min(MAX_TABLES, Math.max(MIN_TABLES, count))
      let tables = [...s.tables]
      while (tables.length < target) {
        const slot = freeSlot(tables)
        if (!slot) break
        tables.push(blankTable(Math.max(...tables.map((x) => x.id)) + 1, slot))
      }
      if (tables.length > target) {
        // Drop free tables first, highest numbers first, keeping the ones guests are matched to.
        const matched = new Set(
          s.guests.map((guest) => guestMatch(guest, s.tables)?.tableId).filter((id) => id !== undefined),
        )
        const rank = (x: Table) => (matched.has(x.id) ? 2 : x.status === 'available' ? 0 : 1)
        const drop = [...tables]
          .sort((a, b) => rank(a) - rank(b) || b.id - a.id)
          .slice(0, tables.length - target)
          .map((x) => x.id)
        tables = tables.filter((x) => !drop.includes(x.id))
      }
      const ids = new Set(tables.map((x) => x.id))
      return {
        ...s,
        tables,
        guests: s.guests.filter((x) => x.tableId === undefined || ids.has(x.tableId)),
      }
    })
  }, [])

  const store = useMemo<Store>(
    () => ({
      ...state,
      route,
      go,
      qrTable,
      selectedGuestId,
      selectGuest,
      guestTableId,
      setGuestTable,
      addGuest,
      seatGuest,
      clearTable,
      canAddTable: freeSlot(state.tables) !== null,
      addTable,
      updateTable,
      removeTable,
      setTableCount,
      setModelReady: (modelReady) => setState((s) => ({ ...s, modelReady })),
      setRestaurantName: (restaurantName) => setState((s) => ({ ...s, restaurantName })),
      reset: () => {
        setState(INITIAL)
        selectGuest(null)
        setGuestTable(null)
        clearOrders()
      },
    }),
    [state, route, go, qrTable, selectedGuestId, guestTableId, addGuest, seatGuest, clearTable, addTable, updateTable, removeTable, setTableCount],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const store = useContext(Ctx)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}

/** Headline numbers for the manager, all derived from live state. */
export function useStats() {
  const { tables, guests } = useStore()
  return useMemo(() => {
    const count = (status: Table['status']) => tables.filter((x) => x.status === status).length
    const scores = guests.map((guest) => guestMatch(guest, tables)?.score).filter((x) => x !== undefined)
    const occupied = count('occupied')
    return {
      total: tables.length,
      occupied,
      reserved: count('reserved'),
      available: count('available'),
      occupancy: tables.length ? Math.round((occupied / tables.length) * 100) : 0,
      averageMatch: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      specialRequests: guests.filter((x) => x.allergy || x.note || x.decor).length,
      unresolved: scores.filter((x) => x < 75).length,
    }
  }, [tables, guests])
}

/** Table styling to show on the floor: every table already held or occupied by a guest who asked for it. */
export function useDecors(extra?: { tableId?: number; decor?: Decor }) {
  const { guests } = useStore()
  return useMemo(() => {
    const out: Record<number, Decor> = {}
    for (const guest of guests) if (guest.decor && guest.tableId !== undefined) out[guest.tableId] = guest.decor
    if (extra?.decor && extra.tableId !== undefined) out[extra.tableId] = extra.decor
    return out
  }, [guests, extra?.tableId, extra?.decor])
}

/** What each taken table is being used for. Only the occasion is exposed, never who is sitting there. */
export function useOccasions() {
  const { guests, tables } = useStore()
  return useMemo(() => {
    const out: Record<number, Purpose> = {}
    for (const guest of guests) {
      const table = tables.find((x) => x.id === guest.tableId)
      if (table && table.status !== 'available') out[table.id] = guest.prefs.purpose
    }
    return out
  }, [guests, tables])
}
