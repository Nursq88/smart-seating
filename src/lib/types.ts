export type Level = 1 | 2 | 3

export type Purpose = 'romantic' | 'birthday' | 'family' | 'business' | 'friends' | 'casual'

export type TableStatus = 'available' | 'occupied' | 'reserved'

export type Shape = 'round' | 'rect'

export interface Table {
  id: number
  seats: number
  shape: Shape
  x: number
  z: number
  privacy: Level
  noise: Level
  /** Distance from neighbouring tables */
  spacing: Level
  window: boolean
  nearEntrance: boolean
  nearBar: boolean
  zone: string
  status: TableStatus
}

export interface Prefs {
  purpose: Purpose
  party: number
  privacy: Level
  quiet: Level
  spacing: Level
  window: boolean
  nearEntrance: boolean
  nearBar: boolean
}

export type GuestStatus = 'waiting' | 'reserved' | 'seated'

export interface Guest {
  id: number
  name: string
  prefs: Prefs
  status: GuestStatus
  /** Table held for or occupied by the guest */
  tableId?: number
  time: string
  allergy?: string
  note?: string
  decor?: Decor
}

export type Flowers = 'roses' | 'peonies' | 'tulips' | 'wild' | 'none'

/** How the guest would like their table dressed for the occasion. */
export interface Decor {
  palette: string
  cloth: string
  accent: string
  bloom: string
  flowers: Flowers
  balloons: boolean
  candles: boolean
  petals: boolean
  banner?: boolean
  cake?: boolean
  gifts?: boolean
  wine?: boolean
  note?: string
}

export interface Match {
  table: Table
  score: number
  reasons: string[]
}

/** Where the visitor is: the two guest screens, or the staff area. */
export type Route = 'guest' | 'menu' | 'table' | 'staff'
