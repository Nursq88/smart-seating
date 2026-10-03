import { useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, X } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { MAX_TABLES, MIN_TABLES, useStore } from '../lib/store'
import { Button, Modal } from '../components/ui'

type Stage = 'upload' | 'processing' | 'ready'

interface Photo {
  id: number
  name: string
  url?: string
}

const STEPS = ['Analysing photos', 'Detecting walls and windows', 'Mapping the floor', 'Placing tables']
const SAMPLES = ['dining-room.jpg', 'window-side.jpg', 'bar.jpg', 'entrance.jpg']

export function AddModelModal({ onClose, onReady }: { onClose: () => void; onReady: () => void }) {
  const { tables, setTableCount, setModelReady } = useStore()
  const { t } = useLang()
  const [stage, setStage] = useState<Stage>('upload')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [count, setCount] = useState(tables.length)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const added = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ id: nextId.current++, name: f.name, url: URL.createObjectURL(f) }))
    setPhotos((p) => [...p, ...added])
  }

  useEffect(() => {
    if (stage !== 'processing') return
    const started = Date.now()
    const duration = 3600
    const timer = setInterval(() => {
      const value = Math.min(1, (Date.now() - started) / duration)
      setProgress(value)
      if (value === 1) {
        clearInterval(timer)
        setTableCount(count)
        setModelReady(true)
        setStage('ready')
      }
    }, 60)
    return () => clearInterval(timer)
  }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const clamped = Math.min(MAX_TABLES, Math.max(MIN_TABLES, count || MIN_TABLES))

  return (
    <Modal title={t('Add Restaurant Model')} onClose={onClose}>
      {stage === 'upload' && (
        <div className="p-6">
          <h3 className="font-serif text-3xl">{t('Upload photos of your restaurant')}</h3>
          <p className="mt-1.5 text-sm text-stone-500">{t('A few photos from different corners are enough to build the floor.')}</p>

          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              addFiles(e.dataTransfer.files)
            }}
            className={`mt-5 flex w-full flex-col items-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors ${
              dragging ? 'border-ink bg-stone-100' : 'border-stone-300 bg-stone-50 hover:border-stone-400'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-600 shadow-soft">
              <ImagePlus size={18} strokeWidth={1.6} />
            </span>
            <span className="mt-3 text-sm font-medium">{t('Drop photos here or browse')}</span>
            <span className="mt-0.5 text-xs text-stone-500">{t('JPG or PNG, several at once')}</span>
          </button>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />

          {photos.length > 0 ? (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square animate-scale-in overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                  {photo.url ? (
                    <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-end bg-gradient-to-br from-stone-200 to-stone-100 p-1.5 text-[10px] leading-tight text-stone-500">
                      {photo.name}
                    </div>
                  )}
                  <button
                    aria-label={`Remove ${photo.name}`}
                    onClick={() => setPhotos((p) => p.filter((x) => x.id !== photo.id))}
                    className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-stone-600 opacity-0 shadow-sm transition group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <button
              className="mt-3 text-xs text-stone-500 underline decoration-stone-300 underline-offset-4 transition hover:text-ink"
              onClick={() => setPhotos(SAMPLES.map((name) => ({ id: nextId.current++, name })))}
            >
              {t('No photos at hand? Use sample photos')}
            </button>
          )}

          <label className="mt-6 flex items-center justify-between gap-4 border-t border-stone-100 pt-5">
            <span>
              <span className="block text-sm font-medium">{t('Number of tables')}</span>
              <span className="block text-xs text-stone-500">
                {t('Between {a} and {b}. You can fine-tune each table later.', { a: MIN_TABLES, b: MAX_TABLES })}
              </span>
            </span>
            <input
              type="number"
              min={MIN_TABLES}
              max={MAX_TABLES}
              value={count || ''}
              onChange={(e) => setCount(Number(e.target.value))}
              className="input w-20 text-center"
            />
          </label>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              disabled={photos.length === 0}
              onClick={() => {
                setCount(clamped)
                setStage('processing')
              }}
            >
              {t('Create model')}
            </Button>
          </div>
        </div>
      )}

      {stage === 'processing' && (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-ink" />
          <h3 className="mt-6 font-serif text-3xl">{t('Creating your restaurant model…')}</h3>
          <p className="mt-1.5 h-5 text-sm text-stone-500">{t(STEPS[Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))])}</p>
          <div className="mt-7 h-1 w-64 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-ink transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-3 text-xs text-stone-400">
            {t('Photos: {n} · Tables: {m}', { n: photos.length, m: clamped })}
          </p>
        </div>
      )}

      {stage === 'ready' && (
        <div className="flex animate-fade-up flex-col items-center px-6 py-14 text-center">
          <span className="flex h-12 w-12 animate-scale-in items-center justify-center rounded-full bg-ink text-white">
            <Check size={22} strokeWidth={2} />
          </span>
          <h3 className="mt-6 font-serif text-3xl">{t('Restaurant model ready')}</h3>
          <p className="mt-1.5 text-sm text-stone-500">
            {t('{n} tables placed. Review their characteristics in Manage Tables.', { n: tables.length })}
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={() => {
              onReady()
              onClose()
            }}
          >
            {t('View model')}
          </Button>
        </div>
      )}
    </Modal>
  )
}
