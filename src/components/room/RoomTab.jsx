// src/components/room/RoomTab.jsx
import { useMemo } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import TileForm from './TileForm.jsx'
import WallCard from './WallCard.jsx'
import CornersSection from './CornersSection.jsx'
import SummarySection from './SummarySection.jsx'

const FLOW_STEPS = ['Комната', 'Фото', '3D', 'Схема', 'Укладка']

export default function RoomTab() {
  const { tile, walls, corners } = useProjectStore()

  const results = useMemo(
    () => calculateGrid(tile, walls, corners),
    [tile, walls, corners]
  )

  return (
    <div style={s.page}>
      {walls.length === 0 && (
        <div style={s.flowStrip}>
          {FLOW_STEPS.map((step, i) => (
            <span key={step}>
              <span style={i === 0 ? s.flowActive : s.flowDim}>{step}</span>
              {i < FLOW_STEPS.length - 1 && <span style={s.flowArrow}> → </span>}
            </span>
          ))}
        </div>
      )}
      <TileForm />
      {walls.length === 0 && (
        <div style={s.emptyHint}>
          <LayoutGrid size={28} color="#818cf8" style={{ opacity: 0.3 }} />
          <p style={s.emptyTitle}>Стен пока нет</p>
          <p style={s.emptySubtitle}>Нажмите «Добавить стену» ниже</p>
        </div>
      )}
      {walls.map((wall, i) => (
        <WallCard key={wall.id} wall={wall} result={results[i] ?? null} />
      ))}
      <CornersSection />
      <SummarySection results={results} />
      <div style={{ height: 40 }} />
    </div>
  )
}

const s = {
  page:          { overflowY: 'auto', height: '100%', background: '#08080f', color: '#f1f5f9' },
  flowStrip: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', gap: 0,
    padding: '10px 16px 6px',
    fontSize: 10,
  },
  flowActive:  { color: '#a78bfa', fontWeight: 600 },
  flowDim:     { color: '#334155' },
  flowArrow:   { color: '#334155' },
  emptyHint: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 6,
    padding: '28px 20px 8px',
    textAlign: 'center',
  },
  emptyTitle:    { fontSize: 15, color: '#94a3b8', margin: 0 },
  emptySubtitle: { fontSize: 13, color: '#64748b', margin: 0 },
}
