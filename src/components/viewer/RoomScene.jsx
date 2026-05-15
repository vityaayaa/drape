import { useProjectStore } from '../../store/projectStore.js'
import { computeWallPositions } from '../../utils/computeWallPositions.js'
import WallMesh from './WallMesh.jsx'

export default function RoomScene() {
  const walls = useProjectStore((s) => s.walls)
  const corners = useProjectStore((s) => s.corners)
  const tile = useProjectStore((s) => s.tile)
  const tileColors = useProjectStore((s) => s.pixelizer.tileColors)

  const activeWalls = walls.filter((w) => w.wall_active)
  const { positions } = computeWallPositions(activeWalls, corners)

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
