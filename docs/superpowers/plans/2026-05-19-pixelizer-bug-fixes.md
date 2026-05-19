# Pixelizer Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 bugs in the Pixelizer (Photo tab): image quality, input fields UX, floor-anchored tile grid, and touch gesture transform.

**Architecture:** Changes span 6 files across utils (renderer, geometry, sampler) and components (ControlsPane, PhotoPanorama, WallCanvas, PixelizerTab). Each task is independent and safe to commit separately. П2 (brightness/contrast/saturation filter) is already implemented in both `pixelizerRenderer.js` and `pixelizerSampler.js` — verify visually, no code change needed.

**Tech Stack:** React 18, Zustand, Canvas 2D API, react-zoom-pan-pinch, Vitest

---

## File Map

| File | Changes |
|------|---------|
| `src/utils/pixelizerRenderer.js` | П7: imageSmoothingQuality; П6: floor-anchor startY offset in drawWallPhoto + drawWallMosaic |
| `src/utils/pixelizerGeometry.js` | П6: `isFullyInsideMask` gains `tileStartY_mm` param |
| `src/utils/pixelizerGeometry.test.js` | П6: update existing tests + add floor-anchor test |
| `src/utils/pixelizerSampler.js` | П6: floor-anchor offset for pixel sampling coordinates |
| `src/components/pixelizer/ControlsPane.jsx` | П3+П4+П5: rewrite `Field` to uncontrolled pattern with local state |
| `src/components/pixelizer/PixelizerTab.jsx` | П1: add `handlePhotoGestureMove` + `handlePhotoGestureScale` handlers |
| `src/components/pixelizer/PhotoPanorama.jsx` | П1: track `worldScale` via `onTransform`; pass gesture callbacks to WallCanvas |
| `src/components/pixelizer/WallCanvas.jsx` | П1: register touch event listeners on active-photo canvas |

---

## Task 1 — Image quality (П7)

**Files:**
- Modify: `src/utils/pixelizerRenderer.js`

- [ ] **Step 1: Add imageSmoothingQuality inside drawWallPhoto**

  Locate the `if (showPhoto)` block in `drawWallPhoto`. Add two lines inside `ctx.save()` / before `ctx.drawImage`:

  ```js
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.clip()
  ctx.globalAlpha = photoSettings.opacity ?? 1
  ctx.imageSmoothingEnabled = true          // ← add
  ctx.imageSmoothingQuality = 'high'        // ← add
  const { brightness = 1, contrast = 1, saturation = 1 } = photoSettings
  if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
    ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
  }
  ctx.drawImage(photo, drawX, drawY, drawW, drawH)
  ctx.filter = 'none'
  ctx.globalAlpha = 1.0
  ctx.restore()
  ```

- [ ] **Step 2: Verify П2 (filters) while here**

  Confirm lines 44–49 of `pixelizerRenderer.js` already read:
  ```js
  const { brightness = 1, contrast = 1, saturation = 1 } = photoSettings
  if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
    ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
  }
  ```
  If present and correct — no change needed. If missing, add them.

- [ ] **Step 3: Run tests to confirm nothing broken**

  ```bash
  npm test
  ```
  Expected: all existing tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add src/utils/pixelizerRenderer.js
  git commit -m "fix(pixelizer): enable high-quality image smoothing on canvas draw"
  ```

---

## Task 2 — Field input UX (П3 + П4 + П5)

**Files:**
- Modify: `src/components/pixelizer/ControlsPane.jsx`

**Context:** The `Field` component (line 159) is a controlled `<input type="number">` — React re-writes its value on every keystroke via `value={value.toFixed(decimals)}`, breaking mid-number typing. On iOS, `type="number"` shows "050" for 50. The `offsetX_mm`/`offsetY_mm` fields have no `min` prop so negative values are allowed (П5 is already correct, just ensure no regression).

- [ ] **Step 1: Add React hooks import to ControlsPane.jsx**

  Replace the current top of the file:
  ```js
  import PhotoCard from './PhotoCard.jsx'
  import ViewModeControl from './ViewModeControl.jsx'
  ```
  with:
  ```js
  import { useState, useEffect } from 'react'
  import PhotoCard from './PhotoCard.jsx'
  import ViewModeControl from './ViewModeControl.jsx'
  ```

- [ ] **Step 2: Rewrite the Field component**

  Replace the entire `Field` function (lines 159–177) with:

  ```jsx
  function Field({ label, value, step, min, max, decimals = 0, onChange }) {
    const fmt = (v) => decimals > 0 ? v.toFixed(decimals) : String(Math.round(v))
    const [localVal, setLocalVal] = useState(() => fmt(value))

    useEffect(() => {
      setLocalVal(fmt(value))
    }, [value])

    function commit() {
      const v = parseFloat(localVal)
      if (isNaN(v)) {
        setLocalVal(fmt(value))
        return
      }
      let clamped = v
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      onChange(clamped)
    }

    return (
      <div style={s.fieldGroup}>
        <label style={s.fieldLabel}>{label}</label>
        <input
          type="text"
          inputMode="decimal"
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') { e.target.blur() } }}
          style={s.numInput}
        />
      </div>
    )
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  npm test
  ```
  Expected: all pass (no unit tests for ControlsPane, but no regressions in utils).

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/pixelizer/ControlsPane.jsx
  git commit -m "fix(pixelizer): uncontrolled Field input — fixes mid-type reset and iOS leading zero"
  ```

---

## Task 3 — Floor anchor (П6)

**Files:**
- Modify: `src/utils/pixelizerGeometry.js`
- Modify: `src/utils/pixelizerGeometry.test.js`
- Modify: `src/utils/pixelizerRenderer.js`
- Modify: `src/utils/pixelizerSampler.js`

**Context:** Currently tiles are drawn from top of canvas downward (row 0 at ceiling). In real rooms tiles start from the floor. The fix: compute `startY_px = H - rows * stepY` (amount of canvas above the first tile row). All tile Y coordinates are offset by `startY_px`. The mask-tile intersection function `isFullyInsideMask` also needs this offset because mask coordinates are measured from the top of the wall (fixed), while tile rows now start lower.

### 3a — Update isFullyInsideMask

- [ ] **Step 1: Update function signature in pixelizerGeometry.js**

  Replace the `isFullyInsideMask` function (lines 46–61) with:

  ```js
  export function isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm = 0) {
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
      const adjMy    = my - tileStartY_mm
      const rowStart = Math.ceil(adjMy / stepY)
      const rowEnd   = Math.floor((adjMy + mh) / stepY)
      return col >= colStart && col < colEnd && row >= rowStart && row < rowEnd
    })
  }
  ```

- [ ] **Step 2: Update tests in pixelizerGeometry.test.js**

  Existing `isFullyInsideMask` tests call the function without the 7th arg → default `tileStartY_mm=0` → behaviour unchanged. They must still pass as-is.

  Add one new test case inside the `describe('isFullyInsideMask')` block:

  ```js
  it('tiles are excluded from masks that fall entirely above the tile grid start', () => {
    // tileStartY_mm=50: tiles begin 50mm below ceiling.
    // Mask at y=0cm, h=3cm (= 0–30mm from ceiling) is entirely above tile row 0.
    // stepX = stepY = (20+2) = 22mm.
    // Without floor anchor (tileStartY_mm=0): tile(0,0) IS inside this mask.
    const masks = [{ x: '0', y: '0', width: '30', height: '3' }]
    expect(isFullyInsideMask(0, 0, masks, 20, 20, 2, 0)).toBe(true)   // old behaviour
    expect(isFullyInsideMask(0, 0, masks, 20, 20, 2, 50)).toBe(false) // floor anchor
  })
  ```

- [ ] **Step 3: Run tests — should pass**

  ```bash
  npm test -- pixelizerGeometry
  ```
  Expected: all pass including the new test.

### 3b — Update renderer (drawWallPhoto + drawWallMosaic)

- [ ] **Step 4: Add floor-anchor helper function at the top of pixelizerRenderer.js**

  After the import line, before `drawWallPhoto`:

  ```js
  function floorAnchorStartY(H, rows, tileH_mm, groutW_mm, canvasScale) {
    const stepY = (tileH_mm + groutW_mm) * canvasScale
    return H - rows * stepY
  }
  ```

- [ ] **Step 5: Update grid drawing in drawWallPhoto**

  Locate the `// Сетка` block (line ~55). Replace from `const tileWpx = ...` through the end of the grid section:

  ```js
  if (gridVisible && columns > 0 && rows > 0) {
    const tileWpx = Math.round(tileW_mm * canvasScale)
    const tileHpx = Math.round(tileH_mm * canvasScale)
    const groutPx = Math.max(1, Math.round(groutW_mm * canvasScale))
    const stepX = tileWpx + groutPx
    const stepY = tileHpx + groutPx
    const startY = floorAnchorStartY(H, rows, tileH_mm, groutW_mm, canvasScale)
    const tileStartY_mm = startY / canvasScale

    if (showPhoto) {
      // photo+grid: translucent grout lines over photo
      ctx.save()
      ctx.globalAlpha = 0.28
      ctx.fillStyle = groutColor || '#cccccc'
      for (let col = 0; col < columns; col++) {
        ctx.fillRect(Math.round(col * stepX + tileWpx), 0, groutPx, H)
      }
      for (let row = 0; row < rows; row++) {
        ctx.fillRect(0, Math.round(startY + row * stepY + tileHpx), W, groutPx)
      }
      ctx.restore()
    } else {
      // grid only: tiles on grout background
      ctx.fillStyle = '#3a3a4a'
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm)) continue
          const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
          ctx.fillRect(r.x, Math.round(r.y + startY), r.w, r.h)
        }
      }
    }
  }
  ```

- [ ] **Step 6: Update drawWallMosaic**

  Replace the loop body in `drawWallMosaic`:

  ```js
  export function drawWallMosaic(ctx, W, H, tileGrid, tileColors, canvasScale) {
    ctx.clearRect(0, 0, W, H)
    const { columns, rows, tileW_mm, tileH_mm, groutW_mm, masks, groutColor } = tileGrid

    ctx.fillStyle = groutColor || '#cccccc'
    ctx.fillRect(0, 0, W, H)

    const startY = floorAnchorStartY(H, rows, tileH_mm, groutW_mm, canvasScale)
    const tileStartY_mm = startY / canvasScale

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm)) continue
        const r = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
        ctx.fillStyle = tileColors[`${col}_${row}`] || '#3a3a4a'
        ctx.fillRect(r.x, Math.round(r.y + startY), r.w, r.h)
      }
    }

    _drawMasks(ctx, masks, canvasScale)
  }
  ```

### 3c — Update sampler

- [ ] **Step 7: Update pixelizerSampler.js to use floor-anchor Y for pixel sampling**

  The sampler draws the photo with `drawY = canvasH - drawH - offsetY * canvasScale` (already floor-anchored from the photo side). The tile rects must now be sampled at the same floor-anchored positions.

  Replace the loop section in `sampleWallColors` (after `const { data: pixels } = ctx.getImageData(...)`) with:

  ```js
  const { data: pixels } = ctx.getImageData(0, 0, canvasW, canvasH)
  const result = {}

  const stepY_mm = tileH_mm + groutW_mm
  const startY_px = canvasH - rows * stepY_mm * canvasScale
  const tileStartY_mm = startY_px / canvasScale

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (isFullyInsideMask(col, row, masks, tileW_mm, tileH_mm, groutW_mm, tileStartY_mm)) continue
      const rect = tileRect(col, row, tileW_mm, tileH_mm, groutW_mm, canvasScale)
      result[`${col}_${row}`] = averageColor(pixels, rect.x, rect.y + startY_px, rect.w, rect.h, canvasW)
    }
  }
  return result
  ```

- [ ] **Step 8: Run all tests**

  ```bash
  npm test
  ```
  Expected: all pass.

- [ ] **Step 9: Commit**

  ```bash
  git add src/utils/pixelizerGeometry.js src/utils/pixelizerGeometry.test.js \
          src/utils/pixelizerRenderer.js src/utils/pixelizerSampler.js
  git commit -m "fix(pixelizer): floor-anchor tile grid — tiles start from floor, not ceiling"
  ```

---

## Task 4 — Touch gesture transform (П1)

**Files:**
- Modify: `src/components/pixelizer/PixelizerTab.jsx`
- Modify: `src/components/pixelizer/PhotoPanorama.jsx`
- Modify: `src/components/pixelizer/WallCanvas.jsx`

**Context:** In `transform` mode, touching the canvas of the active photo should move or scale it. Outside the photo canvas, world pan/pinch continue normally (TransformWrapper stays enabled). Touch events on the active canvas call `stopPropagation()` so TransformWrapper doesn't intercept them. Pixel delta is converted to mm using `worldScale * canvasScale`.

**Important pattern — stale closure prevention:** The touch handlers are registered once in `useEffect`. Values that change over time (worldScale, canvasScale, current settings, callbacks) are stored in refs and read inside the handlers. Only `showBoundingBox` controls whether listeners are registered.

### 4a — PixelizerTab handlers

- [ ] **Step 1: Add gesture handlers in PixelizerTab.jsx**

  Add these two functions directly after `handleTransformDelete` (around line 207):

  ```js
  function handlePhotoGestureMove(dx_mm, dy_mm) {
    const activeWalls = walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === activePhotoId)
    activeWalls.forEach(w => {
      const ps = pixelizer.photoSettings[w.id]
      if (!ps) return
      setPhotoSettings(w.id, {
        ...ps,
        offsetX_mm: (ps.offsetX_mm ?? 0) + dx_mm,
        offsetY_mm: (ps.offsetY_mm ?? 0) + dy_mm,
      })
    })
  }

  function handlePhotoGestureScale(newScale) {
    const activeWalls = walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === activePhotoId)
    activeWalls.forEach(w => {
      const ps = pixelizer.photoSettings[w.id]
      if (!ps) return
      setPhotoSettings(w.id, { ...ps, scale: newScale })
    })
  }
  ```

- [ ] **Step 2: Pass the handlers to PhotoPanorama**

  In the `<PhotoPanorama ...>` JSX, add two new props:

  ```jsx
  <PhotoPanorama
    walls={visibleWalls}
    pixelizer={pixelizer}
    tile={tile}
    corners={corners}
    canvasScale={canvasScale}
    uiMode={uiMode}
    selectedWallIds={selectedWallIds}
    renderParams={renderParams}
    activePhotoId={activePhotoId}
    photoCache={photoCache}
    eyeMode={eyeMode}
    onEyeCycle={cycleEye}
    onWallTap={handleWallTap}
    onPhotoGestureMove={handlePhotoGestureMove}    // ← add
    onPhotoGestureScale={handlePhotoGestureScale}  // ← add
  />
  ```

### 4b — PhotoPanorama worldScale tracking

- [ ] **Step 3: Add worldScale state and onTransform in PhotoPanorama.jsx**

  Add to the top of the function body (after the existing `useState` for `eyeAnimating`):

  ```js
  const [worldScale, setWorldScale] = useState(initialScale)
  ```

  Add `onTransform` to the `<TransformWrapper>` props:

  ```jsx
  <TransformWrapper
    initialScale={initialScale}
    minScale={0.15}
    maxScale={8}
    limitToBounds={false}
    centerOnInit={true}
    panning={{ disabled: isAddPhoto, velocityDisabled: false }}
    pinch={{ disabled: isAddPhoto }}
    wheel={{ step: 0.1 }}
    doubleClick={{ disabled: true }}
    onTransform={({ state }) => setWorldScale(state.scale)}
  >
  ```

- [ ] **Step 4: Update PhotoPanorama props signature and pass data to WallCanvas**

  Add `onPhotoGestureMove` and `onPhotoGestureScale` to the destructured props:

  ```js
  export default function PhotoPanorama({
    walls, pixelizer, tile, corners, canvasScale,
    uiMode, selectedWallIds, renderParams, activePhotoId,
    photoCache, eyeMode, onEyeCycle, onWallTap,
    onPhotoGestureMove, onPhotoGestureScale,   // ← add
  }) {
  ```

  Pass them to each `<WallCanvas>` inside the `walls.map(...)`:

  ```jsx
  <WallCanvas
    wall={wall}
    tile={tile}
    corners={corners}
    walls={walls}
    pixelizer={pixelizer}
    canvasScale={canvasScale}
    renderParams={renderParams}
    showBoundingBox={showBox}
    isSelectable={isAddPhoto}
    isSelected={isAddPhoto && selectedWallIds.includes(wall.id)}
    onTap={onWallTap}
    photoCache={photoCache}
    worldScale={worldScale}                       // ← add
    onPhotoGestureMove={onPhotoGestureMove}       // ← add
    onPhotoGestureScale={onPhotoGestureScale}     // ← add
  />
  ```

### 4c — WallCanvas touch handlers

- [ ] **Step 5: Add new props and refs in WallCanvas.jsx**

  After the existing `const canvasRef = useRef(null)`, add:

  ```js
  // Refs keep current values accessible in touch handlers without re-registering listeners
  const worldScaleRef      = useRef(worldScale)
  const canvasScaleRef     = useRef(canvasScale)
  const settingsRef        = useRef(settings)
  const gestureMoveRef     = useRef(onPhotoGestureMove)
  const gestureScaleRef    = useRef(onPhotoGestureScale)
  ```

  Add a `useEffect` block to keep refs current (put it directly after the refs, before the main render useEffect):

  ```js
  useEffect(() => { worldScaleRef.current  = worldScale },      [worldScale])
  useEffect(() => { canvasScaleRef.current = canvasScale },     [canvasScale])
  useEffect(() => { settingsRef.current    = settings },        [settings])
  useEffect(() => { gestureMoveRef.current = onPhotoGestureMove },  [onPhotoGestureMove])
  useEffect(() => { gestureScaleRef.current = onPhotoGestureScale }, [onPhotoGestureScale])
  ```

  Update the `WallCanvas` function signature to accept the new props:

  ```js
  export default function WallCanvas({
    wall, tile, corners, walls, pixelizer, canvasScale,
    renderParams,
    showBoundingBox,
    isSelectable,
    isSelected,
    onTap,
    photoCache,
    worldScale = 1,                 // ← add
    onPhotoGestureMove,             // ← add
    onPhotoGestureScale,            // ← add
  }) {
  ```

- [ ] **Step 6: Add touch gesture useEffect in WallCanvas.jsx**

  Add this effect after the ref-sync effects and before the main render `useEffect`:

  ```js
  useEffect(() => {
    if (!showBoundingBox) return
    const canvas = canvasRef.current
    if (!canvas) return

    let gesture = null

    function onTouchStart(e) {
      e.stopPropagation()
      if (e.touches.length === 1) {
        gesture = { type: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY }
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        gesture = {
          type: 'pinch',
          startDist: dist,
          startScale: settingsRef.current?.scale ?? 1,
        }
      }
    }

    function onTouchMove(e) {
      e.stopPropagation()
      e.preventDefault()
      if (!gesture) return

      if (gesture.type === 'pan' && e.touches.length === 1) {
        const dx_px = e.touches[0].clientX - gesture.x
        const dy_px = e.touches[0].clientY - gesture.y
        const factor = worldScaleRef.current * canvasScaleRef.current
        const dx_mm =  dx_px / factor
        const dy_mm = -dy_px / factor   // canvas Y is inverted vs physical Y
        gestureMoveRef.current?.(dx_mm, dy_mm)
        gesture.x = e.touches[0].clientX
        gesture.y = e.touches[0].clientY
      } else if (gesture.type === 'pinch' && e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        const newScale = gesture.startScale * (dist / gesture.startDist)
        gestureScaleRef.current?.(Math.max(0.1, Math.min(10, newScale)))
      }
    }

    function onTouchEnd(e) {
      e.stopPropagation()
      gesture = null
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: true })

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
    }
  }, [showBoundingBox])   // re-register only when active photo changes
  ```

- [ ] **Step 7: Run tests**

  ```bash
  npm test
  ```
  Expected: all pass (gesture logic has no unit tests; verify manually on device or browser DevTools mobile emulation).

- [ ] **Step 8: Commit**

  ```bash
  git add src/components/pixelizer/PixelizerTab.jsx \
          src/components/pixelizer/PhotoPanorama.jsx \
          src/components/pixelizer/WallCanvas.jsx
  git commit -m "feat(pixelizer): touch gesture transform — one-finger pan, pinch-to-scale active photo"
  ```

---

## Task 5 — Update state.md (session record)

- [ ] **Write session 2.1 results into `docs/sessions/state.md`** following the template from the user's prompt. Include which files changed, what approach was used per bug, and what remains for session 2.2.

---

## Self-Review Checklist

**Spec coverage:**
- П1 gesture → Task 4 ✓
- П2 filters → Task 1 Step 2 (verify) ✓
- П3 field input → Task 2 ✓
- П4 iOS leading zero → Task 2 (type="text" inputMode="decimal") ✓
- П5 negative offset → Task 2 (no min= on offset fields, confirmed in plan) ✓
- П6 floor anchor → Task 3 ✓
- П7 quality → Task 1 ✓

**Type consistency:**
- `isFullyInsideMask` updated signature used consistently in renderer, sampler, and tests ✓
- `floorAnchorStartY` helper defined before use ✓
- `gestureMoveRef` / `gestureScaleRef` match prop names `onPhotoGestureMove` / `onPhotoGestureScale` ✓

**No placeholders:** All steps contain actual code. ✓
