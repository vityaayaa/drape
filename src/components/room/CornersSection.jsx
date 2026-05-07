// src/components/room/CornersSection.jsx
import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

export default function CornersSection() {
  const { walls, corners, setCorner } = useProjectStore()
  const { push } = useHistoryStore()

  if (walls.length < 2) return null

  const n = walls.length
  const cornerList = walls.map((wall, i) => {
    const nextWall = walls[(i + 1) % n]
    const key = `${wall.id}-${nextWall.id}`
    return { key, leftWall: wall, rightWall: nextWall }
  })

  function handleChange(key, value) {
    push(useProjectStore.getState().getSnapshot())
    setCorner(key, value)
  }

  return (
    <div style={s.block}>
      <h2 style={s.heading}>Настройка углов</h2>
      <p style={s.hint}>Какая стена перекрывает плиткой угол. Актуально только при толщине плитки &gt; 0.</p>
      {cornerList.map(({ key, leftWall, rightWall }) => (
        <div key={key} style={s.row}>
          <span style={s.label}>
            Угол: {leftWall.name} / {rightWall.name}
          </span>
          <select
            style={s.select}
            value={corners[key] ?? 'auto'}
            onChange={(e) => handleChange(key, e.target.value)}
          >
            <option value="auto">Автоматически</option>
            <option value={leftWall.id}>{leftWall.name} перекрывает</option>
            <option value={rightWall.id}>{rightWall.name} перекрывает</option>
          </select>
        </div>
      ))}
    </div>
  )
}

const s = {
  block:   { padding: '16px', borderTop: '1px solid #333' },
  heading: { fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#f0f0f0' },
  hint:    { fontSize: 12, color: '#666', marginBottom: 12 },
  row:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  label:   { flex: 1, fontSize: 13, color: '#aaa', minWidth: 160 },
  select:  { padding: '6px 8px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 6, color: '#f0f0f0', fontSize: 13 },
}
