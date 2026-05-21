// src/components/room/RoomTab.jsx
import { useMemo } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import TileForm from './TileForm.jsx'
import WallCard from './WallCard.jsx'
import CornersSection from './CornersSection.jsx'
import SummarySection from './SummarySection.jsx'
import FlowStepper from './FlowStepper.jsx'

export default function RoomTab() {
  const { tile, walls, corners } = useProjectStore()

  const results = useMemo(
    () => calculateGrid(tile, walls, corners),
    [tile, walls, corners]
  )

  return (
    <div style={s.page}>
      <FlowStepper current="room" />
      <TileForm />
      {walls.length === 0 && (
        <div style={s.emptyHint}>
          <LayoutGrid size={28} color="#a78bfa" style={{ opacity: 0.5 }} />
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
  page: { overflowY: 'auto', height: '100%', background: 'var(--bg)', color: 'var(--text-primary)' },
  emptyHint: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 6,
    padding: '28px 20px 8px',
    textAlign: 'center',
  },
  emptyTitle:    { fontSize: 15, color: 'var(--text-secondary)', margin: 0 },
  emptySubtitle: { fontSize: 13, color: 'var(--text-hint)', margin: 0 },
}
