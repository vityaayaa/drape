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
