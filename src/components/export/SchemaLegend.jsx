// src/components/export/SchemaLegend.jsx
import { useRef, useState } from 'react'
import { Minus, Plus, ChevronDown, ChevronUp, Download, Upload } from 'lucide-react'
import { withSurplus } from '../../utils/buildPalette.js'
import ExportDialog from './ExportDialog.jsx'
import { exportProject, importProject } from '../../utils/projectIO.js'

export default function SchemaLegend({ height, palette, walls, tile }) {
  const [surplus, setSurplus]       = useState(10)
  const [expanded, setExpanded]     = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [projectMsg, setProjectMsg] = useState(null)
  const [exporting, setExporting]   = useState(false)
  const [importing, setImporting]   = useState(false)
  const importInputRef              = useRef(null)

  const showMsg = (msg) => {
    setProjectMsg(msg)
    setTimeout(() => setProjectMsg(null), 3000)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportProject()
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

  const hasData = palette.length > 0

  // Параметры плитки и шва для шапки
  const tw = parseFloat(tile.tile_width)   || 0
  const th = parseFloat(tile.tile_height)  || 0
  const gw = parseFloat(tile.grout_width)  || 0
  const gc = tile.grout_color || '#cccccc'

  const wallCount = walls.length
  const maskCount = walls.reduce((acc, w) => acc + (w.masks?.length ?? 0), 0)

  const toggleExpand = (idx) =>
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))

  const stepSurplus = (delta) =>
    setSurplus((v) => Math.max(0, Math.min(30, v + delta)))

  return (
    <div style={{ ...s.root, height }}>
      {/* Шапка — параметры */}
      <div style={s.header}>
        <div style={s.headerRow}>
          <span style={s.label}>Плитка</span>
          <span style={s.value}>{tw > 0 ? `${tw} × ${th} мм` : '—'}</span>
          <span style={s.label}>Шов</span>
          <span style={s.value}>{gw > 0 ? `${gw} мм` : '0 мм'}</span>
        </div>
        <div style={s.headerRow}>
          <span style={s.label}>Цвет шва</span>
          <span style={s.swatchWrap}>
            <span style={{ ...s.swatch, background: gc }} />
            <span style={s.value}>{gc}</span>
          </span>
          <span style={s.label}>{wallCount} ст., {maskCount} маск.</span>
        </div>
      </div>

      {/* Степпер запаса */}
      <div style={s.stepperRow}>
        <span style={s.stepperLabel}>Запас на бой</span>
        <div style={s.stepper}>
          <button style={s.stepBtn} onClick={() => stepSurplus(-5)} aria-label="Уменьшить запас">
            <Minus size={14} color="#94a3b8" />
          </button>
          <span style={s.stepValue}>{surplus}%</span>
          <button style={s.stepBtn} onClick={() => stepSurplus(5)} aria-label="Увеличить запас">
            <Plus size={14} color="#94a3b8" />
          </button>
        </div>
      </div>

      {/* Список цветов */}
      <div style={s.list}>
        {!hasData ? (
          <div style={s.empty}>
            <span style={s.emptyText}>Нет данных пикселизации</span>
          </div>
        ) : (
          palette.map((entry) => {
            const withS = withSurplus(entry.count, surplus)
            const isOpen = !!expanded[entry.index]
            return (
              <div key={entry.hex} style={s.colorBlock}>
                <button style={s.colorRow} onClick={() => toggleExpand(entry.index)}>
                  <span style={{ ...s.colorSwatch, background: entry.hex }} />
                  <span style={s.colorNum}>#{entry.index}</span>
                  <span style={s.colorHex}>{entry.hex}</span>
                  <span style={s.spacer} />
                  <span style={s.countMain}>{entry.count} шт.</span>
                  {surplus > 0 && (
                    <span style={s.countSurplus}>→ {withS} шт.</span>
                  )}
                  {isOpen
                    ? <ChevronUp size={16} color="#475569" style={s.chevron} />
                    : <ChevronDown size={16} color="#475569" style={s.chevron} />
                  }
                </button>

                {isOpen && (
                  <div style={s.breakdown}>
                    {entry.byWall.map((bw) => (
                      <div key={bw.wallId} style={s.byWallRow}>
                        <span style={s.byWallName}>{bw.wallName}</span>
                        <span style={s.byWallCount}>{bw.count} шт.</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Кнопка «Скачать SVG» и секция «Проект» — sticky bottom */}
      <div style={s.footer}>
        <button
          style={{ ...s.downloadBtn, opacity: hasData ? 1 : 0.38 }}
          onClick={() => hasData && setDialogOpen(true)}
          disabled={!hasData}
        >
          <Download size={16} style={{ flexShrink: 0 }} />
          Скачать SVG
        </button>

        <div style={s.projectSection}>
          <span style={s.projectLabel}>Проект</span>
          {projectMsg && <span style={s.projectMsg}>{projectMsg}</span>}
          <button
            style={{ ...s.projectBtn, ...s.projectBtnSecondary, opacity: exporting ? 0.6 : 1 }}
            onClick={handleExport}
            disabled={exporting || importing}
          >
            <Upload size={16} style={{ flexShrink: 0 }} />
            {exporting ? 'Сохранение…' : 'Сохранить проект'}
          </button>
          <button
            style={{ ...s.projectBtn, ...s.projectBtnGhost, opacity: importing ? 0.6 : 1 }}
            onClick={() => importInputRef.current?.click()}
            disabled={exporting || importing}
          >
            <Download size={16} style={{ flexShrink: 0 }} />
            {importing ? 'Загрузка…' : 'Загрузить проект'}
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

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    background: '#08080f',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  value: {
    fontSize: 12,
    fontWeight: 500,
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  swatchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  stepperRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: '#f1f5f9',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  stepValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#a78bfa',
    minWidth: 40,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 13,
    color: '#475569',
  },
  colorBlock: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  colorNum: {
    fontSize: 11,
    fontWeight: 600,
    color: '#a78bfa',
    minWidth: 24,
  },
  colorHex: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  spacer: { flex: 1 },
  countMain: {
    fontSize: 12,
    fontWeight: 500,
    color: '#f1f5f9',
    whiteSpace: 'nowrap',
  },
  countSurplus: {
    fontSize: 12,
    color: '#22c55e',
    whiteSpace: 'nowrap',
  },
  chevron: {
    flexShrink: 0,
    marginLeft: 2,
  },
  breakdown: {
    paddingLeft: 28,
    paddingBottom: 8,
  },
  byWallRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 16px 3px 0',
  },
  byWallName: {
    fontSize: 11,
    color: '#64748b',
  },
  byWallCount: {
    fontSize: 11,
    color: '#64748b',
  },
  footer: {
    flexShrink: 0,
    padding: '8px 16px',
    paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: '#08080f',
    position: 'sticky',
    bottom: 0,
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    border: 'none',
    borderRadius: 12,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  projectSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  projectLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  projectMsg: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  projectBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  projectBtnSecondary: {
    background: 'rgba(124,58,237,0.15)',
    border: '1px solid rgba(124,58,237,0.35)',
    color: '#a78bfa',
  },
  projectBtnGhost: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#64748b',
  },
}
