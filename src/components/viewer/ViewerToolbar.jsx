import { useState, useEffect } from 'react'
import { RotateCcw, Square, Layers, Box } from 'lucide-react'

const HINT_KEY = 'drape_3d_hint_shown'

const VIEWS = [
  { id: 'default', label: 'Обзор',   icon: Box },
  { id: 'front',   label: 'Спереди', icon: Square },
  { id: 'top',     label: 'Сверху',  icon: Layers },
]

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
        <button style={s.resetBtn} onClick={onReset} aria-label="Сбросить камеру" title="Сбросить камеру">
          <RotateCcw size={18} />
        </button>
        <div style={s.viewBtns}>
          {VIEWS.map((view) => {
            const Icon = view.icon
            const isActive = activeView === view.id
            return (
              <button
                key={view.id}
                style={{ ...s.viewBtn, ...(isActive ? s.viewBtnActive : {}) }}
                onClick={() => onSetView(view.id)}
                title={view.label}
              >
                <Icon size={14} />
                <span>{view.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      {hintVisible && (
        <div style={s.hint}>
          Вращайте 1 пальцем · Масштаб — 2 пальца · Двойной тап — повернуть вокруг точки
        </div>
      )}
    </>
  )
}

const s = {
  toolbar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 52,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    background: 'rgba(8,8,15,0.86)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
    gap: 8,
  },
  resetBtn: {
    width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  viewBtns: {
    display: 'flex',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  viewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    height: 40,
    padding: '0 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text-secondary)',
    fontSize: 12, fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  viewBtnActive: {
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    color: 'var(--accent-light)',
    boxShadow: '0 0 12px rgba(124,58,237,0.25)',
  },
  hint: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 16px',
    background: 'rgba(8,8,15,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    color: 'var(--text-secondary)',
    fontSize: 12,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
  },
}
