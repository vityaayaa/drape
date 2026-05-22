# Staircase Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить логику расчёта лестницы, переработать модальное окно (иконка, SVG с метками, слайдеры, критерии оценки, X/Y сдвиг), добавить хранение лестниц в store, реструктурировать секцию масок/лестниц в WallCard.

**Architecture:** Исправление `staircase.js` (TDD); расширение `projectStore.js` новыми экшенами (`addStaircase`, `removeStaircase`, `replaceStaircase`) и полем `stairs[]` на стене; полная замена `StaircaseModal.jsx`; переработка нижней секции `WallCard.jsx` с двумя аккордеон-тоглами.

**Tech Stack:** React 18, Zustand, Vite + Vitest, lucide-react ^1.16.0, inline CSS-in-JS (style objects).

---

## Файловая карта

| Файл | Изменение |
|---|---|
| `src/utils/staircase.js` | Фикс логики: `treadsCount`, `angle`, `stepsTotal`, + `startY` |
| `src/utils/staircase.test.js` | Новый файл тестов |
| `src/store/projectStore.js` | Добавить `stairs: []`, импорт staircase-утилит, 3 новых экшена |
| `src/store/projectStore.test.js` | Новый файл тестов на стейр-экшены |
| `src/components/room/StaircaseModal.jsx` | Полная перезапись |
| `src/components/room/WallCard.jsx` | Переработка секции масок → два аккордеона |

---

## Task 1: Исправление логики `staircase.js`

**Files:**
- Modify: `src/utils/staircase.js`
- Create: `src/utils/staircase.test.js`

- [ ] **Step 1.1: Написать падающие тесты**

Создать `src/utils/staircase.test.js`:

```js
// src/utils/staircase.test.js
import { describe, it, expect } from 'vitest'
import { calcStaircase, buildStaircaseMasks } from './staircase.js'

const BASE = { totalHeight: '150', totalLength: '170', risersCount: '7' }

describe('calcStaircase — режим immediate vs standard', () => {
  it('immediate: treadsCount = N-1', () => {
    const r = calcStaircase({ ...BASE, startType: 'immediate' })
    expect(r.treadsCount).toBe(6)
  })

  it('standard: treadsCount = N', () => {
    const r = calcStaircase({ ...BASE, startType: 'standard' })
    expect(r.treadsCount).toBe(7)
  })

  it('immediate имеет бо́льшую проступь, чем standard', () => {
    const imm = calcStaircase({ ...BASE, startType: 'immediate' })
    const std = calcStaircase({ ...BASE, startType: 'standard' })
    expect(imm.treadDepth).toBeGreaterThan(std.treadDepth)
  })

  it('immediate имеет меньший угол, чем standard', () => {
    const imm = calcStaircase({ ...BASE, startType: 'immediate' })
    const std = calcStaircase({ ...BASE, startType: 'standard' })
    expect(imm.angle).toBeLessThan(std.angle)
  })

  it('угол = atan(riserHeight / treadDepth), не atan(H/L)', () => {
    const r = calcStaircase({ ...BASE, startType: 'standard' })
    const expected = Math.atan(r.riserHeight / r.treadDepth) * (180 / Math.PI)
    expect(r.angle).toBeCloseTo(expected, 5)
    // проверяем что это НЕ atan(H/L)
    const wrongAngle = Math.atan(150 / 170) * (180 / Math.PI)
    expect(r.angle).not.toBeCloseTo(wrongAngle, 1)
  })

  it('возвращает null при невалидных параметрах', () => {
    expect(calcStaircase({ totalHeight: '', totalLength: '170', risersCount: '7', startType: 'standard' })).toBeNull()
    expect(calcStaircase({ totalHeight: '150', totalLength: '0', risersCount: '7', startType: 'standard' })).toBeNull()
    expect(calcStaircase({ totalHeight: '150', totalLength: '170', risersCount: '0', startType: 'standard' })).toBeNull()
  })
})

describe('buildStaircaseMasks', () => {
  it('immediate: N-1 масок, последняя заканчивается ровно на L', () => {
    const calc = calcStaircase({ ...BASE, startType: 'immediate' })
    const masks = buildStaircaseMasks(calc, { startX: 0 })
    expect(masks).toHaveLength(6)
    const last = masks[masks.length - 1]
    expect(last.x + last.width).toBeCloseTo(170, 1)
  })

  it('standard: N-1 масок (пропуск h=0), последняя заканчивается на L', () => {
    const calc = calcStaircase({ ...BASE, startType: 'standard' })
    const masks = buildStaircaseMasks(calc, { startX: 0 })
    expect(masks).toHaveLength(6)
    const last = masks[masks.length - 1]
    expect(last.x + last.width).toBeCloseTo(170, 1)
  })

  it('все маски имеют положительную высоту', () => {
    for (const startType of ['immediate', 'standard']) {
      const calc = calcStaircase({ ...BASE, startType })
      buildStaircaseMasks(calc).forEach(m => expect(m.height).toBeGreaterThan(0))
    }
  })

  it('startY применяется как y во всех масках', () => {
    const calc = calcStaircase({ ...BASE, startType: 'standard' })
    const masks = buildStaircaseMasks(calc, { startY: 30 })
    masks.forEach(m => expect(m.y).toBeCloseTo(30))
  })

  it('direction left: первая маска заканчивается у startX', () => {
    const calc = calcStaircase({ ...BASE, startType: 'immediate' })
    const masks = buildStaircaseMasks(calc, { startX: 280, direction: 'left' })
    const first = masks[0]
    expect(first.x + first.width).toBeCloseTo(280, 1)
  })

  it('возвращает [] для null calc', () => {
    expect(buildStaircaseMasks(null)).toEqual([])
  })
})
```

- [ ] **Step 1.2: Запустить тесты — убедиться что падают**

```bash
cd /home/victor/projects/drape && npx vitest run src/utils/staircase.test.js
```

Ожидаем: несколько тестов FAIL (в частности на treadsCount, treadDepth, angle, masks.length).

- [ ] **Step 1.3: Исправить `src/utils/staircase.js`**

Заменить файл целиком:

```js
// src/utils/staircase.js
// Расчёт геометрии лестницы и генерация масок «ступеньки» под ней.
//
// Единицы: всё в см (как координаты масок).
// Лестница идёт от пола (y=startY) вверх. direction: 'right' | 'left'.
//
// Режимы старта:
//   'immediate' — первое движение вверх (подступёнок). Проступей: N-1. Проступь шире.
//   'standard'  — первое движение вперёд (проступь).  Проступей: N.   Проступь у́же.

export function calcStaircase({ totalHeight, totalLength, risersCount, startType }) {
  const H = parseFloat(totalHeight)
  const L = parseFloat(totalLength)
  const N = parseInt(risersCount, 10)
  if (!(H > 0) || !(L > 0) || !(N >= 1)) return null

  const riserHeight = H / N
  // immediate: N подступёнков, N-1 проступей (последний подъём выходит на верхний этаж)
  // standard:  N подступёнков, N   проступей
  const treadsCount = startType === 'immediate' ? Math.max(1, N - 1) : N
  const treadDepth = L / treadsCount
  // Угол — эргономический (наклон одного шага), а не суммарный уклон H/L
  const angle = Math.atan(riserHeight / treadDepth) * (180 / Math.PI)
  const blondel = 2 * riserHeight + treadDepth

  let status = 'critical'
  if (angle >= 30 && angle <= 35 && blondel >= 60 && blondel <= 64 && riserHeight <= 17) {
    status = 'excellent'
  } else if ((angle > 35 && angle <= 42) || (blondel >= 58 && blondel <= 66)) {
    status = 'acceptable'
  }

  return { riserHeight, treadDepth, treadsCount, angle, blondel, status, H, L, N, startType }
}

// Генерирует маски ступенчатой области ПОД лестницей (от пола вверх).
// Каждая ступень — прямоугольник: на участке проступи i высота = cumulative.
//
// startX — точка входа (нижней ступени) от левого края стены:
//   direction 'right' → startX = левый  край нижней ступени
//   direction 'left'  → startX = правый край нижней ступени (маски расходятся влево)
// startY — сдвиг от пола (обычно 0)
export function buildStaircaseMasks(calc, { startX = 0, startY = 0, direction = 'right', color = '#888888' } = {}) {
  if (!calc) return []
  const { riserHeight, treadDepth, N, startType } = calc
  // immediate: N-1 колонок (последний подъём на верхний этаж не создаёт новую колонку)
  // standard:  N   колонок, но первая (i=0) имеет h=0 и пропускается
  const stepsTotal = startType === 'immediate' ? N - 1 : N
  const masks = []
  for (let i = 0; i < stepsTotal; i++) {
    const heightSteps = startType === 'immediate' ? i + 1 : i
    const h = heightSteps * riserHeight
    if (h <= 0) continue
    const w = treadDepth
    const xLocal = i * treadDepth
    const x = direction === 'right' ? startX + xLocal : startX - xLocal - w
    masks.push({
      name: `Ступень ${i + 1}`,
      x: round2(x),
      y: round2(startY),
      width: round2(w),
      height: round2(h),
      color,
    })
  }
  return masks
}

function round2(n) {
  return Math.round(n * 100) / 100
}
```

- [ ] **Step 1.4: Запустить тесты — убедиться что все проходят**

```bash
cd /home/victor/projects/drape && npx vitest run src/utils/staircase.test.js
```

Ожидаем: все тесты PASS.

- [ ] **Step 1.5: Коммит**

```bash
cd /home/victor/projects/drape
git add src/utils/staircase.js src/utils/staircase.test.js
git commit -m "fix(лестница): treadsCount, угол per-step, stepsTotal, startY — TDD"
```

---

## Task 2: Обновить `projectStore.js`

**Files:**
- Modify: `src/store/projectStore.js`
- Create: `src/store/projectStore.staircase.test.js`

- [ ] **Step 2.1: Написать падающие тесты для стейр-экшенов**

Создать `src/store/projectStore.staircase.test.js`:

```js
// src/store/projectStore.staircase.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore.js'

// Сбрасываем стор перед каждым тестом
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

    // Ни один старый id не должен остаться
    const overlap = oldMaskIds.filter(id => newMaskIds.includes(id))
    expect(overlap).toHaveLength(0)
  })

  it('сохраняет имя лестницы после замены', () => {
    const wallId = getFirstWall().id
    useProjectStore.getState().addStaircase(wallId, STAIR_CONFIG)
    const stairId = getFirstWall().stairs[0].id
    // вручную переименуем через updateStaircase
    useProjectStore.getState().updateStaircase(wallId, stairId, 'name', 'Моя лестница')
    useProjectStore.getState().replaceStaircase(wallId, stairId, { ...STAIR_CONFIG, risers: '9' })
    expect(getFirstWall().stairs[0].name).toBe('Моя лестница')
  })
})
```

- [ ] **Step 2.2: Запустить тесты — убедиться что падают**

```bash
cd /home/victor/projects/drape && npx vitest run src/store/projectStore.staircase.test.js
```

Ожидаем: тесты падают (нет `stairs` в wall, нет экшенов).

- [ ] **Step 2.3: Обновить `src/store/projectStore.js`**

Добавить импорт в начало файла (после `import { create } from 'zustand'`):

```js
import { calcStaircase, buildStaircaseMasks } from '../utils/staircase.js'
```

Изменить инициализацию стены в `addWall` — добавить `stairs: []`:

```js
// НАЙТИ строку:
{ id, name, length: '', height: '', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] },

// ЗАМЕНИТЬ НА:
{ id, name, length: '', height: '', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [], stairs: [] },
```

Добавить 4 новых экшена после блока `// --- Маски ---` (после `updateMask`):

```js
  // --- Лестницы ---
  addStaircase: (wallId, config) =>
    set((s) => {
      const wall = s.walls.find((w) => w.id === wallId)
      if (!wall) return s
      const stairId = genId('stair')
      const name = `Лестница ${wall.stairs.length + 1}`
      const stair = { id: stairId, name, ...config }
      // calcStaircase ожидает risersCount, а в конфиге хранится risers
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
      // calcStaircase ожидает risersCount, а в конфиге хранится risers
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
```

- [ ] **Step 2.4: Запустить тесты — убедиться что все проходят**

```bash
cd /home/victor/projects/drape && npx vitest run src/store/projectStore.staircase.test.js
```

Ожидаем: все тесты PASS.

- [ ] **Step 2.5: Прогнать все тесты — убедиться что ничего не сломали**

```bash
cd /home/victor/projects/drape && npx vitest run
```

Ожидаем: все тесты PASS.

- [ ] **Step 2.6: Коммит**

```bash
cd /home/victor/projects/drape
git add src/store/projectStore.js src/store/projectStore.staircase.test.js
git commit -m "feat(store): stairs[], addStaircase, removeStaircase, updateStaircase, replaceStaircase"
```

---

## Task 3: Переработать `StaircaseModal.jsx`

**Files:**
- Modify: `src/components/room/StaircaseModal.jsx`

Нет юнит-тестов (React UI-компонент). Проверяется вручную в браузере/телефоне.

- [ ] **Step 3.1: Заменить `src/components/room/StaircaseModal.jsx` целиком**

```jsx
// src/components/room/StaircaseModal.jsx
// Модальный калькулятор+редактор лестницы: слайдеры → SVG-превью → генерация масок.
import { useState, useMemo, useEffect } from 'react'
import Modal from '../ui/Modal.jsx'
import InfoPopover from '../ui/InfoPopover.jsx'
import { calcStaircase, buildStaircaseMasks } from '../../utils/staircase.js'

// ─── Статусы эргономики ────────────────────────────────────────────────────
const STATUS = {
  excellent:  { label: 'Идеально',  color: '#22c55e' },
  acceptable: { label: 'Допустимо', color: '#f59e0b' },
  critical:   { label: 'Неудобно',  color: '#ef4444' },
}

// ─── Иконка ступеней (SVG inline) ─────────────────────────────────────────
function StairsIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,15 1,11 5,11 5,7 9,7 9,3 13,3 13,1" />
      <polyline points="1,15 15,15 15,1" />
    </svg>
  )
}

// ─── Заголовок с иконкой ───────────────────────────────────────────────────
function ModalTitle() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <StairsIcon size={17} color="var(--accent-light, #a78bfa)" />
      Лестница
    </span>
  )
}

// ─── Главный компонент ────────────────────────────────────────────────────
// editStair: объект конфига лестницы (для режима редактирования) | undefined
export default function StaircaseModal({ open, onClose, onGenerate, editStair }) {
  const [totalHeight, setTotalHeight] = useState('150')
  const [totalLength, setTotalLength] = useState('170')
  const [risers,      setRisers]      = useState('7')
  const [startType,   setStartType]   = useState('immediate')
  const [direction,   setDirection]   = useState('right')
  const [startX,      setStartX]      = useState('0')
  const [startY,      setStartY]      = useState('0')

  // При открытии в режиме edit — заполнить поля из editStair
  useEffect(() => {
    if (open && editStair) {
      setTotalHeight(editStair.totalHeight ?? '150')
      setTotalLength(editStair.totalLength ?? '170')
      setRisers(editStair.risers ?? '7')
      setStartType(editStair.startType ?? 'immediate')
      setDirection(editStair.direction ?? 'right')
      setStartX(editStair.startX ?? '0')
      setStartY(editStair.startY ?? '0')
    }
    if (open && !editStair) {
      // сбрасываем к дефолтам при открытии в режиме создания
      setTotalHeight('150')
      setTotalLength('170')
      setRisers('7')
      setStartType('immediate')
      setDirection('right')
      setStartX('0')
      setStartY('0')
    }
  }, [open, editStair?.id])

  const calc = useMemo(
    () => calcStaircase({ totalHeight, totalLength, risersCount: risers, startType }),
    [totalHeight, totalLength, risers, startType]
  )

  const masks = useMemo(
    () =>
      calc
        ? buildStaircaseMasks(calc, {
            startX:    parseFloat(startX)  || 0,
            startY:    parseFloat(startY)  || 0,
            direction,
          })
        : [],
    [calc, startX, startY, direction]
  )

  const st = calc ? STATUS[calc.status] : null

  function handleGenerate() {
    if (!masks.length) return
    const config = { totalHeight, totalLength, risers, startType, direction, startX, startY }
    onGenerate(config)
    onClose()
  }

  const btnLabel = editStair
    ? `Обновить ${masks.length} ступеней`
    : `Создать ${masks.length} ступеней`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<ModalTitle />}
      maxWidth={440}
      footer={
        <button
          style={{ ...s.genBtn, opacity: masks.length ? 1 : 0.5 }}
          onClick={handleGenerate}
          disabled={!masks.length}
        >
          {btnLabel}
        </button>
      }
    >
      {/* Превью */}
      <div style={s.preview}>
        {calc
          ? <StairPreview calc={calc} direction={direction} />
          : <span style={s.previewEmpty}>Заполните параметры</span>
        }
      </div>

      {/* Метрики */}
      {calc && (
        <div style={s.metrics}>
          <Metric label="Подступёнок" value={`${calc.riserHeight.toFixed(1)} см`} />
          <Metric label="Проступь"    value={`${calc.treadDepth.toFixed(1)} см`} />
          <Metric label="Угол"        value={`${calc.angle.toFixed(1)}°`} />
          <div style={s.metric}>
            <span style={s.metricLabel}>Оценка</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ ...s.metricValue, color: st.color }}>{st.label}</span>
              <InfoPopover title="Критерии оценки лестницы" ariaLabel="Как рассчитывается оценка">
                <ErgoHelp />
              </InfoPopover>
            </div>
          </div>
        </div>
      )}

      {/* Слайдеры */}
      <div style={s.sliders}>
        <SliderField label="Высота (см)"  value={totalHeight} onChange={setTotalHeight} min={30}  max={400} step={5} />
        <SliderField label="Длина (см)"   value={totalLength} onChange={setTotalLength} min={50}  max={600} step={5} />
        <SliderField label="Подъёмов"     value={risers}      onChange={setRisers}      min={2}   max={20}  step={1} />
      </div>

      {/* Сдвиг X / Y */}
      <div style={s.offsetRow}>
        <span style={s.offsetLabel}>Сдвиг</span>
        <OffsetField label="по X" value={startX} onChange={setStartX} signed />
        <OffsetField label="по Y" value={startY} onChange={setStartY} />
      </div>

      {/* Старт + Направление в одну строку */}
      <div style={s.togglesRow}>
        <div style={s.toggleGroup}>
          <span style={s.toggleLabel}>Старт</span>
          <div style={s.seg}>
            <SegBtn active={startType === 'immediate'} onClick={() => setStartType('immediate')}>Сразу ↑</SegBtn>
            <SegBtn active={startType === 'standard'}  onClick={() => setStartType('standard')}>Проступь</SegBtn>
          </div>
        </div>
        <div style={s.toggleGroup}>
          <span style={s.toggleLabel}>Напр.</span>
          <div style={s.seg}>
            <SegBtn active={direction === 'right'} onClick={() => setDirection('right')}>→</SegBtn>
            <SegBtn active={direction === 'left'}  onClick={() => setDirection('left')}>←</SegBtn>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── SVG превью с метками ──────────────────────────────────────────────────
function StairPreview({ calc, direction }) {
  const { N, riserHeight, treadDepth, treadsCount, startType } = calc
  const W = calc.L, H = calc.H
  const padL = 10, padR = 10, padT = 18, padB = 22
  const vw = 300, vh = 130
  const sx = (vw - padL - padR) / Math.max(W, 1)
  const sy = (vh - padT - padB) / Math.max(H, 1)
  const sc = Math.min(sx, sy)
  const ox = padL
  const oy = vh - padB

  // Строим точки профиля
  const pts = [[0, 0]]
  let x = 0, y = 0
  for (let i = 0; i < N; i++) {
    if (startType === 'immediate') {
      y += riserHeight; pts.push([x, y])
      if (i < treadsCount) { x += treadDepth; pts.push([x, y]) }
    } else {
      if (i < treadsCount) { x += treadDepth; pts.push([x, y]) }
      y += riserHeight; pts.push([x, y])
    }
  }

  const toXY = ([px, py]) => {
    const fx = direction === 'right'
      ? ox + px * sc
      : (vw - padR) - px * sc
    return `${fx.toFixed(1)},${(oy - py * sc).toFixed(1)}`
  }
  const poly = pts.map(toXY).join(' ')

  // Позиции для меток
  const stairW = W * sc
  const stairH = H * sc
  const x0 = direction === 'right' ? ox : vw - padR - stairW
  const x1 = x0 + stairW
  const yTop = oy - stairH

  // Угол — середина первой ступени
  const arcR = 22
  const midStep = direction === 'right'
    ? { cx: ox, cy: oy }
    : { cx: vw - padR, cy: oy }
  const angleRad = calc.angle * (Math.PI / 180)
  const arcEndX = (direction === 'right' ? 1 : -1) * arcR * Math.cos(angleRad)
  const arcEndY = -arcR * Math.sin(angleRad)
  const arcX = midStep.cx + arcEndX
  const arcY = midStep.cy + arcEndY

  const dimColor = 'rgba(255,255,255,0.35)'
  const labelColor = 'rgba(255,255,255,0.55)'

  return (
    <svg width="100%" height={vh} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet">
      {/* Нижняя линия этажа */}
      <line x1={x0 - 4} y1={oy} x2={x1 + 4} y2={oy} stroke={dimColor} strokeWidth="1" />
      <text x={x0} y={oy + 14} fontSize="8" fill={labelColor} textAnchor="start">НИЖНИЙ ЭТАЖ</text>

      {/* Верхняя линия этажа */}
      <line x1={x0 - 4} y1={yTop} x2={x1 + 4} y2={yTop} stroke={dimColor} strokeWidth="1" strokeDasharray="3 3" />
      <text x={x1 + 6} y={yTop + 4} fontSize="8" fill={labelColor} textAnchor="start">ВЕРХНИЙ ЭТАЖ</text>

      {/* Вертикальный размер (высота) */}
      <line x1={x0 - 6} y1={oy} x2={x0 - 6} y2={yTop} stroke={dimColor} strokeWidth="1" />
      <line x1={x0 - 9} y1={oy}   x2={x0 - 3} y2={oy}   stroke={dimColor} strokeWidth="1" />
      <line x1={x0 - 9} y1={yTop} x2={x0 - 3} y2={yTop} stroke={dimColor} strokeWidth="1" />
      <text
        x={x0 - 8} y={(oy + yTop) / 2}
        fontSize="8" fill={labelColor}
        textAnchor="middle"
        transform={`rotate(-90, ${x0 - 8}, ${(oy + yTop) / 2})`}
      >
        {calc.H.toFixed(0)} см
      </text>

      {/* Горизонтальный размер (длина) */}
      <line x1={x0} y1={oy + 6} x2={x1} y2={oy + 6} stroke={dimColor} strokeWidth="1" />
      <line x1={x0} y1={oy + 3} x2={x0} y2={oy + 9} stroke={dimColor} strokeWidth="1" />
      <line x1={x1} y1={oy + 3} x2={x1} y2={oy + 9} stroke={dimColor} strokeWidth="1" />
      <text x={(x0 + x1) / 2} y={oy + 16} fontSize="8" fill={labelColor} textAnchor="middle">
        {calc.L.toFixed(0)} см
      </text>

      {/* Дуга угла */}
      <path
        d={`M ${midStep.cx},${midStep.cy} a ${arcR} ${arcR} 0 0 ${direction === 'right' ? 0 : 1} ${arcEndX.toFixed(1)},${arcEndY.toFixed(1)}`}
        fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.7"
      />
      <text
        x={midStep.cx + (direction === 'right' ? arcR + 6 : -(arcR + 6))}
        y={oy - arcR / 2}
        fontSize="8" fill="#c4b5fd"
        textAnchor={direction === 'right' ? 'start' : 'end'}
      >
        {calc.angle.toFixed(1)}°
      </text>

      {/* Профиль лестницы */}
      <polyline
        points={poly}
        fill="none"
        stroke="#a78bfa"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Слайдер + число ──────────────────────────────────────────────────────
function SliderField({ label, value, onChange, min, max, step }) {
  const num = parseFloat(value) || min
  return (
    <div style={s.sliderRow}>
      <span style={s.sliderLabel}>{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={Math.min(Math.max(num, min), max)}
        onChange={(e) => onChange(e.target.value)}
        style={s.rangeInput}
      />
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        style={s.rangeNum}
      />
    </div>
  )
}

// ─── Поле сдвига ─────────────────────────────────────────────────────────
function OffsetField({ label, value, onChange, signed }) {
  return (
    <div style={s.offsetField}>
      <span style={s.offsetFieldLabel}>{label}</span>
      <input
        style={s.offsetInput}
        type="text"
        inputMode={signed ? 'text' : 'decimal'}
        value={value}
        onChange={(e) => {
          let v = e.target.value
          v = signed
            ? v.replace(/[^0-9.\-]/g, '').replace(/(?!^)-/g, '')
            : v.replace(/[^0-9.]/g, '')
          onChange(v)
        }}
      />
    </div>
  )
}

// ─── Метрика ─────────────────────────────────────────────────────────────
function Metric({ label, value, color }) {
  return (
    <div style={s.metric}>
      <span style={s.metricLabel}>{label}</span>
      <span style={{ ...s.metricValue, ...(color ? { color } : {}) }}>{value}</span>
    </div>
  )
}

// ─── Сегментная кнопка ────────────────────────────────────────────────────
function SegBtn({ active, onClick, children }) {
  return (
    <button style={{ ...s.segBtn, ...(active ? s.segBtnActive : {}) }} onClick={onClick}>
      {children}
    </button>
  )
}

// ─── Попап критериев оценки ──────────────────────────────────────────────
function ErgoHelp() {
  return (
    <div style={eh.wrap}>
      <div style={eh.block}>
        <span style={{ ...eh.dot, background: '#22c55e' }} />
        <div>
          <b style={eh.title}>Идеально</b>
          <p style={eh.text}>Угол 30–35°. Индекс Блонделя 60–64 см. Высота ступени ≤ 17 см.</p>
        </div>
      </div>
      <div style={eh.block}>
        <span style={{ ...eh.dot, background: '#f59e0b' }} />
        <div>
          <b style={eh.title}>Допустимо (но круто)</b>
          <p style={eh.text}>Угол 35–42° ИЛИ индекс Блонделя 58–60 или 64–66 см.</p>
        </div>
      </div>
      <div style={eh.block}>
        <span style={{ ...eh.dot, background: '#ef4444' }} />
        <div>
          <b style={eh.title}>Неудобно / Опасно</b>
          <p style={eh.text}>Угол &gt; 42° (спуск спиной) или &lt; 25° (слишком пологая). Индекс Блонделя &lt; 57 или &gt; 67 см.</p>
        </div>
      </div>
      <div style={eh.divider} />
      <p style={eh.rec}><b>Правило Блонделя:</b> 2 × высота + проступь = 60–64 см</p>
      <p style={eh.rec}><b>Оптимальная высота ступени:</b> 15–18 см</p>
      <p style={eh.rec}><b>Оптимальная проступь:</b> 28–32 см</p>
      <p style={eh.rec}><b>Комфортный угол:</b> 30–35°</p>
    </div>
  )
}

// ─── Стили ────────────────────────────────────────────────────────────────
const s = {
  preview: {
    background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '4px 0 2px',
    marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  previewEmpty: { color: 'var(--text-hint)', fontSize: 13, padding: 20 },

  metrics: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto',
    gap: 4, marginBottom: 10, alignItems: 'start',
  },
  metric:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 0 },
  metricLabel: { fontSize: 9, color: 'var(--text-hint)', textAlign: 'center' },
  metricValue: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap' },

  sliders: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 8 },
  sliderLabel: { fontSize: 11, color: 'var(--text-secondary)', width: 76, flexShrink: 0 },
  rangeInput: { flex: 1, accentColor: 'var(--accent)', cursor: 'pointer', height: 20 },
  rangeNum: {
    width: 44, height: 32, padding: '0 6px',
    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-strong)',
    borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none',
    textAlign: 'center', flexShrink: 0,
  },

  offsetRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  offsetLabel: { fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 },
  offsetField: { display: 'flex', alignItems: 'center', gap: 4, flex: 1 },
  offsetFieldLabel: { fontSize: 11, color: 'var(--text-hint)', flexShrink: 0 },
  offsetInput: {
    flex: 1, height: 32, padding: '0 8px',
    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-strong)',
    borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none',
  },

  togglesRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2,
  },
  toggleGroup: { display: 'flex', alignItems: 'center', gap: 6, flex: 1 },
  toggleLabel: { fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 },
  seg: {
    display: 'flex', gap: 3, background: 'rgba(0,0,0,0.3)',
    borderRadius: 9, padding: 3, flex: 1,
  },
  segBtn: {
    flex: 1, height: 30, padding: '0 6px',
    background: 'transparent', border: 'none', borderRadius: 7,
    color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  segBtnActive: { background: 'var(--accent)', color: '#fff' },

  genBtn: {
    width: '100%', height: 46, marginTop: 4,
    background: 'var(--accent-grad)', border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: 'var(--accent-shadow)',
  },
}

const eh = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  block: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 3 },
  title: { fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 2 },
  text: { margin: 0, fontSize: 12, color: 'var(--text-secondary)' },
  divider: { borderTop: '1px solid var(--border)', margin: '4px 0' },
  rec: { margin: 0, fontSize: 12, color: 'var(--text-secondary)' },
}
```

- [ ] **Step 3.2: Коммит**

```bash
cd /home/victor/projects/drape
git add src/components/room/StaircaseModal.jsx
git commit -m "feat(UI): StaircaseModal — иконка, SVG с метками, слайдеры, X/Y, критерии"
```

---

## Task 4: Переработать `WallCard.jsx`

**Files:**
- Modify: `src/components/room/WallCard.jsx`

- [ ] **Step 4.1: Заменить секцию масок на аккордеон-структуру**

Открыть [WallCard.jsx](src/components/room/WallCard.jsx).

**Изменение 1** — добавить импорт `Fence` и `ChevronDown` вверху:

```js
// НАЙТИ:
import { Trash2 } from 'lucide-react'

// ЗАМЕНИТЬ НА:
import { Trash2, Fence, ChevronDown, Pencil } from 'lucide-react'
```

**Изменение 2** — добавить новые экшены в деструктуризацию хука:

```js
// НАЙТИ:
const { updateWall, removeWall, addMask, addMasks, setTileOverride, clearTileOverride } = useProjectStore()

// ЗАМЕНИТЬ НА:
const { updateWall, removeWall, addMask, addMasks, setTileOverride, clearTileOverride,
        addStaircase, removeStaircase, updateStaircase, replaceStaircase } = useProjectStore()
```

**Изменение 3** — добавить новые state-переменные рядом с `stairsOpen`:

```js
// НАЙТИ:
const [stairsOpen, setStairsOpen] = useState(false)

// ЗАМЕНИТЬ НА:
const [stairsOpen,         setStairsOpen]         = useState(false)
const [editStair,          setEditStair]           = useState(null)
const [stairsAccordion,    setStairsAccordion]    = useState(true)
const [masksAccordion,     setMasksAccordion]     = useState(true)
const [renamingStairId,    setRenamingStairId]    = useState(null)
```

**Изменение 4** — заменить весь блок `{/* Маски */}` (строки 126–145 включительно) на новую разметку:

```jsx
      {/* Лестницы + Маски — два аккордеона */}
      <div style={s.masksSection}>
        {/* Заголовки-тогглы */}
        <div style={s.accordionHeader}>
          <button style={s.accordionToggle} onClick={() => setStairsAccordion(v => !v)}>
            <StairsIconSmall />
            <span>Лестницы</span>
            <ChevronDown size={12} style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: stairsAccordion ? 'rotate(180deg)' : 'none' }} />
          </button>
          <button style={s.accordionToggle} onClick={() => setMasksAccordion(v => !v)}>
            <Fence size={13} />
            <span>Маски</span>
            <ChevronDown size={12} style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: masksAccordion ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>

        {/* Секция лестниц */}
        {stairsAccordion && (
          <div style={s.accordionSection}>
            <button
              style={s.addMaskBtn}
              onClick={() => { setEditStair(null); setStairsOpen(true) }}
            >
              + Добавить
            </button>
            {(wall.stairs ?? []).map((stair) => {
              const stairCalc = calcStaircase(stair)
              const isRenaming = renamingStairId === stair.id
              return (
                <div key={stair.id} style={s.stairItem}>
                  <div style={s.stairItemRow}>
                    {isRenaming ? (
                      <input
                        style={s.stairNameInput}
                        autoFocus
                        value={stair.name}
                        onChange={(e) => updateStaircase(wall.id, stair.id, 'name', e.target.value)}
                        onBlur={() => setRenamingStairId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setRenamingStairId(null)}
                      />
                    ) : (
                      <button
                        style={s.stairNameBtn}
                        onClick={() => { setEditStair(stair); setStairsOpen(true) }}
                      >
                        {stair.name}
                      </button>
                    )}
                    <button style={s.stairIconBtn} onClick={() => setRenamingStairId(stair.id)} title="Переименовать">
                      <Pencil size={12} />
                    </button>
                    <button style={{ ...s.stairIconBtn, ...s.stairDelBtn }} onClick={() => removeStaircase(wall.id, stair.id)} title="Удалить">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {stairCalc && (
                    <div style={s.stairMeta}>
                      {stairCalc.riserHeight.toFixed(1)} / {stairCalc.treadDepth.toFixed(1)} см &middot; {stairCalc.angle.toFixed(1)}°
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Секция обычных масок */}
        {masksAccordion && (
          <div style={s.accordionSection}>
            <button
              style={s.addMaskBtn}
              onClick={() => {
                addMask(wall.id)
                setTimeout(() => {
                  const last = masksListRef.current?.lastElementChild
                  last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                }, 50)
              }}
            >
              + Добавить
            </button>
            {wall.masks.filter(m => !m.staircaseId).length === 0 && (
              <p style={s.empty}>Нет масок</p>
            )}
            <div ref={masksListRef}>
              {wall.masks
                .filter(m => !m.staircaseId)
                .map(mask => <MaskCard key={mask.id} wallId={wall.id} mask={mask} />)}
            </div>
          </div>
        )}
      </div>
```

**Изменение 5** — добавить импорт `calcStaircase` в начало файла:

```js
// ПОСЛЕ существующих импортов добавить:
import { calcStaircase } from '../../utils/staircase.js'
```

**Изменение 6** — обновить `onGenerate` в `StaircaseModal` (строки 147–151):

```jsx
// НАЙТИ:
      <StaircaseModal
        open={stairsOpen}
        onClose={() => setStairsOpen(false)}
        onGenerate={(masks) => addMasks(wall.id, masks)}
      />

// ЗАМЕНИТЬ НА:
      <StaircaseModal
        open={stairsOpen}
        onClose={() => { setStairsOpen(false); setEditStair(null) }}
        editStair={editStair}
        onGenerate={(config) => {
          if (editStair) {
            replaceStaircase(wall.id, editStair.id, config)
          } else {
            addStaircase(wall.id, config)
          }
        }}
      />
```

**Изменение 7** — добавить инлайн SVG-иконку ступеней и новые стили.

Добавить компонент-функцию перед `export default function WallCard`:

```jsx
function StairsIconSmall() {
  return (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,15 1,11 5,11 5,7 9,7 9,3 13,3 13,1" />
      <polyline points="1,15 15,15 15,1" />
    </svg>
  )
}
```

**Изменение 8** — добавить новые стили в объект `s`:

```js
// НАЙТИ:
  empty:             { fontSize: 12, color: '#334155', margin: 0 },

// ЗАМЕНИТЬ НА:
  empty:             { fontSize: 12, color: '#334155', margin: 0 },
  accordionHeader:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 },
  accordionToggle:   {
    display: 'flex', alignItems: 'center', gap: 5, width: '100%',
    height: 32, padding: '0 10px',
    background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: 9, color: '#a78bfa', fontSize: 12, fontWeight: 600,
    cursor: 'pointer',
  },
  accordionSection:  { paddingTop: 6, paddingBottom: 4, display: 'flex', flexDirection: 'column', gap: 4 },
  stairItem:         { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  stairItemRow:      { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' },
  stairNameBtn:      {
    flex: 1, height: 30, padding: '0 6px', background: 'transparent', border: 'none',
    color: 'var(--text-primary)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', textAlign: 'left',
  },
  stairNameInput:    {
    flex: 1, height: 30, padding: '0 6px', background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-strong)', borderRadius: 6,
    color: 'var(--text-primary)', fontSize: 12, outline: 'none',
  },
  stairIconBtn:      {
    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7, color: '#94a3b8', cursor: 'pointer', flexShrink: 0,
  },
  stairDelBtn:       { color: '#f87171', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' },
  stairMeta:         { fontSize: 10, color: 'var(--text-hint)', padding: '2px 14px 6px' },
```

- [ ] **Step 4.2: Коммит**

```bash
cd /home/victor/projects/drape
git add src/components/room/WallCard.jsx
git commit -m "feat(UI): WallCard — аккордеоны Лестницы/Маски, список лестниц, edit mode"
```

---

## Task 5: Финальная проверка

- [ ] **Step 5.1: Прогнать все тесты**

```bash
cd /home/victor/projects/drape && npx vitest run
```

Ожидаем: все тесты PASS.

- [ ] **Step 5.2: Запустить dev-сервер и проверить вручную**

```bash
cd /home/victor/projects/drape && npm run dev
```

Чек-лист проверки:
- [ ] Секция «Маски-препятствия» заменена двумя тоглами «Лестницы» / «Маски»
- [ ] Клик «+ Добавить» открывает модалку с иконкой ступеней, без текста «Лестница»
- [ ] Слайдеры Высота/Длина/Подъёмов работают, синхронизированы с полями
- [ ] SVG показывает «НИЖНИЙ ЭТАЖ», «ВЕРХНИЙ ЭТАЖ», размеры и угол
- [ ] Кнопка «?» открывает критерии с тремя уровнями оценки
- [ ] Сдвиг по X и Y — два отдельных поля
- [ ] Режим `immediate` показывает **бо́льшую** проступь чем `standard`
- [ ] Режим `immediate` показывает **меньший** угол чем `standard`
- [ ] Нет «двойной высоты» в режиме `standard`
- [ ] «Создать N ступеней» — лестница появляется в списке под «Лестницы»
- [ ] Клик по «Лестница 1» открывает модалку в режиме edit (поля заполнены)
- [ ] «Обновить N ступеней» — маски пересоздаются
- [ ] Иконка карандаш — переименование инлайн
- [ ] Иконка корзина — удаление лестницы + её масок
- [ ] Секция «Маски» показывает только ручные маски (не лестничные)

- [ ] **Step 5.3: Итоговый коммит**

```bash
cd /home/victor/projects/drape
git add -A
git commit -m "chore: финальная проверка модуля лестницы"
```
