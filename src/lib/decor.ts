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

export function paletteLabel(decor: Decor) {
  return PALETTES.find((p) => p.id === decor.palette)?.label ?? 'Custom colours'
}
