// src/components/room/RoomTab.jsx
import { useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import TileForm from './TileForm.jsx'
import WallCard from './WallCard.jsx'
import CornersSection from './CornersSection.jsx'
import SummarySection from './SummarySection.jsx'

export default function RoomTab() {
  const { tile, walls, corners } = useProjectStore()

  const results = useMemo(
    () => calculateGrid(tile, walls, corners),
    [tile, walls, corners]
  )

  return (
    <div style={s.page}>
      <TileForm />
      {walls.length === 0 && (
        <p style={s.emptyHint}>Добавь первую стену — нажми кнопку выше.</p>
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
  page:      { overflowY: 'auto', height: '100%', background: '#08080f', color: '#f1f5f9' },
  emptyHint: { padding: '40px 20px', color: '#334155', fontSize: 14, textAlign: 'center' },
}
