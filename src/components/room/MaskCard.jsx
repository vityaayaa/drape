// src/components/room/MaskCard.jsx
import { useRef } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

const MASK_FIELDS = [
  { key: 'x',      label: 'X',  unit: 'см' },
  { key: 'y',      label: 'Y',  unit: 'см' },
  { key: 'width',  label: 'Ш',  unit: 'см' },
  { key: 'height', label: 'В',  unit: 'см' },
]

export default function MaskCard({ wallId, mask }) {
  const { updateMask, removeMask } = useProjectStore()
  const { push } = useHistoryStore()
  const preEditSnapshot = useRef(null)

  function handleFocus() {
    preEditSnapshot.current = useProjectStore.getState().getSnapshot()
  }

  function handleBlur() {
    if (preEditSnapshot.current) push(preEditSnapshot.current)
  }

  return (
    <div style={s.row}>
      <input
        style={{ ...s.input, flex: 1.5 }}
        placeholder="Название (необяз.)"
        value={mask.name}
        onFocus={handleFocus}
        onChange={(e) => updateMask(wallId, mask.id, 'name', e.target.value)}
        onBlur={handleBlur}
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
            onFocus={handleFocus}
            onChange={(e) => updateMask(wallId, mask.id, key, e.target.value)}
            onBlur={handleBlur}
          />
          <span style={s.unit}>{unit}</span>
        </div>
      ))}
      <button style={s.delBtn} onClick={() => {
        push(useProjectStore.getState().getSnapshot())
        removeMask(wallId, mask.id)
      }}>✕</button>
    </div>
  )
}

const s = {
  row:        { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6, background: '#222', borderRadius: 6, padding: '6px 8px' },
  input:      { padding: '4px 6px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 5, color: '#f0f0f0', fontSize: 12 },
  fieldWrap:  { display: 'flex', alignItems: 'center', gap: 2 },
  fieldLabel: { fontSize: 11, color: '#888' },
  numInput:   { width: 52, padding: '4px 5px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 5, color: '#f0f0f0', fontSize: 12 },
  unit:       { fontSize: 11, color: '#666' },
  delBtn:     { padding: '4px 7px', background: 'transparent', border: '1px solid #555', borderRadius: 5, color: '#888', fontSize: 12, cursor: 'pointer' },
}
