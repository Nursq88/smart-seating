import { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { importFromMenu, useImportState, type MenuSource } from '../lib/menuImport'

/**
 * Admin drop zone for the restaurant's menu. The file is read once for its dishes and prices
 * and then let go: guests see the resulting list, not the photo or PDF.
 */
export function MenuUpload() {
  const { t } = useLang()
  const { running } = useImportState()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState<string[]>([])

  const read = (list: FileList | null) => {
    if (!list?.length || running) return
    const sources: MenuSource[] = []
    const refused: string[] = []
    for (const file of Array.from(list)) {
      if (file.type === 'application/pdf') sources.push({ kind: 'pdf', blob: file })
      else if (file.type.startsWith('image/')) sources.push({ kind: 'image', blob: file })
      else refused.push(file.name)
    }
    setRejected(refused)
    importFromMenu(sources)
    if (input.current) input.current.value = ''
  }

  return (
    <section className="card p-6">
      <h2 className="text-[15px] font-semibold">{t('Your menu')}</h2>
      <p className="mt-0.5 text-sm text-stone-500">
        {t('Upload your menu and we will read the dishes and prices from it. Guests see the list, not the file.')}
      </p>

      <button
        type="button"
        disabled={running}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          read(e.dataTransfer.files)
        }}
        className={`mt-4 flex w-full flex-col items-center rounded-xl border border-dashed px-6 py-7 text-center transition-colors disabled:opacity-60 ${
          dragging ? 'border-ink bg-stone-100' : 'border-stone-300 bg-stone-50 hover:border-stone-400'
        }`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-600 shadow-soft">
          {running ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-ink" />
          ) : (
            <FileUp size={18} strokeWidth={1.6} />
          )}
        </span>
        <span className="mt-3 text-sm font-medium">{t('Drop menu files here or browse')}</span>
        <span className="mt-0.5 text-xs text-stone-500">{t('Photos of the pages (JPG, PNG) or a PDF')}</span>
      </button>
      <input ref={input} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => read(e.target.files)} />

      {rejected.length > 0 && (
        <p className="mt-3 animate-fade-in text-sm text-bronze-deep">
          {t('Could not add')}: {rejected.join(', ')}
        </p>
      )}
    </section>
  )
}
