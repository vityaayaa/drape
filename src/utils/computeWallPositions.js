function parseNum(val) {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function getCornerAngle(corners, key) {
  const val = corners[key]
  if (!val || typeof val === 'string') return 90
  return val.angle ?? 90
}

export function computeWallPositions(walls, corners, thickness = 10) {
  const active = walls.filter((w) => {
    return w.wall_active && parseNum(w.length) > 0 && parseNum(w.height) > 0
  })

  if (active.length === 0) return { positions: [], center: [0, 0, 0] }

  // Рассчитываем углы поворота для каждой стены
  const dirDegs = []
  let dirDeg = 0
  for (let i = 0; i < active.length; i++) {
    dirDegs.push(dirDeg)
    if (i < active.length - 1) {
      const key = `${active[i].id}-${active[i + 1].id}`
      const angle = getCornerAngle(corners, key)
      dirDeg -= (180 - angle)
    }
  }

  let posX = 0
  let posZ = 0

  const positions = active.map((wall, i) => {
    const L = parseNum(wall.length)
    const H = parseNum(wall.height)
    const dirRad = (dirDegs[i] * Math.PI) / 180

    // Чётные стены (0, 2, …) — полная длина, перекрывают углы.
    // Нечётные стены (1, 3, …) — укорачиваются на thickness/2 с каждой стороны,
    // чтобы торец встал ровно к внутренней плоскости соседней стены (без зазора).
    const trimmed = (i % 2 === 1)
    const half = thickness / 2
    const startTrim = trimmed && i > 0 ? half : 0
    const endTrim   = trimmed && i < active.length - 1 ? half : 0
    const renderL   = Math.max(L - startTrim - endTrim, 1)

    const startX = posX + Math.cos(dirRad) * startTrim
    const startZ = posZ + Math.sin(dirRad) * startTrim
    const cx = startX + Math.cos(dirRad) * (renderL / 2)
    const cz = startZ + Math.sin(dirRad) * (renderL / 2)

    const result = {
      wallId: wall.id,
      position: [cx, H / 2, cz],
      rotationY: dirRad,
      length: L,
      renderLength: renderL,
      height: H,
    }

    posX += Math.cos(dirRad) * L
    posZ += Math.sin(dirRad) * L

    return result
  })

  const cx = positions.reduce((s, p) => s + p.position[0], 0) / positions.length
  const cy = positions.reduce((s, p) => s + p.position[1], 0) / positions.length
  const cz = positions.reduce((s, p) => s + p.position[2], 0) / positions.length

  return { positions, center: [cx, cy, cz] }
}
