// src/components/export/ExportTab.jsx
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { buildPalette } from '../../utils/buildPalette.js'
import SchemaView from './SchemaView.jsx'
import SchemaLegend from './SchemaLegend.jsx'

const MIN_TOP_RATIO    = 0.30
const MIN_BOTTOM_RATIO = 0.25
const DEFAULT_RATIO    = 0.60

export default function ExportTab() {
  const walls      = useProjectStore((s) => s.walls)
  const tile       = useProjectStore((s) => s.tile)
  const tileColors = useProjectStore((s) => s.pixelizer.tileColors)
  const setActiveTab = useProjectStore((s) => s.setActiveTab)

  const palette = useMemo(() => buildPalette(walls, tileColors), [walls, tileColors])

  const containerRef = useRef(null)
  const [ratio, setRatio] = useState(DEFAULT_RATIO)
  const dragging = useRef(false)
  const startY   = useRef(0)
  const startRatio = useRef(DEFAULT_RATIO)

  // Пересчёт высот
  const [containerH, setContainerH] = useState(0)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setContainerH(entry.contentRect.height)
    })
    obs.observe(el)
    setContainerH(el.clientHeight)
    return () => obs.disconnect()
  }, [])

  const topH    = Math.round(containerH * ratio)
  const bottomH = containerH - topH - 4  // 4px — handle

  // --- Drag handle handlers ---
  const onHandlePointerDown = useCallback((e) => {
    e.preventDefault()
    dragging.current  = true
    startY.current    = e.clientY
    startRatio.current = ratio
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }, [ratio])

  const onPointerMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return
    const delta = e.clientY - startY.current
    const newRatio = startRatio.current + delta / containerRef.current.clientHeight
    const clamped = Math.max(MIN_TOP_RATIO, Math.min(1 - MIN_BOTTOM_RATIO, newRatio))
    setRatio(clamped)
  }, [])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }, [onPointerMove])

  return (
    <div ref={containerRef} style={s.root}>
      {/* Верхняя часть — развёртка стен */}
      <SchemaView
        height={topH}
        palette={palette}
        onAction={() => setActiveTab('pixelizer')}
      />

      {/* Drag handle */}
      <div
        style={s.handle}
        onPointerDown={onHandlePointerDown}
        role="separator"
        aria-orientation="horizontal"
      >
        <div style={s.handleDots}>
          <span style={s.dot} />
          <span style={s.dot} />
          <span style={s.dot} />
        </div>
      </div>

      {/* Нижняя часть — легенда */}
      <SchemaLegend
        height={bottomH}
        palette={palette}
        walls={walls}
        tile={tile}
      />
    </div>
  )
}

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#08080f',
    overflow: 'hidden',
  },
  handle: {
    flexShrink: 0,
    height: 4,
    touchAction: 'none',
    cursor: 'row-resize',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Расширенная touch-зона через pseudo-element недоступна в инлайн-стилях —
    // используем паддинг и отрицательные margin для увеличения hit area
    margin: '-10px 0',
    padding: '10px 0',
    zIndex: 5,
    borderTop:    '1px solid rgba(255,255,255,0.06)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  handleDots: {
    display: 'flex',
    gap: 3,
    pointerEvents: 'none',
  },
  dot: {
    display: 'block',
    width: 20,
    height: 3,
    background: '#475569',
    borderRadius: 2,
  },
}
