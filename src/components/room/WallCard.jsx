// src/components/room/WallCard.jsx
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import MaskCard from './MaskCard.jsx'
import TileForm from './TileForm.jsx'

export default function WallCard({ wall, result }) {
  const { updateWall, removeWall, addMask, setTileOverride, clearTileOverride } = useProjectStore()
  const [showOverride, setShowOverride] = useState(Object.keys(wall.tile_overrides).length > 0)

  const hasWarning = result?.warning && !result?.blocked
  const hasBlocked = result?.blocked

  return (
    <div style={{ ...s.card, borderColor: hasBlocked ? '#fca5a5' : hasWarning ? '#fcd34d' : '#e8eaed' }}>
      {/* Заголовок */}
      <div style={s.header}>
        <input
          style={s.nameInput}
          value={wall.name}
          onChange={(e) => updateWall(wall.id, 'name', e.target.value)}
        />
        <label style={s.toggle}>
          <input type="checkbox" checked={wall.wall_active} onChange={() => updateWall(wall.id, 'wall_active', !wall.wall_active)} />
          <span style={s.toggleLabel}>Активна</span>
        </label>
        <label style={s.toggle}>
          <input type="checkbox" checked={wall.mosaic_active} disabled={!wall.wall_active} onChange={() => updateWall(wall.id, 'mosaic_active', !wall.mosaic_active)} />
          <span style={s.toggleLabel}>Мозаика</span>
        </label>
        <button style={s.delBtn} onClick={() => removeWall(wall.id)}>✕</button>
      </div>

      {/* Размеры */}
      <div style={s.sizeRow}>
        <div style={s.field}>
          <label style={s.label}>Длина</label>
          <div style={s.inputWrap}>
            <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.length}
              onChange={(e) => updateWall(wall.id, 'length', e.target.value)} />
            <span style={s.unit}>см</span>
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Высота</label>
          <div style={s.inputWrap}>
            <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.height}
              onChange={(e) => updateWall(wall.id, 'height', e.target.value)} />
            <span style={s.unit}>см</span>
          </div>
        </div>
      </div>

      {/* Лимиты */}
      {hasBlocked && (
        <div style={s.blocked}>Слишком много плиток ({result.total_before_masks.toLocaleString()}). Увеличь размер плитки или уменьши стену.</div>
      )}
      {hasWarning && (
        <div style={s.warning}>На стене {result.total_before_masks.toLocaleString()} плиток — на мобильных может тормозить.</div>
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
            onOverrideChange={(field, value) => setTileOverride(wall.id, field, value)}
            onOverrideClear={(field) => clearTileOverride(wall.id, field)}
          />
        </div>
      )}

      {/* Маски */}
      <div style={s.masksSection}>
        <div style={s.masksHeader}>
          <span style={s.masksTitle}>Маски-препятствия</span>
          <button style={s.addMaskBtn} onClick={() => addMask(wall.id)}>+ Добавить</button>
        </div>
        {wall.masks.length === 0 && <p style={s.empty}>Нет масок</p>}
        {wall.masks.map(mask => <MaskCard key={mask.id} wallId={wall.id} mask={mask} />)}
      </div>
    </div>
  )
}

const s = {
  card:          { background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, marginBottom: 10, marginLeft: 16, marginRight: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  header:        { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e8eaed', flexWrap: 'wrap' },
  nameInput:     { flex: 1, minWidth: 80, background: 'transparent', border: 'none', borderBottom: '1px solid #d1d5db', color: '#111827', fontSize: 14, fontWeight: 600, padding: '2px 4px' },
  toggle:        { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' },
  toggleLabel:   { fontSize: 12, color: '#6b7280' },
  delBtn:        { marginLeft: 'auto', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, color: '#9ca3af', fontSize: 13, cursor: 'pointer', padding: '3px 8px' },
  sizeRow:       { display: 'flex', gap: 16, padding: '12px 14px 0' },
  field:         { display: 'flex', alignItems: 'center', gap: 6 },
  label:         { fontSize: 13, color: '#6b7280' },
  inputWrap:     { display: 'flex', alignItems: 'center', gap: 4 },
  input:         { width: 76, padding: '6px 8px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 7, color: '#111827', fontSize: 13 },
  unit:          { fontSize: 12, color: '#9ca3af' },
  warning:       { margin: '8px 14px 0', padding: '7px 10px', background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', borderRadius: 7, fontSize: 12 },
  blocked:       { margin: '8px 14px 0', padding: '7px 10px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 7, fontSize: 12 },
  overrideToggle:{ display: 'block', margin: '10px 14px 0', background: 'transparent', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 },
  overrideBlock: { margin: '4px 14px', border: '1px dashed #d1d5db', borderRadius: 8 },
  masksSection:  { padding: '10px 14px 14px' },
  masksHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  masksTitle:    { fontSize: 12, color: '#6b7280', fontWeight: 600 },
  addMaskBtn:    { padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  empty:         { fontSize: 12, color: '#d1d5db', margin: 0 },
}
