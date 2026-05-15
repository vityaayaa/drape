import { useProjectStore } from '../../store/projectStore.js'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { computeWallPositions } from '../../utils/computeWallPositions.js'
import RoomScene from './RoomScene.jsx'

export default function ViewerTab() {
  const walls = useProjectStore((s) => s.walls)
  const corners = useProjectStore((s) => s.corners)

  const activeWalls = walls.filter(
    (w) => w.wall_active && parseFloat(w.length) > 0 && parseFloat(w.height) > 0,
  )
  const { center } = computeWallPositions(activeWalls, corners)

  if (activeWalls.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyText}>Добавьте хотя бы одну стену с размерами на вкладке «Комната»</p>
      </div>
    )
  }

  const maxDim = activeWalls.reduce(
    (m, w) => Math.max(m, parseFloat(w.length) || 0, parseFloat(w.height) || 0),
    0,
  )
  const camDist = Math.max(maxDim * 1.8, 300)

  return (
    <div style={s.container}>
      <Canvas
        camera={{
          position: [center[0], center[1] + camDist * 0.5, center[2] + camDist],
          fov: 60,
          near: 1,
          far: camDist * 10,
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[200, 400, 300]} intensity={0.8} />
        <RoomScene />
        <OrbitControls
          target={center}
          enablePan
          minDistance={10}
          maxDistance={camDist * 4}
        />
      </Canvas>
    </div>
  )
}

const s = {
  container: { width: '100%', height: '100%', background: '#0f172a' },
  empty:     { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  emptyText: { fontSize: 14, color: '#475569', textAlign: 'center', padding: '0 32px' },
}
