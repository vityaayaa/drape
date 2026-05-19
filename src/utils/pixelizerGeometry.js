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

export function maskRectPx(mask, scale) {
  return {
    x: parseFloat(mask.x)      * 10 * scale,
    y: parseFloat(mask.y)      * 10 * scale,
    w: parseFloat(mask.width)  * 10 * scale,
    h: parseFloat(mask.height) * 10 * scale,
  }
}

export function isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm = 0) {
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
    const adjMy    = my - tileStartY_mm
    const rowStart = Math.ceil(adjMy / stepY)
    const rowEnd   = Math.floor((adjMy + mh) / stepY)
    return col >= colStart && col < colEnd && row >= rowStart && row < rowEnd
  })
}
