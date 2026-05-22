function parseNum(val) {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function getCornerAngle(corners, key) {
  const val = corners[key]
  if (!val || typeof val === 'string') return 90
  return val.angle ?? 90
}

function getCornerOverlap(corners, key) {
  const val = corners[key]
  if (val === undefined || val === null) return 'auto'
  if (typeof val === 'string') return val
  return val.overlap ?? 'auto'
}

function effectiveTile(globalTile, overrides = {}) {
  const merged = { ...globalTile }
  for (const key of Object.keys(overrides)) {
    if (overrides[key] !== '' && overrides[key] !== undefined) merged[key] = overrides[key]
  }
  return merged
}

function wallThickness(wall, globalTile, fallbackMm) {
  // tile_thickness в мм; мир в см (1 ед = 1 см) → делим на 10. Минимум — чтобы было видно.
  const t = parseNum(effectiveTile(globalTile, wall.tile_overrides).tile_thickness)
  return Math.max((t ?? fallbackMm) / 10, 1)
}

// Победитель угла: явная настройка overlap (id стены) или авто — толще побеждает,
// при равенстве — меньший индекс. Совпадает с roomGeometry.getCornerWinner.
function cornerWinner(leftWall, rightWall, key, corners, walls, globalTile) {
  const setting = getCornerOverlap(corners, key)
  if (setting !== 'auto') return setting
  const lt = parseNum(effectiveTile(globalTile, leftWall.tile_overrides).tile_thickness) ?? 0
  const rt = parseNum(effectiveTile(globalTile, rightWall.tile_overrides).tile_thickness) ?? 0
  if (lt > rt) return leftWall.id
  if (rt > lt) return rightWall.id
  const li = walls.findIndex((w) => w.id === leftWall.id)
  const ri = walls.findIndex((w) => w.id === rightWall.id)
  return li <= ri ? leftWall.id : rightWall.id
}

export function computeWallPositions(walls, corners, globalTile = {}, fallbackThicknessMm = 30) {
  const active = walls.filter((w) => {
    return w.wall_active && parseNum(w.length) > 0 && parseNum(w.height) > 0
  })

  if (active.length === 0) return { positions: [], center: [0, 0, 0], openingDir: null }

  // Углы поворота (CCW — стены идут слева направо в порядке номеров).
  const dirDegs = []
  let dirDeg = 0
  for (let i = 0; i < active.length; i++) {
    dirDegs.push(dirDeg)
    if (i < active.length - 1) {
      const key = `${active[i].id}-${active[i + 1].id}`
      dirDeg += (180 - getCornerAngle(corners, key))
    }
  }

  // Толщина каждой стены (мир. ед).
  const thick = active.map((w) => wallThickness(w, globalTile, fallbackThicknessMm))

  // Обрезка торцов: проигравший угол укорачивается на толщину победителя,
  // чтобы слой победителя занимал угол целиком (без z-fighting и «съедания»).
  const startTrim = new Array(active.length).fill(0)
  const endTrim = new Array(active.length).fill(0)
  for (let i = 0; i < active.length - 1; i++) {
    const key = `${active[i].id}-${active[i + 1].id}`
    const winner = cornerWinner(active[i], active[i + 1], key, corners, walls, globalTile)
    if (winner === active[i].id) {
      startTrim[i + 1] = thick[i]      // следующая стена проиграла — режем её начало
    } else {
      endTrim[i] = thick[i + 1]        // текущая стена проиграла — режем её конец
    }
  }

  // Центральные линии (цепочка по полной длине). Внутренняя грань ляжет на линию.
  let posX = 0
  let posZ = 0
  const base = active.map((wall, i) => {
    const L = parseNum(wall.length)
    const H = parseNum(wall.height)
    const dirRad = (dirDegs[i] * Math.PI) / 180
    const renderL = Math.max(L - startTrim[i] - endTrim[i], 1)
    const sx = posX + Math.cos(dirRad) * startTrim[i]
    const sz = posZ + Math.sin(dirRad) * startTrim[i]
    const cx = sx + Math.cos(dirRad) * (renderL / 2)
    const cz = sz + Math.sin(dirRad) * (renderL / 2)
    posX += Math.cos(dirRad) * L
    posZ += Math.sin(dirRad) * L
    return { wall, L, H, dirRad, cx, cz, renderL, T: thick[i] }
  })

  const roomCx = base.reduce((s, b) => s + b.cx, 0) / base.length
  const roomCz = base.reduce((s, b) => s + b.cz, 0) / base.length

  // Смещаем центр наружу на T/2 — внутренняя грань остаётся на линии, толщина уходит наружу.
  const positions = base.map(({ wall, L, H, dirRad, cx, cz, renderL, T }) => {
    let nx = -Math.sin(dirRad)
    let nz = Math.cos(dirRad)
    if (nx * (cx - roomCx) + nz * (cz - roomCz) < 0) { nx = -nx; nz = -nz }
    return {
      wallId: wall.id,
      position: [cx + nx * (T / 2), H / 2, cz + nz * (T / 2)],
      rotationY: dirRad,
      length: L,
      renderLength: renderL,
      height: H,
      thickness: T,
    }
  })

  const cx = positions.reduce((s, p) => s + p.position[0], 0) / positions.length
  const cy = positions.reduce((s, p) => s + p.position[1], 0) / positions.length
  const cz = positions.reduce((s, p) => s + p.position[2], 0) / positions.length

  // Направление проёма (для камеры по умолчанию).
  let inX = 0, inZ = 0
  for (const b of base) {
    let nx = -Math.sin(b.dirRad), nz = Math.cos(b.dirRad)
    if (nx * (roomCx - b.cx) + nz * (roomCz - b.cz) < 0) { nx = -nx; nz = -nz }
    inX += nx; inZ += nz
  }
  const inLen = Math.hypot(inX, inZ)
  const openingDir = inLen > 0.3 ? [inX / inLen, 0, inZ / inLen] : null

  return { positions, center: [cx, cy, cz], openingDir }
}
