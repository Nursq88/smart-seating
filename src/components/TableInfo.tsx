import type { ReactNode } from 'react'
import { useLang } from '../lib/i18n'
import { LEVEL, PURPOSE_LABEL, SPACING } from '../lib/matching'
import { useStore } from '../lib/store'
import type { Table, TableStatus } from '../lib/types'
import { Row } from './ui'

const STATUS: Record<TableStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'border-stone-200 bg-stone-50 text-stone-600' },
  occupied: { label: 'Occupied', className: 'border-graphite bg-graphite text-white' },
  reserved: { label: 'Reserved', className: 'border-sand/60 bg-[#F5ECDB] text-[#6B5330]' },
}

export function StatusPill({ status }: { status: TableStatus }) {
  const { t } = useLang()
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS[status].className}`}>
      {t(STATUS[status].label)}
    </span>
  )
}

export function TableAttributes({ table }: { table: Table }) {
  const { t } = useLang()
  return (
    <div className="divide-y divide-stone-100">
      <Row label={t('Privacy')}>{t(LEVEL[table.privacy])}</Row>
      <Row label={t('Noise')}>{t(LEVEL[table.noise])}</Row>
      <Row label={t('Distance')}>{t(SPACING[table.spacing])}</Row>
      <Row label={t('Location')}>{t(table.zone)}</Row>
      <Row label={t('Seats')}>{table.seats}</Row>
    </div>
  )
}

export function TableInfo({ table, actions }: { table: Table; actions?: ReactNode }) {
  const { guests } = useStore()
  const { t } = useLang()
  const guest = guests.find((x) => x.tableId === table.id)
  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <div className="label">{t('Table')}</div>
          <div className="font-serif text-4xl leading-tight">{table.id}</div>
        </div>
        <StatusPill status={table.status} />
      </div>
      <div className="mt-4">
        <TableAttributes table={table} />
      </div>
      {guest && (
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm">
          <div className="font-medium">
            {guest.name} <span className="font-normal text-stone-400">· #{guest.id}</span>
          </div>
          <div className="mt-0.5 text-stone-500">
            {t(PURPOSE_LABEL[guest.prefs.purpose])} · {t('Guests: {n}', { n: guest.prefs.party })} · {guest.time}
          </div>
          {guest.allergy && <div className="mt-1 text-bronze-deep">{t('Allergy')}: {t(guest.allergy)}</div>}
        </div>
      )}
      {actions && <div className="mt-5 flex flex-col gap-2">{actions}</div>}
    </div>
  )
}
