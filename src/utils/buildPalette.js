// src/utils/buildPalette.js
//
// buildPalette — агрегирует tileColors по всем стенам в отсортированный список цветов.
//
// tileColors: { wallId: { 'col_row': '#hex', ... }, ... }
// walls:      [{ id, name, ... }]
//
// Возвращает: Array<{ index, hex, count, byWall: [{ wallId, wallName, count }] }>
// Отсортировано по убыванию count.

export function buildPalette(walls, tileColors) {
  // hex → { count, byWall: { wallId → { wallName, count } } }
  const map = new Map()

  for (const wall of walls) {
    const colors = tileColors?.[wall.id]
    if (!colors) continue
    for (const hex of Object.values(colors)) {
      if (!hex) continue
      if (!map.has(hex)) {
        map.set(hex, { count: 0, byWall: new Map() })
      }
      const entry = map.get(hex)
      entry.count += 1
      const wallEntry = entry.byWall.get(wall.id) ?? { wallName: wall.name, count: 0 }
      wallEntry.count += 1
      entry.byWall.set(wall.id, wallEntry)
    }
  }

  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1].count - a[1].count)

  return sorted.map(([hex, { count, byWall }], i) => ({
    index: i + 1,
    hex,
    count,
    byWall: Array.from(byWall.entries()).map(([wallId, { wallName, count: wc }]) => ({
      wallId,
      wallName,
      count: wc,
    })),
  }))
}

export function withSurplus(count, surplusPercent) {
  if (!surplusPercent || surplusPercent <= 0) return count
  return Math.ceil(count + count * surplusPercent / 100)
}
