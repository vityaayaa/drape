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
    <div style={s.card}>
      {/* Строка с названием и крестиком */}
      <div style={s.topRow}>
        <input
          style={s.nameInput}
          placeholder="Название (необяз.)"
          value={mask.name}
          onChange={(e) => updateMask(wallId, mask.id, 'name', e.target.value)}
        />
        <button style={s.delBtn} onClick={() => removeMask(wallId, mask.id)}>
          Удалить
        </button>
      </div>
      {/* Строка с координатами */}
      <div style={s.coordRow}>
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
      </div>
    </div>
  )
}

const s = {
  card:       { marginBottom: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' },
  topRow:     { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  nameInput:  { flex: 1, padding: '4px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#f1f5f9', fontSize: 12, outline: 'none' },
  delBtn:     { padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 5, color: '#f87171', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 },
  coordRow:   { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '7px 8px' },
  fieldWrap:  { display: 'flex', alignItems: 'center', gap: 3 },
  fieldLabel: { fontSize: 11, color: '#64748b', minWidth: 12 },
  numInput:   { width: 54, padding: '4px 5px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#f1f5f9', fontSize: 12, outline: 'none' },
  unit:       { fontSize: 11, color: '#475569' },
}
