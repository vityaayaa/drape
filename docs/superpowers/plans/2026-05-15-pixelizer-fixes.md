# Pixelizer Fixes — Stage 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить 9 проблем вкладки «Пикселизатор»: формула ceil вместо floor, максимум столбцов/рядов в итоге, высота WallSelectSheet, растягивание фото между стенами (spanning), якорь фото к полу (floor anchor), наложение сетки как линий поверх фото, коррекция яркости/контраста/насыщенности, кнопка удаления фото.

**Architecture:** Основные изменения — в `pixelizerRenderer.js` (переработка алгоритма рисования) и `WallCanvas.jsx` (вычисление смещения стены в группе для spanning). Функция `sampleWallColors` в `pixelizerSampler.js` получает те же span-параметры для корректной пикселизации. Остальные задачи — независимые локальные правки.

**Tech Stack:** React 18, Vite 5, Zustand 4, HTML Canvas API, IndexedDB (idb), Vitest (environment: node)

---

## Файловая карта

| Файл | Тип изменения | Что делается |
|---|---|---|
| `src/utils/roomGeometry.js` | Modify | `Math.floor` → `Math.ceil` (строки 102-103) |
| `src/utils/roomGeometry.test.js` | Modify | Обновить ожидаемые значения под ceil |
| `src/components/room/SummarySection.jsx` | Modify | Хардкод «—» → max столбцов / max рядов |
| `src/components/pixelizer/WallSelectSheet.jsx` | Modify | maxHeight + flex-scroll + sticky кнопки |
| `src/utils/pixelizerRenderer.js` | Modify | Spanning, floor anchor, grid overlay, ctx.filter, fix drawBoundingBox |
| `src/utils/pixelizerSampler.js` | Modify | Spanning + floor anchor в sampleWallColors |
| `src/components/pixelizer/WallCanvas.jsx` | Modify | Вычислить wallGroupOffsetX_mm / groupTotalWidth_mm, передать в renderer |
| `src/components/pixelizer/PhotoCard.jsx` | Modify | Кнопка удаления фото |
| `src/components/pixelizer/ControlsPane.jsx` | Modify | Проброс onDelete в PhotoCard + ползунки коррекции в TransformPane |
| `src/components/pixelizer/PixelizerTab.jsx` | Modify | handleDeletePhoto, defaults коррекции, span-параметры в handlePixelize |

---

### Task 1: roomGeometry.js — формула ceil

**Проблема:** `Math.floor` режет крайние плитки, из-за чего последний ряд/столбец выглядит незаконченным. Нужен `Math.ceil` — плитки с запасом, крайние обрезаются canvas.

**Files:**
- Modify: `src/utils/roomGeometry.js:102-103`
- Modify: `src/utils/roomGeometry.test.js:14-22, 39-42, 58-68`

- [ ] **Step 1: Обновить тест для ожидаемых значений ceil**

В `src/utils/roomGeometry.test.js` найти тест «считает колонки и ряды правильно» (строки 14-23) и заменить:

```js
it('считает колонки и ряды правильно', () => {
  // grid_width=300cm=3000mm, columns=ceil((3000+2)/(20+2))=ceil(136.45)=137
  // rows=ceil((2500+2)/(20+2))=ceil(113.72)=114
  const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: {}, masks: [] }]
  const r = calculateGrid(tile, walls, {})[0]
  expect(r.columns).toBe(137)
  expect(r.rows).toBe(114)
  expect(r.total_before_masks).toBe(137 * 114)
  expect(r.total).toBe(137 * 114)
})
```

Найти тест «переопределение tile_width влияет на расчёт» (строки 37-43) и заменить:

```js
it('переопределение tile_width влияет на расчёт', () => {
  // tile_width=40 → columns=ceil((3000+2)/(40+2))=ceil(71.47)=72
  const walls = [{ id: 'w1', length: '300', height: '250', wall_active: true, mosaic_active: true, tile_overrides: { tile_width: '40' }, masks: [] }]
  const r = calculateGrid(tile, walls, {})[0]
  expect(r.columns).toBe(72)
})
```

Найти тест «принудительное перекрытие через corners» (строки 58-69) и заменить строку с `Math.floor` на `Math.ceil`:

```js
// w1.grid_width = 2000-10=1990мм → columns=ceil((1990+2)/22)=ceil(90.54)=91
const corners = { 'w1-w2': 'w2' }
const r = calculateGrid(thickTile, walls, corners)[0]
expect(r.columns).toBe(Math.ceil((1990 + 2) / 22))
```

- [ ] **Step 2: Запустить тесты — убедиться, что падают**

```bash
npx vitest run src/utils/roomGeometry.test.js
```

Ожидаемо: FAIL — `expected 136 to be 137` и т.д.

- [ ] **Step 3: Исправить roomGeometry.js**

В `src/utils/roomGeometry.js`, строки 102-103, заменить `Math.floor` на `Math.ceil`:

```js
const columns = Math.ceil((gridWidthMm + gw) / (tw + gw))
const rows    = Math.ceil((gridHeightMm + gw) / (th + gw))
```

- [ ] **Step 4: Запустить тесты — убедиться, что проходят**

```bash
npx vitest run src/utils/roomGeometry.test.js
```

Ожидаемо: PASS — все тесты зелёные.

- [ ] **Step 5: Commit**

```bash
git add src/utils/roomGeometry.js src/utils/roomGeometry.test.js
git commit -m "fix: use Math.ceil for tile columns/rows — full coverage with edge clipping"
```

---

### Task 2: SummarySection.jsx — max столбцов / max рядов

**Проблема:** Строка «Итого» показывает «—» для столбцов и рядов. Нужно показывать максимум по всем активным стенам.

**Files:**
- Modify: `src/components/room/SummarySection.jsx:39-46`

- [ ] **Step 1: Обновить компонент SummarySection**

В `src/components/room/SummarySection.jsx` найти секцию `<tfoot>` (строки 39-46) и заменить весь блок вместе с вычислением перед ним:

```jsx
const activeResults = results.filter(Boolean)
const totalTiles = activeResults.reduce((sum, r) => sum + r.total, 0)
const maxColumns = activeResults.length > 0 ? Math.max(...activeResults.map(r => r.columns)) : 0
const maxRows    = activeResults.length > 0 ? Math.max(...activeResults.map(r => r.rows))    : 0
```

И в `<tfoot>`:

```jsx
{activeResults.length > 0 && (
  <tfoot>
    <tr style={s.footRow}>
      <td style={s.td}>Итого</td>
      <td style={s.tdNum}>{maxColumns > 0 ? maxColumns : '—'}</td>
      <td style={s.tdNum}>{maxRows > 0 ? maxRows : '—'}</td>
      <td style={{ ...s.tdNum, fontWeight: 700, color: '#a78bfa' }}>{totalTiles.toLocaleString()}</td>
    </tr>
  </tfoot>
)}
```

Полный файл после изменения:

```jsx
// src/components/room/SummarySection.jsx
import { useProjectStore } from '../../store/projectStore.js'

export default function SummarySection({ results }) {
  const { walls } = useProjectStore()

  if (walls.length === 0) return null

  const activeResults = results.filter(Boolean)
  const totalTiles = activeResults.reduce((sum, r) => sum + r.total, 0)
  const maxColumns = activeResults.length > 0 ? Math.max(...activeResults.map(r => r.columns)) : 0
  const maxRows    = activeResults.length > 0 ? Math.max(...activeResults.map(r => r.rows))    : 0

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
                <td style={{ ...s.tdNum, color: r?.blocked ? '#f87171' : r?.warning ? '#fbbf24' : '#f1f5f9' }}>
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
              <td style={s.tdNum}>{maxColumns > 0 ? maxColumns : '—'}</td>
              <td style={s.tdNum}>{maxRows > 0 ? maxRows : '—'}</td>
              <td style={{ ...s.tdNum, fontWeight: 700, color: '#a78bfa' }}>{totalTiles.toLocaleString()}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

const s = {
  block:   { padding: '18px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginTop: 10 },
  heading: { fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#f1f5f9', letterSpacing: '-0.01em' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:      { textAlign: 'left', padding: '6px 8px', color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 500, fontSize: 12 },
  tr:      { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td:      { padding: '8px 8px', color: '#94a3b8' },
  tdNum:   { padding: '8px 8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'ui-monospace, monospace', fontSize: 13 },
  footRow: { borderTop: '2px solid rgba(255,255,255,0.1)' },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/room/SummarySection.jsx
git commit -m "feat: show max columns/rows in SummarySection footer"
```

---

### Task 3: WallSelectSheet.jsx — высота и прокрутка

**Проблема:** При большом количестве чипов кнопки «Все стены» и «Выбрать файл» уходят за экран. Нужны: ограничение высоты листа + прокрутка чипов + кнопки всегда видны внизу.

**Files:**
- Modify: `src/components/pixelizer/WallSelectSheet.jsx`

- [ ] **Step 1: Переработать WallSelectSheet.jsx**

Заменить весь файл:

```jsx
// src/components/pixelizer/WallSelectSheet.jsx
import { useRef } from 'react'

export default function WallSelectSheet({ walls, selectedWallIds, onToggle, onSelectAll, onFileSelected, onCancel }) {
  const inputRef = useRef(null)
  const hasSelection = selectedWallIds.length > 0

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await onFileSelected(file)
  }

  return (
    <div style={s.sheet} className="sheet-up">
      {/* Handle */}
      <div style={s.handle} />

      {/* Title row */}
      <div style={s.titleRow}>
        <span style={s.title}>Выбери стены для фото</span>
        <button style={s.closeBtn} onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Scrollable area: chips + hint */}
      <div style={s.scrollArea}>
        <div style={s.chips}>
          {walls.map(wall => {
            const selected = selectedWallIds.includes(wall.id)
            return (
              <button
                key={wall.id}
                style={{ ...s.chip, ...(selected ? s.chipActive : {}) }}
                onClick={() => onToggle(wall.id)}
              >
                {selected && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {wall.name}
              </button>
            )
          })}
        </div>

        <p style={s.hint}>
          {hasSelection
            ? `Выбрано стен: ${selectedWallIds.length}`
            : 'Нажмите на стены в развёртке или выберите здесь'}
        </p>
      </div>

      {/* Actions — всегда видны */}
      <div style={s.actions}>
        <button style={s.btnAll} onClick={onSelectAll}>Все стены</button>
        <button
          style={{ ...s.btnFile, ...(!hasSelection ? s.btnFileDim : {}) }}
          onClick={() => hasSelection && inputRef.current?.click()}
        >
          Выбрать файл ▸
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}

const s = {
  sheet: {
    position: 'fixed',
    bottom: 0, left: 0, right: 0,
    maxHeight: '75vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(10,10,20,0.96)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderTop: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '20px 20px 0 0',
    padding: '8px 16px 0',
    zIndex: 200,
  },
  handle: {
    width: 36, height: 4,
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    margin: '0 auto 16px',
    flexShrink: 0,
  },
  titleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
    flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: 600, color: '#f1f5f9' },
  closeBtn: {
    width: 32, height: 32,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    minHeight: 0,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    display: 'flex', alignItems: 'center',
    padding: '7px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 20,
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: 'rgba(129,140,248,0.18)',
    border: '1px solid rgba(129,140,248,0.45)',
    color: '#818cf8',
  },
  hint: { fontSize: 12, color: '#475569', marginBottom: 14, minHeight: 16 },
  actions: {
    display: 'flex', gap: 8,
    flexShrink: 0,
    padding: '12px 0',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  btnAll: {
    padding: '0 16px', height: 42,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
  },
  btnFile: {
    flex: 1, height: 42,
    background: 'rgba(129,140,248,0.18)',
    border: '1px solid rgba(129,140,248,0.40)',
    borderRadius: 10,
    color: '#818cf8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnFileDim: {
    opacity: 0.35,
    cursor: 'default',
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pixelizer/WallSelectSheet.jsx
git commit -m "fix: WallSelectSheet — scrollable chips, sticky action buttons"
```

---

### Task 4: pixelizerRenderer.js — spanning, floor anchor, grid overlay, ctx.filter

**Проблема 1:** `drawW = W * scale` масштабирует фото под ширину одной стены — при нескольких стенах одно фото дублируется на каждой. Нужно использовать полную ширину группы стен.

**Проблема 2:** `drawY = offsetY * canvasScale` позиционирует фото от верха. Нужно от пола: `drawY = H - drawH - offsetY * canvasScale`.

**Проблема 3:** Режим photo+grid рисует фото через «окна» плиток. Нужно рисовать полное фото + полупрозрачные линии сетки поверх.

**Проблема 4:** Нет коррекции фото (яркость/контраст/насыщенность).

**Files:**
- Modify: `src/utils/pixelizerRenderer.js`

- [ ] **Step 1: Переписать pixelizerRenderer.js**

Новая сигнатура `drawWallPhoto` принимает два новых опциональных параметра в конце: `wallGroupOffsetX_mm = 0` и `groupTotalWidth_mm = null`. При `groupTotalWidth_mm = null` поведение такое же, как раньше (фото на одну стену).

Заменить весь файл:

```js
// src/utils/pixelizerRenderer.js
import { tileRect, maskRectPx, isFullyInsideMask } from './pixelizerGeometry.js'

// drawWallPhoto — рисует фото/сетку на canvas одной стены.
//
// wallGroupOffsetX_mm: суммарная ширина стен слева от этой в группе (mm)
// groupTotalWidth_mm: суммарная ширина всех стен группы (mm). null = одна стена.
//
// Режимы (через gridVisible + hidePhoto):
//   photo only:  gridVisible=false, hidePhoto=false → полное фото
//   photo+grid:  gridVisible=true,  hidePhoto=false → фото + сетка поверх
//   grid only:   gridVisible=true,  hidePhoto=true  → заливка шва + плитки
export function drawWallPhoto(
  ctx, W, H,
  photo, photoSettings,
  tileGrid, canvasScale,
  gridVisible, hidePhoto,
  wallGroupOffsetX_mm = 0, groupTotalWidth_mm = null
) {
  ctx.clearRect(0, 0, W, H)
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, groutColor, masks } = tileGrid
  const showPhoto = photo && !hidePhoto

  // Фон
  ctx.fillStyle = (!showPhoto && gridVisible && columns > 0)
    ? (groutColor || '#cccccc')
    : '#2a2a3a'
  ctx.fillRect(0, 0, W, H)

  // Рисуем фото (режимы: photo, photo+grid)
  if (showPhoto) {
    const wallWidthMm = W / canvasScale
    const totalW_mm = groupTotalWidth_mm != null ? groupTotalWidth_mm : wallWidthMm
    const drawW = totalW_mm * canvasScale * photoSettings.scale
    const drawH = photo.height * (drawW / photo.width)
    const drawX = (-wallGroupOffsetX_mm + (photoSettings.offsetX_mm ?? 0)) * canvasScale
    const drawY = H - drawH - (photoSettings.offsetY_mm ?? 0) * canvasScale

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, H)
    ctx.clip()
    ctx.globalAlpha = photoSettings.opacity ?? 1
    const { brightness = 1, contrast = 1, saturation = 1 } = photoSettings
    if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
    }
    ctx.drawImage(photo, drawX, drawY, drawW, drawH)
    ctx.filter = 'none'
    ctx.globalAlpha = 1.0
    ctx.restore()
  }

  // Сетка
  if (gridVisible && columns > 0 && rows > 0) {
    const tileWpx = tileW_mm * canvasScale
    const tileHpx = tileH_mm * canvasScale
    const groutPx = Math.max(1, groutW_mm * canvasScale)
    const stepX = tileWpx + groutPx
    const stepY = tileHpx + groutPx

    if (showPhoto) {
      // photo+grid: полупрозрачные линии шва поверх фото
      ctx.save()
      ctx.globalAlpha = 0.28
      ctx.fillStyle = groutColor || '#cccccc'
      for (let col = 0; col < columns; col++) {
        ctx.fillRect(col * stepX + tileWpx, 0, groutPx, H)
      }
      for (let row = 0; row < rows; row++) {
        ctx.fillRect(0, row * stepY + tileHpx, W, groutPx)
      }
      ctx.restore()
    } else {
      // grid only: плитки на фоне цвета шва
      ctx.fillStyle = '#3a3a4a'
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm)) continue
          const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
          ctx.fillRect(r.x, r.y, r.w, r.h)
        }
      }
    }
  }

  _drawMasks(ctx, masks, canvasScale)
}

// drawBoundingBox — рамка поверх фото в режиме трансформации.
// Принимает те же span-параметры, что drawWallPhoto.
export function drawBoundingBox(
  ctx, W, H, photo, settings, canvasScale,
  wallGroupOffsetX_mm = 0, groupTotalWidth_mm = null
) {
  if (!photo || !settings) return
  const wallWidthMm = W / canvasScale
  const totalW_mm = groupTotalWidth_mm != null ? groupTotalWidth_mm : wallWidthMm
  const drawW = totalW_mm * canvasScale * settings.scale
  const drawH = photo.height * (drawW / photo.width)
  const drawX = (-wallGroupOffsetX_mm + (settings.offsetX_mm ?? 0)) * canvasScale
  const drawY = H - drawH - (settings.offsetY_mm ?? 0) * canvasScale

  ctx.save()
  ctx.strokeStyle = 'rgba(129,140,248,0.92)'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(129,140,248,0.55)'
  ctx.shadowBlur = 8
  ctx.strokeRect(drawX, drawY, drawW, drawH)

  const corners = [
    [drawX, drawY],
    [drawX + drawW, drawY],
    [drawX, drawY + drawH],
    [drawX + drawW, drawY + drawH],
  ]
  for (const [cx, cy] of corners) {
    ctx.beginPath()
    ctx.arc(cx, cy, 8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.93)'
    ctx.shadowColor = 'rgba(129,140,248,0.65)'
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0
  }
  ctx.restore()
}

// drawWallMosaic — режим «Мозаика»: каждый тайл залит вычисленным цветом.
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

// drawWallPlaceholder — заглушка для стены без размеров.
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

- [ ] **Step 2: Commit**

```bash
git add src/utils/pixelizerRenderer.js
git commit -m "fix: pixelizerRenderer — spanning, floor anchor, grid overlay as lines, ctx.filter"
```

---

### Task 5: pixelizerSampler.js — spanning + floor anchor

**Проблема:** `sampleWallColors` использует `canvasW * scale` (не группу) и `offsetY * canvasScale` (не floor anchor). При вызове pixelize цвета будут самплироваться из неправильной области.

**Files:**
- Modify: `src/utils/pixelizerSampler.js`

- [ ] **Step 1: Обновить sampleWallColors**

Заменить весь файл:

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

// sampleWallColors — вычисляет цвет каждой плитки из зоны фото.
//
// wallGroupOffsetX_mm: ширина стен слева от этой в группе (mm)
// groupTotalWidth_mm: полная ширина группы (mm). null = одна стена.
export async function sampleWallColors(
  photoBlob, photoSettings, tileGrid,
  canvasW, canvasH, canvasScale,
  wallGroupOffsetX_mm = 0, groupTotalWidth_mm = null
) {
  const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks } = tileGrid
  const { offsetX_mm, offsetY_mm, scale, opacity, brightness = 1, contrast = 1, saturation = 1 } = photoSettings

  const canvas = document.createElement('canvas')
  canvas.width  = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')

  const img = await createImageBitmap(photoBlob)

  const wallWidthMm = canvasW / canvasScale
  const totalW_mm = groupTotalWidth_mm != null ? groupTotalWidth_mm : wallWidthMm
  const drawW = totalW_mm * canvasScale * scale
  const drawH = img.height * (drawW / img.width)
  const drawX = (-wallGroupOffsetX_mm + (offsetX_mm ?? 0)) * canvasScale
  const drawY = canvasH - drawH - (offsetY_mm ?? 0) * canvasScale

  ctx.globalAlpha = opacity ?? 1
  if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
    ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
  }
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.filter = 'none'
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

- [ ] **Step 2: Убедиться, что тесты averageColor не сломались**

```bash
npx vitest run src/utils/pixelizerSampler.test.js
```

Ожидаемо: PASS — тесты `averageColor` без изменений.

- [ ] **Step 3: Commit**

```bash
git add src/utils/pixelizerSampler.js
git commit -m "fix: sampleWallColors — spanning and floor anchor"
```

---

### Task 6: WallCanvas.jsx — вычисление группы, передача span-параметров

**Проблема:** `WallCanvas` вызывает `drawWallPhoto` и `drawBoundingBox` без span-параметров. Нужно вычислить смещение текущей стены в группе и суммарную ширину группы.

**Context:**
- `walls` prop — все стены из store (в порядке добавления, соответствует порядку слева-направо в панораме).
- `pixelizer.photoSettings[wall.id]?.photoId` — идентификатор фото на стене.
- Группа: все стены, у которых одинаковый `photoId`.
- `wallGroupOffsetX_mm` = сумма `length * 10` (мм) стен из группы, идущих до текущей.
- `groupTotalWidth_mm` = сумма `length * 10` всех стен группы.

**Files:**
- Modify: `src/components/pixelizer/WallCanvas.jsx`

- [ ] **Step 1: Обновить WallCanvas.jsx**

Заменить весь файл:

```jsx
// src/components/pixelizer/WallCanvas.jsx
import { useRef, useEffect } from 'react'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { drawWallPhoto, drawWallMosaic, drawWallPlaceholder, drawBoundingBox } from '../../utils/pixelizerRenderer.js'

export default function WallCanvas({
  wall, tile, corners, walls, pixelizer, canvasScale,
  renderParams,       // { useMosaic, hidePhoto, gridVisible }
  showBoundingBox,    // boolean
  isSelectable,       // boolean
  isSelected,         // boolean
  onTap,              // (wallId) => void
  photoCache,
}) {
  const canvasRef = useRef(null)
  const dims = wallCanvasDimensions(wall, canvasScale)
  const settings = pixelizer.photoSettings[wall.id] ?? null
  const tileColors = pixelizer.tileColors[wall.id] ?? {}
  const { useMosaic = false, hidePhoto = false, gridVisible = false } = renderParams ?? {}

  // Вычислить позицию стены в группе фото для spanning
  const photoGroup = settings
    ? walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === settings.photoId)
    : []
  const wallIndexInGroup = photoGroup.findIndex(w => w.id === wall.id)
  const wallGroupOffsetX_mm = photoGroup
    .slice(0, wallIndexInGroup)
    .reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)
  const groupTotalWidth_mm = photoGroup.length > 0
    ? photoGroup.reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)
    : null

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
    } : { columns: 0, rows: 0, tileW_mm: 0, tileH_mm: 0, groutW_mm: 0, groutColor: '#ccc', masks: [] }

    const photo = settings ? (photoCache.get(settings.photoId) ?? null) : null
    const ps = settings ?? { offsetX_mm: 0, offsetY_mm: 0, scale: 1, opacity: 1 }

    if (useMosaic && tileGrid.columns > 0) {
      drawWallMosaic(ctx, dims.width, dims.height, tileGrid, tileColors, canvasScale)
    } else {
      drawWallPhoto(
        ctx, dims.width, dims.height,
        photo, ps,
        tileGrid, canvasScale,
        gridVisible, hidePhoto,
        wallGroupOffsetX_mm, groupTotalWidth_mm
      )
    }

    if (showBoundingBox && photo && settings) {
      drawBoundingBox(
        ctx, dims.width, dims.height,
        photo, settings, canvasScale,
        wallGroupOffsetX_mm, groupTotalWidth_mm
      )
    }
  }, [wall, tile, corners, walls, pixelizer, canvasScale, renderParams, showBoundingBox, photoCache,
      dims.width, dims.height, wallGroupOffsetX_mm, groupTotalWidth_mm])

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        width={dims.width}
        height={dims.height}
        onClick={isSelectable ? () => onTap?.(wall.id) : undefined}
        style={{
          display: 'block',
          cursor: isSelectable ? 'pointer' : 'default',
          outline: isSelected ? '2px solid #818cf8' : 'none',
          outlineOffset: '-2px',
          borderRadius: 2,
          transition: 'outline 0.12s',
        }}
      />
      {isSelected && (
        <div style={s.selectionOverlay} />
      )}
      <div style={s.wallLabel}>{wall.name}</div>
    </div>
  )
}

const s = {
  selectionOverlay: {
    position: 'absolute', inset: 0, borderRadius: 2,
    background: 'rgba(129,140,248,0.13)',
    pointerEvents: 'none',
  },
  wallLabel: {
    position: 'absolute', bottom: -18, left: 0, right: 0,
    textAlign: 'center',
    fontSize: 10, fontWeight: 500,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    pointerEvents: 'none',
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pixelizer/WallCanvas.jsx
git commit -m "fix: WallCanvas — compute photo group offset for spanning"
```

---

### Task 7: PhotoCard.jsx — кнопка удаления

**Проблема:** В карточке фото нет кнопки удаления. Нужна кнопка с иконкой корзины рядом с кнопкой редактирования.

**Files:**
- Modify: `src/components/pixelizer/PhotoCard.jsx`

- [ ] **Step 1: Обновить PhotoCard.jsx**

Заменить весь файл:

```jsx
// src/components/pixelizer/PhotoCard.jsx
export default function PhotoCard({ group, thumbUrl, onOpacityChange, onEdit, onDelete }) {
  const { photoId, walls, settings } = group
  const opacity = settings?.opacity ?? 1.0
  const wallNames = walls.map(w => w.name).join(', ')

  return (
    <div style={s.card}>
      <div style={s.top}>
        {/* Thumbnail */}
        <div style={s.thumb}>
          {thumbUrl
            ? <img src={thumbUrl} alt="" style={s.thumbImg} />
            : <div style={s.thumbPlaceholder} />
          }
        </div>

        {/* Info */}
        <div style={s.info}>
          <div style={s.wallNames}>{wallNames}</div>
          <div style={s.opacityRow}>
            <span style={s.opacityLabel}>Прозрачность</span>
            <span style={s.opacityValue}>{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={opacity}
            onChange={e => onOpacityChange(photoId, parseFloat(e.target.value))}
            style={s.slider}
          />
        </div>

        {/* Buttons */}
        <div style={s.btns}>
          <button style={s.iconBtn} onClick={() => onEdit(photoId)} title="Редактировать">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button style={{ ...s.iconBtn, ...s.deleteBtn }} onClick={() => onDelete(photoId)} title="Удалить фото">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  card: {
    margin: '0 16px 8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '10px 12px',
  },
  top: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  thumb: {
    width: 48, height: 36,
    borderRadius: 6,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbPlaceholder: { width: '100%', height: '100%', background: '#2a2a3a' },
  info: { flex: 1, minWidth: 0 },
  wallNames: { fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  opacityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  opacityLabel: { fontSize: 11, color: '#475569' },
  opacityValue:  { fontSize: 11, color: '#64748b', fontVariantNumeric: 'tabular-nums' },
  slider: { width: '100%', accentColor: '#818cf8', cursor: 'pointer' },
  btns: { display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignSelf: 'center' },
  iconBtn: {
    width: 32, height: 32,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    color: 'rgba(248,113,113,0.7)',
    border: '1px solid rgba(248,113,113,0.15)',
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pixelizer/PhotoCard.jsx
git commit -m "feat: add delete button to PhotoCard"
```

---

### Task 8: ControlsPane.jsx — проброс onDelete + ползунки коррекции

**Проблема 1:** `onDelete` из PixelizerTab не прокидывается в PhotoCard.

**Проблема 2:** TransformPane не имеет ползунков яркости/контраста/насыщенности.

**Files:**
- Modify: `src/components/pixelizer/ControlsPane.jsx`

- [ ] **Step 1: Обновить ControlsPane.jsx**

Заменить весь файл:

```jsx
// src/components/pixelizer/ControlsPane.jsx
import PhotoCard from './PhotoCard.jsx'
import ViewModeControl from './ViewModeControl.jsx'

export default function ControlsPane({
  uiMode, pixelizerMode, hasPhotos, photoGroups, thumbCache,
  eyeMode, onEyeMode, onAddPhoto, onOpacityChange, onEditPhoto, onDeletePhoto,
  pixelizer, walls, onPhotoSettingsChange, activePhotoId,
}) {
  if (uiMode === 'transform') {
    return <TransformPane
      activePhotoId={activePhotoId}
      pixelizer={pixelizer}
      walls={walls}
      onPhotoSettingsChange={onPhotoSettingsChange}
    />
  }

  if (!hasPhotos) {
    return <EmptyPhotos onAddPhoto={onAddPhoto} />
  }

  const isMosaic = pixelizerMode === 'mosaic'

  return (
    <div style={s.root}>
      {/* Section: photos */}
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>Фото</span>
        <button style={s.addBtn} onClick={onAddPhoto}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {photoGroups.map(group => (
        <PhotoCard
          key={group.photoId}
          group={group}
          thumbUrl={thumbCache.get(group.photoId)}
          onOpacityChange={onOpacityChange}
          onEdit={onEditPhoto}
          onDelete={onDeletePhoto}
        />
      ))}

      {/* Section: view mode */}
      {(hasPhotos || isMosaic) && (
        <>
          <div style={{ ...s.sectionHeader, marginTop: 6 }}>
            <span style={s.sectionTitle}>Вид</span>
          </div>
          <ViewModeControl
            eyeMode={eyeMode}
            onChange={onEyeMode}
            isMosaic={isMosaic}
          />
        </>
      )}
    </div>
  )
}

function EmptyPhotos({ onAddPhoto }) {
  return (
    <div style={s.empty}>
      <svg width="64" height="48" viewBox="0 0 64 48" fill="none" style={{ marginBottom: 14, opacity: 0.3 }}>
        <rect x="2" y="6" width="18" height="40" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <rect x="24" y="14" width="16" height="32" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <rect x="44" y="2" width="18" height="44" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <line x1="2" y1="46" x2="62" y2="46" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 3"/>
      </svg>
      <p style={s.emptyTitle}>Нет фотографий</p>
      <p style={s.emptyHint}>Наложите фото на развёртку и пикселизируйте</p>
      <button style={s.emptyBtn} onClick={onAddPhoto}>
        + Добавить фото
      </button>
    </div>
  )
}

function TransformPane({ activePhotoId, pixelizer, walls, onPhotoSettingsChange }) {
  const activeWalls = walls.filter(
    w => pixelizer.photoSettings[w.id]?.photoId === activePhotoId
  )
  const firstWall = activeWalls[0]
  const ps = firstWall ? pixelizer.photoSettings[firstWall.id] : null

  if (!ps) return <div style={s.transformEmpty}>Выберите фото</div>

  function update(field, value) {
    activeWalls.forEach(w => {
      const settings = pixelizer.photoSettings[w.id]
      if (settings) onPhotoSettingsChange(w.id, { ...settings, [field]: value })
    })
  }

  return (
    <div style={s.root}>
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>Позиционирование</span>
      </div>

      <div style={s.transformGrid}>
        <Field label="Сдвиг X (мм)" value={ps.offsetX_mm} step={10}
          onChange={v => update('offsetX_mm', v)} />
        <Field label="Сдвиг Y (мм)" value={ps.offsetY_mm} step={10}
          onChange={v => update('offsetY_mm', v)} />
        <Field label="Масштаб" value={ps.scale} step={0.05} min={0.1} max={10} decimals={2}
          onChange={v => update('scale', v)} />
        <div style={s.fieldGroup}>
          <label style={s.fieldLabel}>Прозрачность</label>
          <input
            type="range" min="0" max="1" step="0.05"
            value={ps.opacity}
            onChange={e => update('opacity', parseFloat(e.target.value))}
            style={s.rangeInput}
          />
          <span style={s.fieldValue}>{Math.round(ps.opacity * 100)}%</span>
        </div>
      </div>

      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>Коррекция</span>
      </div>

      <div style={s.correctionGrid}>
        <RangeField
          label="Яркость"
          value={ps.brightness ?? 1}
          min={0.5} max={2} step={0.05}
          display={v => `${Math.round(v * 100)}%`}
          onChange={v => update('brightness', v)}
        />
        <RangeField
          label="Контраст"
          value={ps.contrast ?? 1}
          min={0.5} max={2} step={0.05}
          display={v => `${Math.round(v * 100)}%`}
          onChange={v => update('contrast', v)}
        />
        <RangeField
          label="Насыщенность"
          value={ps.saturation ?? 1}
          min={0} max={3} step={0.05}
          display={v => `${Math.round(v * 100)}%`}
          onChange={v => update('saturation', v)}
        />
      </div>

      <p style={s.gestureHint}>
        Жест 1 пальца — двигать фото · пинч — масштабировать
      </p>
    </div>
  )
}

function Field({ label, value, step, min, max, decimals = 0, onChange }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.fieldLabel}>{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
        onChange={e => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        style={s.numInput}
      />
    </div>
  )
}

function RangeField({ label, value, min, max, step, display, onChange }) {
  return (
    <div style={s.fieldGroup}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={s.fieldLabel}>{label}</label>
        <span style={s.fieldValue}>{display(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={s.rangeInput}
      />
    </div>
  )
}

const s = {
  root: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 6, paddingBottom: 8 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px 6px',
  },
  sectionTitle: { fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' },
  addBtn: {
    width: 28, height: 28,
    background: 'rgba(129,140,248,0.15)',
    border: '1px solid rgba(129,140,248,0.30)',
    borderRadius: 7,
    color: '#818cf8',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  empty: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px 32px',
    textAlign: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
  emptyHint: { fontSize: 13, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, marginBottom: 20, maxWidth: 220 },
  emptyBtn: {
    padding: '10px 24px',
    background: 'rgba(129,140,248,0.12)',
    border: '1px solid rgba(129,140,248,0.30)',
    borderRadius: 12,
    color: '#818cf8',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  transformGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 12px' },
  correctionGrid: { display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px 12px' },
  transformEmpty: { padding: 24, color: '#475569', fontSize: 14, textAlign: 'center' },
  fieldGroup: { display: 'flex', flexDirection: 'column' },
  fieldLabel: { fontSize: 11, color: '#475569', marginBottom: 4 },
  fieldValue: { fontSize: 11, color: '#64748b', marginTop: 2 },
  numInput: {
    padding: '8px 10px',
    background: 'rgba(0,0,0,0.30)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    color: '#f1f5f9',
    fontSize: 13,
    outline: 'none',
  },
  rangeInput: { width: '100%', accentColor: '#818cf8', marginTop: 6, cursor: 'pointer' },
  gestureHint: { fontSize: 11, color: '#334155', textAlign: 'center', padding: '0 16px', lineHeight: 1.5 },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pixelizer/ControlsPane.jsx
git commit -m "feat: ControlsPane — delete photo pass-through, brightness/contrast/saturation sliders"
```

---

### Task 9: PixelizerTab.jsx — склейка: удаление, коррекция, span-параметры в pixelize

**Что делается:**
1. Добавить `handleDeletePhoto(photoId)` — очищает photoSettings для всех стен с этим фото, удаляет blob из IndexedDB, выходит из режима transform если нужно.
2. Передать `onDeletePhoto={handleDeletePhoto}` в ControlsPane.
3. В `handlePhotoFile` добавить `brightness: 1.0, contrast: 1.0, saturation: 1.0` к photoSettings.
4. В `handlePixelize` вычислить span-параметры для каждой стены и передать в `sampleWallColors`.

**Files:**
- Modify: `src/components/pixelizer/PixelizerTab.jsx`

- [ ] **Step 1: Добавить импорт deletePhoto**

В начале файла найти строку:
```js
import { loadPhoto, savePhoto } from '../../store/persistence.js'
```
Заменить на:
```js
import { loadPhoto, savePhoto, deletePhoto } from '../../store/persistence.js'
```

- [ ] **Step 2: Добавить handleDeletePhoto после handleTransformDelete**

Найти функцию `handleTransformDelete` (примерно строки 190-200). После неё добавить:

```js
// Удаление фото: очистить photoSettings для всех стен + удалить blob
async function handleDeletePhoto(photoId) {
  walls.forEach(w => {
    if (pixelizer.photoSettings[w.id]?.photoId === photoId) {
      setPhotoSettings(w.id, null)
    }
  })
  if (activePhotoId === photoId) {
    setActivePhotoId(null)
    setUiMode('navigate')
  }
  await deletePhoto(photoId)
}
```

- [ ] **Step 3: Добавить defaults коррекции в handlePhotoFile**

Найти в `handlePhotoFile` строку:
```js
setPhotoSettings(wall.id, {
  photoId,
  offsetX_mm: 0,
  offsetY_mm: 0,
  scale:      1.0,
  opacity:    0.85,
})
```

Заменить на:
```js
setPhotoSettings(wall.id, {
  photoId,
  offsetX_mm:  0,
  offsetY_mm:  0,
  scale:       1.0,
  opacity:     0.85,
  brightness:  1.0,
  contrast:    1.0,
  saturation:  1.0,
})
```

- [ ] **Step 4: Исправить handlePixelize — добавить span-параметры**

Найти цикл `for (const wall of targets)` в `handlePixelize`. Найти строку вызова `sampleWallColors`:
```js
const colors = await sampleWallColors(blob, ps, tileGrid, dims.width, dims.height, canvasScale)
```

Заменить на блок с вычислением span-параметров:

```js
const photoGroup = walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === ps.photoId)
const wallIndexInGroup = photoGroup.findIndex(w => w.id === wall.id)
const wallGroupOffsetX_mm = photoGroup
  .slice(0, wallIndexInGroup)
  .reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)
const groupTotalWidth_mm = photoGroup
  .reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)

const colors = await sampleWallColors(blob, ps, tileGrid, dims.width, dims.height, canvasScale, wallGroupOffsetX_mm, groupTotalWidth_mm)
```

- [ ] **Step 5: Передать onDeletePhoto в ControlsPane**

Найти JSX блок `<ControlsPane` (внутри `{uiMode !== 'addPhoto' && (...)}`) и добавить проп `onDeletePhoto={handleDeletePhoto}`:

```jsx
<ControlsPane
  uiMode={uiMode}
  pixelizerMode={pixelizer.mode}
  hasPhotos={hasPhotos}
  photoGroups={photoGroups}
  thumbCache={thumbCache}
  eyeMode={eyeMode}
  onEyeMode={setEyeMode}
  onAddPhoto={handleAddPhoto}
  onOpacityChange={handleOpacity}
  onEditPhoto={handleEditPhoto}
  onDeletePhoto={handleDeletePhoto}
  pixelizer={pixelizer}
  walls={walls}
  onPhotoSettingsChange={setPhotoSettings}
  activePhotoId={activePhotoId}
/>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/pixelizer/PixelizerTab.jsx
git commit -m "feat: PixelizerTab — delete photo, correction defaults, span params in pixelize"
```

---

## Финальный чеклист

После завершения всех задач убедиться:

- [ ] `npx vitest run` — все тесты проходят
- [ ] `npm run build` — нет ошибок TypeScript/lint
- [ ] В панораме: фото одно на несколько стен (не дублируется)
- [ ] В панораме: нижний край фото совпадает с полом
- [ ] Кнопка «Фото + сетка»: фото видно, поверх — полупрозрачные линии шва
- [ ] Кнопка «Только сетка»: плитки без фото
- [ ] В TransformPane: ползунки яркость/контраст/насыщенность меняют вид фото
- [ ] PhotoCard: кнопка корзины удаляет фото и возвращает в navigate
- [ ] WallSelectSheet: при многих стенах кнопки «Все стены» / «Выбрать файл» всегда видны
- [ ] SummarySection footer: столбцы и ряды показывают max по всем стенам
