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
    <div style={s.row}>
      <input
        style={{ ...s.input, flex: 1.5 }}
        placeholder="Название (необяз.)"
        value={mask.name}
        onChange={(e) => updateMask(wallId, mask.id, 'name', e.target.value)}
      />
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
      <button style={s.delBtn} onClick={() => removeMask(wallId, mask.id)}>✕</button>
    </div>
  )
}

const s = {
  row:        { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6, background: '#f8fafc', border: '1px solid #e8eaed', borderRadius: 7, padding: '7px 8px' },
  input:      { padding: '4px 6px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 5, color: '#111827', fontSize: 12 },
  fieldWrap:  { display: 'flex', alignItems: 'center', gap: 2 },
  fieldLabel: { fontSize: 11, color: '#6b7280' },
  numInput:   { width: 52, padding: '4px 5px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 5, color: '#111827', fontSize: 12 },
  unit:       { fontSize: 11, color: '#9ca3af' },
  delBtn:     { padding: '4px 7px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 5, color: '#9ca3af', fontSize: 12, cursor: 'pointer' },
}
