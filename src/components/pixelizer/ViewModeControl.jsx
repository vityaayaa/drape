// src/components/pixelizer/ViewModeControl.jsx
export default function ViewModeControl({ eyeMode, onChange, isMosaic }) {
  const options = isMosaic
    ? [
        { value: 'photo+grid', label: 'Фото+Сетка' },
        { value: 'mosaic',     label: 'Мозаика' },
      ]
    : [
        { value: 'photo',      label: 'Фото' },
        { value: 'photo+grid', label: 'Сетка' },
        { value: 'grid',       label: 'Только сетка' },
      ]

  return (
    <div style={s.row}>
      {options.map(opt => (
        <button
          key={opt.value}
          style={{
            ...s.btn,
            ...(eyeMode === opt.value ? s.active : {}),
          }}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const s = {
  row: {
    display: 'flex',
    gap: 6,
    padding: '0 16px',
  },
  btn: {
    flex: 1,
    padding: '8px 6px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  active: {
    background: 'rgba(129,140,248,0.18)',
    border: '1px solid rgba(129,140,248,0.40)',
    color: '#818cf8',
  },
}
