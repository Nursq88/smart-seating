import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { defaultDecor } from '../lib/decor'
import type { Decor, Purpose, Table } from '../lib/types'

const BASE = '#3A3835'
const TOP_Y = 0.8

type Shaped = Pick<Table, 'seats' | 'shape'>

/** Footprint of a table including its chairs. */
export function tableRadius(table: Shaped) {
  if (table.shape === 'rect') return rectWidth(table) / 2 + 0.55
  return topRadius(table) + 0.7
}

function topRadius(table: Shaped) {
  return table.seats <= 2 ? 0.5 : table.seats <= 4 ? 0.65 : 0.85
}

function rectWidth(table: Shaped) {
  return Math.max(1.3, Math.ceil(table.seats / 2) * 0.62)
}

function chairSpots(table: Shaped): [number, number][] {
  if (table.shape === 'rect') {
    const far = Math.ceil(table.seats / 2)
    const near = table.seats - far
    const row = (n: number, z: number) =>
      Array.from({ length: n }, (_, i): [number, number] => [(i - (n - 1) / 2) * 0.62, z])
    return [...row(far, -0.8), ...row(near, 0.8)]
  }
  const r = topRadius(table) + 0.4
  return Array.from({ length: table.seats }, (_, i): [number, number] => {
    const a = (i / table.seats) * Math.PI * 2
    return [Math.cos(a) * r, Math.sin(a) * r]
  })
}

function Chair({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, Math.atan2(x, z), 0]}>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.42, 0.07, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.72, 0.2]} castShadow>
        <boxGeometry args={[0.42, 0.46, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.14, 0.17, 0.44, 12]} />
        <meshStandardMaterial color={BASE} roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Gentle floating motion for celebratory props. */
function Bob({ y = 0, amp = 0.04, speed = 1.4, spin = 0, swing = 0, children }: {
  y?: number
  amp?: number
  speed?: number
  spin?: number
  /** Turn gently from side to side instead of spinning all the way round */
  swing?: number
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const group = ref.current
    if (!group) return
    group.position.y = y + Math.sin(clock.elapsedTime * speed) * amp
    if (spin) group.rotation.y = clock.elapsedTime * spin
    if (swing) group.rotation.y = Math.sin(clock.elapsedTime * 0.7) * swing
  })
  return <group ref={ref}>{children}</group>
}

/** Leans slightly back and forth around its anchor, like something light in moving air. */
function Sway({ phase = 0, amount = 0.035, children }: { phase?: number; amount?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.9 + phase) * amount
    ref.current.rotation.x = Math.cos(clock.elapsedTime * 0.7 + phase) * amount * 0.85
  })
  return <group ref={ref}>{children}</group>
}

function Flame({ position, size = 1 }: { position: [number, number, number]; size?: number }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.emissiveIntensity = 2.2 + Math.sin(clock.elapsedTime * 9) * 0.5 + Math.sin(clock.elapsedTime * 23) * 0.3
  })
  return (
    <group position={position} scale={size}>
      <mesh scale={[1, 1.8, 1]}>
        <sphereGeometry args={[0.02, 10, 8]} />
        <meshStandardMaterial ref={ref} color="#FFD28A" emissive="#FFB648" emissiveIntensity={2.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshBasicMaterial color="#FFC774" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  )
}

const GOLD = '#C9A45C'
const STEM = '#6F8466'
const WILD = ['#F3E3A0', '#FFFFFF', '#E7B7C8']

function Centrepiece({ decor, at }: { decor: Decor; at: [number, number] }) {
  const { flowers, bloom, accent } = decor
  if (flowers === 'none') return null
  return (
    <group position={[at[0], TOP_Y + 0.012, at[1]]} scale={1.5}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.035, 0.14, 16]} />
        <meshStandardMaterial color="#F4F0E8" roughness={0.3} />
      </mesh>
      {flowers === 'roses' &&
        Array.from({ length: 7 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          const r = i === 6 ? 0 : 0.062
          return (
            <mesh key={i} position={[Math.cos(a) * r, i === 6 ? 0.235 : 0.2, Math.sin(a) * r]} castShadow>
              <sphereGeometry args={[0.042, 12, 10]} />
              <meshStandardMaterial color={bloom} roughness={0.7} />
            </mesh>
          )
        })}
      {flowers === 'peonies' &&
        Array.from({ length: 5 }, (_, i) => {
          const a = (i / 4) * Math.PI * 2
          const r = i === 4 ? 0 : 0.075
          return (
            <mesh key={i} position={[Math.cos(a) * r, i === 4 ? 0.25 : 0.2, Math.sin(a) * r]} castShadow>
              <icosahedronGeometry args={[0.066, 1]} />
              <meshStandardMaterial color={bloom} roughness={0.85} flatShading />
            </mesh>
          )
        })}
      {flowers === 'tulips' &&
        Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <group key={i} rotation={[Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32]}>
              <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.22, 6]} />
                <meshStandardMaterial color={STEM} />
              </mesh>
              <mesh position={[0, 0.33, 0]} scale={[1, 1.6, 1]} castShadow>
                <sphereGeometry args={[0.032, 10, 8]} />
                <meshStandardMaterial color={i % 2 ? bloom : accent} roughness={0.6} />
              </mesh>
            </group>
          )
        })}
      {flowers === 'wild' &&
        Array.from({ length: 10 }, (_, i) => {
          const a = i * 2.4
          const r = 0.03 + (i % 4) * 0.022
          const y = 0.19 + ((i * 5) % 7) * 0.02
          return (
            <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
              <sphereGeometry args={[0.024, 8, 6]} />
              <meshStandardMaterial color={i % 3 === 0 ? bloom : WILD[i % WILD.length]} roughness={0.8} />
            </mesh>
          )
        })}
      <mesh position={[0, 0.165, 0]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshStandardMaterial color={STEM} roughness={0.95} />
      </mesh>
    </group>
  )
}

/** Tall taper candles on a gold stand. */
function Candelabra({ position }: { position: [number, number, number] }) {
  const arms: [number, number][] = [[0, 0.5], [-0.13, 0.4], [0.13, 0.4]]
  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.03, 20]} />
        <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.014, 0.02, 0.26, 10]} />
        <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.018, 0.018]} />
        <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.5} />
      </mesh>
      {arms.map(([x, top], i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, (0.2 + top) / 2, 0]} castShadow>
            <cylinderGeometry args={[0.017, 0.017, top - 0.2, 10]} />
            <meshStandardMaterial color="#FBF6EC" roughness={0.6} />
          </mesh>
          <Flame position={[0, top + 0.035, 0]} />
        </group>
      ))}
    </group>
  )
}

function Balloons({ colors, position, phase = 0 }: { colors: string[]; position: [number, number, number]; phase?: number }) {
  const spots: [number, number, number][] = [
    [0, 2.55, 0],
    [0.32, 2.25, 0.14],
    [-0.26, 2.12, -0.2],
    [0.05, 2.0, 0.3],
  ]
  return (
    <group position={position}>
      {spots.map(([x, y, z], i) => (
        <Sway key={i} phase={phase + i * 1.7}>
          <mesh position={[x / 2, y / 2 + 0.1, z / 2]} rotation={[z / (y * 1.2), 0, -x / (y * 1.2)]}>
            <cylinderGeometry args={[0.005, 0.005, y - 0.25, 4]} />
            <meshBasicMaterial color="#B9B0A2" />
          </mesh>
          <mesh position={[x, y, z]} scale={[1, 1.18, 1]} castShadow>
            <sphereGeometry args={[0.25, 22, 18]} />
            <meshStandardMaterial color={colors[i % colors.length]} roughness={0.25} />
          </mesh>
        </Sway>
      ))}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 0.14, 12]} />
        <meshStandardMaterial color={BASE} roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Bunting between two poles, spanning the table. */
function Banner({ span, colors }: { span: number; colors: string[] }) {
  const height = 2.35
  const count = Math.max(7, Math.round(span / 0.34))
  const flag = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.13, 0)
    s.lineTo(0.13, 0)
    s.lineTo(0, -0.3)
    s.closePath()
    return s
  }, [])
  return (
    <group>
      {[-span / 2, span / 2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, height / 2, 0]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, height, 8]} />
            <meshStandardMaterial color={GOLD} roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.06, 20]} />
            <meshStandardMaterial color={BASE} roughness={0.6} />
          </mesh>
          <mesh position={[0, height + 0.04, 0]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshStandardMaterial color={GOLD} roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: count }, (_, i) => {
        const u = (i + 0.5) / count
        const x = (u - 0.5) * span
        // The line sags towards the middle.
        const y = height - 0.02 - Math.sin(u * Math.PI) * 0.28
        return (
          <Sway key={i} phase={i * 0.9} amount={0.02}>
            <mesh position={[x, y, 0]} rotation={[0, 0, (u - 0.5) * -0.5]}>
              <shapeGeometry args={[flag]} />
              <meshStandardMaterial color={colors[i % colors.length]} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          </Sway>
        )
      })}
    </group>
  )
}

/** Three-tier cake on a stand, with lit candles. */
function Cake({ position, colors, scale = 1 }: { position: [number, number, number]; colors: string[]; scale?: number }) {
  const tiers: [number, number, number][] = [
    [0.2, 0.13, 0.115],
    [0.145, 0.12, 0.24],
    [0.095, 0.11, 0.355],
  ]
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.04, 20]} />
        <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.012, 32]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {tiers.map(([r, h, y], i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[r, r, h, 32]} />
            <meshStandardMaterial color="#FBF4E8" roughness={0.6} />
          </mesh>
          <mesh position={[0, h / 2 - 0.012, 0]}>
            <cylinderGeometry args={[r + 0.006, r + 0.006, 0.03, 32]} />
            <meshStandardMaterial color={colors[i % colors.length]} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        const [x, z] = [Math.cos(a) * 0.045, Math.sin(a) * 0.045]
        return (
          <group key={i} position={[x, 0.41, z]}>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.08, 6]} />
              <meshStandardMaterial color={colors[(i + 1) % colors.length]} />
            </mesh>
            <Flame position={[0, 0.1, 0]} size={0.6} />
          </group>
        )
      })}
    </group>
  )
}

function Gift({ size, color, position }: { size: number; color: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[size, size * 0.8, size]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 1.02, size * 0.82, size * 0.16]} />
        <meshStandardMaterial color={GOLD} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 0.16, size * 0.82, size * 1.02]} />
        <meshStandardMaterial color={GOLD} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, size * 0.46, 0]}>
        <sphereGeometry args={[size * 0.13, 10, 8]} />
        <meshStandardMaterial color={GOLD} roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  )
}

function Gifts({ position, colors }: { position: [number, number, number]; colors: string[] }) {
  return (
    <group position={position}>
      <Gift size={0.52} color={colors[0]} position={[0, 0.208, 0]} />
      <Gift size={0.36} color={colors[1]} position={[0.5, 0.144, 0.12]} />
      <Gift size={0.3} color={colors[2]} position={[0.2, 0.12, 0.48]} />
      <Bob y={0.56} amp={0.035} speed={2} spin={0.5}>
        <Gift size={0.26} color={colors[2]} position={[0, 0, 0]} />
      </Bob>
    </group>
  )
}

const GLASS = { color: '#F3EBDD', roughness: 0.05, transparent: true, opacity: 0.45 } as const

function WineGlass({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.04, 0.045, 0.01, 16]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.12, 6]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      <mesh position={[0, 0.175, 0]}>
        <cylinderGeometry args={[0.05, 0.03, 0.11, 16]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      <mesh position={[0, 0.155, 0]}>
        <cylinderGeometry args={[0.04, 0.028, 0.06, 16]} />
        <meshStandardMaterial color="#6E1F2B" roughness={0.2} />
      </mesh>
    </group>
  )
}

function Bottle({ position, tilt = 0 }: { position: [number, number, number]; tilt?: number }) {
  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.26, 16]} />
        <meshStandardMaterial color="#2F3D33" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.016, 0.042, 0.1, 16]} />
        <meshStandardMaterial color="#2F3D33" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.09, 12]} />
        <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.047, 0.047, 0.1, 16]} />
        <meshStandardMaterial color="#F4EFE4" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Wine cooler on a stand beside the table, plus two poured glasses. */
function Wine({ stand, glasses }: { stand: [number, number, number]; glasses: [number, number, number][] }) {
  return (
    <group>
      <group position={stand}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.04, 20]} />
          <meshStandardMaterial color={BASE} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.68, 8]} />
          <meshStandardMaterial color={BASE} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.84, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.13, 0.3, 24]} />
          <meshStandardMaterial color="#D8D4CC" roughness={0.25} metalness={0.7} />
        </mesh>
        <Bottle position={[0.02, 0.78, 0]} tilt={-0.22} />
      </group>
      {glasses.map((position, i) => (
        <WineGlass key={i} position={position} />
      ))}
    </group>
  )
}

function heartShape() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.11)
  s.bezierCurveTo(-0.22, 0.03, -0.12, 0.17, 0, 0.07)
  s.bezierCurveTo(0.12, 0.17, 0.22, 0.03, 0, -0.11)
  return s
}

/** Faces the usual viewing direction and only turns a little, so it never shows edge-on. */
function Heart({ facing }: { facing: number }) {
  const heart = useMemo(heartShape, [])
  return (
    <group rotation={[0, facing, 0]}>
    <Bob y={2.05} amp={0.06} speed={1.2} swing={0.5}>
      <mesh position={[0, 0, -0.07]} scale={2.8} castShadow>
        <extrudeGeometry args={[heart, { depth: 0.055, bevelEnabled: false }]} />
        <meshStandardMaterial color="#C4626F" roughness={0.4} />
      </mesh>
    </Bob>
    </group>
  )
}

/** Which large pieces to set up around a table. */
interface Pieces {
  banner?: boolean
  cake?: boolean
  gifts?: boolean
  balloons?: boolean
  wine?: boolean
  candles?: boolean
  petals?: boolean
  heart?: boolean
}

/** What an occupied table shows when the guest did not order styling: the occasion's usual set. */
function usualPieces(purpose?: Purpose): Pieces {
  if (purpose === 'birthday') return { banner: true, cake: true, gifts: true, balloons: true }
  if (purpose === 'romantic') return { wine: true, candles: true, heart: true }
  return {}
}

/**
 * The big, visible part of the styling: banner, balloons, cake, gifts, wine, candles.
 * Everything is laid out along one axis that runs between the chairs.
 */
function Celebration({ table, look, pieces }: { table: Shaped; look: Decor; pieces: Pieces }) {
  const rect = table.shape === 'rect'
  const reach = rect ? rectWidth(table) / 2 : topRadius(table)
  const top = TOP_Y + 0.02
  // Round tables: aim between two chairs. Rectangular ones: along the table, past its short ends.
  const angle = rect ? 0 : Math.PI / table.seats
  const out = reach + (rect ? 0.55 : 0.95)
  const colors = [look.accent, look.bloom, look.cloth]
  const small = !rect && table.seats <= 2

  const floorPetals = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i): [number, number] => {
        const a = i * 2.39996
        const d = reach + 0.25 + (((i * 61) % 100) / 100) * 1.1
        return [Math.cos(a) * d * (rect ? 1.15 : 1), Math.sin(a) * d]
      }),
    [reach, rect],
  )

  return (
    <group rotation={[0, -angle, 0]}>
      {pieces.banner && <Banner span={out * 2} colors={colors} />}
      {pieces.balloons && (
        <>
          <Balloons colors={colors} position={[out + 0.05, 0, 0.3]} />
          <Balloons colors={[look.bloom, look.cloth, look.accent]} position={[-out - 0.05, 0, -0.3]} phase={2} />
        </>
      )}
      {pieces.gifts && <Gifts position={[out * 0.55, 0, rect ? 1.75 : out + 0.2]} colors={colors} />}
      {pieces.cake && <Cake position={[0, top, 0]} colors={colors} scale={small ? 0.8 : 1.15} />}
      {pieces.wine && (
        <Wine
          stand={[out - 0.1, 0, rect ? -0.2 : 0]}
          glasses={[
            [small ? 0.2 : 0.3, top, 0.12],
            [small ? -0.2 : -0.3, top, -0.12],
          ]}
        />
      )}
      {pieces.candles && <Candelabra position={[pieces.cake ? (rect ? 0.5 : reach - 0.22) : 0, top, pieces.cake ? 0 : small ? 0 : 0.04]} />}
      {pieces.heart && <Heart facing={angle + 0.55} />}
      {pieces.petals &&
        floorPetals.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, i]}>
            <circleGeometry args={[0.055, 8]} />
            <meshStandardMaterial color={look.bloom} roughness={0.8} />
          </mesh>
        ))}
    </group>
  )
}

/** Tablecloth, place settings and flowers chosen by the guest. */
function TableDecor({ table, decor, spots, crowded }: { table: Shaped; decor: Decor; spots: [number, number][]; crowded: boolean }) {
  const rect = table.shape === 'rect'
  const width = rectWidth(table)
  const r = topRadius(table)
  const y = TOP_Y + 0.004

  const petals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i): [number, number] => {
        const a = i * 2.39996
        const d = 0.16 + (((i * 37) % 100) / 100) * (rect ? 0.22 : r - 0.3)
        return [Math.cos(a) * d * (rect ? width / 0.9 : 1), Math.sin(a) * d]
      }),
    [rect, r, width],
  )

  return (
    <group>
      {/* Cloth with a long drop over the edge */}
      <mesh position={[0, y - 0.12, 0]} castShadow>
        {rect ? <boxGeometry args={[width + 0.06, 0.25, 0.92]} /> : <cylinderGeometry args={[r + 0.025, r + 0.06, 0.25, 48]} />}
        <meshStandardMaterial color={decor.cloth} roughness={0.9} />
      </mesh>
      {rect && (
        <mesh position={[0, y + 0.004, 0]}>
          <boxGeometry args={[width + 0.07, 0.006, 0.3]} />
          <meshStandardMaterial color={decor.accent} roughness={0.85} />
        </mesh>
      )}

      {spots.map(([sx, sz], i) => {
        const len = Math.hypot(sx, sz)
        const px = rect ? sx : (sx / len) * (r - 0.19)
        const pz = rect ? Math.sign(sz) * 0.28 : (sz / len) * (r - 0.19)
        return (
          <group key={i} position={[px, y + 0.006, pz]} rotation={[0, Math.atan2(sx, sz), 0]}>
            <mesh>
              <cylinderGeometry args={[0.105, 0.085, 0.014, 24]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.012, 0]}>
              <boxGeometry args={[0.065, 0.012, 0.11]} />
              <meshStandardMaterial color={decor.accent} roughness={0.9} />
            </mesh>
          </group>
        )
      })}

      {/* Flowers step aside when a cake or candles take the centre. */}
      <Centrepiece decor={decor} at={crowded ? (rect ? [-0.5, 0] : [-(r - 0.2), 0]) : [0, 0]} />

      {decor.petals &&
        petals.map(([px, pz], i) => (
          <mesh key={i} position={[px, y + 0.012, pz]} rotation={[-Math.PI / 2, 0, i]}>
            <circleGeometry args={[0.03, 8]} />
            <meshStandardMaterial color={decor.bloom} roughness={0.8} />
          </mesh>
        ))}
    </group>
  )
}

/** Small props for everyday occasions, so a glance tells what a table is doing. */
function EverydayProps({ table, purpose }: { table: Shaped; purpose: Purpose }) {
  const rect = table.shape === 'rect'
  const reach = rect ? rectWidth(table) / 2 : topRadius(table)
  const top = TOP_Y + 0.02

  if (purpose === 'business')
    return (
      <group position={[rect ? 0.3 : 0.12, top, rect ? 0.16 : 0.14]} rotation={[0, 0.3, 0]} scale={1.3}>
        <mesh position={[0, 0.006, 0]}>
          <boxGeometry args={[0.26, 0.012, 0.18]} />
          <meshStandardMaterial color="#4B4844" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.085, -0.115]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.26, 0.17, 0.01]} />
          <meshStandardMaterial color="#4B4844" roughness={0.4} metalness={0.3} emissive="#BFD3E2" emissiveIntensity={0.25} />
        </mesh>
      </group>
    )

  if (purpose === 'friends')
    return (
      <group position={[0, top, 0]}>
        <Bottle position={[0, 0, 0]} />
        {[[0.14, 0.07], [-0.13, 0.09], [0.03, -0.15]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.05, z]}>
            <cylinderGeometry args={[0.034, 0.026, 0.1, 12]} />
            <meshStandardMaterial color="#E9D9A8" roughness={0.1} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    )

  if (purpose === 'family')
    return (
      <group position={rect ? [-(reach + 0.5), 0, 0] : [-(reach + 0.75) * 0.72, 0, -(reach + 0.75) * 0.72]}>
        {[[0, 0.1, 0, GOLD], [0.23, 0.1, 0.07, '#8FA086'], [0.1, 0.3, 0.03, '#C98089']].map(([x, y, z, color], i) => (
          <mesh key={i} position={[x as number, y as number, z as number]} rotation={[0, i * 0.5, 0]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color={color as string} roughness={0.8} />
          </mesh>
        ))}
      </group>
    )

  return null
}

export function TableModel({
  table,
  top,
  chair,
  glow = false,
  decor,
  occasion,
}: {
  table: Shaped
  top: string
  chair: string
  glow?: boolean
  /** Styling the guest ordered */
  decor?: Decor
  /** What the table is being used for */
  occasion?: Purpose
}) {
  const spots = useMemo(() => chairSpots(table), [table.seats, table.shape]) // eslint-disable-line react-hooks/exhaustive-deps
  // Ordered styling decides the pieces; otherwise a taken table shows its occasion's usual set.
  const pieces: Pieces = decor ? { ...decor, heart: occasion === 'romantic' } : usualPieces(occasion)
  const look = decor ?? (occasion ? defaultDecor(occasion) : undefined)
  return (
    <group>
      <mesh position={[0, 0.77, 0]} castShadow receiveShadow>
        {table.shape === 'rect' ? (
          <boxGeometry args={[rectWidth(table), 0.06, 0.86]} />
        ) : (
          <cylinderGeometry args={[topRadius(table), topRadius(table), 0.06, 40]} />
        )}
        <meshStandardMaterial color={top} roughness={0.5} emissive={top} emissiveIntensity={glow ? 0.18 : 0} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.74, 12]} />
        <meshStandardMaterial color={BASE} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.3, 0.32, 0.04, 24]} />
        <meshStandardMaterial color={BASE} roughness={0.5} />
      </mesh>
      {spots.map(([x, z], i) => (
        <Chair key={i} x={x} z={z} color={chair} />
      ))}
      {decor && <TableDecor table={table} decor={decor} spots={spots} crowded={!!(decor.cake || decor.candles)} />}
      {look && <Celebration table={table} look={look} pieces={pieces} />}
      {occasion && <EverydayProps table={table} purpose={occasion} />}
    </group>
  )
}
