// src/components/pixelizer/PhotoCard.jsx
export default function PhotoCard({ group, thumbUrl, onOpacityChange, onEdit }) {
  const { photoId, walls, settings } = group
  const opacity = settings?.opacity ?? 1.0
  const wallNames = walls.map(w => w.name).join(', ')

  return (
    <div style={s.card}>
      <div style={s.top}>
        {/* Thumbnail */}
        <div style={s.thumb}>
          {thumbUrl
            ? <img src={thumbUrl} alt="" style={s.thumbImg} />
            : <div style={s.thumbPlaceholder} />
          }
        </div>

        {/* Info */}
        <div style={s.info}>
          <div style={s.wallNames}>{wallNames}</div>
          <div style={s.opacityRow}>
            <span style={s.opacityLabel}>Прозрачность</span>
            <span style={s.opacityValue}>{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={opacity}
            onChange={e => onOpacityChange(photoId, parseFloat(e.target.value))}
            style={s.slider}
          />
        </div>

        {/* Edit button */}
        <button style={s.editBtn} onClick={() => onEdit(photoId)} title="Редактировать">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

const s = {
  card: {
    margin: '0 16px 8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '10px 12px',
  },
  top: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  thumb: {
    width: 48, height: 36,
    borderRadius: 6,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbPlaceholder: { width: '100%', height: '100%', background: '#2a2a3a' },
  info: { flex: 1, minWidth: 0 },
  wallNames: { fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  opacityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  opacityLabel: { fontSize: 11, color: '#475569' },
  opacityValue:  { fontSize: 11, color: '#64748b', fontVariantNumeric: 'tabular-nums' },
  slider: { width: '100%', accentColor: '#818cf8', cursor: 'pointer' },
  editBtn: {
    width: 32, height: 32,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    alignSelf: 'center',
  },
}
