import { describe, it, expect } from 'vitest'
import { computeWallPositions } from './computeWallPositions.js'

const round = (n) => Math.round(n * 1000) / 1000
const rp = (arr) => arr.map(round)

describe('computeWallPositions', () => {
  it('returns empty for no walls', () => {
    const { positions, center } = computeWallPositions([], {})
    expect(positions).toEqual([])
    expect(center).toEqual([0, 0, 0])
  })

  it('skips inactive walls', () => {
    const walls = [{ id: 'w1', wall_active: false, length: '300', height: '250' }]
    expect(computeWallPositions(walls, {}).positions).toHaveLength(0)
  })

  it('skips walls with missing or zero dimensions', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '', height: '250' },
      { id: 'w2', wall_active: true, length: '300', height: '0' },
    ]
    expect(computeWallPositions(walls, {}).positions).toHaveLength(0)
  })

  it('single wall: center at half-length, rotationY = 0', () => {
    const walls = [{ id: 'w1', wall_active: true, length: '300', height: '250' }]
    const { positions, center } = computeWallPositions(walls, {})
    expect(positions).toHaveLength(1)
    expect(rp(positions[0].position)).toEqual([150, 125, 0])
    expect(round(positions[0].rotationY)).toBe(0)
    expect(positions[0].wallId).toBe('w1')
    expect(rp(center)).toEqual([150, 125, 0])
  })

  it('two walls at 90°: second wall runs along -Z', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': { overlap: 'auto', angle: 90 } }
    const { positions } = computeWallPositions(walls, corners)
    expect(positions).toHaveLength(2)
    expect(rp(positions[0].position)).toEqual([150, 125, 0])
    expect(round(positions[0].rotationY)).toBe(0)
    // wall2: dir=-90°, trimmed (i=1), startTrim=10, endTrim=0, renderL=190
    // startZ = sin(-π/2)*10 = -10, cz = -10 + sin(-π/2)*95 = -105
    expect(rp(positions[1].position)).toEqual([300, 125, -105])
    expect(round(positions[1].rotationY)).toBe(round(-Math.PI / 2))
  })

  it('two walls at 120°: second wall turns less sharply', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': { overlap: 'auto', angle: 120 } }
    const { positions } = computeWallPositions(walls, corners)
    // wall2: dir=-60°, trimmed (i=1), startTrim=10, endTrim=0, renderL=190
    // startX = 300 + cos(-π/3)*10 = 305, startZ = sin(-π/3)*10 ≈ -8.660
    // cx = 305 + cos(-π/3)*95 = 352.5, cz = -8.660 + sin(-π/3)*95 ≈ -90.874
    expect(round(positions[1].position[0])).toBe(352.5)
    expect(round(positions[1].position[2])).toBe(round(-Math.sqrt(3) / 2 * 105))
  })

  it('falls back to 90° when corner is old string format', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': 'auto' }
    const { positions } = computeWallPositions(walls, corners)
    expect(rp(positions[1].position)).toEqual([300, 125, -105])
  })

  it('falls back to 90° when corner key is missing', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const { positions } = computeWallPositions(walls, {})
    expect(rp(positions[1].position)).toEqual([300, 125, -105])
  })

  it('center is average of all wall centers', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': { overlap: 'auto', angle: 90 } }
    const { center } = computeWallPositions(walls, corners)
    // wall1 center: (150,125,0), wall2 center: (300,125,-105) → avg: (225,125,-52.5)
    expect(rp(center)).toEqual([225, 125, -52.5])
  })
})
