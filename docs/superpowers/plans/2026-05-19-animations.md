# Animations + Deferred 1.5 Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CSS animations throughout the app (card enter/exit, tab fade-in, sheet slide, button feedback, toast) and implement all deferred session-1.5 UI tasks (SavedToast, EmptyState, tease cards for stub tabs, RoomTab flow strip).

**Architecture:** All keyframes and utility classes live in a single `src/animations.css` imported in `main.jsx`. Exit animations use a local `leaving` state + setTimeout pattern to keep the element in DOM until the animation finishes, then call the store action. `prefers-reduced-motion` is handled via one block at the end of `animations.css`.

**Tech Stack:** React 18, CSS keyframes/transitions, Zustand subscribe (for SavedToast), Lucide React (already installed)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/animations.css` | All `@keyframes` + utility classes + prefers-reduced-motion |
| Modify | `src/main.jsx` | Import `animations.css` |
| Modify | `src/App.css` | Add tab fade-in keyframe + `[data-visible]` selector |
| Modify | `src/App.jsx` | Switch panels to `data-visible`, add SavedToast, stub tab label colour |
| Create | `src/components/shared/SavedToast.jsx` | Autosave indicator pill |
| Create | `src/components/shared/EmptyState.jsx` | Shared empty-state component |
| Modify | `src/components/room/WallCard.jsx` | `leaving` state for exit anim, delete-btn flash |
| Modify | `src/components/room/MaskCard.jsx` | `leaving` state for exit anim |
| Modify | `src/components/room/RoomTab.jsx` | Flow strip + improved empty hint |
| Modify | `src/components/pixelizer/WallSelectSheet.jsx` | Sheet exit animation |
| Modify | `src/components/pixelizer/WallsSheet.jsx` | Sheet exit animation |
| Modify | `src/components/pixelizer/ActionBar.jsx` | Pixelize loading spinner, tap feedback |
| Modify | `src/components/viewer/ViewerTab.jsx` | Use EmptyState component |
| Modify | `src/components/export/ExportTab.jsx` | Tease card |
| Modify | `src/components/layout/LayoutTab.jsx` | Tease card |

---

## Task 1: Create `src/animations.css` with all keyframes

**Files:**
- Create: `src/animations.css`
- Modify: `src/main.jsx`

- [ ] **Step 1: Create `src/animations.css`**

```css
/* ─────────────────────────────────────────────
   animations.css — all app-wide CSS animations
   ───────────────────────────────────────────── */

/* Card enter (WallCard, MaskCard) */
@keyframes cardSlideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Card exit (WallCard, MaskCard) */
@keyframes cardSlideUp {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}

/* Sheet enter */
@keyframes sheetEnter {
  from { transform: translateY(100%); opacity: 0.6; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* Sheet exit */
@keyframes sheetExit {
  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(100%); opacity: 0.6; }
}

/* Button tap scale */
@keyframes btnTap {
  0%   { transform: scale(1); }
  50%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}

/* Delete button flash */
@keyframes deleteFlash {
  0%   { background: transparent; }
  40%  { background: rgba(239, 68, 68, 0.2); }
  100% { background: transparent; }
}

/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* SavedToast fade */
@keyframes savedFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Utility classes ── */

.anim-card-enter {
  animation: cardSlideDown 220ms ease-out both;
}

.anim-card-exit {
  animation: cardSlideUp 180ms ease-in both;
}

.anim-sheet-enter {
  animation: sheetEnter 250ms ease-out both;
}

.anim-sheet-exit {
  animation: sheetExit 200ms ease-in both;
}

.anim-btn-tap {
  animation: btnTap 120ms ease-out both;
}

.anim-delete-flash {
  animation: deleteFlash 150ms ease-out both;
}

.anim-saved-in {
  animation: savedFadeIn 200ms ease-out both;
}

/* Loading spinner via pseudo-element */
.btn-pixelize-loading {
  position: relative;
  color: transparent !important;
  pointer-events: none;
}
.btn-pixelize-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid rgba(129, 140, 248, 0.3);
  border-top-color: #818cf8;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

/* ─────────────────────────────────────────────
   prefers-reduced-motion — disable all
   ───────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Import in `src/main.jsx`** — add after existing imports:

```js
import './animations.css'
```

Full updated `src/main.jsx`:
```js
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import './animations.css'
import { initDB, loadAll, saveAll } from './store/persistence.js'
import { useProjectStore } from './store/projectStore.js'

async function bootstrap() {
  await initDB()
  await loadAll()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  useProjectStore.subscribe(() => saveAll())
}

bootstrap()
```

- [ ] **Step 3: Verify the app starts without errors**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```
Expected: no errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/animations.css src/main.jsx
git commit -m "feat(anim): add animations.css with all keyframes"
```

---

## Task 2: Tab fade-in (App.jsx + App.css)

**Files:**
- Modify: `src/App.css`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add tab fade-in keyframe + selector to `src/App.css`**

Add after the existing `.tab-panel` rule:

```css
@keyframes tabFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.tab-panel[data-visible="false"] {
  display: none;
}

.tab-panel[data-visible="true"] {
  display: block;
  animation: tabFadeIn 150ms ease-out both;
}
```

- [ ] **Step 2: Update `src/App.jsx` panels — replace `style` with `data-visible`**

Replace the entire `<div className="tab-content">` block:

```jsx
<div className="tab-content">
  <div className="tab-panel" data-visible={activeTab === 'room' ? 'true' : 'false'}>
    <RoomTab />
  </div>
  <div className="tab-panel" data-visible={activeTab === 'pixelizer' ? 'true' : 'false'}>
    <PixelizerTab />
  </div>
  <div className="tab-panel" data-visible={activeTab === 'viewer' ? 'true' : 'false'}>
    <ViewerTab />
  </div>
  <div className="tab-panel" data-visible={activeTab === 'export' ? 'true' : 'false'}>
    <ExportTab />
  </div>
  <div className="tab-panel" data-visible={activeTab === 'layout' ? 'true' : 'false'}>
    <LayoutTab />
  </div>
</div>
```

- [ ] **Step 3: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.css src/App.jsx
git commit -m "feat(anim): tab fade-in on enter, instant exit"
```

---

## Task 3: WallCard — enter + exit animations

**Files:**
- Modify: `src/components/room/WallCard.jsx`

- [ ] **Step 1: Add `leaving` state and update delete flow**

Find the `useState` declarations at the top of `WallCard`:
```js
const [deleteConfirm, setDeleteConfirm] = useState(false)
```
Add `leaving` right after it:
```js
const [leaving, setLeaving] = useState(false)
```

- [ ] **Step 2: Change the «Да» button handler to animate before removing**

Find:
```jsx
<button style={s.confirmYes} onClick={() => removeWall(wall.id)}>Да</button>
```
Replace with:
```jsx
<button style={s.confirmYes} onClick={() => {
  setLeaving(true)
  setTimeout(() => removeWall(wall.id), 190)
}}>Да</button>
```

- [ ] **Step 3: Apply animation classes to the card root div**

Find:
```jsx
<div style={{ ...s.card, borderColor }}>
```
Replace with:
```jsx
<div
  style={{ ...s.card, borderColor }}
  className={leaving ? 'anim-card-exit' : 'anim-card-enter'}
>
```

- [ ] **Step 4: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/components/room/WallCard.jsx
git commit -m "feat(anim): WallCard slide-in on mount, slide-out before delete"
```

---

## Task 4: MaskCard — enter + exit animations

**Files:**
- Modify: `src/components/room/MaskCard.jsx`

- [ ] **Step 1: Add `useState` import and `leaving` state**

Replace the import line:
```js
import { useProjectStore } from '../../store/projectStore.js'
```
With:
```js
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
```

Add inside the component function, after destructuring:
```js
const [leaving, setLeaving] = useState(false)
```

- [ ] **Step 2: Change delete button to animate before removing**

Find:
```jsx
<button style={s.delBtn} onClick={() => removeMask(wallId, mask.id)}>
  Удалить
</button>
```
Replace with:
```jsx
<button style={s.delBtn} onClick={() => {
  setLeaving(true)
  setTimeout(() => removeMask(wallId, mask.id), 190)
}}>
  Удалить
</button>
```

- [ ] **Step 3: Apply animation classes to the card root**

Find:
```jsx
<div style={s.card}>
```
Replace with:
```jsx
<div style={s.card} className={leaving ? 'anim-card-exit' : 'anim-card-enter'}>
```

- [ ] **Step 4: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/components/room/MaskCard.jsx
git commit -m "feat(anim): MaskCard slide-in on mount, slide-out before delete"
```

---

## Task 5: Bottom sheets — exit animation

**Files:**
- Modify: `src/components/pixelizer/WallSelectSheet.jsx`
- Modify: `src/components/pixelizer/WallsSheet.jsx`

### WallSelectSheet

- [ ] **Step 1: Add `useState` to imports and `leaving` state**

Add `useState` to the existing import:
```js
import { useRef, useState } from 'react'
```

Add inside the component, before `return`:
```js
const [leaving, setLeaving] = useState(false)
```

- [ ] **Step 2: Wrap `onCancel` calls with animated close**

Add a helper function after `leaving` declaration:
```js
function handleClose() {
  setLeaving(true)
  setTimeout(onCancel, 200)
}
```

- [ ] **Step 3: Replace all `onCancel` call sites with `handleClose`**

There is one in the close button:
```jsx
<button style={s.closeBtn} onClick={onCancel}>
```
Replace with:
```jsx
<button style={s.closeBtn} onClick={handleClose}>
```

- [ ] **Step 4: Apply animation class to the sheet div**

Find:
```jsx
<div style={s.sheet} className="sheet-up">
```
Replace with:
```jsx
<div style={s.sheet} className={leaving ? 'anim-sheet-exit' : 'anim-sheet-enter'}>
```

### WallsSheet

- [ ] **Step 5: Add `useState` import and `leaving` state to WallsSheet**

Replace:
```js
import { useProjectStore } from '../../store/projectStore.js'
```
With:
```js
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
```

Add inside the component, before `return`:
```js
const [leaving, setLeaving] = useState(false)

function handleClose() {
  setLeaving(true)
  setTimeout(onClose, 200)
}
```

- [ ] **Step 6: Replace `onClose` on the overlay click and inner sheet**

Find:
```jsx
<div style={s.overlay} onClick={onClose}>
```
Replace with:
```jsx
<div style={s.overlay} onClick={handleClose}>
```

Find:
```jsx
<div style={s.sheet} onClick={e => e.stopPropagation()} className="sheet-up">
```
Replace with:
```jsx
<div style={s.sheet} onClick={e => e.stopPropagation()} className={leaving ? 'anim-sheet-exit' : 'anim-sheet-enter'}>
```

- [ ] **Step 7: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
git add src/components/pixelizer/WallSelectSheet.jsx src/components/pixelizer/WallsSheet.jsx
git commit -m "feat(anim): bottom sheets slide-up enter, slide-down exit"
```

---

## Task 6: ActionBar — pixelize loading spinner + delete tap feedback

**Files:**
- Modify: `src/components/pixelizer/ActionBar.jsx`

- [ ] **Step 1: Add `btn-pixelize-loading` class when sampling**

Find:
```jsx
<button
  style={s.primary}
  className={isStale ? 'btn-stale' : ''}
  onClick={handlePixelizeClick}
  disabled={sampling}
>
  {pixelizeLabel}
</button>
```
Replace with:
```jsx
<button
  style={s.primary}
  className={sampling ? 'btn-pixelize-loading' : (isStale ? 'btn-stale' : '')}
  onClick={handlePixelizeClick}
  disabled={sampling}
>
  {sampling ? 'Обрабатываю…' : (isStale ? '⟳ Обновить' : 'Пикселизировать →')}
</button>
```

- [ ] **Step 2: Add tap feedback to the Danger (delete) button**

Add `useState` import at the top of the file:
```js
import { useState } from 'react'
```

Add state inside the component (before `return`):
```js
const [deleteTap, setDeleteTap] = useState(false)

function handleDeleteTap() {
  setDeleteTap(true)
  setTimeout(() => setDeleteTap(false), 160)
  onDelete()
}
```

Find the danger button (in `uiMode === 'transform'` branch):
```jsx
<button style={s.danger} onClick={onDelete}>Удалить</button>
```
Replace with:
```jsx
<button
  style={s.danger}
  className={deleteTap ? 'anim-delete-flash' : ''}
  onPointerDown={() => { setDeleteTap(true); setTimeout(() => setDeleteTap(false), 160) }}
  onClick={onDelete}
>Удалить</button>
```

- [ ] **Step 3: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/components/pixelizer/ActionBar.jsx
git commit -m "feat(anim): pixelize loading spinner, delete tap flash"
```

---

## Task 7: Create `SavedToast` component

**Files:**
- Create: `src/components/shared/SavedToast.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/shared/SavedToast.jsx`**

```jsx
// src/components/shared/SavedToast.jsx
import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'

export default function SavedToast() {
  const activeTab = useProjectStore((s) => s.activeTab)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const hideTimer = useRef(null)
  const debounceTimer = useRef(null)

  const showOnTabs = ['room', 'pixelizer', 'viewer']

  useEffect(() => {
    const unsub = useProjectStore.subscribe((state, prev) => {
      if (state.activeTab !== prev.activeTab) return
      if (!showOnTabs.includes(state.activeTab)) return

      clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        setFading(false)
        setVisible(true)
        clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => {
          setFading(true)
          setTimeout(() => setVisible(false), 210)
        }, 2000)
      }, 1500)
    })
    return () => {
      unsub()
      clearTimeout(debounceTimer.current)
      clearTimeout(hideTimer.current)
    }
  }, [])

  if (!visible || !showOnTabs.includes(activeTab)) return null

  return (
    <div
      className={fading ? undefined : 'anim-saved-in'}
      style={{
        ...s.pill,
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 200ms ease-in' : undefined,
      }}
    >
      ✓ Сохранено
    </div>
  )
}

const s = {
  pill: {
    position: 'fixed',
    bottom: 'calc(57px + env(safe-area-inset-bottom, 0px) + 8px)',
    right: 16,
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#22c55e',
    fontSize: 11,
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: 20,
    zIndex: 500,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
}
```

- [ ] **Step 2: Mount `SavedToast` in `App.jsx`**

Add import after existing imports:
```js
import SavedToast from './components/shared/SavedToast.jsx'
```

Add `<SavedToast />` right before `<nav className="bottom-nav">`:
```jsx
      <SavedToast />
      <nav className="bottom-nav">
```

- [ ] **Step 3: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/SavedToast.jsx src/App.jsx
git commit -m "feat: SavedToast — autosave indicator pill above navbar"
```

---

## Task 8: Create `EmptyState` component and apply to ViewerTab + PixelizerTab

**Files:**
- Create: `src/components/shared/EmptyState.jsx`
- Modify: `src/components/viewer/ViewerTab.jsx`
- Modify: `src/components/pixelizer/PixelizerTab.jsx`

- [ ] **Step 1: Create `src/components/shared/EmptyState.jsx`**

```jsx
// src/components/shared/EmptyState.jsx
export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div style={s.root}>
      <div style={s.icon}>{icon}</div>
      <p style={s.title}>{title}</p>
      {subtitle && <p style={s.subtitle}>{subtitle}</p>}
      {actionLabel && onAction && (
        <button style={s.btn} onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}

const s = {
  root: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 32, textAlign: 'center',
  },
  icon:     { marginBottom: 4 },
  title:    { fontSize: 15, color: '#94a3b8', margin: 0 },
  subtitle: { fontSize: 12, color: '#64748b', margin: 0, maxWidth: 240, lineHeight: 1.5 },
  btn: {
    marginTop: 8, height: 40, padding: '0 20px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, color: '#f1f5f9', fontSize: 14, cursor: 'pointer',
  },
}
```

- [ ] **Step 2: Apply EmptyState to `ViewerTab.jsx`**

Add import near the top:
```js
import EmptyState from '../shared/EmptyState.jsx'
```

Replace the existing empty-state block (the entire `if (activeWalls.length === 0)` return):
```jsx
  if (activeWalls.length === 0) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: '#08080f' }}>
        <EmptyState
          icon={<Box size={32} color="#818cf8" style={{ opacity: 0.5 }} />}
          title="Нет стен для 3D-просмотра"
          subtitle="Заполните длину и высоту хотя бы одной стены"
          actionLabel="→ Перейти в Комнату"
          onAction={() => setActiveTab('room')}
        />
      </div>
    )
  }
```

Remove the now-unused `s.empty`, `s.emptyTitle`, `s.emptySubtitle`, `s.emptyBtn` from the `s` object at the bottom of the file.

- [ ] **Step 3: Apply EmptyState to `PixelizerTab.jsx`**

Add import (near other shared imports, after existing component imports):
```js
import EmptyState from '../shared/EmptyState.jsx'
```

Also add Camera icon import (already imported in App.jsx but not PixelizerTab):
```js
import { Camera } from 'lucide-react'
```

Find the existing empty-state block in PixelizerTab. It currently looks like:
```jsx
<div style={s.emptyRoot}>
  ...
  <p style={s.emptyTitle}>Нет стен</p>
  <p style={s.emptyHint}>...</p>
  <button style={s.emptyBtn} ...>→ Комната</button>
  ...
</div>
```

Replace it with:
```jsx
<div style={{ position: 'relative', flex: 1 }}>
  <EmptyState
    icon={<Camera size={32} color="#818cf8" style={{ opacity: 0.5 }} />}
    title="Сначала добавь стены"
    subtitle="Фото накладывается только когда есть стена с размерами"
    actionLabel="→ Перейти в Комнату"
    onAction={() => setActiveTab('room')}
  />
</div>
```

Remove now-unused styles `emptyRoot`, `emptyTitle`, `emptyHint`, `emptyBtn` from `s` in PixelizerTab.

- [ ] **Step 4: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/EmptyState.jsx src/components/viewer/ViewerTab.jsx src/components/pixelizer/PixelizerTab.jsx
git commit -m "feat: EmptyState component, apply to ViewerTab + PixelizerTab"
```

---

## Task 9: ExportTab — tease card

**Files:**
- Modify: `src/components/export/ExportTab.jsx`

- [ ] **Step 1: Replace ExportTab content with tease card**

```jsx
// src/components/export/ExportTab.jsx
import { PenLine } from 'lucide-react'

export default function ExportTab() {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <PenLine size={36} color="#818cf8" style={{ opacity: 0.4, marginBottom: 12 }} />
        <p style={s.title}>Схема укладки</p>
        <span style={s.badge}>В разработке</span>

        {/* Wireframe tile grid 5×4 */}
        <div style={s.wireframe}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ ...s.tile, ...(i === 7 ? s.tileAccent : {}) }} />
          ))}
        </div>

        <ul style={s.features}>
          <li>Экспорт схемы для мастера</li>
          <li>Разметка с порезами</li>
          <li>PDF + PNG</li>
        </ul>
      </div>
    </div>
  )
}

const s = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', padding: 24, background: '#08080f',
  },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, maxWidth: 280, width: '100%', textAlign: 'center',
  },
  title:   { fontSize: 18, fontWeight: 600, color: '#f1f5f9', margin: 0 },
  badge: {
    display: 'inline-block',
    background: 'rgba(124, 58, 237, 0.15)',
    color: '#a78bfa',
    fontSize: 11, fontWeight: 500,
    padding: '3px 10px', borderRadius: 20,
    border: '1px solid rgba(124,58,237,0.25)',
  },
  wireframe: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 3, width: '100%', marginTop: 8,
    background: '#0e1018',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: 8,
  },
  tile: {
    aspectRatio: '1',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 2,
  },
  tileAccent: {
    background: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124,58,237,0.35)',
  },
  features: {
    listStyle: 'none', padding: 0, margin: '4px 0 0',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
}
```

- [ ] **Step 2: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/components/export/ExportTab.jsx
git commit -m "feat: ExportTab tease card with wireframe preview"
```

---

## Task 10: LayoutTab — tease card

**Files:**
- Modify: `src/components/layout/LayoutTab.jsx`

- [ ] **Step 1: Replace LayoutTab content with tease card**

```jsx
// src/components/layout/LayoutTab.jsx
import { Grid3x3 } from 'lucide-react'

export default function LayoutTab() {
  const rows = [
    { label: 'Стена 1',       value: '48 шт' },
    { label: 'Стена 2',       value: '32 шт' },
    { label: 'Итого +10%',    value: '88 шт' },
  ]

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Grid3x3 size={36} color="#818cf8" style={{ opacity: 0.4, marginBottom: 12 }} />
        <p style={s.title}>План покупки</p>
        <span style={s.badge}>В разработке</span>

        {/* Wireframe mini table */}
        <div style={s.wireframe}>
          {rows.map((row) => (
            <div key={row.label} style={s.row}>
              <span style={s.rowLabel}>{row.label}</span>
              <span style={s.rowValue}>{row.value}</span>
            </div>
          ))}
        </div>

        <ul style={s.features}>
          <li>Подсчёт плитки по стенам</li>
          <li>Запас на бой (+10%)</li>
          <li>Список для магазина</li>
        </ul>
      </div>
    </div>
  )
}

const s = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', padding: 24, background: '#08080f',
  },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, maxWidth: 280, width: '100%', textAlign: 'center',
  },
  title:  { fontSize: 18, fontWeight: 600, color: '#f1f5f9', margin: 0 },
  badge: {
    display: 'inline-block',
    background: 'rgba(124, 58, 237, 0.15)',
    color: '#a78bfa',
    fontSize: 11, fontWeight: 500,
    padding: '3px 10px', borderRadius: 20,
    border: '1px solid rgba(124,58,237,0.25)',
  },
  wireframe: {
    width: '100%', marginTop: 8,
    background: '#0e1018',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: 8,
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  row: {
    display: 'flex', justifyContent: 'space-between',
    padding: '7px 4px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  rowLabel: { fontSize: 12, color: '#64748b' },
  rowValue: { fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  features: {
    listStyle: 'none', padding: 0, margin: '4px 0 0',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
}
```

- [ ] **Step 2: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/LayoutTab.jsx
git commit -m "feat: LayoutTab tease card with wireframe preview"
```

---

## Task 11: RoomTab — flow strip + improved empty hint

**Files:**
- Modify: `src/components/room/RoomTab.jsx`

- [ ] **Step 1: Replace RoomTab with updated version**

```jsx
// src/components/room/RoomTab.jsx
import { useMemo } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import TileForm from './TileForm.jsx'
import WallCard from './WallCard.jsx'
import CornersSection from './CornersSection.jsx'
import SummarySection from './SummarySection.jsx'

const FLOW_STEPS = ['Комната', 'Фото', '3D', 'Схема', 'Укладка']

export default function RoomTab() {
  const { tile, walls, corners } = useProjectStore()

  const results = useMemo(
    () => calculateGrid(tile, walls, corners),
    [tile, walls, corners]
  )

  return (
    <div style={s.page}>
      {walls.length === 0 && (
        <div style={s.flowStrip}>
          {FLOW_STEPS.map((step, i) => (
            <span key={step}>
              <span style={i === 0 ? s.flowActive : s.flowDim}>{step}</span>
              {i < FLOW_STEPS.length - 1 && <span style={s.flowArrow}> → </span>}
            </span>
          ))}
        </div>
      )}
      <TileForm />
      {walls.length === 0 && (
        <div style={s.emptyHint}>
          <LayoutGrid size={28} color="#818cf8" style={{ opacity: 0.3 }} />
          <p style={s.emptyTitle}>Стен пока нет</p>
          <p style={s.emptySubtitle}>Нажмите «Добавить стену» ниже</p>
        </div>
      )}
      {walls.map((wall, i) => (
        <WallCard key={wall.id} wall={wall} result={results[i] ?? null} />
      ))}
      <CornersSection />
      <SummarySection results={results} />
      <div style={{ height: 40 }} />
    </div>
  )
}

const s = {
  page:          { overflowY: 'auto', height: '100%', background: '#08080f', color: '#f1f5f9' },
  flowStrip: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', gap: 0,
    padding: '10px 16px 6px',
    fontSize: 10,
  },
  flowActive:  { color: '#a78bfa', fontWeight: 600 },
  flowDim:     { color: '#334155' },
  flowArrow:   { color: '#334155' },
  emptyHint: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 6,
    padding: '28px 20px 8px',
    textAlign: 'center',
  },
  emptyTitle:    { fontSize: 15, color: '#94a3b8', margin: 0 },
  emptySubtitle: { fontSize: 13, color: '#64748b', margin: 0 },
}
```

- [ ] **Step 2: Verify build**

```bash
cd /home/victor/projects/drape && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/components/room/RoomTab.jsx
git commit -m "feat(room): flow strip + improved empty hint when no walls"
```

---

## Task 12: Record session results in `docs/sessions/state.md`

**Files:**
- Modify: `docs/sessions/state.md`

- [ ] **Step 1: Append session 2.4 results**

Replace the placeholder block:
```
## Сессия 2.4 — [ОЖИДАЕТ ВЫПОЛНЕНИЯ]

*Результаты будут записаны сюда после завершения сессии.*
```

With:
```markdown
## Сессия 2.4 — Анимации ✅

### Библиотека
CSS transitions + @keyframes (без зависимостей). Framer Motion не нужен — все анимации простые (fade, slide, scale).

### Реализованные анимации
- WallCard: slide-down при mount, slide-up перед удалением (leaving state + setTimeout)
- MaskCard: то же самое
- Bottom sheets (WallSelectSheet, WallsSheet): slide-up вход, slide-down выход
- Tab panels: fade-in 150ms при входе, мгновенный выход (display:none — Three.js батарея)
- Pixelize кнопка: CSS спиннер через ::after при sampling=true
- Delete кнопка (ActionBar): red flash при tap

### prefers-reduced-motion
Один блок `@media (prefers-reduced-motion: reduce)` в конце `src/animations.css` — обнуляет все animation-duration и transition-duration до 0.01ms.

### Блок Б (отложенные 1.5)
- SavedToast: pill «✓ Сохранено», Zustand subscribe + debounce 1500ms, виден 2с, fade — `src/components/shared/SavedToast.jsx`
- EmptyState: унифицированный компонент `src/components/shared/EmptyState.jsx`, применён в ViewerTab и PixelizerTab
- Tab fade-in: `data-visible` атрибут + @keyframes tabFadeIn в App.css
- ExportTab: tease-карточка с wireframe сеткой 5×4 и bullet-фичами
- LayoutTab: tease-карточка с wireframe таблицей и bullet-фичами
- RoomTab: flow strip при walls=0, улучшенный empty hint с иконкой LayoutGrid

### Что НЕ удалось
- PhotoSheet: exit анимация не добавлена (компонент не упомянут в промпте явно, оставлен на след. сессию)
- «+ Добавить стену» tap feedback: оставлен (TileForm не трогался в этой сессии)

### Контекст для следующей сессии 2.5
Все shared компоненты в `src/components/shared/`. EmptyState принимает `{icon, title, subtitle, actionLabel, onAction}`. SavedToast уже работает, не трогать. Tab fade-in работает через `data-visible`. Финальная сессия 2.5 — онбординг и пустые состояния (уже частично закрыты EmptyState).
```

- [ ] **Step 2: Commit**

```bash
git add docs/sessions/state.md
git commit -m "docs: record session 2.4 — animations + deferred 1.5 tasks complete"
```

---

## Self-Review

**Spec coverage check:**
- З1 WallCard enter/exit → Task 3 ✓
- З2 MaskCard enter/exit → Task 4 ✓
- З3 Tab fade-in → Task 2 ✓
- З4 Button feedback (pixelize loading, delete flash) → Task 6 ✓
- З5 Bottom sheets → Task 5 ✓
- З6 Toast slide → Toast already uses `.toast-enter`/`.toast-exit` classes from App.css (existing keyframes `toast-in`/`toast-out`). Already wired. No additional task needed.
- З7 SavedToast → Task 7 ✓
- EmptyState → Task 8 ✓
- ExportTab tease → Task 9 ✓
- LayoutTab tease → Task 10 ✓
- RoomTab flow strip → Task 11 ✓
- State.md update → Task 12 ✓

**Placeholder scan:** No TBD/TODO in tasks. All code is complete.

**Type consistency:** `leaving` state used consistently in Tasks 3, 4, 5. `handleClose` pattern consistent across sheets. `EmptyState` props: `icon`, `title`, `subtitle`, `actionLabel`, `onAction` — used identically in Tasks 8, consistent with component definition.
