# Этап 1 — Каркас: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать рабочий PWA-каркас Drape — 5-вкладочное приложение с 3D-кубом, автосохранением в IndexedDB и undo/redo; никаких бизнес-функций, только инфраструктура.

**Architecture:** React + Vite SPA; глобальное состояние в двух Zustand-хранилищах (`projectStore` + `historyStore`). Нижняя навигация на 5 вкладок — все одновременно в DOM, активная видна через CSS `display`. Состояние авто-сохраняется в IndexedDB при каждом изменении, восстанавливается на старте.

**Tech Stack:** React 18, Vite 5, React Three Fiber 8, @react-three/drei 9, Three.js 0.167, Zustand 4, idb 8, vite-plugin-pwa 0.20

---

## Карта файлов

```
drape/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── public/
│   ├── drape-logo.svg          ← источник для генерации иконок PWA
│   └── icons/
│       ├── icon-192.png        ← генерируется в Task 8
│       └── icon-512.png        ← генерируется в Task 8
└── src/
    ├── main.jsx                ← initDB → loadAll → render → subscribe auto-save
    ├── App.jsx                 ← bottom nav + tab show/hide
    ├── App.css                 ← layout, nav, мобильные стили
    ├── store/
    │   ├── projectStore.js     ← activeTab, testCounter, getSnapshot, restoreSnapshot
    │   ├── historyStore.js     ← past/future стеки, push/undo/redo
    │   └── persistence.js      ← openDB, saveAll, loadAll
    ├── components/
    │   ├── viewer/ViewerTab.jsx      ← R3F Canvas + куб + undo/redo кнопки
    │   ├── room/RoomTab.jsx          ← заглушка + undo/redo кнопки
    │   ├── pixelizer/PixelizerTab.jsx ← заглушка + undo/redo кнопки
    │   ├── export/ExportTab.jsx      ← заглушка + undo/redo кнопки
    │   └── layout/LayoutTab.jsx      ← заглушка + undo/redo кнопки
    └── workers/.gitkeep             ← резерв под Web Worker (этап 4)
```

---

### Task 1: Инициализация проекта и установка зависимостей

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/App.css`
- Create: `src/workers/.gitkeep`

- [ ] **Step 1: Создать `package.json`**

```json
{
  "name": "drape",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "^9.109.3",
    "@react-three/fiber": "^8.17.8",
    "idb": "^8.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.167.1",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@vite-pwa/assets-generator": "^0.2.6",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.1",
    "vite-plugin-pwa": "^0.20.5"
  }
}
```

- [ ] **Step 2: Создать `vite.config.js` (без PWA — добавим в Task 8)**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 3: Создать `index.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#1a1a1a" />
    <title>Drape</title>
    <link rel="icon" type="image/svg+xml" href="/drape-logo.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Создать минимальный `src/main.jsx` (временный, перепишем в Task 4)**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: Создать минимальный `src/App.jsx` (временный, перепишем в Task 5)**

```jsx
export default function App() {
  return <div style={{ color: 'white', padding: 20 }}>Drape loading...</div>
}
```

- [ ] **Step 6: Создать пустой `src/App.css`**

```css
/* заполним в Task 5 */
```

- [ ] **Step 7: Создать `src/workers/.gitkeep`**

```bash
mkdir -p src/workers && touch src/workers/.gitkeep
```

- [ ] **Step 8: Установить зависимости**

```bash
npm install
```

Ожидаемый результат: `node_modules/` создана, нет ошибок в терминале.

- [ ] **Step 9: Проверить запуск**

```bash
npm run dev
```

Ожидаемый результат: в терминале `Local: http://localhost:5173/`, в браузере белый/тёмный экран с текстом "Drape loading...".

- [ ] **Step 10: Коммит**

```bash
git add package.json package-lock.json vite.config.js index.html src/
git commit -m "feat: scaffold React + Vite project"
```

---

### Task 2: Zustand-хранилища (projectStore + historyStore)

**Files:**
- Create: `src/store/projectStore.js`
- Create: `src/store/historyStore.js`

- [ ] **Step 1: Создать `src/store/projectStore.js`**

```javascript
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
    const { activeTab, testCounter } = get()
    return { activeTab, testCounter }
  },

  // Восстановление из снимка
  restoreSnapshot: (snapshot) => set(snapshot),
}))
```

- [ ] **Step 2: Создать `src/store/historyStore.js`**

```javascript
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
```

- [ ] **Step 3: Коммит**

```bash
git add src/store/
git commit -m "feat: add Zustand stores (project + history)"
```

---

### Task 3: IndexedDB — persistence.js

**Files:**
- Create: `src/store/persistence.js`

- [ ] **Step 1: Создать `src/store/persistence.js`**

```javascript
import { openDB } from 'idb'
import { useProjectStore } from './projectStore.js'
import { useHistoryStore } from './historyStore.js'

const DB_NAME = 'drape'
const DB_VERSION = 1

let db = null

export async function initDB() {
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('project')) {
        database.createObjectStore('project')
      }
      if (!database.objectStoreNames.contains('photos')) {
        database.createObjectStore('photos')
      }
    },
  })
}

// Сохраняет текущее состояние + историю в IndexedDB
export async function saveAll() {
  if (!db) return
  const snapshot = useProjectStore.getState().getSnapshot()
  const history = {
    past: useHistoryStore.getState().past,
    future: useHistoryStore.getState().future,
  }
  await db.put('project', snapshot, 'state')
  await db.put('project', history, 'history')
}

// Восстанавливает состояние и историю из IndexedDB
export async function loadAll() {
  if (!db) return
  const state = await db.get('project', 'state')
  const history = await db.get('project', 'history')

  if (state) {
    useProjectStore.getState().restoreSnapshot(state)
  }
  if (history) {
    useHistoryStore.setState({
      past: history.past ?? [],
      future: history.future ?? [],
    })
  }
}
```

- [ ] **Step 2: Коммит**

```bash
git add src/store/persistence.js
git commit -m "feat: add IndexedDB persistence (initDB, saveAll, loadAll)"
```

---

### Task 4: main.jsx — инициализация и автосохранение

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: Переписать `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { initDB, loadAll, saveAll } from './store/persistence.js'
import { useProjectStore } from './store/projectStore.js'
import { useHistoryStore } from './store/historyStore.js'

async function bootstrap() {
  // 1. Открыть базу данных
  await initDB()

  // 2. Восстановить сохранённое состояние
  await loadAll()

  // 3. Отрисовать приложение
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )

  // 4. Подписаться на изменения — авто-сохранение при каждом обновлении
  useProjectStore.subscribe(() => saveAll())
  useHistoryStore.subscribe(() => saveAll())
}

bootstrap()
```

- [ ] **Step 2: Коммит**

```bash
git add src/main.jsx
git commit -m "feat: bootstrap with IndexedDB init, state restore, auto-save"
```

---

### Task 5: App.jsx + App.css — нижняя навигация

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

- [ ] **Step 1: Написать `src/App.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  background: #1a1a1a;
  color: #f0f0f0;
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-tap-highlight-color: transparent;
}

#root {
  height: 100%;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100dvh; /* dynamic viewport height — учитывает адресную строку браузера */
}

.tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* ── Нижняя навигация ── */

.bottom-nav {
  display: flex;
  background: #111;
  border-top: 1px solid #333;
  /* safe area для iPhone с чёлкой */
  padding-bottom: env(safe-area-inset-bottom);
  flex-shrink: 0;
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 4px;
  background: none;
  border: none;
  color: #666;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;
  -webkit-appearance: none;
}

.nav-tab.active {
  color: #4a90d9;
}

.nav-tab:active {
  opacity: 0.7;
}
```

- [ ] **Step 2: Написать `src/App.jsx`**

```jsx
import { useProjectStore } from './store/projectStore.js'
import RoomTab from './components/room/RoomTab.jsx'
import PixelizerTab from './components/pixelizer/PixelizerTab.jsx'
import ViewerTab from './components/viewer/ViewerTab.jsx'
import ExportTab from './components/export/ExportTab.jsx'
import LayoutTab from './components/layout/LayoutTab.jsx'

const TABS = [
  { id: 'room',      label: 'Комната' },
  { id: 'pixelizer', label: 'Фото' },
  { id: 'viewer',    label: '3D' },
  { id: 'export',    label: 'Схема' },
  { id: 'layout',    label: 'Укладка' },
]

export default function App() {
  const { activeTab, setActiveTab } = useProjectStore()

  return (
    <div className="app">
      <div className="tab-content">
        {/* Все вкладки живут в DOM одновременно — UI-состояние не теряется */}
        <div className="tab-panel" style={{ display: activeTab === 'room' ? 'block' : 'none' }}>
          <RoomTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'pixelizer' ? 'block' : 'none' }}>
          <PixelizerTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'viewer' ? 'block' : 'none' }}>
          <ViewerTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'export' ? 'block' : 'none' }}>
          <ExportTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'layout' ? 'block' : 'none' }}>
          <LayoutTab />
        </div>
      </div>

      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 3: Коммит**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: bottom navigation with 5 tabs, CSS show/hide"
```

---

### Task 6: Вкладки-заглушки (Room, Pixelizer, Export, Layout)

**Files:**
- Create: `src/components/room/RoomTab.jsx`
- Create: `src/components/pixelizer/PixelizerTab.jsx`
- Create: `src/components/export/ExportTab.jsx`
- Create: `src/components/layout/LayoutTab.jsx`

Все четыре вкладки используют одинаковый паттерн: заголовок раздела, тестовый счётчик с кнопкой +1 (для проверки undo/redo), кнопки undo/redo.

- [ ] **Step 1: Создать `src/components/room/RoomTab.jsx`**

```jsx
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

export default function RoomTab() {
  const { testCounter, incrementCounter } = useProjectStore()
  const { past, future, push, undo, redo } = useHistoryStore()

  const handleIncrement = () => {
    push(useProjectStore.getState().getSnapshot())
    incrementCounter()
  }

  const handleUndo = () => {
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  const handleRedo = () => {
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Комната</h1>
      <p style={styles.subtitle}>Раздел появится в этапе 2</p>
      <div style={styles.undoRow}>
        <button style={styles.btn} onClick={handleUndo} disabled={past.length === 0}>↩ Отменить</button>
        <button style={styles.btn} onClick={handleRedo} disabled={future.length === 0}>↪ Повторить</button>
      </div>
      <div style={styles.counterBlock}>
        <p style={styles.counterLabel}>Тест undo/redo: {testCounter}</p>
        <button style={styles.btn} onClick={handleIncrement}>+1</button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 },
  title:     { fontSize: 28, fontWeight: 700 },
  subtitle:  { fontSize: 14, color: '#888' },
  undoRow:   { display: 'flex', gap: 12 },
  counterBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  counterLabel: { fontSize: 18 },
  btn:       { padding: '10px 20px', background: '#2a2a2a', color: '#f0f0f0', border: '1px solid #444', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
}
```

- [ ] **Step 2: Создать `src/components/pixelizer/PixelizerTab.jsx`**

Скопировать содержимое `RoomTab.jsx`, заменить только заголовок:

```jsx
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

export default function PixelizerTab() {
  const { testCounter, incrementCounter } = useProjectStore()
  const { past, future, push, undo, redo } = useHistoryStore()

  const handleIncrement = () => {
    push(useProjectStore.getState().getSnapshot())
    incrementCounter()
  }

  const handleUndo = () => {
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  const handleRedo = () => {
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Фото</h1>
      <p style={styles.subtitle}>Раздел появится в этапе 4</p>
      <div style={styles.undoRow}>
        <button style={styles.btn} onClick={handleUndo} disabled={past.length === 0}>↩ Отменить</button>
        <button style={styles.btn} onClick={handleRedo} disabled={future.length === 0}>↪ Повторить</button>
      </div>
      <div style={styles.counterBlock}>
        <p style={styles.counterLabel}>Тест undo/redo: {testCounter}</p>
        <button style={styles.btn} onClick={handleIncrement}>+1</button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 },
  title:     { fontSize: 28, fontWeight: 700 },
  subtitle:  { fontSize: 14, color: '#888' },
  undoRow:   { display: 'flex', gap: 12 },
  counterBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  counterLabel: { fontSize: 18 },
  btn:       { padding: '10px 20px', background: '#2a2a2a', color: '#f0f0f0', border: '1px solid #444', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
}
```

- [ ] **Step 3: Создать `src/components/export/ExportTab.jsx`**

```jsx
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

export default function ExportTab() {
  const { testCounter, incrementCounter } = useProjectStore()
  const { past, future, push, undo, redo } = useHistoryStore()

  const handleIncrement = () => {
    push(useProjectStore.getState().getSnapshot())
    incrementCounter()
  }

  const handleUndo = () => {
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  const handleRedo = () => {
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Схема</h1>
      <p style={styles.subtitle}>Раздел появится в этапе 6</p>
      <div style={styles.undoRow}>
        <button style={styles.btn} onClick={handleUndo} disabled={past.length === 0}>↩ Отменить</button>
        <button style={styles.btn} onClick={handleRedo} disabled={future.length === 0}>↪ Повторить</button>
      </div>
      <div style={styles.counterBlock}>
        <p style={styles.counterLabel}>Тест undo/redo: {testCounter}</p>
        <button style={styles.btn} onClick={handleIncrement}>+1</button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 },
  title:     { fontSize: 28, fontWeight: 700 },
  subtitle:  { fontSize: 14, color: '#888' },
  undoRow:   { display: 'flex', gap: 12 },
  counterBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  counterLabel: { fontSize: 18 },
  btn:       { padding: '10px 20px', background: '#2a2a2a', color: '#f0f0f0', border: '1px solid #444', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
}
```

- [ ] **Step 4: Создать `src/components/layout/LayoutTab.jsx`**

```jsx
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

export default function LayoutTab() {
  const { testCounter, incrementCounter } = useProjectStore()
  const { past, future, push, undo, redo } = useHistoryStore()

  const handleIncrement = () => {
    push(useProjectStore.getState().getSnapshot())
    incrementCounter()
  }

  const handleUndo = () => {
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  const handleRedo = () => {
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Укладка</h1>
      <p style={styles.subtitle}>Раздел появится в этапе 7</p>
      <div style={styles.undoRow}>
        <button style={styles.btn} onClick={handleUndo} disabled={past.length === 0}>↩ Отменить</button>
        <button style={styles.btn} onClick={handleRedo} disabled={future.length === 0}>↪ Повторить</button>
      </div>
      <div style={styles.counterBlock}>
        <p style={styles.counterLabel}>Тест undo/redo: {testCounter}</p>
        <button style={styles.btn} onClick={handleIncrement}>+1</button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 },
  title:     { fontSize: 28, fontWeight: 700 },
  subtitle:  { fontSize: 14, color: '#888' },
  undoRow:   { display: 'flex', gap: 12 },
  counterBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  counterLabel: { fontSize: 18 },
  btn:       { padding: '10px 20px', background: '#2a2a2a', color: '#f0f0f0', border: '1px solid #444', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
}
```

- [ ] **Step 5: Проверить в браузере**

```bash
npm run dev
```

Открыть `http://localhost:5173`. Проверить:
- Видны 5 вкладок внизу
- Переключение между вкладками работает
- Нажать "+1" несколько раз → счётчик растёт
- Нажать "↩ Отменить" → счётчик уменьшается
- Нажать "↪ Повторить" → счётчик снова растёт
- Перезагрузить страницу → счётчик восстановился

- [ ] **Step 6: Коммит**

```bash
git add src/components/
git commit -m "feat: stub tabs with undo/redo (Room, Pixelizer, Export, Layout)"
```

---

### Task 7: ViewerTab — вращающийся куб (React Three Fiber)

**Files:**
- Create: `src/components/viewer/ViewerTab.jsx`

- [ ] **Step 1: Создать `src/components/viewer/ViewerTab.jsx`**

```jsx
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

function RotatingCube() {
  const meshRef = useRef()

  useFrame((_, delta) => {
    meshRef.current.rotation.x += delta * 0.5
    meshRef.current.rotation.y += delta * 0.7
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#4a90d9" />
    </mesh>
  )
}

export default function ViewerTab() {
  const { testCounter, incrementCounter } = useProjectStore()
  const { past, future, push, undo, redo } = useHistoryStore()

  const handleIncrement = () => {
    push(useProjectStore.getState().getSnapshot())
    incrementCounter()
  }

  const handleUndo = () => {
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  const handleRedo = () => {
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0d0d0d' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <RotatingCube />
        <OrbitControls enablePan={false} />
      </Canvas>

      {/* Undo/Redo и тест-счётчик поверх Canvas */}
      <div style={styles.overlay}>
        <div style={styles.undoRow}>
          <button style={styles.btn} onClick={handleUndo} disabled={past.length === 0}>↩</button>
          <button style={styles.btn} onClick={handleRedo} disabled={future.length === 0}>↪</button>
        </div>
        <div style={styles.counterRow}>
          <span style={styles.counterText}>Счётчик: {testCounter}</span>
          <button style={styles.btn} onClick={handleIncrement}>+1</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay:     { position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  undoRow:     { display: 'flex', gap: 8 },
  counterRow:  { display: 'flex', gap: 8, alignItems: 'center' },
  counterText: { color: '#f0f0f0', fontSize: 13, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 6 },
  btn:         { padding: '8px 14px', background: 'rgba(0,0,0,0.6)', color: '#f0f0f0', border: '1px solid #555', borderRadius: 8, fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(4px)' },
}
```

- [ ] **Step 2: Проверить в браузере**

```bash
npm run dev
```

Открыть вкладку «3D». Ожидаемый результат:
- Синий куб вращается на тёмном фоне
- Мышью/пальцем можно вращать камеру (OrbitControls)
- Кнопки ↩ ↪ в правом верхнем углу, счётчик рядом
- undo/redo работает (меняется `testCounter`)

- [ ] **Step 3: Коммит**

```bash
git add src/components/viewer/ViewerTab.jsx
git commit -m "feat: 3D viewer tab with rotating cube (React Three Fiber)"
```

---

### Task 8: PWA — манифест, иконки, service worker

**Files:**
- Create: `public/drape-logo.svg`
- Create: `public/icons/icon-192.png` (генерируется)
- Create: `public/icons/icon-512.png` (генерируется)
- Modify: `vite.config.js`

- [ ] **Step 1: Создать SVG-логотип `public/drape-logo.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1a1a1a"/>
  <text x="256" y="340" text-anchor="middle" font-family="system-ui, sans-serif"
        font-size="300" font-weight="700" fill="#4a90d9">D</text>
</svg>
```

- [ ] **Step 2: Добавить `sharp` как dev-зависимость и создать скрипт генерации иконок**

```bash
npm install --save-dev sharp
```

Создать `scripts/gen-icons.mjs`:

```javascript
import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="80" fill="#1a1a1a"/>
  <text x="256" y="340" text-anchor="middle"
        font-family="sans-serif" font-size="300" font-weight="700" fill="#4a90d9">D</text>
</svg>
`)

await sharp(svg).resize(192).toFile('public/icons/icon-192.png')
await sharp(svg).resize(512).toFile('public/icons/icon-512.png')
console.log('Icons created: icon-192.png, icon-512.png')
```

Запустить:

```bash
node scripts/gen-icons.mjs
```

Ожидаемый результат: `public/icons/icon-192.png` и `public/icons/icon-512.png` созданы.

- [ ] **Step 3: Обновить `vite.config.js` с PWA-плагином**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['drape-logo.svg', 'icons/*.png'],
      manifest: {
        name: 'Drape',
        short_name: 'Drape',
        description: 'Pixel art mosaic designer for room walls',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone',
        start_url: '/',
        orientation: 'any',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
```

- [ ] **Step 4: Проверить сборку**

```bash
npm run build
npm run preview
```

Открыть `http://localhost:4173` в Chrome DevTools → Application → Manifest.
Ожидаемый результат: манифест распознан, иконки загружены, service worker зарегистрирован.

- [ ] **Step 5: Коммит**

```bash
git add public/ vite.config.js
git commit -m "feat: PWA setup — manifest, icons, service worker (vite-plugin-pwa)"
```

---

### Task 9: Vercel — конфигурация и деплой

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Создать `vercel.json`**

Файл нужен для SPA: при обновлении страницы Vercel должен отдавать `index.html`, а не возвращать 404.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Коммит и push на GitHub**

```bash
git add vercel.json
git commit -m "feat: add vercel.json for SPA routing"
git push origin stage_1
```

- [ ] **Step 3: Подключить Vercel (один раз, вручную)**

1. Открыть `vercel.com` и войти через GitHub-аккаунт `vityaayaa`
2. Нажать «Add New → Project»
3. Выбрать репозиторий `drape`
4. Framework Preset: **Vite** (Vercel определит автоматически)
5. Build Command: `npm run build` (по умолчанию)
6. Output Directory: `dist` (по умолчанию)
7. Нажать «Deploy»

После деплоя Vercel выдаст URL вида `drape-xxx.vercel.app`. Все последующие пуши в `stage_1` будут создавать preview-деплой автоматически.

- [ ] **Step 4: Проверить на телефоне**

Открыть Vercel-ссылку на телефоне. Проверить:
- Приложение открывается
- 5 вкладок переключаются
- Куб вращается
- Браузер предлагает «Добавить на главный экран»

---

### Task 10: Финальная проверка

- [ ] **Step 1: Проверить все критерии готовности**

```bash
npm run dev
```

Проверить вручную:
- [ ] 5 вкладок переключаются, активная подсвечена синим
- [ ] При переключении вкладок UI-состояние сохраняется (переключись на Комнату, нажми +1 несколько раз, перейди на Фото и обратно — счётчик тот же)
- [ ] Куб вращается в вкладке «3D», можно вращать пальцем
- [ ] Undo/redo работает: +1 несколько раз → ↩ несколько раз → счётчик уменьшается
- [ ] Перезагрузить страницу — счётчик и последняя вкладка восстановились

- [ ] **Step 2: Проверить сборку**

```bash
npm run build
```

Ожидаемый результат: `dist/` создана, нет ошибок.

- [ ] **Step 3: Последний коммит и push**

```bash
git push origin stage_1
```

Дождаться Vercel preview-деплоя, проверить на телефоне.

---

## Чеклист из спека

| Критерий | Где проверять |
|----------|---------------|
| `npm run dev` без ошибок | Терминал, Task 1 |
| 5 вкладок переключаются, UI-состояние сохраняется | Браузер, Task 6 |
| Куб вращается | Вкладка «3D», Task 7 |
| Undo/redo работает | Любая вкладка, Task 6–7 |
| Состояние восстанавливается после перезагрузки | Браузер, Task 6 |
| Lighthouse PWA score ≥ 90 | Chrome DevTools → Lighthouse, Task 8 |
| `npm run build` без ошибок | Терминал, Task 10 |
| Vercel preview-ссылка открывается на телефоне | Телефон, Task 9 |
