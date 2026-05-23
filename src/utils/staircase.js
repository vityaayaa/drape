// src/utils/staircase.js
// Расчёт геометрии лестницы и генерация масок «ступеньки» под ней.
//
// Единицы: всё в см (как координаты масок).
// Лестница идёт от пола (y=startY) вверх. direction: 'right' | 'left'.
//
// Режимы старта:
//   'immediate' — первое движение вверх (подступёнок). Проступей: N-1. Проступь шире.
//   'standard'  — первое движение вперёд (проступь).  Проступей: N.   Проступь у́же.

export function calcStaircase({ totalHeight, totalLength, risersCount, startType }) {
  const H = parseFloat(totalHeight)
  const L = parseFloat(totalLength)
  const N = parseInt(risersCount, 10)
  if (!(H > 0) || !(L > 0) || !(N >= 1)) return null

  const riserHeight = H / N
  // immediate: N подступёнков, N-1 проступей (последний подъём выходит на верхний этаж)
  // standard:  N подступёнков, N   проступей
  const treadsCount = startType === 'immediate' ? Math.max(1, N - 1) : N
  const treadDepth = L / treadsCount
  // Угол — эргономический (наклон одного шага), а не суммарный уклон H/L
  const angle = Math.atan(riserHeight / treadDepth) * (180 / Math.PI)
  const blondel = 2 * riserHeight + treadDepth

  let status = 'critical'
  if (angle >= 30 && angle <= 35 && blondel >= 60 && blondel <= 64 && riserHeight <= 17) {
    status = 'excellent'
  } else if ((angle > 35 && angle <= 42) || (blondel >= 58 && blondel <= 66)) {
    status = 'acceptable'
  }

  return { riserHeight, treadDepth, treadsCount, angle, blondel, status, H, L, N, startType }
}

// Генерирует маски ступенчатой области ПОД лестницей (от пола вверх).
// Каждая ступень — прямоугольник: на участке проступи i высота = cumulative.
//
// startX — точка входа (нижней ступени) от левого края стены:
//   direction 'right' → startX = левый  край нижней ступени
//   direction 'left'  → startX = правый край нижней ступени (маски расходятся влево)
// startY — сдвиг от пола (обычно 0)
export function buildStaircaseMasks(calc, { startX = 0, startY = 0, direction = 'right', color = '#888888' } = {}) {
  if (!calc) return []
  const { riserHeight, treadDepth, N, startType } = calc
  // immediate: N-1 колонок (последний подъём на верхний этаж не создаёт новую колонку)
  // standard:  N   колонок, но первая (i=0) имеет h=0 и пропускается
  const stepsTotal = startType === 'immediate' ? N - 1 : N
  const masks = []
  for (let i = 0; i < stepsTotal; i++) {
    const heightSteps = startType === 'immediate' ? i + 1 : i
    const h = heightSteps * riserHeight
    if (h <= 0) continue
    const w = treadDepth
    const xLocal = i * treadDepth
    const x = direction === 'right' ? startX + xLocal : startX - xLocal - w
    masks.push({
      name: `Ступень ${i + 1}`,
      x: round2(x),
      y: round2(startY),
      width: round2(w),
      height: round2(h),
      color,
    })
  }
  return masks
}

function round2(n) {
  return Math.round(n * 100) / 100
}
