// src/components/room/MaskCard.jsx
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import InfoPopover from '../ui/InfoPopover.jsx'

const COORD_FIELDS = [
  { key: 'x',      label: 'X',       unit: 'см' },
  { key: 'y',      label: 'Y',       unit: 'см' },
  { key: 'width',  label: 'Ширина',  unit: 'см' },
  { key: 'height', label: 'Высота',  unit: 'см' },
]

export default function MaskCard({ wallId, mask }) {
  const { updateMask, removeMask } = useProjectStore()
  const [leaving, setLeaving] = useState(false)

  const maskColor = mask.color || '#888888'

  return (
    <div style={s.card} className={leaving ? 'anim-card-exit' : 'anim-card-enter'}>
      <div style={s.topRow}>
        <input
          style={s.nameInput}
          placeholder="Название (необязательно)"
          value={mask.name}
          onChange={(e) => updateMask(wallId, mask.id, 'name', e.target.value)}
        />
        <InfoPopover title="Координаты маски" ariaLabel="Что значат X и Y">
          <CoordsHint />
        </InfoPopover>
        <button
          style={s.delBtn}
          onClick={() => {
            setLeaving(true)
            setTimeout(() => removeMask(wallId, mask.id), 190)
          }}
          aria-label="Удалить маску"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div style={s.fields}>
        {COORD_FIELDS.map(({ key, label, unit }) => (
          <div key={key} style={s.fieldRow}>
            <label style={s.fieldLabel}>{label}</label>
            <span style={s.guide} aria-hidden="true" />
            <div style={s.inputWrap}>
              <input
                style={s.numInput}
                type="number"
                min="0"
                step="any"
                placeholder="—"
                value={mask[key]}
                onChange={(e) => updateMask(wallId, mask.id, key, e.target.value)}
              />
              <span style={s.unit}>{unit}</span>
            </div>
          </div>
        ))}
        <div style={s.fieldRow}>
          <label style={s.fieldLabel}>Цвет</label>
          <span style={s.guide} aria-hidden="true" />
          <label style={s.colorLabel}>
            <span style={{ ...s.colorSwatch, background: maskColor }} />
            <input
              type="color"
              value={maskColor}
              onChange={(e) => updateMask(wallId, mask.id, 'color', e.target.value)}
              style={s.colorInputHidden}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

function CoordsHint() {
  return (
    <div>
      <p style={hs.p}>
        Координаты X и Y задают <b>левый-нижний угол</b> маски на стене:
      </p>
      <ul style={hs.ul}>
        <li><b>X</b> — расстояние от <b>левого края</b> стены, в сантиметрах</li>
        <li><b>Y</b> — расстояние от <b>пола</b> до низа маски, в сантиметрах</li>
      </ul>
      <div style={hs.diagram} aria-hidden="true">
        <div style={hs.wall}>
          <div style={hs.mask}>
            <span style={hs.maskLabel}>Маска</span>
          </div>
          <div style={hs.axisX}>← X →</div>
          <div style={hs.axisY}>↑<br />Y<br />↓</div>
          <div style={hs.floorLabel}>пол</div>
        </div>
      </div>
      <p style={hs.tip}>
        Например, окно с подоконником на высоте 90 см от пола и в 30 см от левого края: X = 30, Y = 90.
      </p>
    </div>
  )
}

const s = {
  card:            { marginBottom: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  topRow:          { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)' },
  nameInput:       { flex: 1, height: 36, padding: '0 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  delBtn:          { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#f87171', cursor: 'pointer', flexShrink: 0 },
  fields:          { padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 },
  fieldRow:        { display: 'flex', alignItems: 'center', gap: 6 },
  fieldLabel:      { fontSize: 13, fontWeight: 500, color: 'var(--text-hint)', whiteSpace: 'nowrap', flexShrink: 0 },
  guide:           { flex: 1, height: 1, borderTop: '1px dotted rgba(255,255,255,0.10)', minWidth: 8 },
  inputWrap:       { display: 'flex', alignItems: 'center', gap: 4, width: 108, justifyContent: 'flex-end', flexShrink: 0 },
  numInput:        { width: 84, height: 40, padding: '0 8px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  unit:            { fontSize: 12, color: 'var(--text-disabled)', width: 22 },
  colorLabel:      { width: 108, height: 40, display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative', justifyContent: 'flex-end' },
  colorSwatch:     { width: 84, height: 40, borderRadius: 8, border: '1px solid var(--border-strong)' },
  colorInputHidden: { position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' },
}

const hs = {
  p:  { margin: '0 0 8px', color: 'var(--text-secondary)' },
  ul: { margin: '0 0 12px', paddingLeft: 18, color: 'var(--text-secondary)' },
  tip: { margin: '12px 0 0', padding: 10, background: 'var(--accent-soft)', borderRadius: 8, color: 'var(--accent-light)', fontSize: 13 },
  diagram: {
    margin: '8px 0',
    display: 'flex',
    justifyContent: 'center',
  },
  wall: {
    position: 'relative',
    width: 220,
    height: 130,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-strong)',
    borderRadius: 8,
  },
  mask: {
    position: 'absolute',
    left: 50,
    bottom: 30,
    width: 70,
    height: 50,
    background: 'rgba(124,58,237,0.22)',
    border: '1px solid var(--accent-soft-border)',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: 'var(--accent-light)',
  },
  maskLabel: { fontSize: 10 },
  axisX: { position: 'absolute', left: 0, bottom: -2, width: 50, fontSize: 9, color: 'var(--text-hint)', textAlign: 'center' },
  axisY: { position: 'absolute', right: 4, bottom: 4, fontSize: 9, color: 'var(--text-hint)', textAlign: 'center', lineHeight: 1.2 },
  floorLabel: { position: 'absolute', bottom: -16, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: 'var(--text-hint)' },
}
