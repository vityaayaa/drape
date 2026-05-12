// src/utils/pixelizerRenderer.js
import { tileRect, maskRectPx, isFullyInsideMask } from './pixelizerGeometry.js'

// Режим «Фото»: фото видно сквозь «окна» плиток, швы в цвете шва.
// ctx: CanvasRenderingContext2D
// W, H: размеры canvas
// photo: HTMLImageElement | ImageBitmap | null
// photoSettings: { offsetX_mm, offsetY_mm, scale, opacity }
// tileGrid: { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks, groutColor }
// canvasScale: px/mm
// gridVisible: boolean
export function drawWallPhoto(ctx, W, H, photo, photoSettings, tileGrid, canvasScale, gridVisible) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#2a2a3a'
  ctx.fillRect(0, 0, W, H)

  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks, groutColor } = tileGrid

  if (gridVisible && columns > 0 && rows > 0) {
    ctx.fillStyle = groutColor || '#cccccc'
    ctx.fillRect(0, 0, W, H)

    ctx.globalAlpha = photo ? photoSettings.opacity : 1.0
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm)) continue
        const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
        ctx.save()
        ctx.beginPath()
        ctx.rect(r.x, r.y, r.w, r.h)
        ctx.clip()
        if (photo) {
          const drawW = W * photoSettings.scale
          const drawH = photo.height * (drawW / photo.width)
          const drawX = photoSettings.offsetX_mm * canvasScale
          const drawY = photoSettings.offsetY_mm * canvasScale
          ctx.drawImage(photo, drawX, drawY, drawW, drawH)
        } else {
          ctx.fillStyle = '#3a3a4a'
          ctx.fillRect(r.x, r.y, r.w, r.h)
        }
        ctx.restore()
      }
    }
    ctx.globalAlpha = 1.0
  } else if (photo) {
    ctx.globalAlpha = photoSettings.opacity
    const drawW = W * photoSettings.scale
    const drawH = photo.height * (drawW / photo.width)
    ctx.drawImage(photo, photoSettings.offsetX_mm * canvasScale, photoSettings.offsetY_mm * canvasScale, drawW, drawH)
    ctx.globalAlpha = 1.0
  }

  _drawMasks(ctx, masks, canvasScale)
}

// Режим «Мозаика»: каждый тайл залит вычисленным цветом, швы в цвете шва.
// tileColors: { 'col_row': '#hex' }
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

// Заглушка для стены без размеров.
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
