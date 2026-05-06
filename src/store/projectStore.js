import { create } from 'zustand'

export const useProjectStore = create((set, get) => ({
  // Навигация
  activeTab: 'viewer',

  // Тестовое состояние для проверки undo/redo
  testCounter: 0,

  setActiveTab: (tab) => set({ activeTab: tab }),
  incrementCounter: () => set((s) => ({ testCounter: s.testCounter + 1 })),

  // Снимок состояния без фотографий (для истории и IndexedDB)
  getSnapshot: () => {
    const { testCounter } = get()
    return { testCounter }
  },

  // Восстановление из снимка
  restoreSnapshot: (snapshot) => set(snapshot),
}))
