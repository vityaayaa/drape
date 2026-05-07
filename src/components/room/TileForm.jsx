// src/components/room/TileForm.jsx
import { useProjectStore } from '../../store/projectStore.js'

const FIELDS = [
  { key: 'tile_width',     label: 'Ширина плитки',   unit: 'мм' },
  { key: 'tile_height',    label: 'Высота плитки',    unit: 'мм' },
  { key: 'tile_thickness', label: 'Толщина плитки',   unit: 'мм' },
  { key: 'grout_width',    label: 'Ширина шва',       unit: 'мм' },
]

export default function TileForm({ overrides, onOverrideChange, onOverrideClear, isOverride = false }) {
  const { tile, setTileParam, addWall } = useProjectStore()

  function handleChange(key, value) {
    if (isOverride) {
      if (value === '') onOverrideClear(key)
      else onOverrideChange(key, value)
    } else {
      setTileParam(key, value)
    }
  }

  function handleColorChange(value) {
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
              onChange={(e) => handleChange(key, e.target.value)}
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
        <button style={s.addBtn} onClick={() => addWall()}>+ Добавить стену</button>
      )}
    </div>
  )
}

const s = {
  block:      { padding: '18px 20px', borderBottom: '1px solid #e8eaed', background: '#fff' },
  heading:    { fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#111827', letterSpacing: '-0.01em' },
  row:        { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  label:      { flex: 1, fontSize: 13, color: '#6b7280' },
  inputWrap:  { display: 'flex', alignItems: 'center', gap: 4 },
  input:      { width: 84, padding: '7px 9px', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 7, color: '#111827', fontSize: 13 },
  unit:       { fontSize: 12, color: '#9ca3af', width: 22 },
  colorInput: { width: 40, height: 34, border: '1px solid #d1d5db', borderRadius: 7, cursor: 'pointer', background: 'none', padding: 2 },
  addBtn:     { marginTop: 14, width: '100%', padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' },
}
