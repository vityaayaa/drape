// src/utils/pixelizerSampler.test.js
import { describe, it, expect } from 'vitest'
import { averageColor } from './pixelizerSampler.js'

describe('averageColor', () => {
  it('returns average RGB of uniform region as hex', () => {
    // 2×2 image, all pixels = RGB(100, 150, 200)
    const pixels = new Uint8ClampedArray([
      100, 150, 200, 255,
      100, 150, 200, 255,
      100, 150, 200, 255,
      100, 150, 200, 255,
    ])
    // 100 = 0x64, 150 = 0x96, 200 = 0xc8
    expect(averageColor(pixels, 0, 0, 2, 2, 2)).toBe('#6496c8')
  })

  it('returns average of mixed colors', () => {
    // 1×2 image: (0,0,0) and (254,254,254) → avg = (127, 127, 127) = 0x7f
    const pixels = new Uint8ClampedArray([
      0,   0,   0,   255,
      254, 254, 254, 255,
    ])
    expect(averageColor(pixels, 0, 0, 1, 2, 1)).toBe('#7f7f7f')
  })

  it('returns fallback color for zero-size region', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255])
    expect(averageColor(pixels, 0, 0, 0, 0, 1)).toBe('#888888')
  })

  it('clamps sampling area to image bounds', () => {
    // 1×1 image with one red pixel; ask for 2×2 area → still just one pixel
    const pixels = new Uint8ClampedArray([200, 50, 80, 255])
    // 200=0xc8, 50=0x32, 80=0x50
    expect(averageColor(pixels, 0, 0, 2, 2, 1)).toBe('#c83250')
  })
})
