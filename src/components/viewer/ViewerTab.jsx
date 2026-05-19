import { useEffect } from 'react'
import { Box } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { computeWallPositions } from '../../utils/computeWallPositions.js'
import RoomScene from './RoomScene.jsx'

// Вызывает один принудительный рендер сразу при mount —
// нужно потому что frameloop="demand" не рендерит автоматически.
function InitialRender() {
  const { invalidate } = useThree()
  useEffect(() => { invalidate() }, [])
  return null
}

export default function ViewerTab() {
  const walls = useProjectStore((s) => s.walls)
  const corners = useProjectStore((s) => s.corners)
  const setActiveTab = useProjectStore((s) => s.setActiveTab)

  const activeWalls = walls.filter(
    (w) => w.wall_active && parseFloat(w.length) > 0 && parseFloat(w.height) > 0,
  )
  const { positions, center } = computeWallPositions(activeWalls, corners)

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

  const totalSpan = activeWalls.reduce((m, w) => m + (parseFloat(w.length) || 0), 0)
  const maxHeight = activeWalls.reduce((m, w) => Math.max(m, parseFloat(w.height) || 0), 0)
  // Берём максимум из суммарного периметра и максимальной высоты — комната видна целиком
  const camDist = Math.max(totalSpan * 0.9, maxHeight * 2.5, 400)

  // key пересоздаёт Canvas при изменении набора активных стен — иначе камера
  // не обновляется (R3F применяет camera prop только при первом монтировании).
  // frameloop="demand" останавливает рендер-цикл когда вкладка скрыта (display:none),
  // иначе Three.js непрерывно работает в фоне и разряжает батарею.
  const canvasKey = activeWalls.map((w) => w.id).join(',')

  return (
    <div style={s.container}>
      <Canvas
        key={canvasKey}
        frameloop="demand"
        camera={{
          position: [center[0], center[1] + camDist * 0.55, center[2] + camDist],
          fov: 55,
          near: 1,
          far: camDist * 12,
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[200, 400, 300]} intensity={0.8} />
        <InitialRender />
        <RoomScene positions={positions} />
        <OrbitControls
          target={center}
          enablePan
          minDistance={10}
          maxDistance={camDist * 5}
        />
      </Canvas>
    </div>
  )
}

const s = {
  container: { width: '100%', height: '100%', background: '#08080f', position: 'relative' },
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
