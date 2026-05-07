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
                <td style={{ ...s.tdNum, color: r?.blocked ? '#dc2626' : r?.warning ? '#d97706' : '#111827' }}>
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
              <td style={{ ...s.tdNum, fontWeight: 700 }}>{totalTiles.toLocaleString()}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

const s = {
  block:   { padding: '18px 20px', borderTop: '1px solid #e8eaed', background: '#fff', marginTop: 10 },
  heading: { fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#111827', letterSpacing: '-0.01em' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:      { textAlign: 'left', padding: '6px 8px', color: '#9ca3af', borderBottom: '1px solid #e8eaed', fontWeight: 500, fontSize: 12 },
  tr:      { borderBottom: '1px solid #f3f4f6' },
  td:      { padding: '8px 8px', color: '#374151' },
  tdNum:   { padding: '8px 8px', textAlign: 'right', color: '#111827', fontFamily: 'ui-monospace, monospace', fontSize: 13 },
  footRow: { borderTop: '2px solid #e8eaed' },
}
