// src/utils/pixelizerGeometry.test.js
import { describe, it, expect } from 'vitest'
import {
  computeScale,
  wallCanvasDimensions,
  tileRect,
  maskRectPx,
  isFullyInsideMask,
} from './pixelizerGeometry.js'

describe('computeScale', () => {
  it('fills availablePx with the tallest wall', () => {
    const walls = [
      { length: '300', height: '250' },
      { length: '200', height: '300' },
    ]
    // maxHeight = 300 cm = 3000 mm; scale = availablePx / maxHeight
    // caller passes pre-factored value, e.g. panoramaH * 0.85
    expect(computeScale(walls, 600)).toBeCloseTo(0.2) // 600 / 3000 = 0.2
  })

  it('returns 1 when no walls have valid height', () => {
    expect(computeScale([], 800)).toBe(1)
    expect(computeScale([{ length: '', height: '' }], 800)).toBe(1)
  })
})

describe('wallCanvasDimensions', () => {
  it('converts cm to px via scale', () => {
    // 300 cm × 250 cm, scale = 0.2 px/mm → 600 × 500 px
    const dims = wallCanvasDimensions({ length: '300', height: '250' }, 0.2)
    expect(dims.width).toBe(600)
    expect(dims.height).toBe(500)
  })

  it('returns placeholder size when dimensions missing', () => {
    const dims = wallCanvasDimensions({ length: '', height: '' }, 0.2)
    expect(dims.width).toBe(120)
    expect(dims.height).toBe(80)
    expect(dims.placeholder).toBe(true)
  })
})

describe('tileRect', () => {
  it('computes tile pixel position correctly', () => {
    // col=1, row=2, tileW=20mm, tileH=20mm, grout=2mm, scale=2 px/mm
    // stepX = (20+2)*2 = 44, stepY = 44
    // x = 1*44 = 44, y = 2*44 = 88, w = 20*2 = 40, h = 40
    expect(tileRect(1, 2, 20, 20, 2, 2)).toEqual({ x: 44, y: 88, w: 40, h: 40 })
  })

  it('works for (0,0) origin tile', () => {
    expect(tileRect(0, 0, 10, 10, 0, 1)).toEqual({ x: 0, y: 0, w: 10, h: 10 })
  })
})

describe('maskRectPx', () => {
  it('converts mask cm coords to px', () => {
    // x=10cm, y=5cm, w=20cm, h=15cm, scale=0.5 px/mm
    // x_mm=100, y_mm=50, w_mm=200, h_mm=150
    // px: x=50, y=25, w=100, h=75
    const mask = { x: '10', y: '5', width: '20', height: '15' }
    expect(maskRectPx(mask, 0.5)).toEqual({ x: 50, y: 25, w: 100, h: 75 })
  })
})

describe('isFullyInsideMask', () => {
  it('returns true for tile fully inside mask', () => {
    // mask 40cm×40cm = 400mm×400mm, tile 20mm, grout 2mm → step=22
    // col_start=ceil(0/22)=0, col_end=floor(400/22)=18
    // tile (5,5): 0 ≤ 5 < 18 ✓
    const masks = [{ x: '0', y: '0', width: '40', height: '40' }]
    expect(isFullyInsideMask(5, 5, masks, 20, 20, 2)).toBe(true)
  })

  it('returns false for tile at mask boundary (partial overlap)', () => {
    // col_end = floor(400/22) = 18 → tile 18 is NOT inside
    const masks = [{ x: '0', y: '0', width: '40', height: '40' }]
    expect(isFullyInsideMask(18, 0, masks, 20, 20, 2)).toBe(false)
  })

  it('returns false when no masks', () => {
    expect(isFullyInsideMask(0, 0, [], 20, 20, 2)).toBe(false)
  })

  it('returns false for tile completely outside mask', () => {
    const masks = [{ x: '0', y: '0', width: '10', height: '10' }]
    expect(isFullyInsideMask(50, 50, masks, 20, 20, 2)).toBe(false)
  })
})
