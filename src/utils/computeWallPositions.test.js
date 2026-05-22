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

  it('single wall: внутренняя грань на центральной линии, смещение наружу T/2', () => {
    const walls = [{ id: 'w1', wall_active: true, length: '300', height: '250' }]
    const { positions } = computeWallPositions(walls, {})
    expect(positions).toHaveLength(1)
    // центральная линия (150,0); смещение наружу +z на 5
    expect(rp(positions[0].position)).toEqual([150, 125, 5])
    expect(round(positions[0].rotationY)).toBe(0)
    expect(positions[0].wallId).toBe('w1')
    expect(positions[0].renderLength).toBe(300)  // полная длина
  })

  it('two walls at 90°: вторая стена вдоль +Z, смещение наружу', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': { overlap: 'auto', angle: 90 } }
    const { positions } = computeWallPositions(walls, corners)
    expect(positions).toHaveLength(2)
    // CCW: линии w1 (150,0), w2 (300,100); центр (225,50)
    // w1: наружу -z → (150,125,-5); w2: наружу +x → (305,125,100)
    expect(rp(positions[0].position)).toEqual([150, 125, -5])
    expect(round(positions[0].rotationY)).toBe(0)
    expect(rp(positions[1].position)).toEqual([305, 125, 100])
    expect(round(positions[1].rotationY)).toBe(round(Math.PI / 2))
    expect(positions[1].renderLength).toBe(200)
  })

  it('two walls at 120°: вторая стена поворачивает мягче', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': { overlap: 'auto', angle: 120 } }
    const { positions } = computeWallPositions(walls, corners)
    // CCW: w2 линия cx=350, cz=86.603; наружу n=(0.866,-0.5)*5 → (354.33, 84.103)
    expect(round(positions[1].position[0])).toBe(354.33)
    expect(round(positions[1].position[2])).toBe(84.103)
  })

  it('falls back to 90° when corner is old string format', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': 'auto' }
    const { positions } = computeWallPositions(walls, corners)
    expect(rp(positions[1].position)).toEqual([305, 125, 100])
  })

  it('falls back to 90° when corner key is missing', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const { positions } = computeWallPositions(walls, {})
    expect(rp(positions[1].position)).toEqual([305, 125, 100])
  })

  it('center is average of all wall centers', () => {
    const walls = [
      { id: 'w1', wall_active: true, length: '300', height: '250' },
      { id: 'w2', wall_active: true, length: '200', height: '250' },
    ]
    const corners = { 'w1-w2': { overlap: 'auto', angle: 90 } }
    const { center } = computeWallPositions(walls, corners)
    // w1 (150,125,-5), w2 (305,125,100) → avg (227.5,125,47.5)
    expect(rp(center)).toEqual([227.5, 125, 47.5])
  })
})
