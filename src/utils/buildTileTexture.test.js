import { describe, it, expect } from 'vitest'
import { computeTextureLayout } from './buildTileTexture.js'

const baseTile = { tile_width: '100', tile_height: '100', grout_width: '5', grout_color: '#cccccc', tile_thickness: '0' }

describe('computeTextureLayout', () => {
  it('returns null for wall with no length', () => {
    expect(computeTextureLayout({ length: '', height: '250', tile_overrides: {} }, baseTile)).toBeNull()
  })

  it('returns null for wall with zero height', () => {
    expect(computeTextureLayout({ length: '300', height: '0', tile_overrides: {} }, baseTile)).toBeNull()
  })

  it('returns null when tile_width is missing', () => {
    const tile = { ...baseTile, tile_width: '' }
    expect(computeTextureLayout({ length: '300', height: '250', tile_overrides: {} }, tile)).toBeNull()
  })

  it('computes correct cols and rows', () => {
    // wall 300cm×250cm = 3000mm×2500mm, tile 100mm, grout 5mm, step=105mm
    // cols = ceil((3000+5)/105) = ceil(28.619) = 29
    // rows = ceil((2500+5)/105) = ceil(23.857) = 24
    const layout = computeTextureLayout({ length: '300', height: '250', tile_overrides: {} }, baseTile)
    expect(layout.cols).toBe(29)
    expect(layout.rows).toBe(24)
  })

  it('canvas dimensions are cols*cellPx by rows*cellPx', () => {
    const layout = computeTextureLayout({ length: '300', height: '250', tile_overrides: {} }, baseTile)
    expect(layout.canvasW).toBe(layout.cols * layout.cellPx)
    expect(layout.canvasH).toBe(layout.rows * layout.cellPx)
  })

  it('cellPx is clamped between 4 and 32', () => {
    const layout = computeTextureLayout({ length: '300', height: '250', tile_overrides: {} }, baseTile)
    expect(layout.cellPx).toBeGreaterThanOrEqual(4)
    expect(layout.cellPx).toBeLessThanOrEqual(32)
  })

  it('groutPx is at least 1', () => {
    const layout = computeTextureLayout({ length: '300', height: '250', tile_overrides: {} }, baseTile)
    expect(layout.groutPx).toBeGreaterThanOrEqual(1)
  })

  it('respects tile_overrides', () => {
    // tile_width override 200mm → step=205mm → cols=ceil((3000+5)/205)=ceil(14.659)=15
    const layout = computeTextureLayout(
      { length: '300', height: '250', tile_overrides: { tile_width: '200' } },
      baseTile,
    )
    expect(layout.cols).toBe(15)
  })

  it('exposes groutColor from tile params', () => {
    const layout = computeTextureLayout({ length: '300', height: '250', tile_overrides: {} }, baseTile)
    expect(layout.groutColor).toBe('#cccccc')
  })
})
