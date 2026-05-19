import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

const HINT_KEY = 'drape_3d_hint_shown'

export default function ViewerToolbar({ onReset, onSetView, activeView }) {
  const [hintVisible, setHintVisible] = useState(
    () => !localStorage.getItem(HINT_KEY),
  )

  useEffect(() => {
    if (!hintVisible) return
    localStorage.setItem(HINT_KEY, '1')
    const timer = setTimeout(() => setHintVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [hintVisible])

  return (
    <>
      <div style={s.toolbar}>
        <button style={s.resetBtn} onClick={onReset} aria-label="Сбросить камеру">
          <RotateCcw size={20} color="#f1f5f9" />
        </button>
        <div style={s.viewBtns}>
          {['front', 'top', 'iso'].map((view) => (
            <button
              key={view}
              style={{ ...s.viewBtn, ...(activeView === view ? s.viewBtnActive : {}) }}
              onClick={() => onSetView(view)}
            >
              {view === 'front' ? 'F' : view === 'top' ? 'T' : 'ISO'}
            </button>
          ))}
        </div>
      </div>
      {hintVisible && (
        <div style={s.hint}>
          Вращайте 1 пальцем · Масштаб — 2 пальца
        </div>
      )}
    </>
  )
}

const s = {
  toolbar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 48,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    background: '#0e1018',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  resetBtn: {
    width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', borderRadius: 10,
    cursor: 'pointer', padding: 0,
  },
  viewBtns: { display: 'flex', gap: 4 },
  viewBtn: {
    width: 40, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, color: '#f1f5f9',
    fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 0,
  },
  viewBtnActive: {
    background: 'rgba(124,58,237,0.25)',
    border: '1px solid #7c3aed',
  },
  hint: {
    position: 'absolute',
    bottom: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 14px',
    background: 'rgba(8,8,15,0.75)',
    borderRadius: 20,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
  },
}
