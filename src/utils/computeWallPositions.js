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
      // Поворот влево (CCW): при взгляде из проёма стены идут слева направо
      // в порядке их номеров (Стена 1 слева), как на развёртке «Фото».
      dirDeg += (180 - angle)
    }
  }

  // 1) Центральные линии стен (цепочка по полной длине L).
  //    Внутренняя грань стены ляжет на эту линию — поэтому L = «чистый» внутренний размер.
  let posX = 0
  let posZ = 0
  const base = active.map((wall, i) => {
    const L = parseNum(wall.length)
    const H = parseNum(wall.height)
    const dirRad = (dirDegs[i] * Math.PI) / 180
    const cx = posX + Math.cos(dirRad) * (L / 2)
    const cz = posZ + Math.sin(dirRad) * (L / 2)
    posX += Math.cos(dirRad) * L
    posZ += Math.sin(dirRad) * L
    return { wall, L, H, dirRad, cx, cz }
  })

  // Центр комнаты по центральным линиям.
  const roomCx = base.reduce((s, b) => s + b.cx, 0) / base.length
  const roomCz = base.reduce((s, b) => s + b.cz, 0) / base.length

  // 2) Смещаем центр КАЖДОЙ стены наружу на thickness/2 (перпендикуляр к стене),
  //    чтобы внутренняя грань осталась на центральной линии, а толщина ушла наружу.
  //    Так стены не «съедают» площадь, а длина L = ровно внутренний размер.
  const positions = base.map(({ wall, L, H, dirRad, cx, cz }) => {
    // Два перпендикуляра; выбираем тот, что направлен ОТ центра комнаты (наружу).
    let nx = -Math.sin(dirRad)
    let nz =  Math.cos(dirRad)
    const towardOutX = cx - roomCx
    const towardOutZ = cz - roomCz
    if (nx * towardOutX + nz * towardOutZ < 0) { nx = -nx; nz = -nz }
    const ox = cx + nx * (thickness / 2)
    const oz = cz + nz * (thickness / 2)

    return {
      wallId: wall.id,
      position: [ox, H / 2, oz],
      rotationY: dirRad,
      length: L,
      renderLength: L,   // полная длина — внутренняя грань = заданному размеру
      height: H,
    }
  })

  const cx = positions.reduce((s, p) => s + p.position[0], 0) / positions.length
  const cy = positions.reduce((s, p) => s + p.position[1], 0) / positions.length
  const cz = positions.reduce((s, p) => s + p.position[2], 0) / positions.length

  // Направление «проёма» комнаты = сумма единичных внутренних нормалей стен.
  // Для незамкнутого контура (U-комната) указывает в сторону открытой стороны —
  // туда ставим камеру по умолчанию, чтобы видеть интерьер стен в правильном порядке.
  let inX = 0, inZ = 0
  for (const b of base) {
    let nx = -Math.sin(b.dirRad), nz = Math.cos(b.dirRad)
    // внутренняя нормаль — к центру комнаты
    if (nx * (roomCx - b.cx) + nz * (roomCz - b.cz) < 0) { nx = -nx; nz = -nz }
    inX += nx; inZ += nz
  }
  const inLen = Math.hypot(inX, inZ)
  const openingDir = inLen > 0.3 ? [inX / inLen, 0, inZ / inLen] : null

  return { positions, center: [cx, cy, cz], openingDir }
}
