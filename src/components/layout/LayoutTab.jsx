// src/components/layout/LayoutTab.jsx
//
// Вкладка «Укладка»: пошаговый помощник для укладчика плитки.
// Собирает всё вместе: WallPreview, TileCard, Nav, ModeSwitch, DoneScreen.

import { useEffect, useRef, useCallback } from 'react'
import { Layers } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { useLayoutStore }  from '../../store/layoutStore.js'
import LayoutWallPreview   from './LayoutWallPreview.jsx'
import LayoutTileCard      from './LayoutTileCard.jsx'
import LayoutNav           from './LayoutNav.jsx'
import LayoutModeSwitch    from './LayoutModeSwitch.jsx'
import LayoutDoneScreen    from './LayoutDoneScreen.jsx'

// ── Wake Lock ─────────────────────────────────────────────────────────────────

function useWakeLock(enabled) {
  const lockRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function acquire() {
      try {
        lockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Safari и некоторые браузеры не поддерживают Wake Lock
      }
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

// ── Пустые состояния ──────────────────────────────────────────────────────────

function EmptyState({ icon, title, hint }) {
  return (
    <div style={s.emptyWrap}>
      <div style={s.emptyIcon}>{icon}</div>
      <p style={s.emptyTitle}>{title}</p>
      <p style={s.emptyHint}>{hint}</p>
    </div>
  )
}

// ── Основной компонент ────────────────────────────────────────────────────────

export default function LayoutTab() {
  const tile       = useProjectStore((st) => st.tile)
  const walls      = useProjectStore((st) => st.walls)
  const tileColors = useProjectStore((st) => st.pixelizer.tileColors)
  const setTab     = useProjectStore((st) => st.setActiveTab)

  const {
    mode,
    currentIndex,
    sequence,
    setMode,
    goNext,
    goPrev,
    goTo,
    markCompleted,
    isCompleted,
    resetProgress,
    rebuildSequence,
    currentTile,
    findAndGoTo,
    completedSet,
    stats,
  } = useLayoutStore()

  // Перестройка последовательности при изменении данных проекта
  useEffect(() => {
    rebuildSequence(walls, tile, tileColors, null)
  }, [walls, tile, tileColors, rebuildSequence])

  // Wake Lock пока вкладка открыта
  useWakeLock(true)

  // Производные значения
  const activeTile   = currentTile()
  const totalCount   = sequence.length
  const isDone       = currentIndex >= totalCount && totalCount > 0
  const completedSt  = completedSet()
  const seqStats     = stats()

  // Стена текущей плитки
  const currentWall = activeTile
    ? walls.find((w) => w.id === activeTile.wallId) ?? null
    : null

  // Есть ли пикселизация хоть на одной стене последовательности
  const noPalette = totalCount > 0 && Object.keys(tileColors).length === 0

  // Переключение режима — сброс на начало
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode)
  }, [setMode])

  // Клик по плитке на превью → переход к ней
  const handleTileClick = useCallback((col, canvasRow) => {
    if (!currentWall) return
    findAndGoTo(currentWall.id, col, canvasRow)
  }, [currentWall, findAndGoTo])

  // «В схему» со страницы Done
  const handleGoToSchema = useCallback(() => {
    setTab('schema')
  }, [setTab])

  // ── Нет активных стен ─────────────────────────────────────────────────────
  const activeWalls = walls.filter((w) => w.mosaic_active && w.wall_active)
  if (activeWalls.length === 0) {
    return (
      <div style={s.page}>
        <EmptyState
          icon={<Layers size={48} color="#334155" />}
          title="Нет активных стен"
          hint="Добавьте стены в разделе «Комната» и включите для них режим укладки"
        />
      </div>
    )
  }

  // ── Экран завершения ──────────────────────────────────────────────────────
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

  // ── Основной экран ────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Тулбар */}
      <div style={s.toolbar}>
        <LayoutModeSwitch mode={mode} onModeChange={handleModeChange} />
        <span style={s.counter}>
          {totalCount > 0 ? `${currentIndex + 1} / ${totalCount}` : '—'}
        </span>
      </div>

      {/* Превью стены */}
      {currentWall && (
        <div style={s.previewWrap}>
          <LayoutWallPreview
            wall={currentWall}
            globalTile={tile}
            tileColors={tileColors}
            currentTile={activeTile ? {
              wallId: activeTile.wallId,
              col:    activeTile.col,
              row:    activeTile.row,   // canvasRow
            } : null}
            completedSet={completedSt}
            onTileClick={handleTileClick}
          />
          <div style={s.wallLabel}>{currentWall.name}</div>
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

// ── Стили ─────────────────────────────────────────────────────────────────────

const s = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#08080f',
    overflowY: 'auto',
    gap: 12,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 0',
    flexShrink: 0,
  },
  counter: {
    fontSize: 13,
    color: '#475569',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 500,
  },
  previewWrap: {
    flexShrink: 0,
    position: 'relative',
  },
  wallLabel: {
    position: 'absolute',
    top: 8,
    left: 12,
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
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
  // Empty state
  emptyWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '40px 32px',
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: '#475569',
    margin: 0,
  },
  emptyHint: {
    fontSize: 13,
    color: '#334155',
    margin: 0,
    lineHeight: 1.5,
  },
}
