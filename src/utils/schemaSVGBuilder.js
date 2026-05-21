// src/utils/schemaSVGBuilder.js
//
// buildSchemaSVG — генерирует SVG развёртки всех стен с легендой.
//
// options:
//   scale:         'fit' | 'real'  — «На экран» или «Реальный размер 1:1»
//   drawGrout:     boolean         — рисовать ли швы
//   surplusPercent: number         — запас, %

import { resolveWallTile, contrastColor } from './schemaRenderer.js'
import { withSurplus } from './buildPalette.js'

const SYMBOL_THRESHOLD = 10000   // при > N плиток используем <symbol>/<use>
const GAP_MM   = 16              // зазор между стенами (для fit — px, для real — mm)
const PAD_MM   = 12              // боковой отступ
const LABEL_H  = 14              // высота строки с названием (одинаково)
const LEGEND_Y_OFFSET = 20       // отступ легенды от развёртки

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Вычисляет колонки/ряды и геометрию плиток для одной стены
function wallLayout(wall, globalTile, scale) {
  const ov = wall.tile_overrides ?? {}
  const tileW  = parseFloat(ov.tile_width  ?? globalTile.tile_width)
  const tileH  = parseFloat(ov.tile_height ?? globalTile.tile_height)
  const groutW = parseFloat(ov.grout_width ?? globalTile.grout_width) || 0
  const wallW  = parseFloat(wall.length)   * 10
  const wallH  = parseFloat(wall.height)   * 10

  if ([tileW, tileH, wallW, wallH].some((v) => isNaN(v) || v <= 0)) return null

  const columns = Math.ceil((wallW + groutW) / (tileW + groutW))
  const rows    = Math.ceil((wallH + groutW) / (tileH + groutW))

  return { tileW, tileH, groutW, wallW, wallH, columns, rows }
}

export function buildSchemaSVG({ walls, tile, tileColors, palette, options = {} }) {
  const { scale = 'fit', drawGrout = true, surplusPercent = 0 } = options

  const isReal = scale === 'real'
  // В режиме fit: 1 mm → 0.5 px (удобный масштаб для экрана, ≈ A4)
  const mmToPx = isReal ? 1 : 0.5

  // --- Вычисляем layout стен ---
  let curX = PAD_MM * mmToPx
  const wallLayouts = walls.map((wall) => {
    const g = wallLayout(wall, tile, mmToPx)
    if (!g) {
      const info = { wall, x: curX, w: 80 * mmToPx, h: 60 * mmToPx, placeholder: true, g: null }
      curX += 80 * mmToPx + GAP_MM * mmToPx
      return info
    }
    const w = g.wallW * mmToPx
    const h = g.wallH * mmToPx
    const info = { wall, x: curX, w, h, placeholder: false, g }
    curX += w + GAP_MM * mmToPx
    return info
  })

  const svgW = curX - GAP_MM * mmToPx + PAD_MM * mmToPx
  const maxH = wallLayouts.reduce((acc, l) => Math.max(acc, l.h), 0)
  const schemaH = LABEL_H + maxH + 16   // + нижний отступ развёртки

  // --- Подсчёт плиток для оптимизации символами ---
  let totalTiles = 0
  for (const { g } of wallLayouts) {
    if (g) totalTiles += g.columns * g.rows
  }
  const useSymbols = totalTiles > SYMBOL_THRESHOLD

  // --- Индекс hex → index ---
  const hexToIndex = new Map(palette.map((e) => [e.hex, e.index]))

  // --- Легенда ---
  const LEGEND_ROW_H = 22
  const legendY = schemaH + LEGEND_Y_OFFSET
  const legendH = palette.length * LEGEND_ROW_H + 60  // 60 = шапка

  const svgH = legendY + legendH + 24

  // --- Сборка SVG ---
  const parts = []

  const widthAttr  = isReal ? `width="${svgW}mm"` : `width="100%"`
  const heightAttr = isReal ? `height="${svgH}mm"` : ''
  const viewBoxAttr = `viewBox="0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}"`

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ${widthAttr} ${heightAttr} ${viewBoxAttr}>`,
    `<rect width="${svgW.toFixed(1)}" height="${svgH.toFixed(1)}" fill="#08080f"/>`,
  )

  // Символы для часто повторяющихся цветов
  if (useSymbols) {
    parts.push('<defs>')
    for (const entry of palette) {
      // Символ для одной плитки данного цвета — размер 1×1, масштабируется через <use>
      parts.push(
        `<symbol id="t${entry.index}" viewBox="0 0 1 1" preserveAspectRatio="none">`,
        `<rect width="1" height="1" fill="${escapeXml(entry.hex)}"/>`,
        `</symbol>`
      )
    }
    // Диагональная штриховка для масок
    parts.push(
      `<pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">`,
      `<line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>`,
      `</pattern>`,
    )
    parts.push('</defs>')
  } else {
    parts.push(
      `<defs>`,
      `<pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">`,
      `<line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>`,
      `</pattern>`,
      `</defs>`
    )
  }

  // --- Стены ---
  for (const { wall, x, w, h, placeholder, g } of wallLayouts) {
    const wallY = LABEL_H

    // Название стены
    parts.push(
      `<text x="${(x + w / 2).toFixed(1)}" y="${(LABEL_H - 3).toFixed(1)}" ` +
      `text-anchor="middle" font-size="9" fill="#64748b" font-family="system-ui">${escapeXml(wall.name)}</text>`
    )

    if (placeholder) {
      parts.push(
        `<rect x="${x.toFixed(1)}" y="${wallY.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#1e1e2e" stroke="rgba(255,255,255,0.07)" stroke-width="0.5"/>`
      )
      continue
    }

    const { tileW, tileH, groutW, columns, rows } = g
    const tw = tileW * mmToPx
    const th = tileH * mmToPx
    const gw = drawGrout ? groutW * mmToPx : 0
    const stepX = tw + gw
    const stepY = th + gw
    const gc = resolveWallTile(wall, tile).groutColor

    // Фон (шов)
    parts.push(
      `<rect x="${x.toFixed(1)}" y="${wallY.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${escapeXml(gc)}"/>`
    )

    // Floor anchor
    const startY = wallY + h - rows * stepY

    const wallColors = tileColors?.[wall.id] ?? {}

    // Плитки
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const tx = (x + col * stepX).toFixed(1)
        const ty = (startY + row * stepY).toFixed(1)

        const hex = wallColors[`${col}_${row}`] || '#3a3a4a'
        const idx = hexToIndex.get(hex)

        if (useSymbols && idx != null) {
          parts.push(
            `<use href="#t${idx}" x="${tx}" y="${ty}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}"/>`
          )
        } else {
          parts.push(
            `<rect x="${tx}" y="${ty}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}" fill="${escapeXml(hex)}"/>`
          )
        }

        // Номер цвета
        const cellPx = Math.min(tw, th)
        if (idx != null && cellPx >= 7) {
          const fs = Math.min(cellPx * 0.4, 8).toFixed(1)
          const cx = (x + col * stepX + tw / 2).toFixed(1)
          const cy = (startY + row * stepY + th / 2 + parseFloat(fs) * 0.35).toFixed(1)
          const textFill = contrastColor(hex)
          parts.push(
            `<text x="${cx}" y="${cy}" text-anchor="middle" font-size="${fs}" ` +
            `font-family="monospace" fill="${textFill}">${idx}</text>`
          )
        }
      }
    }

    // Маски
    for (const mask of (wall.masks ?? [])) {
      const mx = parseFloat(mask.x)      * 10 * mmToPx
      const my = parseFloat(mask.y)      * 10 * mmToPx
      const mw = parseFloat(mask.width)  * 10 * mmToPx
      const mh = parseFloat(mask.height) * 10 * mmToPx
      if ([mx, my, mw, mh].some(isNaN)) continue
      const absX = (x + mx).toFixed(1)
      const absY = (wallY + my).toFixed(1)
      parts.push(
        `<rect x="${absX}" y="${absY}" width="${mw.toFixed(1)}" height="${mh.toFixed(1)}" fill="rgba(8,8,15,0.75)"/>`,
        `<rect x="${absX}" y="${absY}" width="${mw.toFixed(1)}" height="${mh.toFixed(1)}" fill="url(#hatch)"/>`
      )
    }

    // Рамка стены
    parts.push(
      `<rect x="${x.toFixed(1)}" y="${wallY.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="0.5"/>`
    )
  }

  // --- Легенда ---
  const lx = PAD_MM * mmToPx

  // Шапка легенды
  const tw0 = parseFloat(tile.tile_width) || 0
  const th0 = parseFloat(tile.tile_height) || 0
  const gw0 = parseFloat(tile.grout_width) || 0
  const gc0 = tile.grout_color || '#cccccc'
  parts.push(
    `<rect x="${lx.toFixed(1)}" y="${legendY.toFixed(1)}" width="${(svgW - lx * 2).toFixed(1)}" height="24" fill="#0e1018" rx="4"/>`,
    `<text x="${(lx + 8).toFixed(1)}" y="${(legendY + 15).toFixed(1)}" font-size="10" fill="#94a3b8" font-family="system-ui">` +
    `Плитка ${tw0} × ${th0} мм · Шов ${gw0} мм · Цвет шва: ${escapeXml(gc0)}` +
    `</text>`
  )

  let rowY = legendY + 36
  for (const entry of palette) {
    const withS = withSurplus(entry.count, surplusPercent)
    const swatchX = lx
    const swatchY = rowY - 12

    parts.push(
      `<rect x="${swatchX.toFixed(1)}" y="${swatchY.toFixed(1)}" width="14" height="14" rx="3" fill="${escapeXml(entry.hex)}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>`,
      `<text x="${(swatchX + 18).toFixed(1)}" y="${(rowY - 1).toFixed(1)}" font-size="11" fill="#a78bfa" font-family="system-ui" font-weight="600">#${entry.index}</text>`,
      `<text x="${(swatchX + 42).toFixed(1)}" y="${(rowY - 1).toFixed(1)}" font-size="11" fill="#94a3b8" font-family="monospace">${escapeXml(entry.hex)}</text>`,
      `<text x="${(svgW - lx - 80).toFixed(1)}" y="${(rowY - 1).toFixed(1)}" font-size="11" fill="#f1f5f9" font-family="system-ui">${entry.count} шт.</text>`,
    )
    if (surplusPercent > 0) {
      parts.push(
        `<text x="${(svgW - lx - 40).toFixed(1)}" y="${(rowY - 1).toFixed(1)}" font-size="11" fill="#22c55e" font-family="system-ui">→ ${withS}</text>`
      )
    }
    rowY += LEGEND_ROW_H
  }

  parts.push('</svg>')

  return parts.join('\n')
}

export function downloadSVG(svgString, filename = 'schema.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
