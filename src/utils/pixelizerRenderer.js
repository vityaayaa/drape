// src/utils/pixelizerRenderer.js
import { tileRect, maskRectPx, isFullyInsideMask } from './pixelizerGeometry.js'

function floorAnchorStartY(H, rows, tileH_mm, groutW_mm, canvasScale) {
  const stepY = (tileH_mm + groutW_mm) * canvasScale
  return H - rows * stepY
}

// Определяем поддержку ctx.filter (Safari < 18 не поддерживает).
let _supportsCtxFilter = null
function supportsCtxFilter() {
  if (_supportsCtxFilter !== null) return _supportsCtxFilter
  try {
    const c = typeof document !== 'undefined' ? document.createElement('canvas') : null
    if (!c) return (_supportsCtxFilter = false)
    const ctx = c.getContext('2d')
    ctx.filter = 'brightness(0.5)'
    _supportsCtxFilter = ctx.filter === 'brightness(0.5)'
    return _supportsCtxFilter
  } catch { return (_supportsCtxFilter = false) }
}

// Фолбэк через ImageData: применяет brightness/contrast/saturate к пикселям прямо в области.
function applyImageDataFilter(ctx, x, y, w, h, brightness, contrast, saturation) {
  if (w <= 0 || h <= 0) return
  const ix = Math.max(0, Math.floor(x))
  const iy = Math.max(0, Math.floor(y))
  const cw = Math.min(ctx.canvas.width  - ix, Math.ceil(x + w) - ix)
  const ch = Math.min(ctx.canvas.height - iy, Math.ceil(y + h) - iy)
  if (cw <= 0 || ch <= 0) return
  const img = ctx.getImageData(ix, iy, cw, ch)
  const d = img.data
  const cf = contrast
  const cOffset = 128 * (1 - cf)
  const sf = saturation
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2]
    // Яркость
    r *= brightness; g *= brightness; b *= brightness
    // Контраст вокруг 128
    r = r * cf + cOffset; g = g * cf + cOffset; b = b * cf + cOffset
    // Насыщенность (вокруг luma)
    if (sf !== 1) {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
      r = luma + (r - luma) * sf
      g = luma + (g - luma) * sf
      b = luma + (b - luma) * sf
    }
    d[i]     = r < 0 ? 0 : r > 255 ? 255 : r
    d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g
    d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b
  }
  ctx.putImageData(img, ix, iy)
}

// drawWallPhoto — рисует фото/сетку на canvas одной стены.
//
// wallGroupOffsetX_mm: суммарная ширина стен слева от этой в группе (mm)
// groupTotalWidth_mm: суммарная ширина всех стен группы (mm). null = одна стена.
//
// Режимы (через gridVisible + hidePhoto):
//   photo only:  gridVisible=false, hidePhoto=false → полное фото
//   photo+grid:  gridVisible=true,  hidePhoto=false → фото + сетка поверх
//   grid only:   gridVisible=true,  hidePhoto=true  → заливка шва + плитки
export function drawWallPhoto(
  ctx, W, H,
  photo, photoSettings,
  tileGrid, canvasScale,
  gridVisible, hidePhoto,
  wallGroupOffsetX_mm = 0, groupTotalWidth_mm = null
) {
  ctx.clearRect(0, 0, W, H)
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, groutColor, masks } = tileGrid
  const showPhoto = photo && !hidePhoto

  // Фон
  ctx.fillStyle = (!showPhoto && gridVisible && columns > 0)
    ? (groutColor || '#cccccc')
    : '#2a2a3a'
  ctx.fillRect(0, 0, W, H)

  // Рисуем фото (режимы: photo, photo+grid)
  if (showPhoto) {
    const wallWidthMm = W / canvasScale
    const totalW_mm = groupTotalWidth_mm != null ? groupTotalWidth_mm : wallWidthMm
    const drawW = totalW_mm * canvasScale * photoSettings.scale
    const drawH = photo.height * (drawW / photo.width)
    const drawX = (-wallGroupOffsetX_mm + (photoSettings.offsetX_mm ?? 0)) * canvasScale
    const drawY = H - drawH - (photoSettings.offsetY_mm ?? 0) * canvasScale

    const { brightness = 1, contrast = 1, saturation = 1, opacity = 1 } = photoSettings
    const filterActive = brightness !== 1 || contrast !== 1 || saturation !== 1

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, H)
    ctx.clip()
    ctx.globalAlpha = opacity
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    if (filterActive && supportsCtxFilter()) {
      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
      ctx.drawImage(photo, drawX, drawY, drawW, drawH)
      ctx.filter = 'none'
    } else {
      ctx.drawImage(photo, drawX, drawY, drawW, drawH)
    }
    ctx.globalAlpha = 1.0
    ctx.restore()

    // Фолбэк для браузеров без ctx.filter: применяем фильтр через ImageData.
    if (filterActive && !supportsCtxFilter()) {
      // Применяем только в области, пересекающейся с canvas.
      const fx = Math.max(0, drawX)
      const fy = Math.max(0, drawY)
      const fw = Math.min(W, drawX + drawW) - fx
      const fh = Math.min(H, drawY + drawH) - fy
      applyImageDataFilter(ctx, fx, fy, fw, fh, brightness, contrast, saturation)
    }
  }

  // Сетка — все размеры считаем во float, округляем ТОЛЬКО границы плиток.
  // Иначе из-за независимого округления позиции и высоты ряды «скачут» (X2/X).
  if (gridVisible && columns > 0 && rows > 0) {
    const stepXf = (tileW_mm + groutW_mm) * canvasScale
    const stepYf = (tileH_mm + groutW_mm) * canvasScale
    const tileWf = tileW_mm * canvasScale
    const tileHf = tileH_mm * canvasScale
    const startY = floorAnchorStartY(H, rows, tileH_mm, groutW_mm, canvasScale)
    const tileStartY_mm = startY / canvasScale
    // Граница плитки i по X/Y — округлённая, общая для соседних плиток.
    const xEdge = (i) => Math.round(i * stepXf)
    const xTileEnd = (i) => Math.round(i * stepXf + tileWf)
    const yEdge = (i) => Math.round(startY + i * stepYf)
    const yTileEnd = (i) => Math.round(startY + i * stepYf + tileHf)

    if (showPhoto) {
      // photo+grid: полупрозрачные линии шва поверх фото (равномерные)
      ctx.save()
      ctx.globalAlpha = 0.30
      ctx.fillStyle = groutColor && groutColor !== '#000000' ? groutColor : '#cccccc'
      const lineW = Math.max(1, Math.round(groutW_mm * canvasScale)) || 1
      for (let col = 0; col < columns - 1; col++) {
        ctx.fillRect(xTileEnd(col), 0, lineW, H)
      }
      for (let row = 0; row < rows - 1; row++) {
        ctx.fillRect(0, yTileEnd(row), W, lineW)
      }
      ctx.restore()
    } else {
      // grid only: плитки на фоне шва, границы пиксель-выровнены
      ctx.fillStyle = '#3a3a4a'
      for (let row = 0; row < rows; row++) {
        const y0 = yEdge(row)
        const y1 = yTileEnd(row)
        for (let col = 0; col < columns; col++) {
          if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm)) continue
          const x0 = xEdge(col)
          const x1 = xTileEnd(col)
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
        }
      }
    }
  }

  _drawMasks(ctx, masks, canvasScale)
}

// drawBoundingBox — рамка поверх фото в режиме трансформации.
// Принимает те же span-параметры, что drawWallPhoto.
export function drawBoundingBox(
  ctx, W, H, photo, settings, canvasScale,
  wallGroupOffsetX_mm = 0, groupTotalWidth_mm = null
) {
  if (!photo || !settings) return
  const wallWidthMm = W / canvasScale
  const totalW_mm = groupTotalWidth_mm != null ? groupTotalWidth_mm : wallWidthMm
  const drawW = totalW_mm * canvasScale * settings.scale
  const drawH = photo.height * (drawW / photo.width)
  const drawX = (-wallGroupOffsetX_mm + (settings.offsetX_mm ?? 0)) * canvasScale
  const drawY = H - drawH - (settings.offsetY_mm ?? 0) * canvasScale

  ctx.save()
  ctx.strokeStyle = 'rgba(129,140,248,0.92)'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(129,140,248,0.55)'
  ctx.shadowBlur = 8
  ctx.strokeRect(drawX, drawY, drawW, drawH)

  const corners = [
    [drawX, drawY],
    [drawX + drawW, drawY],
    [drawX, drawY + drawH],
    [drawX + drawW, drawY + drawH],
  ]
  for (const [cx, cy] of corners) {
    ctx.beginPath()
    ctx.arc(cx, cy, 8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.93)'
    ctx.shadowColor = 'rgba(129,140,248,0.65)'
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0
  }
  ctx.restore()
}

// drawWallMosaic — режим «Мозаика»: каждый тайл залит вычисленным цветом.
// gridVisible=true рисует тонкие линии-разделители между плитками (полезно при шве 0).
export function drawWallMosaic(ctx, W, H, tileGrid, tileColors, canvasScale, gridVisible = false) {
  ctx.clearRect(0, 0, W, H)
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks, groutColor } = tileGrid

  ctx.fillStyle = groutColor || '#cccccc'
  ctx.fillRect(0, 0, W, H)

  const startY = floorAnchorStartY(H, rows, tileH_mm, groutW_mm, canvasScale)
  const tileStartY_mm = startY / canvasScale

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm)) continue
      const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
      ctx.fillStyle = tileColors[`${col}_${row}`] || '#3a3a4a'
      ctx.fillRect(r.x, Math.round(r.y + startY), r.w, r.h)
    }
  }

  // Тонкие разделители (для режима «мозаика+сетка», особенно при шве 0)
  if (gridVisible) {
    const stepX = (tileW_mm + groutW_mm) * canvasScale
    const stepY = (tileH_mm + groutW_mm) * canvasScale
    ctx.save()
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    for (let col = 1; col < columns; col++) {
      const x = Math.round(col * stepX) + 0.5
      ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let row = 1; row < rows; row++) {
      const y = Math.round(startY + row * stepY) + 0.5
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }
    ctx.restore()
  }

  _drawMasks(ctx, masks, canvasScale)
}

// drawWallPlaceholder — заглушка для стены без размеров.
export function drawWallPlaceholder(ctx, W, H, wallName) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#1e1e2e'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#3a3a5a'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
  ctx.fillStyle = '#4a4a6a'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(wallName || 'нет данных', W / 2, H / 2)
}

function _drawMasks(ctx, masks, canvasScale) {
  for (const mask of masks) {
    const r = maskRectPx(mask, canvasScale)
    if (isNaN(r.x) || isNaN(r.y) || isNaN(r.w) || isNaN(r.h)) continue
    ctx.globalAlpha = 0.55
    ctx.fillStyle = mask.color || '#888888'
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.globalAlpha = 1.0
  }
}
