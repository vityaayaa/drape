// src/components/pixelizer/PhotoSheet.jsx
import { useRef } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { savePhoto } from '../../store/persistence.js'

function genPhotoId() {
  return `ph_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export default function PhotoSheet({ onClose, onPhotosAdded }) {
  const { walls, pixelizer, setPhotoSettings } = useProjectStore()
  const inputRef = useRef(null)
  const targetRef = useRef(null)  // null = все стены; string = wallId

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = new Blob([await file.arrayBuffer()], { type: file.type })
    const photoId = genPhotoId()
    await savePhoto(photoId, blob)

    const targetWalls = targetRef.current === null
      ? walls
      : walls.filter(w => w.id === targetRef.current)

    for (const wall of targetWalls) {
      const existing = pixelizer.photoSettings[wall.id]
      setPhotoSettings(wall.id, {
        photoId,
        offsetX_mm: existing?.offsetX_mm ?? 0,
        offsetY_mm: existing?.offsetY_mm ?? 0,
        scale:      existing?.scale      ?? 1.0,
        opacity:    existing?.opacity    ?? 1.0,
      })
    }
    onPhotosAdded?.()
    onClose()
  }

  function trigger(target) {
    targetRef.current = target
    inputRef.current?.click()
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        <div style={s.handle} />
        <p style={s.title}>Добавить фото</p>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button style={s.btn} onClick={() => trigger(null)}>На все стены</button>
        <p style={s.sub}>Или выбери конкретную:</p>
        {walls.map(w => (
          <button key={w.id} style={s.wallBtn} onClick={() => trigger(w.id)}>
            {w.name}
          </button>
        ))}
      </div>
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  sheet:   { width: '100%', background: '#1e1e2e', borderRadius: '16px 16px 0 0', padding: '12px 16px 32px', maxHeight: '70vh', overflowY: 'auto' },
  handle:  { width: 36, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 12px' },
  title:   { fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 },
  btn:     { display: 'block', width: '100%', padding: '12px', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 8, color: '#818cf8', fontSize: 14, cursor: 'pointer', marginBottom: 12 },
  sub:     { fontSize: 12, color: '#64748b', margin: '12px 0 8px' },
  wallBtn: { display: 'block', width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#cbd5e1', fontSize: 13, cursor: 'pointer', marginBottom: 6, textAlign: 'left' },
}
