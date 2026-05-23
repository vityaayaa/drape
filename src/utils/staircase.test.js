// src/utils/staircase.test.js
import { describe, it, expect } from 'vitest'
import { calcStaircase, buildStaircaseMasks } from './staircase.js'

const BASE = { totalHeight: '150', totalLength: '170', risersCount: '7' }

describe('calcStaircase — режим immediate vs standard', () => {
  it('immediate: treadsCount = N-1', () => {
    const r = calcStaircase({ ...BASE, startType: 'immediate' })
    expect(r.treadsCount).toBe(6)
  })

  it('standard: treadsCount = N', () => {
    const r = calcStaircase({ ...BASE, startType: 'standard' })
    expect(r.treadsCount).toBe(7)
  })

  it('immediate имеет бо́льшую проступь, чем standard', () => {
    const imm = calcStaircase({ ...BASE, startType: 'immediate' })
    const std = calcStaircase({ ...BASE, startType: 'standard' })
    expect(imm.treadDepth).toBeGreaterThan(std.treadDepth)
  })

  it('immediate имеет меньший угол, чем standard', () => {
    const imm = calcStaircase({ ...BASE, startType: 'immediate' })
    const std = calcStaircase({ ...BASE, startType: 'standard' })
    expect(imm.angle).toBeLessThan(std.angle)
  })

  it('угол = atan(riserHeight / treadDepth); в immediate ≠ atan(H/L)', () => {
    // immediate: treadDepth = L/(N-1), поэтому riser/tread ≠ H/L
    const r = calcStaircase({ ...BASE, startType: 'immediate' })
    const expected = Math.atan(r.riserHeight / r.treadDepth) * (180 / Math.PI)
    expect(r.angle).toBeCloseTo(expected, 5)
    // должен отличаться от «неправильного» atan(H/L)
    const wrongAngle = Math.atan(150 / 170) * (180 / Math.PI)
    expect(r.angle).not.toBeCloseTo(wrongAngle, 1)
  })

  it('возвращает null при невалидных параметрах', () => {
    expect(calcStaircase({ totalHeight: '', totalLength: '170', risersCount: '7', startType: 'standard' })).toBeNull()
    expect(calcStaircase({ totalHeight: '150', totalLength: '0', risersCount: '7', startType: 'standard' })).toBeNull()
    expect(calcStaircase({ totalHeight: '150', totalLength: '170', risersCount: '0', startType: 'standard' })).toBeNull()
  })
})

describe('buildStaircaseMasks', () => {
  it('immediate: N-1 масок, последняя заканчивается ровно на L', () => {
    const calc = calcStaircase({ ...BASE, startType: 'immediate' })
    const masks = buildStaircaseMasks(calc, { startX: 0 })
    expect(masks).toHaveLength(6)
    const last = masks[masks.length - 1]
    expect(last.x + last.width).toBeCloseTo(170, 1)
  })

  it('standard: N-1 масок (пропуск h=0), последняя заканчивается на L', () => {
    const calc = calcStaircase({ ...BASE, startType: 'standard' })
    const masks = buildStaircaseMasks(calc, { startX: 0 })
    expect(masks).toHaveLength(6)
    const last = masks[masks.length - 1]
    expect(last.x + last.width).toBeCloseTo(170, 1)
  })

  it('все маски имеют положительную высоту', () => {
    for (const startType of ['immediate', 'standard']) {
      const calc = calcStaircase({ ...BASE, startType })
      buildStaircaseMasks(calc).forEach(m => expect(m.height).toBeGreaterThan(0))
    }
  })

  it('startY применяется как y во всех масках', () => {
    const calc = calcStaircase({ ...BASE, startType: 'standard' })
    const masks = buildStaircaseMasks(calc, { startY: 30 })
    masks.forEach(m => expect(m.y).toBeCloseTo(30))
  })

  it('direction left: первая маска заканчивается у startX', () => {
    const calc = calcStaircase({ ...BASE, startType: 'immediate' })
    const masks = buildStaircaseMasks(calc, { startX: 280, direction: 'left' })
    const first = masks[0]
    expect(first.x + first.width).toBeCloseTo(280, 1)
  })

  it('возвращает [] для null calc', () => {
    expect(buildStaircaseMasks(null)).toEqual([])
  })
})
