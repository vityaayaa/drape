// src/utils/layoutSequencer.js
//
// Чистые функции для построения последовательности укладки плиток.
// Без React, без side-effects — только данные.

import { resolveWallTile } from './schemaRenderer.js'
import { isFullyInsideMask } from './pixelizerGeometry.js'

// ── приватные утилиты ─────────────────────────────────────────────────────────

function wallGrid(wall, globalTile) {
  // resolveWallTile возвращает значения в десятых мм (×10) — делим на 10, чтобы получить мм
  // (как в WallCanvas/pixelizer). Иначе колонок/рядов выходит в 10 раз меньше нужного.
  const r = resolveWallTile(wall, globalTile)
  const tileW = r.tileW / 10
  const tileH = r.tileH / 10
  const groutW = r.groutW / 10
  const wallW_mm = parseFloat(wall.length) * 10
  const wallH_mm = parseFloat(wall.height) * 10
  if ([tileW, tileH, wallW_mm, wallH_mm].some((v) => isNaN(v) || v <= 0)) return null
  const cols = Math.floor((wallW_mm + groutW) / (tileW + groutW))
  const rows = Math.floor((wallH_mm + groutW) / (tileH + groutW))
  if (cols <= 0 || rows <= 0) return null
  return { cols, rows, tileW, tileH, groutW, wallH_mm }
}

function floorAnchorStartY_mm(wallH_mm, rows, tileH, groutW) {
  const stepY = tileH + groutW
  return wallH_mm - rows * stepY
}

// ── buildTileSequence ─────────────────────────────────────────────────────────

/**
 * Строит упорядоченный массив всех плиток для укладки.
 *
 * @param {Array}  walls      — стены из store
 * @param {Object} globalTile — глобальные параметры плитки
 * @param {Object} tileColors — { wallId: { 'col_row': '#hex' } }
 * @param {Array}  palette    — [{ index, hex }]
 * @param {'byRow'|'byColor'} mode
 * @returns {Array<Tile>}
 */
export function buildTileSequence(walls, globalTile, tileColors, palette, mode) {
  const hexToIndex = new Map((palette ?? []).map((e) => [e.hex, e.index]))
  const groutColor = globalTile?.grout_color ?? '#888888'

  const tiles = []

  walls.forEach((wall, wallIndex) => {
    if (!wall.mosaic_active) return

    const grid = wallGrid(wall, globalTile)
    if (!grid) return

    const { cols, rows, tileW, tileH, groutW, wallH_mm } = grid
    const tileStartY_mm = floorAnchorStartY_mm(wallH_mm, rows, tileH, groutW)
    const masks = wall.masks ?? []
    const wallColors = tileColors?.[wall.id] ?? {}

    for (let canvasRow = 0; canvasRow < rows; canvasRow++) {
      for (let col = 0; col < cols; col++) {
        if (isFullyInsideMask(col, canvasRow, masks, tileW, tileH, groutW, tileStartY_mm)) continue

        const rowFromFloor = rows - 1 - canvasRow
        const hex = wallColors[`${col}_${canvasRow}`] ?? groutColor
        const colorIndex = hexToIndex.get(hex) ?? null

        tiles.push({
          wallId: wall.id,
          wallIndex,
          wallName: wall.name,
          col,
          row: canvasRow,
          rowFromFloor,
          colorHex: hex,
          colorIndex,
        })
      }
    }
  })

  if (mode === 'byColor') {
    tiles.sort((a, b) => {
      const ci_a = a.colorIndex ?? Infinity
      const ci_b = b.colorIndex ?? Infinity
      if (ci_a !== ci_b) return ci_a - ci_b
      if (a.wallIndex !== b.wallIndex) return a.wallIndex - b.wallIndex
      if (a.rowFromFloor !== b.rowFromFloor) return a.rowFromFloor - b.rowFromFloor
      return a.col - b.col
    })
  } else {
    // byRow: по стенам, внутри — снизу вверх, слева направо
    tiles.sort((a, b) => {
      if (a.wallIndex !== b.wallIndex) return a.wallIndex - b.wallIndex
      if (a.rowFromFloor !== b.rowFromFloor) return a.rowFromFloor - b.rowFromFloor
      return a.col - b.col
    })
  }

  return tiles
}

// ── getTileAt ─────────────────────────────────────────────────────────────────

/**
 * @param {Array} sequence
 * @param {number} index
 * @returns {Object|null}
 */
export function getTileAt(sequence, index) {
  if (!sequence || index < 0 || index >= sequence.length) return null
  return sequence[index]
}

// ── findTileIndex ─────────────────────────────────────────────────────────────

/**
 * Ищет позицию плитки в sequence по wallId + col + canvasRow (row).
 * Используется для перехода по тапу на превью.
 *
 * @param {Array}  sequence
 * @param {string} wallId
 * @param {number} col
 * @param {number} canvasRow  — row (не rowFromFloor!)
 * @returns {number} индекс или -1
 */
export function findTileIndex(sequence, wallId, col, canvasRow) {
  return sequence.findIndex(
    (t) => t.wallId === wallId && t.col === col && t.row === canvasRow
  )
}

// ── sequenceStats ─────────────────────────────────────────────────────────────

/**
 * @param {Array} sequence
 * @returns {{ total: number, byWall: Map<string, number>, byColor: Map<number, number> }}
 */
export function sequenceStats(sequence) {
  const byWall  = new Map()
  const byColor = new Map()

  for (const t of sequence) {
    byWall.set(t.wallId, (byWall.get(t.wallId) ?? 0) + 1)
    if (t.colorIndex != null) {
      byColor.set(t.colorIndex, (byColor.get(t.colorIndex) ?? 0) + 1)
    }
  }

  return { total: sequence.length, byWall, byColor }
}
