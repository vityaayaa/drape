// src/components/pixelizer/PhotoPanorama.jsx
import { useState, useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Layers, Maximize } from 'lucide-react'
import WallCanvas from './WallCanvas.jsx'

export default function PhotoPanorama({
  walls, pixelizer, tile, corners, canvasScale,
  uiMode, selectedWallIds, renderParams, activePhotoId,
  photoCache, eyeMode, onEyeCycle, onWallTap,
  onPhotoGestureMove, onPhotoGestureScale,
  onShowWalls,
}) {
  const [eyeAnimating, setEyeAnimating] = useState(false)

  const isAddPhoto = uiMode === 'addPhoto'
  const isTransform = uiMode === 'transform'

  // Самая высокая стена нужна для разделителей
  const maxCanvasH = walls.reduce((max, w) => {
    const h = parseFloat(w.height)
    if (isNaN(h)) return max
    return Math.max(max, Math.round(h * 10 * canvasScale))
  }, 0)

  // Подбираем начальный масштаб — вся развёртка влезает в ширину экрана
  const totalW = walls.reduce((sum, w) => {
    const len = parseFloat(w.length)
    return sum + (isNaN(len) ? 0 : Math.round(len * 10 * canvasScale))
  }, 0)
  const vpW = typeof window !== 'undefined' ? window.innerWidth : 375
  const initialScale = Math.min(1, (vpW - 32) / Math.max(totalW, 1))

  const [worldScale, setWorldScale] = useState(initialScale)
  const transformRef = useRef(null)

  function handleFitWorld() {
    transformRef.current?.resetTransform()
  }

  function handleEyeCycle() {
    setEyeAnimating(true)
    setTimeout(() => setEyeAnimating(false), 250)
    onEyeCycle()
  }

  const eyeIcon = (eyeMode === 'mosaic' || eyeMode === 'mosaic+grid')
    ? <MosaicIcon />
    : (eyeMode === 'grid' || eyeMode === 'photo+grid')
    ? <GridIcon />
    : <EyeIcon />

  return (
    <div style={s.container}>
      <TransformWrapper
        ref={transformRef}
        initialScale={initialScale}
        minScale={0.15}
        maxScale={8}
        limitToBounds={false}
        centerOnInit={true}
        panning={{ disabled: isAddPhoto, velocityDisabled: true }}
        pinch={{ disabled: isAddPhoto, step: 5 }}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        onTransform={({ state }) => setWorldScale(state.scale)}
      >
        <TransformComponent wrapperStyle={s.transformWrapper} contentStyle={s.transformContent}>
          <div style={s.worldSpace}>
            {/* Линия пола */}
            <div style={s.floorLine} />

            {walls.map((wall, i) => {
              const showBox = isTransform && pixelizer.photoSettings[wall.id]?.photoId === activePhotoId
              return (
                <div key={wall.id} style={{ display: 'flex', alignItems: 'flex-end' }}>
                  {/* Разделитель слева от каждой стены кроме первой */}
                  {i > 0 && <WallDivider height={maxCanvasH} />}
                  <div style={{ paddingBottom: 20 /* место для label */ }}>
                    <WallCanvas
                      wall={wall}
                      tile={tile}
                      corners={corners}
                      walls={walls}
                      pixelizer={pixelizer}
                      canvasScale={canvasScale}
                      renderParams={renderParams}
                      showBoundingBox={showBox}
                      isSelectable={isAddPhoto}
                      isSelected={isAddPhoto && selectedWallIds.includes(wall.id)}
                      onTap={onWallTap}
                      photoCache={photoCache}
                      worldScale={worldScale}
                      onPhotoGestureMove={onPhotoGestureMove}
                      onPhotoGestureScale={onPhotoGestureScale}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Кнопки оверлея: стены (слева) + глаз (справа) */}
      <div style={s.overlayBtns}>
        {isTransform && (
          <button
            style={s.eyeBtn}
            onClick={handleFitWorld}
            title="Уместить на экране"
            aria-label="Уместить на экране"
          >
            <Maximize size={18} />
          </button>
        )}
        {onShowWalls && (
          <button
            style={s.eyeBtn}
            onClick={onShowWalls}
            title="Видимость стен"
            aria-label="Видимость стен"
          >
            <Layers size={18} />
          </button>
        )}
        <button
          style={s.eyeBtn}
          className={eyeAnimating ? 'eye-pop' : ''}
          onClick={handleEyeCycle}
          title="Режим отображения"
          aria-label="Режим отображения"
        >
          {eyeIcon}
        </button>
      </div>

      {/* Метка текущего режима вида */}
      <EyeLabel eyeMode={eyeMode} />
    </div>
  )
}

function WallDivider({ height }) {
  // Линия выступает симметрично: на 40px выше верха стены и на 40px ниже (за пол).
  const overhang = 40
  return (
    <div
      style={{
        width: 2,
        height: height + overhang * 2,
        alignSelf: 'flex-end',
        flexShrink: 0,
        marginBottom: 20 - overhang,
        background: 'linear-gradient(to bottom, rgba(167,139,250,0.15) 0%, rgba(167,139,250,0.75) 20%, rgba(167,139,250,0.75) 80%, rgba(167,139,250,0.15) 100%)',
        filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.6))',
      }}
    />
  )
}

function EyeLabel({ eyeMode }) {
  const labels = {
    'photo':       'Фото',
    'photo+grid':  'Фото + сетка',
    'grid':        'Только сетка',
    'mosaic':      'Мозаика',
    'mosaic+grid': 'Мозаика + сетка',
  }
  return (
    <div style={s.eyeLabel}>{labels[eyeMode] ?? ''}</div>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}

function MosaicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="4" fill="currentColor" opacity="0.7"/>
      <rect x="10" y="3" width="4" height="4" fill="currentColor" opacity="0.5"/>
      <rect x="17" y="3" width="4" height="4" fill="currentColor" opacity="0.9"/>
      <rect x="3" y="10" width="4" height="4" fill="currentColor" opacity="0.6"/>
      <rect x="10" y="10" width="4" height="4" fill="currentColor" opacity="0.8"/>
      <rect x="17" y="10" width="4" height="4" fill="currentColor" opacity="0.4"/>
      <rect x="3" y="17" width="4" height="4" fill="currentColor" opacity="0.9"/>
      <rect x="10" y="17" width="4" height="4" fill="currentColor" opacity="0.5"/>
      <rect x="17" y="17" width="4" height="4" fill="currentColor" opacity="0.7"/>
    </svg>
  )
}

const s = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: 'rgba(12,12,22,0.6)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  transformWrapper: {
    width: '100%',
    height: '100%',
  },
  transformContent: {
    // Контент берёт натуральный размер от worldSpace, чтобы TransformWrapper
    // корректно центрировал и пинчил вокруг точки касания (а не вокруг угла).
    width: 'fit-content',
    height: 'fit-content',
  },
  worldSpace: {
    display: 'flex',
    alignItems: 'flex-end',
    padding: '32px 20px 0',
    position: 'relative',
  },
  floorLine: {
    position: 'absolute',
    bottom: 20,
    left: 0, right: 0,
    height: 1,
    background: 'rgba(255,255,255,0.05)',
    pointerEvents: 'none',
  },
  overlayBtns: {
    position: 'absolute',
    top: 12, right: 12,
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  gestureHint: {
    position: 'absolute',
    top: 60, right: 12,
    padding: '6px 10px',
    background: 'rgba(8,8,15,0.78)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 11,
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
  },
  eyeBtn: {
    width: 40, height: 40,
    background: 'rgba(8,8,15,0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--border-strong)',
    borderRadius: 11,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  eyeLabel: {
    position: 'absolute',
    top: 14, left: 14,
    padding: '5px 10px',
    background: 'rgba(8,8,15,0.7)',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
  },
}
