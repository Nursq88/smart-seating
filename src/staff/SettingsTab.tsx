import { useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { StatusPill } from '../components/TableInfo'
import { Button } from '../components/ui'
import { useLang } from '../lib/i18n'
import { useStats, useStore } from '../lib/store'
import { AddModelModal } from './AddModelModal'

export function SettingsTab({ onModel }: { onModel: () => void }) {
  const store = useStore()
  const { modelReady, restaurantName } = store
  const stats = useStats()
  const { t } = useLang()
  const [adding, setAdding] = useState(false)

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl animate-fade-up px-6 py-10">
        <h1 className="font-serif text-4xl">{t('Settings')}</h1>

        <div className="card mt-6 divide-y divide-stone-100 px-6">
          <label className="flex items-center justify-between gap-6 py-5">
            <span>
              <span className="block text-sm font-medium">{t('Restaurant name')}</span>
              <span className="block text-sm text-stone-500">{t('Shown to guests and staff')}</span>
            </span>
            <input className="input max-w-[240px]" value={restaurantName} onChange={(e) => store.setRestaurantName(e.target.value)} />
          </label>

          <div className="flex items-center justify-between gap-6 py-5">
            <span>
              <span className="flex items-center gap-2 text-sm font-medium">
                {t('Restaurant model')}
                {modelReady && <StatusPill status="available" />}
              </span>
              <span className="block text-sm text-stone-500">
                {modelReady ? t('{n} tables on the floor', { n: stats.total }) : t('No model uploaded yet')}
              </span>
            </span>
            <span className="flex gap-2">
              {modelReady && (
                <Button variant="secondary" aria-label="Remove model" onClick={() => store.setModelReady(false)}>
                  <Trash2 size={15} strokeWidth={1.75} />
                </Button>
              )}
              <Button variant="secondary" onClick={() => setAdding(true)}>
                {t(modelReady ? 'Replace model' : 'Add model')}
              </Button>
            </span>
          </div>

          <div className="flex items-center justify-between gap-6 py-5">
            <span>
              <span className="block text-sm font-medium">{t('Demo data')}</span>
              <span className="block text-sm text-stone-500">{t('Restore the original tables and guests')}</span>
            </span>
            <Button variant="secondary" onClick={store.reset}>
              <RotateCcw size={15} strokeWidth={1.75} />
              {t('Reset')}
            </Button>
          </div>
        </div>
      </div>

      {adding && <AddModelModal onClose={() => setAdding(false)} onReady={onModel} />}
    </main>
  )
}
