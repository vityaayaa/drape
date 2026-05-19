// src/components/room/CornersSection.jsx
import { useProjectStore } from '../../store/projectStore.js'

function readCorner(raw) {
  if (!raw || typeof raw === 'string') return { overlap: raw ?? 'auto', angle: 90 }
  return { overlap: raw.overlap ?? 'auto', angle: raw.angle ?? 90 }
}

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
      <p style={s.hint}>
        Какая стена перекрывает угол плиткой. Угол — внутренний угол комнаты (90° = прямой).
        Актуально только при толщине плитки &gt; 0.
      </p>
      {cornerList.map(({ key, leftWall, rightWall }) => {
        const corner = readCorner(corners[key])
        return (
          <div key={key} style={s.cornerItem}>
            <span style={s.label}>{leftWall.name} / {rightWall.name}</span>
            <div style={s.controls}>
              <select
                style={s.select}
                value={corner.overlap}
                onChange={(e) => setCorner(key, { overlap: e.target.value, angle: corner.angle })}
              >
                <option value="auto">Автоматически</option>
                <option value={leftWall.id}>{leftWall.name} перекрывает</option>
                <option value={rightWall.id}>{rightWall.name} перекрывает</option>
                <option value="open">Нет угла</option>
              </select>
              <input
                type="number"
                style={s.angleInput}
                min={10}
                max={350}
                value={corner.angle}
                onChange={(e) =>
                  setCorner(key, {
                    overlap: corner.overlap,
                    angle: Math.max(10, Math.min(350, Number(e.target.value))),
                  })
                }
              />
              <span style={s.deg}>°</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const s = {
  block:      { padding: '18px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0e1018', marginTop: 10 },
  heading:    { fontSize: 18, fontWeight: 600, marginBottom: 6, color: '#f1f5f9', letterSpacing: '-0.01em' },
  hint:       { fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.5 },
  cornerItem: { marginBottom: 12 },
  label:      { display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 },
  controls:   { display: 'flex', alignItems: 'center', gap: 8 },
  select:     { flex: 1, padding: '0 10px', height: 44, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' },
  angleInput: { width: 64, height: 44, padding: '0 8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: 13, textAlign: 'right', boxSizing: 'border-box' },
  deg:        { fontSize: 13, color: '#64748b' },
}
