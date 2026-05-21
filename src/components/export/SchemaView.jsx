// src/components/export/SchemaView.jsx
import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Maximize2, Camera } from 'lucide-react'
import EmptyState from '../shared/EmptyState.jsx'
import { drawSchema } from '../../utils/schemaRenderer.js'
import { buildPalette } from '../../utils/buildPalette.js'
import { buildSchemaLayout } from '../../utils/schemaRenderer.js'
import { useProjectStore } from '../../store/projectStore.js'

export default function SchemaView({ height, palette, onAction }) {
  const walls     = useProjectStore((s) => s.walls)
  const tile      = useProjectStore((s) => s.tile)
  const tileColors = useProjectStore((s) => s.pixelizer.tileColors)

  const canvasRef     = useRef(null)
  const transformRef  = useRef(null)
  const [showReset, setShowReset]   = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(0)

  const hasTileColors = useMemo(
    () => Object.keys(tileColors).length > 0,
    [tileColors]
  )

  // palette передаётся сверху из ExportTab, чтобы один источник
  const effectivePalette = palette ?? []

  // Рассчитываем ширину canvas (totalWidth из layout)
  const layout = useMemo(() => {
    if (!hasTileColors) return null
    const availH = (height || 300) - 32
    return buildSchemaLayout(walls, tile, availH)
  }, [walls, tile, height, hasTileColors])

  const cWidth = layout ? Math.max(layout.totalWidth, 320) : 320

  // Перерисовываем canvas при изменении данных или размера
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasTileColors) return

    // Устанавливаем CSS-ширину canvas
    const containerWidth = canvas.parentElement?.offsetWidth || cWidth
    canvas.style.width  = `${Math.max(cWidth, containerWidth)}px`
    canvas.style.height = `${(height || 300) - 4}px`

    drawSchema(canvas, { walls, tile, tileColors, palette: effectivePalette })
  }, [walls, tile, tileColors, effectivePalette, height, cWidth, hasTileColors])

  const handleReset = useCallback(() => {
    transformRef.current?.resetTransform()
  }, [])

  if (!hasTileColors) {
    return (
      <div style={{ ...s.root, height }}>
        <EmptyState
          icon={<Camera size={28} color="#818cf8" style={{ opacity: 0.4 }} />}
          title="Схема не готова"
          subtitle="Перейдите во вкладку Фото и нажмите «Пикселизировать»"
          actionLabel="→ Перейти в Фото"
          onAction={onAction}
        />
      </div>
    )
  }

  return (
    <div style={{ ...s.root, height }}>
      <TransformWrapper
        ref={transformRef}
        minScale={0.3}
        maxScale={8}
        limitToBounds={false}
        onTransformed={(_, state) => {
          setShowReset(Math.abs(state.scale - 1) > 0.05 || Math.abs(state.positionX) > 4 || Math.abs(state.positionY) > 4)
        }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%', overflow: 'hidden' }}
          contentStyle={{ cursor: 'grab' }}
        >
          <canvas
            ref={canvasRef}
            style={s.canvas}
          />
        </TransformComponent>
      </TransformWrapper>

      {showReset && (
        <button style={s.resetBtn} onClick={handleReset} aria-label="Сбросить зум">
          <Maximize2 size={16} color="#94a3b8" />
        </button>
      )}
    </div>
  )
}

const s = {
  root: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    background: '#08080f',
  },
  canvas: {
    display: 'block',
    background: '#08080f',
  },
  resetBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(14,16,24,0.85)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    cursor: 'pointer',
    zIndex: 10,
  },
}
