// src/components/pixelizer/WallsSheet.jsx
import { useProjectStore } from '../../store/projectStore.js'
import { Check } from 'lucide-react'
import Modal from '../ui/Modal.jsx'

export default function WallsSheet({ onClose }) {
  const { walls, pixelizer, setVisibleWalls } = useProjectStore()
  const visible = pixelizer.visibleWalls

  function toggle(id) {
    if (visible === null) {
      setVisibleWalls(walls.map(w => w.id).filter(wid => wid !== id))
    } else {
      const next = visible.includes(id) ? visible.filter(wid => wid !== id) : [...visible, id]
      setVisibleWalls(next.length === walls.length ? null : next)
    }
  }

  function showAll() { setVisibleWalls(null) }

  const isVisible = (id) => visible === null || visible.includes(id)

  return (
    <Modal
      open
      onClose={onClose}
      title="Видимость стен"
      footer={
        <button style={s.allBtn} onClick={showAll}>Показать все</button>
      }
    >
      <div style={s.list}>
        {walls.map(w => (
          <button
            key={w.id}
            style={{ ...s.row, ...(isVisible(w.id) ? s.rowOn : {}) }}
            onClick={() => toggle(w.id)}
          >
            <div style={{ ...s.check, ...(isVisible(w.id) ? s.checkOn : {}) }}>
              {isVisible(w.id) && <Check size={16} strokeWidth={3} />}
            </div>
            <span style={s.name}>{w.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

const s = {
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex', alignItems: 'center',
    width: '100%',
    height: 56,
    padding: '0 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    cursor: 'pointer',
    gap: 12,
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  rowOn: {
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
  },
  check: {
    width: 24, height: 24,
    borderRadius: 7,
    border: '1.5px solid rgba(255,255,255,0.20)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    color: '#fff',
  },
  checkOn: {
    background: 'var(--accent)',
    border: '1.5px solid var(--accent)',
  },
  name: { fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' },
  allBtn: {
    display: 'block', width: '100%',
    height: 48,
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    borderRadius: 12,
    color: 'var(--accent-light)',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
