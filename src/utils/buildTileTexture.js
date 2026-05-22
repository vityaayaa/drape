function parseNum(val) {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function effectiveTile(globalTile, overrides) {
  const merged = { ...globalTile }
  for (const key of Object.keys(overrides)) {
    if (overrides[key] !== '' && overrides[key] !== undefined) merged[key] = overrides[key]
  }
  return merged
}

export function computeTextureLayout(wall, tileParams) {
  const t = effectiveTile(tileParams, wall.tile_overrides ?? {})
  const tileW = parseNum(t.tile_width)
  const tileH = parseNum(t.tile_height)
  const groutW = parseNum(t.grout_width) ?? 0
  const wallW = parseNum(wall.length)
  const wallH = parseNum(wall.height)

  if (!tileW || !tileH || !wallW || !wallH || tileW <= 0 || tileH <= 0 || wallW <= 0 || wallH <= 0) {
    return null
  }

  const wallWidthMm = wallW * 10
  const wallHeightMm = wallH * 10
  const cols = Math.ceil((wallWidthMm + groutW) / (tileW + groutW))
  const rows = Math.ceil((wallHeightMm + groutW) / (tileH + groutW))

  const maxDim = Math.max(cols, rows)
  const cellPx = Math.max(4, Math.min(32, Math.floor(1024 / maxDim)))
  // Если шов не задан — 0 пикселей. Иначе пропорционально, минимум 1px.
  const groutPx = groutW > 0
    ? Math.max(1, Math.round((groutW / (tileW + groutW)) * cellPx))
    : 0

  return {
    cols,
    rows,
    cellPx,
    groutPx,
    canvasW: cols * cellPx,
    canvasH: rows * cellPx,
    groutColor: t.grout_color ?? '#cccccc',
  }
}

// cut = { leftCutMm, rightCutMm } — сколько «съедает» сосед-победитель с каждой
// стороны. Съеденная полоса рисуется швом (не плиткой) с правильной стороны;
// логические колонки плиток (tileColors) сдвигаются вправо на leftCut.
export function buildTileTexture(wall, tileParams, tileColors, cut = null) {
  const layout = computeTextureLayout(wall, tileParams)
  if (!layout) return null

  const { cols, rows, cellPx, groutPx, canvasW, canvasH, groutColor } = layout

  const t = effectiveTile(tileParams, wall.tile_overrides ?? {})
  const stepMm = (parseNum(t.tile_width) ?? 1) + (parseNum(t.grout_width) ?? 0)
  const leftCutCols = cut ? Math.round((cut.leftCutMm ?? 0) / stepMm) : 0
  const rightCutCols = cut ? Math.round((cut.rightCutMm ?? 0) / stepMm) : 0
  const usableCols = Math.max(0, cols - leftCutCols - rightCutCols)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = groutColor
  ctx.fillRect(0, 0, canvasW, canvasH)

  const wallColors = tileColors ?? {}
  const offset = groutPx
  const tileSize = Math.max(1, cellPx - groutPx * 2)

  for (let row = 0; row < rows; row++) {
    for (let pc = 0; pc < cols; pc++) {
      const logicalCol = pc - leftCutCols
      // Съеденные полосы (слева/справа) — оставляем шов.
      if (logicalCol < 0 || logicalCol >= usableCols) continue
      const hex = wallColors[`${logicalCol}_${row}`]
      ctx.fillStyle = hex ?? groutColor   // нет цвета → шов (не белый)
      ctx.fillRect(pc * cellPx + offset, row * cellPx + offset, tileSize, tileSize)
    }
  }

  return canvas
}
