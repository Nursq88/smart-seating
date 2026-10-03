import { Users } from 'lucide-react'
import { StatusPill } from '../components/TableInfo'
import { useLang } from '../lib/i18n'
import { guestMatch, PURPOSE_LABEL } from '../lib/matching'
import { useStore } from '../lib/store'
import { GUEST_STATUS } from './GuestBrief'

/** Everyone tonight in one table: arriving, reserved for later, and already seated. */
export function GuestsTab({ onOpen }: { onOpen: () => void }) {
  const { guests, tables, selectGuest } = useStore()
  const { t } = useLang()

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl animate-fade-up px-6 py-10">
        <h1 className="font-serif text-4xl">{t('Guests')}</h1>
        <p className="mt-1 text-sm text-stone-500">{t('Everyone expected or seated tonight. Select a guest to open their brief.')}</p>
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                {['Time', 'Guest', 'Purpose', 'Party', 'Table', 'Match', 'Notes', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {t(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {[...guests]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((x) => {
                  const match = guestMatch(x, tables)
                  const notes = [x.allergy && `${t('Allergy')}: ${t(x.allergy)}`, x.note && t(x.note), x.decor && t('Table styling')].filter(Boolean)
                  return (
                    <tr
                      key={x.id}
                      onClick={() => {
                        selectGuest(x.id)
                        onOpen()
                      }}
                      className="cursor-pointer transition-colors hover:bg-stone-50"
                    >
                      <td className="px-5 py-3 tabular-nums text-stone-600">{x.time}</td>
                      <td className="px-5 py-3">
                        <span className="font-medium">{x.name}</span> <span className="text-stone-400">#{x.id}</span>
                      </td>
                      <td className="px-5 py-3 text-stone-600">{t(PURPOSE_LABEL[x.prefs.purpose])}</td>
                      <td className="px-5 py-3 text-stone-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Users size={13} strokeWidth={1.75} className="text-stone-400" />
                          {x.prefs.party}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-stone-600">{match ? t('Table {n}', { n: match.tableId }) : '—'}</td>
                      <td className="px-5 py-3">
                        {match && (
                          <span className="flex items-center gap-2">
                            <span className="h-1 w-12 overflow-hidden rounded-full bg-stone-100">
                              <span className="block h-full rounded-full bg-bronze" style={{ width: `${match.score}%` }} />
                            </span>
                            <span className="font-medium tabular-nums">{match.score}%</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-stone-600">{notes.join(' · ') || '—'}</td>
                      <td className="px-5 py-3">
                        {x.status === 'waiting' ? (
                          <span className="rounded-full border border-bronze/30 bg-bronze-soft px-2.5 py-0.5 text-xs font-medium text-bronze-deep">
                            {t(GUEST_STATUS[x.status])}
                          </span>
                        ) : (
                          <StatusPill status={x.status === 'seated' ? 'occupied' : 'reserved'} />
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
