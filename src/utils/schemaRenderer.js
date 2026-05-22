// src/utils/schemaRenderer.js
//
// drawSchema — рисует развёртку всех стен на один canvas.
//
// Параметры:
//   canvas       — HTMLCanvasElement
//   walls        — массив стен из store
//   tile         — глобальные параметры плитки { tile_width, tile_height, grout_width, grout_color }
//   tileColors   — { wallId: { 'col_row': '#hex' } }
//   palette      — результат buildPalette (для сопоставления номеров цветов)
//   pixelRatio   — devicePixelRatio (default 1)

import { isFullyInsideMask, maskRectPx } from './pixelizerGeometry.js'

// --- внутренние утилиты ---

function floorAnchorStartY(H, rows, tileH_mm, groutW_mm, scale) {
  const stepY = (tileH_mm + groutW_mm) * scale
  return H - rows * stepY
}

export function resolveWallTile(wall, globalTile) {
  const ov = wall.tile_overrides ?? {}
  return {
    tileW: parseFloat(ov.tile_width  ?? globalTile.tile_width)  * 10,
    tileH: parseFloat(ov.tile_height ?? globalTile.tile_height) * 10,
    groutW: parseFloat(ov.grout_width ?? globalTile.grout_width) * 10 || 0,
    groutColor: ov.grout_color ?? globalTile.grout_color ?? '#cccccc',
  }
}

// Автоконтраст текста относительно цвета фона (hex)
export function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // relative luminance
  const toLinear = (c) => {
    const n = c / 255
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return L > 0.179 ? '#0f172a' : '#f1f5f9'
}

// Число колонок/рядов для стены
function wallGrid(wall, tile) {
  const { tileW, tileH, groutW } = resolveWallTile(wall, tile)
  // resolveWallTile возвращает tileW/H/grout в десятых мм (×10), поэтому стену тоже
  // переводим в десятые мм (см × 100), чтобы соотношение колонок совпало с calculateGrid.
  const wallW_mm = parseFloat(wall.length)  * 100
  const wallH_mm = parseFloat(wall.height)  * 100
  if ([tileW, tileH, wallW_mm, wallH_mm].some((v) => isNaN(v) || v <= 0)) return null
  const columns = Math.ceil((wallW_mm + groutW) / (tileW + groutW))
  const rows    = Math.ceil((wallH_mm + groutW) / (tileH + groutW))
  return { columns, rows, tileW, tileH, groutW, wallW_mm, wallH_mm }
}

// --- buildSchemaLayout ---
// Возвращает описание позиций всех стен в контексте canvas.
//
// availableH — высота верхней части без паддингов (px).
// GAP        — горизонтальный зазор между стенами (px).
// PADDING    — боковой отступ с каждой стороны (px).
export function buildSchemaLayout(walls, tile, availableH, { gap = 16, padding = 12, targetFill = 0.8 } = {}) {
  if (walls.length === 0) return { scale: 1, wallLayouts: [], totalWidth: 0 }

  // maxHeight_mm — самая высокая валидная стена
  let maxH_mm = 0
  for (const w of walls) {
    const g = wallGrid(w, tile)
    if (g) maxH_mm = Math.max(maxH_mm, g.wallH_mm)
  }

  const scale = maxH_mm > 0 ? (availableH * targetFill) / maxH_mm : 1

  let x = padding
  const wallLayouts = walls.map((wall) => {
    const g = wallGrid(wall, tile)
    if (!g) {
      const layout = { wall, x, width: 80, height: 56, placeholder: true, scale, grid: null }
      x += 80 + gap
      return layout
    }
    const width  = Math.round(g.wallW_mm * scale)
    const height = Math.round(g.wallH_mm * scale)
    const layout = { wall, x, width, height, placeholder: false, scale, grid: g }
    x += width + gap
    return layout
  })

  const totalWidth = x - gap + padding

  return { scale, wallLayouts, totalWidth }
}

// --- drawSchema ---
export function drawSchema(canvas, { walls, tile, tileColors, palette }) {
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.offsetWidth  || canvas.width  / dpr
  const cssH = canvas.offsetHeight || canvas.height / dpr

  if (cssW <= 0 || cssH <= 0) return

  canvas.width  = Math.round(cssW * dpr)
  canvas.height = Math.round(cssH * dpr)

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // Очистка
  ctx.fillStyle = '#08080f'
  ctx.fillRect(0, 0, cssW, cssH)

  const LABEL_H  = 18   // px под название стены
  const GAP      = 16
  const PADDING  = 12
  const availableH = cssH - LABEL_H - 24  // 24px вертикальный паддинг

  const { wallLayouts, totalWidth } = buildSchemaLayout(
    walls, tile, availableH, { gap: GAP, padding: PADDING }
  )

  if (wallLayouts.length === 0) return

  // Индекс hex → номер для быстрого поиска
  const hexToIndex = new Map(palette.map((e) => [e.hex, e.index]))

  const TOP_OFFSET = 14  // отступ сверху

  for (const layout of wallLayouts) {
    const { wall, x, width, height, placeholder, scale, grid } = layout
    const wallColors = tileColors?.[wall.id] ?? {}

    // --- название стены (над стеной, в зазоре) ---
    ctx.fillStyle = '#64748b'
    ctx.font = '500 9px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(wall.name, x + width / 2, TOP_OFFSET + 9)

    const wallY = TOP_OFFSET + LABEL_H

    if (placeholder) {
      // Заглушка для стены без размеров
      ctx.fillStyle = '#1e1e2e'
      ctx.fillRect(x, wallY, width, height)
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, wallY + 0.5, width - 1, height - 1)
      continue
    }

    const { tileW, tileH, groutW, groutColor, columns, rows } = { ...resolveWallTile(wall, tile), ...grid }

    // --- Фон шва ---
    ctx.fillStyle = groutColor
    ctx.fillRect(x, wallY, width, height)

    // --- clip к области стены ---
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, wallY, width, height)
    ctx.clip()

    const stepX = (tileW + groutW) * scale
    const stepY = (tileH + groutW) * scale
    const tileWpx = tileW * scale
    const tileHpx = tileH * scale
    const startY = floorAnchorStartY(height, rows, tileH, groutW, scale)
    const tileStartY_mm = startY / scale

    const masks = wall.masks ?? []

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (isFullyInsideMask(col, row, masks, tileW, tileH, groutW, tileStartY_mm)) continue

        const tx = x + col * stepX
        const ty = wallY + startY + row * stepY

        const hex = wallColors[`${col}_${row}`]
        ctx.fillStyle = hex || '#3a3a4a'
        ctx.fillRect(tx, ty, tileWpx, tileHpx)

        // Номер цвета (при клетке на экране ≥ 14px)
        const cellPx = Math.min(tileWpx, tileHpx)
        if (hex && cellPx >= 14) {
          const idx = hexToIndex.get(hex)
          if (idx != null) {
            const fontSize = Math.min(cellPx * 0.4, 8)
            ctx.fillStyle = contrastColor(hex)
            ctx.font = `${fontSize}px monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(String(idx), tx + tileWpx / 2, ty + tileHpx / 2)
          }
        }
      }
    }

    // --- Маски: затемнение + диагональная штриховка ---
    for (const mask of masks) {
      const r = maskRectPx(mask, scale)
      if ([r.x, r.y, r.w, r.h].some(isNaN)) continue
      // Маска рисуется от верха стены (не floor anchor)
      const mx = x + r.x
      const my = wallY + r.y

      ctx.fillStyle = 'rgba(8,8,15,0.75)'
      ctx.fillRect(mx, my, r.w, r.h)

      // SVG-штриховка через canvas path
      ctx.save()
      ctx.beginPath()
      ctx.rect(mx, my, r.w, r.h)
      ctx.clip()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      const step = 8
      const diag = r.w + r.h
      for (let d = -diag; d < diag; d += step) {
        ctx.beginPath()
        ctx.moveTo(mx + d, my)
        ctx.lineTo(mx + d + r.h, my + r.h)
        ctx.stroke()
      }
      ctx.restore()
    }

    ctx.restore()

    // --- Рамка стены ---
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, wallY + 0.5, width - 1, height - 1)

    // Стена без пикселизации — overlay «Не пикселизировано»
    if (!tileColors?.[wall.id]) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, wallY, width, height)
      ctx.clip()

      // диагональная штриховка
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      const step = 12
      const diag = width + height
      for (let d = -diag; d < diag; d += step) {
        ctx.beginPath()
        ctx.moveTo(x + d, wallY)
        ctx.lineTo(x + d + height, wallY + height)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(8,8,15,0.55)'
      ctx.fillRect(x, wallY, width, height)

      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.font = '500 9px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Не пикселизировано', x + width / 2, wallY + height / 2)

      ctx.restore()
    }
  }
}
