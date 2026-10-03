import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { LEVEL } from '../lib/matching'
import { useStore } from '../lib/store'
import type { Level, Shape, Table } from '../lib/types'
import { StatusPill } from '../components/TableInfo'
import { Button, Modal, Segmented, Toggle } from '../components/ui'

type Draft = Omit<Table, 'x' | 'z' | 'status'>

const LEVELS: { value: Level; label: string }[] = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
]
const SPACINGS: { value: Level; label: string }[] = [
  { value: 1, label: 'Close' },
  { value: 2, label: 'Good' },
  { value: 3, label: 'Generous' },
]
const SHAPES: { value: Shape; label: string }[] = [
  { value: 'round', label: 'Round' },
  { value: 'rect', label: 'Rectangular' },
]

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  )
}

export function ManageTables({
  initialId,
  onClose,
  onFocus,
}: {
  initialId?: number | null
  onClose: () => void
  onFocus: (id: number) => void
}) {
  const { tables, canAddTable, addTable, updateTable, removeTable } = useStore()
  const { t } = useLang()
  const tr = <V,>(options: { value: V; label: string }[]) => options.map((o) => ({ ...o, label: t(o.label) }))
  const [editing, setEditing] = useState<number | 'new' | null>(initialId ?? null)
  const [draft, setDraft] = useState<Draft | null>(null)

  const nextNumber = Math.max(0, ...tables.map((x) => x.id)) + 1
  const existing = typeof editing === 'number' ? tables.find((x) => x.id === editing) : undefined

  useEffect(() => {
    if (editing === 'new') {
      setDraft({
        id: nextNumber, seats: 2, shape: 'round', privacy: 2, noise: 2, spacing: 2,
        window: false, nearEntrance: false, nearBar: false, zone: 'Main room',
      })
    } else if (existing) {
      setDraft(existing)
      onFocus(existing.id)
    } else {
      setDraft(null)
    }
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d))

  const numberTaken = !!draft && tables.some((x) => x.id === draft.id && x.id !== existing?.id)
  const valid = !!draft && draft.id > 0 && !numberTaken && draft.seats >= 1 && draft.seats <= 12

  const save = () => {
    if (!draft || !valid) return
    if (editing === 'new') addTable(draft)
    else if (existing) updateTable(existing.id, draft)
    onFocus(draft.id)
    setEditing(null)
  }

  return (
    <Modal side title={t('Manage Tables')} onClose={onClose}>
      {draft ? (
        <div key={String(editing)} className="animate-fade-up p-6">
          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-ink"
          >
            <ArrowLeft size={15} strokeWidth={1.75} />
            {t('All tables')}
          </button>
          <h3 className="mt-4 font-serif text-4xl">{editing === 'new' ? t('New table') : t('Table {n}', { n: existing?.id ?? '' })}</h3>

          <div className="mt-4 divide-y divide-stone-100">
            <Field label={t('Table number')}>
              <input
                type="number"
                min={1}
                value={draft.id || ''}
                onChange={(e) => set('id', Number(e.target.value))}
                className={`input w-20 text-center ${numberTaken ? 'border-bronze' : ''}`}
              />
            </Field>
            <Field label={t('Seats')}>
              <input
                type="number"
                min={1}
                max={12}
                value={draft.seats || ''}
                onChange={(e) => set('seats', Number(e.target.value))}
                className="input w-20 text-center"
              />
            </Field>
            <Field label={t('Shape')}>
              <Segmented value={draft.shape} options={tr(SHAPES)} onChange={(v) => set('shape', v)} />
            </Field>
            <Field label={t('Privacy')}>
              <Segmented value={draft.privacy} options={tr(LEVELS)} onChange={(v) => set('privacy', v)} />
            </Field>
            <Field label={t('Noise')}>
              <Segmented value={draft.noise} options={tr(LEVELS)} onChange={(v) => set('noise', v)} />
            </Field>
            <Field label={t('Distance')}>
              <Segmented value={draft.spacing} options={tr(SPACINGS)} onChange={(v) => set('spacing', v)} />
            </Field>
            <Field label={t('By the window')}>
              <Toggle checked={draft.window} onChange={(v) => set('window', v)} />
            </Field>
            <Field label={t('Near entrance')}>
              <Toggle checked={draft.nearEntrance} onChange={(v) => set('nearEntrance', v)} />
            </Field>
            <Field label={t('Near bar')}>
              <Toggle checked={draft.nearBar} onChange={(v) => set('nearBar', v)} />
            </Field>
          </div>

          {numberTaken && <p className="mt-2 text-sm text-bronze-deep">{t('Table {n} already exists.', { n: draft.id })}</p>}

          <div className="mt-6 flex items-center gap-2">
            <Button full disabled={!valid} onClick={save}>
              {t(editing === 'new' ? 'Add table' : 'Save changes')}
            </Button>
            {existing && existing.status === 'available' && (
              <Button
                variant="secondary"
                aria-label="Remove table"
                onClick={() => {
                  removeTable(existing.id)
                  setEditing(null)
                }}
              >
                <Trash2 size={15} strokeWidth={1.75} />
              </Button>
            )}
          </div>
          {existing && existing.status !== 'available' && (
            <p className="mt-3 text-xs text-stone-400">{t('A table in use cannot be removed.')}</p>
          )}
        </div>
      ) : (
        <div className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">{t('{n} tables on the floor', { n: tables.length })}</p>
            <Button variant="secondary" className="h-9" disabled={!canAddTable} onClick={() => setEditing('new')}>
              <Plus size={15} strokeWidth={1.75} />
              {t('Add table')}
            </Button>
          </div>
          {!canAddTable && <p className="mt-2 text-xs text-stone-400">{t('The floor is full. Remove a table to add another.')}</p>}

          <div className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200">
            {[...tables]
              .sort((a, b) => a.id - b.id)
              .map((table) => (
                <button
                  key={table.id}
                  onClick={() => setEditing(table.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50"
                >
                  <span className="w-8 font-serif text-2xl leading-none">{table.id}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {t('Seats: {n}', { n: table.seats })} · {t(table.zone)}
                    </span>
                    <span className="block truncate text-xs text-stone-500">
                      {t('Privacy')}: {t(LEVEL[table.privacy]).toLowerCase()} · {t('Noise')}: {t(LEVEL[table.noise]).toLowerCase()}
                    </span>
                  </span>
                  <StatusPill status={table.status} />
                  <ChevronRight size={15} className="text-stone-300" />
                </button>
              ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
