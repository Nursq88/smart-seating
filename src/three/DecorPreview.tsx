import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Decor, Purpose, Shape } from '../lib/types'
import { TableModel, tableRadius } from './TableModel'

/** Close-up of a single table so the guest can see roughly how it will be dressed. */
export function DecorPreview({ decor, occasion, seats }: { decor?: Decor; occasion?: Purpose; seats: number }) {
  const shape: Shape = seats === 3 || seats === 4 || seats > 6 ? 'rect' : 'round'
  const table = { seats: Math.max(2, seats), shape }
  // Step back far enough to keep the banner and balloons in frame.
  const far = (tableRadius(table) + 1.5) / 2.3
  return (
    <Canvas key={`${table.seats}-${shape}`} shadows dpr={[1, 2]} camera={{ position: [3.3 * far, 3.4 * far, 4.6 * far], fov: 34 }}>
      <ambientLight intensity={1.5} color="#FFF6EA" />
      <hemisphereLight args={['#FFFFFF', '#D9CFBF', 0.9]} />
      <directionalLight
        position={[4, 7, 3]}
        intensity={2.1}
        color="#FFF4E4"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[tableRadius(table) + 2.2, 64]} />
        <meshStandardMaterial color="#E6DCCB" roughness={0.9} />
      </mesh>
      <TableModel table={table} top="#F5F0E7" chair="#A79E91" decor={decor} occasion={occasion} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        rotateSpeed={0.6}
        minPolarAngle={0.5}
        maxPolarAngle={1.35}
        target={[0, 1.15, 0]}
      />
    </Canvas>
  )
}
