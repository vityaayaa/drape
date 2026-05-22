// src/utils/quantizeColors.js
// Median-cut квантизация цветов.
// Принимает массив hex-цветов с весами (количеством плиток),
// возвращает Map<original_hex, quantized_hex>.

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h
  const i = parseInt(n, 16)
  return [(i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff]
}

function rgbToHex(r, g, b) {
  const c = (v) => v.toString(16).padStart(2, '0')
  return '#' + c(Math.round(r)) + c(Math.round(g)) + c(Math.round(b))
}

function boxStats(points) {
  let minR = 255, minG = 255, minB = 255
  let maxR = 0, maxG = 0, maxB = 0
  let totalR = 0, totalG = 0, totalB = 0, totalW = 0
  for (const p of points) {
    if (p.r < minR) minR = p.r
    if (p.g < minG) minG = p.g
    if (p.b < minB) minB = p.b
    if (p.r > maxR) maxR = p.r
    if (p.g > maxG) maxG = p.g
    if (p.b > maxB) maxB = p.b
    totalR += p.r * p.w
    totalG += p.g * p.w
    totalB += p.b * p.w
    totalW += p.w
  }
  return {
    rangeR: maxR - minR,
    rangeG: maxG - minG,
    rangeB: maxB - minB,
    avgR: totalW > 0 ? totalR / totalW : 0,
    avgG: totalW > 0 ? totalG / totalW : 0,
    avgB: totalW > 0 ? totalB / totalW : 0,
    weight: totalW,
  }
}

function splitBox(points) {
  const stats = boxStats(points)
  const ranges = [stats.rangeR, stats.rangeG, stats.rangeB]
  const axis = ranges.indexOf(Math.max(...ranges))
  const key = ['r', 'g', 'b'][axis]
  const sorted = [...points].sort((a, b) => a[key] - b[key])
  // Делим по медиане веса
  const halfW = stats.weight / 2
  let acc = 0
  let splitIdx = 0
  for (let i = 0; i < sorted.length; i++) {
    acc += sorted[i].w
    if (acc >= halfW) { splitIdx = i + 1; break }
  }
  if (splitIdx <= 0) splitIdx = 1
  if (splitIdx >= sorted.length) splitIdx = sorted.length - 1
  return [sorted.slice(0, splitIdx), sorted.slice(splitIdx)]
}

/**
 * @param {Map<string, number>} colorWeights — hex → суммарный вес (количество плиток)
 * @param {number} targetCount — желаемое число цветов после квантизации
 * @returns {Map<string, string>} mapping: исходный hex → квантованный hex
 */
export function quantizeColors(colorWeights, targetCount) {
  if (!targetCount || targetCount <= 0) {
    const ident = new Map()
    colorWeights.forEach((_, hex) => ident.set(hex, hex))
    return ident
  }

  // Собираем точки
  const points = []
  colorWeights.forEach((w, hex) => {
    const [r, g, b] = hexToRgb(hex)
    points.push({ r, g, b, w, hex })
  })

  if (points.length <= targetCount) {
    const ident = new Map()
    points.forEach((p) => ident.set(p.hex, p.hex))
    return ident
  }

  // Median-cut: повторяем пока не получим targetCount боксов
  let boxes = [points]
  while (boxes.length < targetCount) {
    // Выбираем бокс с наибольшим разбросом по любой оси
    let idx = 0
    let maxRange = -1
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].length < 2) continue
      const stats = boxStats(boxes[i])
      const range = Math.max(stats.rangeR, stats.rangeG, stats.rangeB)
      if (range > maxRange) { maxRange = range; idx = i }
    }
    if (maxRange <= 0) break
    const [a, b] = splitBox(boxes[idx])
    if (a.length === 0 || b.length === 0) break
    boxes = [...boxes.slice(0, idx), a, b, ...boxes.slice(idx + 1)]
  }

  // Репрезентативный цвет каждого бокса = взвешенное среднее
  const reps = boxes.map((box) => {
    const stats = boxStats(box)
    return {
      hex: rgbToHex(stats.avgR, stats.avgG, stats.avgB),
      points: box,
    }
  })

  // Mapping: каждый исходный hex → hex своего бокса
  const mapping = new Map()
  reps.forEach((rep) => {
    rep.points.forEach((p) => mapping.set(p.hex, rep.hex))
  })

  return mapping
}

/**
 * Строит mapping исходный_hex → квантованный_hex по палитре и числу цветов.
 * Если count пустой или цветов и так мало — возвращает null (квантизация не нужна).
 * @param {Array} palette — результат buildPalette ([{ hex, count }])
 * @param {number|null} count
 * @returns {Map<string,string>|null}
 */
export function buildQuantizeMap(palette, count) {
  if (!count || !palette || palette.length <= count) return null
  const weights = new Map()
  palette.forEach((e) => weights.set(e.hex, e.count))
  return quantizeColors(weights, count)
}

/**
 * Применяет mapping к посчитанным цветам плиток (для отображения мозаики).
 * @param {Object} tileColors — { wallId: { 'col_row': '#hex' } }
 * @param {Map<string,string>|null} map
 * @returns {Object} новый tileColors с переотображёнными цветами (или исходный, если map=null)
 */
export function quantizeTileColors(tileColors, map) {
  if (!map) return tileColors
  const out = {}
  for (const wallId in tileColors) {
    const wallColors = tileColors[wallId]
    const newWall = {}
    for (const key in wallColors) {
      const hex = wallColors[key]
      newWall[key] = map.get(hex) ?? hex
    }
    out[wallId] = newWall
  }
  return out
}

/**
 * Применить mapping к buildPalette результату.
 * Возвращает агрегированную палитру под новыми цветами.
 */
export function applyQuantization(palette, mapping) {
  // hex(quantized) → { count, byWall: Map<wallId, {wallName, count}>, originals: Set<hex> }
  const map = new Map()
  for (const entry of palette) {
    const newHex = mapping.get(entry.hex) ?? entry.hex
    if (!map.has(newHex)) {
      map.set(newHex, { count: 0, byWall: new Map(), originals: new Set() })
    }
    const bucket = map.get(newHex)
    bucket.count += entry.count
    bucket.originals.add(entry.hex)
    for (const bw of entry.byWall) {
      const cur = bucket.byWall.get(bw.wallId) ?? { wallName: bw.wallName, count: 0 }
      cur.count += bw.count
      bucket.byWall.set(bw.wallId, cur)
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([hex, { count, byWall, originals }], i) => ({
      index: i + 1,
      hex,
      count,
      originalCount: originals.size,
      byWall: Array.from(byWall.entries()).map(([wallId, { wallName, count: wc }]) => ({
        wallId, wallName, count: wc,
      })),
    }))
}
