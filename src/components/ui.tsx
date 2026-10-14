import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Armchair, Check, Globe, Minus, Plus, X } from 'lucide-react'
import { LANGS, useLang } from '../lib/i18n'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
  full?: boolean
}

export function Button({ variant = 'primary', size = 'md', full, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-ink text-white hover:bg-graphite disabled:bg-stone-300 disabled:text-white',
    secondary: 'border border-stone-200 bg-white text-ink hover:border-stone-300 hover:bg-stone-50 disabled:text-stone-500',
    ghost: 'text-stone-600 hover:bg-stone-100 hover:text-ink disabled:text-stone-300',
  }
  // Large buttons may wrap on narrow phones, so they grow instead of clipping the label.
  const sizes = { md: 'h-10 px-4 text-sm', lg: 'min-h-[48px] px-5 py-2 text-[15px] leading-tight sm:px-6' }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed ${
        variants[variant]
      } ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  full,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  /** Read out by screen readers for the whole group */
  label?: string
  /** Stretch to the width of the parent */
  full?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`${full ? 'flex w-full' : 'inline-flex'} rounded-lg border border-stone-200 bg-stone-100 p-0.5`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`min-h-[36px] rounded-md px-3 py-1.5 text-sm transition-all duration-200 ${full ? 'flex-1' : 'min-w-[72px]'} ${
            option.value === value ? 'bg-white font-medium text-ink shadow-sm' : 'text-stone-600 hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  labelledBy,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  /** Id of the visible text that names the switch */
  labelledBy?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-ink' : 'bg-stone-300'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  side,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  /** Stays in view below the scrolling content */
  footer?: ReactNode
  /** Render as a panel docked to the right edge */
  side?: boolean
}) {
  const { t } = useLang()
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    // Focus moves into the dialog and comes back to whatever opened it.
    const opener = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close.current()
      if (e.key !== 'Tab' || !panel.current) return
      // Keep Tab inside the dialog.
      const items = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [])

  // Rendered at the end of <body>: an animated ancestor would otherwise trap the fixed overlay inside itself.
  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${side ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6'}`}>
      <div className="absolute inset-0 animate-fade-in bg-ink/25 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={
          side
            ? 'relative flex h-full w-full max-w-md animate-slide-in flex-col border-l border-stone-200 bg-white shadow-lift outline-none'
            : 'relative flex max-h-[92%] w-full max-w-lg animate-scale-in flex-col rounded-t-2xl border border-stone-200 bg-white shadow-lift outline-none sm:max-h-full sm:rounded-2xl'
        }
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-3 sm:px-6">
          <h2 id={titleId} className="text-[15px] font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('Close dialog')}
            className="-mr-2 rounded-md p-2 text-stone-500 transition hover:bg-stone-100 hover:text-ink"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-stone-200 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** − value + control for quantities. */
export function Counter({
  value,
  min,
  max,
  onChange,
  less,
  more,
  compact,
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  /** Accessible names of the two buttons */
  less: string
  more: string
  compact?: boolean
}) {
  const pad = compact ? 'p-2' : 'p-2.5'
  return (
    <div className="flex items-center rounded-lg border border-stone-200 bg-white">
      <button type="button" aria-label={less} className={`${pad} text-stone-600 transition hover:text-ink disabled:text-stone-300`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={15} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label={more} className={`${pad} text-stone-600 transition hover:text-ink disabled:text-stone-300`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={15} />
      </button>
    </div>
  )
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-stone-600">{label}</span>
      <span className="text-right font-medium text-ink">{children}</span>
    </div>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white">
        <Armchair size={15} strokeWidth={1.75} />
      </span>
      <span className="hidden whitespace-nowrap text-sm font-semibold tracking-tight min-[350px]:inline">Smart Seating</span>
    </span>
  )
}

/** Globe button with a small menu of the three interface languages. */
export function LangSwitch() {
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        aria-label={`${t('Language')}: ${LANGS.find((x) => x.id === lang)?.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((x) => !x)}
        className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium uppercase transition-colors ${
          open ? 'border-stone-300 bg-stone-100 text-ink' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-ink'
        }`}
      >
        <Globe size={15} strokeWidth={1.6} />
        {lang}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-40 animate-scale-in rounded-xl border border-stone-200 bg-white p-1 shadow-lift">
          {LANGS.map((x) => (
            <button
              key={x.id}
              lang={x.id}
              role="menuitemradio"
              aria-checked={x.id === lang}
              onClick={() => {
                setLang(x.id)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-stone-100 ${
                x.id === lang ? 'font-medium text-ink' : 'text-stone-600'
              }`}
            >
              {x.label}
              {x.id === lang && <Check size={14} strokeWidth={2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
