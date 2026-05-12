// src/components/room/CornersSection.jsx
import { useProjectStore } from '../../store/projectStore.js'

export default function CornersSection() {
  const { walls, corners, setCorner } = useProjectStore()

  if (walls.length < 2) return null

  const n = walls.length
  const cornerList = walls.map((wall, i) => {
    const nextWall = walls[(i + 1) % n]
    const key = `${wall.id}-${nextWall.id}`
    return { key, leftWall: wall, rightWall: nextWall }
  })

  return (
    <div style={s.block}>
      <h2 style={s.heading}>Настройка углов</h2>
      <p style={s.hint}>Какая стена перекрывает угол плиткой. Выбери «Нет угла» если стены не смыкаются (открытый проём). Актуально только при толщине плитки &gt; 0.</p>
      {cornerList.map(({ key, leftWall, rightWall }) => (
        <div key={key} style={s.row}>
          <span style={s.label}>{leftWall.name} / {rightWall.name}</span>
          <select
            style={s.select}
            value={corners[key] ?? 'auto'}
            onChange={(e) => setCorner(key, e.target.value)}
          >
            <option value="auto">Автоматически</option>
            <option value={leftWall.id}>{leftWall.name} перекрывает</option>
            <option value={rightWall.id}>{rightWall.name} перекрывает</option>
            <option value="open">Нет угла</option>
          </select>
        </div>
      ))}
    </div>
  )
}

const s = {
  block:   { padding: '18px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginTop: 10 },
  heading: { fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#f1f5f9', letterSpacing: '-0.01em' },
  hint:    { fontSize: 12, color: '#475569', marginBottom: 14, lineHeight: 1.5 },
  row:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  label:   { flex: 1, fontSize: 13, color: '#94a3b8', minWidth: 140 },
  select:  { padding: '7px 10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#f1f5f9', fontSize: 13 },
}
