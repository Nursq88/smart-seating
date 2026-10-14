import type { Guest, Level, Match, Prefs, Purpose, Table } from './types'

export const LEVEL: Record<Level, string> = { 1: 'Low', 2: 'Medium', 3: 'High' }
export const SPACING: Record<Level, string> = { 1: 'Close', 2: 'Good', 3: 'Generous' }

export const PURPOSE_LABEL: Record<Purpose, string> = {
  romantic: 'Romantic date',
  birthday: 'Birthday',
  family: 'Family dinner',
  business: 'Business meeting',
  friends: 'Friends',
  casual: 'Casual dinner',
}

type Preset = Omit<Prefs, 'purpose' | 'party'>

/** Sensible starting preferences for each purpose of visit. */
export const PRESETS: Record<Purpose, Preset> = {
  romantic: { privacy: 3, quiet: 3, spacing: 3, window: true, nearEntrance: false, nearBar: false },
  birthday: { privacy: 1, quiet: 1, spacing: 2, window: false, nearEntrance: false, nearBar: false },
  family: { privacy: 2, quiet: 2, spacing: 2, window: false, nearEntrance: false, nearBar: false },
  business: { privacy: 3, quiet: 3, spacing: 2, window: false, nearEntrance: false, nearBar: false },
  friends: { privacy: 1, quiet: 1, spacing: 1, window: false, nearEntrance: false, nearBar: true },
  casual: { privacy: 2, quiet: 2, spacing: 2, window: false, nearEntrance: false, nearBar: false },
}

/** How much each characteristic matters for a given purpose. */
const WEIGHTS: Record<Purpose, { privacy: number; quiet: number; spacing: number }> = {
  romantic: { privacy: 3, quiet: 2.5, spacing: 1.5 },
  birthday: { privacy: 1, quiet: 1, spacing: 1.5 },
  family: { privacy: 1.5, quiet: 1.5, spacing: 2 },
  business: { privacy: 2.5, quiet: 3, spacing: 1.5 },
  friends: { privacy: 1, quiet: 1, spacing: 1 },
  casual: { privacy: 1.5, quiet: 1.5, spacing: 1.5 },
}

const SEAT_WEIGHT = 2
const TOGGLE_WEIGHT = 2

export function prefsFor(purpose: Purpose, party: number): Prefs {
  return { purpose, party, ...PRESETS[purpose] }
}

/** Falling short of a wish costs a lot; exceeding it costs a little. */
function closeness(want: number, have: number) {
  return have >= want ? 1 - (have - want) * 0.1 : 1 - (want - have) * 0.5
}

function seatFit(seats: number, party: number) {
  const spare = seats - party
  if (spare === 0) return 1
  if (spare === 1) return 0.9
  if (spare === 2) return 0.75
  if (spare === 3) return 0.55
  return 0.35
}

/** One criterion of the score: how much it counts and how well the table meets it (0–1). */
export interface ScorePart {
  /** Translation key naming the criterion */
  label: string
  weight: number
  value: number
}

/**
 * The criteria behind a table's score. Privacy, quietness and distance always count, with weights
 * that depend on the purpose; the table size always counts; window, entrance and bar only when asked for.
 */
export function scoreParts(prefs: Prefs, table: Table): ScorePart[] {
  const w = WEIGHTS[prefs.purpose]
  const parts: ScorePart[] = [
    { label: 'Privacy', weight: w.privacy, value: closeness(prefs.privacy, table.privacy) },
    { label: 'Quietness', weight: w.quiet, value: closeness(prefs.quiet, 4 - table.noise) },
    { label: 'Distance', weight: w.spacing, value: closeness(prefs.spacing, table.spacing) },
    { label: 'Table size', weight: SEAT_WEIGHT, value: seatFit(table.seats, prefs.party) },
  ]
  if (prefs.window) parts.push({ label: 'By the window', weight: TOGGLE_WEIGHT, value: table.window ? 1 : 0 })
  if (prefs.nearEntrance) parts.push({ label: 'Near entrance', weight: TOGGLE_WEIGHT, value: table.nearEntrance ? 1 : 0 })
  if (prefs.nearBar) parts.push({ label: 'Near bar', weight: TOGGLE_WEIGHT, value: table.nearBar ? 1 : 0 })
  return parts
}

/** Compatibility of a table with a guest's preferences, 0–100: the weighted average of its criteria. Null if the party does not fit. */
export function scoreTable(prefs: Prefs, table: Table): number | null {
  if (table.seats < prefs.party) return null
  const parts = scoreParts(prefs, table)
  const total = parts.reduce((sum, x) => sum + x.weight, 0)
  const earned = parts.reduce((sum, x) => sum + x.weight * x.value, 0)
  return Math.round((earned / total) * 100)
}

/** Plain-language strengths of the table, as translation keys. */
function reasons(prefs: Prefs, table: Table): string[] {
  const out: string[] = []
  if (table.window) out.push('By the window')
  if (table.noise === 1) out.push('Quiet area')
  else if (prefs.quiet === 1 && table.noise === 3) out.push('Lively area')
  if (prefs.privacy >= 2 && table.privacy === 3) out.push('Secluded spot')
  if (prefs.spacing >= 2 && table.spacing === 3) out.push('Plenty of room around')
  if (prefs.nearEntrance && table.nearEntrance) out.push('Near entrance')
  if (prefs.nearBar && table.nearBar) out.push('Near bar')
  if (table.seats === 2 && prefs.party === 2) out.push('Table for two')
  else if (table.seats === prefs.party) out.push('Exactly your party size')
  else if (table.seats - prefs.party === 1) out.push('One spare seat')
  return out
}

/** Preferences the table cannot satisfy, for the waiter to be aware of. */
export function unmet(prefs: Prefs, table: Table): string[] {
  const out: string[] = []
  if (table.privacy < prefs.privacy) out.push('Privacy')
  if (4 - table.noise < prefs.quiet) out.push('Quietness')
  if (table.spacing < prefs.spacing) out.push('Distance')
  if (prefs.window && !table.window) out.push('Window')
  if (prefs.nearEntrance && !table.nearEntrance) out.push('Near entrance')
  if (prefs.nearBar && !table.nearBar) out.push('Near bar')
  return out
}

/** The same gaps told to the guest in plain words. */
export function compromises(prefs: Prefs, table: Table): string[] {
  const out: string[] = []
  if (prefs.window && !table.window) out.push('Not by the window')
  if (4 - table.noise < prefs.quiet) out.push('Noisier than you asked')
  if (table.privacy < prefs.privacy) out.push('Less secluded than you asked')
  if (table.spacing < prefs.spacing) out.push('Neighbours closer than you asked')
  if (prefs.nearEntrance && !table.nearEntrance) out.push('Not near the entrance')
  if (prefs.nearBar && !table.nearBar) out.push('Not near the bar')
  if (table.seats - prefs.party >= 2) out.push('More seats than you need')
  return out
}

/** Rank every free table (plus one optionally held for the guest) by compatibility. */
export function rankTables(prefs: Prefs, tables: Table[], heldId?: number): Match[] {
  const out: Match[] = []
  for (const table of tables) {
    if (table.status !== 'available' && table.id !== heldId) continue
    const score = scoreTable(prefs, table)
    if (score === null) continue
    out.push({ table, score, reasons: reasons(prefs, table) })
  }
  return out.sort((a, b) => b.score - a.score || a.table.id - b.table.id)
}

/** Match of a guest with their table, or with the best free table if none is held yet. */
export function guestMatch(guest: Guest, tables: Table[]): { tableId: number; score: number } | null {
  if (guest.tableId !== undefined) {
    const table = tables.find((t) => t.id === guest.tableId)
    const score = table ? scoreTable(guest.prefs, table) : null
    if (table && score !== null) return { tableId: table.id, score }
  }
  const best = rankTables(guest.prefs, tables)[0]
  return best ? { tableId: best.table.id, score: best.score } : null
}
