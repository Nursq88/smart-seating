import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Armchair, Check, Globe, X } from 'lucide-react'
import { LANGS, useLang } from '../lib/i18n'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
  full?: boolean
}

export function Button({ variant = 'primary', size = 'md', full, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-ink text-white hover:bg-graphite disabled:bg-stone-300 disabled:text-white',
    secondary: 'border border-stone-200 bg-white text-ink hover:border-stone-300 hover:bg-stone-50 disabled:text-stone-400',
    ghost: 'text-stone-600 hover:bg-stone-100 hover:text-ink disabled:text-stone-300',
  }
  const sizes = { md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-[15px]' }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed ${
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
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-w-[72px] rounded-md px-3 py-1.5 text-sm transition-all duration-200 ${
            option.value === value ? 'bg-white font-medium text-ink shadow-sm' : 'text-stone-500 hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
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
  side,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  /** Render as a panel docked to the right edge */
  side?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={`fixed inset-0 z-50 flex ${side ? 'justify-end' : 'items-center justify-center p-6'}`}>
      <div className="absolute inset-0 animate-fade-in bg-ink/25 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={
          side
            ? 'relative flex h-full w-full max-w-md animate-slide-in flex-col border-l border-stone-200 bg-white shadow-lift'
            : 'relative flex max-h-full w-full max-w-lg animate-scale-in flex-col rounded-2xl border border-stone-200 bg-white shadow-lift'
        }
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-ink">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-stone-500">{label}</span>
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
      <span className="text-sm font-semibold tracking-tight">Smart Seating</span>
    </span>
  )
}

/** Globe button with a small menu of the three interface languages. */
export function LangSwitch() {
  const { lang, setLang } = useLang()
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
        aria-label="Language"
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
