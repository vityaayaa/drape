// src/utils/pixelizerRenderer.js
import { tileRect, maskRectPx, isFullyInsideMask } from './pixelizerGeometry.js'

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

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, H)
    ctx.clip()
    ctx.globalAlpha = photoSettings.opacity ?? 1
    const { brightness = 1, contrast = 1, saturation = 1 } = photoSettings
    if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
    }
    ctx.drawImage(photo, drawX, drawY, drawW, drawH)
    ctx.filter = 'none'
    ctx.globalAlpha = 1.0
    ctx.restore()
  }

  // Сетка
  if (gridVisible && columns > 0 && rows > 0) {
    const tileWpx = tileW_mm * canvasScale
    const tileHpx = tileH_mm * canvasScale
    const groutPx = Math.max(1, groutW_mm * canvasScale)
    const stepX = tileWpx + groutPx
    const stepY = tileHpx + groutPx

    if (showPhoto) {
      // photo+grid: полупрозрачные линии шва поверх фото
      ctx.save()
      ctx.globalAlpha = 0.28
      ctx.fillStyle = groutColor || '#cccccc'
      for (let col = 0; col < columns; col++) {
        ctx.fillRect(col * stepX + tileWpx, 0, groutPx, H)
      }
      for (let row = 0; row < rows; row++) {
        ctx.fillRect(0, row * stepY + tileHpx, W, groutPx)
      }
      ctx.restore()
    } else {
      // grid only: плитки на фоне цвета шва
      ctx.fillStyle = '#3a3a4a'
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm)) continue
          const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
          ctx.fillRect(r.x, r.y, r.w, r.h)
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
export function drawWallMosaic(ctx, W, H, tileGrid, tileColors, canvasScale) {
  ctx.clearRect(0, 0, W, H)
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks, groutColor } = tileGrid

  ctx.fillStyle = groutColor || '#cccccc'
  ctx.fillRect(0, 0, W, H)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm)) continue
      const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
      ctx.fillStyle = tileColors[`${col}_${row}`] || '#3a3a4a'
      ctx.fillRect(r.x, r.y, r.w, r.h)
    }
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
