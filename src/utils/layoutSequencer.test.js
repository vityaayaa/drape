// src/utils/layoutSequencer.test.js
import { describe, it, expect } from 'vitest'
import {
  buildTileSequence,
  getTileAt,
  findTileIndex,
  sequenceStats,
} from './layoutSequencer.js'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeWall(overrides = {}) {
  return {
    id: overrides.id ?? 'w1',
    name: overrides.name ?? 'Стена 1',
    length: overrides.length ?? '200',   // см
    height: overrides.height ?? '250',   // см
    wall_active: true,
    mosaic_active: overrides.mosaic_active ?? true,
    tile_overrides: overrides.tile_overrides ?? {},
    masks: overrides.masks ?? [],
  }
}

// tile_width/height хранится в мм. resolveWallTile умножает на 10 (→ 0.1мм единицы).
// wallW_mm = parseFloat(wall.length) * 10 (см → 0.1мм единицы).
// Стена 200см → wallW = 2000. Плитка 20мм → tileW = 200. cols = floor(2000/200) = 10.
// Стена 250см → wallH = 2500. Плитка 25мм → tileH = 250. rows = floor(2500/250) = 10.
// totalTiles = 10×10 = 100

const TILE = {
  tile_width:  '20',   // мм → resolveWallTile даёт tileW=200
  tile_height: '25',   // мм → tileH=250
  grout_width: '0',
  grout_color: '#888888',
}

// Стена 200×250см, плитка 20×25мм, шов 0 → 10 cols × 10 rows = 100 плиток

// ── buildTileSequence ─────────────────────────────────────────────────────────

describe('buildTileSequence — byRow', () => {
  it('возвращает пустой массив для пустого walls', () => {
    const seq = buildTileSequence([], TILE, {}, [], 'byRow')
    expect(seq).toEqual([])
  })

  it('пропускает стену с mosaic_active=false', () => {
    const wall = makeWall({ mosaic_active: false })
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    expect(seq).toHaveLength(0)
  })

  it('пропускает стену без размеров', () => {
    const wall = makeWall({ length: '', height: '' })
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    expect(seq).toHaveLength(0)
  })

  it('строит sequence для одной стены 200×250см, плитка 20×25мм, шов 0', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    expect(seq).toHaveLength(10 * 10) // 100
  })

  it('нижняя плитка имеет rowFromFloor=0', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    const bottomTiles = seq.filter((t) => t.rowFromFloor === 0)
    expect(bottomTiles).toHaveLength(10) // нижний ряд = 10 плиток
  })

  it('верхняя плитка имеет rowFromFloor=totalRows-1=9', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    const topTiles = seq.filter((t) => t.rowFromFloor === 9)
    expect(topTiles).toHaveLength(10)
  })

  it('byRow: сортировка — сначала rowFromFloor=0 слева направо', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    expect(seq[0].rowFromFloor).toBe(0)
    expect(seq[0].col).toBe(0)
    expect(seq[1].rowFromFloor).toBe(0)
    expect(seq[1].col).toBe(1)
  })

  it('byRow: после последней плитки ряда 0 идёт ряд 1', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    // ряд 0: позиции 0..9, ряд 1 начинается с позиции 10
    expect(seq[10].rowFromFloor).toBe(1)
    expect(seq[10].col).toBe(0)
  })

  it('byRow: две стены — сначала все плитки стены 1, потом стены 2', () => {
    const w1 = makeWall({ id: 'w1', name: 'Стена 1' })
    const w2 = makeWall({ id: 'w2', name: 'Стена 2' })
    const seq = buildTileSequence([w1, w2], TILE, {}, [], 'byRow')
    expect(seq[0].wallId).toBe('w1')
    expect(seq[100].wallId).toBe('w2')
  })

  it('каждая запись содержит все обязательные поля', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    const t = seq[0]
    expect(t).toHaveProperty('wallId')
    expect(t).toHaveProperty('wallIndex')
    expect(t).toHaveProperty('col')
    expect(t).toHaveProperty('row')       // canvasRow
    expect(t).toHaveProperty('rowFromFloor')
    expect(t).toHaveProperty('colorHex')
    expect(t).toHaveProperty('colorIndex')
    expect(t).toHaveProperty('wallName')
  })
})

describe('buildTileSequence — маски', () => {
  it('плитка полностью в маске пропускается', () => {
    // isFullyInsideMask: mask.x/y/width/height в СМ, умножается на 10 внутри.
    // tileW=200 (0.1мм единицы) → плитка в СМ = 200/10/10 = 2см (width_cm)
    // Аналогично: tileH=250 → 25мм = 2.5см. Значит ровно 1 плитка = 20см × 25см
    const wall = makeWall({
      masks: [{ id: 'm1', name: 'маска', x: '0', y: '0', width: '20', height: '25', color: '#fff' }],
    })
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    // должна пропасть 1 плитка из 100
    expect(seq).toHaveLength(99)
  })

  it('плитка частично в маске НЕ пропускается', () => {
    // Маска 1×1 см — меньше плитки 20×25см, ни одна не попадает целиком
    const wall = makeWall({
      masks: [{ id: 'm1', name: 'маска', x: '0', y: '0', width: '1', height: '1', color: '#fff' }],
    })
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    expect(seq).toHaveLength(100) // ни одна не удалена
  })
})

describe('buildTileSequence — byColor', () => {
  it('byColor: все плитки цвета 1 перед плитками цвета 2', () => {
    // Стена 100×100 см, плитка 20×25мм → cols=5, rows=4, итого 20 плиток
    const w1 = makeWall({ id: 'w1', name: 'Стена 1', length: '100', height: '100' })
    const tileColors = { w1: {} }
    // col 0-1 → '#ff0000', col 2-4 → '#0000ff'
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 4; row++) {
        tileColors.w1[`${col}_${row}`] = col < 2 ? '#ff0000' : '#0000ff'
      }
    }

    const palette = [
      { index: 1, hex: '#ff0000' },
      { index: 2, hex: '#0000ff' },
    ]

    const seq = buildTileSequence([w1], TILE, tileColors, palette, 'byColor')
    expect(seq[0].colorHex).toBe('#ff0000')
    expect(seq[seq.length - 1].colorHex).toBe('#0000ff')

    const firstBlue = seq.findIndex((t) => t.colorHex === '#0000ff')
    const lastRed   = seq.findLastIndex((t) => t.colorHex === '#ff0000')
    expect(lastRed).toBeLessThan(firstBlue)
  })

  it('byColor: внутри одного цвета — сначала wallIndex=0, потом wallIndex=1', () => {
    // 20 плиток на каждую стену, все красные
    const w1 = makeWall({ id: 'w1', name: 'Стена 1', length: '100', height: '100' })
    const w2 = makeWall({ id: 'w2', name: 'Стена 2', length: '100', height: '100' })
    const tileColors = { w1: {}, w2: {} }
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 4; row++) {
        tileColors.w1[`${col}_${row}`] = '#ff0000'
        tileColors.w2[`${col}_${row}`] = '#ff0000'
      }
    }
    const palette = [{ index: 1, hex: '#ff0000' }]
    const seq = buildTileSequence([w1, w2], TILE, tileColors, palette, 'byColor')
    expect(seq[0].wallId).toBe('w1')
    expect(seq[20].wallId).toBe('w2')
  })
})

describe('buildTileSequence — colorHex', () => {
  it('colorHex берётся из tileColors если есть', () => {
    // Стена 100×100см: cols=5, rows=4
    const wall = makeWall({ length: '100', height: '100' })
    const tileColors = { w1: { '0_0': '#aabbcc' } }
    // canvasRow=0 — верхний ряд. rowFromFloor = totalRows-1-0 = 3 (при 4 рядах)
    const palette = [{ index: 1, hex: '#aabbcc' }]
    const seq = buildTileSequence([wall], TILE, tileColors, palette, 'byRow')
    const t = seq.find((t) => t.col === 0 && t.rowFromFloor === 3)
    expect(t?.colorHex).toBe('#aabbcc')
    expect(t?.colorIndex).toBe(1)
  })

  it('colorHex = grout_color если нет записи в tileColors', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    expect(seq[0].colorHex).toBe('#888888') // grout_color из TILE
  })
})

// ── getTileAt ─────────────────────────────────────────────────────────────────

describe('getTileAt', () => {
  it('возвращает плитку по индексу', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    const t = getTileAt(seq, 0)
    expect(t).not.toBeNull()
    expect(t?.col).toBe(0)
    expect(t?.rowFromFloor).toBe(0)
  })

  it('возвращает null для индекса вне диапазона', () => {
    const seq = []
    expect(getTileAt(seq, 0)).toBeNull()
    expect(getTileAt(seq, -1)).toBeNull()
  })

  it('возвращает null для пустого sequence', () => {
    expect(getTileAt([], 0)).toBeNull()
  })
})

// ── findTileIndex ─────────────────────────────────────────────────────────────

describe('findTileIndex', () => {
  it('находит плитку по wallId + col + canvasRow', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    // нижняя плитка col=0: rowFromFloor=0, canvasRow=24 (totalRows-1)
    const t = seq.find((t) => t.col === 0 && t.rowFromFloor === 0)
    const idx = findTileIndex(seq, t.wallId, t.col, t.row)
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(seq[idx]).toBe(t)
  })

  it('возвращает -1 если плитка не найдена', () => {
    const seq = []
    expect(findTileIndex(seq, 'w1', 0, 0)).toBe(-1)
  })
})

// ── sequenceStats ─────────────────────────────────────────────────────────────

describe('sequenceStats', () => {
  it('total соответствует длине sequence', () => {
    const wall = makeWall()
    const seq = buildTileSequence([wall], TILE, {}, [], 'byRow')
    const stats = sequenceStats(seq)
    expect(stats.total).toBe(seq.length)
  })

  it('byWall считает правильно для двух стен', () => {
    // Каждая стена 200×250см → 100 плиток
    const w1 = makeWall({ id: 'w1' })
    const w2 = makeWall({ id: 'w2' })
    const seq = buildTileSequence([w1, w2], TILE, {}, [], 'byRow')
    const stats = sequenceStats(seq)
    expect(stats.byWall.get('w1')).toBe(100)
    expect(stats.byWall.get('w2')).toBe(100)
  })

  it('byColor считает правильно', () => {
    // Стена 100×100см: cols=5, rows=4 → 20 плиток
    // col 0-1 → '#ff0000' (8 плиток), col 2-4 → '#0000ff' (12 плиток)
    const wall = makeWall({ length: '100', height: '100' })
    const tileColors = { w1: {} }
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 4; row++) {
        tileColors.w1[`${col}_${row}`] = col < 2 ? '#ff0000' : '#0000ff'
      }
    }
    const palette = [{ index: 1, hex: '#ff0000' }, { index: 2, hex: '#0000ff' }]
    const seq = buildTileSequence([wall], TILE, tileColors, palette, 'byRow')
    const stats = sequenceStats(seq)
    expect(stats.byColor.get(1)).toBe(8)   // col 0-1, все 4 ряда
    expect(stats.byColor.get(2)).toBe(12)  // col 2-4, все 4 ряда
  })

  it('пустой sequence — нули и пустые maps', () => {
    const stats = sequenceStats([])
    expect(stats.total).toBe(0)
    expect(stats.byWall.size).toBe(0)
    expect(stats.byColor.size).toBe(0)
  })
})
