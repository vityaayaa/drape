// src/components/layout/LayoutTileCard.jsx
//
// Главный блок текущей плитки в режиме укладки.
// Цветной квадрат 72×72 + метаданные + кнопка «Отметить».
// Анимация: fade-crossfade 80ms при смене плитки (управляется снаружи через key/opacity).

import { useState, useEffect, useCallback } from 'react'

export default function LayoutTileCard({
  currentTileData,
  totalCount,
  currentIndex,
  noPalette,      // true если нет пикселизации
  isCompleted,
  onMarkCompleted,
}) {
  const [visible, setVisible] = useState(true)

  // Fade при смене currentIndex
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 40)
    return () => clearTimeout(t)
  }, [currentIndex])

  if (!currentTileData) {
    return (
      <div style={s.card}>
        <div style={s.placeholder}>Нет плиток</div>
      </div>
    )
  }

  const {
    wallName = '—',
    rowFromFloor = 0,
    col = 0,
    colorHex = '#888888',
    colorIndex = null,
  } = currentTileData

  const colorBg = colorHex ?? '#888888'
  const completed = isCompleted ?? false

  return (
    <div style={{ ...s.card, opacity: visible ? 1 : 0, transition: 'opacity 40ms ease-in-out' }}>
      {/* Предупреждение: нет пикселизации */}
      {noPalette && (
        <div style={s.noPaletteWarning}>
          ⚠ Цвета не назначены — пикселизируйте в разделе Фото
        </div>
      )}

      <div style={s.row}>
        {/* Цветной квадрат */}
        <div
          style={{
            ...s.colorSwatch,
            background: colorBg,
            outline: completed ? '2px solid #22c55e' : 'none',
          }}
          aria-label={`Цвет плитки ${colorBg}`}
        />

        {/* Метаданные */}
        <div style={s.meta}>
          <div style={s.colorLabel}>
            {colorIndex != null
              ? <><span style={s.colorNum}>Цвет №{colorIndex}</span></>
              : <span style={s.colorNum}>Без цвета</span>
            }
            <span style={s.colorHex}>{colorBg}</span>
          </div>
          <div style={s.wallName}>{wallName}</div>
          <div style={s.coords}>
            Ряд {rowFromFloor + 1} от пола · Плитка {col + 1}
          </div>
        </div>
      </div>

      {/* Кнопка «Отметить» */}
      <button
        style={{ ...s.markBtn, ...(completed ? s.markBtnDone : {}) }}
        onClick={onMarkCompleted}
        aria-label={completed ? 'Снять отметку' : 'Отметить как уложенную'}
      >
        {completed ? '✓ Уложена' : 'Отметить'}
      </button>
    </div>
  )
}

const s = {
  card: {
    background: '#0e1018',
    borderRadius: 16,
    padding: '12px 16px',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  noPaletteWarning: {
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: 500,
  },
  row: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  colorSwatch: {
    width: 72,
    height: 72,
    borderRadius: 12,
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.1)',
    outlineOffset: 2,
  },
  meta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  colorLabel: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  colorNum: {
    fontSize: 18,
    fontWeight: 600,
    color: '#f1f5f9',
    lineHeight: 1.2,
  },
  colorHex: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  wallName: {
    fontSize: 15,
    fontWeight: 500,
    color: '#f1f5f9',
    marginTop: 2,
  },
  coords: {
    fontSize: 13,
    color: '#94a3b8',
  },
  markBtn: {
    alignSelf: 'flex-end',
    height: 36,
    padding: '0 12px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#64748b',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 150ms, border-color 150ms',
  },
  markBtnDone: {
    color: '#22c55e',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  placeholder: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    padding: '20px 0',
  },
}
