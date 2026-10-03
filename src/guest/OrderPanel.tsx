import { useState } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { formatPrice, placeOrder, sections, useItems, useOrders, type OrderStatus } from '../lib/orders'
import { useStore } from '../lib/store'
import { Button } from '../components/ui'

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: 'Sent', className: 'border-bronze/30 bg-bronze-soft text-bronze-deep' },
  accepted: { label: 'Accepted', className: 'border-sand/60 bg-[#F5ECDB] text-[#6B5330]' },
  served: { label: 'Served', className: 'border-stone-200 bg-stone-50 text-stone-500' },
}

/** Where a guest builds an order and sends it straight to the waiter. `lockedTable` fixes the table (QR entrance). */
export function OrderPanel({ lockedTable }: { lockedTable?: number }) {
  const { t, lang } = useLang()
  const store = useStore()
  const { tables, setGuestTable } = store
  // A QR guest orders for the table they scanned; a guest from the booking flow may change it.
  const guestTableId = lockedTable ?? store.guestTableId
  const items = useItems().filter((x) => x.name.trim() && x.price > 0)
  const orders = useOrders()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const lines = items.filter((x) => cart[x.id] > 0).map((x) => ({ name: x.name, price: x.price, qty: cart[x.id] }))
  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0)
  const count = lines.reduce((sum, line) => sum + line.qty, 0)
  const mine = guestTableId === null ? [] : orders.filter((o) => o.tableId === guestTableId)

  const change = (id: string, by: number) => {
    setSent(false)
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(20, (c[id] ?? 0) + by)) }))
  }

  const send = () => {
    if (guestTableId === null || !lines.length) return
    placeOrder(guestTableId, lines, note)
    setCart({})
    setNote('')
    setSent(true)
  }

  if (items.length === 0)
    return (
      <div className="card px-6 py-12 text-center">
        <div className="font-medium">{t('Nothing here yet')}</div>
        <p className="mt-1 text-sm text-stone-500">{t('The menu is being prepared.')}</p>
      </div>
    )

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
        <h2 className="font-serif text-2xl">{t('Your order')}</h2>
        {lockedTable === undefined && (
          <label className="flex items-center gap-2 text-sm text-stone-500">
            {t('Table')}
            <select
              className="input h-9 w-auto"
              value={guestTableId ?? ''}
              onChange={(e) => setGuestTable(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">—</option>
              {[...tables]
                .sort((a, b) => a.id - b.id)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.id}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>

      <div className="px-5 py-2">
        {sections(items).map((section) => (
          <div key={section} className="py-2">
            {section && <div className="label">{section}</div>}
            <div className="mt-1 divide-y divide-stone-100">
              {items
                .filter((x) => x.category === section)
                .map((x) => {
                  const qty = cart[x.id] ?? 0
                  return (
                    <div key={x.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{x.name}</div>
                        <div className="text-sm tabular-nums text-stone-500">{formatPrice(x.price, lang)}</div>
                      </div>
                      {qty > 0 ? (
                        <div className="flex animate-fade-in items-center overflow-hidden rounded-lg border border-ink">
                          <button aria-label="−" className="p-2 transition hover:bg-stone-100" onClick={() => change(x.id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
                          <button aria-label="+" className="p-2 transition hover:bg-stone-100" onClick={() => change(x.id, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          aria-label={`${t('Add')} ${x.name}`}
                          onClick={() => change(x.id, 1)}
                          className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:border-ink hover:text-ink"
                        >
                          <Plus size={15} />
                        </button>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 space-y-3 border-t border-stone-200 bg-white px-5 py-4">
        {count > 0 && (
          <input
            className="input animate-fade-in"
            placeholder={t('Comment for the kitchen, e.g. no onion')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">{t('Items: {n}', { n: count })}</span>
          <span className="text-lg font-semibold tabular-nums">{formatPrice(total, lang)}</span>
        </div>
        <Button size="lg" full disabled={!count || guestTableId === null} onClick={send}>
          {t(guestTableId === null ? 'Choose your table' : 'Send order')}
        </Button>
        {sent && (
          <div className="flex animate-scale-in items-start gap-2.5 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm">
            <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-medium">{t('Order sent')}</span>
              <span className="block text-stone-500">{t('Your waiter has it. No need to repeat anything.')}</span>
            </span>
          </div>
        )}
      </div>

      {mine.length > 0 && (
        <div className="border-t border-stone-200 bg-stone-50 px-5 py-4">
          <div className="label">{t('Orders for table {n}', { n: guestTableId ?? '' })}</div>
          <div className="mt-2 space-y-2">
            {mine.map((o) => (
              <div key={o.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="tabular-nums text-stone-400">{o.time}</span>{' '}
                  {o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${ORDER_STATUS[o.status].className}`}>
                  {t(ORDER_STATUS[o.status].label)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
