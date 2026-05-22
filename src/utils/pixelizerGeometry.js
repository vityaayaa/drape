// src/utils/pixelizerGeometry.js

// availablePx: высота в пикселях, которую должна занять самая высокая стена
export function computeScale(walls, availablePx) {
  const maxHeight = walls.reduce((max, w) => {
    const h = parseFloat(w.height)
    return isNaN(h) ? max : Math.max(max, h * 10)
  }, 0)
  if (maxHeight <= 0) return 1
  return availablePx / maxHeight
}

export function wallCanvasDimensions(wall, scale) {
  const w = parseFloat(wall.length)
  const h = parseFloat(wall.height)
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
    return { width: 120, height: 80, placeholder: true }
  }
  return {
    width: Math.round(w * 10 * scale),
    height: Math.round(h * 10 * scale),
    placeholder: false,
  }
}

export function tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, scale) {
  const stepX = (tileW_mm + groutW_mm) * scale
  const stepY = (tileH_mm + groutW_mm) * scale
  return {
    x: col * stepX,
    y: row * stepY,
    w: tileW_mm * scale,
    h: tileH_mm * scale,
  }
}

// mask.y задаётся ОТ ПОЛА (до низа маски). В canvas Y идёт сверху, поэтому при
// известной высоте стены (wallH_mm) переводим: верх маски от верха = H - y - h.
export function maskRectPx(mask, scale, wallH_mm = null) {
  const y = parseFloat(mask.y)      * 10
  const h = parseFloat(mask.height) * 10
  const topY = wallH_mm != null ? (wallH_mm - y - h) : y
  return {
    x: parseFloat(mask.x)      * 10 * scale,
    y: topY * scale,
    w: parseFloat(mask.width)  * 10 * scale,
    h: h * scale,
  }
}

export function isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm = 0, wallH_mm = null) {
  const stepX = tileW_mm + groutW_mm
  const stepY = tileH_mm + groutW_mm
  return masks.some((m) => {
    const mx = parseFloat(m.x)      * 10
    const my = parseFloat(m.y)      * 10
    const mw = parseFloat(m.width)  * 10
    const mh = parseFloat(m.height) * 10
    if ([mx, my, mw, mh].some(isNaN)) return false
    const colStart = Math.ceil(mx / stepX)
    const colEnd   = Math.floor((mx + mw) / stepX)
    // Верх маски от верха стены (Y от пола → canvas сверху).
    const topMy    = wallH_mm != null ? (wallH_mm - my - mh) : my
    const adjMy    = topMy - tileStartY_mm
    const rowStart = Math.ceil(adjMy / stepY)
    const rowEnd   = Math.floor((adjMy + mh) / stepY)
    return col >= colStart && col < colEnd && row >= rowStart && row < rowEnd
  })
}
