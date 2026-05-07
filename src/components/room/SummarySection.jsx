// src/components/room/SummarySection.jsx
import { useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'

export default function SummarySection() {
  const { tile, walls, corners } = useProjectStore()

  const results = useMemo(
    () => calculateGrid(tile, walls, corners),
    [tile, walls, corners]
  )

  const activeResults = results.filter(Boolean)

  if (walls.length === 0) return null

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
                <td style={{ ...s.tdNum, color: r?.blocked ? '#ef4444' : r?.warning ? '#f59e0b' : '#f0f0f0' }}>
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
              <td style={s.tdNum}>{totalTiles.toLocaleString()}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

const s = {
  block:   { padding: '16px', borderTop: '1px solid #333' },
  heading: { fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#f0f0f0' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:      { textAlign: 'left', padding: '6px 8px', color: '#888', borderBottom: '1px solid #333', fontWeight: 500 },
  tr:      { borderBottom: '1px solid #2a2a2a' },
  td:      { padding: '7px 8px', color: '#ccc' },
  tdNum:   { padding: '7px 8px', textAlign: 'right', color: '#f0f0f0', fontFamily: 'monospace' },
  footRow: { borderTop: '2px solid #444' },
}
