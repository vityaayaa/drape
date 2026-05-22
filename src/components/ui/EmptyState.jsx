// src/components/ui/EmptyState.jsx
// Универсальная страница-приветствие для пустых вкладок.
import Button from './Button.jsx'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <div style={s.root}>
      <div style={s.iconWrap}>
        {Icon && <Icon size={56} strokeWidth={1.5} color="#a78bfa" />}
        <span style={s.glow} />
      </div>
      <h2 style={s.title}>{title}</h2>
      {description && <p style={s.desc}>{description}</p>}
      <div style={s.actions}>
        {actionLabel && (
          <Button variant="primary" size="lg" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && (
          <Button variant="ghost" size="md" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px 24px',
    textAlign: 'center',
    gap: 16,
  },
  iconWrap: {
    position: 'relative',
    width: 96,
    height: 96,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)',
    marginBottom: 8,
  },
  glow: {
    position: 'absolute',
    inset: -10,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.10), transparent 60%)',
    pointerEvents: 'none',
    filter: 'blur(8px)',
  },
  title: {
    fontSize: 19,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    lineHeight: 1.25,
  },
  desc: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: 0,
    maxWidth: 320,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'stretch',
    minWidth: 240,
    marginTop: 12,
  },
}
