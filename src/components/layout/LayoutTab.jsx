// src/components/layout/LayoutTab.jsx
import { Grid3x3 } from 'lucide-react'

export default function LayoutTab() {
  const rows = [
    { label: 'Стена 1',    value: '48 шт' },
    { label: 'Стена 2',    value: '32 шт' },
    { label: 'Итого +10%', value: '88 шт' },
  ]

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Grid3x3 size={36} color="#818cf8" style={{ opacity: 0.4, marginBottom: 12 }} />
        <p style={s.title}>План покупки</p>
        <span style={s.badge}>В разработке</span>

        {/* Wireframe mini table */}
        <div style={s.wireframe}>
          {rows.map((row) => (
            <div key={row.label} style={s.row}>
              <span style={s.rowLabel}>{row.label}</span>
              <span style={s.rowValue}>{row.value}</span>
            </div>
          ))}
        </div>

        <ul style={s.features}>
          <li>Подсчёт плитки по стенам</li>
          <li>Запас на бой (+10%)</li>
          <li>Список для магазина</li>
        </ul>
      </div>
    </div>
  )
}

const s = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', padding: 24, background: '#08080f',
  },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, maxWidth: 280, width: '100%', textAlign: 'center',
  },
  title:  { fontSize: 18, fontWeight: 600, color: '#f1f5f9', margin: 0 },
  badge: {
    display: 'inline-block',
    background: 'rgba(124, 58, 237, 0.15)',
    color: '#a78bfa',
    fontSize: 11, fontWeight: 500,
    padding: '3px 10px', borderRadius: 20,
    border: '1px solid rgba(124,58,237,0.25)',
  },
  wireframe: {
    width: '100%', marginTop: 8,
    background: '#0e1018',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: 8,
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  row: {
    display: 'flex', justifyContent: 'space-between',
    padding: '7px 4px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  rowLabel: { fontSize: 12, color: '#64748b' },
  rowValue: { fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  features: {
    listStyle: 'none', padding: 0, margin: '4px 0 0',
    display: 'flex', flexDirection: 'column', gap: 4,
    fontSize: 12, color: '#64748b',
  },
}
