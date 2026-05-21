// src/utils/schemaRenderer.test.js
import { describe, it, expect } from 'vitest'
import { buildPalette, withSurplus } from './buildPalette.js'
import { buildSchemaLayout, resolveWallTile, contrastColor } from './schemaRenderer.js'
import { calculateGrid } from './roomGeometry.js'

// --- buildPalette ---

const WALL1 = { id: 'w1', name: 'Стена 1' }
const WALL2 = { id: 'w2', name: 'Стена 2' }

describe('buildPalette', () => {
  it('считает плитки и сортирует по убыванию', () => {
    const colors = {
      w1: { '0_0': '#ff0000', '1_0': '#ff0000', '0_1': '#00ff00' },
    }
    const palette = buildPalette([WALL1], colors)
    expect(palette[0].hex).toBe('#ff0000')
    expect(palette[0].count).toBe(2)
    expect(palette[1].hex).toBe('#00ff00')
    expect(palette[1].count).toBe(1)
  })

  it('назначает последовательные индексы', () => {
    const colors = {
      w1: { '0_0': '#aabbcc', '1_0': '#ddeeff', '2_0': '#aabbcc' },
    }
    const palette = buildPalette([WALL1], colors)
    expect(palette[0].index).toBe(1)
    expect(palette[1].index).toBe(2)
  })

  it('разбивает по стенам', () => {
    const colors = {
      w1: { '0_0': '#ff0000', '1_0': '#ff0000' },
      w2: { '0_0': '#ff0000' },
    }
    const palette = buildPalette([WALL1, WALL2], colors)
    expect(palette[0].count).toBe(3)
    const byWall = palette[0].byWall
    const w1Entry = byWall.find((e) => e.wallId === 'w1')
    const w2Entry = byWall.find((e) => e.wallId === 'w2')
    expect(w1Entry.count).toBe(2)
    expect(w2Entry.count).toBe(1)
  })

  it('возвращает пустой массив для пустых tileColors', () => {
    expect(buildPalette([WALL1], {})).toEqual([])
    expect(buildPalette([WALL1], null)).toEqual([])
    expect(buildPalette([], { w1: { '0_0': '#aaa' } })).toEqual([])
  })

  it('игнорирует стены без tileColors', () => {
    const colors = { w2: { '0_0': '#abcdef' } }
    const palette = buildPalette([WALL1, WALL2], colors)
    expect(palette).toHaveLength(1)
    expect(palette[0].hex).toBe('#abcdef')
    const byWall = palette[0].byWall
    expect(byWall.find((e) => e.wallId === 'w1')).toBeUndefined()
  })

  it('маска закрывает всю стену — tileColors может быть пустым объектом', () => {
    const colors = { w1: {} }
    expect(buildPalette([WALL1], colors)).toEqual([])
  })
})

// --- withSurplus ---

describe('withSurplus', () => {
  it('добавляет процент и округляет вверх', () => {
    expect(withSurplus(100, 10)).toBe(110)
    expect(withSurplus(99, 10)).toBe(109) // 99*1.1=108.9 → 109
    expect(withSurplus(3, 10)).toBe(4)    // 3*1.1=3.3 → 4
  })

  it('возвращает count без изменений при запасе 0', () => {
    expect(withSurplus(100, 0)).toBe(100)
    expect(withSurplus(100, null)).toBe(100)
  })
})

// --- resolveWallTile ---

describe('resolveWallTile', () => {
  const globalTile = { tile_width: '20', tile_height: '20', grout_width: '2', grout_color: '#cccccc' }

  it('использует глобальные параметры если нет override', () => {
    const wall = { tile_overrides: {} }
    const result = resolveWallTile(wall, globalTile)
    expect(result.tileW).toBe(200)   // 20cm * 10
    expect(result.tileH).toBe(200)
    expect(result.groutW).toBe(20)
    expect(result.groutColor).toBe('#cccccc')
  })

  it('применяет override если задан', () => {
    const wall = { tile_overrides: { tile_width: '10', grout_color: '#ff0000' } }
    const result = resolveWallTile(wall, globalTile)
    expect(result.tileW).toBe(100)   // override: 10cm * 10
    expect(result.tileH).toBe(200)   // из глобальных
    expect(result.groutColor).toBe('#ff0000')
  })
})

// --- contrastColor ---

describe('contrastColor', () => {
  it('возвращает тёмный текст на светлом фоне', () => {
    expect(contrastColor('#ffffff')).toBe('#0f172a')
    expect(contrastColor('#ffff00')).toBe('#0f172a')
  })

  it('возвращает светлый текст на тёмном фоне', () => {
    expect(contrastColor('#000000')).toBe('#f1f5f9')
    expect(contrastColor('#1a1a2e')).toBe('#f1f5f9')
  })
})

// --- buildSchemaLayout ---

const makeTile = (w = '20', h = '20', grout = '2') => ({
  tile_width: w, tile_height: h, grout_width: grout, grout_color: '#ccc'
})

const makeWall = (id, length, height) => ({
  id, name: `Стена ${id}`, length, height, masks: [], tile_overrides: {}
})

describe('buildSchemaLayout', () => {
  it('возвращает пустой layout при отсутствии стен', () => {
    const result = buildSchemaLayout([], makeTile(), 400)
    expect(result.wallLayouts).toHaveLength(0)
    expect(result.totalWidth).toBe(0)
  })

  it('scale подбирается так чтобы самая высокая стена занимала targetFill от availableH', () => {
    // Стена 300см = 30000 (0.1мм), availableH=600, targetFill=0.8
    // scale = 600*0.8 / 30000 = 0.016 px/0.1мм
    const walls = [makeWall('w1', '200', '300')]
    const tile = makeTile()
    const { scale } = buildSchemaLayout(walls, tile, 600, { targetFill: 0.8 })
    expect(scale).toBeCloseTo(0.016)
  })

  it('ширина стены пропорциональна реальной ширине', () => {
    const walls = [
      makeWall('w1', '100', '200'),
      makeWall('w2', '200', '200'),
    ]
    const { wallLayouts } = buildSchemaLayout(walls, makeTile(), 400)
    expect(wallLayouts[1].width).toBe(wallLayouts[0].width * 2)
  })

  it('placeholder для стены без размеров', () => {
    const walls = [makeWall('w1', '', '')]
    const { wallLayouts } = buildSchemaLayout(walls, makeTile(), 400)
    expect(wallLayouts[0].placeholder).toBe(true)
  })
})

describe('buildSchemaLayout — совпадение с calculateGrid', () => {
  it('columns совпадают с calculateGrid для стены 300см, плитка 20мм, шов 2мм', () => {
    const wall = {
      id: 'w1', name: 'Тест', length: '300', height: '250',
      wall_active: true, mosaic_active: true,
      masks: [], tile_overrides: {},
    }
    const tile = makeTile('20', '25', '2')
    const corners = {}

    const [gridResult] = calculateGrid(tile, [wall], corners)
    const { wallLayouts } = buildSchemaLayout([wall], tile, 600)
    const schemaGrid = wallLayouts[0].grid

    expect(schemaGrid.columns).toBe(gridResult.columns)
    expect(schemaGrid.rows).toBe(gridResult.rows)
  })
})
