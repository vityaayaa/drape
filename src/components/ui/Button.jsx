// src/components/ui/Button.jsx
// Универсальная кнопка: variant = primary | secondary | ghost | danger, size = sm | md | lg

const VARIANTS = {
  primary: {
    background: 'var(--accent-grad)',
    border: 'none',
    color: '#f1f5f9',
    boxShadow: 'var(--accent-shadow)',
  },
  secondary: {
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    color: 'var(--accent-light)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-secondary)',
  },
  danger: {
    background: 'var(--error-soft)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: '#fca5a5',
  },
}

const SIZES = {
  sm: { height: 36, fontSize: 13, padding: '0 12px', radius: 10 },
  md: { height: 44, fontSize: 14, padding: '0 16px', radius: 12 },
  lg: { height: 48, fontSize: 15, padding: '0 18px', radius: 12 },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  disabled,
  loading,
  children,
  style,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary
  const s = SIZES[size] || SIZES.md

  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: s.height,
        padding: s.padding,
        borderRadius: s.radius,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: 'var(--font-ui)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.4 : loading ? 0.65 : 1,
        transition: 'transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast)',
        WebkitTapHighlightColor: 'transparent',
        whiteSpace: 'nowrap',
        ...v,
        ...style,
      }}
      onPointerDown={(e) => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.97)' }}
      onPointerUp={(e) => { e.currentTarget.style.transform = '' }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = '' }}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} style={{ flexShrink: 0 }} />}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} style={{ flexShrink: 0 }} />}
    </button>
  )
}
