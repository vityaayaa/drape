// src/components/pixelizer/WallCanvas.jsx
import { useRef, useEffect } from 'react'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { drawWallPhoto, drawWallMosaic, drawWallPlaceholder, drawBoundingBox } from '../../utils/pixelizerRenderer.js'
import { resolveWallTile } from '../../utils/schemaRenderer.js'

export default function WallCanvas({
  wall, tile, corners, walls, pixelizer, canvasScale,
  renderParams,       // { useMosaic, hidePhoto, gridVisible }
  showBoundingBox,    // boolean
  isSelectable,       // boolean
  isSelected,         // boolean
  onTap,              // (wallId) => void
  photoCache,
  worldScale = 1,
  onPhotoGestureMove,
  onPhotoGestureScale,
}) {
  const canvasRef = useRef(null)
  const worldScaleRef      = useRef(worldScale)
  const canvasScaleRef     = useRef(canvasScale)
  const settingsRef        = useRef(null)
  const gestureMoveRef     = useRef(onPhotoGestureMove)
  const gestureScaleRef    = useRef(onPhotoGestureScale)

  const dims = wallCanvasDimensions(wall, canvasScale)
  const settings = pixelizer.photoSettings[wall.id] ?? null
  const tileColors = pixelizer.tileColors[wall.id] ?? {}
  const { useMosaic = false, hidePhoto = false, gridVisible = false } = renderParams ?? {}

  // Вычислить позицию стены в группе фото для spanning
  const photoGroup = settings
    ? walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === settings.photoId)
    : []
  const wallIndexInGroup = photoGroup.findIndex(w => w.id === wall.id)
  const wallGroupOffsetX_mm = photoGroup
    .slice(0, wallIndexInGroup)
    .reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)
  const groupTotalWidth_mm = photoGroup.length > 0
    ? photoGroup.reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)
    : null

  useEffect(() => { worldScaleRef.current  = worldScale },           [worldScale])
  useEffect(() => { canvasScaleRef.current = canvasScale },          [canvasScale])
  useEffect(() => { settingsRef.current    = settings },             [settings])
  useEffect(() => { gestureMoveRef.current = onPhotoGestureMove },   [onPhotoGestureMove])
  useEffect(() => { gestureScaleRef.current = onPhotoGestureScale }, [onPhotoGestureScale])

  useEffect(() => {
    if (!showBoundingBox) return
    const canvas = canvasRef.current
    if (!canvas) return

    let gesture = null

    function onTouchStart(e) {
      e.stopPropagation()
      if (e.touches.length === 1) {
        gesture = { type: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY }
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        gesture = {
          type: 'pinch',
          startDist: dist,
          startScale: settingsRef.current?.scale ?? 1,
        }
      }
    }

    function onTouchMove(e) {
      e.stopPropagation()
      e.preventDefault()
      if (!gesture) return

      if (gesture.type === 'pan' && e.touches.length === 1) {
        const dx_px = e.touches[0].clientX - gesture.x
        const dy_px = e.touches[0].clientY - gesture.y
        const factor = worldScaleRef.current * canvasScaleRef.current
        const dx_mm =  dx_px / factor
        const dy_mm = -dy_px / factor   // canvas Y is inverted vs physical Y
        gestureMoveRef.current?.(dx_mm, dy_mm)
        gesture.x = e.touches[0].clientX
        gesture.y = e.touches[0].clientY
      } else if (gesture.type === 'pinch' && e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        const newScale = gesture.startScale * (dist / gesture.startDist)
        gestureScaleRef.current?.(Math.max(0.1, Math.min(10, newScale)))
      }
    }

    function onTouchEnd(e) {
      e.stopPropagation()
      gesture = null
    }

    // passive: true — we only stopPropagation here, never preventDefault; browser gains scroll optimization
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: true })

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
    }
  }, [showBoundingBox])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const dpr = window.devicePixelRatio || 1
    canvas.width = dims.width * dpr
    canvas.height = dims.height * dpr
    canvas.style.width = dims.width + 'px'
    canvas.style.height = dims.height + 'px'
    ctx.scale(dpr, dpr)

    if (dims.placeholder) {
      drawWallPlaceholder(ctx, dims.width, dims.height, wall.name)
      return
    }

    const gridResults = calculateGrid(tile, walls, corners)
    const wallIndex = walls.findIndex(w => w.id === wall.id)
    const gridResult = gridResults[wallIndex]

    const resolved = resolveWallTile(wall, tile)
    const tileGrid = gridResult ? {
      columns:   gridResult.columns,
      rows:      gridResult.rows,
      tileW_mm:  resolved.tileW / 10,
      tileH_mm:  resolved.tileH / 10,
      groutW_mm: resolved.groutW / 10,
      groutColor: resolved.groutColor,
      masks: wall.masks,
    } : { columns: 0, rows: 0, tileW_mm: 0, tileH_mm: 0, groutW_mm: 0, groutColor: '#ccc', masks: [] }

    const photo = settings ? (photoCache.get(settings.photoId) ?? null) : null
    const ps = settings ?? { offsetX_mm: 0, offsetY_mm: 0, scale: 1, opacity: 1 }

    if (useMosaic && tileGrid.columns > 0) {
      drawWallMosaic(ctx, dims.width, dims.height, tileGrid, tileColors, canvasScale, gridVisible)
    } else {
      drawWallPhoto(
        ctx, dims.width, dims.height,
        photo, ps,
        tileGrid, canvasScale,
        gridVisible, hidePhoto,
        wallGroupOffsetX_mm, groupTotalWidth_mm
      )
    }

    if (showBoundingBox && photo && settings) {
      drawBoundingBox(
        ctx, dims.width, dims.height,
        photo, settings, canvasScale,
        wallGroupOffsetX_mm, groupTotalWidth_mm
      )
    }
  }, [wall, tile, corners, walls, pixelizer, canvasScale, renderParams, showBoundingBox, photoCache,
      dims.width, dims.height, wallGroupOffsetX_mm, groupTotalWidth_mm])

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
