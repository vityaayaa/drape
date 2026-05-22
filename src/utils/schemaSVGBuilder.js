// src/utils/schemaSVGBuilder.js
//
// buildSchemaSVG — генерирует SVG развёртки всех стен с легендой.
//
// options:
//   scale:         'fit' | 'real'  — «На экран» или «Реальный размер 1:1»
//   drawGrout:     boolean         — рисовать ли швы
//   surplusPercent: number         — запас, %

import { resolveWallTile } from './schemaRenderer.js'
import { isFullyInsideMask } from './pixelizerGeometry.js'

const SYMBOL_THRESHOLD = 10000   // при > N плиток используем <symbol>/<use>

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

// buildSchemaSVG — экспорт ТОЛЬКО мозаики: стены вплотную, без зазоров,
// без подписей/легенды/номеров/рамок. Маски — вырезаются (фон шва).
export function buildSchemaSVG({ walls, tile, tileColors, palette, options = {} }) {
  const { scale = 'fit', drawGrout = true } = options

  const isReal = scale === 'real'
  // В режиме fit: 1 mm → 0.5 px (удобный масштаб для экрана, ≈ A4)
  const mmToPx = isReal ? 1 : 0.5

  // --- Вычисляем layout стен (вплотную, без зазоров и отступов) ---
  let curX = 0
  const wallLayouts = walls.map((wall) => {
    const g = wallLayout(wall, tile, mmToPx)
    if (!g) return { wall, x: curX, w: 0, h: 0, placeholder: true, g: null }
    const w = g.wallW * mmToPx
    const h = g.wallH * mmToPx
    const info = { wall, x: curX, w, h, placeholder: false, g }
    curX += w
    return info
  })

  const svgW = Math.max(curX, 1)
  const svgH = wallLayouts.reduce((acc, l) => Math.max(acc, l.h), 1)

  // --- Подсчёт плиток для оптимизации символами ---
  let totalTiles = 0
  for (const { g } of wallLayouts) {
    if (g) totalTiles += g.columns * g.rows
  }
  const useSymbols = totalTiles > SYMBOL_THRESHOLD

  const hexToIndex = new Map(palette.map((e) => [e.hex, e.index]))

  // --- Сборка SVG ---
  const parts = []
  const widthAttr  = isReal ? `width="${svgW}mm"` : `width="100%"`
  const heightAttr = isReal ? `height="${svgH}mm"` : ''
  const viewBoxAttr = `viewBox="0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}"`

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" ${widthAttr} ${heightAttr} ${viewBoxAttr}>`)

  if (useSymbols) {
    parts.push('<defs>')
    for (const entry of palette) {
      parts.push(
        `<symbol id="t${entry.index}" viewBox="0 0 1 1" preserveAspectRatio="none">`,
        `<rect width="1" height="1" fill="${escapeXml(entry.hex)}"/>`,
        `</symbol>`
      )
    }
    parts.push('</defs>')
  }

  // --- Стены (вплотную, начиная с y=0) ---
  for (const { wall, x, w, h, placeholder, g } of wallLayouts) {
    if (placeholder) continue

    const { tileW, tileH, groutW, columns, rows } = g
    const tw = tileW * mmToPx
    const th = tileH * mmToPx
    const gw = drawGrout ? groutW * mmToPx : 0
    const stepX = tw + gw
    const stepY = th + gw
    const gc = resolveWallTile(wall, tile).groutColor

    // Фон (цвет шва) — заполняет всю стену
    parts.push(
      `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${escapeXml(gc)}"/>`
    )

    const startY = h - rows * stepY
    const wallColors = tileColors?.[wall.id] ?? {}
    const masks = wall.masks ?? []
    const tileStartY_mm = (h - rows * stepY) / mmToPx

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        // Маски — оставляем фон шва (вырез), плитку не рисуем
        if (isFullyInsideMask(col, row, masks, tileW, tileH, groutW, tileStartY_mm)) continue
        const tx = (x + col * stepX).toFixed(1)
        const ty = (startY + row * stepY).toFixed(1)
        const hex = wallColors[`${col}_${row}`] || gc
        const idx = hexToIndex.get(hex)
        if (useSymbols && idx != null) {
          parts.push(`<use href="#t${idx}" x="${tx}" y="${ty}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}"/>`)
        } else {
          parts.push(`<rect x="${tx}" y="${ty}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}" fill="${escapeXml(hex)}"/>`)
        }
      }
    }
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
