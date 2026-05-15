// src/utils/roomGeometry.js

const SOFT_LIMIT = 25_000
const HARD_LIMIT = 75_000

function parseNum(val) {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function effectiveTile(globalTile, overrides) {
  const merged = { ...globalTile }
  for (const key of Object.keys(overrides)) {
    if (overrides[key] !== '' && overrides[key] !== undefined) {
      merged[key] = overrides[key]
    }
  }
  return merged
}

function getCornerWinner(leftWall, rightWall, cornerKey, corners, walls, globalTile) {
  const setting = corners[cornerKey] ?? 'auto'
  if (setting !== 'auto') {
    // значение — это id стены-победителя
    return setting
  }
  const lt = parseNum(effectiveTile(globalTile, leftWall.tile_overrides).tile_thickness) ?? 0
  const rt = parseNum(effectiveTile(globalTile, rightWall.tile_overrides).tile_thickness) ?? 0
  if (lt > rt) return leftWall.id
  if (rt > lt) return rightWall.id
  // равная толщина — меньший индекс побеждает
  const li = walls.findIndex(w => w.id === leftWall.id)
  const ri = walls.findIndex(w => w.id === rightWall.id)
  return li <= ri ? leftWall.id : rightWall.id
}

function countMaskedTiles(mask, tw, th, gw) {
  const stepX = tw + gw
  const stepY = th + gw
  const rawX = parseNum(mask.x)
  const rawY = parseNum(mask.y)
  const rawW = parseNum(mask.width)
  const rawH = parseNum(mask.height)
  if ([rawX, rawY, rawW, rawH].some(v => v === null)) return 0
  const mx = rawX * 10
  const my = rawY * 10
  const mw = rawW * 10
  const mh = rawH * 10
  const colStart = Math.ceil(mx / stepX)
  const colEnd = Math.floor((mx + mw) / stepX)
  const rowStart = Math.ceil(my / stepY)
  const rowEnd = Math.floor((my + mh) / stepY)
  return Math.max(0, colEnd - colStart) * Math.max(0, rowEnd - rowStart)
}

export function calculateGrid(globalTile, walls, corners) {
  const n = walls.length
  return walls.map((wall, i) => {
    if (!wall.wall_active || !wall.mosaic_active) return null

    const t = effectiveTile(globalTile, wall.tile_overrides)
    const tw = parseNum(t.tile_width)
    const th = parseNum(t.tile_height)
    const gw = parseNum(t.grout_width) ?? 0
    const length = parseNum(wall.length)
    const height = parseNum(wall.height)

    if (tw === null || th === null || length === null || height === null) return null
    if (tw <= 0 || th <= 0 || length <= 0 || height <= 0) return null

    const leftWall = walls[(i - 1 + n) % n]
    const rightWall = walls[(i + 1) % n]
    const leftCornerKey = `${leftWall.id}-${wall.id}`
    const rightCornerKey = `${wall.id}-${rightWall.id}`

    let gridWidthMm = length * 10

    if (n >= 2) {
      const leftWinner = getCornerWinner(leftWall, wall, leftCornerKey, corners, walls, globalTile)
      if (leftWinner === leftWall.id) {
        const leftT = parseNum(effectiveTile(globalTile, leftWall.tile_overrides).tile_thickness) ?? 0
        if (leftWall.wall_active && leftWall.mosaic_active && leftT > 0) {
          gridWidthMm -= leftT
        }
      }

      // Only apply right-corner deduction if right neighbor is distinct from left neighbor,
      // OR if the right corner is explicitly overridden in corners map
      const rightIsExplicit = corners[rightCornerKey] !== undefined
      if (rightWall.id !== leftWall.id || rightIsExplicit) {
        const rightWinner = getCornerWinner(wall, rightWall, rightCornerKey, corners, walls, globalTile)
        if (rightWinner === rightWall.id) {
          const rightT = parseNum(effectiveTile(globalTile, rightWall.tile_overrides).tile_thickness) ?? 0
          if (rightWall.wall_active && rightWall.mosaic_active && rightT > 0) {
            gridWidthMm -= rightT
          }
        }
      }
    }

    const gridHeightMm = height * 10
    const columns = Math.ceil((gridWidthMm + gw) / (tw + gw))
    const rows = Math.ceil((gridHeightMm + gw) / (th + gw))
    const total_before_masks = columns * rows

    let total_masked = 0
    for (const mask of wall.masks ?? []) {
      total_masked += countMaskedTiles(mask, tw, th, gw)
    }

    const total = Math.max(0, total_before_masks - total_masked)

    return {
      wallId: wall.id,
      grid_width_cm: +(gridWidthMm / 10).toFixed(2),
      columns,
      rows,
      total_before_masks,
      total_masked,
      total,
      warning: total_before_masks > SOFT_LIMIT,
      blocked: total_before_masks > HARD_LIMIT,
    }
  })
}
