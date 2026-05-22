// src/components/export/SpecList.jsx
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { withSurplus } from '../../utils/buildPalette.js'

export default function SpecList({ palette, surplus }) {
  const [expanded, setExpanded] = useState({})

  return (
    <div style={s.list}>
      {palette.map((entry) => {
        const isOpen = !!expanded[entry.index]
        const withS = withSurplus(entry.count, surplus)
        return (
          <div key={entry.hex} style={s.block}>
            <button style={s.row} onClick={() => setExpanded((p) => ({ ...p, [entry.index]: !isOpen }))}>
              <span style={{ ...s.swatch, background: entry.hex }} />
              <span style={s.num}>#{entry.index}</span>
              <span style={s.hex}>{entry.hex}</span>
              <span style={s.spacer} />
              <span style={s.count}>{entry.count} шт.</span>
              {surplus > 0 && (
                <span style={s.surplus}>→ {withS}</span>
              )}
              {isOpen
                ? <ChevronUp size={16} color="var(--text-hint)" />
                : <ChevronDown size={16} color="var(--text-hint)" />
              }
            </button>
            {isOpen && (
              <div style={s.breakdown}>
                {entry.originalCount > 1 && (
                  <div style={s.byWallRow}>
                    <span style={s.subLabel}>Объединено цветов</span>
                    <span style={s.subValue}>{entry.originalCount}</span>
                  </div>
                )}
                {entry.byWall.map((bw) => (
                  <div key={bw.wallId} style={s.byWallRow}>
                    <span style={s.byWallName}>{bw.wallName}</span>
                    <span style={s.byWallCount}>{bw.count} шт.</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const s = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  block: { borderRadius: 8, overflow: 'hidden' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 8px',
    background: 'transparent',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: '1px solid var(--border-strong)',
    flexShrink: 0,
  },
  num: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--accent-light)',
    minWidth: 24,
  },
  hex: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-hint)',
  },
  spacer: { flex: 1 },
  count: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  surplus: {
    fontSize: 11,
    color: 'var(--success)',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  breakdown: {
    padding: '6px 8px 10px 40px',
    background: 'rgba(0,0,0,0.20)',
  },
  byWallRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
  },
  byWallName:  { fontSize: 11, color: 'var(--text-hint)' },
  byWallCount: { fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' },
  subLabel:    { fontSize: 11, color: 'var(--text-disabled)', fontStyle: 'italic' },
  subValue:    { fontSize: 11, color: 'var(--accent-light)', fontWeight: 600 },
}
