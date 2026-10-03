import { useCallback } from 'react'
import { kk, ru } from './dictionary'
import { createLocalStore } from './local'

export type Lang = 'en' | 'ru' | 'kk'

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ru', label: 'Русский' },
  { id: 'kk', label: 'Қазақша' },
]

const DICT: Record<Lang, Record<string, string>> = { en: {}, ru, kk }

const store = createLocalStore<Lang>('sse.lang', () => 'en')

export type Vars = Record<string, string | number>
export type T = (key: string, vars?: Vars) => string

/** English text is the key; other languages look it up and fall back to English. */
export function translate(lang: Lang, key: string, vars?: Vars) {
  let text = DICT[lang][key] ?? key
  if (vars) for (const name in vars) text = text.split(`{${name}}`).join(String(vars[name]))
  return text
}

export function useLang() {
  const lang = store.use()
  const t = useCallback<T>((key, vars) => translate(lang, key, vars), [lang])
  return { lang, t, setLang: store.set }
}
