import { describe, it, expect } from 'vitest'
import { buildSchemaSVG } from './schemaSVGBuilder.js'

const makeTile = () => ({ tile_width: '20', tile_height: '20', grout_width: '2', grout_color: '#ccc' })
const makeWall = (id, length, height) => ({
  id, name: `Стена ${id}`, length, height, masks: [], tile_overrides: {}
})

describe('buildSchemaSVG', () => {
  it('возвращает строку SVG', () => {
    const walls = [makeWall('w1', '300', '250')]
    const palette = [{ index: 1, hex: '#ff0000', count: 10, byWall: [] }]
    const tileColors = { w1: { '0_0': '#ff0000' } }
    const result = buildSchemaSVG({ walls, tile: makeTile(), tileColors, palette })
    expect(result).toMatch(/^<svg/)
    expect(result).toMatch(/<\/svg>$/)
  })

  it('содержит rect-элементы для плиток', () => {
    const walls = [makeWall('w1', '44', '22')]
    const tile = { tile_width: '20', tile_height: '20', grout_width: '2', grout_color: '#ccc' }
    const result = buildSchemaSVG({ walls, tile, tileColors: {}, palette: [] })
    expect(result).toContain('<rect')
  })

  it('количество плиточных rect соответствует columns × rows', () => {
    // wall 10cm×10cm, плитка 20mm, шов 0mm → wallW=100mm, wallH=100mm
    // columns = ceil((100+0)/(20+0)) = 5, rows = 5, итого 25 плиток
    const walls = [makeWall('w1', '10', '10')]
    const tile = { tile_width: '20', tile_height: '20', grout_width: '0', grout_color: '#ccc' }
    const result = buildSchemaSVG({ walls, tile, tileColors: {}, palette: [] })
    // 25 плиток + 2 rect (фон стены, рамка стены) + 1 SVG-фон + 1 легенда-шапка = 29
    const count = (result.match(/<rect/g) ?? []).length
    expect(count).toBe(29)
  })

  it('режим real: содержит width="...mm"', () => {
    const walls = [makeWall('w1', '300', '250')]
    const result = buildSchemaSVG({ walls, tile: makeTile(), tileColors: {}, palette: [], options: { scale: 'real' } })
    expect(result).toMatch(/width="\d+(\.\d+)?mm"/)
  })

  it('режим fit: width="100%"', () => {
    const walls = [makeWall('w1', '300', '250')]
    const result = buildSchemaSVG({ walls, tile: makeTile(), tileColors: {}, palette: [], options: { scale: 'fit' } })
    expect(result).toContain('width="100%"')
  })

  it('стена без размеров — placeholder с rect', () => {
    const walls = [makeWall('w1', '', '')]
    const result = buildSchemaSVG({ walls, tile: makeTile(), tileColors: {}, palette: [] })
    expect(result).toContain('<rect')
    expect(result).not.toContain('NaN')
  })

  it('tileColors применяются как fill для плиток', () => {
    const walls = [makeWall('w1', '10', '10')]
    const tile = { tile_width: '20', tile_height: '20', grout_width: '0', grout_color: '#ccc' }
    const tileColors = { w1: { '0_0': '#ff1234' } }
    const result = buildSchemaSVG({ walls, tile, tileColors, palette: [] })
    expect(result).toContain('fill="#ff1234"')
  })
})
