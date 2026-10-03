import { ReceiptText } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { formatPrice, setOrderStatus, useOrders, type OrderStatus } from '../lib/orders'
import { useStore } from '../lib/store'
import { Button } from '../components/ui'

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'border-bronze bg-bronze text-white' },
  accepted: { label: 'Accepted', className: 'border-sand/60 bg-[#F5ECDB] text-[#6B5330]' },
  served: { label: 'Served', className: 'border-stone-200 bg-stone-50 text-stone-500' },
}
const RANK: Record<OrderStatus, number> = { new: 0, accepted: 1, served: 2 }

/** The waiter's list of everything guests ordered themselves, newest and unhandled first. */
export function OrdersBoard({ onTable }: { onTable: (tableId: number) => void }) {
  const { t, lang } = useLang()
  const { guests } = useStore()
  const orders = [...useOrders()].sort((a, b) => RANK[a.status] - RANK[b.status] || b.createdAt - a.createdAt)

  return (
    <div className="mx-auto max-w-5xl animate-fade-up px-6 py-10">
      <h1 className="font-serif text-4xl">{t('Orders')}</h1>
      <p className="mt-1 text-sm text-stone-500">{t('Guests order from their table. Nothing to write down.')}</p>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-stone-300 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-stone-500 shadow-soft">
            <ReceiptText size={18} strokeWidth={1.5} />
          </span>
          <div className="mt-4 font-medium">{t('No orders yet')}</div>
          <p className="mt-1 max-w-xs text-sm text-stone-500">{t('Orders appear here the moment a guest sends one.')}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => {
            const guest = guests.find((x) => x.tableId === order.tableId)
            return (
              <article
                key={order.id}
                className={`card flex animate-fade-up flex-col p-5 ${order.status === 'new' ? 'border-bronze/50' : ''} ${
                  order.status === 'served' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button className="text-left" onClick={() => onTable(order.tableId)}>
                    <div className="font-serif text-3xl leading-none">{t('Table {n} ordered', { n: order.tableId })}</div>
                    <div className="mt-1.5 text-sm text-stone-500">
                      {order.time}
                      {guest && ` · ${guest.name}`}
                    </div>
                  </button>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS[order.status].className}`}>
                    {t(STATUS[order.status].label)}
                  </span>
                </div>

                <ul className="mt-4 divide-y divide-stone-100 text-sm">
                  {order.lines.map((line, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-1.5">
                      <span className="w-7 shrink-0 font-semibold tabular-nums">{line.qty}×</span>
                      <span className="min-w-0 flex-1">{line.name}</span>
                      <span className="shrink-0 tabular-nums text-stone-500">{formatPrice(line.price * line.qty, lang)}</span>
                    </li>
                  ))}
                </ul>

                {guest?.allergy && (
                  <div className="mt-2 text-sm font-medium text-bronze-deep">
                    {t('Allergy')}: {t(guest.allergy)}
                  </div>
                )}
                {order.note && <div className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">“{order.note}”</div>}

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="font-semibold tabular-nums">{formatPrice(order.total, lang)}</span>
                  {order.status === 'new' && <Button onClick={() => setOrderStatus(order.id, 'accepted')}>{t('Accept')}</Button>}
                  {order.status === 'accepted' && (
                    <Button variant="secondary" onClick={() => setOrderStatus(order.id, 'served')}>
                      {t('Mark served')}
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
