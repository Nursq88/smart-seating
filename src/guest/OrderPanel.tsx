import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Check, Info, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { DEMO_MODE } from '../lib/demo'
import { sectionLabel } from '../lib/demoMenu'
import { useLang } from '../lib/i18n'
import { formatPrice, placeOrder, sections, useItems, useOrders, type MenuItem, type OrderStatus } from '../lib/orders'
import { useStore } from '../lib/store'
import { Button, Counter, Modal } from '../components/ui'

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: 'Sent', className: 'border-bronze/30 bg-bronze-soft text-bronze-deep' },
  accepted: { label: 'Accepted', className: 'border-sand/60 bg-[#F5ECDB] text-[#6B5330]' },
  served: { label: 'Served', className: 'border-stone-200 bg-stone-50 text-stone-600' },
}

const MAX_QTY = 20

type CartView = 'cart' | 'confirm' | 'sent'

/** Section anchor ids must be valid and stable whatever the heading says. */
const anchor = (index: number) => `menu-section-${index}`

/** Everything the restaurant tells about a dish, and nothing it does not. */
function DishDetails({
  item,
  qty,
  onQty,
  onClose,
}: {
  item: MenuItem
  qty: number
  onQty: (qty: number) => void
  onClose: () => void
}) {
  const { t, lang } = useLang()
  const known = item.description || item.portion || item.allergens?.length
  return (
    <Modal
      title={t('About the dish')}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          {qty > 0 ? (
            <>
              <span className="text-sm text-stone-600">{t('In your order')}</span>
              <Counter compact value={qty} min={0} max={MAX_QTY} onChange={onQty} less={t('One less')} more={t('One more')} />
            </>
          ) : (
            <Button full onClick={() => onQty(1)}>
              <Plus size={15} />
              {t('Add to order')} · {formatPrice(item.price, lang)}
            </Button>
          )}
        </div>
      }
    >
      <div className="px-5 py-5 sm:px-6">
        {item.category && <div className="label">{sectionLabel(item.category, lang)}</div>}
        <h3 className="mt-1 font-serif text-3xl leading-tight">{item.name}</h3>
        <div className="mt-2 text-lg font-semibold tabular-nums">{formatPrice(item.price, lang)}</div>

        {item.description && (
          <section className="mt-5">
            <h4 className="label">{t('Ingredients')}</h4>
            <p className="mt-1.5 text-sm">{item.description}</p>
          </section>
        )}
        {item.portion && (
          <section className="mt-4">
            <h4 className="label">{t('Portion')}</h4>
            <p className="mt-1.5 text-sm">{item.portion}</p>
          </section>
        )}
        {!!item.allergens?.length && (
          <section className="mt-4">
            <h4 className="label">{t('Allergens')}</h4>
            <p className="mt-1.5 text-sm">{item.allergens.join(', ')}</p>
          </section>
        )}
        {!known && (
          <p className="mt-5 flex gap-2.5 rounded-lg bg-stone-100 px-3.5 py-3 text-sm text-stone-600">
            <Info size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
            {t('The menu does not list ingredients, portion size or allergens for this dish. If you have an allergy, please ask your waiter.')}
          </p>
        )}
      </div>
    </Modal>
  )
}

/** Where a guest builds an order and sends it straight to the waiter. `lockedTable` fixes the table (QR entrance). */
export function OrderPanel({ lockedTable }: { lockedTable?: number }) {
  const { t, lang } = useLang()
  const store = useStore()
  const { tables, setGuestTable } = store
  // A QR guest orders for the table they scanned; a guest from the booking flow may change it.
  const guestTableId = lockedTable ?? store.guestTableId
  const all = useItems()
  const items = useMemo(() => all.filter((x) => x.name.trim() && x.price > 0), [all])
  const orders = useOrders()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<CartView | null>(null)
  const [detail, setDetail] = useState<MenuItem | null>(null)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(0)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const navRefs = useRef<(HTMLButtonElement | null)[]>([])
  const navRef = useRef<HTMLElement>(null)

  const lines = items.filter((x) => cart[x.id] > 0).map((x) => ({ id: x.id, name: x.name, price: x.price, qty: cart[x.id] }))
  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0)
  const count = lines.reduce((sum, line) => sum + line.qty, 0)
  const mine = guestTableId === null ? [] : orders.filter((o) => o.tableId === guestTableId)

  const needle = query.trim().toLowerCase()
  const shown = needle
    ? items.filter((x) => x.name.toLowerCase().includes(needle) || sectionLabel(x.category, lang).toLowerCase().includes(needle))
    : items
  const groups = sections(shown)

  // Highlight the section being read in the category bar.
  useEffect(() => {
    const nodes = sectionRefs.current.filter((x): x is HTMLElement => !!x)
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActive(Number((top.target as HTMLElement).dataset.index))
      },
      { rootMargin: '-140px 0px -60% 0px' },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [groups.length, needle])

  // Keep the highlighted chip in view. Scrolling the bar itself, not scrollIntoView, so the page scroll is not interrupted.
  useEffect(() => {
    const chip = navRefs.current[active]
    const bar = navRef.current
    if (!chip || !bar) return
    const left = chip.offsetLeft - bar.clientWidth / 2 + chip.offsetWidth / 2
    bar.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [active])

  const setQty = (id: string, qty: number) => {
    setFailed(false)
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(MAX_QTY, qty)) }))
  }

  const send = () => {
    if (guestTableId === null || !lines.length) return
    const order = placeOrder(
      guestTableId,
      lines.map(({ name, price, qty }) => ({ name, price, qty })),
      note,
    )
    if (!order) return setFailed(true)
    setCart({})
    setNote('')
    setView('sent')
  }

  const jump = (index: number) => {
    setActive(index)
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (items.length === 0)
    return (
      <div className="card px-6 py-12 text-center">
        <div className="font-medium">{t('Nothing here yet')}</div>
        <p className="mt-1 text-sm text-stone-600">{t('The menu is being prepared.')}</p>
      </div>
    )

  const tablePicker = lockedTable === undefined && (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-stone-600">{t('Your table')}</span>
      <select
        className="input h-10 w-auto min-w-[96px]"
        value={guestTableId ?? ''}
        onChange={(e) => setGuestTable(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">—</option>
        {[...tables]
          .sort((a, b) => a.id - b.id)
          .map((x) => (
            <option key={x.id} value={x.id}>
              {t('Table {n}', { n: x.id })}
            </option>
          ))}
      </select>
    </label>
  )

  return (
    <>
      <div className="sticky top-14 z-30 -mx-4 border-b border-stone-200 bg-milk/95 px-4 pb-2 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="relative">
          <label htmlFor="menu-search" className="sr-only">
            {t('Search the menu')}
          </label>
          <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" aria-hidden />
          <input
            id="menu-search"
            type="search"
            className="input h-11 pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden"
            placeholder={t('Search dishes')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              aria-label={t('Clear search')}
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </div>
        {groups.length > 1 && (
          <nav ref={navRef} aria-label={t('Menu sections')} className="relative -mx-4 mt-2 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6">
            <ul className="flex w-max gap-1.5 pb-1">
              {groups.map((section, i) => (
                <li key={section}>
                  <button
                    ref={(el) => (navRefs.current[i] = el)}
                    type="button"
                    aria-current={i === active ? 'true' : undefined}
                    onClick={() => jump(i)}
                    className={`min-h-[34px] whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      i === active ? 'border-ink bg-ink text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-ink'
                    }`}
                  >
                    {sectionLabel(section, lang) || t('Other')}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <section className="card mt-4 overflow-hidden" aria-label={t('Our menu')}>
        {groups.length === 0 ? (
          <div className="px-6 py-12 text-center" role="status">
            <div className="font-medium">{t('Nothing found for “{q}”', { q: query.trim() })}</div>
            <p className="mt-1 text-sm text-stone-600">{t('Check the spelling or try another word.')}</p>
            <Button variant="secondary" className="mt-4" onClick={() => setQuery('')}>
              {t('Show the whole menu')}
            </Button>
          </div>
        ) : (
          <div className="px-4 py-2 sm:px-5">
            {groups.map((section, i) => (
              <section
                key={section}
                id={anchor(i)}
                data-index={i}
                ref={(el) => (sectionRefs.current[i] = el)}
                className="scroll-mt-36 py-2"
                aria-labelledby={`${anchor(i)}-title`}
              >
                {section && (
                  <h2 id={`${anchor(i)}-title`} className="label pt-2">
                    {sectionLabel(section, lang)}
                  </h2>
                )}
                <ul className="mt-1 divide-y divide-stone-100">
                  {shown
                    .filter((x) => x.category === section)
                    .map((x) => {
                      const qty = cart[x.id] ?? 0
                      return (
                        <li key={x.id} className="flex items-center gap-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => setDetail(x)}
                            className="min-w-0 flex-1 rounded-md py-0.5 text-left"
                            aria-label={`${x.name}, ${formatPrice(x.price, lang)}. ${t('Details')}`}
                          >
                            <span className="block break-words text-sm font-medium leading-snug">{x.name}</span>
                            <span className="mt-0.5 block text-sm tabular-nums text-stone-600">{formatPrice(x.price, lang)}</span>
                          </button>
                          {qty > 0 ? (
                            <div className="animate-fade-in shrink-0">
                              <Counter
                                compact
                                value={qty}
                                min={0}
                                max={MAX_QTY}
                                onChange={(n) => setQty(x.id, n)}
                                less={t('One less: {name}', { name: x.name })}
                                more={t('One more: {name}', { name: x.name })}
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              aria-label={t('Add {name}', { name: x.name })}
                              onClick={() => setQty(x.id, 1)}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:border-ink hover:text-ink"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </li>
                      )
                    })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      {mine.length > 0 && (
        <section className="card mt-4 px-5 py-4" aria-labelledby="my-orders">
          <h2 id="my-orders" className="label">
            {t('Orders for table {n}', { n: guestTableId ?? '' })}
          </h2>
          <ul className="mt-2 space-y-2">
            {mine.map((o) => (
              <li key={o.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="tabular-nums text-stone-600">{o.time}</span>{' '}
                  {o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${ORDER_STATUS[o.status].className}`}>
                  {t(ORDER_STATUS[o.status].label)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {count > 0 &&
        createPortal(
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-stone-600">{t('Items: {n}', { n: count })}</div>
              <div className="text-lg font-semibold tabular-nums leading-tight">{formatPrice(total, lang)}</div>
            </div>
            <Button size="lg" onClick={() => setView('cart')}>
              <ShoppingBag size={16} strokeWidth={1.75} />
              {t('View order')}
            </Button>
          </div>
        </div>,
          document.body,
        )}

      {detail && (
        <DishDetails item={detail} qty={cart[detail.id] ?? 0} onQty={(n) => setQty(detail.id, n)} onClose={() => setDetail(null)} />
      )}

      {view === 'cart' && (
        <Modal
          title={t('Your order')}
          onClose={() => setView(null)}
          footer={
            lines.length > 0 && (
              <div className="space-y-3">
                {tablePicker}
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-stone-600">{t('Total')}</span>
                  <span className="text-lg font-semibold tabular-nums">{formatPrice(total, lang)}</span>
                </div>
                <Button size="lg" full disabled={guestTableId === null} onClick={() => setView('confirm')}>
                  {t(guestTableId === null ? 'Choose your table' : 'Review order')}
                </Button>
              </div>
            )
          }
        >
          {lines.length === 0 ? (
            <div className="px-6 py-10 text-center" role="status">
              <div className="font-medium">{t('Your order is empty')}</div>
              <p className="mt-1 text-sm text-stone-600">{t('Add dishes from the menu.')}</p>
            </div>
          ) : (
            <div className="px-5 py-3 sm:px-6">
              <ul className="divide-y divide-stone-100">
                {lines.map((line) => (
                  <li key={line.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words text-sm font-medium leading-snug">{line.name}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(line.price * line.qty, lang)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Counter
                        compact
                        value={line.qty}
                        min={1}
                        max={MAX_QTY}
                        onChange={(n) => setQty(line.id, n)}
                        less={t('One less: {name}', { name: line.name })}
                        more={t('One more: {name}', { name: line.name })}
                      />
                      <span className="text-xs tabular-nums text-stone-600">
                        × {formatPrice(line.price, lang)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(line.id, 0)}
                        aria-label={t('Remove {name}', { name: line.name })}
                        className="ml-auto flex min-h-[36px] items-center gap-1.5 rounded-md px-2 text-sm text-stone-600 transition hover:bg-stone-100 hover:text-ink"
                      >
                        <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                        <span className="hidden min-[400px]:inline">{t('Remove')}</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <label className="mt-2 block">
                <span className="mb-1.5 block text-sm text-stone-600">{t('Comment for the kitchen')}</span>
                <input className="input" placeholder={t('e.g. no onion')} value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            </div>
          )}
        </Modal>
      )}

      {view === 'confirm' && guestTableId !== null && (
        <Modal
          title={t('Confirm your order')}
          onClose={() => setView(null)}
          footer={
            <div className="space-y-3">
              {failed && (
                <p role="alert" className="text-sm font-medium text-bronze-deep">
                  {t('The order could not be saved: this browser refused to store it. Try again or ask your waiter.')}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" size="lg" onClick={() => setView('cart')} aria-label={t('Back to order')}>
                  <ArrowLeft size={16} strokeWidth={1.75} />
                </Button>
                <Button size="lg" full onClick={send}>
                  <Check size={16} strokeWidth={2} />
                  {t('Confirm and send')}
                </Button>
              </div>
            </div>
          }
        >
          <div className="px-5 py-4 sm:px-6">
            <div className="text-sm text-stone-600">{t('Table {n}', { n: guestTableId })}</div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-3">
                  <span className="min-w-0 break-words">
                    <span className="tabular-nums text-stone-600">{line.qty}×</span> {line.name}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatPrice(line.price * line.qty, lang)}</span>
                </li>
              ))}
            </ul>
            {note.trim() && (
              <p className="mt-3 text-sm">
                <span className="text-stone-600">{t('Comment for the kitchen')}:</span> {note.trim()}
              </p>
            )}
            <div className="mt-4 flex items-baseline justify-between border-t border-stone-200 pt-3">
              <span className="font-medium">{t('Total')}</span>
              <span className="text-lg font-semibold tabular-nums">{formatPrice(total, lang)}</span>
            </div>
            {DEMO_MODE && (
              <p className="mt-4 flex gap-2.5 rounded-lg border border-bronze/30 bg-bronze-soft/70 px-3.5 py-3 text-sm">
                <Info size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-bronze-deep" aria-hidden />
                {t('Demo: the order goes only to the demo staff screen in this browser. The restaurant does not receive it.')}
              </p>
            )}
          </div>
        </Modal>
      )}

      {view === 'sent' && (
        <Modal
          title={t('Order sent')}
          onClose={() => setView(null)}
          footer={
            <Button size="lg" full onClick={() => setView(null)}>
              {t('Back to the menu')}
            </Button>
          }
        >
          <div className="flex items-start gap-3 px-5 py-5 sm:px-6" role="status">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white">
              <Check size={18} strokeWidth={2} aria-hidden />
            </span>
            <p className="text-sm">
              {t(
                DEMO_MODE
                  ? 'The demo staff screen in this browser shows it now. In the real service it would go straight to your waiter.'
                  : 'Your waiter has it. No need to repeat anything.',
              )}
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
