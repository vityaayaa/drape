// src/components/pixelizer/ActionBar.jsx
import { useState } from 'react'
import { RotateCw, ArrowRight, Check, Trash2, Atom } from 'lucide-react'

export default function ActionBar({
  uiMode, pixelizerMode, hasPhotos, anyStale, sampling,
  onPixelize, onDone, onDelete, onToast,
  onQuantize, quantizeActive,
}) {
  const [deleteTap, setDeleteTap] = useState(false)

  if (uiMode === 'transform') {
    return (
      <div style={s.bar}>
        <button
          style={s.danger}
          className={deleteTap ? 'anim-delete-flash' : ''}
          onPointerDown={() => { setDeleteTap(true); setTimeout(() => setDeleteTap(false), 160) }}
          onClick={onDelete}
        >
          <Trash2 size={16} />
          <span>Удалить</span>
        </button>
        <button style={s.primary} onClick={onDone}>
          <Check size={18} />
          <span>Готово</span>
        </button>
      </div>
    )
  }

  // navigate / pixelize
  const isStale = anyStale && pixelizerMode === 'mosaic'

  function handlePixelizeClick() {
    if (!hasPhotos) {
      onToast('Добавьте фото для пикселизации')
      return
    }
    onPixelize()
  }

  const Icon = sampling ? null : isStale ? RotateCw : ArrowRight
  const label = sampling ? 'Обрабатываю…' : isStale ? 'Обновить' : 'Пикселизировать'

  return (
    <div style={s.bar}>
      <button
        style={{ ...s.primary, opacity: hasPhotos ? 1 : 0.55 }}
        className={sampling ? 'btn-pixelize-loading' : (isStale ? 'btn-stale' : '')}
        onClick={handlePixelizeClick}
        disabled={sampling}
      >
        {Icon && <Icon size={18} />}
        <span>{label}</span>
      </button>
      <button
        style={{ ...s.atomBtn, ...(quantizeActive ? s.atomBtnActive : {}) }}
        onClick={onQuantize}
        aria-label="Квантизация цветов"
        title="Квантизация цветов"
      >
        <Atom size={20} />
      </button>
    </div>
  )
}

const s = {
  bar: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px',
    paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
    background: 'rgba(8,8,15,0.88)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  primary: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '0 16px',
    height: 48,
    background: 'var(--accent-grad)',
    border: 'none',
    borderRadius: 12,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--accent-shadow)',
    transition: 'all 0.15s',
    letterSpacing: '-0.01em',
  },
  danger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '0 16px',
    height: 48,
    background: 'rgba(239,68,68,0.10)',
    border: '1px solid rgba(239,68,68,0.30)',
    borderRadius: 12,
    color: '#f87171',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  atomBtn: {
    width: 48, height: 48,
    flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-strong)',
    borderRadius: 12,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  atomBtnActive: {
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    color: 'var(--accent-light)',
    boxShadow: '0 0 12px rgba(124,58,237,0.25)',
  },
}
