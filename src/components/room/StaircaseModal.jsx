// src/components/room/StaircaseModal.jsx
// Калькулятор лестницы: параметры → предпросмотр + эргономика → генерация масок-ступеней.
import { useState, useMemo } from 'react'
import Modal from '../ui/Modal.jsx'
import { calcStaircase, buildStaircaseMasks } from '../../utils/staircase.js'

const STATUS = {
  excellent:  { label: 'Идеально',  color: '#22c55e' },
  acceptable: { label: 'Допустимо', color: '#f59e0b' },
  critical:   { label: 'Неудобно',  color: '#ef4444' },
}

export default function StaircaseModal({ open, onClose, onGenerate }) {
  const [totalHeight, setTotalHeight] = useState('150')
  const [totalLength, setTotalLength] = useState('170')
  const [risers, setRisers] = useState('8')
  const [startType, setStartType] = useState('immediate')
  const [direction, setDirection] = useState('right')
  const [startX, setStartX] = useState('0')

  const calc = useMemo(
    () => calcStaircase({ totalHeight, totalLength, risersCount: risers, startType }),
    [totalHeight, totalLength, risers, startType]
  )

  const masks = useMemo(
    () => (calc ? buildStaircaseMasks(calc, { startX: parseFloat(startX) || 0, direction }) : []),
    [calc, startX, direction]
  )

  const st = calc ? STATUS[calc.status] : null

  function handleGenerate() {
    if (!masks.length) return
    onGenerate(masks)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Лестница (маски-ступени)"
      maxWidth={460}
      footer={
        <button style={{ ...s.genBtn, opacity: masks.length ? 1 : 0.5 }} onClick={handleGenerate} disabled={!masks.length}>
          Создать {masks.length} ступеней
        </button>
      }
    >
      {/* Предпросмотр */}
      <div style={s.preview}>
        {calc ? <StairPreview calc={calc} direction={direction} /> : <span style={s.previewEmpty}>Заполните параметры</span>}
      </div>

      {/* Эргономика */}
      {calc && (
        <div style={s.metrics}>
          <Metric label="Подступёнок" value={`${calc.riserHeight.toFixed(1)} см`} />
          <Metric label="Проступь" value={`${calc.treadDepth.toFixed(1)} см`} />
          <Metric label="Угол" value={`${calc.angle.toFixed(1)}°`} />
          <Metric label="Оценка" value={st.label} color={st.color} />
        </div>
      )}

      {/* Параметры */}
      <div style={s.fields}>
        <Field label="Высота подъёма (см)" value={totalHeight} onChange={setTotalHeight} />
        <Field label="Длина в плане (см)" value={totalLength} onChange={setTotalLength} />
        <Field label="Кол-во подъёмов" value={risers} onChange={setRisers} />
        <Field label="Сдвиг от края (см)" value={startX} onChange={setStartX} signed />
      </div>

      <div style={s.toggleRow}>
        <span style={s.toggleLabel}>Старт</span>
        <div style={s.seg}>
          <SegBtn active={startType === 'immediate'} onClick={() => setStartType('immediate')}>Сразу подъём</SegBtn>
          <SegBtn active={startType === 'standard'} onClick={() => setStartType('standard')}>Проступь</SegBtn>
        </div>
      </div>
      <div style={s.toggleRow}>
        <span style={s.toggleLabel}>Направление</span>
        <div style={s.seg}>
          <SegBtn active={direction === 'right'} onClick={() => setDirection('right')}>Вправо →</SegBtn>
          <SegBtn active={direction === 'left'} onClick={() => setDirection('left')}>← Влево</SegBtn>
        </div>
      </div>
    </Modal>
  )
}

function StairPreview({ calc, direction }) {
  // Рисуем профиль лестницы в SVG, нормируя по габаритам.
  const { N, riserHeight, treadDepth, treadsCount, startType } = calc
  const W = calc.L, H = calc.H
  const pad = 8
  const vw = 220, vh = 130
  const sx = (vw - pad * 2) / Math.max(W, 1)
  const sy = (vh - pad * 2) / Math.max(H, 1)
  const sc = Math.min(sx, sy)
  const ox = pad
  const oy = vh - pad
  // Строим точки профиля (как в калькуляторе Gemini).
  const pts = [[0, 0]]
  let x = 0, y = 0
  for (let i = 0; i < N; i++) {
    if (startType === 'immediate') { y += riserHeight; pts.push([x, y]); if (i < treadsCount) { x += treadDepth; pts.push([x, y]) } }
    else { if (i < treadsCount) { x += treadDepth; pts.push([x, y]) } y += riserHeight; pts.push([x, y]) }
  }
  const toXY = ([px, py]) => {
    const fx = direction === 'right' ? ox + px * sc : (vw - ox) - px * sc
    return `${fx.toFixed(1)},${(oy - py * sc).toFixed(1)}`
  }
  const poly = pts.map(toXY).join(' ')
  return (
    <svg width="100%" height={vh} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet">
      <line x1={pad} y1={oy} x2={vw - pad} y2={oy} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <polyline points={poly} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function Metric({ label, value, color }) {
  return (
    <div style={s.metric}>
      <span style={s.metricLabel}>{label}</span>
      <span style={{ ...s.metricValue, ...(color ? { color } : {}) }}>{value}</span>
    </div>
  )
}

function Field({ label, value, onChange, signed }) {
  return (
    <div style={s.field}>
      <label style={s.fieldLabel}>{label}</label>
      <input
        style={s.input}
        type="text"
        inputMode={signed ? 'text' : 'decimal'}
        value={value}
        onChange={(e) => {
          let v = e.target.value
          v = signed ? v.replace(/[^0-9.\-]/g, '').replace(/(?!^)-/g, '') : v.replace(/[^0-9.]/g, '')
          onChange(v)
        }}
      />
    </div>
  )
}

function SegBtn({ active, onClick, children }) {
  return (
    <button style={{ ...s.segBtn, ...(active ? s.segBtnActive : {}) }} onClick={onClick}>{children}</button>
  )
}

const s = {
  preview: {
    background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 8, marginBottom: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130,
  },
  previewEmpty: { color: 'var(--text-hint)', fontSize: 13 },
  metrics: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, marginBottom: 14 },
  metric: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 },
  metricLabel: { fontSize: 9, color: 'var(--text-hint)', textAlign: 'center' },
  metricValue: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap' },
  fields: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 11, color: 'var(--text-secondary)' },
  input: {
    height: 42, padding: '0 12px', background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-strong)', borderRadius: 10,
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
  toggleLabel: { fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 },
  seg: { display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 3 },
  segBtn: {
    flex: 1, height: 34, padding: '0 10px', background: 'transparent', border: 'none',
    borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  segBtnActive: { background: 'var(--accent)', color: '#fff' },
  genBtn: {
    width: '100%', height: 48, marginTop: 6,
    background: 'var(--accent-grad)', border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    boxShadow: 'var(--accent-shadow)',
  },
}
