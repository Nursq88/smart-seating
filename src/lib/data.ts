import { defaultDecor } from './decor'
import { prefsFor } from './matching'
import type { Guest, GuestStatus, Level, Prefs, Purpose, Shape, Table, TableStatus } from './types'

function t(
  id: number,
  seats: number,
  shape: Shape,
  x: number,
  z: number,
  privacy: Level,
  noise: Level,
  spacing: Level,
  zone: string,
  status: TableStatus,
  flags: Partial<Pick<Table, 'window' | 'nearEntrance' | 'nearBar'>> = {},
): Table {
  return {
    id, seats, shape, x, z, privacy, noise, spacing, zone, status,
    window: false, nearEntrance: false, nearBar: false, ...flags,
  }
}

const W = { window: true }

export const INITIAL_TABLES: Table[] = [
  // Window wall
  t(1, 2, 'round', -10, -5.5, 2, 1, 2, 'Window', 'reserved', W),
  t(2, 2, 'round', -10, -2.5, 2, 1, 2, 'Window', 'available', W),
  t(3, 2, 'round', -10, 0.5, 2, 2, 2, 'Window', 'occupied', W),
  t(4, 2, 'round', -10, 3.5, 2, 1, 2, 'Window', 'occupied', W),
  t(12, 2, 'round', -10, 6.3, 3, 1, 2, 'Corner window', 'available', W),
  // Garden side
  t(5, 4, 'rect', -6.5, -6.2, 2, 1, 2, 'Garden window', 'reserved', W),
  t(6, 4, 'rect', -3, -6.2, 2, 2, 2, 'Garden window', 'occupied', W),
  t(7, 2, 'round', 0.5, -6.2, 1, 2, 1, 'Garden window', 'occupied', W),
  // Main room
  t(9, 4, 'rect', -6, -2.5, 2, 2, 2, 'Main room', 'occupied'),
  t(10, 4, 'rect', -2.5, -2.5, 1, 2, 1, 'Main room', 'available'),
  t(11, 4, 'rect', 1, -2.5, 1, 3, 1, 'Main room', 'occupied'),
  t(13, 4, 'rect', -6, 0.8, 2, 2, 2, 'Main room', 'reserved'),
  t(8, 6, 'round', -2.5, 0.8, 1, 3, 2, 'Centre', 'available'),
  t(14, 4, 'rect', 1, 0.8, 1, 2, 1, 'Main room', 'occupied'),
  t(15, 4, 'rect', -6, 4.1, 2, 1, 2, 'Main room', 'reserved'),
  t(16, 2, 'round', -2.5, 4.1, 1, 2, 1, 'Main room', 'occupied'),
  t(17, 2, 'round', 1, 4.1, 2, 2, 2, 'Main room', 'available'),
  t(19, 4, 'rect', -6, 6.6, 3, 1, 3, 'Alcove', 'available'),
  // Bar side
  t(20, 2, 'round', 5, -2.6, 1, 3, 1, 'Bar', 'occupied', { nearBar: true }),
  t(21, 4, 'rect', 8.5, -2.6, 1, 3, 1, 'Bar', 'reserved', { nearBar: true }),
  t(22, 4, 'rect', 5, 0.8, 2, 2, 2, 'Lounge', 'available'),
  t(18, 4, 'rect', 8.5, 0.8, 2, 2, 2, 'Lounge', 'occupied'),
  // Entrance
  t(23, 4, 'rect', 5, 4.1, 1, 2, 2, 'Entrance', 'occupied', { nearEntrance: true }),
  t(24, 2, 'round', 8.5, 4.1, 1, 3, 1, 'Entrance', 'available', { nearEntrance: true }),
  // Long table for big parties
  t(25, 10, 'rect', 1, 6.6, 2, 2, 2, 'Banquet', 'available'),
]

/** Every position a table can stand on: the original layout plus a few spare spots. */
export const SLOTS: [number, number][] = [
  ...INITIAL_TABLES.map((table): [number, number] => [table.x, table.z]),
  [-2.5, 6.6],
  [5.2, 6.6],
]

function g(
  id: number,
  name: string,
  purpose: Purpose,
  party: number,
  status: GuestStatus,
  time: string,
  tableId?: number,
  extra: Partial<Pick<Guest, 'allergy' | 'note' | 'decor'>> & { prefs?: Partial<Prefs> } = {},
): Guest {
  const { prefs, ...rest } = extra
  return { id, name, status, time, tableId, prefs: { ...prefsFor(purpose, party), ...prefs }, ...rest }
}

export const INITIAL_GUESTS: Guest[] = [
  // Arriving now
  g(104, 'Anna', 'romantic', 2, 'waiting', '19:30', undefined, {
    allergy: 'Nuts',
    decor: defaultDecor('romantic'),
  }),
  g(105, 'Daniyar', 'birthday', 6, 'waiting', '19:30', undefined, {
    note: 'Cake at 20:30',
    decor: { ...defaultDecor('birthday'), note: 'Happy Birthday sign' },
  }),
  g(106, 'Elena', 'business', 3, 'waiting', '19:45'),
  g(107, 'Sofia', 'family', 4, 'waiting', '19:45', undefined, { allergy: 'Gluten', note: 'High chair' }),
  // Seated
  g(88, 'Timur', 'casual', 2, 'seated', '18:10', 3, { prefs: { window: true } }),
  g(89, 'Aigerim', 'casual', 2, 'seated', '18:20', 4, { prefs: { window: true }, allergy: 'Shellfish' }),
  g(90, 'Marco', 'family', 4, 'seated', '18:30', 6),
  g(91, 'Liam', 'friends', 2, 'seated', '18:30', 7, { prefs: { nearBar: false } }),
  g(92, 'Aruzhan', 'family', 3, 'seated', '18:40', 9, { note: 'Stroller' }),
  g(93, 'Noah', 'birthday', 4, 'seated', '18:45', 11, { decor: defaultDecor('birthday') }),
  g(94, 'Dana', 'friends', 4, 'seated', '18:50', 14, { prefs: { nearBar: false } }),
  g(95, 'Yerlan', 'casual', 2, 'seated', '19:00', 16),
  g(96, 'Mia', 'business', 3, 'seated', '19:00', 18),
  g(97, 'Oliver', 'friends', 2, 'seated', '19:10', 20),
  g(98, 'Kamila', 'casual', 4, 'seated', '19:15', 23, { allergy: 'Lactose' }),
  // Later tonight
  g(110, 'Arman', 'family', 4, 'reserved', '20:00', 5, { prefs: { window: true } }),
  g(111, 'Julia', 'casual', 3, 'reserved', '20:15', 13),
  g(112, 'Sanzhar', 'romantic', 2, 'reserved', '20:30', 1, { note: 'Anniversary', decor: defaultDecor('romantic') }),
  g(113, 'Emma', 'friends', 4, 'reserved', '20:30', 21),
  g(114, 'Ruslan', 'business', 4, 'reserved', '21:00', 15, { allergy: 'Sesame' }),
]
