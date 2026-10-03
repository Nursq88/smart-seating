import { Eraser, Plus, Trash2 } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { useImportState } from '../lib/menuImport'
import { newItem, saveItems, sections, useItems, type MenuItem } from '../lib/orders'
import { Button } from '../components/ui'

/** The online menu: dishes and prices read from the uploaded file. Every line stays editable. */
export function ItemsEditor() {
  const { t } = useLang()
  const items = useItems()
  const state = useImportState()

  const update = (id: string, patch: Partial<MenuItem>) => saveItems(items.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">{t('Online menu')}</h2>
          <p className="mt-0.5 text-sm text-stone-500">{t('This is what guests see and order from. Check the names and prices.')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-9"
            disabled={items.length === 0 || state.running}
            onClick={() => saveItems([])}
          >
            <Eraser size={15} strokeWidth={1.75} />
            {t('Clear list')}
          </Button>
          <Button variant="secondary" className="h-9" onClick={() => saveItems([...items, newItem(items[items.length - 1]?.category)])}>
            <Plus size={15} strokeWidth={1.75} />
            {t('Add item')}
          </Button>
        </div>
      </div>

      {state.running ? (
        <div className="mt-4 animate-fade-in rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t('Reading your menu…')}</span>
            <span className="tabular-nums text-stone-500">{Math.round(state.progress * 100)}%</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${state.progress * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-stone-500">{t('Photos take longer than PDFs. The first run also downloads the text recognition data.')}</p>
        </div>
      ) : state.failed ? (
        <p className="mt-4 animate-fade-in text-sm text-bronze-deep">{t('Could not read the menu. Check the connection and try again, or add items by hand.')}</p>
      ) : state.found !== null ? (
        <p className="mt-4 animate-fade-in text-sm text-stone-600">
          {state.found > 0
            ? t('Items found in the menu: {n}. Recognition can make mistakes, so look through the list.', { n: state.found })
            : t('No dishes with prices were found. Try a sharper photo or a PDF, or add items by hand.')}
        </p>
      ) : null}

      {items.length === 0 ? (
        !state.running && (
          <p className="mt-4 rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            {t('Upload your menu above and its dishes will appear here.')}
          </p>
        )
      ) : (
        <div className="mt-4 space-y-2">
          <datalist id="menu-sections">
            {sections(items).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-2">
              <input
                className="input min-w-[180px] flex-1"
                placeholder={t('Item name')}
                value={item.name}
                onChange={(e) => update(item.id, { name: e.target.value })}
              />
              <input
                className="input w-40"
                list="menu-sections"
                placeholder={t('Section')}
                aria-label={t('Section')}
                value={item.category}
                onChange={(e) => update(item.id, { category: e.target.value })}
              />
              <div className="relative">
                <input
                  className="input w-28 pr-7 text-right tabular-nums"
                  type="number"
                  min={0}
                  step={100}
                  aria-label={t('Price')}
                  value={item.price || ''}
                  onChange={(e) => update(item.id, { price: Math.max(0, Math.round(Number(e.target.value))) })}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">₸</span>
              </div>
              <button
                aria-label={t('Delete')}
                onClick={() => saveItems(items.filter((x) => x.id !== item.id))}
                className="rounded-md p-2 text-stone-400 transition hover:bg-stone-100 hover:text-ink"
              >
                <Trash2 size={15} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
