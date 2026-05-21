// src/components/layout/LayoutNav.jsx
//
// Навигация режима укладки: кнопки Пред/След, swipe-жест, «К плитке…» (bottom sheet).

import { useState, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export default function LayoutNav({
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onGoTo,
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [inputVal, setInputVal]   = useState('')

  // Swipe жест
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(dy) > 30) return  // вертикальный скролл — игнор
    if (Math.abs(dx) < 50) return  // слишком короткий свайп

    if (dx < 0) onNext?.()   // свайп влево → следующая
    else        onPrev?.()   // свайп вправо → предыдущая
  }, [onNext, onPrev])

  const handleGoTo = useCallback(() => {
    const num = parseInt(inputVal, 10)
    if (!isNaN(num) && num >= 1 && num <= totalCount) {
      onGoTo?.(num - 1)  // индекс 0-based
      setSheetOpen(false)
      setInputVal('')
    }
  }, [inputVal, totalCount, onGoTo])

  const isFirst = currentIndex <= 0
  const isLast  = currentIndex >= totalCount - 1

  return (
    <>
      <div
        style={s.root}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Кнопки Пред / След */}
        <div style={s.navRow}>
          <button
            style={{ ...s.btn, ...s.btnPrev, ...(isFirst ? s.btnDisabled : {}) }}
            onClick={onPrev}
            disabled={isFirst}
            aria-label="Предыдущая плитка"
          >
            <ChevronLeft size={22} color={isFirst ? '#334155' : '#94a3b8'} />
            <span style={{ ...s.btnLabel, color: isFirst ? '#334155' : '#94a3b8' }}>
              Предыдущая
            </span>
          </button>

          <button
            style={{ ...s.btn, ...s.btnNext }}
            onClick={onNext}
            aria-label="Следующая плитка"
          >
            <span style={s.btnLabelNext}>Следующая</span>
            <ChevronRight size={22} color="#f1f5f9" />
          </button>
        </div>

        {/* К плитке… */}
        <button
          style={s.goToBtn}
          onClick={() => setSheetOpen(true)}
          aria-label="Перейти к плитке по номеру"
        >
          <Search size={16} color="var(--text-secondary)" />
          <span style={s.goToLabel}>К плитке…</span>
        </button>
      </div>

      {/* Bottom sheet «К плитке» */}
      {sheetOpen && (
        <div style={s.overlay} onClick={() => setSheetOpen(false)}>
          <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.handle} />
            <p style={s.sheetTitle}>Перейти к плитке</p>
            <p style={s.sheetHint}>Номер от 1 до {totalCount}</p>
            <div style={s.sheetRow}>
              <input
                style={s.sheetInput}
                type="text"
                inputMode="numeric"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoTo()}
                placeholder={String(currentIndex + 1)}
                autoFocus
              />
              <button
                style={s.sheetBtn}
                onClick={handleGoTo}
                aria-label="Перейти"
              >
                Перейти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '0 16px',
  },
  navRow: {
    display: 'flex',
    gap: 8,
  },
  btn: {
    flex: 1,
    height: 68,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 500,
  },
  btnPrev: {
    background: 'rgba(255,255,255,0.06)',
  },
  btnNext: {
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    border: 'none',
    boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: 500,
  },
  btnLabelNext: {
    fontSize: 15,
    fontWeight: 500,
    color: '#f1f5f9',
  },
  btnDisabled: {
    opacity: 0.38,
    cursor: 'not-allowed',
  },
  goToBtn: {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    cursor: 'pointer',
  },
  goToLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 500,
  },
  // Bottom sheet
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    background: 'rgba(8,8,15,0.96)',
    backdropFilter: 'blur(24px)',
    borderRadius: '20px 20px 0 0',
    padding: '16px 20px calc(32px + env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#f1f5f9',
    margin: 0,
  },
  sheetHint: {
    fontSize: 13,
    color: '#64748b',
    margin: 0,
  },
  sheetRow: {
    display: 'flex',
    gap: 8,
  },
  sheetInput: {
    flex: 1,
    height: 48,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: 600,
    textAlign: 'center',
    padding: '0 12px',
    fontVariantNumeric: 'tabular-nums',
  },
  sheetBtn: {
    height: 48,
    padding: '0 20px',
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    border: 'none',
    borderRadius: 12,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
