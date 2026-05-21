// src/components/room/FlowStepper.jsx
// Видимая полоска-«ход работы» + кнопка «?» с гайдом.
import { useProjectStore } from '../../store/projectStore.js'
import InfoPopover from '../ui/InfoPopover.jsx'

const STEPS = [
  { id: 'room',      label: 'Комната',  short: '1' },
  { id: 'pixelizer', label: 'Фото',     short: '2' },
  { id: 'viewer',    label: '3D',       short: '3' },
  { id: 'export',    label: 'Схема',    short: '4' },
  { id: 'layout',    label: 'Укладка',  short: '5' },
]

export default function FlowStepper({ current }) {
  const setActiveTab = useProjectStore((s) => s.setActiveTab)
  const currentIdx = STEPS.findIndex((s) => s.id === current)

  return (
    <div style={s.wrap}>
      <div style={s.stepperRow}>
        <div style={s.steps} role="list">
          {STEPS.map((step, i) => {
            const isActive = i === currentIdx
            const isPassed = i < currentIdx
            return (
              <button
                key={step.id}
                role="listitem"
                onClick={() => setActiveTab(step.id)}
                style={{
                  ...s.step,
                  ...(isActive ? s.stepActive : isPassed ? s.stepPassed : s.stepFuture),
                }}
              >
                <span style={{
                  ...s.bullet,
                  ...(isActive ? s.bulletActive : isPassed ? s.bulletPassed : s.bulletFuture),
                }}>
                  {step.short}
                </span>
                <span style={s.label}>{step.label}</span>
                {i < STEPS.length - 1 && <span style={s.arrow}>›</span>}
              </button>
            )
          })}
        </div>
        <div style={s.helpWrap}>
          <InfoPopover title="Как работать?" ariaLabel="Как работать">
            <HelpContent />
          </InfoPopover>
        </div>
      </div>
    </div>
  )
}

function HelpContent() {
  const items = [
    { n: '1', t: 'Комната', d: 'Задайте размеры стен и параметры плитки (ширина, высота, шов). Добавьте маски-препятствия (двери, окна).' },
    { n: '2', t: 'Фото', d: 'Приложите фото стен. Подгоните рамку под форму стен. Запустите пикселизацию — плитки получат цвет фотографии.' },
    { n: '3', t: '3D', d: 'Посмотрите комнату в объёме. Двойной тап — перенести точку вращения. Кнопки видов: спереди, сверху, изометрия.' },
    { n: '4', t: 'Схема', d: 'Откройте спецификацию: список плиток по цветам, квантизация, экспорт SVG, сохранение/загрузка проекта.' },
    { n: '5', t: 'Укладка', d: 'Пошаговая укладка плиток. Двигайтесь по последовательности или прыгайте к нужной плитке.' },
  ]
  return (
    <div>
      {items.map((it) => (
        <div key={it.n} style={hs.item}>
          <span style={hs.num}>{it.n}</span>
          <div>
            <div style={hs.title}>{it.t}</div>
            <div style={hs.desc}>{it.d}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const s = {
  wrap: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'rgba(8,8,15,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
  },
  stepperRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px 10px 14px',
    gap: 8,
  },
  steps: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  step: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 4px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    flexShrink: 0,
  },
  stepActive:  { color: 'var(--accent-light)' },
  stepPassed:  { color: 'var(--text-secondary)' },
  stepFuture:  { color: 'var(--text-disabled)' },
  bullet: {
    width: 22, height: 22, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700,
    flexShrink: 0,
  },
  bulletActive: {
    background: 'var(--accent-grad)',
    color: '#fff',
    boxShadow: '0 0 12px rgba(124,58,237,0.5)',
  },
  bulletPassed: {
    background: 'var(--accent-soft)',
    color: 'var(--accent-light)',
    border: '1px solid var(--accent-soft-border)',
  },
  bulletFuture: {
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-disabled)',
    border: '1px solid var(--border)',
  },
  label: { fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },
  arrow: { fontSize: 14, marginLeft: 2, color: 'var(--text-disabled)' },
  helpWrap: { flexShrink: 0 },
}

const hs = {
  item: {
    display: 'flex',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
  },
  num: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--accent-grad)',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  title: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 },
  desc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 },
}
