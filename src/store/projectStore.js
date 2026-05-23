// src/store/projectStore.js
import { create } from 'zustand'
import { calcStaircase, buildStaircaseMasks } from '../utils/staircase.js'

let _idCounter = 0
const genId = (prefix) => `${prefix}_${Date.now()}_${++_idCounter}`

const DEFAULT_TILE = {
  tile_width: '',
  tile_height: '',
  tile_thickness: '',
  grout_width: '',
  grout_color: '#cccccc',
}

const DEFAULT_PIXELIZER = {
  mode: 'photo',           // 'photo' | 'mosaic'
  visibleWalls: null,      // null = все стены видны; string[] = список id
  gridVisible: true,
  photoSettings: {},       // wallId → { photoId, offsetX_mm, offsetY_mm, scale, opacity }
  tileColors: {},          // wallId → { 'col_row': '#rrggbb' }
  tileColorsStale: {},     // wallId → bool
  quantize: 128,           // null = без квантизации; число = целевое кол-во цветов
}

export const useProjectStore = create((set, get) => ({
  activeTab: 'room',
  tile: { ...DEFAULT_TILE },
  walls: [],
  corners: {},
  pixelizer: { ...DEFAULT_PIXELIZER },

  setActiveTab: (tab) => set({ activeTab: tab }),

  // --- Плитка ---
  setTileParam: (field, value) =>
    set((s) => ({ tile: { ...s.tile, [field]: value } })),

  // --- Стены ---
  addWall: () =>
    set((s) => {
      const id = genId('w')
      const name = `Стена ${s.walls.length + 1}`
      return {
        walls: [
          ...s.walls,
          { id, name, length: '', height: '', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [], stairs: [] },
        ],
      }
    }),

  removeWall: (id) =>
    set((s) => {
      const walls = s.walls.filter((w) => w.id !== id)
      // Удаляем углы, связанные с этой стеной
      const corners = Object.fromEntries(
        Object.entries(s.corners).filter(([k]) => !k.includes(id))
      )
      const photoSettings = { ...s.pixelizer.photoSettings }
      const tileColors    = { ...s.pixelizer.tileColors }
      const tileColorsStale = { ...s.pixelizer.tileColorsStale }
      delete photoSettings[id]
      delete tileColors[id]
      delete tileColorsStale[id]
      return {
        walls,
        corners,
        pixelizer: { ...s.pixelizer, photoSettings, tileColors, tileColorsStale },
      }
    }),

  updateWall: (id, field, value) =>
    set((s) => ({
      walls: s.walls.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    })),

  setTileOverride: (wallId, field, value) =>
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? { ...w, tile_overrides: { ...w.tile_overrides, [field]: value } }
          : w
      ),
    })),

  clearTileOverride: (wallId, field) =>
    set((s) => ({
      walls: s.walls.map((w) => {
        if (w.id !== wallId) return w
        const overrides = { ...w.tile_overrides }
        delete overrides[field]
        return { ...w, tile_overrides: overrides }
      }),
    })),

  // --- Маски ---
  addMask: (wallId) =>
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? { ...w, masks: [...w.masks, { id: genId('m'), name: '', x: '', y: '', width: '', height: '', color: '#888888' }] }
          : w
      ),
    })),

  // Добавить несколько масок сразу (напр. сгенерированную лестницу).
  addMasks: (wallId, masks) =>
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? { ...w, masks: [...w.masks, ...masks.map((m) => ({ id: genId('m'), name: '', color: '#888888', ...m }))] }
          : w
      ),
    })),

  removeMask: (wallId, maskId) =>
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId ? { ...w, masks: w.masks.filter((m) => m.id !== maskId) } : w
      ),
    })),

  updateMask: (wallId, maskId, field, value) =>
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? { ...w, masks: w.masks.map((m) => (m.id === maskId ? { ...m, [field]: value } : m)) }
          : w
      ),
    })),

  // --- Лестницы ---
  addStaircase: (wallId, config) =>
    set((s) => {
      const wall = s.walls.find((w) => w.id === wallId)
      if (!wall) return s
      const stairId = genId('stair')
      const name = `Лестница ${wall.stairs.length + 1}`
      const stair = { id: stairId, name, ...config }
      // calcStaircase ожидает risersCount, в конфиге хранится risers
      const calc = calcStaircase({ ...stair, risersCount: stair.risers })
      const rawMasks = calc
        ? buildStaircaseMasks(calc, {
            startX: parseFloat(config.startX) || 0,
            startY: parseFloat(config.startY) || 0,
            direction: config.direction,
            color: config.color || '#888888',
          })
        : []
      const newMasks = rawMasks.map((m) => ({ id: genId('m'), staircaseId: stairId, ...m }))
      return {
        walls: s.walls.map((w) =>
          w.id === wallId
            ? { ...w, stairs: [...w.stairs, stair], masks: [...w.masks, ...newMasks] }
            : w
        ),
      }
    }),

  removeStaircase: (wallId, stairId) =>
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
              ...w,
              stairs: w.stairs.filter((st) => st.id !== stairId),
              masks: w.masks.filter((m) => m.staircaseId !== stairId),
            }
          : w
      ),
    })),

  updateStaircase: (wallId, stairId, field, value) =>
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
              ...w,
              stairs: w.stairs.map((st) =>
                st.id === stairId ? { ...st, [field]: value } : st
              ),
            }
          : w
      ),
    })),

  // Обновить конфиг + пересоздать маски (для кнопки «Обновить ступени»)
  replaceStaircase: (wallId, stairId, config) =>
    set((s) => {
      const wall = s.walls.find((w) => w.id === wallId)
      if (!wall) return s
      const oldStair = wall.stairs.find((st) => st.id === stairId)
      if (!oldStair) return s
      const updatedStair = { ...oldStair, ...config }
      // calcStaircase ожидает risersCount, в конфиге хранится risers
      const calc = calcStaircase({ ...updatedStair, risersCount: updatedStair.risers })
      const rawMasks = calc
        ? buildStaircaseMasks(calc, {
            startX: parseFloat(updatedStair.startX) || 0,
            startY: parseFloat(updatedStair.startY) || 0,
            direction: updatedStair.direction,
            color: updatedStair.color || '#888888',
          })
        : []
      const newMasks = rawMasks.map((m) => ({ id: genId('m'), staircaseId: stairId, ...m }))
      return {
        walls: s.walls.map((w) =>
          w.id === wallId
            ? {
                ...w,
                stairs: w.stairs.map((st) => (st.id === stairId ? updatedStair : st)),
                masks: [...w.masks.filter((m) => m.staircaseId !== stairId), ...newMasks],
              }
            : w
        ),
      }
    }),

  // --- Углы ---
  setCorner: (key, value) =>
    set((s) => ({ corners: { ...s.corners, [key]: value } })),

  // --- Pixelizer ---
  setPixelizerMode: (mode) =>
    set((s) => ({ pixelizer: { ...s.pixelizer, mode } })),

  setGridVisible: (v) =>
    set((s) => ({ pixelizer: { ...s.pixelizer, gridVisible: v } })),

  setVisibleWalls: (walls) =>
    set((s) => ({ pixelizer: { ...s.pixelizer, visibleWalls: walls } })),

  setQuantize: (count) =>
    set((s) => ({ pixelizer: { ...s.pixelizer, quantize: count } })),

  setPhotoSettings: (wallId, settings) =>
    set((s) => {
      const photoSettings   = { ...s.pixelizer.photoSettings }
      const tileColors      = { ...s.pixelizer.tileColors }
      const tileColorsStale = { ...s.pixelizer.tileColorsStale }
      const photoHistory    = { ...(s.pixelizer.photoHistory ?? {}) }
      if (settings === null) {
        delete photoSettings[wallId]
        delete tileColors[wallId]
        delete tileColorsStale[wallId]
      } else {
        const prev = photoSettings[wallId]
        // При смене фото на стене — запоминаем прежнее, чтобы можно было вернуть.
        if (prev && prev.photoId !== settings.photoId) {
          photoHistory[wallId] = [...(photoHistory[wallId] ?? []), prev]
        }
        const sampleAffectingChanged = !prev || ['photoId','offsetX_mm','offsetY_mm','scale']
          .some(k => prev[k] !== settings[k])
        photoSettings[wallId] = settings
        if (sampleAffectingChanged) {
          tileColorsStale[wallId] = true
        }
      }
      return { pixelizer: { ...s.pixelizer, photoSettings, tileColors, tileColorsStale, photoHistory } }
    }),

  // Удаляет фото со всех стен, восстанавливая предыдущее (если было).
  // Возвращает true, если photoId больше нигде не используется (можно удалить blob).
  removePhotoRestore: (photoId) => {
    let stillUsed = false
    set((s) => {
      const photoSettings   = { ...s.pixelizer.photoSettings }
      const tileColors      = { ...s.pixelizer.tileColors }
      const tileColorsStale = { ...s.pixelizer.tileColorsStale }
      const photoHistory    = { ...(s.pixelizer.photoHistory ?? {}) }
      for (const wallId of Object.keys(photoSettings)) {
        if (photoSettings[wallId]?.photoId !== photoId) continue
        // Ищем в истории последнее фото, отличное от удаляемого
        const hist = [...(photoHistory[wallId] ?? [])]
        let restored = null
        while (hist.length) {
          const cand = hist.pop()
          if (cand && cand.photoId !== photoId) { restored = cand; break }
        }
        photoHistory[wallId] = hist
        if (restored) {
          photoSettings[wallId] = restored
          tileColorsStale[wallId] = true
          delete tileColors[wallId]
        } else {
          delete photoSettings[wallId]
          delete tileColors[wallId]
          delete tileColorsStale[wallId]
          delete photoHistory[wallId]
        }
      }
      // Проверяем, используется ли photoId ещё где-то
      stillUsed = Object.values(photoSettings).some((ps) => ps?.photoId === photoId)
      return { pixelizer: { ...s.pixelizer, photoSettings, tileColors, tileColorsStale, photoHistory } }
    })
    return stillUsed
  },

  setTileColors: (wallId, colors) =>
    set((s) => ({
      pixelizer: {
        ...s.pixelizer,
        tileColors: { ...s.pixelizer.tileColors, [wallId]: colors },
        tileColorsStale: { ...s.pixelizer.tileColorsStale, [wallId]: false },
      },
    })),

  // --- Снимок для undo/redo и IndexedDB ---
  getSnapshot: () => {
    const { tile, walls, corners, pixelizer } = get()
    return { tile, walls, corners, pixelizer }
  },

  restoreSnapshot: (snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return
    if (!Array.isArray(snapshot.walls)) return
    if (!snapshot.tile || typeof snapshot.tile !== 'object') return
    set({
      tile:      snapshot.tile,
      walls:     snapshot.walls,
      corners:   snapshot.corners   ?? {},
      pixelizer: snapshot.pixelizer ?? { ...DEFAULT_PIXELIZER },
    })
  },
}))
