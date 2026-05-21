// src/components/layout/LayoutModeSwitch.jsx
//
// Pill-переключатель режима укладки: «По рядам» / «По цветам».
// При переключении вызывает onModeChange — родитель перестраивает sequence.

export default function LayoutModeSwitch({ mode, onModeChange }) {
  return (
    <div style={s.root}>
      <button
        style={{ ...s.pill, ...(mode === 'byRow' ? s.pillActive : s.pillInactive) }}
        onClick={() => mode !== 'byRow' && onModeChange('byRow')}
        aria-pressed={mode === 'byRow'}
        aria-label="Режим по рядам"
      >
        По рядам
      </button>
      <button
        style={{ ...s.pill, ...(mode === 'byColor' ? s.pillActive : s.pillInactive) }}
        onClick={() => mode !== 'byColor' && onModeChange('byColor')}
        aria-pressed={mode === 'byColor'}
        aria-label="Режим по цветам"
      >
        По цветам
      </button>
    </div>
  )
}

const s = {
  root: {
    display: 'flex',
    gap: 4,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 3,
  },
  pill: {
    height: 32,
    padding: '0 14px',
    borderRadius: 17,
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
    whiteSpace: 'nowrap',
  },
  pillActive: {
    background: 'rgba(124,58,237,0.35)',
    color: '#a78bfa',
  },
  pillInactive: {
    background: 'transparent',
    color: '#64748b',
  },
}
