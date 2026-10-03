import type { Lang } from './i18n'
import { demoMenu } from './demoMenu'
import { createLocalStore } from './local'

/**
 * Something a guest can order. Names and sections are kept exactly as they appear in the
 * restaurant's own menu, which is where they are imported from.
 */
export interface MenuItem {
  id: string
  /** Section heading from the menu, e.g. "Салаты"; empty when the menu has none */
  category: string
  name: string
  /** Price in tenge, whole units */
  price: number
}

export function formatPrice(price: number, lang: Lang) {
  return `${new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU').format(price)} ₸`
}

/**
 * A browser that has never opened the site starts with the example menu, so the demo is ready at once.
 * After that the list is whatever the staff make of it: uploaded, edited or cleared.
 */
const items = createLocalStore<MenuItem[]>('sse.menu-items', demoMenu)

export const useItems = items.use
export const saveItems = items.set

/** Adds items whose names are not in the list yet. Returns how many were added. */
export function addItems(found: MenuItem[]) {
  const current = items.get()
  const known = new Set(current.map((x) => x.name.trim().toLowerCase()))
  const fresh = found.filter((x) => {
    const key = x.name.trim().toLowerCase()
    return !known.has(key) && known.add(key)
  })
  if (fresh.length) items.set([...current, ...fresh])
  return fresh.length
}

export function newItem(category = ''): MenuItem {
  return { id: `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, category, name: '', price: 0 }
}

/** Section names in the order they first appear. */
export function sections(list: MenuItem[]) {
  return [...new Set(list.map((x) => x.category))]
}

// The sample dishes of an earlier version are no longer used.
try {
  localStorage.removeItem('sse.items')
} catch {
  // storage unavailable
}

// --- Orders -------------------------------------------------------------------

export type OrderStatus = 'new' | 'accepted' | 'served'

export interface OrderLine {
  /** Name as the guest saw it, so the order stays readable if the item is later renamed or removed */
  name: string
  price: number
  qty: number
}

export interface Order {
  id: string
  tableId: number
  lines: OrderLine[]
  note?: string
  total: number
  status: OrderStatus
  /** Clock time the order was sent, HH:MM */
  time: string
  createdAt: number
}

/** Kept in localStorage so an order sent from one tab reaches the waiter's screen in another. */
const orders = createLocalStore<Order[]>('sse.orders', () => [])

export const useOrders = orders.use

export function placeOrder(tableId: number, lines: OrderLine[], note?: string) {
  const now = new Date()
  const order: Order = {
    id: `order-${now.getTime().toString(36)}`,
    tableId,
    lines,
    note: note?.trim() || undefined,
    total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
    status: 'new',
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    createdAt: now.getTime(),
  }
  orders.set([order, ...orders.get()])
  return order
}

export function setOrderStatus(id: string, status: OrderStatus) {
  orders.set(orders.get().map((order) => (order.id === id ? { ...order, status } : order)))
}

export function clearOrders() {
  orders.set([])
}
