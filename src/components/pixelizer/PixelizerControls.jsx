// src/components/pixelizer/PixelizerControls.jsx
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { sampleWallColors } from '../../utils/pixelizerSampler.js'
import { wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { loadPhoto } from '../../store/persistence.js'
import WallsSheet from './WallsSheet.jsx'
import PhotoSheet from './PhotoSheet.jsx'

export default function PixelizerControls({ selectedWallId, onSelectWall, canvasScale, onPhotosAdded }) {
  const { walls, tile, corners, pixelizer, setPixelizerMode, setGridVisible, setPhotoSettings, setTileColors } = useProjectStore()
  const [showWalls, setShowWalls] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [sampling, setSampling] = useState(false)

  const mode = pixelizer.mode
  const settings = selectedWallId ? pixelizer.photoSettings[selectedWallId] : null

  function updateField(field, value) {
    if (!selectedWallId || !settings) return
    setPhotoSettings(selectedWallId, { ...settings, [field]: value })
  }

  async function handlePixelize() {
    setSampling(true)
    const gridResults = calculateGrid(tile, walls, corners)
    const targets = walls.filter(w => {
      const s = pixelizer.photoSettings[w.id]
      return s?.photoId && (pixelizer.tileColorsStale[w.id] !== false)
    })
    for (const wall of targets) {
      const wallIndex = walls.findIndex(w => w.id === wall.id)
      const gridResult = gridResults[wallIndex]
      if (!gridResult) continue
      const ps = pixelizer.photoSettings[wall.id]
      const blob = await loadPhoto(ps.photoId)
      if (!blob) continue
      const tileW_mm  = parseFloat(tile.tile_width)  || 0
      const tileH_mm  = parseFloat(tile.tile_height) || 0
      const groutW_mm = parseFloat(tile.grout_width)  || 0
      const dims = wallCanvasDimensions(wall, canvasScale)
      const tileGrid = {
        columns:  gridResult.columns,
        rows:     gridResult.rows,
        tileW_mm, tileH_mm, groutW_mm,
        masks: wall.masks,
      }
      const colors = await sampleWallColors(blob, ps, tileGrid, dims.width, dims.height, canvasScale)
      setTileColors(wall.id, colors)
    }
    setPixelizerMode('mosaic')
    setSampling(false)
  }

  const anyStale = walls.some(w => pixelizer.tileColorsStale[w.id] !== false && pixelizer.photoSettings[w.id])

  return (
    <>
      <div style={s.panel}>
        {mode === 'photo' ? (
          <>
            <button style={s.btn} onClick={() => setShowWalls(true)}>Стены ▾</button>
            <button style={s.btn} onClick={() => setShowPhoto(true)}>+ Фото</button>
            <button
              style={{ ...s.btn, color: pixelizer.gridVisible ? '#818cf8' : '#64748b' }}
              onClick={() => setGridVisible(!pixelizer.gridVisible)}
            >
              Сетка
            </button>
            <button
              style={{ ...s.btnPrimary, opacity: sampling ? 0.5 : 1 }}
              onClick={handlePixelize}
              disabled={sampling}
            >
              {sampling ? '...' : anyStale ? '⟳ Обновить' : 'Пикселизировать →'}
            </button>
          </>
        ) : (
          <>
            <button style={s.btnPrimary} onClick={() => setPixelizerMode('photo')}>← К фото</button>
            <button style={s.btn} onClick={() => setShowWalls(true)}>Стены ▾</button>
            <button
              style={{ ...s.btn, color: pixelizer.gridVisible ? '#818cf8' : '#64748b' }}
              onClick={() => setGridVisible(!pixelizer.gridVisible)}
            >
              Сетка
            </button>
          </>
        )}
      </div>

      {mode === 'photo' && settings && selectedWallId && (
        <div style={s.photoRow}>
          <label style={s.fieldLabel}>X</label>
          <input style={s.numInput} type="number" step="1" value={settings.offsetX_mm} onChange={e => updateField('offsetX_mm', parseFloat(e.target.value) || 0)} />
          <span style={s.unit}>мм</span>
          <label style={s.fieldLabel}>Y</label>
          <input style={s.numInput} type="number" step="1" value={settings.offsetY_mm} onChange={e => updateField('offsetY_mm', parseFloat(e.target.value) || 0)} />
          <span style={s.unit}>мм</span>
          <label style={s.fieldLabel}>Масштаб</label>
          <input style={s.numInput} type="number" step="0.05" min="0.1" max="10" value={settings.scale} onChange={e => updateField('scale', parseFloat(e.target.value) || 1)} />
          <label style={s.fieldLabel}>Прозрачность</label>
          <input type="range" min="0" max="1" step="0.05" value={settings.opacity} onChange={e => updateField('opacity', parseFloat(e.target.value))} style={{ flex: 1 }} />
        </div>
      )}

      {showWalls && <WallsSheet onClose={() => setShowWalls(false)} />}
      {showPhoto && <PhotoSheet onClose={() => setShowPhoto(false)} onPhotosAdded={onPhotosAdded} />}
    </>
  )
}

const s = {
  panel:      { display: 'flex', gap: 6, padding: '8px 12px', background: '#1e1e2e', borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' },
  photoRow:   { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#18182a', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)' },
  btn:        { padding: '7px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  btnPrimary: { padding: '7px 14px', background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.4)', borderRadius: 7, color: '#818cf8', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  fieldLabel: { fontSize: 11, color: '#64748b' },
  numInput:   { width: 58, padding: '4px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#f1f5f9', fontSize: 12, outline: 'none' },
  unit:       { fontSize: 11, color: '#475569' },
}
