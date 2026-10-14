import type { Decor, Flowers, Purpose } from './types'

export interface Palette {
  id: string
  label: string
  cloth: string
  accent: string
  bloom: string
}

export const PALETTES: Palette[] = [
  { id: 'blush', label: 'Blush & gold', cloth: '#F6E9E4', accent: '#C9A45C', bloom: '#E3A6A8' },
  { id: 'sage', label: 'Sage & ivory', cloth: '#F4EFE4', accent: '#8FA086', bloom: '#F7F3EA' },
  { id: 'midnight', label: 'Midnight & gold', cloth: '#2F374A', accent: '#C9A45C', bloom: '#F1E7D8' },
  { id: 'lavender', label: 'Lavender', cloth: '#F1ECF6', accent: '#9A88B8', bloom: '#C5B6DD' },
  { id: 'terracotta', label: 'Terracotta', cloth: '#F0DFCB', accent: '#B9694A', bloom: '#E0926E' },
  { id: 'classic', label: 'Classic white', cloth: '#FFFFFF', accent: '#B9B0A2', bloom: '#FFFFFF' },
]

export const FLOWERS: { id: Flowers; label: string }[] = [
  { id: 'roses', label: 'Roses' },
  { id: 'peonies', label: 'Peonies' },
  { id: 'tulips', label: 'Tulips' },
  { id: 'wild', label: 'Wildflowers' },
  { id: 'none', label: 'No flowers' },
]

function fromPalette(id: string, rest: Omit<Decor, 'palette' | 'cloth' | 'accent' | 'bloom'>): Decor {
  const { cloth, accent, bloom } = PALETTES.find((p) => p.id === id) ?? PALETTES[0]
  return { palette: id, cloth, accent, bloom, ...rest }
}

/** Occasions where we offer table styling up front. */
export function isCelebration(purpose: Purpose) {
  return purpose === 'birthday' || purpose === 'romantic'
}

export function defaultDecor(purpose: Purpose): Decor {
  if (purpose === 'birthday')
    return fromPalette('blush', { flowers: 'peonies', balloons: true, candles: false, petals: false, banner: true, cake: true, gifts: true })
  if (purpose === 'romantic')
    return fromPalette('midnight', { flowers: 'roses', balloons: false, candles: true, petals: true, wine: true })
  if (purpose === 'business') return fromPalette('classic', { flowers: 'none', balloons: false, candles: false, petals: false })
  return fromPalette('sage', { flowers: 'wild', balloons: false, candles: true, petals: false })
}

/**
 * Where a guest starts when they turn table styling on: the occasion's colours and nothing paid on top.
 * Flowers and extras are only added when the guest picks them.
 */
export function startDecor(purpose: Purpose): Decor {
  const { palette, cloth, accent, bloom } = defaultDecor(purpose)
  return { palette, cloth, accent, bloom, flowers: 'none', balloons: false, candles: false, petals: false }
}

/** The occasion's usual set, offered as suggestions the guest can add one by one. */
export function suggestions(purpose: Purpose): { flowers?: Flowers; extras: ExtraKey[] } {
  const usual = defaultDecor(purpose)
  return {
    flowers: usual.flowers === 'none' ? undefined : usual.flowers,
    extras: EXTRAS.map(([key]) => key).filter((key) => usual[key]),
  }
}

/** Large pieces the guest can add or remove. */
export const EXTRAS = [
  ['banner', 'Banner'],
  ['balloons', 'Balloons'],
  ['cake', 'Cake'],
  ['gifts', 'Gifts'],
  ['wine', 'Wine'],
  ['candles', 'Candles'],
  ['petals', 'Petals'],
] as const

export type ExtraKey = (typeof EXTRAS)[number][0]

/**
 * Prices in tenge. The restaurant has not published what table styling costs, so these are
 * placeholders for the demo: every screen that shows them labels them as demo prices.
 */
export const DECOR_PRICES_ARE_DEMO = true

const PRICE = {
  base: 3000,
  flowers: { roses: 9000, peonies: 12000, tulips: 7000, wild: 6000, none: 0 } as Record<Flowers, number>,
  extras: { banner: 4000, balloons: 6000, cake: 15000, gifts: 5000, wine: 18000, candles: 2000, petals: 3000 } as Record<ExtraKey, number>,
}

export const BASE_STYLING = 'Tablecloth and napkins in your colours'

export const flowerPrice = (flowers: Flowers) => PRICE.flowers[flowers]
export const extraPrice = (key: ExtraKey) => PRICE.extras[key]
export const basePrice = () => PRICE.base

/** What the guest has chosen, one line per paid item, labels as translation keys. */
export function decorLines(decor: Decor): { label: string; price: number }[] {
  const lines = [{ label: BASE_STYLING, price: PRICE.base }]
  if (decor.flowers !== 'none') lines.push({ label: FLOWERS.find((f) => f.id === decor.flowers)!.label, price: PRICE.flowers[decor.flowers] })
  for (const [key, label] of EXTRAS) if (decor[key]) lines.push({ label, price: PRICE.extras[key] })
  return lines
}

export function decorTotal(decor: Decor) {
  return decorLines(decor).reduce((sum, line) => sum + line.price, 0)
}

export function paletteLabel(decor: Decor) {
  return PALETTES.find((p) => p.id === decor.palette)?.label ?? 'Custom colours'
}
