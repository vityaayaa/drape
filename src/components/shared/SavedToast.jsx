// src/components/shared/SavedToast.jsx
import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'

export default function SavedToast() {
  const activeTab = useProjectStore((s) => s.activeTab)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const hideTimer = useRef(null)
  const debounceTimer = useRef(null)

  const showOnTabs = ['room', 'pixelizer', 'viewer']

  useEffect(() => {
    const unsub = useProjectStore.subscribe((state, prev) => {
      if (state.activeTab !== prev.activeTab) return
      if (!showOnTabs.includes(state.activeTab)) return

      clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        setFading(false)
        setVisible(true)
        clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => {
          setFading(true)
          setTimeout(() => setVisible(false), 210)
        }, 2000)
      }, 1500)
    })
    return () => {
      unsub()
      clearTimeout(debounceTimer.current)
      clearTimeout(hideTimer.current)
    }
  }, [])

  if (!visible || !showOnTabs.includes(activeTab)) return null

  return (
    <div
      className={fading ? undefined : 'anim-saved-in'}
      style={{
        ...s.pill,
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 200ms ease-in' : undefined,
      }}
    >
      ✓ Сохранено
    </div>
  )
}

const s = {
  pill: {
    position: 'fixed',
    bottom: 'calc(57px + env(safe-area-inset-bottom, 0px) + 8px)',
    right: 16,
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#22c55e',
    fontSize: 11,
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: 20,
    zIndex: 500,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
}
