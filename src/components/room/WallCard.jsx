// src/components/room/WallCard.jsx
import { useState, useRef } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'
import MaskCard from './MaskCard.jsx'
import TileForm from './TileForm.jsx'

export default function WallCard({ wall, result }) {
  const { updateWall, removeWall, addMask, setTileOverride, clearTileOverride } = useProjectStore()
  const { push } = useHistoryStore()
  const [showOverride, setShowOverride] = useState(Object.keys(wall.tile_overrides).length > 0)
  const preEditSnapshot = useRef(null)

  function handleFocus() {
    preEditSnapshot.current = useProjectStore.getState().getSnapshot()
  }

  function handleBlur() {
    if (preEditSnapshot.current) push(preEditSnapshot.current)
  }

  function toggle(field) {
    push(useProjectStore.getState().getSnapshot())
    updateWall(wall.id, field, !wall[field])
  }

  const hasWarning = result?.warning && !result?.blocked
  const hasBlocked = result?.blocked

  return (
    <div style={{ ...s.card, borderColor: hasBlocked ? '#ef4444' : hasWarning ? '#f59e0b' : '#333' }}>
      {/* Заголовок */}
      <div style={s.header}>
        <input
          style={s.nameInput}
          value={wall.name}
          onFocus={handleFocus}
          onChange={(e) => updateWall(wall.id, 'name', e.target.value)}
          onBlur={handleBlur}
        />
        <label style={s.toggle}>
          <input type="checkbox" checked={wall.wall_active} onChange={() => toggle('wall_active')} />
          <span style={s.toggleLabel}>Активна</span>
        </label>
        <label style={s.toggle}>
          <input type="checkbox" checked={wall.mosaic_active} disabled={!wall.wall_active} onChange={() => toggle('mosaic_active')} />
          <span style={s.toggleLabel}>Мозаика</span>
        </label>
        <button style={s.delBtn} onClick={() => { push(useProjectStore.getState().getSnapshot()); removeWall(wall.id) }}>✕</button>
      </div>

      {/* Размеры */}
      <div style={s.sizeRow}>
        <div style={s.field}>
          <label style={s.label}>Длина</label>
          <div style={s.inputWrap}>
            <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.length}
              onFocus={handleFocus} onChange={(e) => updateWall(wall.id, 'length', e.target.value)} onBlur={handleBlur} />
            <span style={s.unit}>см</span>
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Высота</label>
          <div style={s.inputWrap}>
            <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.height}
              onFocus={handleFocus} onChange={(e) => updateWall(wall.id, 'height', e.target.value)} onBlur={handleBlur} />
            <span style={s.unit}>см</span>
          </div>
        </div>
      </div>

      {/* Лимиты */}
      {hasBlocked && (
        <div style={s.blocked}>✕ Слишком много плиток ({result.total_before_masks.toLocaleString()}). Увеличь размер плитки или уменьши стену.</div>
      )}
      {hasWarning && (
        <div style={s.warning}>⚠ На стене {result.total_before_masks.toLocaleString()} плиток — на мобильных может тормозить.</div>
      )}

      {/* Переопределение плитки */}
      <button style={s.overrideToggle} onClick={() => setShowOverride(v => !v)}>
        {showOverride ? '▾' : '▸'} Переопределить плитку для этой стены
      </button>
      {showOverride && (
        <div style={s.overrideBlock}>
          <TileForm
            isOverride
            overrides={wall.tile_overrides}
            onOverrideChange={(field, value) => { setTileOverride(wall.id, field, value); handleBlur() }}
            onOverrideClear={(field) => { clearTileOverride(wall.id, field); handleBlur() }}
          />
        </div>
      )}

      {/* Маски */}
      <div style={s.masksSection}>
        <div style={s.masksHeader}>
          <span style={s.masksTitle}>Маски-препятствия</span>
          <button style={s.addMaskBtn} onClick={() => { push(useProjectStore.getState().getSnapshot()); addMask(wall.id) }}>+ Добавить</button>
        </div>
        {wall.masks.length === 0 && <p style={s.empty}>Нет масок</p>}
        {wall.masks.map(mask => <MaskCard key={mask.id} wallId={wall.id} mask={mask} />)}
      </div>
    </div>
  )
}

const s = {
  card:          { border: '1px solid #333', borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  header:        { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#222', flexWrap: 'wrap' },
  nameInput:     { flex: 1, minWidth: 80, background: 'transparent', border: 'none', borderBottom: '1px solid #555', color: '#f0f0f0', fontSize: 14, fontWeight: 600, padding: '2px 4px' },
  toggle:        { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' },
  toggleLabel:   { fontSize: 12, color: '#aaa' },
  delBtn:        { marginLeft: 'auto', background: 'transparent', border: '1px solid #555', borderRadius: 5, color: '#888', fontSize: 13, cursor: 'pointer', padding: '3px 8px' },
  sizeRow:       { display: 'flex', gap: 16, padding: '12px 12px 0' },
  field:         { display: 'flex', alignItems: 'center', gap: 6 },
  label:         { fontSize: 13, color: '#aaa' },
  inputWrap:     { display: 'flex', alignItems: 'center', gap: 4 },
  input:         { width: 72, padding: '6px 8px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 6, color: '#f0f0f0', fontSize: 13 },
  unit:          { fontSize: 12, color: '#888' },
  warning:       { margin: '8px 12px 0', padding: '6px 10px', background: '#78350f', color: '#fde68a', borderRadius: 6, fontSize: 12 },
  blocked:       { margin: '8px 12px 0', padding: '6px 10px', background: '#7f1d1d', color: '#fca5a5', borderRadius: 6, fontSize: 12 },
  overrideToggle:{ display: 'block', margin: '10px 12px 0', background: 'transparent', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 },
  overrideBlock: { margin: '4px 12px', border: '1px dashed #444', borderRadius: 6 },
  masksSection:  { padding: '10px 12px 12px' },
  masksHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  masksTitle:    { fontSize: 12, color: '#888', fontWeight: 600 },
  addMaskBtn:    { padding: '4px 10px', background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  empty:         { fontSize: 12, color: '#555', margin: 0 },
}
