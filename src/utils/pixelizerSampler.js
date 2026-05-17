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

// sampleWallColors — вычисляет цвет каждой плитки из зоны фото.
//
// wallGroupOffsetX_mm: ширина стен слева от этой в группе (mm)
// groupTotalWidth_mm: полная ширина группы (mm). null = одна стена.
export async function sampleWallColors(
  photoBlob, photoSettings, tileGrid,
  canvasW, canvasH, canvasScale,
  wallGroupOffsetX_mm = 0, groupTotalWidth_mm = null
) {
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks } = tileGrid
  const { offsetX_mm, offsetY_mm, scale, opacity, brightness = 1, contrast = 1, saturation = 1 } = photoSettings

  const canvas = document.createElement('canvas')
  canvas.width  = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')

  const img = await createImageBitmap(photoBlob)

  const wallWidthMm = canvasW / canvasScale
  const totalW_mm = groupTotalWidth_mm != null ? groupTotalWidth_mm : wallWidthMm
  const drawW = totalW_mm * canvasScale * scale
  const drawH = img.height * (drawW / img.width)
  const drawX = (-wallGroupOffsetX_mm + (offsetX_mm ?? 0)) * canvasScale
  const drawY = canvasH - drawH - (offsetY_mm ?? 0) * canvasScale

  ctx.globalAlpha = opacity ?? 1
  if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
    ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
  }
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.filter = 'none'
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
