# Этап 2 — Модель комнаты: план реализации

> **Для агентов:** ОБЯЗАТЕЛЬНЫЙ СУБ-СКИЛЛ: используй superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans для реализации плана шаг за шагом. Шаги отмечаются чекбоксами (`- [ ]`).

**Цель:** Реализовать вкладку «Комната» — форму ввода стен и плитки, маски-препятствия, настройку углов, расчёт сетки и лимиты плиток.

**Архитектура:** Чистая функция `roomGeometry.js` считает сетку по сырым данным. `projectStore.js` хранит данные (стены, плитка, углы). Компоненты читают из стора и отображают результат расчёта.

**Стек:** React 18, Zustand 4, Vite 5, Vitest (добавляется в этом этапе).

---

## Файлы

| Действие | Путь |
|---|---|
| Изменить | `package.json` — добавить vitest |
| Изменить | `vite.config.js` — добавить test config |
| Создать | `src/utils/roomGeometry.js` |
| Создать | `src/utils/roomGeometry.test.js` |
| Изменить | `src/store/projectStore.js` |
| Изменить | `src/components/room/RoomTab.jsx` |
| Создать | `src/components/room/TileForm.jsx` |
| Создать | `src/components/room/WallCard.jsx` |
| Создать | `src/components/room/MaskCard.jsx` |
| Создать | `src/components/room/CornersSection.jsx` |
| Создать | `src/components/room/SummarySection.jsx` |

---

## Задача 1: Настроить Vitest

**Файлы:**
- Изменить: `package.json`
- Изменить: `vite.config.js`

- [ ] **Шаг 1: Установить Vitest**

```bash
npm install --save-dev vitest
```

- [ ] **Шаг 2: Добавить скрипт test в package.json**

В `package.json` в секцию `"scripts"` добавить:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Шаг 3: Добавить test-конфиг в vite.config.js**

```js
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
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Шаг 4: Проверить что vitest работает**

```bash
npm test
```

Ожидаемый результат: `No test files found` (без ошибок).

- [ ] **Шаг 5: Коммит**

```bash
git add package.json vite.config.js package-lock.json
git commit -m "chore: add vitest"
```

---

## Задача 2: roomGeometry.js — тесты (TDD, часть 1)

**Файлы:**
- Создать: `src/utils/roomGeometry.test.js`

- [ ] **Шаг 1: Создать файл с тестами**

```js
// src/utils/roomGeometry.test.js
import { describe, it, expect } from 'vitest'
import { calculateGrid } from './roomGeometry.js'

const tile = { tile_width: '20', tile_height: '20', tile_thickness: '0', grout_width: '2', grout_color: '#ccc' }

describe('calculateGrid — базовый расчёт', () => {
  it('возвращает null для стены без размеров', () => {
    const walls = [{ id: 'w1', length: '', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
    const result = calculateGrid(tile, walls, {})
    expect(result[0]).toBeNull()
  })

  it('считает колонки и ряды правильно', () => {
    // grid_width=300cm=3000mm, columns=floor((3000+2)/(20+2))=floor(136.45)=136
    // rows=floor((2500+2)/(20+2))=floor(113.7)=113
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
    const r = calculateGrid(tile, walls, {})[0]
    expect(r.columns).toBe(136)
    expect(r.rows).toBe(113)
    expect(r.total_before_masks).toBe(136 * 113)
    expect(r.total).toBe(136 * 113)
  })

  it('возвращает null если wall_active=false', () => {
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: false, mosaic_active: true, tile_overrides: {}, masks: [] }]
    expect(calculateGrid(tile, walls, {})[0]).toBeNull()
  })

  it('возвращает null если mosaic_active=false', () => {
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: false, tile_overrides: {}, masks: [] }]
    expect(calculateGrid(tile, walls, {})[0]).toBeNull()
  })
})

describe('calculateGrid — tile_overrides', () => {
  it('переопределение tile_width влияет на расчёт', () => {
    // tile_width=40 → columns=floor((3000+2)/(40+2))=floor(71.47)=71
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: { tile_width: '40' }, masks: [] }]
    const r = calculateGrid(tile, walls, {})[0]
    expect(r.columns).toBe(71)
  })
})

describe('calculateGrid — углы (перекрытие)', () => {
  it('уменьшает grid_width если сосед слева перекрывает', () => {
    // Стена w2: длина 300cm. Сосед слева w1 с tile_thickness=10мм перекрывает.
    // grid_width = 3000 - 10 = 2990мм → columns=floor((2990+2)/22)=135
    const thickTile = { ...tile, tile_thickness: '10' }
    const walls = [
      { id: 'w1', length: '200', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
      { id: 'w2', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
    ]
    // w1 толще (10мм vs 0мм) → w1 перекрывает → w2 теряет 10мм слева
    const r = calculateGrid(thickTile, walls, {})[1]
    // w2 использует глобальный tile_thickness=10, оба имеют одинаковую толщину
    // w1 имеет меньший индекс → перекрывает → w2.grid_width -= 10
    // Но w1 тоже страдает от w2 справа? w2 имеет больший индекс → w1 перекрывает w2 (w1 index=0 < w2 index=1)
    // Для w2: левый сосед = w1, индекс w1 < индекс w2 → w1 перекрывает → w2.grid_width -= 10
    expect(r.columns).toBe(Math.floor((2990 + 2) / 22))
  })

  it('принудительное перекрытие через corners', () => {
    const thickTile = { ...tile, tile_thickness: '10' }
    const walls = [
      { id: 'w1', length: '200', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
      { id: 'w2', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },
    ]
    // Принудительно w2 перекрывает угол w1-w2 → w1 теряет справа 10мм
    // w1.grid_width = 2000-10=1990мм → columns=floor((1990+2)/22)=90
    const corners = { 'w1-w2': 'w2' }
    const r = calculateGrid(thickTile, walls, corners)[0]
    expect(r.columns).toBe(Math.floor((1990 + 2) / 22))
  })
})

describe('calculateGrid — маски', () => {
  it('вычитает плитки полностью внутри маски', () => {
    // Стена 300x250, плитка 20мм без шва для простоты расчёта
    const noGrout = { tile_width: '20', tile_height: '20', tile_thickness: '0', grout_width: '0', grout_color: '#ccc' }
    // Маска x=0,y=0,w=40cm=400мм,h=40cm=400мм → полностью внутри: 20 колонок × 20 рядов = 400
    const masks = [{ id: 'm1', name: '', x: '0', y: '0', width: '40', height: '40' }]
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks }]
    const r = calculateGrid(noGrout, walls, {})[0]
    // columns=150, rows=125, total_before=18750, masked=20*20=400
    expect(r.total_masked).toBe(400)
    expect(r.total).toBe(r.total_before_masks - 400)
  })
})

describe('calculateGrid — лимиты', () => {
  it('выставляет warning при > 25000', () => {
    // 200x200 плитка 5мм → много плиток
    const bigWall = { tile_width: '5', tile_height: '5', tile_thickness: '0', grout_width: '0', grout_color: '#ccc' }
    const walls = [{ id: 'w1', length: '600', height: '300', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
    // 1200×600=72000 плиток → blocked
    const r = calculateGrid(bigWall, walls, {})[0]
    expect(r.warning).toBe(true)
    expect(r.blocked).toBe(true)
  })

  it('нет warning при нормальном количестве', () => {
    const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
    const r = calculateGrid(tile, walls, {})[0]
    expect(r.warning).toBe(false)
    expect(r.blocked).toBe(false)
  })
})
```

- [ ] **Шаг 2: Запустить тесты — убедиться что падают**

```bash
npm test
```

Ожидаемый результат: ошибка `Cannot find module './roomGeometry.js'`.

---

## Задача 3: roomGeometry.js — реализация (TDD, часть 2)

**Файлы:**
- Создать: `src/utils/roomGeometry.js`

- [ ] **Шаг 1: Создать файл**

```js
// src/utils/roomGeometry.js

const SOFT_LIMIT = 25_000
const HARD_LIMIT = 75_000

function parseNum(val) {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function effectiveTile(globalTile, overrides) {
  const merged = { ...globalTile }
  for (const key of Object.keys(overrides)) {
    if (overrides[key] !== '' && overrides[key] !== undefined) {
      merged[key] = overrides[key]
    }
  }
  return merged
}

function getCornerWinner(leftWall, rightWall, cornerKey, corners, walls, globalTile) {
  const setting = corners[cornerKey] ?? 'auto'
  if (setting !== 'auto') {
    // значение — это id стены-победителя
    return setting
  }
  const lt = parseNum(effectiveTile(globalTile, leftWall.tile_overrides).tile_thickness) ?? 0
  const rt = parseNum(effectiveTile(globalTile, rightWall.tile_overrides).tile_thickness) ?? 0
  if (lt > rt) return leftWall.id
  if (rt > lt) return rightWall.id
  // равная толщина — меньший индекс побеждает
  const li = walls.findIndex(w => w.id === leftWall.id)
  const ri = walls.findIndex(w => w.id === rightWall.id)
  return li <= ri ? leftWall.id : rightWall.id
}

function countMaskedTiles(mask, tw, th, gw) {
  const stepX = tw + gw
  const stepY = th + gw
  const mx = parseNum(mask.x) * 10
  const my = parseNum(mask.y) * 10
  const mw = parseNum(mask.width) * 10
  const mh = parseNum(mask.height) * 10
  if ([mx, my, mw, mh].some(v => v === null || isNaN(v))) return 0
  const colStart = Math.ceil(mx / stepX)
  const colEnd = Math.floor((mx + mw) / stepX)
  const rowStart = Math.ceil(my / stepY)
  const rowEnd = Math.floor((my + mh) / stepY)
  return Math.max(0, colEnd - colStart) * Math.max(0, rowEnd - rowStart)
}

export function calculateGrid(globalTile, walls, corners) {
  const n = walls.length
  return walls.map((wall, i) => {
    if (!wall.wall_active || !wall.mosaic_active) return null

    const t = effectiveTile(globalTile, wall.tile_overrides)
    const tw = parseNum(t.tile_width)
    const th = parseNum(t.tile_height)
    const gw = parseNum(t.grout_width) ?? 0
    const length = parseNum(wall.length)
    const height = parseNum(wall.height)

    if (tw === null || th === null || length === null || height === null) return null
    if (tw <= 0 || th <= 0 || length <= 0 || height <= 0) return null

    const leftWall = walls[(i - 1 + n) % n]
    const rightWall = walls[(i + 1) % n]
    const leftCornerKey = `${leftWall.id}-${wall.id}`
    const rightCornerKey = `${wall.id}-${rightWall.id}`

    let gridWidthMm = length * 10

    if (n >= 2) {
      const leftWinner = getCornerWinner(leftWall, wall, leftCornerKey, corners, walls, globalTile)
      if (leftWinner === leftWall.id) {
        const leftT = parseNum(effectiveTile(globalTile, leftWall.tile_overrides).tile_thickness) ?? 0
        if (leftWall.wall_active && leftWall.mosaic_active && leftT > 0) {
          gridWidthMm -= leftT
        }
      }

      const rightWinner = getCornerWinner(wall, rightWall, rightCornerKey, corners, walls, globalTile)
      if (rightWinner === rightWall.id) {
        const rightT = parseNum(effectiveTile(globalTile, rightWall.tile_overrides).tile_thickness) ?? 0
        if (rightWall.wall_active && rightWall.mosaic_active && rightT > 0) {
          gridWidthMm -= rightT
        }
      }
    }

    const gridHeightMm = height * 10
    const columns = Math.floor((gridWidthMm + gw) / (tw + gw))
    const rows = Math.floor((gridHeightMm + gw) / (th + gw))
    const total_before_masks = columns * rows

    let total_masked = 0
    for (const mask of wall.masks) {
      total_masked += countMaskedTiles(mask, tw, th, gw)
    }

    const total = total_before_masks - total_masked

    return {
      wallId: wall.id,
      grid_width_cm: +(gridWidthMm / 10).toFixed(2),
      columns,
      rows,
      total_before_masks,
      total_masked,
      total,
      warning: total_before_masks > SOFT_LIMIT,
      blocked: total_before_masks > HARD_LIMIT,
    }
  })
}
```

- [ ] **Шаг 2: Запустить тесты**

```bash
npm test
```

Ожидаемый результат: все тесты проходят (зелёный).

- [ ] **Шаг 3: Коммит**

```bash
git add src/utils/roomGeometry.js src/utils/roomGeometry.test.js package.json package-lock.json vite.config.js
git commit -m "feat: add roomGeometry grid calculation with tests"
```

---

## Задача 4: Расширить projectStore

**Файлы:**
- Изменить: `src/store/projectStore.js`

- [ ] **Шаг 1: Заменить содержимое файла**

```js
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
```

- [ ] **Шаг 2: Проверить что приложение собирается без ошибок**

```bash
npm run build
```

Ожидаемый результат: сборка успешна без ошибок.

- [ ] **Шаг 3: Коммит**

```bash
git add src/store/projectStore.js
git commit -m "feat: extend projectStore with tile, walls, corners, masks"
```

---

## Задача 5: TileForm.jsx

**Файлы:**
- Создать: `src/components/room/TileForm.jsx`

- [ ] **Шаг 1: Создать компонент**

```jsx
// src/components/room/TileForm.jsx
import { useRef } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

const FIELDS = [
  { key: 'tile_width',     label: 'Ширина плитки',   unit: 'мм' },
  { key: 'tile_height',    label: 'Высота плитки',    unit: 'мм' },
  { key: 'tile_thickness', label: 'Толщина плитки',   unit: 'мм' },
  { key: 'grout_width',    label: 'Ширина шва',       unit: 'мм' },
]

export default function TileForm({ overrides, onOverrideChange, onOverrideClear, isOverride = false }) {
  const { tile, setTileParam, addWall } = useProjectStore()
  const { push } = useHistoryStore()
  // Захватываем снимок ДО того как пользователь начинает редактировать поле
  const preEditSnapshot = useRef(null)

  function handleFocus() {
    preEditSnapshot.current = useProjectStore.getState().getSnapshot()
  }

  function handleBlur() {
    if (preEditSnapshot.current) push(preEditSnapshot.current)
  }

  function handleChange(key, value) {
    if (isOverride) {
      if (value === '') onOverrideClear(key)
      else onOverrideChange(key, value)
    } else {
      setTileParam(key, value)
    }
  }

  function handleColorChange(value) {
    // color picker: пушим текущий снимок сразу (нет focus/blur у color input)
    push(useProjectStore.getState().getSnapshot())
    if (isOverride) onOverrideChange('grout_color', value)
    else setTileParam('grout_color', value)
  }

  return (
    <div style={s.block}>
      {!isOverride && <h2 style={s.heading}>Параметры плитки</h2>}
      {FIELDS.map(({ key, label, unit }) => (
        <div key={key} style={s.row}>
          <label style={s.label}>{label}</label>
          <div style={s.inputWrap}>
            <input
              style={s.input}
              type="number"
              min="0"
              step="any"
              placeholder="—"
              value={isOverride ? (overrides?.[key] ?? '') : tile[key]}
              onFocus={handleFocus}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={handleBlur}
            />
            <span style={s.unit}>{unit}</span>
          </div>
        </div>
      ))}
      <div style={s.row}>
        <label style={s.label}>Цвет шва</label>
        <input
          type="color"
          value={isOverride ? (overrides?.grout_color ?? tile.grout_color) : tile.grout_color}
          onChange={(e) => handleColorChange(e.target.value)}
          style={s.colorInput}
        />
      </div>
      {!isOverride && (
        <button style={s.addBtn} onClick={addWall}>+ Добавить стену</button>
      )}
    </div>
  )
}

const s = {
  block:      { padding: '16px', borderBottom: '1px solid #333' },
  heading:    { fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#f0f0f0' },
  row:        { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  label:      { flex: 1, fontSize: 13, color: '#aaa' },
  inputWrap:  { display: 'flex', alignItems: 'center', gap: 4 },
  input:      { width: 80, padding: '6px 8px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 6, color: '#f0f0f0', fontSize: 13 },
  unit:       { fontSize: 12, color: '#888', width: 20 },
  colorInput: { width: 40, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' },
  addBtn:     { marginTop: 12, width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
}
```

- [ ] **Шаг 2: Коммит**

```bash
git add src/components/room/TileForm.jsx
git commit -m "feat: add TileForm component"
```

---

## Задача 6: MaskCard.jsx

**Файлы:**
- Создать: `src/components/room/MaskCard.jsx`

- [ ] **Шаг 1: Создать компонент**

```jsx
// src/components/room/MaskCard.jsx
import { useRef } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

const MASK_FIELDS = [
  { key: 'x',      label: 'X',  unit: 'см' },
  { key: 'y',      label: 'Y',  unit: 'см' },
  { key: 'width',  label: 'Ш',  unit: 'см' },
  { key: 'height', label: 'В',  unit: 'см' },
]

export default function MaskCard({ wallId, mask }) {
  const { updateMask, removeMask } = useProjectStore()
  const { push } = useHistoryStore()
  const preEditSnapshot = useRef(null)

  function handleFocus() {
    preEditSnapshot.current = useProjectStore.getState().getSnapshot()
  }

  function handleBlur() {
    if (preEditSnapshot.current) push(preEditSnapshot.current)
  }

  return (
    <div style={s.row}>
      <input
        style={{ ...s.input, flex: 1.5 }}
        placeholder="Название (необяз.)"
        value={mask.name}
        onFocus={handleFocus}
        onChange={(e) => updateMask(wallId, mask.id, 'name', e.target.value)}
        onBlur={handleBlur}
      />
      {MASK_FIELDS.map(({ key, label, unit }) => (
        <div key={key} style={s.fieldWrap}>
          <span style={s.fieldLabel}>{label}</span>
          <input
            style={s.numInput}
            type="number"
            min="0"
            step="any"
            placeholder="—"
            value={mask[key]}
            onFocus={handleFocus}
            onChange={(e) => updateMask(wallId, mask.id, key, e.target.value)}
            onBlur={handleBlur}
          />
          <span style={s.unit}>{unit}</span>
        </div>
      ))}
      <button style={s.delBtn} onClick={() => {
        push(useProjectStore.getState().getSnapshot())
        removeMask(wallId, mask.id)
      }}>✕</button>
    </div>
  )
}

const s = {
  row:        { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6, background: '#222', borderRadius: 6, padding: '6px 8px' },
  input:      { padding: '4px 6px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 5, color: '#f0f0f0', fontSize: 12 },
  fieldWrap:  { display: 'flex', alignItems: 'center', gap: 2 },
  fieldLabel: { fontSize: 11, color: '#888' },
  numInput:   { width: 52, padding: '4px 5px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 5, color: '#f0f0f0', fontSize: 12 },
  unit:       { fontSize: 11, color: '#666' },
  delBtn:     { padding: '4px 7px', background: 'transparent', border: '1px solid #555', borderRadius: 5, color: '#888', fontSize: 12, cursor: 'pointer' },
}
```

- [ ] **Шаг 2: Коммит**

```bash
git add src/components/room/MaskCard.jsx
git commit -m "feat: add MaskCard component"
```

---

## Задача 7: WallCard.jsx

**Файлы:**
- Создать: `src/components/room/WallCard.jsx`

- [ ] **Шаг 1: Создать компонент**

```jsx
// src/components/room/WallCard.jsx
import { useState, useRef } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'
import MaskCard from './MaskCard.jsx'
import TileForm from './TileForm.jsx'

export default function WallCard({ wall, result }) {
  const { updateWall, removeWall, addMask, setTileOverride, clearTileOverride } = useProjectStore()
  const { push } = useHistoryStore()
  const [showOverride, setShowOverride] = useState(Object.keys(wall.tile_overrides).length > 0)
  const preEditSnapshot = useRef(null)

  function handleFocus() {
    preEditSnapshot.current = useProjectStore.getState().getSnapshot()
  }

  function handleBlur() {
    if (preEditSnapshot.current) push(preEditSnapshot.current)
  }

  function toggle(field) {
    push(useProjectStore.getState().getSnapshot())
    updateWall(wall.id, field, !wall[field])
  }

  const hasWarning = result?.warning && !result?.blocked
  const hasBlocked = result?.blocked

  return (
    <div style={{ ...s.card, borderColor: hasBlocked ? '#ef4444' : hasWarning ? '#f59e0b' : '#333' }}>
      {/* Заголовок */}
      <div style={s.header}>
        <input
          style={s.nameInput}
          value={wall.name}
          onFocus={handleFocus}
          onChange={(e) => updateWall(wall.id, 'name', e.target.value)}
          onBlur={handleBlur}
        />
        <label style={s.toggle}>
          <input type="checkbox" checked={wall.wall_active} onChange={() => toggle('wall_active')} />
          <span style={s.toggleLabel}>Активна</span>
        </label>
        <label style={s.toggle}>
          <input type="checkbox" checked={wall.mosaic_active} disabled={!wall.wall_active} onChange={() => toggle('mosaic_active')} />
          <span style={s.toggleLabel}>Мозаика</span>
        </label>
        <button style={s.delBtn} onClick={() => { push(useProjectStore.getState().getSnapshot()); removeWall(wall.id) }}>✕</button>
      </div>

      {/* Размеры */}
      <div style={s.sizeRow}>
        <div style={s.field}>
          <label style={s.label}>Длина</label>
          <div style={s.inputWrap}>
            <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.length}
              onFocus={handleFocus} onChange={(e) => updateWall(wall.id, 'length', e.target.value)} onBlur={handleBlur} />
            <span style={s.unit}>см</span>
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Высота</label>
          <div style={s.inputWrap}>
            <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.height}
              onFocus={handleFocus} onChange={(e) => updateWall(wall.id, 'height', e.target.value)} onBlur={handleBlur} />
            <span style={s.unit}>см</span>
          </div>
        </div>
      </div>

      {/* Лимиты */}
      {hasBlocked && (
        <div style={s.blocked}>✕ Слишком много плиток ({result.total_before_masks.toLocaleString()}). Увеличь размер плитки или уменьши стену.</div>
      )}
      {hasWarning && (
        <div style={s.warning}>⚠ На стене {result.total_before_masks.toLocaleString()} плиток — на мобильных может тормозить.</div>
      )}

      {/* Переопределение плитки */}
      <button style={s.overrideToggle} onClick={() => setShowOverride(v => !v)}>
        {showOverride ? '▾' : '▸'} Переопределить плитку для этой стены
      </button>
      {showOverride && (
        <div style={s.overrideBlock}>
          <TileForm
            isOverride
            overrides={wall.tile_overrides}
            onOverrideChange={(field, value) => { setTileOverride(wall.id, field, value); handleBlur() }}
            onOverrideClear={(field) => { clearTileOverride(wall.id, field); handleBlur() }}
          />
        </div>
      )}

      {/* Маски */}
      <div style={s.masksSection}>
        <div style={s.masksHeader}>
          <span style={s.masksTitle}>Маски-препятствия</span>
          <button style={s.addMaskBtn} onClick={() => { push(useProjectStore.getState().getSnapshot()); addMask(wall.id) }}>+ Добавить</button>
        </div>
        {wall.masks.length === 0 && <p style={s.empty}>Нет масок</p>}
        {wall.masks.map(mask => <MaskCard key={mask.id} wallId={wall.id} mask={mask} />)}
      </div>
    </div>
  )
}

const s = {
  card:          { border: '1px solid #333', borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  header:        { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#222', flexWrap: 'wrap' },
  nameInput:     { flex: 1, minWidth: 80, background: 'transparent', border: 'none', borderBottom: '1px solid #555', color: '#f0f0f0', fontSize: 14, fontWeight: 600, padding: '2px 4px' },
  toggle:        { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' },
  toggleLabel:   { fontSize: 12, color: '#aaa' },
  delBtn:        { marginLeft: 'auto', background: 'transparent', border: '1px solid #555', borderRadius: 5, color: '#888', fontSize: 13, cursor: 'pointer', padding: '3px 8px' },
  sizeRow:       { display: 'flex', gap: 16, padding: '12px 12px 0' },
  field:         { display: 'flex', alignItems: 'center', gap: 6 },
  label:         { fontSize: 13, color: '#aaa' },
  inputWrap:     { display: 'flex', alignItems: 'center', gap: 4 },
  input:         { width: 72, padding: '6px 8px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 6, color: '#f0f0f0', fontSize: 13 },
  unit:          { fontSize: 12, color: '#888' },
  warning:       { margin: '8px 12px 0', padding: '6px 10px', background: '#78350f', color: '#fde68a', borderRadius: 6, fontSize: 12 },
  blocked:       { margin: '8px 12px 0', padding: '6px 10px', background: '#7f1d1d', color: '#fca5a5', borderRadius: 6, fontSize: 12 },
  overrideToggle:{ display: 'block', margin: '10px 12px 0', background: 'transparent', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 },
  overrideBlock: { margin: '4px 12px', border: '1px dashed #444', borderRadius: 6 },
  masksSection:  { padding: '10px 12px 12px' },
  masksHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  masksTitle:    { fontSize: 12, color: '#888', fontWeight: 600 },
  addMaskBtn:    { padding: '4px 10px', background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  empty:         { fontSize: 12, color: '#555', margin: 0 },
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Коммит**

```bash
git add src/components/room/WallCard.jsx
git commit -m "feat: add WallCard component"
```

---

## Задача 8: CornersSection.jsx

**Файлы:**
- Создать: `src/components/room/CornersSection.jsx`

- [ ] **Шаг 1: Создать компонент**

```jsx
// src/components/room/CornersSection.jsx
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

export default function CornersSection() {
  const { walls, corners, setCorner } = useProjectStore()
  const { push } = useHistoryStore()

  if (walls.length < 2) return null

  const n = walls.length
  const cornerList = walls.map((wall, i) => {
    const nextWall = walls[(i + 1) % n]
    const key = `${wall.id}-${nextWall.id}`
    return { key, leftWall: wall, rightWall: nextWall }
  })

  function handleChange(key, value) {
    push(useProjectStore.getState().getSnapshot())
    setCorner(key, value)
  }

  return (
    <div style={s.block}>
      <h2 style={s.heading}>Настройка углов</h2>
      <p style={s.hint}>Какая стена перекрывает плиткой угол. Актуально только при толщине плитки &gt; 0.</p>
      {cornerList.map(({ key, leftWall, rightWall }) => (
        <div key={key} style={s.row}>
          <span style={s.label}>
            Угол: {leftWall.name} / {rightWall.name}
          </span>
          <select
            style={s.select}
            value={corners[key] ?? 'auto'}
            onChange={(e) => handleChange(key, e.target.value)}
          >
            <option value="auto">Автоматически</option>
            <option value={leftWall.id}>{leftWall.name} перекрывает</option>
            <option value={rightWall.id}>{rightWall.name} перекрывает</option>
          </select>
        </div>
      ))}
    </div>
  )
}

const s = {
  block:   { padding: '16px', borderTop: '1px solid #333' },
  heading: { fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#f0f0f0' },
  hint:    { fontSize: 12, color: '#666', marginBottom: 12 },
  row:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  label:   { flex: 1, fontSize: 13, color: '#aaa', minWidth: 160 },
  select:  { padding: '6px 8px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 6, color: '#f0f0f0', fontSize: 13 },
}
```

- [ ] **Шаг 2: Коммит**

```bash
git add src/components/room/CornersSection.jsx
git commit -m "feat: add CornersSection component"
```

---

## Задача 9: SummarySection.jsx

**Файлы:**
- Создать: `src/components/room/SummarySection.jsx`

- [ ] **Шаг 1: Создать компонент**

```jsx
// src/components/room/SummarySection.jsx
import { useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'

export default function SummarySection() {
  const { tile, walls, corners } = useProjectStore()

  const results = useMemo(
    () => calculateGrid(tile, walls, corners),
    [tile, walls, corners]
  )

  const activeResults = results.filter(Boolean)

  if (walls.length === 0) return null

  const totalTiles = activeResults.reduce((sum, r) => sum + r.total, 0)

  return (
    <div style={s.block}>
      <h2 style={s.heading}>Итог</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Стена</th>
            <th style={s.th}>Колонок</th>
            <th style={s.th}>Рядов</th>
            <th style={s.th}>Плиток</th>
          </tr>
        </thead>
        <tbody>
          {walls.map((wall, i) => {
            const r = results[i]
            return (
              <tr key={wall.id} style={s.tr}>
                <td style={s.td}>{wall.name}</td>
                <td style={s.tdNum}>{r ? r.columns : '—'}</td>
                <td style={s.tdNum}>{r ? r.rows : '—'}</td>
                <td style={{ ...s.tdNum, color: r?.blocked ? '#ef4444' : r?.warning ? '#f59e0b' : '#f0f0f0' }}>
                  {r ? r.total.toLocaleString() : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
        {activeResults.length > 0 && (
          <tfoot>
            <tr style={s.footRow}>
              <td style={s.td}>Итого</td>
              <td style={s.tdNum}>—</td>
              <td style={s.tdNum}>—</td>
              <td style={s.tdNum}>{totalTiles.toLocaleString()}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

const s = {
  block:   { padding: '16px', borderTop: '1px solid #333' },
  heading: { fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#f0f0f0' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:      { textAlign: 'left', padding: '6px 8px', color: '#888', borderBottom: '1px solid #333', fontWeight: 500 },
  tr:      { borderBottom: '1px solid #2a2a2a' },
  td:      { padding: '7px 8px', color: '#ccc' },
  tdNum:   { padding: '7px 8px', textAlign: 'right', color: '#f0f0f0', fontFamily: 'monospace' },
  footRow: { borderTop: '2px solid #444' },
}
```

- [ ] **Шаг 2: Коммит**

```bash
git add src/components/room/SummarySection.jsx
git commit -m "feat: add SummarySection component"
```

---

## Задача 10: Собрать RoomTab.jsx

**Файлы:**
- Изменить: `src/components/room/RoomTab.jsx`

- [ ] **Шаг 1: Переписать компонент**

```jsx
// src/components/room/RoomTab.jsx
import { useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import TileForm from './TileForm.jsx'
import WallCard from './WallCard.jsx'
import CornersSection from './CornersSection.jsx'
import SummarySection from './SummarySection.jsx'

export default function RoomTab() {
  const { tile, walls, corners } = useProjectStore()
  const { past, future } = useHistoryStore()

  const results = useMemo(
    () => calculateGrid(tile, walls, corners),
    [tile, walls, corners]
  )

  function handleUndo() {
    const { undo } = useHistoryStore.getState()
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  function handleRedo() {
    const { redo } = useHistoryStore.getState()
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={s.page}>
      {/* Undo/Redo */}
      <div style={s.undoBar}>
        <button style={s.undoBtn} onClick={handleUndo} disabled={past.length === 0}>↩ Отменить</button>
        <button style={s.undoBtn} onClick={handleRedo} disabled={future.length === 0}>↪ Повторить</button>
      </div>

      {/* Параметры плитки + кнопка добавить стену */}
      <TileForm />

      {/* Список стен */}
      {walls.length === 0 && (
        <p style={s.emptyHint}>Добавь первую стену — нажми кнопку выше.</p>
      )}
      {walls.map((wall, i) => (
        <WallCard key={wall.id} wall={wall} result={results[i] ?? null} />
      ))}

      {/* Углы */}
      <CornersSection />

      {/* Итог */}
      <SummarySection />

      <div style={{ height: 40 }} />
    </div>
  )
}

const s = {
  page:    { overflowY: 'auto', height: '100%', background: '#1a1a1a', color: '#f0f0f0' },
  undoBar: { display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid #333' },
  undoBtn: { padding: '7px 14px', background: '#2a2a2a', color: '#f0f0f0', border: '1px solid #444', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  emptyHint: { padding: '24px 16px', color: '#555', fontSize: 14, textAlign: 'center' },
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

Ожидаемый результат: сборка успешна без ошибок TypeScript/ESLint.

- [ ] **Шаг 3: Запустить все тесты**

```bash
npm test
```

Ожидаемый результат: все тесты зелёные.

- [ ] **Шаг 4: Коммит**

```bash
git add src/components/room/RoomTab.jsx
git commit -m "feat: assemble RoomTab with all Stage 2 components"
```

---

## Задача 11: Финальный деплой

- [ ] **Шаг 1: Запустить все тесты**

```bash
npm test
```

Ожидаемый результат: все тесты проходят.

- [ ] **Шаг 2: Запустить сборку**

```bash
npm run build
```

Ожидаемый результат: сборка без ошибок.

- [ ] **Шаг 3: Запушить ветку**

```bash
git push origin stage_2
```

Vercel автоматически задеплоит preview-URL для ветки.

---

## Чек-лист покрытия спека

| Требование | Задача |
|---|---|
| Форма ввода стен (длина, высота, флаги) | 4, 7 |
| Форма параметров плитки (глобальная) | 4, 5 |
| tile_overrides на стену | 4, 7 |
| Маски-препятствия (x, y, ш, в, имя) | 4, 6, 7 |
| Настройка перекрытия углов | 4, 8 |
| Расчёт сетки (grid_width, columns, rows) | 2, 3 |
| Вычет масок из спецификации | 2, 3 |
| Лимиты 25 000 / 75 000 | 2, 3, 7 |
| Итог по стенам | 9 |
| Undo/Redo интеграция | 5, 6, 7, 8, 10 |
| Снимок включает tile, walls, corners | 4 |
| IndexedDB автосохранение | работает автоматически через main.jsx |
