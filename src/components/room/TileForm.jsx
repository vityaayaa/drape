// src/components/room/TileForm.jsx
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'

// required: ширина и высота обязательны; толщина и шов — нет (не показывать ошибку, если пусто).
const FIELDS = [
  { key: 'tile_width',     label: 'Ширина плитки',   unit: 'мм', required: true  },
  { key: 'tile_height',    label: 'Высота плитки',   unit: 'мм', required: true  },
  { key: 'tile_thickness', label: 'Толщина плитки',  unit: 'мм', required: false },
  { key: 'grout_width',    label: 'Ширина шва',      unit: 'мм', required: false },
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
      {FIELDS.map(({ key, label, unit, required }) => {
        const value = isOverride ? (overrides?.[key] ?? '') : tile[key]
        const isEmpty = value === '' || value === undefined || value === null
        // Ошибка показывается:
        //  - только для обязательных полей,
        //  - или если пользователь ввёл значение и оно <= 0.
        const showError =
          !isOverride && touched[key] &&
          (required ? !(Number(value) > 0) : (!isEmpty && !(Number(value) > 0)))
        return (
          <div key={key} style={s.field}>
            <div style={s.row}>
              <label style={s.label}>{label}</label>
              <span style={s.guide} aria-hidden="true" />
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
            </div>
            {showError && <span style={s.fieldError}>Больше 0</span>}
          </div>
        )
      })}

      <div style={s.field}>
        <div style={s.row}>
          <label style={s.label}>Цвет шва</label>
          <span style={s.guide} aria-hidden="true" />
          <div style={s.inputWrap}>
            <label style={s.colorLabel}>
              <span style={{ ...s.colorSwatch, background: currentColor }} />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                style={s.colorInputHidden}
              />
            </label>
            <span style={s.unit} />
          </div>
        </div>
      </div>

      {!isOverride && (
        <button style={s.addBtn} onClick={() => addWall()}>+ Добавить стену</button>
      )}
    </div>
  )
}

// Геометрия поля — input занимает фикс. ширину справа, лейбл — слева,
// между ними тонкая dotted-направляющая.
const FIELD_INPUT_W = 108  // ширина блока (input + единица)
const INPUT_W = 84

const s = {
  block:    { padding: '18px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' },
  heading:  { fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)', letterSpacing: '-0.01em' },
  field:    { marginBottom: 10 },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-hint)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  guide: {
    flex: 1,
    height: 1,
    borderTop: '1px dotted rgba(255,255,255,0.10)',
    minWidth: 8,
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    width: FIELD_INPUT_W,
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  input: {
    width: INPUT_W,
    height: 44,
    padding: '0 10px',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid var(--border-strong)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 13,
    boxSizing: 'border-box',
    outline: 'none',
  },
  unit: {
    fontSize: 12,
    color: 'var(--text-disabled)',
    width: 22,
    display: 'inline-block',
    textAlign: 'left',
  },
  colorLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative',
    width: INPUT_W,
    height: 44,
  },
  colorSwatch: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
  },
  colorInputHidden: {
    position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none',
  },
  addBtn: {
    marginTop: 16,
    width: '100%',
    height: 48,
    background: 'var(--accent-grad)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    boxShadow: 'var(--accent-shadow)',
  },
  fieldError: { display: 'block', fontSize: 11, color: 'var(--error)', marginTop: 4, paddingLeft: 2 },
}
