// src/components/export/ExportTab.jsx
import { PenLine } from 'lucide-react'

export default function ExportTab() {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <PenLine size={36} color="#818cf8" style={{ opacity: 0.4, marginBottom: 12 }} />
        <p style={s.title}>Схема укладки</p>
        <span style={s.badge}>В разработке</span>

        {/* Wireframe tile grid 5×4 */}
        <div style={s.wireframe}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ ...s.tile, ...(i === 7 ? s.tileAccent : {}) }} />
          ))}
        </div>

        <ul style={s.features}>
          <li>Экспорт схемы для мастера</li>
          <li>Разметка с порезами</li>
          <li>PDF + PNG</li>
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
  title:   { fontSize: 18, fontWeight: 600, color: '#f1f5f9', margin: 0 },
  badge: {
    display: 'inline-block',
    background: 'rgba(124, 58, 237, 0.15)',
    color: '#a78bfa',
    fontSize: 11, fontWeight: 500,
    padding: '3px 10px', borderRadius: 20,
    border: '1px solid rgba(124,58,237,0.25)',
  },
  wireframe: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 3, width: '100%', marginTop: 8,
    background: '#0e1018',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: 8,
  },
  tile: {
    aspectRatio: '1',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 2,
  },
  tileAccent: {
    background: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124,58,237,0.35)',
  },
  features: {
    listStyle: 'none', padding: 0, margin: '4px 0 0',
    display: 'flex', flexDirection: 'column', gap: 4,
    fontSize: 12, color: '#64748b',
  },
}
