// src/components/pixelizer/ControlsPane.jsx
import { useState, useEffect } from 'react'
import { Plus, Image as ImageIcon } from 'lucide-react'
import PhotoCard from './PhotoCard.jsx'

export default function ControlsPane({
  uiMode, pixelizerMode, hasPhotos, photoGroups, thumbCache,
  onAddPhoto, onOpacityChange, onEditPhoto, onDeletePhoto,
  pixelizer, walls, onPhotoSettingsChange, activePhotoId,
}) {
  if (uiMode === 'transform') {
    return <TransformPane
      activePhotoId={activePhotoId}
      pixelizer={pixelizer}
      walls={walls}
      onPhotoSettingsChange={onPhotoSettingsChange}
    />
  }

  if (!hasPhotos) {
    return <EmptyPhotos onAddPhoto={onAddPhoto} />
  }

  return (
    <div style={s.root}>
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>ФОТО</span>
        <button style={s.addMoreBtn} onClick={onAddPhoto}>
          <Plus size={14} />
          <span>ещё фото</span>
        </button>
      </div>

      {photoGroups.map((group) => (
        <PhotoCard
          key={group.photoId}
          group={group}
          thumbUrl={thumbCache.get(group.photoId)}
          onOpacityChange={onOpacityChange}
          onEdit={onEditPhoto}
          onDelete={onDeletePhoto}
        />
      ))}
    </div>
  )
}

function EmptyPhotos({ onAddPhoto }) {
  return (
    <div style={s.empty}>
      <div style={s.emptyIconWrap}>
        <ImageIcon size={36} color="#a78bfa" strokeWidth={1.5} />
      </div>
      <p style={s.emptyTitle}>Нет фотографий</p>
      <p style={s.emptyHint}>Наложите фото на развёртку и пикселизируйте</p>
      <button style={s.emptyBtn} onClick={onAddPhoto}>
        <Plus size={16} />
        Добавить фото
      </button>
    </div>
  )
}

function TransformPane({ activePhotoId, pixelizer, walls, onPhotoSettingsChange }) {
  const activeWalls = walls.filter(
    (w) => pixelizer.photoSettings[w.id]?.photoId === activePhotoId
  )
  const firstWall = activeWalls[0]
  const ps = firstWall ? pixelizer.photoSettings[firstWall.id] : null

  if (!ps) return <div style={s.transformEmpty}>Выберите фото</div>

  function update(field, value) {
    activeWalls.forEach((w) => {
      const settings = pixelizer.photoSettings[w.id]
      if (settings) onPhotoSettingsChange(w.id, { ...settings, [field]: value })
    })
  }

  return (
    <div style={s.transformRoot}>
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>ПОЗИЦИОНИРОВАНИЕ</span>
      </div>

      <div style={s.stack}>
        <NumberField
          label="Сдвиг X (мм)"
          value={ps.offsetX_mm}
          step={10}
          onChange={(v) => update('offsetX_mm', v)}
        />
        <NumberField
          label="Сдвиг Y (мм)"
          value={ps.offsetY_mm}
          step={10}
          onChange={(v) => update('offsetY_mm', v)}
        />
        <NumberField
          label="Масштаб"
          value={ps.scale}
          step={0.05}
          min={0.1}
          max={10}
          decimals={2}
          onChange={(v) => update('scale', v)}
        />
        <RangeField
          label="Прозрачность"
          value={ps.opacity}
          min={0}
          max={1}
          step={0.05}
          display={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update('opacity', v)}
        />
      </div>

      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>КОРРЕКЦИЯ</span>
      </div>

      <div style={s.stack}>
        <RangeField
          label="Яркость"
          value={ps.brightness ?? 1}
          min={0.5} max={2} step={0.05}
          display={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update('brightness', v)}
        />
        <RangeField
          label="Контраст"
          value={ps.contrast ?? 1}
          min={0.5} max={2} step={0.05}
          display={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update('contrast', v)}
        />
        <RangeField
          label="Насыщенность"
          value={ps.saturation ?? 1}
          min={0} max={3} step={0.05}
          display={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update('saturation', v)}
        />
      </div>
    </div>
  )
}

function NumberField({ label, value, step, min, max, decimals = 0, onChange }) {
  const fmt = (v) => (decimals > 0 ? v.toFixed(decimals) : String(Math.round(v)))
  const [localVal, setLocalVal] = useState(() => fmt(value))

  useEffect(() => { setLocalVal(fmt(value)) }, [value])

  function commit() {
    const v = parseFloat(localVal)
    if (isNaN(v)) {
      setLocalVal(fmt(value))
      return
    }
    let clamped = v
    if (min !== undefined) clamped = Math.max(min, clamped)
    if (max !== undefined) clamped = Math.min(max, clamped)
    onChange(clamped)
  }

  return (
    <div style={s.fieldRow}>
      <label style={s.fieldLabel}>{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
        style={s.numInput}
      />
    </div>
  )
}

function RangeField({ label, value, min, max, step, display, onChange }) {
  return (
    <div style={s.rangeBlock}>
      <div style={s.rangeHeader}>
        <label style={s.fieldLabel}>{label}</label>
        <span style={s.fieldValue}>{display(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={s.rangeInput}
      />
    </div>
  )
}

const s = {
  root: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 6, paddingBottom: 8 },
  transformRoot: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 6, paddingBottom: 8 },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px 8px',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-disabled)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  addMoreBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 32,
    padding: '0 12px',
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    borderRadius: 999,
    color: 'var(--accent-light)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 32px',
    textAlign: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.20), transparent 70%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  emptyHint: { fontSize: 13, color: 'var(--text-hint)', lineHeight: 1.5, marginBottom: 20, maxWidth: 260 },
  emptyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 24px',
    height: 44,
    background: 'var(--accent-grad)',
    border: 'none',
    borderRadius: 12,
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: 'var(--accent-shadow)',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '0 16px 12px',
  },
  transformEmpty: { padding: 24, color: 'var(--text-disabled)', fontSize: 14, textAlign: 'center' },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: { fontSize: 13, color: 'var(--text-secondary)', flex: 1 },
  fieldValue: { fontSize: 12, color: 'var(--accent-light)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
  numInput: {
    width: 110,
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.30)',
    border: '1px solid var(--border-strong)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  rangeBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  rangeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rangeInput: { width: '100%', accentColor: 'var(--accent-light)', marginTop: 4, cursor: 'pointer' },
  gestureHint: { fontSize: 11, color: 'var(--text-disabled)', textAlign: 'center', padding: '0 16px 12px', lineHeight: 1.5 },
}
