import { useSyncExternalStore } from 'react'

/**
 * A value kept in localStorage and shared by every component (and browser tab) that uses it.
 * This is the whole "database" of the demo: one JSON document per key.
 */
export function createLocalStore<T>(key: string, init: () => T) {
  let value: T | undefined
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((fn) => fn())

  const write = (next: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(next))
      return true
    } catch {
      return false // quota exceeded or storage unavailable
    }
  }

  const get = (): T => {
    if (value === undefined) {
      try {
        const raw = localStorage.getItem(key)
        if (raw !== null) value = JSON.parse(raw) as T
      } catch {
        // fall through to defaults
      }
      if (value === undefined) {
        value = init()
        write(value)
      }
    }
    return value
  }

  /** Returns false when the browser refused to store the value. */
  const set = (next: T) => {
    const ok = write(next)
    if (ok) {
      value = next
      emit()
    }
    return ok
  }

  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      value = undefined
      emit()
    }
  })

  const subscribe = (fn: () => void) => {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }

  return { get, set, use: () => useSyncExternalStore(subscribe, get) }
}
