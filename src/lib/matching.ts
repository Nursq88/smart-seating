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

/** Compatibility of a table with a guest's preferences, 0–100. Null if the party does not fit. */
export function scoreTable(prefs: Prefs, table: Table): number | null {
  if (table.seats < prefs.party) return null
  const w = WEIGHTS[prefs.purpose]
  const parts: [number, number][] = [
    [w.privacy, closeness(prefs.privacy, table.privacy)],
    [w.quiet, closeness(prefs.quiet, 4 - table.noise)],
    [w.spacing, closeness(prefs.spacing, table.spacing)],
    [SEAT_WEIGHT, seatFit(table.seats, prefs.party)],
  ]
  if (prefs.window) parts.push([TOGGLE_WEIGHT, table.window ? 1 : 0])
  if (prefs.nearEntrance) parts.push([TOGGLE_WEIGHT, table.nearEntrance ? 1 : 0])
  if (prefs.nearBar) parts.push([TOGGLE_WEIGHT, table.nearBar ? 1 : 0])

  const total = parts.reduce((sum, [weight]) => sum + weight, 0)
  const earned = parts.reduce((sum, [weight, value]) => sum + weight * value, 0)
  return Math.round((earned / total) * 100)
}

/** Translation keys describing what the table gets right. */
function reasons(prefs: Prefs, table: Table): string[] {
  const out: string[] = []
  if (prefs.privacy >= 2 && table.privacy >= prefs.privacy) out.push(table.privacy === 3 ? 'High privacy' : 'Medium privacy')
  if (prefs.quiet >= 2 && 4 - table.noise >= prefs.quiet) out.push(table.noise === 1 ? 'Quiet' : 'Moderate noise')
  if (prefs.quiet === 1 && table.noise >= 2) out.push('Lively')
  if (prefs.spacing >= 2 && table.spacing >= prefs.spacing) out.push(table.spacing === 3 ? 'Generous spacing' : 'Good spacing')
  if (prefs.window && table.window) out.push('By the window')
  if (prefs.nearEntrance && table.nearEntrance) out.push('Near entrance')
  if (prefs.nearBar && table.nearBar) out.push('Near bar')
  if (table.seats === prefs.party) out.push('Right size')
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
