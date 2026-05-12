// src/components/pixelizer/WallsSheet.jsx
import { useProjectStore } from '../../store/projectStore.js'

export default function WallsSheet({ onClose }) {
  const { walls, pixelizer, setVisibleWalls } = useProjectStore()
  const visible = pixelizer.visibleWalls

  function toggle(id) {
    if (visible === null) {
      // переходим к явному списку: все кроме нажатой
      setVisibleWalls(walls.map(w => w.id).filter(wid => wid !== id))
    } else {
      const next = visible.includes(id) ? visible.filter(wid => wid !== id) : [...visible, id]
      setVisibleWalls(next.length === walls.length ? null : next)
    }
  }

  function showAll() { setVisibleWalls(null) }

  const isVisible = (id) => visible === null || visible.includes(id)

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        <div style={s.handle} />
        <p style={s.title}>Видимость стен</p>
        {walls.map(w => (
          <label key={w.id} style={s.row}>
            <input
              type="checkbox"
              checked={isVisible(w.id)}
              onChange={() => toggle(w.id)}
              style={{ marginRight: 10 }}
            />
            <span style={s.name}>{w.name}</span>
          </label>
        ))}
        <button style={s.allBtn} onClick={showAll}>Показать все</button>
      </div>
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  sheet:   { width: '100%', background: '#1e1e2e', borderRadius: '16px 16px 0 0', padding: '12px 16px 32px', maxHeight: '60vh', overflowY: 'auto' },
  handle:  { width: 36, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 12px' },
  title:   { fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 },
  row:     { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' },
  name:    { fontSize: 14, color: '#cbd5e1' },
  allBtn:  { marginTop: 16, width: '100%', padding: '10px', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 8, color: '#818cf8', fontSize: 14, cursor: 'pointer' },
}
