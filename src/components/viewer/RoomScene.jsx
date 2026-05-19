import { useMemo } from 'react'
import * as THREE from 'three'
import { useProjectStore } from '../../store/projectStore.js'
import WallMesh from './WallMesh.jsx'

export default function RoomScene({ positions, cx, cz, maxHeight }) {
  const walls = useProjectStore((s) => s.walls)
  const tile = useProjectStore((s) => s.tile)
  const tileColors = useProjectStore((s) => s.pixelizer.tileColors)

  const gridLarge = useMemo(
    () => new THREE.GridHelper(20000, 20, '#3a3f52', '#252b3b'),
    [],
  )
  const gridSmall = useMemo(
    () => new THREE.GridHelper(20000, 200, '#1e2435', '#181d2b'),
    [],
  )

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[cx, maxHeight * 0.95, cz]} intensity={1.2} color="#fffaf0" />
      <hemisphereLight args={['#e0e7ff', '#1e1b2e', 0.4]} />
      <primitive object={gridLarge} />
      <primitive object={gridSmall} />
      {positions.map((pos) => {
        const wall = walls.find((w) => w.id === pos.wallId)
        if (!wall) return null
        return (
          <WallMesh
            key={wall.id}
            wall={wall}
            tile={tile}
            tileColors={tileColors[wall.id]}
            position={pos.position}
            rotationY={pos.rotationY}
          />
        )
      })}
    </>
  )
}
