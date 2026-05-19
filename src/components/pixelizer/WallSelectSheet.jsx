// src/components/pixelizer/WallSelectSheet.jsx
import { useRef, useState } from 'react'

export default function WallSelectSheet({ walls, selectedWallIds, onToggle, onSelectAll, onFileSelected, onCancel }) {
  const inputRef = useRef(null)
  const hasSelection = selectedWallIds.length > 0
  const [leaving, setLeaving] = useState(false)

  function handleClose() {
    setLeaving(true)
    setTimeout(onCancel, 200)
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await onFileSelected(file)
  }

  return (
    <div style={s.sheet} className={leaving ? 'anim-sheet-exit' : 'anim-sheet-enter'}>
      {/* Handle */}
      <div style={s.handle} />

      {/* Title row */}
      <div style={s.titleRow}>
        <span style={s.title}>Выбери стены для фото</span>
        <button style={s.closeBtn} onClick={handleClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Scrollable area: chips + hint */}
      <div style={s.scrollArea}>
        <div style={s.chips}>
          {walls.map(wall => {
            const selected = selectedWallIds.includes(wall.id)
            return (
              <button
                key={wall.id}
                style={{ ...s.chip, ...(selected ? s.chipActive : {}) }}
                onClick={() => onToggle(wall.id)}
              >
                {selected && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {wall.name}
              </button>
            )
          })}
        </div>

        <p style={s.hint}>
          {hasSelection
            ? `Выбрано стен: ${selectedWallIds.length}`
            : 'Нажмите на стены в развёртке или выберите здесь'}
        </p>
      </div>

      {/* Actions — всегда видны */}
      <div style={s.actions}>
        <button style={s.btnAll} onClick={onSelectAll}>Все стены</button>
        <button
          style={{ ...s.btnFile, ...(!hasSelection ? s.btnFileDim : {}) }}
          onClick={() => hasSelection && inputRef.current?.click()}
        >
          Выбрать файл ▸
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}

const s = {
  sheet: {
    position: 'fixed',
    bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    left: 0, right: 0,
    maxHeight: '75vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(10,10,20,0.96)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderTop: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '20px 20px 0 0',
    padding: '8px 16px 0',
    zIndex: 200,
  },
  handle: {
    width: 36, height: 4,
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    margin: '0 auto 16px',
    flexShrink: 0,
  },
  titleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
    flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: 600, color: '#f1f5f9' },
  closeBtn: {
    width: 32, height: 32,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    minHeight: 0,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    display: 'flex', alignItems: 'center',
    padding: '7px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 20,
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: 'rgba(129,140,248,0.18)',
    border: '1px solid rgba(129,140,248,0.45)',
    color: '#818cf8',
  },
  hint: { fontSize: 12, color: '#475569', marginBottom: 14, minHeight: 16 },
  actions: {
    display: 'flex', gap: 8,
    flexShrink: 0,
    padding: '12px 0',
    paddingBottom: '12px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  btnAll: {
    padding: '0 16px', height: 42,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
  },
  btnFile: {
    flex: 1, height: 42,
    background: 'rgba(129,140,248,0.18)',
    border: '1px solid rgba(129,140,248,0.40)',
    borderRadius: 10,
    color: '#818cf8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnFileDim: {
    opacity: 0.35,
    cursor: 'default',
  },
}
