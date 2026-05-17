// src/components/pixelizer/Toast.jsx
import { useEffect, useRef, useState } from 'react'

export default function Toast({ message }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!message) return
    setExiting(false)
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setExiting(true)
      setTimeout(() => setVisible(false), 200)
    }, 3000)
    return () => clearTimeout(timerRef.current)
  }, [message])

  if (!visible) return null

  return (
    <div
      className={exiting ? 'toast-exit' : 'toast-enter'}
      style={s.toast}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span style={s.text}>{message}</span>
    </div>
  )
}

const s = {
  toast: {
    position: 'fixed',
    top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 18px',
    background: 'rgba(12,12,22,0.93)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 14,
    boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
    whiteSpace: 'nowrap',
  },
  text: { fontSize: 13, color: '#f1f5f9', fontWeight: 500 },
}
