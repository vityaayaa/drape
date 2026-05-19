// src/components/room/TileForm.jsx
import { useState } from 'react'
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

  const currentColor = isOverride ? (overrides?.grout_color ?? tile.grout_color) : tile.grout_color
  const [touched, setTouched] = useState({})

  return (
    <div style={s.block}>
      {!isOverride && <h2 style={s.heading}>Параметры плитки</h2>}
      {FIELDS.map(({ key, label, unit }) => {
        const value = isOverride ? (overrides?.[key] ?? '') : tile[key]
        const showError = !isOverride && touched[key] && !(Number(value) > 0)
        return (
          <div key={key} style={s.row}>
            <label style={s.label}>{label}</label>
            <div style={s.inputWrap}>
              <input
                style={s.input}
                type="number"
                min="0"
                step="any"
                placeholder="—"
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={() => !isOverride && setTouched(t => ({ ...t, [key]: true }))}
              />
              <span style={s.unit}>{unit}</span>
            </div>
            {showError && <span style={s.fieldError}>Больше 0</span>}
          </div>
        )
      })}
      <div style={s.row}>
        <label style={s.label}>Цвет шва</label>
        <label style={s.colorLabel}>
          <div style={{ ...s.colorSwatch, background: currentColor }} />
          <input
            type="color"
            value={currentColor}
            onChange={(e) => handleColorChange(e.target.value)}
            style={s.colorInputHidden}
          />
        </label>
      </div>
      {!isOverride && (
        <button style={s.addBtn} onClick={() => addWall()}>+ Добавить стену</button>
      )}
    </div>
  )
}

const s = {
  block:           { padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0e1018' },
  heading:         { fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f1f5f9', letterSpacing: '-0.01em' },
  row:             { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  label:           { flex: 1, fontSize: 13, fontWeight: 500, color: '#64748b' },
  inputWrap:       { display: 'flex', alignItems: 'center', gap: 4 },
  input:           { width: 84, height: 44, padding: '0 10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' },
  unit:            { fontSize: 12, color: '#475569', width: 22 },
  colorLabel:      { flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' },
  colorSwatch:     { flex: 1, height: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' },
  colorInputHidden: { position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' },
  addBtn:          { marginTop: 16, width: '100%', height: 48, background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em', boxShadow: '0 0 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' },
  fieldError:      { display: 'block', fontSize: 11, color: '#ef4444', marginTop: 2 },
}
