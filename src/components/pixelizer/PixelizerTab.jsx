// src/components/pixelizer/PixelizerTab.jsx
import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { loadPhoto, savePhoto, deletePhoto } from '../../store/persistence.js'
import { computeScale, wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { sampleWallColorsWorker } from '../../utils/pixelizerSampler.js'
import { resolveWallTile } from '../../utils/schemaRenderer.js'
import PhotoPanorama from './PhotoPanorama.jsx'
import ControlsPane from './ControlsPane.jsx'
import ActionBar from './ActionBar.jsx'
import WallSelectSheet from './WallSelectSheet.jsx'
import WallsSheet from './WallsSheet.jsx'
import Toast from './Toast.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { LayoutGrid } from 'lucide-react'

export default function PixelizerTab() {
  const {
    walls, tile, corners, pixelizer,
    setPixelizerMode, setGridVisible, setPhotoSettings, setTileColors,
  } = useProjectStore()

  // ── UI State Machine ──
  const [uiMode, setUiMode] = useState('navigate') // 'navigate' | 'addPhoto' | 'transform'
  const [selectedWallIds, setSelectedWallIds] = useState([])
  const [activePhotoId, setActivePhotoId] = useState(null)

  // ── Вид / Eye mode ──
  const [eyeMode, setEyeMode] = useState(() =>
    pixelizer.mode === 'mosaic' ? 'mosaic' : (pixelizer.gridVisible ? 'photo+grid' : 'photo')
  )

  // ── UI feedback ──
  const [toastMsg, setToastMsg]   = useState(null)
  const [sampling, setSampling]   = useState(false)
  const [showWalls, setShowWalls] = useState(false)

  // ── Кеш ──
  const [photoCache, setPhotoCache] = useState(new Map())
  const [thumbCache, setThumbCache] = useState(new Map())

  // ── Высота панорамы ──
  const panoramaRef = useRef(null)
  const toastTimerRef = useRef(null)
  const [panoramaH, setPanoramaH] = useState(window.innerHeight * 0.40)

  useEffect(() => {
    const el = panoramaRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const h = entries[0].contentRect.height
      if (h > 0) setPanoramaH(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── canvasScale ──
  const canvasScale = useMemo(
    () => computeScale(walls, panoramaH * 0.85),
    [walls, panoramaH]
  )

  // ── Стены ──
  const visibleWalls = useMemo(() =>
    walls.filter(w => {
      if (!w.wall_active) return false
      if (pixelizer.visibleWalls === null) return true
      return pixelizer.visibleWalls.includes(w.id)
    }),
    [walls, pixelizer.visibleWalls]
  )

  // ── Группы фото ──
  const photoGroups = useMemo(() => {
    const groups = {}
    walls.forEach(wall => {
      const ps = pixelizer.photoSettings[wall.id]
      if (!ps?.photoId) return
      if (!groups[ps.photoId]) {
        groups[ps.photoId] = { photoId: ps.photoId, walls: [], settings: ps }
      }
      groups[ps.photoId].walls.push(wall)
    })
    return Object.values(groups)
  }, [walls, pixelizer.photoSettings])

  const hasPhotos = photoGroups.length > 0
  const anyStale  = walls.some(w =>
    pixelizer.tileColorsStale[w.id] !== false && pixelizer.photoSettings[w.id]?.photoId
  )

  // ── Синхронизация selectedWallIds при удалении стен ──
  useEffect(() => {
    setSelectedWallIds(prev => prev.filter(id => walls.some(w => w.id === id)))
  }, [walls])

  // ── Загрузка кеша фото ──
  useEffect(() => {
    let cancelled = false
    const photoIds = [...new Set(
      Object.values(pixelizer.photoSettings).map(s => s?.photoId).filter(Boolean)
    )]
    Promise.all(photoIds.map(async photoId => {
      if (photoCache.has(photoId)) return null
      const blob = await loadPhoto(photoId)
      if (!blob) return null
      const bmp = await createImageBitmap(blob)
      // Миниатюра для PhotoCard
      const tc = document.createElement('canvas')
      tc.width = 60; tc.height = 40
      tc.getContext('2d').drawImage(bmp, 0, 0, 60, 40)
      const thumbUrl = tc.toDataURL('image/jpeg', 0.7)
      return { photoId, bmp, thumbUrl }
    })).then(results => {
      if (cancelled) return
      const valid = results.filter(Boolean)
      if (!valid.length) return
      setPhotoCache(prev => {
        const n = new Map(prev)
        valid.forEach(({ photoId, bmp }) => {
          const old = n.get(photoId)
          if (old && old !== bmp) old.close()
          n.set(photoId, bmp)
        })
        return n
      })
      setThumbCache(prev => {
        const n = new Map(prev)
        valid.forEach(({ photoId, thumbUrl }) => n.set(photoId, thumbUrl))
        return n
      })
    })
    return () => { cancelled = true }
  }, [pixelizer.photoSettings])

  // ── Синхронизация eyeMode → store ──
  useEffect(() => {
    const needGrid = eyeMode === 'photo+grid' || eyeMode === 'grid'
    if (needGrid !== pixelizer.gridVisible) setGridVisible(needGrid)
  }, [eyeMode, pixelizer.gridVisible, setGridVisible])

  // ── Toast ──
  const showToast = useCallback((msg) => {
    clearTimeout(toastTimerRef.current)
    setToastMsg(msg)
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2500)
  }, [])

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current)
  }, [])

  // ── Eye cycling ──
  const cycleEye = useCallback(() => {
    if (pixelizer.mode === 'mosaic') {
      setEyeMode(m => m === 'mosaic' ? 'photo+grid' : 'mosaic')
    } else {
      setEyeMode(m => ({ photo: 'photo+grid', 'photo+grid': 'grid', grid: 'photo' }[m] ?? 'photo'))
    }
  }, [pixelizer.mode])

  // ── addPhoto flow ──
  function handleAddPhoto() {
    setSelectedWallIds([])
    setUiMode('addPhoto')
  }

  function handleWallTap(wallId) {
    if (uiMode !== 'addPhoto') return
    setSelectedWallIds(prev =>
      prev.includes(wallId) ? prev.filter(id => id !== wallId) : [...prev, wallId]
    )
  }

  function handleSelectAll() {
    setSelectedWallIds(visibleWalls.map(w => w.id))
  }

  async function handlePhotoFile(file) {
    const blob    = new Blob([await file.arrayBuffer()], { type: file.type })
    const photoId = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    await savePhoto(photoId, blob)

    const targets = selectedWallIds.length > 0
      ? walls.filter(w => selectedWallIds.includes(w.id))
      : visibleWalls

    for (const wall of targets) {
      setPhotoSettings(wall.id, {
        photoId,
        offsetX_mm:  0,
        offsetY_mm:  0,
        scale:       1.0,
        opacity:     0.85,
        brightness:  1.0,
        contrast:    1.0,
        saturation:  1.0,
      })
    }
    setActivePhotoId(photoId)
    setUiMode('transform')
  }

  // ── Transform ──
  function handleTransformDone() {
    setActivePhotoId(null)
    setUiMode('navigate')
  }

  function handleTransformDelete() {
    const photoId = activePhotoId
    if (photoId) {
      walls.forEach(w => {
        if (pixelizer.photoSettings[w.id]?.photoId === photoId) {
          setPhotoSettings(w.id, null)
        }
      })
      deletePhoto(photoId)
      setPhotoCache(prev => { const n = new Map(prev); n.delete(photoId); return n })
      setThumbCache(prev => { const n = new Map(prev); n.delete(photoId); return n })
    }
    setActivePhotoId(null)
    setUiMode('navigate')
  }

  const handlePhotoGestureMove = useCallback((dx_mm, dy_mm) => {
    const activeWalls = walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === activePhotoId)
    activeWalls.forEach(w => {
      const ps = pixelizer.photoSettings[w.id]
      if (!ps) return
      setPhotoSettings(w.id, {
        ...ps,
        offsetX_mm: (ps.offsetX_mm ?? 0) + dx_mm,
        offsetY_mm: (ps.offsetY_mm ?? 0) + dy_mm,
      })
    })
  }, [walls, pixelizer.photoSettings, activePhotoId, setPhotoSettings])

  const handlePhotoGestureScale = useCallback((newScale) => {
    const activeWalls = walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === activePhotoId)
    activeWalls.forEach(w => {
      const ps = pixelizer.photoSettings[w.id]
      if (!ps) return
      setPhotoSettings(w.id, { ...ps, scale: newScale })
    })
  }, [walls, pixelizer.photoSettings, activePhotoId, setPhotoSettings])

  const handleDeletePhoto = useCallback(async (photoId) => {
    walls.forEach(w => {
      if (pixelizer.photoSettings[w.id]?.photoId === photoId) {
        setPhotoSettings(w.id, null)
      }
    })
    if (activePhotoId === photoId) {
      setActivePhotoId(null)
      setUiMode('navigate')
    }
    await deletePhoto(photoId)
    setPhotoCache(prev => { const n = new Map(prev); n.delete(photoId); return n })
    setThumbCache(prev => { const n = new Map(prev); n.delete(photoId); return n })
  }, [walls, pixelizer.photoSettings, activePhotoId, setPhotoSettings])

  // Редактирование существующего фото
  function handleEditPhoto(photoId) {
    setActivePhotoId(photoId)
    setUiMode('transform')
  }

  // ── Пикселизация ──
  async function handlePixelize() {
    if (!hasPhotos) { showToast('Добавьте фото для пикселизации'); return }
    setSampling(true)
    try {
      const gridResults = calculateGrid(tile, walls, corners)
      const targets = walls.filter(w => {
        const ps = pixelizer.photoSettings[w.id]
        return ps?.photoId && (pixelizer.tileColorsStale[w.id] !== false)
      })

      for (const wall of targets) {
        const idx = walls.findIndex(w => w.id === wall.id)
        const gr  = gridResults[idx]
        if (!gr) continue
        const ps   = pixelizer.photoSettings[wall.id]
        const blob = await loadPhoto(ps.photoId)
        if (!blob) continue
        const dims  = wallCanvasDimensions(wall, canvasScale)
        const resolved = resolveWallTile(wall, tile)
        const tileGrid = {
          columns:  gr.columns,
          rows:     gr.rows,
          tileW_mm:  resolved.tileW / 10,
          tileH_mm:  resolved.tileH / 10,
          groutW_mm: resolved.groutW / 10,
          masks:     wall.masks,
        }
        const photoGroup = walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === ps.photoId)
        const wallIndexInGroup = photoGroup.findIndex(w => w.id === wall.id)
        const wallGroupOffsetX_mm = photoGroup
          .slice(0, wallIndexInGroup)
          .reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)
        const groupTotalWidth_mm = photoGroup
          .reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)

        const colors = await sampleWallColorsWorker(blob, ps, tileGrid, dims.width, dims.height, canvasScale, wallGroupOffsetX_mm, groupTotalWidth_mm)
        setTileColors(wall.id, colors)
      }

      setPixelizerMode('mosaic')
      setEyeMode('mosaic')
    } catch (e) {
      showToast('Ошибка пикселизации: ' + e.message)
    } finally {
      setSampling(false)
    }
  }

  // ── Прозрачность фото ──
  function handleOpacity(photoId, opacity) {
    walls.forEach(w => {
      const ps = pixelizer.photoSettings[w.id]
      if (ps?.photoId === photoId) setPhotoSettings(w.id, { ...ps, opacity })
    })
  }

  // ── Render params (что рисует canvas) ──
  const renderParams = useMemo(() => {
    const isMosaic = pixelizer.mode === 'mosaic' && eyeMode === 'mosaic'
    return {
      useMosaic:   isMosaic,
      hidePhoto:   !isMosaic && eyeMode === 'grid',
      gridVisible: eyeMode === 'photo+grid' || eyeMode === 'grid',
    }
  }, [pixelizer.mode, eyeMode])

  // ── Пустой экран — нет стен ──
  const activeWalls = walls.filter(w => w.wall_active)
  if (activeWalls.length === 0) {
    return <EmptyNoWalls />
  }

  return (
    <div style={s.root}>
      {/* ── Панорама (верхняя часть) ── */}
      <div ref={panoramaRef} style={s.panorama}>
        <PhotoPanorama
          walls={visibleWalls}
          pixelizer={pixelizer}
          tile={tile}
          corners={corners}
          canvasScale={canvasScale}
          uiMode={uiMode}
          selectedWallIds={selectedWallIds}
          renderParams={renderParams}
          activePhotoId={activePhotoId}
          photoCache={photoCache}
          eyeMode={eyeMode}
          onEyeCycle={cycleEye}
          onWallTap={handleWallTap}
          onPhotoGestureMove={handlePhotoGestureMove}
          onPhotoGestureScale={handlePhotoGestureScale}
          onShowWalls={uiMode === 'navigate' ? () => setShowWalls(true) : null}
        />
      </div>

      {/* ── Нижняя половина ── */}
      <div style={s.bottom}>
        {/* Панель управления */}
        {uiMode !== 'addPhoto' && (
          <ControlsPane
            uiMode={uiMode}
            pixelizerMode={pixelizer.mode}
            hasPhotos={hasPhotos}
            photoGroups={photoGroups}
            thumbCache={thumbCache}
            onAddPhoto={handleAddPhoto}
            onOpacityChange={handleOpacity}
            onEditPhoto={handleEditPhoto}
            onDeletePhoto={handleDeletePhoto}
            pixelizer={pixelizer}
            walls={walls}
            onPhotoSettingsChange={setPhotoSettings}
            activePhotoId={activePhotoId}
          />
        )}

        {/* Кнопки действий */}
        {uiMode !== 'addPhoto' && (
          <ActionBar
            uiMode={uiMode}
            pixelizerMode={pixelizer.mode}
            hasPhotos={hasPhotos}
            anyStale={anyStale}
            sampling={sampling}
            onPixelize={handlePixelize}
            onDone={handleTransformDone}
            onDelete={handleTransformDelete}
            onToast={showToast}
          />
        )}

        {/* Шит выбора стен (addPhoto) */}
        {uiMode === 'addPhoto' && (
          <WallSelectSheet
            walls={visibleWalls}
            selectedWallIds={selectedWallIds}
            onToggle={handleWallTap}
            onSelectAll={handleSelectAll}
            onFileSelected={handlePhotoFile}
            onCancel={() => setUiMode('navigate')}
          />
        )}
      </div>

      {/* Шит стен */}
      {showWalls && <WallsSheet onClose={() => setShowWalls(false)} />}

      {/* Toast */}
      <Toast message={toastMsg} />
    </div>
  )
}

function EmptyNoWalls() {
  const setActiveTab = useProjectStore((s) => s.setActiveTab)
  return (
    <EmptyState
      icon={LayoutGrid}
      title="Сначала добавьте стены"
      description="Добавьте стены в разделе «Комната» — потом сможете накладывать фото."
      actionLabel="Перейти в Комнату"
      onAction={() => setActiveTab('room')}
    />
  )
}

const s = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100%',
    background: '#08080f',
    overflow: 'hidden',
  },
  panorama: {
    height: '50vh',
    minHeight: 240,
    maxHeight: '60vh',
    flexShrink: 0,
  },
  bottom: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
}
