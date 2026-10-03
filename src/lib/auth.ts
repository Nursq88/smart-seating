import { useSyncExternalStore } from 'react'

/**
 * Staff sign-in. The PIN is checked in the browser, which keeps guests out of the staff screens
 * in a demo but is not real security: the code and the PIN ship to every visitor.
 * A production build needs a server that checks the PIN and only then serves staff data.
 */
export const STAFF_PIN = '0000'
const KEY = 'sse.staff'
const MAX_TRIES = 5
const LOCK_MS = 30_000

// sessionStorage: the panel locks itself again when the tab is closed.
const read = () => {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

let unlocked = read()
let tries = 0
let lockedUntil = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())

export function useStaffSession() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    () => unlocked,
  )
}

/** Seconds left before another attempt is allowed; 0 when not locked. */
export function lockSeconds() {
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
}

export function unlockStaff(pin: string) {
  if (lockSeconds() > 0) return false
  if (pin !== STAFF_PIN) {
    if (++tries >= MAX_TRIES) {
      tries = 0
      lockedUntil = Date.now() + LOCK_MS
    }
    return false
  }
  tries = 0
  unlocked = true
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // stays unlocked for this page only
  }
  emit()
  return true
}

export function lockStaff() {
  unlocked = false
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // storage unavailable
  }
  emit()
}

// Sign-in data of earlier versions is no longer used.
try {
  localStorage.removeItem('sse.session')
  localStorage.removeItem('sse.dishes')
} catch {
  // storage unavailable
}
