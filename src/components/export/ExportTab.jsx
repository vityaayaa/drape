// src/components/export/ExportTab.jsx
import { useState, useMemo, useRef } from 'react'
import { Download, Upload, Save, Sparkles } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore.js'
import { buildPalette, withSurplus } from '../../utils/buildPalette.js'
import { quantizeColors, applyQuantization } from '../../utils/quantizeColors.js'
import { exportProject, importProject } from '../../utils/projectIO.js'
import ExportDialog from './ExportDialog.jsx'
import SpecList from './SpecList.jsx'

const QUANT_OPTIONS = [
  { id: 'off',  label: 'Без квантизации', count: null },
  { id: '256',  label: '256', count: 256 },
  { id: '128',  label: '128', count: 128 },
  { id: '64',   label: '64',  count: 64  },
  { id: '32',   label: '32',  count: 32  },
  { id: '16',   label: '16',  count: 16  },
]

export default function ExportTab() {
  const walls = useProjectStore((s) => s.walls)
  const tile  = useProjectStore((s) => s.tile)
  const tileColors = useProjectStore((s) => s.pixelizer.tileColors)

  const [quantId, setQuantId] = useState('off')
  const [surplus, setSurplus] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState(null)
  const importInputRef = useRef(null)

  const rawPalette = useMemo(() => buildPalette(walls, tileColors), [walls, tileColors])

  // Применить квантизацию (если выбрана)
  const quantOption = QUANT_OPTIONS.find((q) => q.id === quantId) ?? QUANT_OPTIONS[0]
  const palette = useMemo(() => {
    if (!quantOption.count || rawPalette.length <= quantOption.count) return rawPalette
    const colorWeights = new Map()
    rawPalette.forEach((entry) => colorWeights.set(entry.hex, entry.count))
    const mapping = quantizeColors(colorWeights, quantOption.count)
    return applyQuantization(rawPalette, mapping)
  }, [rawPalette, quantOption])

  const hasData   = palette.length > 0
  const wallCount = walls.length
  const maskCount = walls.reduce((acc, w) => acc + (w.masks?.length ?? 0), 0)
  const totalTiles = palette.reduce((sum, e) => sum + e.count, 0)
  const tw = parseFloat(tile.tile_width)  || 0
  const th = parseFloat(tile.tile_height) || 0
  const gw = parseFloat(tile.grout_width) || 0

  function showMsg(text) {
    setMsg(text)
    setTimeout(() => setMsg(null), 2500)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportProject()
      showMsg('Проект сохранён')
    } catch (e) {
      showMsg('Ошибка: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      await importProject(file)
      showMsg('Проект загружен')
    } catch (e) {
      showMsg('Ошибка: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={s.root}>
      {/* === Прокручиваемая спецификация === */}
      <div style={s.spec}>
        {/* Шапка с параметрами */}
        <section style={s.section}>
          <div style={s.sectionTitle}>ПАРАМЕТРЫ</div>
          <div style={s.paramsGrid}>
            <ParamRow label="Плитка" value={tw > 0 ? `${tw} × ${th} мм` : '—'} />
            <ParamRow label="Шов" value={gw > 0 ? `${gw} мм` : '0 мм'} />
            <ParamRow label="Стен" value={String(wallCount)} />
            <ParamRow label="Масок" value={String(maskCount)} />
            <ParamRow label="Всего плиток" value={totalTiles.toLocaleString()} />
            <ParamRow label="Цветов" value={String(palette.length)} accent />
          </div>
        </section>

        {/* Квантизация */}
        <section style={s.section}>
          <div style={s.sectionTitleRow}>
            <Sparkles size={14} color="#a78bfa" />
            <span style={s.sectionTitle}>КВАНТИЗАЦИЯ ЦВЕТОВ</span>
          </div>
          <p style={s.sectionHint}>
            Снижает число оттенков до выбранного значения, объединяя близкие цвета.
          </p>
          <div style={s.quantChips}>
            {QUANT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                style={{
                  ...s.chip,
                  ...(quantId === opt.id ? s.chipActive : {}),
                }}
                onClick={() => setQuantId(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Запас на бой */}
        <section style={s.section}>
          <div style={s.sectionTitle}>ЗАПАС НА БОЙ</div>
          <Stepper value={surplus} onChange={setSurplus} min={0} max={30} step={5} unit="%" />
        </section>

        {/* Список плиток */}
        <section style={s.section}>
          <div style={s.sectionTitle}>ПЛИТКИ ПО ЦВЕТАМ</div>
          {hasData ? (
            <SpecList palette={palette} surplus={surplus} />
          ) : (
            <div style={s.empty}>Запустите пикселизацию во вкладке «Фото», чтобы увидеть спецификацию.</div>
          )}
        </section>

        <div style={{ height: 12 }} />
      </div>

      {/* === Фиксированный нижний блок === */}
      <div style={s.footer}>
        {msg && <div style={s.msg}>{msg}</div>}

        <button
          style={{ ...s.svgBtn, opacity: hasData ? 1 : 0.45 }}
          onClick={() => hasData && setDialogOpen(true)}
          disabled={!hasData}
        >
          <Download size={18} />
          <span>Скачать SVG</span>
        </button>

        <div style={s.projectRow}>
          <button
            style={{ ...s.projBtn, opacity: exporting ? 0.6 : 1 }}
            onClick={handleExport}
            disabled={exporting || importing}
          >
            <Save size={16} />
            <span>{exporting ? 'Сохранение…' : 'Сохранить'}</span>
          </button>
          <button
            style={{ ...s.projBtn, opacity: importing ? 0.6 : 1 }}
            onClick={() => importInputRef.current?.click()}
            disabled={exporting || importing}
          >
            <Upload size={16} />
            <span>{importing ? 'Загрузка…' : 'Загрузить'}</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </div>

      {dialogOpen && (
        <ExportDialog
          walls={walls}
          tile={tile}
          palette={palette}
          surplusPercent={surplus}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  )
}

function ParamRow({ label, value, accent }) {
  return (
    <div style={s.paramRow}>
      <span style={s.paramLabel}>{label}</span>
      <span style={{ ...s.paramValue, ...(accent ? { color: 'var(--accent-light)', fontWeight: 700 } : {}) }}>{value}</span>
    </div>
  )
}

function Stepper({ value, onChange, min, max, step, unit }) {
  return (
    <div style={s.stepperRow}>
      <button
        style={s.stepBtn}
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="Уменьшить"
      >−</button>
      <span style={s.stepValue}>{value}{unit}</span>
      <button
        style={s.stepBtn}
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label="Увеличить"
      >+</button>
    </div>
  )
}

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    overflow: 'hidden',
  },
  spec: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '8px 0 0',
  },
  section: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-disabled)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 10,
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: 'var(--text-hint)',
    margin: '0 0 10px',
    lineHeight: 1.5,
  },
  paramsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px 16px',
  },
  paramRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '4px 0',
  },
  paramLabel: { fontSize: 11, color: 'var(--text-hint)' },
  paramValue: { fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 },
  quantChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    padding: '0 14px',
    height: 36,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 999,
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    color: 'var(--accent-light)',
    boxShadow: '0 0 12px rgba(124,58,237,0.25)',
  },
  stepperRow: { display: 'inline-flex', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 36, height: 36,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border-strong)',
    borderRadius: 10,
    color: 'var(--text-secondary)',
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer',
  },
  stepValue: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--accent-light)',
    minWidth: 60,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
  empty: {
    padding: '24px 12px',
    fontSize: 13,
    color: 'var(--text-hint)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  footer: {
    flexShrink: 0,
    padding: '10px 16px',
    paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
    borderTop: '1px solid var(--border)',
    background: 'rgba(8,8,15,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    position: 'relative',
  },
  msg: {
    fontSize: 12,
    color: 'var(--accent-light)',
    textAlign: 'center',
    padding: '4px 0',
  },
  svgBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    background: 'var(--accent-grad)',
    border: 'none',
    borderRadius: 12,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--accent-shadow)',
    letterSpacing: '-0.01em',
  },
  projectRow: {
    display: 'flex',
    gap: 8,
  },
  projBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-soft-border)',
    borderRadius: 12,
    color: 'var(--accent-light)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
