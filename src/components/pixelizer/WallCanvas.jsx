// src/components/pixelizer/WallCanvas.jsx
import { useRef, useEffect } from 'react'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { drawWallPhoto, drawWallMosaic, drawWallPlaceholder } from '../../utils/pixelizerRenderer.js'

// photoCache: Map<photoId, ImageBitmap> — передаётся сверху, чтобы не загружать повторно
export default function WallCanvas({ wall, tile, corners, walls, pixelizer, canvasScale, selected, onSelect, photoCache }) {
  const canvasRef = useRef(null)
  const dims = wallCanvasDimensions(wall, canvasScale)
  const settings = pixelizer.photoSettings[wall.id] ?? null
  const tileColors = pixelizer.tileColors[wall.id] ?? {}
  const stale = pixelizer.tileColorsStale[wall.id] ?? false
  const mode = pixelizer.mode

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (dims.placeholder) {
      drawWallPlaceholder(ctx, dims.width, dims.height, wall.name)
      return
    }

    const gridResults = calculateGrid(tile, walls, corners)
    const wallIndex = walls.findIndex(w => w.id === wall.id)
    const gridResult = gridResults[wallIndex]

    const tileGrid = gridResult ? {
      columns:   gridResult.columns,
      rows:      gridResult.rows,
      tileW_mm:  parseFloat(tile.tile_width)  || 0,
      tileH_mm:  parseFloat(tile.tile_height) || 0,
      groutW_mm: parseFloat(tile.grout_width) || 0,
      groutColor: tile.grout_color,
      masks: wall.masks,
    } : null

    const photo = settings ? (photoCache.get(settings.photoId) ?? null) : null

    if (mode === 'mosaic' && tileGrid) {
      drawWallMosaic(ctx, dims.width, dims.height, tileGrid, tileColors, canvasScale)
    } else {
      drawWallPhoto(ctx, dims.width, dims.height, photo, settings ?? { offsetX_mm: 0, offsetY_mm: 0, scale: 1, opacity: 1 }, tileGrid ?? { columns: 0, rows: 0, tileW_mm: 0, tileH_mm: 0, groutW_mm: 0, groutColor: '#ccc', masks: [] }, canvasScale, pixelizer.gridVisible)
    }
  }, [wall, tile, corners, walls, pixelizer, canvasScale, mode, dims.width, dims.height, photoCache])

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        width={dims.width}
        height={dims.height}
        onClick={onSelect}
        style={{
          display: 'block',
          cursor: 'pointer',
          outline: selected ? '2px solid #818cf8' : 'none',
          borderRadius: 2,
        }}
      />
      <div style={s.wallLabel}>{wall.name}</div>
      {stale && mode === 'mosaic' && (
        <div style={s.staleHint}>обновить</div>
      )}
    </div>
  )
}

const s = {
  wallLabel: { position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#64748b', pointerEvents: 'none' },
  staleHint: { position: 'absolute', top: 4, right: 4, background: '#f59e0b', color: '#000', fontSize: 9, padding: '2px 5px', borderRadius: 4 },
}
