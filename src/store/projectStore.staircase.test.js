// src/store/projectStore.staircase.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore.js'

beforeEach(() => {
  useProjectStore.setState({ walls: [] })
  useProjectStore.getState().addWall()
})

function getFirstWall() {
  return useProjectStore.getState().walls[0]
}

const STAIR_CONFIG = {
  totalHeight: '150',
  totalLength: '170',
  risers: '7',
  startType: 'immediate',
  direction: 'right',
  startX: '0',
  startY: '0',
  color: '#888888',
}

describe('addStaircase', () => {
  it('добавляет лестницу в stairs[]', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    expect(getFirstWall().stairs).toHaveLength(1)
  })

  it('автоматически называет «Лестница 1»', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    expect(getFirstWall().stairs[0].name).toBe('Лестница 1')
  })

  it('автоинкремент: вторая лестница — «Лестница 2»', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    expect(getFirstWall().stairs[1].name).toBe('Лестница 2')
  })

  it('генерирует маски с staircaseId', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const wall = getFirstWall()
    const stairId = wall.stairs[0].id
    const stairMasks = wall.masks.filter(m => m.staircaseId === stairId)
    expect(stairMasks.length).toBeGreaterThan(0)
  })

  it('все сгенерированные маски имеют staircaseId', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const wall = getFirstWall()
    const stairId = wall.stairs[0].id
    wall.masks.forEach(m => expect(m.staircaseId).toBe(stairId))
  })
})

describe('removeStaircase', () => {
  it('удаляет лестницу из stairs[]', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const stairId = getFirstWall().stairs[0].id
    useProjectStore.getState().removeStaircase(wallId, stairId)
    expect(getFirstWall().stairs).toHaveLength(0)
  })

  it('удаляет все маски с этим staircaseId', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const stairId = getFirstWall().stairs[0].id
    useProjectStore.getState().removeStaircase(wallId, stairId)
    const stairMasks = getFirstWall().masks.filter(m => m.staircaseId === stairId)
    expect(stairMasks).toHaveLength(0)
  })

  it('не трогает маски других лестниц', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const stairs = getFirstWall().stairs
    const stairId1 = stairs[0].id
    const stairId2 = stairs[1].id
    useProjectStore.getState().removeStaircase(wallId, stairId1)
    const remaining = getFirstWall().masks.filter(m => m.staircaseId === stairId2)
    expect(remaining.length).toBeGreaterThan(0)
  })
})

describe('replaceStaircase', () => {
  it('обновляет конфиг лестницы', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const stairId = getFirstWall().stairs[0].id
    useProjectStore.getState().replaceStaircase(wallId, stairId, { ...STAIR_CONFIG, risers: '8' })
    expect(getFirstWall().stairs[0].risers).toBe('8')
  })

  it('пересоздаёт маски (удаляет старые, добавляет новые)', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const stairId = getFirstWall().stairs[0].id
    const oldMaskIds = getFirstWall().masks.map(m => m.id)

    useProjectStore.getState().replaceStaircase(wallId, stairId, { ...STAIR_CONFIG, risers: '8' })
    const newMaskIds = getFirstWall().masks.map(m => m.id)

    const overlap = oldMaskIds.filter(id => newMaskIds.includes(id))
    expect(overlap).toHaveLength(0)
  })

  it('сохраняет имя лестницы после замены', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const stairId = getFirstWall().stairs[0].id
    useProjectStore.getState().updateStaircase(wallId, stairId, 'name', 'Моя лестница')
    useProjectStore.getState().replaceStaircase(wallId, stairId, { ...STAIR_CONFIG, risers: '9' })
    expect(getFirstWall().stairs[0].name).toBe('Моя лестница')
  })
})
