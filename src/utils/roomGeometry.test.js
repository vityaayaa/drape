// src/utils/roomGeometry.test.js
import { describe, it, expect } from 'vitest'
import { calculateGrid } from './roomGeometry.js'

const tile = { tile_width: '20', tile_height: '20', tile_thickness: '0', grout_width: '2', grout_color: '#ccc' }

describe('calculateGrid — базовый расчёт', () => {
  it('возвращает null для стены без размеров', () => {
    const walls = [{ id: 'w1', length: '', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
    const result = calculateGrid(tile, walls, {})
    expect(result[0]).toBeNull()
  })

  it('считает колонки и ряды правильно', () => {
    // grid_width=300cm=3000mm, columns=ceil((3000+2)/(20+2))=ceil(136.45)=137
    // rows=ceil((2500+2)/(20+2))=ceil(113.72)=114
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
    const r = calculateGrid(tile, walls, {})[0]
    expect(r.columns).toBe(137)
    expect(r.rows).toBe(114)
    expect(r.total_before_masks).toBe(137 * 114)
    expect(r.total).toBe(137 * 114)
  })

  it('возвращает null если wall_active=false', () => {
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: false, mosaic_active: true, tile_overrides: {}, masks: [] }]
    expect(calculateGrid(tile, walls, {})[0]).toBeNull()
  })

  it('возвращает null если mosaic_active=false', () => {
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: false, tile_overrides: {}, masks: [] }]
    expect(calculateGrid(tile, walls, {})[0]).toBeNull()
  })
})

describe('calculateGrid — tile_overrides', () => {
  it('переопределение tile_width влияет на расчёт', () => {
    // tile_width=40 → columns=ceil((3000+2)/(40+2))=ceil(71.47)=72
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: { tile_width: '40' }, masks: [] }]
    const r = calculateGrid(tile, walls, {})[0]
    expect(r.columns).toBe(72)
  })
})

describe('calculateGrid — углы (перекрытие)', () => {
  it('уменьшает grid_width если сосед слева перекрывает', () => {
    // Стена w2: длина 300cm. Оба имеют tile_thickness=10мм → равная → меньший индекс (w1) перекрывает
    // w2.grid_width = 3000 - 10 = 2990мм → columns=floor((2990+2)/22)=135
    const thickTile = { ...tile, tile_thickness: '10' }
    const walls = [
      { id: 'w1', length: '200', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
      { id: 'w2', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
    ]
    const r = calculateGrid(thickTile, walls, {})[1]
    expect(r.columns).toBe(Math.floor((2990 + 2) / 22))
  })

  it('принудительное перекрытие через corners', () => {
    const thickTile = { ...tile, tile_thickness: '10' }
    const walls = [
      { id: 'w1', length: '200', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
      { id: 'w2', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
    ]
    // Принудительно w2 перекрывает угол w1-w2 → w1 теряет справа 10мм
    // w1.grid_width = 2000-10=1990мм → columns=ceil((1990+2)/22)=ceil(90.54)=91
    const corners = { 'w1-w2': 'w2' }
    const r = calculateGrid(thickTile, walls, corners)[0]
    expect(r.columns).toBe(Math.ceil((1990 + 2) / 22))
  })
})

describe('calculateGrid — маски', () => {
  it('вычитает плитки полностью внутри маски', () => {
    // Стена 300x250, плитка 20мм без шва для простоты расчёта
    const noGrout = { tile_width: '20', tile_height: '20', tile_thickness: '0', grout_width: '0', grout_color: '#ccc' }
    // Маска x=0,y=0,w=40cm=400мм,h=40cm=400мм → полностью внутри: 20 колонок × 20 рядов = 400
    const masks = [{ id: 'm1', name: '', x: '0', y: '0', width: '40', height: '40' }]
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks }]
    const r = calculateGrid(noGrout, walls, {})[0]
    // columns=150, rows=125, total_before=18750, masked=20*20=400
    expect(r.total_masked).toBe(400)
    expect(r.total).toBe(r.total_before_masks - 400)
  })
})

describe('calculateGrid — лимиты', () => {
  it('выставляет warning и blocked при > 75000', () => {
    // 600cm × 300cm, плитка 5мм без шва → 1200×600=720000 плиток → blocked
    const bigWall = { tile_width: '5', tile_height: '5', tile_thickness: '0', grout_width: '0', grout_color: '#ccc' }
    const walls = [{ id: 'w1', length: '600', height: '300', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
    const r = calculateGrid(bigWall, walls, {})[0]
    expect(r.warning).toBe(true)
    expect(r.blocked).toBe(true)
  })

  it('нет warning при нормальном количестве', () => {
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
    const r = calculateGrid(tile, walls, {})[0]
    expect(r.warning).toBe(false)
    expect(r.blocked).toBe(false)
  })
})

describe('calculateGrid — corners object format', () => {
  it('handles { overlap, angle } format identically to plain string', () => {
    const t = { tile_width: '20', tile_height: '20', tile_thickness: '5', grout_width: '2', grout_color: '#ccc' }
    const walls = [
      { id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
      { id: 'w2', length: '200', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
    ]
    const cornersString = { 'w1-w2': 'w2', 'w2-w1': 'auto' }
    const cornersObject = { 'w1-w2': { overlap: 'w2', angle: 90 }, 'w2-w1': { overlap: 'auto', angle: 90 } }
    const rStr = calculateGrid(t, walls, cornersString)
    const rObj = calculateGrid(t, walls, cornersObject)
    expect(rObj[0].columns).toBe(rStr[0].columns)
    expect(rObj[1].columns).toBe(rStr[1].columns)
  })
})
