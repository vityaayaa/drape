// src/components/ui/IconButton.jsx
// Квадратная иконочная кнопка. variant = solid | soft | ghost | danger

const VARIANTS = {
  solid: {
    background: 'var(--accent-grad)',
    border: 'none',
    color: '#f1f5f9',
    boxShadow: 'var(--accent-shadow)',
  },
  soft: {
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    color: 'var(--accent-light)',
  },
  ghost: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
  danger: {
    background: 'var(--error-soft)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: '#fca5a5',
  },
}

const SIZES = { sm: 32, md: 40, lg: 48 }

export default function IconButton({
  variant = 'ghost',
  size = 'md',
  icon: Icon,
  disabled,
  ariaLabel,
  style,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.ghost
  const side = SIZES[size] || SIZES.md
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: side,
        height: side,
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast)',
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
        ...v,
        ...style,
      }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
      onPointerUp={(e) => { e.currentTarget.style.transform = '' }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = '' }}
      {...rest}
    >
      {Icon && <Icon size={iconSize} />}
    </button>
  )
}
