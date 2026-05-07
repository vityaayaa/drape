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

export const useProjectStore = create((set, get) => ({
  activeTab: 'room',
  tile: { ...DEFAULT_TILE },
  walls: [],
  corners: {},

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
      return { walls, corners }
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
          ? { ...w, masks: [...w.masks, { id: genId('m'), name: '', x: '', y: '', width: '', height: '' }] }
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

  // --- Снимок для undo/redo и IndexedDB ---
  getSnapshot: () => {
    const { tile, walls, corners } = get()
    return { tile, walls, corners }
  },

  restoreSnapshot: (snapshot) =>
    set({
      tile: snapshot.tile ?? { ...DEFAULT_TILE },
      walls: snapshot.walls ?? [],
      corners: snapshot.corners ?? {},
    }),
}))
