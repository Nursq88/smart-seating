import { Baby, Briefcase, Cake, Heart, Utensils, Wine, type LucideIcon } from 'lucide-react'
import type { Purpose } from './types'

export const PURPOSES: { id: Purpose; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'romantic', label: 'Romantic date', hint: 'Quiet and private', icon: Heart },
  { id: 'birthday', label: 'Birthday', hint: 'Room to celebrate', icon: Cake },
  { id: 'family', label: 'Family dinner', hint: 'Comfortable for everyone', icon: Baby },
  { id: 'business', label: 'Business meeting', hint: 'Calm, easy to talk', icon: Briefcase },
  { id: 'friends', label: 'Friends', hint: 'Lively atmosphere', icon: Wine },
  { id: 'casual', label: 'Casual dinner', hint: 'Simply a good table', icon: Utensils },
]

export const PURPOSE_ICON = Object.fromEntries(PURPOSES.map((x) => [x.id, x.icon])) as Record<Purpose, LucideIcon>
