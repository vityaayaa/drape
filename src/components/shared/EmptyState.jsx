// src/components/shared/EmptyState.jsx
export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div style={s.root}>
      <div style={s.icon}>{icon}</div>
      <p style={s.title}>{title}</p>
      {subtitle && <p style={s.subtitle}>{subtitle}</p>}
      {actionLabel && onAction && (
        <button style={s.btn} onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}

const s = {
  root: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 32, textAlign: 'center',
  },
  icon:     { marginBottom: 4 },
  title:    { fontSize: 15, color: '#94a3b8', margin: 0 },
  subtitle: { fontSize: 12, color: '#64748b', margin: 0, maxWidth: 240, lineHeight: 1.5 },
  btn: {
    marginTop: 8, height: 40, padding: '0 20px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, color: '#f1f5f9', fontSize: 14, cursor: 'pointer',
  },
}
