// src/components/layout/LayoutDoneScreen.jsx
//
// Экран завершения укладки. Появляется когда currentIndex >= totalCount.
// Анимация: scale 0→1 + fade при монтировании.

import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function LayoutDoneScreen({ stats, onReset, onGoToSchema }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const total     = stats?.total ?? 0
  const completed = stats?.completed ?? 0
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div style={{ ...s.root, opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.92)' }}>
      <CheckCircle size={64} color="#22c55e" strokeWidth={1.5} />

      <div style={s.titleGroup}>
        <h2 style={s.title}>Укладка завершена!</h2>
        <p style={s.subtitle}>Все плитки пройдены</p>
      </div>

      {total > 0 && (
        <div style={s.statsCard}>
          <div style={s.statRow}>
            <span style={s.statLabel}>Отмечено уложенными</span>
            <span style={s.statValue}>{completed} / {total}</span>
          </div>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${pct}%` }} />
          </div>
          <span style={s.statPct}>{pct}%</span>
        </div>
      )}

      <div style={s.actions}>
        <button style={s.btnSecondary} onClick={onReset}>
          Начать сначала
        </button>
        {onGoToSchema && (
          <button style={s.btnPrimary} onClick={onGoToSchema}>
            В схему →
          </button>
        )}
      </div>
    </div>
  )
}

const s = {
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: '40px 24px',
    transition: 'opacity 240ms ease-out, transform 240ms ease-out',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    margin: 0,
  },
  statsCard: {
    width: '100%',
    background: '#0e1018',
    borderRadius: 16,
    padding: '16px 20px',
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 600,
    color: '#f1f5f9',
    fontVariantNumeric: 'tabular-nums',
  },
  progressBar: {
    height: 6,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #22c55e)',
    borderRadius: 3,
    transition: 'width 600ms ease-out',
  },
  statPct: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'right',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  btnPrimary: {
    height: 56,
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    border: 'none',
    borderRadius: 14,
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
  },
  btnSecondary: {
    height: 56,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
  },
}
