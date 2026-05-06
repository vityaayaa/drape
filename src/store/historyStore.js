import { create } from 'zustand'

const MAX_HISTORY = 50

export const useHistoryStore = create((set, get) => ({
  past: [],   // снимки до текущего состояния
  future: [], // снимки после текущего состояния (для redo)

  // Сохранить текущий снимок перед изменением
  push: (snapshot) =>
    set((s) => ({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), snapshot],
      future: [],
    })),

  // Откатить: возвращает снимок для восстановления или null
  undo: (currentSnapshot) => {
    const { past, future } = get()
    if (past.length === 0) return null
    const previous = past[past.length - 1]
    set({
      past: past.slice(0, -1),
      future: [currentSnapshot, ...future.slice(0, MAX_HISTORY - 1)],
    })
    return previous
  },

  // Повторить: возвращает снимок для восстановления или null
  redo: (currentSnapshot) => {
    const { past, future } = get()
    if (future.length === 0) return null
    const next = future[0]
    set({
      past: [...past.slice(-(MAX_HISTORY - 1)), currentSnapshot],
      future: future.slice(1),
    })
    return next
  },
}))
