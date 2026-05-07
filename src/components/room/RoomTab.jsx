// src/components/room/RoomTab.jsx
import { useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import TileForm from './TileForm.jsx'
import WallCard from './WallCard.jsx'
import CornersSection from './CornersSection.jsx'
import SummarySection from './SummarySection.jsx'

export default function RoomTab() {
  const { tile, walls, corners } = useProjectStore()
  const { past, future } = useHistoryStore()

  const results = useMemo(
    () => calculateGrid(tile, walls, corners),
    [tile, walls, corners]
  )

  function handleUndo() {
    const { undo } = useHistoryStore.getState()
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  function handleRedo() {
    const { redo } = useHistoryStore.getState()
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={s.page}>
      {/* Undo/Redo */}
      <div style={s.undoBar}>
        <button style={s.undoBtn} onClick={handleUndo} disabled={past.length === 0}>↩ Отменить</button>
        <button style={s.undoBtn} onClick={handleRedo} disabled={future.length === 0}>↪ Повторить</button>
      </div>

      {/* Параметры плитки + кнопка добавить стену */}
      <TileForm />

      {/* Список стен */}
      {walls.length === 0 && (
        <p style={s.emptyHint}>Добавь первую стену — нажми кнопку выше.</p>
      )}
      {walls.map((wall, i) => (
        <WallCard key={wall.id} wall={wall} result={results[i] ?? null} />
      ))}

      {/* Углы */}
      <CornersSection />

      {/* Итог */}
      <SummarySection results={results} />

      <div style={{ height: 40 }} />
    </div>
  )
}

const s = {
  page:    { overflowY: 'auto', height: '100%', background: '#1a1a1a', color: '#f0f0f0' },
  undoBar: { display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid #333' },
  undoBtn: { padding: '7px 14px', background: '#2a2a2a', color: '#f0f0f0', border: '1px solid #444', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  emptyHint: { padding: '24px 16px', color: '#555', fontSize: 14, textAlign: 'center' },
}
