// src/components/pixelizer/PixelizerTab.jsx
import { useRef, useState, useEffect } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { loadPhoto } from '../../store/persistence.js'
import { computeScale } from '../../utils/pixelizerGeometry.js'
import WallCanvas from './WallCanvas.jsx'
import PixelizerControls from './PixelizerControls.jsx'

export default function PixelizerTab() {
  const { walls, tile, corners, pixelizer } = useProjectStore()

  const [zoom, setZoom] = useState(1)
  const [selectedWallId, setSelectedWallId] = useState(null)
  const [photoCache, setPhotoCache] = useState(new Map())
  const [, forceRedraw] = useState(0)

  const touchRef = useRef({ lastDist: null })
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 700

  // Загружаем фотографии в кеш при изменении photoSettings
  useEffect(() => {
    const settings = pixelizer.photoSettings
    const ids = Object.values(settings).map(s => s.photoId).filter(Boolean)

    Promise.all(
      ids.map(async id => {
        if (photoCache.has(id)) return null
        const blob = await loadPhoto(id)
        if (!blob) return null
        const bmp = await createImageBitmap(blob)
        return [id, bmp]
      })
    ).then(entries => {
      const updates = entries.filter(Boolean)
      if (updates.length === 0) return
      setPhotoCache(prev => {
        const next = new Map(prev)
        updates.forEach(([id, bmp]) => next.set(id, bmp))
        return next
      })
    })
  }, [pixelizer.photoSettings])

  function handleTouchMove(e) {
    if (e.touches.length !== 2) { touchRef.current.lastDist = null; return }
    e.preventDefault()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.hypot(dx, dy)
    if (touchRef.current.lastDist !== null) {
      const ratio = dist / touchRef.current.lastDist
      setZoom(z => Math.max(0.25, Math.min(6, z * ratio)))
    }
    touchRef.current.lastDist = dist
  }

  function handleTouchEnd(e) {
    if (e.touches.length < 2) touchRef.current.lastDist = null
  }

  const visibleWalls = walls.filter(w => {
    if (!w.wall_active) return false
    if (pixelizer.visibleWalls === null) return true
    return pixelizer.visibleWalls.includes(w.id)
  })

  if (walls.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyText}>Добавь стены в разделе «Комната»</p>
      </div>
    )
  }

  return (
    <div style={s.root}>
      <div
        style={s.scrollArea}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ ...s.wallsRow, transform: `scale(${zoom})`, transformOrigin: 'left top' }}>
          {visibleWalls.map(wall => (
            <WallCanvas
              key={wall.id}
              wall={wall}
              tile={tile}
              corners={corners}
              walls={walls}
              pixelizer={pixelizer}
              canvasScale={computeScale(walls, viewportH)}
              selected={selectedWallId === wall.id}
              onSelect={() => setSelectedWallId(id => id === wall.id ? null : wall.id)}
              photoCache={photoCache}
            />
          ))}
        </div>
      </div>

      <div style={s.controls}>
        <PixelizerControls
          selectedWallId={selectedWallId}
          canvasScale={computeScale(walls, viewportH)}
          onPhotosAdded={() => forceRedraw(n => n + 1)}
        />
      </div>
    </div>
  )
}

const s = {
  root:       { display: 'flex', flexDirection: 'column', height: '100%', background: '#0f0f1a', overflow: 'hidden' },
  scrollArea: { flex: 1, overflowX: 'auto', overflowY: 'hidden', touchAction: 'pan-x pan-y' },
  wallsRow:   { display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start', width: 'max-content' },
  controls:   { flexShrink: 0 },
  empty:      { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
  emptyText:  { color: '#475569', fontSize: 15 },
}
