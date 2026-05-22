// src/components/room/FlowStepper.jsx
// Верхний заголовок «Как работать?» + кнопка «?», открывающая подробный
// листаемый гайд по центру экрана.
import { useState } from 'react'
import { HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from '../ui/Modal.jsx'

const GUIDE = [
  {
    n: '1', t: 'Комната',
    blocks: [
      'Задайте параметры плитки: ширину, высоту, толщину и ширину шва (всё в мм), а также цвет шва.',
      'Добавьте стены кнопкой «+ Добавить стену». Для каждой укажите длину и высоту в сантиметрах.',
      'При необходимости добавьте маски-препятствия (двери, окна, ниши) — плитки под ними не считаются.',
      'Для отдельной стены можно переопределить параметры плитки, если она отличается от общей.',
    ],
  },
  {
    n: '2', t: 'Фото',
    blocks: [
      'Нажмите «Добавить фото» и выберите стены, на которые ляжет одно фото (можно несколько подряд).',
      'В режиме редактирования двигайте фото одним пальцем, масштабируйте щипком. Настройте яркость, контраст, насыщенность и прозрачность.',
      'Кнопка-атом рядом с «Пикселизировать» включает квантизацию — снижение числа цветов, чтобы заранее видеть результат.',
      'Нажмите «Пикселизировать» — каждая плитка получит усреднённый цвет с фотографии.',
    ],
  },
  {
    n: '3', t: '3D',
    blocks: [
      'Осмотрите комнату в объёме. Вращайте одним пальцем, масштабируйте щипком.',
      'Двойной тап по стене — перенести точку вращения туда. Двойной тап по полу — вернуть точку в центр.',
      'Кнопки видов: Спереди, Сверху, Изометрия. Кнопка сброса возвращает камеру в исходное положение.',
    ],
  },
  {
    n: '4', t: 'Схема',
    blocks: [
      'Здесь — спецификация проекта: список плиток по цветам с количеством.',
      'Задайте запас на бой (%) — он добавится к итоговым количествам.',
      'Скачайте SVG-схему для печати или сохраните/загрузите проект целиком (с фотографиями).',
    ],
  },
  {
    n: '5', t: 'Укладка',
    blocks: [
      'Пошаговый помощник укладки. Двигайтесь кнопками «Предыдущая»/«Следующая» или свайпом.',
      'Режим «по рядам» — укладка снизу вверх; «по цветам» — группировка одинаковых плиток.',
      'Отмечайте уложенные плитки. Кнопка «К плитке…» — быстрый переход по номеру.',
    ],
  },
]

export default function FlowStepper() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)

  const openGuide = () => { setPage(0); setOpen(true) }
  const cur = GUIDE[page]
  const isFirst = page === 0
  const isLast = page === GUIDE.length - 1

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <h2 style={s.heading}>Как работать?</h2>
        <button style={s.helpBtn} onClick={openGuide} aria-label="Как работать">
          <HelpCircle size={20} />
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Как работать?">
        <div style={gs.stepHeader}>
          <span style={gs.num}>{cur.n}</span>
          <span style={gs.stepTitle}>{cur.t}</span>
        </div>
        {/* Фикс. высота — чтобы «Назад/Далее» всегда были на одном месте */}
        <div style={gs.blocks}>
          {cur.blocks.map((b, i) => (
            <div key={i} style={gs.block}>
              <span style={gs.dot} />
              <span>{b}</span>
            </div>
          ))}
        </div>

        <div style={gs.nav}>
          <button
            style={{ ...gs.navBtn, ...(isFirst ? gs.navBtnDisabled : {}) }}
            onClick={() => !isFirst && setPage((p) => p - 1)}
            disabled={isFirst}
          >
            <ChevronLeft size={18} /> Назад
          </button>
          <div style={gs.dots}>
            {GUIDE.map((_, i) => (
              <span key={i} style={{ ...gs.pageDot, ...(i === page ? gs.pageDotActive : {}) }} />
            ))}
          </div>
          {isLast ? (
            <button style={gs.navBtn} onClick={() => setOpen(false)}>Готово</button>
          ) : (
            <button style={gs.navBtn} onClick={() => setPage((p) => p + 1)}>
              Далее <ChevronRight size={18} />
            </button>
          )}
        </div>
      </Modal>
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
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '12px 16px',
  },
  heading: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  helpBtn: {
    width: 38, height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    borderRadius: 10,
    color: 'var(--accent-light)',
    cursor: 'pointer',
    flexShrink: 0,
  },
}

const gs = {
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  num: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--accent-grad)',
    color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700,
    flexShrink: 0,
  },
  stepTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' },
  blocks: { display: 'flex', flexDirection: 'column', gap: 12, minHeight: 280 },
  block: {
    display: 'flex',
    gap: 10,
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.55,
  },
  dot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--accent-light)',
    marginTop: 7,
    flexShrink: 0,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 20,
  },
  navBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 40,
    padding: '0 14px',
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    borderRadius: 10,
    color: 'var(--accent-light)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  navBtnDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  dots: { display: 'flex', gap: 6 },
  pageDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--border-strong)',
  },
  pageDotActive: { background: 'var(--accent-light)' },
}
