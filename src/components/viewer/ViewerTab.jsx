import { useRef, useState } from 'react'
import { Box } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { Canvas } from '@react-three/fiber'
import { computeWallPositions } from '../../utils/computeWallPositions.js'
import RoomScene from './RoomScene.jsx'
import CameraRig from './CameraRig.jsx'
import ViewerToolbar from './ViewerToolbar.jsx'

export default function ViewerTab() {
  const walls = useProjectStore((s) => s.walls)
  const corners = useProjectStore((s) => s.corners)
  const setActiveTab = useProjectStore((s) => s.setActiveTab)
  const cameraRef = useRef()
  const [activeView, setActiveView] = useState('iso')

  const activeWalls = walls.filter(
    (w) => w.wall_active && parseFloat(w.length) > 0 && parseFloat(w.height) > 0,
  )

  if (activeWalls.length === 0) {
    return (
      <div style={s.empty}>
        <Box size={32} color="#818cf8" style={{ opacity: 0.5 }} />
        <p style={s.emptyTitle}>Нет стен для 3D-просмотра</p>
        <p style={s.emptySubtitle}>Заполните длину и высоту хотя бы одной стены</p>
        <button style={s.emptyBtn} onClick={() => setActiveTab('room')}>
          → Перейти в Комнату
        </button>
      </div>
    )
  }

  const { positions, center } = computeWallPositions(activeWalls, corners)
  const totalSpan = activeWalls.reduce((m, w) => m + (parseFloat(w.length) || 0), 0)
  const maxHeight = activeWalls.reduce((m, w) => Math.max(m, parseFloat(w.height) || 0), 0)
  const camDist = Math.max(totalSpan * 0.9, maxHeight * 2.5, 400)

  const cx = center[0]
  const cz = center[2]
  const initialPosition = [cx + camDist * 0.7, maxHeight / 2 + camDist * 0.5, cz + camDist * 0.7]
  const initialTarget = [cx, maxHeight / 2, cz]

  // canvasKey пересоздаёт Canvas при изменении набора активных стен —
  // это сбрасывает камеру на начальные параметры автоматически
  const canvasKey = activeWalls.map((w) => w.id).join(',')

  function handleReset() {
    cameraRef.current?.reset()
    setActiveView('iso')
  }

  function handleSetView(view) {
    cameraRef.current?.setView(view)
    setActiveView(view)
  }

  return (
    <div style={s.container}>
      <ViewerToolbar
        onReset={handleReset}
        onSetView={handleSetView}
        activeView={activeView}
      />
      <div style={s.canvasWrapper}>
        <Canvas
          key={canvasKey}
          frameloop="demand"
          camera={{
            position: initialPosition,
            fov: 55,
            near: 1,
            far: camDist * 12,
          }}
        >
          <RoomScene
            positions={positions}
            cx={cx}
            cz={cz}
            maxHeight={maxHeight}
          />
          <CameraRig
            ref={cameraRef}
            initialPosition={initialPosition}
            initialTarget={initialTarget}
            camDist={camDist}
            cx={cx}
            cz={cz}
            maxHeight={maxHeight}
          />
        </Canvas>
      </div>
    </div>
  )
}

const s = {
  container: {
    width: '100%', height: '100%',
    background: '#08080f', position: 'relative',
  },
  canvasWrapper: {
    position: 'absolute',
    top: 48, bottom: 0, left: 0, right: 0,
  },
  empty: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#08080f', gap: 8, padding: '0 32px',
  },
  emptyTitle:    { fontSize: 15, color: '#94a3b8', margin: 0, textAlign: 'center' },
  emptySubtitle: { fontSize: 12, color: '#64748b', margin: 0, textAlign: 'center', maxWidth: 240 },
  emptyBtn: {
    marginTop: 8, height: 40, padding: '0 20px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, color: '#f1f5f9', fontSize: 14, cursor: 'pointer',
  },
}
