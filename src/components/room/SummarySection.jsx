// src/components/room/SummarySection.jsx
import { useProjectStore } from '../../store/projectStore.js'

export default function SummarySection({ results }) {
  const { walls } = useProjectStore()

  if (walls.length === 0) return null

  const activeResults = results.filter(Boolean)
  const totalTiles = activeResults.reduce((sum, r) => sum + r.total, 0)

  return (
    <div style={s.block}>
      <h2 style={s.heading}>Итог</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Стена</th>
            <th style={s.th}>Колонок</th>
            <th style={s.th}>Рядов</th>
            <th style={s.th}>Плиток</th>
          </tr>
        </thead>
        <tbody>
          {walls.map((wall, i) => {
            const r = results[i]
            return (
              <tr key={wall.id} style={s.tr}>
                <td style={s.td}>{wall.name}</td>
                <td style={s.tdNum}>{r ? r.columns : '—'}</td>
                <td style={s.tdNum}>{r ? r.rows : '—'}</td>
                <td style={{ ...s.tdNum, color: r?.blocked ? '#f87171' : r?.warning ? '#fbbf24' : '#f1f5f9' }}>
                  {r ? r.total.toLocaleString() : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
        {activeResults.length > 0 && (
          <tfoot>
            <tr style={s.footRow}>
              <td style={s.td}>Итого</td>
              <td style={s.tdNum}>—</td>
              <td style={s.tdNum}>—</td>
              <td style={{ ...s.tdNum, fontWeight: 700, color: '#a78bfa' }}>{totalTiles.toLocaleString()}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

const s = {
  block:   { padding: '18px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginTop: 10 },
  heading: { fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#f1f5f9', letterSpacing: '-0.01em' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:      { textAlign: 'left', padding: '6px 8px', color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 500, fontSize: 12 },
  tr:      { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td:      { padding: '8px 8px', color: '#94a3b8' },
  tdNum:   { padding: '8px 8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'ui-monospace, monospace', fontSize: 13 },
  footRow: { borderTop: '2px solid rgba(255,255,255,0.1)' },
}
