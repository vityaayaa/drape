// src/store/projectStore.js
import { create } from 'zustand'

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
          { id, name, length: '', height: '', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
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
      if (settings === null) {
        delete photoSettings[wallId]
        delete tileColors[wallId]
        delete tileColorsStale[wallId]
      } else {
        // Поля, которые влияют только на отображение, не на пикселизацию.
        const DISPLAY_ONLY = ['opacity', 'brightness', 'contrast', 'saturation']
        const prev = photoSettings[wallId]
        const sampleAffectingChanged = !prev || ['photoId','offsetX_mm','offsetY_mm','scale']
          .some(k => prev[k] !== settings[k])
        photoSettings[wallId] = settings
        if (sampleAffectingChanged) {
          tileColorsStale[wallId] = true
        }
      }
      return { pixelizer: { ...s.pixelizer, photoSettings, tileColors, tileColorsStale } }
    }),

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
