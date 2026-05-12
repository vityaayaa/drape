# Stage 4 — Pixelizer: план реализации

> **Для агентов:** ОБЯЗАТЕЛЬНЫЙ СУБ-СКИЛЛ: используй superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans для реализации шаг за шагом. Шаги отмечаются чекбоксами (`- [ ]`).

**Цель:** Реализовать вкладку «Фото» — горизонтальную развёртку стен комнаты с двумя режимами: позиционирование фото на стенах и пикселизация (вычисление среднего цвета каждой плитки из зоны фото).

**Архитектура:** Canvas-рендеринг (по одному `<canvas>` на стену). Чистые функции геометрии и сэмплинга тестируются отдельно. Фотографии хранятся в IndexedDB (`photos` store). Состояние вкладки — срез `pixelizer` в `projectStore`.

**Стек:** React 18, Zustand 4, Vite 5, Vitest (уже настроен), idb (уже используется).

---

## Файловая карта

| Действие | Файл |
|----------|------|
| Изменить | `src/store/projectStore.js` |
| Изменить | `src/store/persistence.js` |
| Изменить | `src/components/room/MaskCard.jsx` |
| Создать  | `src/utils/pixelizerGeometry.js` |
| Создать  | `src/utils/pixelizerGeometry.test.js` |
| Создать  | `src/utils/pixelizerSampler.js` |
| Создать  | `src/utils/pixelizerSampler.test.js` |
| Создать  | `src/utils/pixelizerRenderer.js` |
| Заменить | `src/components/pixelizer/PixelizerTab.jsx` |
| Создать  | `src/components/pixelizer/WallCanvas.jsx` |
| Создать  | `src/components/pixelizer/PixelizerControls.jsx` |
| Создать  | `src/components/pixelizer/PhotoSheet.jsx` |
| Создать  | `src/components/pixelizer/WallsSheet.jsx` |

---

## Задача 1: Обновить projectStore.js

**Файлы:**
- Изменить: `src/store/projectStore.js`

Добавляем срез `pixelizer`, обновляем `addMask` (добавляем `color`), обновляем `getSnapshot` и `restoreSnapshot`.

- [ ] **Шаг 1: Открыть файл и найти `DEFAULT_TILE` в начале**

Добавить `DEFAULT_PIXELIZER` сразу после `DEFAULT_TILE`:

```js
const DEFAULT_PIXELIZER = {
  mode: 'photo',           // 'photo' | 'mosaic'
  visibleWalls: null,      // null = все стены видны; string[] = список id
  gridVisible: true,
  photoSettings: {},       // wallId → { photoId, offsetX_mm, offsetY_mm, scale, opacity }
  tileColors: {},          // wallId → { 'col_row': '#rrggbb' }
  tileColorsStale: {},     // wallId → bool
}
```

- [ ] **Шаг 2: В теле стора добавить поле `pixelizer`**

Найти строку `corners: {},` и сразу после неё добавить:

```js
  pixelizer: { ...DEFAULT_PIXELIZER },
```

- [ ] **Шаг 3: Добавить действия для pixelizer после блока `setCorner`**

```js
  // --- Pixelizer ---
  setPixelizerMode: (mode) =>
    set((s) => ({ pixelizer: { ...s.pixelizer, mode } })),

  setGridVisible: (v) =>
    set((s) => ({ pixelizer: { ...s.pixelizer, gridVisible: v } })),

  setVisibleWalls: (walls) =>
    set((s) => ({ pixelizer: { ...s.pixelizer, visibleWalls: walls } })),

  setPhotoSettings: (wallId, settings) =>
    set((s) => ({
      pixelizer: {
        ...s.pixelizer,
        photoSettings: { ...s.pixelizer.photoSettings, [wallId]: settings },
        tileColorsStale: { ...s.pixelizer.tileColorsStale, [wallId]: true },
      },
    })),

  setTileColors: (wallId, colors) =>
    set((s) => ({
      pixelizer: {
        ...s.pixelizer,
        tileColors: { ...s.pixelizer.tileColors, [wallId]: colors },
        tileColorsStale: { ...s.pixelizer.tileColorsStale, [wallId]: false },
      },
    })),
```

- [ ] **Шаг 4: Обновить `addMask` — добавить `color: '#888888'`**

Найти строку внутри `addMask`:
```js
{ id: genId('m'), name: '', x: '', y: '', width: '', height: '' }
```
Заменить на:
```js
{ id: genId('m'), name: '', x: '', y: '', width: '', height: '', color: '#888888' }
```

- [ ] **Шаг 5: Обновить `removeWall` — очищать pixelizer данные стены**

Найти `return { walls, corners }` внутри `removeWall` и заменить:

```js
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
```

- [ ] **Шаг 6: Обновить `getSnapshot` и `restoreSnapshot`**

```js
  getSnapshot: () => {
    const { tile, walls, corners, pixelizer } = get()
    return { tile, walls, corners, pixelizer }
  },

  restoreSnapshot: (snapshot) =>
    set({
      tile:      snapshot.tile      ?? { ...DEFAULT_TILE },
      walls:     snapshot.walls     ?? [],
      corners:   snapshot.corners   ?? {},
      pixelizer: snapshot.pixelizer ?? { ...DEFAULT_PIXELIZER },
    }),
```

- [ ] **Шаг 7: Проверить сборку**

```bash
npm run build
```

Ожидаемый результат: сборка без ошибок.

- [ ] **Шаг 8: Коммит**

```bash
git add src/store/projectStore.js
git commit -m "feat: add pixelizer slice to projectStore, mask color field"
```

---

## Задача 2: Обновить persistence.js

**Файлы:**
- Изменить: `src/store/persistence.js`

Добавляем хелперы для работы с фотографиями в IndexedDB. Таблица `photos` уже создаётся при `initDB`.

- [ ] **Шаг 1: Добавить экспортируемые функции в конец файла**

```js
export async function savePhoto(photoId, blob) {
  if (!db) return
  await db.put('photos', blob, photoId)
}

export async function loadPhoto(photoId) {
  if (!db) return null
  return db.get('photos', photoId)
}

export async function deletePhoto(photoId) {
  if (!db) return
  await db.delete('photos', photoId)
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Коммит**

```bash
git add src/store/persistence.js
git commit -m "feat: add savePhoto/loadPhoto/deletePhoto helpers to persistence"
```

---

## Задача 3: pixelizerGeometry.js — TDD

**Файлы:**
- Создать: `src/utils/pixelizerGeometry.js`
- Создать: `src/utils/pixelizerGeometry.test.js`

Чистые математические функции: масштаб, размеры canvas, позиции тайлов, проверка маски.

- [ ] **Шаг 1: Создать файл с тестами**

```js
// src/utils/pixelizerGeometry.test.js
import { describe, it, expect } from 'vitest'
import {
  computeScale,
  wallCanvasDimensions,
  tileRect,
  maskRectPx,
  isFullyInsideMask,
} from './pixelizerGeometry.js'

describe('computeScale', () => {
  it('fits tallest wall to 75% of viewport height', () => {
    const walls = [
      { length: '300', height: '250' },
      { length: '200', height: '300' },
    ]
    // maxHeight = 300 cm = 3000 mm; scale = (800 * 0.75) / 3000 = 0.2
    expect(computeScale(walls, 800)).toBeCloseTo(0.2)
  })

  it('returns 1 when no walls have valid height', () => {
    expect(computeScale([], 800)).toBe(1)
    expect(computeScale([{ length: '', height: '' }], 800)).toBe(1)
  })
})

describe('wallCanvasDimensions', () => {
  it('converts cm to px via scale', () => {
    // 300 cm × 250 cm, scale = 0.2 px/mm → 600 × 500 px
    const dims = wallCanvasDimensions({ length: '300', height: '250' }, 0.2)
    expect(dims.width).toBe(600)
    expect(dims.height).toBe(500)
  })

  it('returns placeholder size when dimensions missing', () => {
    const dims = wallCanvasDimensions({ length: '', height: '' }, 0.2)
    expect(dims.width).toBe(120)
    expect(dims.height).toBe(80)
    expect(dims.placeholder).toBe(true)
  })
})

describe('tileRect', () => {
  it('computes tile pixel position correctly', () => {
    // col=1, row=2, tileW=20mm, tileH=20mm, grout=2mm, scale=2 px/mm
    // stepX = (20+2)*2 = 44, stepY = 44
    // x = 1*44 = 44, y = 2*44 = 88, w = 20*2 = 40, h = 40
    expect(tileRect(1, 2, 20, 20, 2, 2)).toEqual({ x: 44, y: 88, w: 40, h: 40 })
  })

  it('works for (0,0) origin tile', () => {
    expect(tileRect(0, 0, 10, 10, 0, 1)).toEqual({ x: 0, y: 0, w: 10, h: 10 })
  })
})

describe('maskRectPx', () => {
  it('converts mask cm coords to px', () => {
    // x=10cm, y=5cm, w=20cm, h=15cm, scale=0.5 px/mm
    // x_mm=100, y_mm=50, w_mm=200, h_mm=150
    // px: x=50, y=25, w=100, h=75
    const mask = { x: '10', y: '5', width: '20', height: '15' }
    expect(maskRectPx(mask, 0.5)).toEqual({ x: 50, y: 25, w: 100, h: 75 })
  })
})

describe('isFullyInsideMask', () => {
  it('returns true for tile fully inside mask', () => {
    // mask 40cm×40cm = 400mm×400mm, tile 20mm, grout 2mm → step=22
    // col_start=ceil(0/22)=0, col_end=floor(400/22)=18
    // tile (5,5): 0 ≤ 5 < 18 ✓
    const masks = [{ x: '0', y: '0', width: '40', height: '40' }]
    expect(isFullyInsideMask(5, 5, masks, 20, 20, 2)).toBe(true)
  })

  it('returns false for tile at mask boundary (partial overlap)', () => {
    // col_end = floor(400/22) = 18 → tile 18 is NOT inside
    const masks = [{ x: '0', y: '0', width: '40', height: '40' }]
    expect(isFullyInsideMask(18, 0, masks, 20, 20, 2)).toBe(false)
  })

  it('returns false when no masks', () => {
    expect(isFullyInsideMask(0, 0, [], 20, 20, 2)).toBe(false)
  })

  it('returns false for tile completely outside mask', () => {
    const masks = [{ x: '0', y: '0', width: '10', height: '10' }]
    expect(isFullyInsideMask(50, 50, masks, 20, 20, 2)).toBe(false)
  })
})
```

- [ ] **Шаг 2: Запустить тесты — убедиться что падают**

```bash
npm test
```

Ожидаемый результат: ошибка `Cannot find module './pixelizerGeometry.js'`.

- [ ] **Шаг 3: Создать реализацию**

```js
// src/utils/pixelizerGeometry.js

export function computeScale(walls, viewportHeight) {
  const maxHeight = walls.reduce((max, w) => {
    const h = parseFloat(w.height)
    return isNaN(h) ? max : Math.max(max, h * 10)
  }, 0)
  if (maxHeight <= 0) return 1
  return (viewportHeight * 0.75) / maxHeight
}

export function wallCanvasDimensions(wall, scale) {
  const w = parseFloat(wall.length)
  const h = parseFloat(wall.height)
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
    return { width: 120, height: 80, placeholder: true }
  }
  return {
    width: Math.round(w * 10 * scale),
    height: Math.round(h * 10 * scale),
    placeholder: false,
  }
}

export function tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, scale) {
  const stepX = (tileW_mm + groutW_mm) * scale
  const stepY = (tileH_mm + groutW_mm) * scale
  return {
    x: col * stepX,
    y: row * stepY,
    w: tileW_mm * scale,
    h: tileH_mm * scale,
  }
}

export function maskRectPx(mask, scale) {
  return {
    x: parseFloat(mask.x)      * 10 * scale,
    y: parseFloat(mask.y)      * 10 * scale,
    w: parseFloat(mask.width)  * 10 * scale,
    h: parseFloat(mask.height) * 10 * scale,
  }
}

export function isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm) {
  const stepX = tileW_mm + groutW_mm
  const stepY = tileH_mm + groutW_mm
  return masks.some((m) => {
    const mx = parseFloat(m.x)      * 10
    const my = parseFloat(m.y)      * 10
    const mw = parseFloat(m.width)  * 10
    const mh = parseFloat(m.height) * 10
    if ([mx, my, mw, mh].some(isNaN)) return false
    const colStart = Math.ceil(mx / stepX)
    const colEnd   = Math.floor((mx + mw) / stepX)
    const rowStart = Math.ceil(my / stepY)
    const rowEnd   = Math.floor((my + mh) / stepY)
    return col >= colStart && col < colEnd && row >= rowStart && row < rowEnd
  })
}
```

- [ ] **Шаг 4: Запустить тесты — убедиться что проходят**

```bash
npm test
```

Ожидаемый результат: все тесты зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add src/utils/pixelizerGeometry.js src/utils/pixelizerGeometry.test.js
git commit -m "feat: add pixelizerGeometry with tests"
```

---

## Задача 4: pixelizerSampler.js — TDD

**Файлы:**
- Создать: `src/utils/pixelizerSampler.js`
- Создать: `src/utils/pixelizerSampler.test.js`

`averageColor` — чистая функция, тестируемая без canvas. `sampleWallColors` — использует canvas API, тесты только для `averageColor`.

- [ ] **Шаг 1: Создать файл с тестами**

```js
// src/utils/pixelizerSampler.test.js
import { describe, it, expect } from 'vitest'
import { averageColor } from './pixelizerSampler.js'

describe('averageColor', () => {
  it('returns average RGB of uniform region as hex', () => {
    // 2×2 image, all pixels = RGB(100, 150, 200)
    const pixels = new Uint8ClampedArray([
      100, 150, 200, 255,
      100, 150, 200, 255,
      100, 150, 200, 255,
      100, 150, 200, 255,
    ])
    // 100 = 0x64, 150 = 0x96, 200 = 0xc8
    expect(averageColor(pixels, 0, 0, 2, 2, 2)).toBe('#6496c8')
  })

  it('returns average of mixed colors', () => {
    // 1×2 image: (0,0,0) and (254,254,254) → avg = (127, 127, 127) = 0x7f
    const pixels = new Uint8ClampedArray([
      0,   0,   0,   255,
      254, 254, 254, 255,
    ])
    expect(averageColor(pixels, 0, 0, 1, 2, 1)).toBe('#7f7f7f')
  })

  it('returns fallback color for zero-size region', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255])
    expect(averageColor(pixels, 0, 0, 0, 0, 1)).toBe('#888888')
  })

  it('clamps sampling area to image bounds', () => {
    // 1×1 image with one red pixel; ask for 2×2 area → still just one pixel
    const pixels = new Uint8ClampedArray([200, 50, 80, 255])
    // 200=0xc8, 50=0x32, 80=0x50
    expect(averageColor(pixels, 0, 0, 2, 2, 1)).toBe('#c83250')
  })
})
```

- [ ] **Шаг 2: Запустить — убедиться что падают**

```bash
npm test
```

Ожидаемый результат: ошибка `Cannot find module './pixelizerSampler.js'`.

- [ ] **Шаг 3: Создать реализацию**

```js
// src/utils/pixelizerSampler.js
import { tileRect, isFullyInsideMask } from './pixelizerGeometry.js'

export function averageColor(pixels, x, y, w, h, imageWidth) {
  const x1 = Math.max(0, Math.round(x))
  const y1 = Math.max(0, Math.round(y))
  const x2 = Math.min(imageWidth, Math.round(x + w))
  const imageHeight = Math.floor(pixels.length / (imageWidth * 4))
  const y2 = Math.min(imageHeight, Math.round(y + h))

  let r = 0, g = 0, b = 0, count = 0
  for (let py = y1; py < y2; py++) {
    for (let px = x1; px < x2; px++) {
      const i = (py * imageWidth + px) * 4
      r += pixels[i]
      g += pixels[i + 1]
      b += pixels[i + 2]
      count++
    }
  }
  if (count === 0) return '#888888'
  const toHex = (v) => Math.round(v / count).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Вычисляет цвет каждой плитки из зоны фото на временном canvas.
// photoBlob: Blob из IndexedDB
// photoSettings: { offsetX_mm, offsetY_mm, scale, opacity }
// tileGrid: { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks }
// canvasW, canvasH: размеры canvas стены в пикселях
// canvasScale: px per mm
// Возвращает Promise<{ 'col_row': '#hex' }>
export async function sampleWallColors(photoBlob, photoSettings, tileGrid, canvasW, canvasH, canvasScale) {
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks } = tileGrid
  const { offsetX_mm, offsetY_mm, scale, opacity } = photoSettings

  const canvas = document.createElement('canvas')
  canvas.width  = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')

  const img = await createImageBitmap(photoBlob)
  const drawW = canvasW * scale
  const drawH = img.height * (drawW / img.width)
  const drawX = offsetX_mm * canvasScale
  const drawY = offsetY_mm * canvasScale

  ctx.globalAlpha = opacity
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.globalAlpha = 1.0

  const { data: pixels } = ctx.getImageData(0, 0, canvasW, canvasH)
  const result = {}

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm)) continue
      const rect = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
      result[`${col}_${row}`] = averageColor(pixels, rect.x, rect.y, rect.w, rect.h, canvasW)
    }
  }
  return result
}
```

- [ ] **Шаг 4: Запустить тесты**

```bash
npm test
```

Ожидаемый результат: все тесты зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add src/utils/pixelizerSampler.js src/utils/pixelizerSampler.test.js
git commit -m "feat: add pixelizerSampler with averageColor tests"
```

---

## Задача 5: pixelizerRenderer.js

**Файлы:**
- Создать: `src/utils/pixelizerRenderer.js`

Чистые функции рисования на canvas. Принимают уже готовый `ctx`, данные стены и настройки. Без React, без стора.

- [ ] **Шаг 1: Создать файл**

```js
// src/utils/pixelizerRenderer.js
import { tileRect, maskRectPx, isFullyInsideMask } from './pixelizerGeometry.js'

// Режим «Фото»: фото видно сквозь «окна» плиток, швы в цвете шва.
// ctx: CanvasRenderingContext2D
// W, H: размеры canvas
// photo: HTMLImageElement | ImageBitmap | null
// photoSettings: { offsetX_mm, offsetY_mm, scale, opacity }
// tileGrid: { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks, groutColor }
// canvasScale: px/mm
// gridVisible: boolean
export function drawWallPhoto(ctx, W, H, photo, photoSettings, tileGrid, canvasScale, gridVisible) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#2a2a3a'
  ctx.fillRect(0, 0, W, H)

  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks, groutColor } = tileGrid

  if (gridVisible && columns > 0 && rows > 0) {
    ctx.fillStyle = groutColor || '#cccccc'
    ctx.fillRect(0, 0, W, H)

    ctx.globalAlpha = photo ? photoSettings.opacity : 1.0
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm)) continue
        const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
        ctx.save()
        ctx.beginPath()
        ctx.rect(r.x, r.y, r.w, r.h)
        ctx.clip()
        if (photo) {
          const drawW = W * photoSettings.scale
          const drawH = photo.height * (drawW / photo.width)
          const drawX = photoSettings.offsetX_mm * canvasScale
          const drawY = photoSettings.offsetY_mm * canvasScale
          ctx.drawImage(photo, drawX, drawY, drawW, drawH)
        } else {
          ctx.fillStyle = '#3a3a4a'
          ctx.fillRect(r.x, r.y, r.w, r.h)
        }
        ctx.restore()
      }
    }
    ctx.globalAlpha = 1.0
  } else if (photo) {
    ctx.globalAlpha = photoSettings.opacity
    const drawW = W * photoSettings.scale
    const drawH = photo.height * (drawW / photo.width)
    ctx.drawImage(photo, photoSettings.offsetX_mm * canvasScale, photoSettings.offsetY_mm * canvasScale, drawW, drawH)
    ctx.globalAlpha = 1.0
  }

  _drawMasks(ctx, masks, canvasScale)
}

// Режим «Мозаика»: каждый тайл залит вычисленным цветом, швы в цвете шва.
// tileColors: { 'col_row': '#hex' }
export function drawWallMosaic(ctx, W, H, tileGrid, tileColors, canvasScale) {
  ctx.clearRect(0, 0, W, H)
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks, groutColor } = tileGrid

  ctx.fillStyle = groutColor || '#cccccc'
  ctx.fillRect(0, 0, W, H)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm)) continue
      const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
      ctx.fillStyle = tileColors[`${col}_${row}`] || '#3a3a4a'
      ctx.fillRect(r.x, r.y, r.w, r.h)
    }
  }

  _drawMasks(ctx, masks, canvasScale)
}

// Заглушка для стены без размеров.
export function drawWallPlaceholder(ctx, W, H, wallName) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#1e1e2e'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#3a3a5a'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
  ctx.fillStyle = '#4a4a6a'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(wallName || 'нет данных', W / 2, H / 2)
}

function _drawMasks(ctx, masks, canvasScale) {
  for (const mask of masks) {
    const r = maskRectPx(mask, canvasScale)
    if (isNaN(r.x) || isNaN(r.y) || isNaN(r.w) || isNaN(r.h)) continue
    ctx.globalAlpha = 0.55
    ctx.fillStyle = mask.color || '#888888'
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.globalAlpha = 1.0
  }
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Коммит**

```bash
git add src/utils/pixelizerRenderer.js
git commit -m "feat: add pixelizerRenderer (photo and mosaic draw functions)"
```

---

## Задача 6: Обновить MaskCard.jsx

**Файлы:**
- Изменить: `src/components/room/MaskCard.jsx`

Добавить кнопку выбора цвета маски в строку координат.

- [ ] **Шаг 1: Заменить содержимое файла**

```jsx
// src/components/room/MaskCard.jsx
import { useProjectStore } from '../../store/projectStore.js'

const MASK_FIELDS = [
  { key: 'x',      label: 'X',  unit: 'см' },
  { key: 'y',      label: 'Y',  unit: 'см' },
  { key: 'width',  label: 'Ш',  unit: 'см' },
  { key: 'height', label: 'В',  unit: 'см' },
]

export default function MaskCard({ wallId, mask }) {
  const { updateMask, removeMask } = useProjectStore()

  return (
    <div style={s.card}>
      <div style={s.topRow}>
        <input
          style={s.nameInput}
          placeholder="Название (необяз.)"
          value={mask.name}
          onChange={(e) => updateMask(wallId, mask.id, 'name', e.target.value)}
        />
        <button style={s.delBtn} onClick={() => removeMask(wallId, mask.id)}>
          Удалить
        </button>
      </div>
      <div style={s.coordRow}>
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
              onChange={(e) => updateMask(wallId, mask.id, key, e.target.value)}
            />
            <span style={s.unit}>{unit}</span>
          </div>
        ))}
        <div style={s.fieldWrap}>
          <span style={s.fieldLabel}>Цвет</span>
          <label style={s.colorWrap}>
            <span style={{ ...s.colorDot, background: mask.color || '#888888' }} />
            <input
              type="color"
              value={mask.color || '#888888'}
              onChange={(e) => updateMask(wallId, mask.id, 'color', e.target.value)}
              style={s.colorInput}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

const s = {
  card:       { marginBottom: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' },
  topRow:     { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  nameInput:  { flex: 1, padding: '4px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#f1f5f9', fontSize: 12, outline: 'none' },
  delBtn:     { padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 5, color: '#f87171', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 },
  coordRow:   { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '7px 8px' },
  fieldWrap:  { display: 'flex', alignItems: 'center', gap: 3 },
  fieldLabel: { fontSize: 11, color: '#64748b', minWidth: 12 },
  numInput:   { width: 54, padding: '4px 5px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#f1f5f9', fontSize: 12, outline: 'none' },
  unit:       { fontSize: 11, color: '#475569' },
  colorWrap:  { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  colorDot:   { width: 20, height: 20, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'block' },
  colorInput: { position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' },
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Коммит**

```bash
git add src/components/room/MaskCard.jsx
git commit -m "feat: add color picker to MaskCard"
```

---

## Задача 7: WallCanvas.jsx

**Файлы:**
- Создать: `src/components/pixelizer/WallCanvas.jsx`

Canvas одной стены. Перерисовывается через `useEffect` при изменении зависимостей. Обрабатывает тап для выбора стены.

- [ ] **Шаг 1: Создать файл**

```jsx
// src/components/pixelizer/WallCanvas.jsx
import { useRef, useEffect, useState } from 'react'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { drawWallPhoto, drawWallMosaic, drawWallPlaceholder } from '../../utils/pixelizerRenderer.js'

// photoCache: Map<photoId, ImageBitmap> — передаётся сверху, чтобы не загружать повторно
export default function WallCanvas({ wall, tile, corners, walls, pixelizer, canvasScale, selected, onSelect, photoCache }) {
  const canvasRef = useRef(null)
  const dims = wallCanvasDimensions(wall, canvasScale)
  const settings = pixelizer.photoSettings[wall.id] ?? null
  const tileColors = pixelizer.tileColors[wall.id] ?? {}
  const stale = pixelizer.tileColorsStale[wall.id] ?? false
  const mode = pixelizer.mode

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (dims.placeholder) {
      drawWallPlaceholder(ctx, dims.width, dims.height, wall.name)
      return
    }

    const gridResults = calculateGrid(tile, walls, corners)
    const wallIndex = walls.findIndex(w => w.id === wall.id)
    const gridResult = gridResults[wallIndex]

    const tileGrid = gridResult ? {
      columns:   gridResult.columns,
      rows:      gridResult.rows,
      tileW_mm:  parseFloat(tile.tile_width)  || 0,
      tileH_mm:  parseFloat(tile.tile_height) || 0,
      groutW_mm: parseFloat(tile.grout_width) || 0,
      groutColor: tile.grout_color,
      masks: wall.masks,
    } : null

    const photo = settings ? (photoCache.get(settings.photoId) ?? null) : null

    if (mode === 'mosaic' && tileGrid) {
      drawWallMosaic(ctx, dims.width, dims.height, tileGrid, tileColors, canvasScale)
    } else {
      drawWallPhoto(ctx, dims.width, dims.height, photo, settings ?? { offsetX_mm: 0, offsetY_mm: 0, scale: 1, opacity: 1 }, tileGrid ?? { columns: 0, rows: 0, tileW_mm: 0, tileH_mm: 0, groutW_mm: 0, groutColor: '#ccc', masks: [] }, canvasScale, pixelizer.gridVisible)
    }
  }, [wall, tile, corners, walls, pixelizer, canvasScale, mode, dims.width, dims.height, photoCache])

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        width={dims.width}
        height={dims.height}
        onClick={onSelect}
        style={{
          display: 'block',
          cursor: 'pointer',
          outline: selected ? '2px solid #818cf8' : 'none',
          borderRadius: 2,
        }}
      />
      <div style={s.wallLabel}>{wall.name}</div>
      {stale && mode === 'mosaic' && (
        <div style={s.staleHint}>обновить</div>
      )}
    </div>
  )
}

const s = {
  wallLabel: { position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#64748b', pointerEvents: 'none' },
  staleHint: { position: 'absolute', top: 4, right: 4, background: '#f59e0b', color: '#000', fontSize: 9, padding: '2px 5px', borderRadius: 4 },
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Коммит**

```bash
git add src/components/pixelizer/WallCanvas.jsx
git commit -m "feat: add WallCanvas component"
```

---

## Задача 8: WallsSheet.jsx

**Файлы:**
- Создать: `src/components/pixelizer/WallsSheet.jsx`

Шторка для управления видимостью стен.

- [ ] **Шаг 1: Создать файл**

```jsx
// src/components/pixelizer/WallsSheet.jsx
import { useProjectStore } from '../../store/projectStore.js'

export default function WallsSheet({ onClose }) {
  const { walls, pixelizer, setVisibleWalls } = useProjectStore()
  const visible = pixelizer.visibleWalls

  function toggle(id) {
    if (visible === null) {
      // переходим к явному списку: все кроме нажатой
      setVisibleWalls(walls.map(w => w.id).filter(wid => wid !== id))
    } else {
      const next = visible.includes(id) ? visible.filter(wid => wid !== id) : [...visible, id]
      setVisibleWalls(next.length === walls.length ? null : next)
    }
  }

  function showAll() { setVisibleWalls(null) }

  const isVisible = (id) => visible === null || visible.includes(id)

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        <div style={s.handle} />
        <p style={s.title}>Видимость стен</p>
        {walls.map(w => (
          <label key={w.id} style={s.row}>
            <input
              type="checkbox"
              checked={isVisible(w.id)}
              onChange={() => toggle(w.id)}
              style={{ marginRight: 10 }}
            />
            <span style={s.name}>{w.name}</span>
          </label>
        ))}
        <button style={s.allBtn} onClick={showAll}>Показать все</button>
      </div>
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  sheet:   { width: '100%', background: '#1e1e2e', borderRadius: '16px 16px 0 0', padding: '12px 16px 32px', maxHeight: '60vh', overflowY: 'auto' },
  handle:  { width: 36, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 12px' },
  title:   { fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 },
  row:     { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' },
  name:    { fontSize: 14, color: '#cbd5e1' },
  allBtn:  { marginTop: 16, width: '100%', padding: '10px', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 8, color: '#818cf8', fontSize: 14, cursor: 'pointer' },
}
```

- [ ] **Шаг 2: Коммит**

```bash
git add src/components/pixelizer/WallsSheet.jsx
git commit -m "feat: add WallsSheet component"
```

---

## Задача 9: PhotoSheet.jsx

**Файлы:**
- Создать: `src/components/pixelizer/PhotoSheet.jsx`

Шторка для добавления фото: «на все стены» или на конкретную.

- [ ] **Шаг 1: Создать файл**

```jsx
// src/components/pixelizer/PhotoSheet.jsx
import { useRef } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { savePhoto } from '../../store/persistence.js'

function genPhotoId() {
  return `ph_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export default function PhotoSheet({ onClose, onPhotosAdded }) {
  const { walls, pixelizer, setPhotoSettings } = useProjectStore()
  const inputRef = useRef(null)
  const targetRef = useRef(null)  // null = все стены; string = wallId

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = new Blob([await file.arrayBuffer()], { type: file.type })
    const photoId = genPhotoId()
    await savePhoto(photoId, blob)

    const targetWalls = targetRef.current === null
      ? walls
      : walls.filter(w => w.id === targetRef.current)

    for (const wall of targetWalls) {
      const existing = pixelizer.photoSettings[wall.id]
      setPhotoSettings(wall.id, {
        photoId,
        offsetX_mm: existing?.offsetX_mm ?? 0,
        offsetY_mm: existing?.offsetY_mm ?? 0,
        scale:      existing?.scale      ?? 1.0,
        opacity:    existing?.opacity    ?? 1.0,
      })
    }
    onPhotosAdded?.()
    onClose()
  }

  function trigger(target) {
    targetRef.current = target
    inputRef.current?.click()
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        <div style={s.handle} />
        <p style={s.title}>Добавить фото</p>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button style={s.btn} onClick={() => trigger(null)}>На все стены</button>
        <p style={s.sub}>Или выбери конкретную:</p>
        {walls.map(w => (
          <button key={w.id} style={s.wallBtn} onClick={() => trigger(w.id)}>
            {w.name}
          </button>
        ))}
      </div>
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  sheet:   { width: '100%', background: '#1e1e2e', borderRadius: '16px 16px 0 0', padding: '12px 16px 32px', maxHeight: '70vh', overflowY: 'auto' },
  handle:  { width: 36, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 12px' },
  title:   { fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 },
  btn:     { display: 'block', width: '100%', padding: '12px', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 8, color: '#818cf8', fontSize: 14, cursor: 'pointer', marginBottom: 12 },
  sub:     { fontSize: 12, color: '#64748b', margin: '12px 0 8px' },
  wallBtn: { display: 'block', width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#cbd5e1', fontSize: 13, cursor: 'pointer', marginBottom: 6, textAlign: 'left' },
}
```

- [ ] **Шаг 2: Коммит**

```bash
git add src/components/pixelizer/PhotoSheet.jsx
git commit -m "feat: add PhotoSheet component"
```

---

## Задача 10: PixelizerControls.jsx

**Файлы:**
- Создать: `src/components/pixelizer/PixelizerControls.jsx`

Нижняя панель управления. Два режима: «Фото» (позиционирование) и «Мозаика». При наличии выбранной стены показывает поля редактирования фото.

- [ ] **Шаг 1: Создать файл**

```jsx
// src/components/pixelizer/PixelizerControls.jsx
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { sampleWallColors } from '../../utils/pixelizerSampler.js'
import { wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { loadPhoto } from '../../store/persistence.js'
import WallsSheet from './WallsSheet.jsx'
import PhotoSheet from './PhotoSheet.jsx'

export default function PixelizerControls({ selectedWallId, onSelectWall, canvasScale, onPhotosAdded }) {
  const { walls, tile, corners, pixelizer, setPixelizerMode, setGridVisible, setPhotoSettings, setTileColors } = useProjectStore()
  const [showWalls, setShowWalls] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [sampling, setSampling] = useState(false)

  const mode = pixelizer.mode
  const settings = selectedWallId ? pixelizer.photoSettings[selectedWallId] : null

  function updateField(field, value) {
    if (!selectedWallId || !settings) return
    setPhotoSettings(selectedWallId, { ...settings, [field]: value })
  }

  async function handlePixelize() {
    setSampling(true)
    const gridResults = calculateGrid(tile, walls, corners)
    const targets = walls.filter(w => {
      const s = pixelizer.photoSettings[w.id]
      return s?.photoId && (pixelizer.tileColorsStale[w.id] !== false)
    })
    for (const wall of targets) {
      const wallIndex = walls.findIndex(w => w.id === wall.id)
      const gridResult = gridResults[wallIndex]
      if (!gridResult) continue
      const ps = pixelizer.photoSettings[wall.id]
      const blob = await loadPhoto(ps.photoId)
      if (!blob) continue
      const tileW_mm  = parseFloat(tile.tile_width)  || 0
      const tileH_mm  = parseFloat(tile.tile_height) || 0
      const groutW_mm = parseFloat(tile.grout_width)  || 0
      const dims = wallCanvasDimensions(wall, canvasScale)
      const tileGrid = {
        columns:  gridResult.columns,
        rows:     gridResult.rows,
        tileW_mm, tileH_mm, groutW_mm,
        masks: wall.masks,
      }
      const colors = await sampleWallColors(blob, ps, tileGrid, dims.width, dims.height, canvasScale)
      setTileColors(wall.id, colors)
    }
    setPixelizerMode('mosaic')
    setSampling(false)
  }

  const anyStale = walls.some(w => pixelizer.tileColorsStale[w.id] !== false && pixelizer.photoSettings[w.id])

  return (
    <>
      <div style={s.panel}>
        {mode === 'photo' ? (
          <>
            <button style={s.btn} onClick={() => setShowWalls(true)}>Стены ▾</button>
            <button style={s.btn} onClick={() => setShowPhoto(true)}>+ Фото</button>
            <button
              style={{ ...s.btn, color: pixelizer.gridVisible ? '#818cf8' : '#64748b' }}
              onClick={() => setGridVisible(!pixelizer.gridVisible)}
            >
              Сетка
            </button>
            <button
              style={{ ...s.btnPrimary, opacity: sampling ? 0.5 : 1 }}
              onClick={handlePixelize}
              disabled={sampling}
            >
              {sampling ? '...' : anyStale ? '⟳ Обновить' : 'Пикселизировать →'}
            </button>
          </>
        ) : (
          <>
            <button style={s.btnPrimary} onClick={() => setPixelizerMode('photo')}>← К фото</button>
            <button style={s.btn} onClick={() => setShowWalls(true)}>Стены ▾</button>
            <button
              style={{ ...s.btn, color: pixelizer.gridVisible ? '#818cf8' : '#64748b' }}
              onClick={() => setGridVisible(!pixelizer.gridVisible)}
            >
              Сетка
            </button>
          </>
        )}
      </div>

      {mode === 'photo' && settings && selectedWallId && (
        <div style={s.photoRow}>
          <label style={s.fieldLabel}>X</label>
          <input style={s.numInput} type="number" step="1" value={settings.offsetX_mm} onChange={e => updateField('offsetX_mm', parseFloat(e.target.value) || 0)} />
          <span style={s.unit}>мм</span>
          <label style={s.fieldLabel}>Y</label>
          <input style={s.numInput} type="number" step="1" value={settings.offsetY_mm} onChange={e => updateField('offsetY_mm', parseFloat(e.target.value) || 0)} />
          <span style={s.unit}>мм</span>
          <label style={s.fieldLabel}>Масштаб</label>
          <input style={s.numInput} type="number" step="0.05" min="0.1" max="10" value={settings.scale} onChange={e => updateField('scale', parseFloat(e.target.value) || 1)} />
          <label style={s.fieldLabel}>Прозрачность</label>
          <input type="range" min="0" max="1" step="0.05" value={settings.opacity} onChange={e => updateField('opacity', parseFloat(e.target.value))} style={{ flex: 1 }} />
        </div>
      )}

      {showWalls && <WallsSheet onClose={() => setShowWalls(false)} />}
      {showPhoto && <PhotoSheet onClose={() => setShowPhoto(false)} onPhotosAdded={onPhotosAdded} />}
    </>
  )
}

const s = {
  panel:      { display: 'flex', gap: 6, padding: '8px 12px', background: '#1e1e2e', borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' },
  photoRow:   { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#18182a', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)' },
  btn:        { padding: '7px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  btnPrimary: { padding: '7px 14px', background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.4)', borderRadius: 7, color: '#818cf8', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  fieldLabel: { fontSize: 11, color: '#64748b' },
  numInput:   { width: 58, padding: '4px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#f1f5f9', fontSize: 12, outline: 'none' },
  unit:       { fontSize: 11, color: '#475569' },
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Коммит**

```bash
git add src/components/pixelizer/PixelizerControls.jsx
git commit -m "feat: add PixelizerControls component"
```

---

## Задача 11: PixelizerTab.jsx

**Файлы:**
- Заменить: `src/components/pixelizer/PixelizerTab.jsx`

Главный контейнер вкладки. Управляет зумом (щипок), горизонтальным скроллом, кешем фотографий.

- [ ] **Шаг 1: Заменить содержимое файла**

```jsx
// src/components/pixelizer/PixelizerTab.jsx
import { useRef, useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { loadPhoto } from '../../store/persistence.js'
import { computeScale } from '../../utils/pixelizerGeometry.js'
import WallCanvas from './WallCanvas.jsx'
import PixelizerControls from './PixelizerControls.jsx'

export default function PixelizerTab() {
  const { walls, tile, corners, pixelizer } = useProjectStore()

  const [zoom, setZoom] = useState(1)
  const [selectedWallId, setSelectedWallId] = useState(null)
  const [photoCache, setPhotoCache] = useState(new Map())
  const [, forceRedraw] = useState(0)

  const touchRef = useRef({ lastDist: null })
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 700

  const canvasScale = computeScale(walls, viewportH) * zoom

  // Загружаем фотографии в кеш при изменении photoSettings
  useEffect(() => {
    const settings = pixelizer.photoSettings
    const ids = Object.values(settings).map(s => s.photoId).filter(Boolean)
    const cached = photoCache

    Promise.all(
      ids.map(async id => {
        if (cached.has(id)) return null
        const blob = await loadPhoto(id)
        if (!blob) return null
        const bmp = await createImageBitmap(blob)
        return [id, bmp]
      })
    ).then(entries => {
      const updates = entries.filter(Boolean)
      if (updates.length === 0) return
      setPhotoCache(prev => {
        const next = new Map(prev)
        updates.forEach(([id, bmp]) => next.set(id, bmp))
        return next
      })
    })
  }, [pixelizer.photoSettings])

  function handleTouchMove(e) {
    if (e.touches.length !== 2) { touchRef.current.lastDist = null; return }
    e.preventDefault()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.hypot(dx, dy)
    if (touchRef.current.lastDist !== null) {
      const ratio = dist / touchRef.current.lastDist
      setZoom(z => Math.max(0.25, Math.min(6, z * ratio)))
    }
    touchRef.current.lastDist = dist
  }

  function handleTouchEnd(e) {
    if (e.touches.length < 2) touchRef.current.lastDist = null
  }

  const visibleWalls = walls.filter(w => {
    if (!w.wall_active) return false
    if (pixelizer.visibleWalls === null) return true
    return pixelizer.visibleWalls.includes(w.id)
  })

  if (walls.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyText}>Добавь стены в разделе «Комната»</p>
      </div>
    )
  }

  return (
    <div style={s.root}>
      <div
        style={s.scrollArea}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ ...s.wallsRow, transform: `scale(${zoom})`, transformOrigin: 'left top' }}>
          {visibleWalls.map(wall => (
            <WallCanvas
              key={wall.id}
              wall={wall}
              tile={tile}
              corners={corners}
              walls={walls}
              pixelizer={pixelizer}
              canvasScale={computeScale(walls, viewportH)}
              selected={selectedWallId === wall.id}
              onSelect={() => setSelectedWallId(id => id === wall.id ? null : wall.id)}
              photoCache={photoCache}
            />
          ))}
        </div>
      </div>

      <div style={s.controls}>
        <PixelizerControls
          selectedWallId={selectedWallId}
          canvasScale={computeScale(walls, viewportH)}
          onPhotosAdded={() => forceRedraw(n => n + 1)}
        />
      </div>
    </div>
  )
}

const s = {
  root:       { display: 'flex', flexDirection: 'column', height: '100%', background: '#0f0f1a', overflow: 'hidden' },
  scrollArea: { flex: 1, overflowX: 'auto', overflowY: 'hidden', touchAction: 'pan-x pan-y' },
  wallsRow:   { display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start', width: 'max-content' },
  controls:   { flexShrink: 0 },
  empty:      { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
  emptyText:  { color: '#475569', fontSize: 15 },
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

Ожидаемый результат: сборка без ошибок.

- [ ] **Шаг 3: Запустить все тесты**

```bash
npm test
```

Ожидаемый результат: все тесты (включая geometry и sampler) зелёные.

- [ ] **Шаг 4: Коммит**

```bash
git add src/components/pixelizer/PixelizerTab.jsx
git commit -m "feat: implement PixelizerTab — Stage 4 complete"
```

---

## Задача 12: Финальный деплой

- [ ] **Шаг 1: Запустить все тесты**

```bash
npm test
```

Ожидаемый результат: все тесты зелёные.

- [ ] **Шаг 2: Запустить сборку**

```bash
npm run build
```

Ожидаемый результат: сборка без ошибок и предупреждений.

- [ ] **Шаг 3: Запушить ветку**

```bash
git push origin stage_4
```

Vercel автоматически создаст preview-URL для ветки.

---

## Чек-лист покрытия спека

| Требование | Задача |
|---|---|
| Два режима: фото / мозаика | 1, 10, 11 |
| Горизонтальная развёртка с прокруткой | 11 |
| Щипок = зум | 11 |
| Тап на стену = выбрать | 7, 11 |
| Плиточная сетка (шов вырезает фото) | 5, 7 |
| Кнопка «Сетка вкл/выкл» | 10 |
| Добавить фото: на все / конкретную | 9 |
| Позиционирование: X, Y, масштаб, прозрачность | 10 |
| Кнопка «Пикселизировать» | 10 |
| Вычисление среднего цвета плитки | 4 |
| tileColorsStale → кнопка «Обновить» | 1, 10 |
| Фильтр видимости стен | 8, 11 |
| Маски: полупрозрачный цвет поверх | 5, 7 |
| Цвет маски в Room tab | 6 |
| Фото в отдельной таблице IndexedDB | 2, 9 |
| Автосохранение pixelizer состояния | 1 (через существующий persistence) |
| Заглушка для стен без размеров | 5, 7 |
| tileColors передаётся в Stage 3 (3D) | 1 (данные в сторе, Stage 3 читает) |
