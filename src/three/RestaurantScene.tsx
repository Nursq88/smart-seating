import { useEffect, useMemo, useRef, useState, type ElementRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RotateCcw } from 'lucide-react'
import { useLang, type T } from '../lib/i18n'
import { LEVEL, PURPOSE_LABEL } from '../lib/matching'
import type { Decor, Purpose, Table } from '../lib/types'
import { Room } from './Room'
import { TableModel, tableRadius } from './TableModel'

export type Tone = 'available' | 'occupied' | 'reserved' | 'recommended' | 'muted'

const TOP: Record<Tone, string> = {
  available: '#F5F0E7',
  occupied: '#4B4844',
  reserved: '#C8AE84',
  recommended: '#A6764F',
  muted: '#DDD9D1',
}

const BADGE: Record<Tone, string> = {
  available: 'bg-white text-ink border-stone-300',
  occupied: 'bg-graphite text-white border-graphite',
  reserved: 'bg-[#EFE3CD] text-[#6B5330] border-sand',
  recommended: 'bg-bronze text-white border-bronze',
  muted: 'bg-stone-100 text-stone-400 border-stone-200',
}

const STATUS_LABEL = { occupied: 'Occupied', reserved: 'Reserved' }

const CHAIR = '#A79E91'
const CHAIR_MUTED = '#D3CFC7'

const HOME_POS = new THREE.Vector3(15, 17, 25)
const HOME_TARGET = new THREE.Vector3(0, 0, 0.6)

/** Thin floor ring that eases in when a table becomes selected or recommended. */
function Ring({ radius, color }: { radius: number; color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const group = ref.current
    if (group && group.scale.x < 0.999) group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, 1, 7, dt))
  })
  return (
    <group ref={ref} scale={0.7} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[radius, radius + 0.07, 72]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <circleGeometry args={[radius, 72]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  )
}

interface TableProps {
  table: Table
  tone: Tone
  selected: boolean
  hovered: boolean
  label?: string
  decor?: Decor
  occasion?: Purpose
  t: T
  interactive: boolean
  onHover: (id: number | null) => void
  onSelect?: (id: number) => void
}

function TableMesh({ table, tone, selected, hovered, label, decor, occasion, t, interactive, onHover, onSelect }: TableProps) {
  const radius = tableRadius(table)
  const ring = selected ? '#262523' : tone === 'recommended' ? TOP.recommended : null

  return (
    <group position={[table.x, 0, table.z]}>
      {ring && <Ring key={ring} radius={radius} color={ring} />}

      <TableModel table={table} top={TOP[tone]} chair={tone === 'muted' ? CHAIR_MUTED : CHAIR} glow={hovered} decor={decor} occasion={occasion} />

      {/* Generous invisible hit area */}
      <mesh
        position={[0, 0.5, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(table.id)
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          if (!interactive) return
          e.stopPropagation()
          onSelect?.(table.id)
        }}
      >
        <cylinderGeometry args={[radius, radius, 1, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Html position={[0, decor ? 1.45 : 1.3, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div
          className={`flex h-[22px] min-w-[22px] items-center justify-center gap-1 whitespace-nowrap rounded-full border px-1.5 text-[11px] font-semibold leading-none shadow-sm transition-transform duration-200 ${
            BADGE[tone]
          } ${selected ? 'scale-125' : ''}`}
        >
          {table.id}
          {label && <span className="font-medium opacity-80">· {label}</span>}
        </div>
      </Html>

      {hovered && (
        <Html position={[0, 2.1, 0]} center zIndexRange={[30, 21]} style={{ pointerEvents: 'none' }}>
          <div className="w-max -translate-y-6 animate-fade-in rounded-lg border border-stone-200 bg-white/95 px-3 py-2 text-xs shadow-lift backdrop-blur">
            <div className="font-semibold text-ink">{t('Table {n}', { n: table.id })}</div>
            {table.status !== 'available' && (
              <div className="font-medium text-bronze-deep">
                {t(STATUS_LABEL[table.status])}
                {occasion && ` · ${t(PURPOSE_LABEL[occasion])}`}
              </div>
            )}
            <div className="mt-1 text-stone-500">
              {t('Privacy')}: {t(LEVEL[table.privacy])}
            </div>
            <div className="text-stone-500">
              {t('Noise')}: {t(LEVEL[table.noise])}
            </div>
            <div className="text-stone-500">
              {t('Seats: {n}', { n: table.seats })} · {t(table.zone)}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

function CameraRig({ focus, home }: { focus: [number, number] | null; home: number }) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null)
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const started = useRef(false)
  const camera = useThree((s) => s.camera)
  // Pull back in narrow panels so the whole room stays in frame.
  const aspect = useThree((s) => s.size.width / s.size.height)
  const reach = Math.max(1, 1.45 / aspect)
  const homeGoal = () => ({ pos: HOME_POS.clone().multiplyScalar(reach), target: HOME_TARGET.clone() })
  const fx = focus?.[0]
  const fz = focus?.[1]

  useEffect(() => {
    if (fx === undefined || fz === undefined) {
      // Ease in from afar the first time the model is shown.
      if (!started.current) goal.current = homeGoal()
    } else {
      const target = new THREE.Vector3(fx * 0.85, 0.3, fz * 0.85)
      goal.current = { target, pos: target.clone().add(new THREE.Vector3(9, 12, 15).multiplyScalar(Math.sqrt(reach))) }
    }
    started.current = true
  }, [fx, fz]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (home > 0) goal.current = homeGoal()
  }, [home]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const g = goal.current
    const c = controls.current
    if (!g || !c) return
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 3.2)
    camera.position.lerp(g.pos, k)
    c.target.lerp(g.target, k)
    c.update()
    if (camera.position.distanceTo(g.pos) < 0.03) goal.current = null
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.7}
      minDistance={9}
      maxDistance={64}
      minPolarAngle={0.25}
      maxPolarAngle={1.32}
      target={HOME_TARGET.toArray()}
      onStart={() => {
        goal.current = null
      }}
    />
  )
}

export interface SceneProps {
  tables: Table[]
  tone?: (table: Table) => Tone
  selectedId?: number | null
  /** Table the camera eases towards */
  focusId?: number | null
  labels?: Record<number, string>
  /** Table styling to show, by table number */
  decors?: Record<number, Decor>
  /** Occasion celebrated at a table, by table number */
  occasions?: Record<number, Purpose>
  onSelect?: (id: number | null) => void
  children?: ReactNode
}

export function RestaurantScene({ tables, tone, selectedId, focusId, labels, decors, occasions, onSelect, children }: SceneProps) {
  const { t } = useLang()
  const [hovered, setHovered] = useState<number | null>(null)
  const [home, setHome] = useState(0)
  const focusTable = focusId != null ? tables.find((t) => t.id === focusId) : undefined
  const focus = useMemo<[number, number] | null>(
    () => (focusTable ? [focusTable.x, focusTable.z] : null),
    [focusTable?.x, focusTable?.z], // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    document.body.style.cursor = hovered !== null && onSelect ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered, onSelect])

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [26, 29, 43], fov: 32, near: 0.5, far: 300 }}
        onPointerMissed={() => onSelect?.(null)}
      >
        <ambientLight intensity={1.5} color="#FFF6EA" />
        <hemisphereLight args={['#FFFFFF', '#D9CFBF', 0.9]} />
        <directionalLight
          position={[12, 22, 10]}
          intensity={2.1}
          color="#FFF4E4"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-camera-near={1}
          shadow-camera-far={60}
        />
        <Room />
        {tables.map((table) => (
          <TableMesh
            key={table.id}
            table={table}
            tone={tone ? tone(table) : table.status}
            selected={selectedId === table.id}
            hovered={hovered === table.id}
            label={labels?.[table.id]}
            decor={decors?.[table.id]}
            occasion={occasions?.[table.id]}
            t={t}
            interactive={!!onSelect}
            onHover={setHovered}
            onSelect={onSelect}
          />
        ))}
        <CameraRig focus={focus} home={home} />
      </Canvas>

      <button
        onClick={() => setHome((n) => n + 1)}
        className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-600 shadow-soft backdrop-blur transition hover:text-ink"
      >
        <RotateCcw size={13} strokeWidth={1.75} />
        {t('Reset view')}
      </button>
      <div className="pointer-events-none absolute bottom-4 right-4 hidden text-xs text-stone-400 sm:block">
        {t('Drag to rotate · Scroll to zoom')}
      </div>
      {children}
    </div>
  )
}

const LEGEND: { tone: Tone; label: string }[] = [
  { tone: 'available', label: 'Available' },
  { tone: 'occupied', label: 'Occupied' },
  { tone: 'reserved', label: 'Reserved' },
  { tone: 'recommended', label: 'Recommended' },
]

export function Legend({ tones = ['available', 'occupied', 'reserved', 'recommended'] }: { tones?: Tone[] }) {
  const { t } = useLang()
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-30 flex flex-wrap gap-x-4 gap-y-1 rounded-full border border-stone-200 bg-white/90 px-3.5 py-1.5 text-xs text-stone-600 shadow-soft backdrop-blur">
      {LEGEND.filter((x) => tones.includes(x.tone)).map((x) => (
        <span key={x.tone} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: TOP[x.tone] }} />
          {t(x.label)}
        </span>
      ))}
    </div>
  )
}
