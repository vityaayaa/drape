import { useProjectStore } from '../../store/projectStore.js'
import WallMesh from './WallMesh.jsx'

export default function RoomScene({ positions }) {
  const walls = useProjectStore((s) => s.walls)
  const tile = useProjectStore((s) => s.tile)
  const tileColors = useProjectStore((s) => s.pixelizer.tileColors)

  return (
    <>
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
