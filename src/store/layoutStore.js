// src/store/layoutStore.js
//
// Runtime-стор режима укладки. Не часть projectStore —
// прогресс укладки эфемерен и не сохраняется в проект.
//
// Persist: localStorage, ключ 'drape-layout-store'.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildTileSequence, getTileAt, findTileIndex, sequenceStats } from '../utils/layoutSequencer.js'

export const useLayoutStore = create(
  persist(
    (set, get) => ({
      // ── стабильное состояние (сохраняется) ───────────────────────
      currentIndex:   0,
      mode:           'byRow',        // 'byRow' | 'byColor'
      completedTiles: [],             // массив 'wallId:col:row', в памяти Set

      // ── кэш sequence (не сохраняется, пересчитывается) ───────────
      sequence: [],

      // ── actions ──────────────────────────────────────────────────

      setMode: (mode) => {
        set({ mode, currentIndex: 0 })
      },

      goTo: (index) => {
        const { sequence } = get()
        const clamped = Math.max(0, Math.min(index, sequence.length - 1))
        set({ currentIndex: clamped })
      },

      goNext: () => {
        const { currentIndex, sequence } = get()
        // currentIndex может быть === sequence.length — это «завершено»
        if (currentIndex < sequence.length) {
          set({ currentIndex: currentIndex + 1 })
        }
      },

      goPrev: () => {
        const { currentIndex } = get()
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 })
        }
      },

      markCompleted: (tile) => {
        const key = `${tile.wallId}:${tile.col}:${tile.row}`
        const { completedTiles } = get()
        if (completedTiles.includes(key)) {
          set({ completedTiles: completedTiles.filter((k) => k !== key) })
        } else {
          set({ completedTiles: [...completedTiles, key] })
        }
      },

      isCompleted: (tile) => {
        const key = `${tile.wallId}:${tile.col}:${tile.row}`
        return get().completedTiles.includes(key)
      },

      resetProgress: () => {
        set({ currentIndex: 0, completedTiles: [] })
      },

      rebuildSequence: (walls, globalTile, tileColors, palette) => {
        const { mode, currentIndex } = get()
        const sequence = buildTileSequence(walls, globalTile, tileColors, palette, mode)
        // Если currentIndex вышел за границы — сброс на 0
        const safeIndex = currentIndex >= sequence.length ? 0 : currentIndex
        set({ sequence, currentIndex: safeIndex })
      },

      // ── производные геттеры ───────────────────────────────────────

      currentTile: () => {
        const { sequence, currentIndex } = get()
        return getTileAt(sequence, currentIndex)
      },

      findAndGoTo: (wallId, col, canvasRow) => {
        const { sequence } = get()
        const idx = findTileIndex(sequence, wallId, col, canvasRow)
        if (idx >= 0) set({ currentIndex: idx })
      },

      stats: () => sequenceStats(get().sequence),

      completedSet: () => new Set(get().completedTiles),
    }),

    {
      name: 'drape-layout-store',
      partialize: (state) => ({
        currentIndex:   state.currentIndex,
        mode:           state.mode,
        completedTiles: state.completedTiles,
      }),
    }
  )
)
