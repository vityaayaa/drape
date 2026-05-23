// src/components/room/WallCard.jsx
import { useState, useEffect, useRef } from 'react'
import { Trash2, Fence, ChevronDown, Pencil } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { calcStaircase } from '../../utils/staircase.js'
import MaskCard from './MaskCard.jsx'
import TileForm from './TileForm.jsx'
import StaircaseModal from './StaircaseModal.jsx'

// Мини-иконка ступеней для кнопки аккордеона
function StairsIconSmall() {
  return (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="1,15 1,11 5,11 5,7 9,7 9,3 13,3 13,1" />
      <polyline points="1,15 15,15 15,1" />
    </svg>
  )
}

export default function WallCard({ wall, result }) {
  const {
    updateWall, removeWall, addMask, setTileOverride, clearTileOverride,
    addStaircase, removeStaircase, updateStaircase, replaceStaircase,
  } = useProjectStore()

  const [showOverride,     setShowOverride]     = useState(Object.keys(wall.tile_overrides).length > 0)
  const [deleteConfirm,    setDeleteConfirm]    = useState(false)
  const [leaving,          setLeaving]          = useState(false)
  const [touched,          setTouched]          = useState({})
  const [stairsOpen,       setStairsOpen]       = useState(false)
  const [editStair,        setEditStair]        = useState(null)
  const [stairsAccordion,  setStairsAccordion]  = useState(false)
  const [masksAccordion,   setMasksAccordion]   = useState(false)
  const [expandedStairId,  setExpandedStairId]  = useState(null)
  const masksListRef = useRef(null)

  useEffect(() => {
    if (!deleteConfirm) return
    const t = setTimeout(() => setDeleteConfirm(false), 3000)
    return () => clearTimeout(t)
  }, [deleteConfirm])

  const hasWarning = result?.warning && !result?.blocked
  const hasBlocked = result?.blocked

  const borderColor = hasBlocked
    ? 'rgba(239,68,68,0.4)'
    : hasWarning
    ? 'rgba(245,158,11,0.35)'
    : 'rgba(255,255,255,0.07)'

  return (
    <div
      style={{ ...s.card, borderColor }}
      className={leaving ? 'anim-card-exit' : 'anim-card-enter'}
    >
      {/* Заголовок */}
      <div style={s.header}>
        <input
          style={s.nameInput}
          value={wall.name}
          onChange={(e) => updateWall(wall.id, 'name', e.target.value)}
        />
        <label style={s.toggle}>
          <input type="checkbox" checked={wall.wall_active} onChange={() => updateWall(wall.id, 'wall_active', !wall.wall_active)} />
          <span style={s.toggleLabel}>Активна</span>
        </label>
        <label style={s.toggle}>
          <input type="checkbox" checked={wall.mosaic_active} disabled={!wall.wall_active} onChange={() => updateWall(wall.id, 'mosaic_active', !wall.mosaic_active)} />
          <span style={s.toggleLabel}>Мозаика</span>
        </label>
        {deleteConfirm ? (
          <div style={s.deleteConfirm}>
            <span style={s.deleteConfirmText}>Удалить?</span>
            <button style={s.confirmYes} onClick={() => {
              setLeaving(true)
              setTimeout(() => removeWall(wall.id), 190)
            }}>Да</button>
            <button style={s.confirmNo} onClick={() => setDeleteConfirm(false)}>Нет</button>
          </div>
        ) : (
          <button style={s.delBtn} onClick={() => setDeleteConfirm(true)} aria-label="Удалить стену">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Размеры */}
      <div style={s.sizeBlock}>
        {[
          { key: 'length', label: 'Длина' },
          { key: 'height', label: 'Высота' },
        ].map(({ key, label }) => (
          <div key={key} style={s.fieldWrap}>
            <div style={s.fieldRow}>
              <label style={s.fieldLabel}>{label}</label>
              <span style={s.guide} aria-hidden="true" />
              <div style={s.inputWrap}>
                <input
                  style={s.input}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="—"
                  value={wall[key]}
                  onChange={(e) => updateWall(wall.id, key, e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, [key]: true }))}
                />
                <span style={s.unit}>см</span>
              </div>
            </div>
            {touched[key] && !(Number(wall[key]) > 0) && (
              <span style={s.fieldError}>Больше 0</span>
            )}
          </div>
        ))}
      </div>

      {/* Лимиты */}
      {hasBlocked && (
        <div style={s.blocked}>Слишком много плиток ({result.total_before_masks.toLocaleString()}). Увеличь размер плитки или уменьши стену.</div>
      )}
      {hasWarning && (
        <div style={s.warning}>На стене {result.total_before_masks.toLocaleString()} плиток — на мобильных может тормозить.</div>
      )}

      {/* Переопределение плитки */}
      <div style={s.overrideWrap}>
        <button style={s.overrideBtn} onClick={() => setShowOverride(v => !v)}>
          <span style={s.overrideBtnIcon}>{showOverride ? '▴' : '▾'}</span>
          Параметры плитки стены
        </button>
      </div>
      {showOverride && (
        <div style={s.overrideBlock}>
          <TileForm
            isOverride
            overrides={wall.tile_overrides}
            onOverrideChange={(field, value) => setTileOverride(wall.id, field, value)}
            onOverrideClear={(field) => clearTileOverride(wall.id, field)}
          />
        </div>
      )}

      {/* Лестницы + Маски — два аккордеона */}
      <div style={s.masksSection}>

        {/* Заголовки-тогглы */}
        <div style={s.accordionHeader}>
          <button style={s.accordionToggle} onClick={() => setStairsAccordion(v => !v)}>
            <StairsIconSmall />
            <span>Лестницы</span>
            <ChevronDown size={12} style={{
              marginLeft: 'auto',
              transition: 'transform 0.2s',
              transform: stairsAccordion ? 'rotate(180deg)' : 'none',
            }} />
          </button>
          <button style={s.accordionToggle} onClick={() => setMasksAccordion(v => !v)}>
            <Fence size={13} />
            <span>Маски</span>
            <ChevronDown size={12} style={{
              marginLeft: 'auto',
              transition: 'transform 0.2s',
              transform: masksAccordion ? 'rotate(180deg)' : 'none',
            }} />
          </button>
        </div>

        {/* Секция лестниц */}
        {stairsAccordion && (
          <div style={s.accordionSection}>
            <button
              style={s.addMaskBtn}
              onClick={() => { setEditStair(null); setStairsOpen(true) }}
            >
              + Добавить
            </button>
            {(wall.stairs ?? []).map((stair) => {
              const stairCalc = calcStaircase({ ...stair, risersCount: stair.risers })
              const isExpanded = expandedStairId === stair.id
              const stairMasks = wall.masks.filter(m => m.staircaseId === stair.id)
              return (
                <div key={stair.id} style={s.stairItem}>
                  <div style={s.stairItemRow}>
                    <input
                      style={s.stairNameInput}
                      value={stair.name}
                      onChange={(e) => updateStaircase(wall.id, stair.id, 'name', e.target.value)}
                    />
                    <button
                      style={s.stairIconBtn}
                      onClick={() => setExpandedStairId(isExpanded ? null : stair.id)}
                      title={isExpanded ? 'Свернуть' : 'Показать маски'}
                    >
                      <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    <button
                      style={s.stairIconBtn}
                      onClick={() => { setEditStair(stair); setStairsOpen(true) }}
                      title="Настройки лестницы"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      style={{ ...s.stairIconBtn, ...s.stairDelBtn }}
                      onClick={() => removeStaircase(wall.id, stair.id)}
                      title="Удалить лестницу"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {isExpanded && (
                    <div style={s.stairMaskList}>
                      {stairCalc && (
                        <div style={s.stairMeta}>
                          {stairCalc.riserHeight.toFixed(1)} / {stairCalc.treadDepth.toFixed(1)} см · {stairCalc.angle.toFixed(1)}°
                        </div>
                      )}
                      {stairMasks.map(m => (
                        <div key={m.id} style={s.stairMaskItem}>
                          <span style={s.stairMaskName}>{m.name}</span>
                          <span style={s.stairMaskDim}>{(+m.width).toFixed(1)} × {(+m.height).toFixed(1)} см</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {(wall.stairs ?? []).length === 0 && (
              <p style={s.empty}>Нет лестниц</p>
            )}
          </div>
        )}

        {/* Секция обычных масок (без staircaseId) */}
        {masksAccordion && (
          <div style={s.accordionSection}>
            <button
              style={s.addMaskBtn}
              onClick={() => {
                addMask(wall.id)
                setTimeout(() => {
                  const last = masksListRef.current?.lastElementChild
                  last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                }, 50)
              }}
            >
              + Добавить
            </button>
            {wall.masks.filter(m => !m.staircaseId).length === 0 && (
              <p style={s.empty}>Нет масок</p>
            )}
            <div ref={masksListRef}>
              {wall.masks
                .filter(m => !m.staircaseId)
                .map(mask => <MaskCard key={mask.id} wallId={wall.id} mask={mask} />)}
            </div>
          </div>
        )}
      </div>

      <StaircaseModal
        open={stairsOpen}
        onClose={() => { setStairsOpen(false); setEditStair(null) }}
        editStair={editStair}
        onGenerate={(config) => {
          if (editStair) {
            replaceStaircase(wall.id, editStair.id, config)
          } else {
            addStaircase(wall.id, config)
          }
        }}
      />
    </div>
  )
}

const s = {
  card:              { background: '#0e1018', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, marginBottom: 12, marginLeft: 16, marginRight: 16, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)' },
  header:            { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(124,58,237,0.07)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' },
  nameInput:         { flex: 1, minWidth: 80, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(139,92,246,0.5)', color: '#f1f5f9', fontSize: 14, fontWeight: 600, padding: '2px 4px', outline: 'none' },
  toggle:            { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' },
  toggleLabel:       { fontSize: 12, color: '#64748b' },
  delBtn:            { marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#f87171', cursor: 'pointer', flexShrink: 0 },
  deleteConfirm:     { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 },
  deleteConfirmText: { fontSize: 12, color: '#94a3b8' },
  confirmYes:        { height: 32, padding: '0 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  confirmNo:         { height: 32, padding: '0 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#64748b', fontSize: 12, cursor: 'pointer' },
  sizeBlock:         { padding: '12px 14px 4px', display: 'flex', flexDirection: 'column', gap: 10 },
  fieldWrap:         { },
  fieldRow:          { display: 'flex', alignItems: 'center', gap: 6 },
  fieldLabel:        { fontSize: 13, fontWeight: 500, color: 'var(--text-hint)', whiteSpace: 'nowrap', flexShrink: 0 },
  guide:             { flex: 1, height: 1, borderTop: '1px dotted rgba(255,255,255,0.10)', minWidth: 8 },
  inputWrap:         { display: 'flex', alignItems: 'center', gap: 4, width: 108, justifyContent: 'flex-end', flexShrink: 0 },
  input:             { width: 84, height: 44, padding: '0 10px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' },
  unit:              { fontSize: 12, color: 'var(--text-disabled)', width: 22 },
  warning:           { margin: '8px 14px 0', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', borderRadius: 8, fontSize: 12 },
  blocked:           { margin: '8px 14px 0', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 8, fontSize: 12 },
  overrideWrap:      { padding: '10px 14px 0' },
  overrideBtn:       { display: 'flex', alignItems: 'center', gap: 6, width: '100%', height: 40, padding: '0 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' },
  overrideBtnIcon:   { fontSize: 10, color: '#64748b' },
  overrideBlock:     { margin: '8px 14px', background: '#141820', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, overflow: 'hidden' },
  masksSection:      { padding: '10px 14px 14px' },
  empty:             { fontSize: 12, color: '#334155', margin: '4px 0 0' },
  fieldError:        { display: 'block', fontSize: 11, color: '#ef4444', marginTop: 2 },

  // Аккордеоны
  accordionHeader:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 },
  accordionToggle:  {
    display: 'flex', alignItems: 'center', gap: 5, width: '100%',
    height: 32, padding: '0 10px',
    background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: 9, color: '#a78bfa', fontSize: 12, fontWeight: 600,
    cursor: 'pointer',
  },
  accordionSection: { display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 6 },
  addMaskBtn:       { height: 32, padding: '0 12px', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, fontSize: 12, cursor: 'pointer' },

  // Элементы лестницы
  stairItem:        { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  stairItemRow:     { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' },
  stairNameInput:   {
    flex: 1, height: 30, padding: '0 6px', background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-strong)', borderRadius: 6,
    color: 'var(--text-primary)', fontSize: 12, outline: 'none',
  },
  stairIconBtn:     {
    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7, color: '#94a3b8', cursor: 'pointer', flexShrink: 0,
  },
  stairDelBtn:      { color: '#f87171', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' },
  stairMaskList:    { borderTop: '1px solid var(--border)', padding: '4px 8px 6px', display: 'flex', flexDirection: 'column', gap: 2 },
  stairMeta:        { fontSize: 10, color: 'var(--text-hint)', marginBottom: 4 },
  stairMaskItem:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px', borderRadius: 5, background: 'rgba(255,255,255,0.03)' },
  stairMaskName:    { fontSize: 11, color: 'var(--text-secondary)' },
  stairMaskDim:     { fontSize: 10, color: 'var(--text-hint)', fontVariantNumeric: 'tabular-nums' },
}
