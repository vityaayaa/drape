// src/components/room/WallCard.jsx
import { useState, useEffect } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import MaskCard from './MaskCard.jsx'
import TileForm from './TileForm.jsx'

export default function WallCard({ wall, result }) {
  const { updateWall, removeWall, addMask, setTileOverride, clearTileOverride } = useProjectStore()
  const [showOverride, setShowOverride] = useState(Object.keys(wall.tile_overrides).length > 0)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!deleteConfirm) return
    const t = setTimeout(() => setDeleteConfirm(false), 3000)
    return () => clearTimeout(t)
  }, [deleteConfirm])

  const hasWarning = result?.warning && !result?.blocked
  const hasBlocked = result?.blocked

  const borderColor = hasBlocked
    ? 'rgba(239,68,68,0.4)'
    : hasWarning
    ? 'rgba(245,158,11,0.35)'
    : 'rgba(255,255,255,0.07)'

  return (
    <div style={{ ...s.card, borderColor }}>
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
        {deleteConfirm ? (
          <div style={s.deleteConfirm}>
            <span style={s.deleteConfirmText}>Удалить?</span>
            <button style={s.confirmYes} onClick={() => removeWall(wall.id)}>Да</button>
            <button style={s.confirmNo} onClick={() => setDeleteConfirm(false)}>Нет</button>
          </div>
        ) : (
          <button style={s.delBtn} onClick={() => setDeleteConfirm(true)} aria-label="Удалить стену">✕</button>
        )}
      </div>

      {/* Размеры */}
      <div style={s.sizeRow}>
        <div style={s.field}>
          <label style={s.fieldLabel}>Длина</label>
          <div style={s.inputWrap}>
            <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.length}
              onChange={(e) => updateWall(wall.id, 'length', e.target.value)} />
            <span style={s.unit}>см</span>
          </div>
        </div>
        <div style={s.field}>
          <label style={s.fieldLabel}>Высота</label>
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
      <div style={s.overrideWrap}>
        <button style={s.overrideBtn} onClick={() => setShowOverride(v => !v)}>
          <span style={s.overrideBtnIcon}>{showOverride ? '▴' : '▾'}</span>
          Параметры плитки стены
        </button>
      </div>
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
  card:              { background: '#0e1018', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, marginBottom: 12, marginLeft: 16, marginRight: 16, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)' },
  header:            { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(124,58,237,0.07)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' },
  nameInput:         { flex: 1, minWidth: 80, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(139,92,246,0.5)', color: '#f1f5f9', fontSize: 14, fontWeight: 600, padding: '2px 4px', outline: 'none' },
  toggle:            { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' },
  toggleLabel:       { fontSize: 12, color: '#64748b' },
  delBtn:            { marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', color: '#475569', fontSize: 14, cursor: 'pointer', flexShrink: 0 },
  deleteConfirm:     { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 },
  deleteConfirmText: { fontSize: 12, color: '#94a3b8' },
  confirmYes:        { height: 32, padding: '0 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  confirmNo:         { height: 32, padding: '0 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#64748b', fontSize: 12, cursor: 'pointer' },
  sizeRow:           { display: 'flex', gap: 16, padding: '12px 14px 4px' },
  field:             { display: 'flex', alignItems: 'center', gap: 6 },
  fieldLabel:        { fontSize: 13, fontWeight: 500, color: '#64748b' },
  inputWrap:         { display: 'flex', alignItems: 'center', gap: 4 },
  input:             { width: 76, height: 44, padding: '0 8px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' },
  unit:              { fontSize: 12, color: '#475569' },
  warning:           { margin: '8px 14px 0', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', borderRadius: 8, fontSize: 12 },
  blocked:           { margin: '8px 14px 0', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 8, fontSize: 12 },
  overrideWrap:      { padding: '10px 14px 0' },
  overrideBtn:       { display: 'flex', alignItems: 'center', gap: 6, width: '100%', height: 40, padding: '0 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' },
  overrideBtnIcon:   { fontSize: 10, color: '#64748b' },
  overrideBlock:     { margin: '8px 14px', background: '#141820', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, overflow: 'hidden' },
  masksSection:      { padding: '10px 14px 14px' },
  masksHeader:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  masksTitle:        { fontSize: 12, fontWeight: 600, color: '#475569' },
  addMaskBtn:        { height: 32, padding: '0 12px', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
  empty:             { fontSize: 12, color: '#334155', margin: 0 },
}
