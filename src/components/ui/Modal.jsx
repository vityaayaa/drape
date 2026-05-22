// src/components/ui/Modal.jsx
// Центрированная модалка (по центру экрана, не bottom-sheet).
// Используется для всех всплывающих окон, чтобы нижняя навигация их не перекрывала.
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import IconButton from './IconButton.jsx'

export default function Modal({ open, onClose, title, children, footer, maxWidth = 440 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  // Портал в body — иначе position:fixed ломается внутри предков с backdrop-filter/transform
  // (модалка прилипала к верху экрана вместо центра).
  return createPortal(
    <div style={s.overlay} onClick={() => onClose?.()}>
      <div style={{ ...s.modal, maxWidth }} onClick={(e) => e.stopPropagation()}>
        {(title || onClose) && (
          <div style={s.header}>
            <h3 style={s.title}>{title}</h3>
            <IconButton variant="ghost" size="sm" icon={X} onClick={() => onClose?.()} ariaLabel="Закрыть" />
          </div>
        )}
        <div style={s.content}>{children}</div>
        {footer && <div style={s.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    animation: 'fadeIn 180ms var(--ease-out)',
  },
  modal: {
    width: '100%',
    background: 'var(--surface-1)',
    border: '1px solid var(--border-strong)',
    borderRadius: 20,
    padding: '18px 20px 20px',
    boxShadow: 'var(--shadow-elev)',
    animation: 'cardSlideDown 220ms var(--ease-out)',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  content: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    lineHeight: 1.6,
    overflowY: 'auto',
    flex: 1,
  },
  footer: {
    flexShrink: 0,
    marginTop: 16,
  },
}
