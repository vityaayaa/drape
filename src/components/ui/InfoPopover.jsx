// src/components/ui/InfoPopover.jsx
// Кнопка-вопрос, открывающая модалку с подсказкой/гайдом.
import { useState, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'
import IconButton from './IconButton.jsx'

export default function InfoPopover({ title, children, ariaLabel = 'Помощь' }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <IconButton
        variant="soft"
        size="sm"
        icon={HelpCircle}
        ariaLabel={ariaLabel}
        onClick={() => setOpen(true)}
      />
      {open && (
        <div style={s.overlay} onClick={() => setOpen(false)}>
          <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.header}>
              <h3 style={s.title}>{title}</h3>
              <IconButton variant="ghost" size="sm" icon={X} onClick={() => setOpen(false)} ariaLabel="Закрыть" />
            </div>
            <div style={s.content}>{children}</div>
          </div>
        </div>
      )}
    </>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    animation: 'fadeIn 200ms var(--ease-out)',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    background: 'var(--surface-1)',
    border: '1px solid var(--border-strong)',
    borderBottom: 'none',
    borderRadius: '20px 20px 0 0',
    padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
    boxShadow: 'var(--shadow-elev)',
    animation: 'sheet-up 280ms var(--ease-out)',
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  },
}
