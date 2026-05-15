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
    // wall2: dir = 0 - (180-90) = -90°, from (300,0) going -Z
    // center: x=300+cos(-π/2)*100=300, z=0+sin(-π/2)*100=-100
    expect(rp(positions[1].position)).toEqual([300, 125, -100])
    expect(round(positions[1].rotationY)).toBe(round(-Math.PI / 2))
  })

  it('two walls at 120°: second wall turns less sharply', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': { overlap: 'auto', angle: 120 } }
    const { positions } = computeWallPositions(walls, corners)
    // exterior = 60°, dir = -60° = -π/3
    // wall2 center: x=300+cos(-π/3)*100=350, z=sin(-π/3)*100≈-86.603
    expect(round(positions[1].position[0])).toBe(350)
    expect(round(positions[1].position[2])).toBe(round(-Math.sqrt(3) / 2 * 100))
  })

  it('falls back to 90° when corner is old string format', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': 'auto' }
    const { positions } = computeWallPositions(walls, corners)
    expect(rp(positions[1].position)).toEqual([300, 125, -100])
  })

  it('falls back to 90° when corner key is missing', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const { positions } = computeWallPositions(walls, {})
    expect(rp(positions[1].position)).toEqual([300, 125, -100])
  })

  it('center is average of all wall centers', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': { overlap: 'auto', angle: 90 } }
    const { center } = computeWallPositions(walls, corners)
    // wall1 center: (150,125,0), wall2 center: (300,125,-100) → avg: (225,125,-50)
    expect(rp(center)).toEqual([225, 125, -50])
  })
})
