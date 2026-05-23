// src/components/room/StaircaseModal.jsx
// Модальный калькулятор+редактор лестницы: слайдеры → SVG-превью → генерация масок.
import { useState, useMemo, useEffect } from 'react'
import Modal from '../ui/Modal.jsx'
import InfoPopover from '../ui/InfoPopover.jsx'
import { calcStaircase, buildStaircaseMasks } from '../../utils/staircase.js'

// ─── Статусы эргономики ────────────────────────────────────────────────────
const STATUS = {
  excellent:  { label: 'Идеально',  color: '#22c55e' },
  acceptable: { label: 'Допустимо', color: '#f59e0b' },
  critical:   { label: 'Неудобно',  color: '#ef4444' },
}

// ─── Иконка ступеней (SVG inline) ─────────────────────────────────────────
function StairsIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="1,15 1,11 5,11 5,7 9,7 9,3 13,3 13,1" />
      <polyline points="1,15 15,15 15,1" />
    </svg>
  )
}

// ─── Заголовок с иконкой ───────────────────────────────────────────────────
function ModalTitle() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <StairsIcon size={17} color="var(--accent-light, #a78bfa)" />
      Лестница
    </span>
  )
}

// ─── Главный компонент ────────────────────────────────────────────────────
// editStair: объект конфига лестницы (для режима редактирования) | undefined
export default function StaircaseModal({ open, onClose, onGenerate, editStair }) {
  const [totalHeight, setTotalHeight] = useState('150')
  const [totalLength, setTotalLength] = useState('170')
  const [risers,      setRisers]      = useState('7')
  const [startType,   setStartType]   = useState('immediate')
  const [direction,   setDirection]   = useState('right')
  const [startX,      setStartX]      = useState('0')
  const [startY,      setStartY]      = useState('0')

  // При открытии в режиме edit — заполнить поля из editStair; при create — сброс дефолтов
  useEffect(() => {
    if (!open) return
    if (editStair) {
      setTotalHeight(editStair.totalHeight ?? '150')
      setTotalLength(editStair.totalLength ?? '170')
      setRisers(editStair.risers ?? '7')
      setStartType(editStair.startType ?? 'immediate')
      setDirection(editStair.direction ?? 'right')
      setStartX(editStair.startX ?? '0')
      setStartY(editStair.startY ?? '0')
    } else {
      setTotalHeight('150')
      setTotalLength('170')
      setRisers('7')
      setStartType('immediate')
      setDirection('right')
      setStartX('0')
      setStartY('0')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editStair?.id])

  const calc = useMemo(
    () => calcStaircase({ totalHeight, totalLength, risersCount: risers, startType }),
    [totalHeight, totalLength, risers, startType]
  )

  // masks используется только для подсчёта кол-ва ступеней в кнопке
  const masksCount = useMemo(
    () => calc ? buildStaircaseMasks(calc).length : 0,
    [calc]
  )

  const st = calc ? STATUS[calc.status] : null

  function handleGenerate() {
    if (!masksCount) return
    const config = { totalHeight, totalLength, risers, startType, direction, startX, startY }
    onGenerate(config)
    onClose()
  }

  const btnLabel = editStair
    ? `Обновить ${masksCount} ступеней`
    : `Создать ${masksCount} ступеней`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<ModalTitle />}
      maxWidth={440}
      footer={
        <button
          style={{ ...s.genBtn, opacity: masksCount ? 1 : 0.5 }}
          onClick={handleGenerate}
          disabled={!masksCount}
        >
          {btnLabel}
        </button>
      }
    >
      {/* Превью */}
      <div style={s.preview}>
        {calc
          ? <StairPreview calc={calc} direction={direction} />
          : <span style={s.previewEmpty}>Заполните параметры</span>
        }
      </div>

      {/* Метрики */}
      {calc && (
        <div style={s.metrics}>
          <Metric label="Подступёнок" value={`${calc.riserHeight.toFixed(1)} см`} />
          <Metric label="Проступь"    value={`${calc.treadDepth.toFixed(1)} см`} />
          <Metric label="Угол"        value={`${calc.angle.toFixed(1)}°`} />
          <div style={s.metric}>
            <span style={s.metricLabel}>Оценка</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ ...s.metricValue, color: st.color }}>{st.label}</span>
              <InfoPopover title="Критерии оценки лестницы" ariaLabel="Как рассчитывается оценка">
                <ErgoHelp />
              </InfoPopover>
            </div>
          </div>
        </div>
      )}

      {/* Слайдеры */}
      <div style={s.sliders}>
        <SliderField label="Высота (см)"  value={totalHeight} onChange={setTotalHeight} min={30}  max={400} step={5} />
        <SliderField label="Длина (см)"   value={totalLength} onChange={setTotalLength} min={50}  max={600} step={5} />
        <SliderField label="Подъёмов"     value={risers}      onChange={setRisers}      min={2}   max={20}  step={1} />
      </div>

      {/* Сдвиг X / Y */}
      <div style={s.offsetBlock}>
        <span style={s.offsetBlockLabel}>Сдвиг</span>
        <div style={s.offsetFields}>
          <OffsetField label="по X" value={startX} onChange={setStartX} signed />
          <OffsetField label="по Y" value={startY} onChange={setStartY} />
        </div>
      </div>

      {/* Старт + Направление */}
      <div style={s.togglesRow}>
        <div style={s.toggleBlock}>
          <span style={s.toggleBlockLabel}>Старт</span>
          <button
            style={s.toggleBtn}
            onClick={() => setStartType(t => t === 'immediate' ? 'standard' : 'immediate')}
          >
            {startType === 'immediate' ? 'Сразу ↑' : 'Проступь'}
          </button>
        </div>
        <div style={s.toggleBlock}>
          <span style={s.toggleBlockLabel}>Направление</span>
          <button
            style={s.toggleBtn}
            onClick={() => setDirection(d => d === 'right' ? 'left' : 'right')}
          >
            {direction === 'right' ? '→ Направо' : '← Налево'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── SVG превью с метками ──────────────────────────────────────────────────
function StairPreview({ calc, direction }) {
  const { N, riserHeight, treadDepth, treadsCount, startType } = calc
  const W = calc.L, H = calc.H
  const padL = 22, padR = 68, padT = 14, padB = 28
  const vw = 300, vh = 120
  const sx = (vw - padL - padR) / Math.max(W, 1)
  const sy = (vh - padT - padB) / Math.max(H, 1)
  const sc = Math.min(sx, sy)
  const ox = padL
  const oy = vh - padB

  // Строим точки профиля
  const pts = [[0, 0]]
  let x = 0, y = 0
  for (let i = 0; i < N; i++) {
    if (startType === 'immediate') {
      y += riserHeight; pts.push([x, y])
      if (i < treadsCount) { x += treadDepth; pts.push([x, y]) }
    } else {
      if (i < treadsCount) { x += treadDepth; pts.push([x, y]) }
      y += riserHeight; pts.push([x, y])
    }
  }

  const toXY = ([px, py]) => {
    const fx = direction === 'right'
      ? ox + px * sc
      : (vw - padR) - px * sc
    return `${fx.toFixed(1)},${(oy - py * sc).toFixed(1)}`
  }
  const poly = pts.map(toXY).join(' ')

  const stairW = W * sc
  const stairH = H * sc
  const x0 = direction === 'right' ? ox : vw - padR - stairW
  const x1 = x0 + stairW
  const yTop = oy - stairH

  // Дуга угла у нижней точки входа
  const arcR = 20
  const angleRad = calc.angle * (Math.PI / 180)
  const cx = direction === 'right' ? ox : vw - padR
  const arcDx = (direction === 'right' ? 1 : -1) * arcR * Math.cos(angleRad)
  const arcDy = -arcR * Math.sin(angleRad)
  const arcSweep = direction === 'right' ? 0 : 1

  const dim = 'rgba(255,255,255,0.3)'
  const lbl = 'rgba(255,255,255,0.5)'
  const acc = '#a78bfa'

  return (
    <svg width="100%" height={vh} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet">
      {/* Нижняя линия этажа */}
      <line x1={x0 - 4} y1={oy} x2={x1 + 4} y2={oy} stroke={dim} strokeWidth="1" />
      <text x={x0} y={oy + 12} fontSize="7.5" fill={lbl}>НИЖНИЙ ЭТАЖ</text>

      {/* Верхняя линия этажа */}
      <line x1={x0 - 4} y1={yTop} x2={x1 + 4} y2={yTop} stroke={dim} strokeWidth="1" strokeDasharray="3 3" />
      <text x={x1 + 5} y={yTop + 4} fontSize="7.5" fill={lbl}>ВЕРХНИЙ ЭТАЖ</text>

      {/* Вертикальный размер */}
      <line x1={x0 - 8} y1={oy} x2={x0 - 8} y2={yTop} stroke={dim} strokeWidth="1" />
      <line x1={x0 - 11} y1={oy}   x2={x0 - 5} y2={oy}   stroke={dim} strokeWidth="1" />
      <line x1={x0 - 11} y1={yTop} x2={x0 - 5} y2={yTop} stroke={dim} strokeWidth="1" />
      <text
        x={x0 - 10} y={(oy + yTop) / 2 + 3}
        fontSize="7.5" fill={lbl} textAnchor="middle"
        transform={`rotate(-90,${x0 - 10},${(oy + yTop) / 2})`}
      >
        {H.toFixed(0)} см
      </text>

      {/* Горизонтальный размер */}
      <line x1={x0} y1={oy + 8} x2={x1} y2={oy + 8} stroke={dim} strokeWidth="1" />
      <line x1={x0} y1={oy + 5} x2={x0} y2={oy + 11} stroke={dim} strokeWidth="1" />
      <line x1={x1} y1={oy + 5} x2={x1} y2={oy + 11} stroke={dim} strokeWidth="1" />
      <text x={(x0 + x1) / 2} y={oy + 20} fontSize="7.5" fill={lbl} textAnchor="middle">
        {W.toFixed(0)} см
      </text>

      {/* Дуга угла */}
      <path
        d={`M ${cx},${oy} a ${arcR} ${arcR} 0 0 ${arcSweep} ${arcDx.toFixed(2)},${arcDy.toFixed(2)}`}
        fill="none" stroke={acc} strokeWidth="1.5" opacity="0.75"
      />
      <text
        x={cx + (direction === 'right' ? arcR + 4 : -(arcR + 4))}
        y={oy - arcR / 2 + 2}
        fontSize="8" fill={acc}
        textAnchor={direction === 'right' ? 'start' : 'end'}
      >
        {calc.angle.toFixed(1)}°
      </text>

      {/* Профиль лестницы */}
      <polyline points={poly} fill="none" stroke={acc} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Слайдер + число ──────────────────────────────────────────────────────
function SliderField({ label, value, onChange, min, max, step }) {
  const num = parseFloat(value) || min
  const clamped = Math.min(Math.max(num, min), max)
  return (
    <div style={s.sliderRow}>
      <span style={s.sliderLabel}>{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={clamped}
        onChange={(e) => onChange(e.target.value)}
        style={s.rangeInput}
      />
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={(e) => {
          // при потере фокуса — зажать в диапазон
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v)) onChange(String(Math.min(Math.max(v, min), max)))
        }}
        style={s.rangeNum}
      />
    </div>
  )
}

// ─── Поле сдвига ─────────────────────────────────────────────────────────
function OffsetField({ label, value, onChange, signed }) {
  return (
    <div style={s.offsetField}>
      <span style={s.offsetFieldLabel}>{label}</span>
      <input
        style={s.offsetInput}
        type="text"
        inputMode={signed ? 'text' : 'decimal'}
        value={value}
        onChange={(e) => {
          let v = e.target.value
          v = signed
            ? v.replace(/[^0-9.\-]/g, '').replace(/(?!^)-/g, '')
            : v.replace(/[^0-9.]/g, '')
          onChange(v)
        }}
      />
    </div>
  )
}

// ─── Метрика ─────────────────────────────────────────────────────────────
function Metric({ label, value, color }) {
  return (
    <div style={s.metric}>
      <span style={s.metricLabel}>{label}</span>
      <span style={{ ...s.metricValue, ...(color ? { color } : {}) }}>{value}</span>
    </div>
  )
}

// ─── Попап критериев оценки ──────────────────────────────────────────────
function ErgoHelp() {
  return (
    <div style={eh.wrap}>
      <div style={eh.block}>
        <span style={{ ...eh.dot, background: '#22c55e' }} />
        <div>
          <b style={eh.title}>Идеально</b>
          <p style={eh.text}>Угол 30–35°. Индекс Блонделя 60–64 см. Высота ступени ≤ 17 см.</p>
        </div>
      </div>
      <div style={eh.block}>
        <span style={{ ...eh.dot, background: '#f59e0b' }} />
        <div>
          <b style={eh.title}>Допустимо (но круто)</b>
          <p style={eh.text}>Угол 35–42° ИЛИ индекс Блонделя 58–60 или 64–66 см.</p>
        </div>
      </div>
      <div style={eh.block}>
        <span style={{ ...eh.dot, background: '#ef4444' }} />
        <div>
          <b style={eh.title}>Неудобно / Опасно</b>
          <p style={eh.text}>Угол &gt; 42° (спуск спиной) или &lt; 25°. Индекс Блонделя &lt; 57 или &gt; 67 см.</p>
        </div>
      </div>
      <div style={eh.divider} />
      <p style={eh.rec}><b>Правило Блонделя:</b> 2 × высота + проступь = 60–64 см</p>
      <p style={eh.rec}><b>Оптимальная высота ступени:</b> 15–18 см</p>
      <p style={eh.rec}><b>Оптимальная проступь:</b> 28–32 см</p>
      <p style={eh.rec}><b>Комфортный угол:</b> 30–35°</p>
    </div>
  )
}

// ─── Стили ────────────────────────────────────────────────────────────────
const s = {
  preview: {
    background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '4px 0 2px',
    marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  previewEmpty: { color: 'var(--text-hint)', fontSize: 13, padding: 20 },

  metrics: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto',
    gap: 4, marginBottom: 10, alignItems: 'start',
  },
  metric:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 0 },
  metricLabel: { fontSize: 9, color: 'var(--text-hint)', textAlign: 'center' },
  metricValue: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap' },

  sliders: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 8 },
  sliderLabel: { fontSize: 11, color: 'var(--text-secondary)', width: 80, flexShrink: 0 },
  rangeInput: { flex: 1, accentColor: 'var(--accent)', cursor: 'pointer', height: 20 },
  rangeNum: {
    width: 44, height: 32, padding: '0 4px',
    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-strong)',
    borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none',
    textAlign: 'center', flexShrink: 0,
  },

  offsetBlock:      { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 },
  offsetBlockLabel: { fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 },
  offsetFields:     { display: 'flex', gap: 8 },
  offsetField:      { display: 'flex', alignItems: 'center', gap: 4 },
  offsetFieldLabel: { fontSize: 11, color: 'var(--text-hint)', flexShrink: 0 },
  offsetInput: {
    width: 58, height: 28, padding: '0 6px',
    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-strong)',
    borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none',
    boxSizing: 'border-box',
  },

  togglesRow:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 },
  toggleBlock:      { display: 'flex', flexDirection: 'column', gap: 5 },
  toggleBlockLabel: { fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 },
  toggleBtn: {
    height: 36, padding: '0 10px',
    background: 'rgba(139,92,246,0.13)', border: '1px solid rgba(139,92,246,0.32)',
    borderRadius: 9, color: '#a78bfa', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },

  genBtn: {
    width: '100%', height: 46, marginTop: 4,
    background: 'var(--accent-grad)', border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: 'var(--accent-shadow)',
  },
}

const eh = {
  wrap:    { display: 'flex', flexDirection: 'column', gap: 10 },
  block:   { display: 'flex', gap: 10, alignItems: 'flex-start' },
  dot:     { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 3 },
  title:   { fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 2 },
  text:    { margin: 0, fontSize: 12, color: 'var(--text-secondary)' },
  divider: { borderTop: '1px solid var(--border)', margin: '4px 0' },
  rec:     { margin: 0, fontSize: 12, color: 'var(--text-secondary)' },
}
