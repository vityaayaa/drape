// src/components/pixelizer/ActionBar.jsx
export default function ActionBar({
  uiMode, pixelizerMode, hasPhotos, anyStale, sampling,
  onAddPhoto, onShowWalls, onPixelize, onDone, onDelete, onToast,
}) {
  if (uiMode === 'transform') {
    return (
      <div style={s.bar}>
        <button style={s.danger} onClick={onDelete}>Удалить</button>
        <button style={s.primary} onClick={onDone}>Готово ✓</button>
      </div>
    )
  }

  // navigate / pixelize
  const isStale = anyStale && pixelizerMode === 'mosaic'
  const pixelizeLabel = sampling ? '...' : (isStale ? '⟳ Обновить' : 'Пикселизировать →')

  function handlePixelizeClick() {
    if (!hasPhotos) {
      onToast('Добавьте фото для пикселизации')
      return
    }
    onPixelize()
  }

  return (
    <div style={s.bar}>
      <button style={s.ghost} onClick={onAddPhoto}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Фото
      </button>
      <button style={s.ghost} onClick={onShowWalls}>
        Стены ▾
      </button>
      <button
        style={s.primary}
        className={isStale ? 'btn-stale' : ''}
        onClick={handlePixelizeClick}
        disabled={sampling}
      >
        {pixelizeLabel}
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
    borderTop: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  ghost: {
    display: 'flex', alignItems: 'center',
    padding: '0 14px',
    height: 40,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  primary: {
    flex: 1,
    padding: '0 14px',
    height: 40,
    background: 'rgba(129,140,248,0.18)',
    border: '1px solid rgba(129,140,248,0.40)',
    borderRadius: 10,
    color: '#818cf8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  danger: {
    padding: '0 16px',
    height: 40,
    background: 'transparent',
    border: '1px solid rgba(244,63,94,0.30)',
    borderRadius: 10,
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
}
