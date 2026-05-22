// src/components/layout/LayoutTab.jsx
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { useLayoutStore }  from '../../store/layoutStore.js'
import LayoutWallPreview   from './LayoutWallPreview.jsx'
import LayoutTileCard      from './LayoutTileCard.jsx'
import LayoutNav           from './LayoutNav.jsx'
import LayoutModeSwitch    from './LayoutModeSwitch.jsx'
import LayoutDoneScreen    from './LayoutDoneScreen.jsx'
import EmptyState          from '../ui/EmptyState.jsx'
import { buildPalette }    from '../../utils/buildPalette.js'

function useWakeLock(enabled) {
  const lockRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function acquire() {
      try {
        lockRef.current = await navigator.wakeLock.request('screen')
      } catch { /* Safari может не поддерживать */ }
    }

    acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [enabled])
}

export default function LayoutTab() {
  const tile       = useProjectStore((st) => st.tile)
  const walls      = useProjectStore((st) => st.walls)
  const tileColors = useProjectStore((st) => st.pixelizer.tileColors)
  const setTab     = useProjectStore((st) => st.setActiveTab)

  const {
    mode, currentIndex, sequence,
    setMode, goNext, goPrev, goTo,
    markCompleted, isCompleted, resetProgress,
    rebuildSequence, currentTile, findAndGoTo,
    completedSet,
  } = useLayoutStore()

  const palette = useMemo(
    () => buildPalette(walls, tileColors),
    [walls, tileColors]
  )

  useEffect(() => {
    rebuildSequence(walls, tile, tileColors, palette)
  }, [walls, tile, tileColors, rebuildSequence, palette, mode])

  useWakeLock(true)

  const activeTile  = currentTile()
  const totalCount  = sequence.length
  const isDone      = currentIndex >= totalCount && totalCount > 0
  const completedSt = completedSet()

  const currentWall = activeTile
    ? walls.find((w) => w.id === activeTile.wallId) ?? null
    : null

  const noPalette = totalCount > 0 && Object.keys(tileColors).length === 0
  const progress = totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0

  const handleModeChange = useCallback((newMode) => setMode(newMode), [setMode])
  const handleTileClick = useCallback((col, canvasRow) => {
    if (!currentWall) return
    findAndGoTo(currentWall.id, col, canvasRow)
  }, [currentWall, findAndGoTo])
  const handleGoToSchema = useCallback(() => setTab('export'), [setTab])

  // ── Нет активных стен ────────────────────────────────────
  const activeWalls = walls.filter((w) => w.mosaic_active && w.wall_active)
  if (activeWalls.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Добавьте стены"
        description="Добавьте стены в разделе «Комната» и включите для них режим укладки."
        actionLabel="Перейти в Комнату"
        onAction={() => setTab('room')}
      />
    )
  }

  // ── Экран завершения ─────────────────────────────────────
  if (isDone) {
    const completed = completedSt.size
    return (
      <div style={s.page}>
        <LayoutDoneScreen
          stats={{ total: totalCount, completed }}
          onReset={resetProgress}
          onGoToSchema={handleGoToSchema}
        />
      </div>
    )
  }

  return (
    <div style={s.page}>
      {/* Тулбар */}
      <div style={s.toolbar}>
        <LayoutModeSwitch mode={mode} onModeChange={handleModeChange} />
        <div style={s.counterBlock}>
          <span style={s.counterMain}>
            {totalCount > 0 ? `${currentIndex + 1}` : '—'}
            <span style={s.counterDim}> / {totalCount.toLocaleString()}</span>
          </span>
          <span style={s.counterPct}>{progress}%</span>
        </div>
      </div>

      {/* Превью стены */}
      {currentWall && (
        <div style={s.previewWrap}>
          <div style={s.wallLabel}>{currentWall.name}</div>
          <LayoutWallPreview
            wall={currentWall}
            globalTile={tile}
            tileColors={tileColors}
            currentTile={activeTile ? {
              wallId: activeTile.wallId,
              col:    activeTile.col,
              row:    activeTile.row,
            } : null}
            completedSet={completedSt}
            onTileClick={handleTileClick}
          />
        </div>
      )}

      {/* Карточка плитки */}
      <div style={s.cardWrap}>
        <LayoutTileCard
          currentTileData={activeTile}
          totalCount={totalCount}
          currentIndex={currentIndex}
          noPalette={noPalette}
          isCompleted={activeTile ? isCompleted(activeTile) : false}
          onMarkCompleted={() => activeTile && markCompleted(activeTile)}
        />
      </div>

      {/* Навигация */}
      <div style={s.navWrap}>
        <LayoutNav
          currentIndex={currentIndex}
          totalCount={totalCount}
          onPrev={goPrev}
          onNext={goNext}
          onGoTo={goTo}
        />
      </div>
    </div>
  )
}

const s = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg)',
    overflowY: 'auto',
    gap: 12,
    // Нижний отступ — чтобы последняя кнопка не уходила под нижнюю навигацию.
    paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 0',
    flexShrink: 0,
    gap: 12,
  },
  counterBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  counterMain: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  counterDim: { color: 'var(--text-disabled)', fontWeight: 500 },
  counterPct: { fontSize: 10, color: 'var(--accent-light)', fontWeight: 600 },
  previewWrap: {
    flexShrink: 0,
    position: 'relative',
  },
  wallLabel: {
    position: 'absolute',
    top: 8,
    left: 12,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-primary)',
    background: 'rgba(8,8,15,0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    zIndex: 5,
    pointerEvents: 'none',
  },
  cardWrap: {
    padding: '0 16px',
    flexShrink: 0,
  },
  navWrap: {
    flexShrink: 0,
    paddingBottom: 8,
  },
}
