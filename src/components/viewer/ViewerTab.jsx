import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

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
      <meshStandardMaterial color="#2563eb" />
    </mesh>
  )
}

export default function ViewerTab() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f5f7fa', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <RotatingCube />
        <OrbitControls enablePan={false} />
      </Canvas>
      <div style={s.label}>3D — Этап 3</div>
    </div>
  )
}

const s = {
  label: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#9ca3af' },
}
