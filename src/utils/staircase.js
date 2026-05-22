// src/utils/staircase.js
// Расчёт геометрии лестницы и генерация масок «ступеньки» под ней.
//
// Единицы: всё в см (как координаты масок).
// Лестница идёт от пола (y=0) вверх. direction: 'right' (вверх-вправо) | 'left' (вверх-влево).

export function calcStaircase({ totalHeight, totalLength, risersCount, startType }) {
  const H = parseFloat(totalHeight)
  const L = parseFloat(totalLength)
  const N = parseInt(risersCount, 10)
  if (!(H > 0) || !(L > 0) || !(N >= 1)) return null

  const riserHeight = H / N
  const treadsCount = startType === 'standard' ? Math.max(1, N - 1) : N
  const treadDepth = L / treadsCount
  const angle = Math.atan(H / L) * (180 / Math.PI)
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
// Каждая ступень — прямоугольник: на участке проступи i высота = (i+1)*riserHeight.
// startX — левый край лестницы по стене (см). startType: 'immediate' | 'standard'.
export function buildStaircaseMasks(calc, { startX = 0, direction = 'right', color = '#888888' } = {}) {
  if (!calc) return []
  const { riserHeight, treadDepth, N, startType } = calc
  const stepsTotal = N
  const masks = []
  // immediate: первая линия — подъём, поэтому первая ступень уже на полной высоте riser.
  // standard: первая — проступь на полу (нулевая высота на первом участке).
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
      y: 0,
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
