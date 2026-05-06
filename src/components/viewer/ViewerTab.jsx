import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

function RotatingCube() {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta * 0.5
    meshRef.current.rotation.y += delta * 0.7
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#4a90d9" />
    </mesh>
  )
}

export default function ViewerTab() {
  const { testCounter, incrementCounter } = useProjectStore()
  const { past, future, push, undo, redo } = useHistoryStore()

  const handleIncrement = () => {
    push(useProjectStore.getState().getSnapshot())
    incrementCounter()
  }

  const handleUndo = () => {
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  const handleRedo = () => {
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0d0d0d' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <RotatingCube />
        <OrbitControls enablePan={false} />
      </Canvas>

      <div style={styles.overlay}>
        <div style={styles.undoRow}>
          <button style={styles.btn} onClick={handleUndo} disabled={past.length === 0}>↩</button>
          <button style={styles.btn} onClick={handleRedo} disabled={future.length === 0}>↪</button>
        </div>
        <div style={styles.counterRow}>
          <span style={styles.counterText}>Счётчик: {testCounter}</span>
          <button style={styles.btn} onClick={handleIncrement}>+1</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay:     { position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  undoRow:     { display: 'flex', gap: 8 },
  counterRow:  { display: 'flex', gap: 8, alignItems: 'center' },
  counterText: { color: '#f0f0f0', fontSize: 13, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 6 },
  btn:         { padding: '8px 14px', background: 'rgba(0,0,0,0.6)', color: '#f0f0f0', border: '1px solid #555', borderRadius: 8, fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(4px)' },
}
