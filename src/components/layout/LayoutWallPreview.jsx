// src/components/layout/LayoutWallPreview.jsx
//
// Canvas-превью одной стены для режима укладки.
// Подсвечивает текущую плитку и соседей, отмечает уложенные, рисует маски.

import { useRef, useEffect, useCallback } from 'react'
import { resolveWallTile } from '../../utils/schemaRenderer.js'
import { isFullyInsideMask, maskRectPx } from '../../utils/pixelizerGeometry.js'

const PREVIEW_H = 240         // CSS высота canvas
const HIGHLIGHT_COLOR = '#a78bfa'   // обводка текущей плитки
const HIGHLIGHT_WIDTH = 3
const NEIGHBOR_OVERLAY = 'rgba(167,139,250,0.18)'
const DONE_OVERLAY = 'rgba(0,0,0,0.45)'
const NO_COLOR = '#3a3a4a'    // плитка без tileColors

// ── вспомогательные функции ───────────────────────────────────────────────────

function floorAnchorStartY(H, rows, tileHpx, groutPx) {
  return H - rows * (tileHpx + groutPx)
}

function buildWallGrid(wall, globalTile) {
  // resolveWallTile в десятых мм (×10) — приводим к мм делением на 10 (как WallCanvas).
  const r = resolveWallTile(wall, globalTile)
  const tileW = r.tileW / 10
  const tileH = r.tileH / 10
  const groutW = r.groutW / 10
  const wallW_mm = parseFloat(wall.length) * 10
  const wallH_mm = parseFloat(wall.height) * 10
  if ([tileW, tileH, wallW_mm, wallH_mm].some((v) => isNaN(v) || v <= 0)) return null
  const cols = Math.ceil((wallW_mm + groutW) / (tileW + groutW))
  const rows = Math.ceil((wallH_mm + groutW) / (tileH + groutW))
  if (cols <= 0 || rows <= 0) return null
  return { cols, rows, tileW, tileH, groutW, wallW_mm, wallH_mm }
}

function isNeighbor(col, row, cTile) {
  if (!cTile) return false
  const dc = Math.abs(col - cTile.col)
  const dr = Math.abs(row - cTile.row)   // canvasRow comparison
  return (dc === 1 && dr === 0) || (dc === 0 && dr === 1)
}

// ── компонент ─────────────────────────────────────────────────────────────────

export default function LayoutWallPreview({
  wall,
  globalTile,
  tileColors,
  currentTile,
  completedSet,
  onTileClick,
}) {
  const canvasRef      = useRef(null)
  const containerRef   = useRef(null)
  const gridRef        = useRef(null)
  const drawMetaRef    = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !wall) return

    const dpr  = window.devicePixelRatio || 1
    const cssW = canvas.offsetWidth  || 320
    const cssH = canvas.offsetHeight || PREVIEW_H

    canvas.width  = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#08080f'
    ctx.fillRect(0, 0, cssW, cssH)

    const grid = buildWallGrid(wall, globalTile)
    if (!grid) return
    gridRef.current = grid

    const { cols, rows, tileW, tileH, groutW, wallW_mm, wallH_mm } = grid

    // Масштаб: самая высокая стена = PREVIEW_H - 20px отступы
    const scaleH = (cssH - 20) / wallH_mm
    const scaleW = (cssW - 32) / wallW_mm
    const scale  = Math.min(scaleH, scaleW)

    const tileWpx = tileW * scale
    const tileHpx = tileH * scale
    const groutPx = groutW * scale
    const stepX   = tileWpx + groutPx
    const stepY   = tileHpx + groutPx

    const totalW  = cols * stepX - groutPx
    const totalH  = rows * stepY - groutPx

    // Центрирование в доступном пространстве
    const offsetX = (cssW - totalW) / 2
    const startY  = (cssH - totalH) / 2   // верхний край сетки (уже выровнен по центру)

    const masks        = wall.masks ?? []
    const wallColors   = tileColors?.[wall.id] ?? {}
    const cTile        = currentTile?.wallId === wall.id ? currentTile : null
    const completed    = completedSet ?? new Set()

    // Фон шва
    const { groutColor } = resolveWallTile(wall, globalTile)
    ctx.fillStyle = groutColor
    ctx.fillRect(offsetX, startY, totalW, totalH)

    // tileStartY_mm для isFullyInsideMask
    // floorAnchor в мм: wallH - rows * stepH_mm
    const tileStartY_mm = wallH_mm - rows * (tileH + groutW)

    // ── плитки ───────────────────────────────────────────────────────────────
    for (let canvasRow = 0; canvasRow < rows; canvasRow++) {
      for (let col = 0; col < cols; col++) {
        if (isFullyInsideMask(col, canvasRow, masks, tileW, tileH, groutW, tileStartY_mm, wallH_mm)) continue

        const tx = offsetX + col * stepX
        const ty = startY  + canvasRow * stepY

        const hex = wallColors[`${col}_${canvasRow}`] ?? NO_COLOR
        ctx.fillStyle = hex
        ctx.fillRect(tx, ty, tileWpx, tileHpx)

        // Уложенные плитки
        const doneKey = `${wall.id}:${col}:${canvasRow}`
        if (completed.has(doneKey)) {
          ctx.fillStyle = DONE_OVERLAY
          ctx.fillRect(tx, ty, tileWpx, tileHpx)
          // Галочка при достаточном размере
          if (Math.min(tileWpx, tileHpx) >= 14) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)'
            ctx.font = `${Math.min(tileWpx, tileHpx) * 0.5}px system-ui`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('✓', tx + tileWpx / 2, ty + tileHpx / 2)
          }
          continue
        }

        // Соседние плитки
        if (cTile && isNeighbor(col, canvasRow, cTile)) {
          ctx.fillStyle = NEIGHBOR_OVERLAY
          ctx.fillRect(tx, ty, tileWpx, tileHpx)
        }
      }
    }

    // ── маски: штриховка ─────────────────────────────────────────────────────
    ctx.save()
    ctx.beginPath()
    ctx.rect(offsetX, startY, totalW, totalH)
    ctx.clip()
    for (const mask of masks) {
      const r = maskRectPx(mask, scale, wallH_mm)
      if ([r.x, r.y, r.w, r.h].some(isNaN)) continue
      const mx = offsetX + r.x
      const my = startY  + r.y
      ctx.fillStyle = 'rgba(8,8,15,0.75)'
      ctx.fillRect(mx, my, r.w, r.h)
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

    // ── рамка стены ──────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1
    ctx.strokeRect(offsetX + 0.5, startY + 0.5, totalW - 1, totalH - 1)

    // ── текущая плитка: яркая обводка ─────────────────────────────────────
    if (cTile) {
      const tx = offsetX + cTile.col * stepX
      const ty = startY  + cTile.row * stepY   // cTile.row = canvasRow
      ctx.strokeStyle = HIGHLIGHT_COLOR
      ctx.lineWidth   = HIGHLIGHT_WIDTH
      ctx.strokeRect(
        tx - HIGHLIGHT_WIDTH / 2,
        ty - HIGHLIGHT_WIDTH / 2,
        tileWpx + HIGHLIGHT_WIDTH,
        tileHpx + HIGHLIGHT_WIDTH,
      )
    }

    // Сохраняем метаданные для hit-test
    drawMetaRef.current = { offsetX, startY, stepX, stepY, tileWpx, tileHpx, cols, rows }
  }, [wall, globalTile, tileColors, currentTile, completedSet])

  // Перерисовка при изменении данных
  useEffect(() => {
    draw()
  }, [draw])

  // Авто-центрирование на текущей плитке при смене
  useEffect(() => {
    const container = containerRef.current
    const canvas    = canvasRef.current
    if (!container || !canvas || !currentTile) return
    if (currentTile.wallId !== wall?.id) return

    const meta = drawMetaRef.current
    if (!meta) return

    const tileCenterX = meta.offsetX + currentTile.col * meta.stepX + meta.tileWpx / 2
    const scrollTarget = tileCenterX - container.offsetWidth / 2

    container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' })
    // Зависимости — примитивы (не объект currentTile), иначе эффект срабатывает
    // на каждый рендер (например при «Отметить») и превью самопроизвольно скроллится.
  }, [currentTile?.wallId, currentTile?.col, currentTile?.row, wall?.id])

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas || !onTileClick) return
    const meta = drawMetaRef.current
    if (!meta) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const col = Math.floor((x - meta.offsetX) / meta.stepX)
    const row = Math.floor((y - meta.startY)  / meta.stepY)

    if (col >= 0 && col < meta.cols && row >= 0 && row < meta.rows) {
      onTileClick(col, row)
    }
  }, [onTileClick])

  return (
    <div ref={containerRef} style={s.container}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={s.canvas}
      />
    </div>
  )
}

const s = {
  container: {
    width: '100%',
    height: PREVIEW_H,
    overflowX: 'auto',
    overflowY: 'hidden',
    background: '#08080f',
    position: 'relative',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: PREVIEW_H,
    minWidth: 0,
    cursor: 'pointer',
  },
}
