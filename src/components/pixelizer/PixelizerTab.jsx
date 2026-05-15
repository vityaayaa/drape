// src/components/pixelizer/PixelizerTab.jsx
import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { loadPhoto, savePhoto, deletePhoto } from '../../store/persistence.js'
import { computeScale } from '../../utils/pixelizerGeometry.js'
import { wallCanvasDimensions } from '../../utils/pixelizerGeometry.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import { sampleWallColors } from '../../utils/pixelizerSampler.js'
import PhotoPanorama from './PhotoPanorama.jsx'
import ControlsPane from './ControlsPane.jsx'
import ActionBar from './ActionBar.jsx'
import WallSelectSheet from './WallSelectSheet.jsx'
import WallsSheet from './WallsSheet.jsx'
import Toast from './Toast.jsx'

export default function PixelizerTab() {
  const {
    walls, tile, corners, pixelizer,
    setPixelizerMode, setGridVisible, setPhotoSettings, setTileColors, setVisibleWalls,
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
  const [panoramaH, setPanoramaH] = useState(window.innerHeight * 0.40)

  useEffect(() => {
    const el = panoramaRef.current
    if (!el) return
    const h = el.clientHeight
    if (h > 0) setPanoramaH(h)
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
      const valid = results.filter(Boolean)
      if (!valid.length) return
      setPhotoCache(prev => {
        const n = new Map(prev)
        valid.forEach(({ photoId, bmp }) => n.set(photoId, bmp))
        return n
      })
      setThumbCache(prev => {
        const n = new Map(prev)
        valid.forEach(({ photoId, thumbUrl }) => n.set(photoId, thumbUrl))
        return n
      })
    })
  }, [pixelizer.photoSettings])

  // ── Синхронизация eyeMode → store ──
  useEffect(() => {
    const needGrid = eyeMode === 'photo+grid' || eyeMode === 'grid'
    if (needGrid !== pixelizer.gridVisible) setGridVisible(needGrid)
  }, [eyeMode])

  // ── Toast ──
  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3200)
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
    if (activePhotoId) {
      walls.forEach(w => {
        if (pixelizer.photoSettings[w.id]?.photoId === activePhotoId) {
          setPhotoSettings(w.id, null)
        }
      })
    }
    setActivePhotoId(null)
    setUiMode('navigate')
  }

  async function handleDeletePhoto(photoId) {
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
  }

  // Редактирование существующего фото
  function handleEditPhoto(photoId) {
    setActivePhotoId(photoId)
    setUiMode('transform')
  }

  // ── Пикселизация ──
  async function handlePixelize() {
    if (!hasPhotos) { showToast('Добавьте фото для пикселизации'); return }
    setSampling(true)

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
      const tileGrid = {
        columns:  gr.columns,
        rows:     gr.rows,
        tileW_mm:  parseFloat(tile.tile_width)  || 0,
        tileH_mm:  parseFloat(tile.tile_height) || 0,
        groutW_mm: parseFloat(tile.grout_width) || 0,
        masks:     wall.masks,
      }
      const photoGroup = walls.filter(w => pixelizer.photoSettings[w.id]?.photoId === ps.photoId)
      const wallIndexInGroup = photoGroup.findIndex(w => w.id === wall.id)
      const wallGroupOffsetX_mm = photoGroup
        .slice(0, wallIndexInGroup)
        .reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)
      const groupTotalWidth_mm = photoGroup
        .reduce((sum, w) => sum + (parseFloat(w.length) || 0) * 10, 0)

      const colors = await sampleWallColors(blob, ps, tileGrid, dims.width, dims.height, canvasScale, wallGroupOffsetX_mm, groupTotalWidth_mm)
      setTileColors(wall.id, colors)
    }

    setPixelizerMode('mosaic')
    setEyeMode('mosaic')
    setSampling(false)
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
            eyeMode={eyeMode}
            onEyeMode={setEyeMode}
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
            onAddPhoto={handleAddPhoto}
            onShowWalls={() => setShowWalls(true)}
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
  const { setActiveTab } = useProjectStore()
  return (
    <div style={s.emptyRoot}>
      <svg width="72" height="54" viewBox="0 0 72 54" fill="none" style={{ marginBottom: 16, opacity: 0.25 }}>
        <rect x="2" y="7" width="20" height="45" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <rect x="27" y="16" width="18" height="36" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <rect x="50" y="2" width="20" height="50" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
        <line x1="2" y1="52" x2="70" y2="52" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 3"/>
      </svg>
      <p style={s.emptyTitle}>Нет стен</p>
      <p style={s.emptyHint}>Добавьте стены в разделе «Комната»,{'\n'}затем вернитесь сюда</p>
      <button style={s.emptyBtn} onClick={() => setActiveTab('room')}>
        Перейти в «Комнату» →
      </button>
    </div>
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
    height: '40vh',
    minHeight: 160,
    maxHeight: 280,
    flexShrink: 0,
  },
  bottom: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  emptyRoot: {
    flex: 1, height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '32px',
    textAlign: 'center',
    background: '#08080f',
  },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 8 },
  emptyHint:  { fontSize: 13, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6, marginBottom: 24, whiteSpace: 'pre-line' },
  emptyBtn: {
    padding: '11px 28px',
    background: 'rgba(129,140,248,0.12)',
    border: '1px solid rgba(129,140,248,0.30)',
    borderRadius: 12,
    color: '#818cf8',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
}
