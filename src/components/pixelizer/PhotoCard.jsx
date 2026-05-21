// src/components/pixelizer/PhotoCard.jsx
import { Pencil, Trash2 } from 'lucide-react'

export default function PhotoCard({ group, thumbUrl, onOpacityChange, onEdit, onDelete }) {
  const { photoId, walls, settings } = group
  const opacity = settings?.opacity ?? 1.0
  const wallNames = walls.map((w) => w.name).join(', ')

  return (
    <div style={s.card}>
      {/* Квадрат с фото (object-fit: contain → letterbox для горизонтальных,
          object-fit: cover не используем чтобы не шакалить вертикальные кропом сверху/снизу).
          Используем cover для обрезки строго до квадрата — это и есть требование. */}
      <div style={s.thumbWrap}>
        {thumbUrl ? (
          <img src={thumbUrl} alt="" style={s.thumbImg} />
        ) : (
          <div style={s.thumbPlaceholder} />
        )}
      </div>

      <div style={s.body}>
        <div style={s.metaRow}>
          <span style={s.metaLabel}>Стены</span>
          <span style={s.metaValue}>{wallNames || '—'}</span>
        </div>

        <div style={s.opacityRow}>
          <span style={s.opacityLabel}>Прозрачность</span>
          <span style={s.opacityValue}>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0" max="1" step="0.05"
          value={opacity}
          onChange={(e) => onOpacityChange(photoId, parseFloat(e.target.value))}
          style={s.slider}
        />

        <div style={s.actions}>
          <button
            style={s.editBtn}
            onClick={() => onEdit(photoId)}
            aria-label="Редактировать фото"
          >
            <Pencil size={16} />
            <span>Редактировать</span>
          </button>
          <button
            style={s.deleteBtn}
            onClick={() => onDelete(photoId)}
            aria-label="Удалить фото"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

const THUMB_SIZE = 96

const s = {
  card: {
    margin: '0 16px 10px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 12,
    display: 'flex',
    gap: 12,
    alignItems: 'stretch',
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    flexShrink: 0,
    borderRadius: 10,
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',  // обрезаем квадратом, не шакалим
    display: 'block',
  },
  thumbPlaceholder: { width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' },
  body: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    minWidth: 0,
  },
  metaLabel: { fontSize: 11, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 },
  metaValue: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  opacityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  opacityLabel: { fontSize: 11, color: 'var(--text-hint)' },
  opacityValue: { fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
  slider: { width: '100%', accentColor: 'var(--accent-light)', cursor: 'pointer' },
  actions: {
    display: 'flex',
    gap: 6,
    marginTop: 4,
  },
  editBtn: {
    flex: 1,
    height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    borderRadius: 10,
    color: 'var(--accent-light)',
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(239,68,68,0.10)',
    border: '1px solid rgba(239,68,68,0.30)',
    borderRadius: 10,
    color: '#f87171',
    cursor: 'pointer',
    flexShrink: 0,
  },
}
