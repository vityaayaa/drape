// src/components/pixelizer/WallCanvas.jsx
import { useRef, useEffect } from 'react'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { drawWallPhoto, drawWallMosaic, drawWallPlaceholder, drawBoundingBox } from '../../utils/pixelizerRenderer.js'

export default function WallCanvas({
  wall, tile, corners, walls, pixelizer, canvasScale,
  renderParams,       // { useMosaic, hidePhoto, gridVisible }
  showBoundingBox,    // boolean
  isSelectable,       // boolean — стена кликабельна (addPhoto режим)
  isSelected,         // boolean — стена выбрана в addPhoto режиме
  onTap,              // (wallId) => void
  photoCache,
}) {
  const canvasRef = useRef(null)
  const dims = wallCanvasDimensions(wall, canvasScale)
  const settings = pixelizer.photoSettings[wall.id] ?? null
  const tileColors = pixelizer.tileColors[wall.id] ?? {}
  const { useMosaic = false, hidePhoto = false, gridVisible = false } = renderParams ?? {}

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
    } : { columns: 0, rows: 0, tileW_mm: 0, tileH_mm: 0, groutW_mm: 0, groutColor: '#ccc', masks: [] }

    const photo = settings ? (photoCache.get(settings.photoId) ?? null) : null
    const ps = settings ?? { offsetX_mm: 0, offsetY_mm: 0, scale: 1, opacity: 1 }

    if (useMosaic && tileGrid.columns > 0) {
      drawWallMosaic(ctx, dims.width, dims.height, tileGrid, tileColors, canvasScale)
    } else {
      drawWallPhoto(ctx, dims.width, dims.height, photo, ps, tileGrid, canvasScale, gridVisible, hidePhoto)
    }

    if (showBoundingBox && photo && settings) {
      drawBoundingBox(ctx, dims.width, dims.height, photo, settings, canvasScale)
    }
  }, [wall, tile, corners, walls, pixelizer, canvasScale, renderParams, showBoundingBox, photoCache, dims.width, dims.height])

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        width={dims.width}
        height={dims.height}
        onClick={isSelectable ? () => onTap?.(wall.id) : undefined}
        style={{
          display: 'block',
          cursor: isSelectable ? 'pointer' : 'default',
          outline: isSelected ? '2px solid #818cf8' : 'none',
          outlineOffset: '-2px',
          borderRadius: 2,
          transition: 'outline 0.12s',
        }}
      />
      {isSelected && (
        <div style={s.selectionOverlay} />
      )}
      <div style={s.wallLabel}>{wall.name}</div>
    </div>
  )
}

const s = {
  selectionOverlay: {
    position: 'absolute', inset: 0, borderRadius: 2,
    background: 'rgba(129,140,248,0.13)',
    pointerEvents: 'none',
  },
  wallLabel: {
    position: 'absolute', bottom: -18, left: 0, right: 0,
    textAlign: 'center',
    fontSize: 10, fontWeight: 500,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    pointerEvents: 'none',
  },
}
