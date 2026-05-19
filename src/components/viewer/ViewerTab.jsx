import { useRef, useState, useEffect } from 'react'
import { Box } from 'lucide-react'
import EmptyState from '../shared/EmptyState.jsx'
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

  // canvasKey пересоздаёт Canvas при изменении набора активных стен —
  // это сбрасывает камеру на начальные параметры автоматически
  const canvasKey = activeWalls.map((w) => w.id).join(',')

  // Sync activeView to 'iso' when canvas remounts (wall set changed)
  useEffect(() => { setActiveView('iso') }, [canvasKey])

  if (activeWalls.length === 0) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: '#08080f' }}>
        <EmptyState
          icon={<Box size={32} color="#818cf8" style={{ opacity: 0.5 }} />}
          title="Нет стен для 3D-просмотра"
          subtitle="Заполните длину и высоту хотя бы одной стены"
          actionLabel="→ Перейти в Комнату"
          onAction={() => setActiveTab('room')}
        />
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
    top: 48, // must match ViewerToolbar height
    bottom: 0, left: 0, right: 0,
  },
}
