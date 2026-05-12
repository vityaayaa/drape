// src/utils/pixelizerSampler.js
import { tileRect, isFullyInsideMask } from './pixelizerGeometry.js'

export function averageColor(pixels, x, y, w, h, imageWidth) {
  const x1 = Math.max(0, Math.round(x))
  const y1 = Math.max(0, Math.round(y))
  const x2 = Math.min(imageWidth, Math.round(x + w))
  const imageHeight = Math.floor(pixels.length / (imageWidth * 4))
  const y2 = Math.min(imageHeight, Math.round(y + h))

  let r = 0, g = 0, b = 0, count = 0
  for (let py = y1; py < y2; py++) {
    for (let px = x1; px < x2; px++) {
      const i = (py * imageWidth + px) * 4
      r += pixels[i]
      g += pixels[i + 1]
      b += pixels[i + 2]
      count++
    }
  }
  if (count === 0) return '#888888'
  const toHex = (v) => Math.round(v / count).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Вычисляет цвет каждой плитки из зоны фото на временном canvas.
// photoBlob: Blob из IndexedDB
// photoSettings: { offsetX_mm, offsetY_mm, scale, opacity }
// tileGrid: { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks }
// canvasW, canvasH: размеры canvas стены в пикселях
// canvasScale: px per mm
// Возвращает Promise<{ 'col_row': '#hex' }>
export async function sampleWallColors(photoBlob, photoSettings, tileGrid, canvasW, canvasH, canvasScale) {
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks } = tileGrid
  const { offsetX_mm, offsetY_mm, scale, opacity } = photoSettings

  const canvas = document.createElement('canvas')
  canvas.width  = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')

  const img = await createImageBitmap(photoBlob)
  const drawW = canvasW * scale
  const drawH = img.height * (drawW / img.width)
  const drawX = offsetX_mm * canvasScale
  const drawY = offsetY_mm * canvasScale

  ctx.globalAlpha = opacity
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.globalAlpha = 1.0

  const { data: pixels } = ctx.getImageData(0, 0, canvasW, canvasH)
  const result = {}

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm)) continue
      const rect = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
      result[`${col}_${row}`] = averageColor(pixels, rect.x, rect.y, rect.w, rect.h, canvasW)
    }
  }
  return result
}
