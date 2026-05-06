# Stage 2 — Room Model: Design Spec

Date: 2026-05-07
Branch: stage_2

## Scope

Room settings tab: wall form, tile params, obstacle masks, corner overlap settings, grid calculation, tile count limits. No 3D — logic and numbers only.

## Data Model (projectStore.js)

### Global tile params

```js
tile: {
  tile_width: '',       // mm, empty string = unset
  tile_height: '',      // mm
  tile_thickness: '',   // mm
  grout_width: '',      // mm
  grout_color: '#cccccc'
}
```

### Walls array

```js
walls: [
  {
    id: 'w1',
    name: 'Стена 1',
    length: '',         // cm
    height: '',         // cm
    wall_active: true,
    mosaic_active: true,
    tile_overrides: {}, // only fields with non-empty values; absent or empty fields fall back to global tile
    masks: [
      {
        id: 'm1',
        name: '',       // 'дверь', 'лестница', etc.
        x: '',          // cm from left edge of wall
        y: '',          // cm from floor
        width: '',      // cm
        height: ''      // cm
      }
    ]
  }
]
```

### Corner overrides

```js
corners: {
  // key: "wallId_left-wallId_right" (e.g. "w1-w2")
  // value: "auto" | "wall_<id>" (id of the wall that overrides)
  "w1-w2": "auto"
}
```

### Snapshot

`getSnapshot()` includes `tile`, `walls`, `corners`. All three are persisted to IndexedDB and included in undo/redo history.

## Component Structure

```
src/components/room/
  RoomTab.jsx          — scrollable page container
  TileForm.jsx         — global tile params form
  WallCard.jsx         — single wall card (fields + masks + tile_overrides)
  MaskCard.jsx         — single mask row inside WallCard
  CornersSection.jsx   — corner overlap settings
  SummarySection.jsx   — per-wall tile count + totals

src/utils/
  roomGeometry.js      — pure calculation function (no React, no store)
```

### Page order (top to bottom)

1. `TileForm` — global tile params + "Add wall" button
2. List of `WallCard` — one per wall, in order added
3. `CornersSection` — only shown when walls ≥ 2
4. `SummarySection` — always at bottom

### WallCard contents

- Editable name + `wall_active` / `mosaic_active` toggles
- `length` and `height` fields (cm)
- "Override tile" button → expands inline mini-form with same fields as TileForm (only filled fields override)
- List of `MaskCard` + "Add mask" button
- Delete wall button

### MaskCard contents

Single row: name, x, y, width, height (all cm), delete button.

### CornersSection

One row per corner: label "Угол между Стеной N и Стеной M" + dropdown: "Автоматически / Стена N перекрывает / Стена M перекрывает".

### SummarySection

Table: wall name | columns | rows | tiles. Last row: totals. Missing data → dash.

## Grid Calculation (roomGeometry.js)

Pure function: `calculateGrid(tile, walls, corners) → WallResult[]`

### Per active wall with mosaic_active = true:

1. **Resolve effective tile params** — merge global `tile` with wall's `tile_overrides`.

2. **Determine neighbors** — left neighbor = previous wall in array (wraps: wall[0]'s left neighbor is wall[n-1]). Right neighbor = next wall (wraps).

3. **Determine overlap per corner** using `corners` map:
   - `"auto"` → thicker tile_thickness overrides thinner; equal → smaller wall index overrides
   - `"wall_<id>"` → that wall overrides
   - No overlap if neighbor has `tile_thickness = 0`, `mosaic_active = false`, or `wall_active = false`

4. **Grid width** (convert cm → mm with ×10):
   ```
   grid_width_mm = length_cm × 10
     − left_neighbor.tile_thickness_mm  (if left neighbor overrides current wall)
     − right_neighbor.tile_thickness_mm (if right neighbor overrides current wall)
   ```

5. **Grid dimensions:**
   ```
   tw = effective tile_width_mm
   th = effective tile_height_mm
   gw = effective grout_width_mm
   grid_height_mm = height_cm × 10

   columns = floor((grid_width_mm  + gw) / (tw + gw))
   rows    = floor((grid_height_mm + gw) / (th + gw))
   total_before_masks = columns × rows
   ```

6. **Subtract masked tiles** — for each mask, count tiles fully inside it:
   ```
   step_x = tw + gw
   step_y = th + gw
   mask_x_mm = mask.x × 10,  mask_w_mm = mask.width × 10
   mask_y_mm = mask.y × 10,  mask_h_mm = mask.height × 10

   col_start = ceil(mask_x_mm / step_x)
   col_end   = floor((mask_x_mm + mask_w_mm) / step_x)
   row_start = ceil(mask_y_mm / step_y)
   row_end   = floor((mask_y_mm + mask_h_mm) / step_y)

   masked = max(0, col_end − col_start) × max(0, row_end − row_start)
   ```
   Total masked = sum across all masks (non-overlapping assumed).

7. **Final count:** `total = total_before_masks − total_masked`

8. **Limits** (checked against `total_before_masks`):
   - > 25 000 → `warning: true`
   - > 75 000 → `blocked: true`

### Return type per wall:

```js
{
  wallId,
  grid_width_cm,   // for display
  columns,
  rows,
  total_before_masks,
  total_masked,
  total,
  warning: bool,
  blocked: bool
}
```

Returns `null` for a wall if required fields are missing or wall/mosaic is inactive.

## UX Behaviour

**Empty fields:** not an error — grid result for that wall shows as dash in summary until all required fields are filled.

**Warning (> 25 000):** yellow banner inside WallCard: "⚠ На стене X плиток — на мобильных может тормозить"

**Blocked (> 75 000):** red banner inside WallCard: "✕ Слишком много плиток. Увеличь размер плитки или уменьши стену." Data is still saved; no hard lock on input.

**Default state:** no walls, no tile data. User starts by filling tile params and adding walls.

**Undo/Redo:** snapshot is pushed on field blur (when user leaves a field), not on every keystroke — avoids flooding history with intermediate states. Uses existing historyStore + buttons already in the UI.

**Persistence:** automatic via existing persistence.js — no additional work needed.

## Out of Scope for Stage 2

- 3D rendering of any kind
- Photo assignment to walls
- Pixelization
- Export
