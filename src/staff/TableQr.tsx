import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import QRCode from 'qrcode'
import { useLang } from '../lib/i18n'
import { tableLink } from '../lib/store'

/** The QR code to print for a table. Scanning it opens the menu with orders tied to that table. */
export function TableQr({ tableId }: { tableId: number }) {
  const { t } = useLang()
  const link = tableLink(tableId)
  const [image, setImage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(link, { margin: 1, width: 320, color: { dark: '#1E1D1B', light: '#FFFFFF' } }).then((url) => alive && setImage(url))
    return () => {
      alive = false
    }
  }, [link])

  return (
    <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <div className="label">{t('QR code for the table')}</div>
      <div className="mt-3 flex items-center gap-4">
        {image && <img src={image} alt={link} className="h-24 w-24 shrink-0 rounded-lg border border-stone-200" />}
        <div className="min-w-0 text-sm">
          <p className="text-stone-500">{t('Guests scan it and order without a waiter.')}</p>
          <a href={image} download={`table-${tableId}-qr.png`} className="mt-1.5 block font-medium underline decoration-stone-300 underline-offset-4 hover:decoration-ink">
            {t('Download')}
          </a>
        </div>
      </div>
      <button
        onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true))}
        className="mt-3 flex w-full items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs text-stone-600 transition hover:border-stone-300"
      >
        <span className="min-w-0 flex-1 truncate font-mono">{link}</span>
        {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
      </button>
    </div>
  )
}
