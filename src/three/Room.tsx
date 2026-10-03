import { memo, useMemo } from 'react'
import * as THREE from 'three'

export const ROOM = { w: 24, d: 16, wallH: 2.8, wallT: 0.25 }

const C = {
  wall: '#EFEAE1',
  plinth: '#E4DFD5',
  glass: '#C9D8D6',
  frame: '#3A3835',
  walnut: '#5A4636',
  walnutDark: '#46372B',
  stoneTop: '#E9E3D7',
  oak: '#B99B72',
  rug: '#CDC4B3',
  pot: '#CFC3B0',
  leaf: '#71866A',
  leafDark: '#5F7459',
  lamp: '#2E2D2B',
  bulb: '#FFE9BF',
  stool: '#8E857A',
}

function useFloorTexture() {
  return useMemo(() => {
    const size = 1024
    const plank = 64
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    let seed = 11
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let row = 0; row < size / plank; row++) {
      let x = -rnd() * 220
      while (x < size) {
        const w = 190 + rnd() * 170
        const shift = rnd() * 7 - 3.5
        ctx.fillStyle = `hsl(36, ${33 + shift}%, ${75 + shift}%)`
        ctx.fillRect(x, row * plank, w, plank)
        ctx.strokeStyle = 'rgba(96, 74, 48, 0.16)'
        ctx.lineWidth = 1.5
        ctx.strokeRect(x, row * plank, w, plank)
        x += w
      }
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 2)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    return texture
  }, [])
}

/** A wall along local X with glazed openings. */
function WindowWall({ length, windows }: { length: number; windows: { c: number; w: number }[] }) {
  const sill = 0.85
  const head = 2.35
  const { wallH: h, wallT: t } = ROOM
  const sorted = [...windows].sort((a, b) => a.c - b.c)
  const piers: { c: number; w: number }[] = []
  let cursor = -length / 2
  for (const win of sorted) {
    const left = win.c - win.w / 2
    if (left > cursor) piers.push({ c: (cursor + left) / 2, w: left - cursor })
    cursor = win.c + win.w / 2
  }
  if (cursor < length / 2) piers.push({ c: (cursor + length / 2) / 2, w: length / 2 - cursor })
  const mid = (sill + head) / 2
  const open = head - sill

  return (
    <group>
      <mesh position={[0, sill / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, sill, t]} />
        <meshStandardMaterial color={C.wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, (head + h) / 2, 0]} castShadow>
        <boxGeometry args={[length, h - head, t]} />
        <meshStandardMaterial color={C.wall} roughness={0.95} />
      </mesh>
      {piers.map((p, i) => (
        <mesh key={i} position={[p.c, mid, 0]} castShadow>
          <boxGeometry args={[p.w, open, t]} />
          <meshStandardMaterial color={C.wall} roughness={0.95} />
        </mesh>
      ))}
      {sorted.map((win, i) => (
        <group key={i} position={[win.c, mid, 0]}>
          <mesh>
            <boxGeometry args={[win.w, open, 0.03]} />
            <meshStandardMaterial color={C.glass} transparent opacity={0.32} roughness={0.1} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.05, open, 0.09]} />
            <meshStandardMaterial color={C.frame} roughness={0.6} />
          </mesh>
          <mesh position={[0, open / 2 - 0.42, 0]}>
            <boxGeometry args={[win.w, 0.04, 0.09]} />
            <meshStandardMaterial color={C.frame} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.18, 0.44, 20]} />
        <meshStandardMaterial color={C.pot} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <icosahedronGeometry args={[0.36, 1]} />
        <meshStandardMaterial color={C.leaf} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.2, 1.08, 0.08]} castShadow>
        <icosahedronGeometry args={[0.26, 1]} />
        <meshStandardMaterial color={C.leafDark} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-0.18, 1.14, -0.1]} castShadow>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial color={C.leaf} roughness={0.95} flatShading />
      </mesh>
    </group>
  )
}

function Pendant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 1.1, 6]} />
        <meshStandardMaterial color={C.lamp} />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.24, 0.22, 24, 1, true]} />
        <meshStandardMaterial color={C.lamp} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <sphereGeometry args={[0.065, 16, 12]} />
        <meshStandardMaterial color={C.bulb} emissive={C.bulb} emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

/** Slatted timber screen that gives a table some privacy. */
function Screen({ position, length, turned }: { position: [number, number, number]; length: number; turned?: boolean }) {
  const slats = Math.floor(length / 0.16)
  return (
    <group position={position} rotation={[0, turned ? Math.PI / 2 : 0, 0]}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[length, 0.08, 0.14]} />
        <meshStandardMaterial color={C.oak} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[length, 0.06, 0.14]} />
        <meshStandardMaterial color={C.oak} roughness={0.8} />
      </mesh>
      {Array.from({ length: slats }, (_, i) => (
        <mesh key={i} position={[(i - (slats - 1) / 2) * 0.16, 0.72, 0]} castShadow>
          <boxGeometry args={[0.05, 1.3, 0.1]} />
          <meshStandardMaterial color={C.oak} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

const BOTTLES = ['#6E7F6A', '#8C6B4A', '#3F4A45', '#B9A27A', '#7A6A5C']

function Bar() {
  return (
    <group>
      {/* Counter */}
      <mesh position={[7.4, 0.52, -5.5]} castShadow receiveShadow>
        <boxGeometry args={[7, 1.04, 0.7]} />
        <meshStandardMaterial color={C.walnut} roughness={0.7} />
      </mesh>
      <mesh position={[7.4, 1.07, -5.45]} castShadow>
        <boxGeometry args={[7.25, 0.06, 0.9]} />
        <meshStandardMaterial color={C.stoneTop} roughness={0.35} />
      </mesh>
      {/* Back bar */}
      <mesh position={[7.4, 0.45, -7.65]} castShadow>
        <boxGeometry args={[7, 0.9, 0.45]} />
        <meshStandardMaterial color={C.walnutDark} roughness={0.7} />
      </mesh>
      {[1.45, 1.95].map((y) => (
        <mesh key={y} position={[7.4, y, -7.72]} castShadow>
          <boxGeometry args={[7, 0.05, 0.3]} />
          <meshStandardMaterial color={C.walnut} roughness={0.7} />
        </mesh>
      ))}
      {[0.9, 1.475, 1.975].map((y, row) =>
        Array.from({ length: 13 }, (_, i) => (
          <mesh key={`${row}-${i}`} position={[4.4 + i * 0.5 + (row % 2) * 0.12, y + 0.15, -7.7]}>
            <cylinderGeometry args={[0.035, 0.055, 0.3, 10]} />
            <meshStandardMaterial color={BOTTLES[(i + row * 2) % BOTTLES.length]} roughness={0.25} />
          </mesh>
        )),
      )}
      {/* Stools */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[4.6 + i * 1.12, 0, -4.7]}>
          <mesh position={[0, 0.74, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.07, 20]} />
            <meshStandardMaterial color={C.stool} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.37, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.74, 8]} />
            <meshStandardMaterial color={C.frame} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.04, 20]} />
            <meshStandardMaterial color={C.frame} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {[5.4, 7.4, 9.4].map((x) => (
        <Pendant key={x} position={[x, 2.15, -5.45]} />
      ))}
    </group>
  )
}

function Entrance() {
  const z = ROOM.d / 2 + ROOM.wallT / 2
  return (
    <group>
      {[7.7, 10.8].map((x) => (
        <mesh key={x} position={[x, 1.2, z]} castShadow>
          <boxGeometry args={[0.14, 2.4, 0.3]} />
          <meshStandardMaterial color={C.frame} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[9.25, 2.45, z]} castShadow>
        <boxGeometry args={[3.24, 0.14, 0.3]} />
        <meshStandardMaterial color={C.frame} roughness={0.6} />
      </mesh>
      {/* Door mat */}
      <mesh position={[9.25, 0.012, 7.05]} receiveShadow>
        <boxGeometry args={[2.6, 0.02, 1.3]} />
        <meshStandardMaterial color="#5B5650" roughness={1} />
      </mesh>
      {/* Host stand */}
      <mesh position={[6.9, 0.55, 6.7]} castShadow>
        <boxGeometry args={[0.75, 1.1, 0.45]} />
        <meshStandardMaterial color={C.walnut} roughness={0.7} />
      </mesh>
      <mesh position={[6.9, 1.12, 6.7]}>
        <boxGeometry args={[0.85, 0.04, 0.55]} />
        <meshStandardMaterial color={C.stoneTop} roughness={0.35} />
      </mesh>
    </group>
  )
}

export const Room = memo(function Room() {
  const floor = useFloorTexture()
  const { w, d, wallT: t } = ROOM
  const low = 0.5

  return (
    <group>
      {/* Plinth the model sits on */}
      <mesh position={[0, -0.26, 0]} receiveShadow>
        <boxGeometry args={[w + 1.6, 0.5, d + 1.6]} />
        <meshStandardMaterial color={C.plinth} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floor} roughness={0.75} />
      </mesh>
      <mesh position={[-2.5, 0.008, 0.8]} receiveShadow>
        <boxGeometry args={[10.4, 0.016, 9.4]} />
        <meshStandardMaterial color={C.rug} roughness={1} />
      </mesh>

      {/* Garden wall (back) and window wall (left) */}
      <group position={[0, 0, -d / 2 - t / 2]}>
        <WindowWall length={w + t * 2} windows={[{ c: -8.3, w: 2.6 }, { c: -4.7, w: 2.6 }, { c: -1.1, w: 2.6 }]} />
      </group>
      <group position={[-w / 2 - t / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <WindowWall
          length={d}
          windows={[{ c: 5.5, w: 2.2 }, { c: 2.5, w: 2.2 }, { c: -0.5, w: 2.2 }, { c: -3.5, w: 2.2 }, { c: -6.3, w: 2.2 }]}
        />
      </group>

      {/* Low walls on the open sides */}
      <mesh position={[w / 2 + t / 2, low / 2, 0]} castShadow>
        <boxGeometry args={[t, low, d + t * 2]} />
        <meshStandardMaterial color={C.wall} roughness={0.95} />
      </mesh>
      <mesh position={[(-w / 2 + 7.63) / 2, low / 2, d / 2 + t / 2]} castShadow>
        <boxGeometry args={[7.63 + w / 2, low, t]} />
        <meshStandardMaterial color={C.wall} roughness={0.95} />
      </mesh>
      <mesh position={[(10.87 + w / 2) / 2, low / 2, d / 2 + t / 2]} castShadow>
        <boxGeometry args={[w / 2 - 10.87, low, t]} />
        <meshStandardMaterial color={C.wall} roughness={0.95} />
      </mesh>

      <Bar />
      <Entrance />

      <Screen position={[-10.4, 0, 4.9]} length={2.7} />
      <Screen position={[-8, 0, 6.75]} length={2.2} turned />
      <Screen position={[-4.05, 0, 6.75]} length={2.2} turned />
      <Screen position={[3.1, 0, -1]} length={5.6} turned />

      <Plant position={[-11.3, 0, -7.3]} scale={1.15} />
      <Plant position={[2.5, 0, -7.3]} />
      <Plant position={[11.3, 0, -3.6]} />
      <Plant position={[11.3, 0, 2.6]} scale={1.1} />
      <Plant position={[11.3, 0, 7.3]} />
      <Plant position={[3.1, 0, 2.3]} scale={0.9} />
      <Plant position={[-11.4, 0, 7.5]} scale={0.85} />

      <Pendant position={[-2.5, 2.15, 0.8]} />
    </group>
  )
})
