// src/components/pixelizer/PhotoPanorama.jsx
import { useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import WallCanvas from './WallCanvas.jsx'

export default function PhotoPanorama({
  walls, pixelizer, tile, corners, canvasScale,
  uiMode, selectedWallIds, renderParams, activePhotoId,
  photoCache, eyeMode, onEyeCycle, onWallTap,
  onPhotoGestureMove, onPhotoGestureScale,
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

  function handleEyeCycle() {
    setEyeAnimating(true)
    setTimeout(() => setEyeAnimating(false), 250)
    onEyeCycle()
  }

  const eyeIcon = eyeMode === 'grid'
    ? <GridIcon />
    : eyeMode === 'mosaic'
    ? <MosaicIcon />
    : <EyeIcon />

  return (
    <div style={s.container}>
      <TransformWrapper
        initialScale={initialScale}
        minScale={0.15}
        maxScale={8}
        limitToBounds={false}
        centerOnInit={true}
        panning={{ disabled: isAddPhoto, velocityDisabled: false }}
        pinch={{ disabled: isAddPhoto }}
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

      {/* Кнопка «глаз» */}
      <button
        style={s.eyeBtn}
        className={eyeAnimating ? 'eye-pop' : ''}
        onClick={handleEyeCycle}
        title="Режим отображения"
      >
        {eyeIcon}
      </button>

      {/* Метка текущего режима вида */}
      <EyeLabel eyeMode={eyeMode} />
    </div>
  )
}

function WallDivider({ height }) {
  return (
    <div
      style={{
        width: 1,
        height: height + 24,
        alignSelf: 'flex-end',
        flexShrink: 0,
        marginBottom: 20,
        background: 'linear-gradient(to bottom, rgba(129,140,248,0) 0%, rgba(129,140,248,0.30) 12%, rgba(129,140,248,0.30) 88%, rgba(129,140,248,0.10) 100%)',
        filter: 'drop-shadow(0 0 3px rgba(129,140,248,0.35))',
      }}
    />
  )
}

function EyeLabel({ eyeMode }) {
  const labels = {
    'photo':      'Фото',
    'photo+grid': 'Фото + сетка',
    'grid':       'Только сетка',
    'mosaic':     'Мозаика',
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
    display: 'flex',
    alignItems: 'flex-end',
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
  eyeBtn: {
    position: 'absolute',
    top: 12, right: 12,
    width: 40, height: 40,
    background: 'rgba(8,8,15,0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 11,
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  eyeLabel: {
    position: 'absolute',
    top: 22, right: 60,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
  },
}
