// src/components/room/MaskCard.jsx
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'

const COORD_FIELDS = [
  { key: 'x',      label: 'X',       unit: 'см' },
  { key: 'y',      label: 'Y',       unit: 'см' },
  { key: 'width',  label: 'Ширина',  unit: 'см' },
  { key: 'height', label: 'Высота',  unit: 'см' },
]

export default function MaskCard({ wallId, mask }) {
  const { updateMask, removeMask } = useProjectStore()
  const [leaving, setLeaving] = useState(false)

  const maskColor = mask.color || '#888888'

  return (
    <div style={s.card} className={leaving ? 'anim-card-exit' : 'anim-card-enter'}>
      <div style={s.topRow}>
        <input
          style={s.nameInput}
          placeholder="Название (необязательно)"
          value={mask.name}
          onChange={(e) => updateMask(wallId, mask.id, 'name', e.target.value)}
        />
        <button style={s.delBtn} onClick={() => {
          setLeaving(true)
          setTimeout(() => removeMask(wallId, mask.id), 190)
        }}>
          Удалить
        </button>
      </div>
      <div style={s.fields}>
        {COORD_FIELDS.map(({ key, label, unit }) => (
          <div key={key} style={s.row}>
            <label style={s.fieldLabel}>{label}</label>
            <div style={s.inputWrap}>
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
          </div>
        ))}
        <div style={s.row}>
          <label style={s.fieldLabel}>Цвет</label>
          <label style={s.colorLabel}>
            <div style={{ ...s.colorSwatch, background: maskColor }} />
            <input
              type="color"
              value={maskColor}
              onChange={(e) => updateMask(wallId, mask.id, 'color', e.target.value)}
              style={s.colorInputHidden}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

const s = {
  card:            { marginBottom: 8, background: '#141820', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' },
  topRow:          { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  nameInput:       { flex: 1, height: 36, padding: '0 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  delBtn:          { height: 36, padding: '0 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 },
  fields:          { padding: '8px 12px 12px' },
  row:             { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  fieldLabel:      { flex: 1, fontSize: 13, fontWeight: 500, color: '#64748b' },
  inputWrap:       { display: 'flex', alignItems: 'center', gap: 4 },
  numInput:        { width: 84, height: 40, padding: '0 8px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  unit:            { fontSize: 12, color: '#475569', width: 22 },
  colorLabel:      { flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative', maxWidth: 110 },
  colorSwatch:     { flex: 1, height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' },
  colorInputHidden: { position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' },
}
