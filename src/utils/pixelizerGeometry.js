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

// minVisMm > 0 — порог: плитка пропускается, если её ВИДИМАЯ (не под масками) часть
// меньше minVisMm по ширине или высоте. Так убираются крошечные плитки в зазорах
// между масками (напр. между ступеньками лестницы) и тонкие срезы у краёв масок.
export function isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm = 0, wallH_mm = null, minVisMm = 0) {
  const stepX = tileW_mm + groutW_mm
  const stepY = tileH_mm + groutW_mm

  // 1) Точная проверка «плитка целиком внутри одной маски» (исходное поведение).
  const rects = []
  let fullyInside = false
  for (const m of masks) {
    const mx = parseFloat(m.x)      * 10
    const my = parseFloat(m.y)      * 10
    const mw = parseFloat(m.width)  * 10
    const mh = parseFloat(m.height) * 10
    if ([mx, my, mw, mh].some(isNaN)) continue
    const topMy = wallH_mm != null ? (wallH_mm - my - mh) : my
    const adjMy = topMy - tileStartY_mm
    if (minVisMm > 0) rects.push([mx, adjMy, mx + mw, adjMy + mh])
    const colStart = Math.ceil(mx / stepX)
    const colEnd   = Math.floor((mx + mw) / stepX)
    const rowStart = Math.ceil(adjMy / stepY)
    const rowEnd   = Math.floor((adjMy + mh) / stepY)
    if (col >= colStart && col < colEnd && row >= rowStart && row < rowEnd) {
      fullyInside = true
      break
    }
  }
  if (fullyInside) return true
  if (minVisMm <= 0 || rects.length === 0) return false

  // 2) Порог: оцениваем видимую (не под масками) часть плитки сэмплированием.
  const tx0 = col * stepX
  const ty0 = tileStartY_mm + row * stepY
  const N = 6
  let anyVis = false
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < N; i++) {
    const px = tx0 + ((i + 0.5) / N) * tileW_mm
    for (let j = 0; j < N; j++) {
      const py = ty0 + ((j + 0.5) / N) * tileH_mm
      let covered = false
      for (const r of rects) {
        if (px >= r[0] && px < r[2] && py >= r[1] && py < r[3]) { covered = true; break }
      }
      if (!covered) {
        anyVis = true
        if (px < minX) minX = px
        if (px > maxX) maxX = px
        if (py < minY) minY = py
        if (py > maxY) maxY = py
      }
    }
  }
  if (!anyVis) return true
  const cellW = tileW_mm / N
  const cellH = tileH_mm / N
  const visW = (maxX - minX) + cellW
  const visH = (maxY - minY) + cellH
  // Отбрасываем только если плитка РЕАЛЬНО обрезана по оси (видимая часть заметно
  // меньше самой плитки) И остаток меньше порога. Полную плитку не трогаем — даже
  // если она сама меньше порога.
  const cutW = visW < tileW_mm - cellW * 0.5
  const cutH = visH < tileH_mm - cellH * 0.5
  return (cutW && visW < minVisMm) || (cutH && visH < minVisMm)
}
