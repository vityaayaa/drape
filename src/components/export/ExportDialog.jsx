// src/components/export/ExportDialog.jsx
import { useState, useEffect, useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
import { buildSchemaSVG, downloadSVG } from '../../utils/schemaSVGBuilder.js'
import { buildQuantizeMap, quantizeTileColors } from '../../utils/quantizeColors.js'
import { buildPalette } from '../../utils/buildPalette.js'
import Modal from '../ui/Modal.jsx'

export default function ExportDialog({ walls, tile, palette, surplusPercent, onClose }) {
  const tileColors = useProjectStore((s) => s.pixelizer.tileColors)
  const quantize   = useProjectStore((s) => s.pixelizer.quantize)

  const [scaleMode, setScaleMode] = useState('fit')
  const [drawGrout, setDrawGrout] = useState(true)
  const [loading, setLoading]     = useState(false)
  const [longWait, setLongWait]   = useState(false)

  const groutWidth = parseFloat(tile.grout_width) || 0

  useEffect(() => {
    if (groutWidth === 0) setDrawGrout(false)
  }, [groutWidth])

  // Квантизованные цвета плиток (как в Фото/Схеме) — чтобы SVG соответствовал
  const exportTileColors = useMemo(() => {
    const rawPalette = buildPalette(walls, tileColors)
    const map = buildQuantizeMap(rawPalette, quantize)
    return quantizeTileColors(tileColors, map)
  }, [walls, tileColors, quantize])

  const handleDownload = () => {
    setLoading(true)
    setLongWait(false)
    const timer3s = setTimeout(() => setLongWait(true), 3000)
    setTimeout(() => {
      try {
        const svg = buildSchemaSVG({
          walls,
          tile,
          tileColors: exportTileColors,
          palette,
          options: { scale: scaleMode, drawGrout, surplusPercent },
        })
        downloadSVG(svg, 'drape-mosaic.svg')
        onClose()
      } finally {
        clearTimeout(timer3s)
        setLoading(false)
        setLongWait(false)
      }
    }, 0)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Скачать SVG"
      footer={
        <>
          <button
            style={{ ...s.downloadBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleDownload}
            disabled={loading}
          >
            {loading ? 'Готовлю файл…' : '↓ Скачать SVG'}
          </button>
          {longWait && <p style={s.longWaitHint}>Большой файл, ещё немного…</p>}
        </>
      }
    >
      <div style={s.section}>
        <p style={s.sectionTitle}>Масштаб</p>
        <div style={s.radioGroup}>
          <label style={s.radioLabel}>
            <input type="radio" name="scaleMode" checked={scaleMode === 'fit'} onChange={() => setScaleMode('fit')} style={s.radioInput} />
            <span style={s.radioMark(scaleMode === 'fit')} />
            <div>
              <span style={s.radioText(scaleMode === 'fit')}>На экран</span>
              <span style={s.radioHint}>Оптимально для просмотра в браузере</span>
            </div>
          </label>
          <label style={s.radioLabel}>
            <input type="radio" name="scaleMode" checked={scaleMode === 'real'} onChange={() => setScaleMode('real')} style={s.radioInput} />
            <span style={s.radioMark(scaleMode === 'real')} />
            <div>
              <span style={s.radioText(scaleMode === 'real')}>Реальный размер 1:1</span>
              <span style={s.radioHint}>Размеры в мм, для печати на плоттере</span>
            </div>
          </label>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.toggleRow}>
          <div>
            <p style={s.sectionTitle}>Рисовать швы</p>
            {groutWidth === 0 && <p style={s.disabledHint}>Ширина шва = 0 — швы не нужны</p>}
          </div>
          <button
            style={s.toggle(drawGrout, groutWidth === 0)}
            onClick={() => groutWidth > 0 && setDrawGrout((v) => !v)}
            disabled={groutWidth === 0}
            aria-label="Рисовать швы"
          >
            <span style={s.toggleKnob(drawGrout)} />
          </button>
        </div>
      </div>
    </Modal>
  )
}

const s = {
  section: { background: '#0e1018', borderRadius: 12, padding: '12px 14px', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 500, color: '#94a3b8', margin: '0 0 8px' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  radioLabel: { display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' },
  radioInput: { position: 'absolute', opacity: 0, width: 0, height: 0 },
  radioMark: (active) => ({
    width: 18, height: 18, borderRadius: '50%',
    border: active ? '5px solid #a78bfa' : '2px solid rgba(255,255,255,0.2)',
    flexShrink: 0, marginTop: 2, transition: 'border 150ms',
  }),
  radioText: (active) => ({
    display: 'block', fontSize: 14, fontWeight: 500,
    color: active ? '#f1f5f9' : '#94a3b8', marginBottom: 2,
  }),
  radioHint: { display: 'block', fontSize: 11, color: '#475569' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  toggle: (active, disabled) => ({
    width: 44, height: 26, borderRadius: 13,
    background: active && !disabled ? '#7c3aed' : 'rgba(255,255,255,0.1)',
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative', flexShrink: 0, opacity: disabled ? 0.38 : 1, transition: 'background 200ms',
  }),
  toggleKnob: (active) => ({
    position: 'absolute', top: 3, left: active ? 21 : 3,
    width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 200ms',
  }),
  disabledHint: { fontSize: 10, color: '#475569', margin: '2px 0 0' },
  downloadBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', height: 52,
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    border: 'none', borderRadius: 12, color: '#f1f5f9',
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 0 20px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  longWaitHint: { textAlign: 'center', fontSize: 10, color: '#64748b', margin: '8px 0 0' },
}
