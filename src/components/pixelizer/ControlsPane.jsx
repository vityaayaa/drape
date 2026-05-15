// src/components/pixelizer/ControlsPane.jsx
import PhotoCard from './PhotoCard.jsx'
import ViewModeControl from './ViewModeControl.jsx'

export default function ControlsPane({
  uiMode, pixelizerMode, hasPhotos, photoGroups, thumbCache,
  eyeMode, onEyeMode, onAddPhoto, onOpacityChange, onEditPhoto,
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

  const isMosaic = pixelizerMode === 'mosaic'

  return (
    <div style={s.root}>
      {/* Section: photos */}
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>Фото</span>
        <button style={s.addBtn} onClick={onAddPhoto}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {photoGroups.map(group => (
        <PhotoCard
          key={group.photoId}
          group={group}
          thumbUrl={thumbCache.get(group.photoId)}
          onOpacityChange={onOpacityChange}
          onEdit={onEditPhoto}
        />
      ))}

      {/* Section: view mode */}
      {(hasPhotos || isMosaic) && (
        <>
          <div style={{ ...s.sectionHeader, marginTop: 6 }}>
            <span style={s.sectionTitle}>Вид</span>
          </div>
          <ViewModeControl
            eyeMode={eyeMode}
            onChange={onEyeMode}
            isMosaic={isMosaic}
          />
        </>
      )}
    </div>
  )
}

function EmptyPhotos({ onAddPhoto }) {
  return (
    <div style={s.empty}>
      {/* Wall illustration SVG */}
      <svg width="64" height="48" viewBox="0 0 64 48" fill="none" style={{ marginBottom: 14, opacity: 0.3 }}>
        <rect x="2" y="6" width="18" height="40" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <rect x="24" y="14" width="16" height="32" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <rect x="44" y="2" width="18" height="44" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <line x1="2" y1="46" x2="62" y2="46" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 3"/>
      </svg>
      <p style={s.emptyTitle}>Нет фотографий</p>
      <p style={s.emptyHint}>Наложите фото на развёртку и пикселизируйте</p>
      <button style={s.emptyBtn} onClick={onAddPhoto}>
        + Добавить фото
      </button>
    </div>
  )
}

function TransformPane({ activePhotoId, pixelizer, walls, onPhotoSettingsChange }) {
  const activeWalls = walls.filter(
    w => pixelizer.photoSettings[w.id]?.photoId === activePhotoId
  )
  const firstWall = activeWalls[0]
  const ps = firstWall ? pixelizer.photoSettings[firstWall.id] : null

  if (!ps) return <div style={s.transformEmpty}>Выберите фото</div>

  function update(field, value) {
    activeWalls.forEach(w => {
      const settings = pixelizer.photoSettings[w.id]
      if (settings) onPhotoSettingsChange(w.id, { ...settings, [field]: value })
    })
  }

  return (
    <div style={s.root}>
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>Позиционирование</span>
      </div>

      <div style={s.transformGrid}>
        <Field label="Сдвиг X (мм)" value={ps.offsetX_mm} step={10}
          onChange={v => update('offsetX_mm', v)} />
        <Field label="Сдвиг Y (мм)" value={ps.offsetY_mm} step={10}
          onChange={v => update('offsetY_mm', v)} />
        <Field label="Масштаб" value={ps.scale} step={0.05} min={0.1} max={10} decimals={2}
          onChange={v => update('scale', v)} />
        <div style={s.fieldGroup}>
          <label style={s.fieldLabel}>Прозрачность</label>
          <input
            type="range" min="0" max="1" step="0.05"
            value={ps.opacity}
            onChange={e => update('opacity', parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#818cf8', marginTop: 6 }}
          />
          <span style={s.fieldValue}>{Math.round(ps.opacity * 100)}%</span>
        </div>
      </div>

      <p style={s.gestureHint}>
        Жест 1 пальца — двигать фото · пинч — масштабировать
      </p>
    </div>
  )
}

function Field({ label, value, step, min, max, decimals = 0, onChange }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.fieldLabel}>{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
        onChange={e => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        style={s.numInput}
      />
    </div>
  )
}

const s = {
  root: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 6, paddingBottom: 8 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px 6px',
  },
  sectionTitle: { fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' },
  addBtn: {
    width: 28, height: 28,
    background: 'rgba(129,140,248,0.15)',
    border: '1px solid rgba(129,140,248,0.30)',
    borderRadius: 7,
    color: '#818cf8',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  empty: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px 32px',
    textAlign: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
  emptyHint: { fontSize: 13, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, marginBottom: 20, maxWidth: 220 },
  emptyBtn: {
    padding: '10px 24px',
    background: 'rgba(129,140,248,0.12)',
    border: '1px solid rgba(129,140,248,0.30)',
    borderRadius: 12,
    color: '#818cf8',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  transformGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 12px' },
  transformEmpty: { padding: 24, color: '#475569', fontSize: 14, textAlign: 'center' },
  fieldGroup: { display: 'flex', flexDirection: 'column' },
  fieldLabel: { fontSize: 11, color: '#475569', marginBottom: 4 },
  fieldValue: { fontSize: 11, color: '#64748b', marginTop: 2, alignSelf: 'flex-end' },
  numInput: {
    padding: '8px 10px',
    background: 'rgba(0,0,0,0.30)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    color: '#f1f5f9',
    fontSize: 13,
    outline: 'none',
  },
  gestureHint: { fontSize: 11, color: '#334155', textAlign: 'center', padding: '0 16px', lineHeight: 1.5 },
}
