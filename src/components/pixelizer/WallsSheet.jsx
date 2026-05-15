// src/components/pixelizer/WallsSheet.jsx
import { useProjectStore } from '../../store/projectStore.js'

export default function WallsSheet({ onClose }) {
  const { walls, pixelizer, setVisibleWalls } = useProjectStore()
  const visible = pixelizer.visibleWalls

  function toggle(id) {
    if (visible === null) {
      setVisibleWalls(walls.map(w => w.id).filter(wid => wid !== id))
    } else {
      const next = visible.includes(id) ? visible.filter(wid => wid !== id) : [...visible, id]
      setVisibleWalls(next.length === walls.length ? null : next)
    }
  }

  function showAll() { setVisibleWalls(null) }

  const isVisible = (id) => visible === null || visible.includes(id)

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()} className="sheet-up">
        <div style={s.handle} />
        <p style={s.title}>Видимость стен</p>

        {walls.map(w => (
          <button
            key={w.id}
            style={{ ...s.row, ...(isVisible(w.id) ? {} : s.rowDim) }}
            onClick={() => toggle(w.id)}
          >
            <div style={{ ...s.check, ...(isVisible(w.id) ? s.checkOn : {}) }}>
              {isVisible(w.id) && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span style={s.name}>{w.name}</span>
          </button>
        ))}

        <button style={s.allBtn} onClick={showAll}>Показать все</button>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 300,
    display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    background: 'rgba(12,12,22,0.97)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: '20px 20px 0 0',
    border: '1px solid rgba(255,255,255,0.08)',
    borderBottom: 'none',
    padding: '8px 16px',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
    maxHeight: '65vh',
    overflowY: 'auto',
  },
  handle: {
    width: 36, height: 4,
    background: 'rgba(255,255,255,0.14)',
    borderRadius: 2,
    margin: '0 auto 16px',
  },
  title: { fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 10 },
  row: {
    display: 'flex', alignItems: 'center',
    width: '100%',
    padding: '12px 0',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    gap: 12,
    textAlign: 'left',
    transition: 'opacity 0.15s',
  },
  rowDim: { opacity: 0.45 },
  check: {
    width: 20, height: 20,
    borderRadius: 6,
    border: '1.5px solid rgba(255,255,255,0.20)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  checkOn: {
    background: '#818cf8',
    border: '1.5px solid #818cf8',
    color: '#fff',
  },
  name: { fontSize: 14, color: '#cbd5e1' },
  allBtn: {
    display: 'block', width: '100%',
    marginTop: 14,
    padding: '11px',
    background: 'rgba(129,140,248,0.12)',
    border: '1px solid rgba(129,140,248,0.28)',
    borderRadius: 10,
    color: '#818cf8',
    fontSize: 14,
    cursor: 'pointer',
  },
}
