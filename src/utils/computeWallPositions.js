function parseNum(val) {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function getCornerAngle(corners, key) {
  const val = corners[key]
  if (!val || typeof val === 'string') return 90
  return val.angle ?? 90
}

export function computeWallPositions(walls, corners) {
  const active = walls.filter((w) => {
    return w.wall_active && parseNum(w.length) > 0 && parseNum(w.height) > 0
  })

  if (active.length === 0) return { positions: [], center: [0, 0, 0] }

  let posX = 0
  let posZ = 0
  let dirDeg = 0

  const positions = active.map((wall, i) => {
    const L = parseNum(wall.length)
    const H = parseNum(wall.height)
    const dirRad = (dirDeg * Math.PI) / 180

    const cx = posX + Math.cos(dirRad) * (L / 2)
    const cz = posZ + Math.sin(dirRad) * (L / 2)

    const result = {
      wallId: wall.id,
      position: [cx, H / 2, cz],
      rotationY: dirRad,
      length: L,
      height: H,
    }

    posX += Math.cos(dirRad) * L
    posZ += Math.sin(dirRad) * L

    if (i < active.length - 1) {
      const nextWall = active[i + 1]
      const key = `${wall.id}-${nextWall.id}`
      const angle = getCornerAngle(corners, key)
      dirDeg -= (180 - angle)
    }

    return result
  })

  const cx = positions.reduce((s, p) => s + p.position[0], 0) / positions.length
  const cy = positions.reduce((s, p) => s + p.position[1], 0) / positions.length
  const cz = positions.reduce((s, p) => s + p.position[2], 0) / positions.length

  return { positions, center: [cx, cy, cz] }
}
