import { useMemo } from 'react'
import * as THREE from 'three'
import { useProjectStore } from '../../store/projectStore.js'
import { calculateGrid } from '../../utils/roomGeometry.js'
import WallMesh from './WallMesh.jsx'

export default function RoomScene({ positions, cx, cz, maxHeight }) {
  const walls = useProjectStore((s) => s.walls)
  const tile = useProjectStore((s) => s.tile)
  const corners = useProjectStore((s) => s.corners)
  const tileColors = useProjectStore((s) => s.pixelizer.tileColors)

  // Срез угла (сколько «съедает» сосед-победитель) по каждой стене.
  const cutByWall = useMemo(() => {
    const grids = calculateGrid(tile, walls, corners)
    const map = {}
    grids.forEach((g) => { if (g) map[g.wallId] = { leftCutMm: g.leftCutMm, rightCutMm: g.rightCutMm } })
    return map
  }, [tile, walls, corners])

  // Единицы мира = см (1 ед = 1 см). Клетка 0.25 м = 25 ед → 6000/240 = 25 делений.
  // Размер 6000 (60 м) — достаточно для любой комнаты, без лишних вершин.
  const gridLarge = useMemo(
    () => new THREE.GridHelper(6000, 240, '#3a3f52', '#2a3042'),
    [],
  )
  // Крупный акцент каждые 1 м (100 ед) → 6000/60 = 100.
  const gridSmall = useMemo(() => {
    const g = new THREE.GridHelper(6000, 60, '#454b60', '#1e2435')
    g.position.y = -0.1
    return g
  }, [])

  // Для каждой стены вычисляем направление "внутрь комнаты" и определяем,
  // которая грань (+Z или -Z) интерьерная.
  const wallsWithSides = useMemo(() => {
    return positions.map((pos) => {
      // Локальное +Z после поворота вокруг Y: (sin θ, 0, cos θ)
      const frontZ = [Math.sin(pos.rotationY), 0, Math.cos(pos.rotationY)]
      // Направление к центру комнаты
      const inward = [cx - pos.position[0], 0, cz - pos.position[2]]
      const dot = frontZ[0] * inward[0] + frontZ[2] * inward[2]
      // Если +Z грань смотрит к центру комнаты — это интерьерная сторона.
      const interiorSide = dot >= 0 ? 'positive' : 'negative'
      return { ...pos, interiorSide }
    })
  }, [positions, cx, cz])

  return (
    <>
      {/* Основное амбиентное освещение */}
      <ambientLight intensity={0.7} />
      {/* Hemisphere — нежный наполнитель для имитации неба/пола */}
      <hemisphereLight args={['#e0e7ff', '#1e1b2e', 0.6]} />
      {/* Тёплая лампа сверху по центру комнаты */}
      <pointLight
        position={[cx, maxHeight * 1.2, cz]}
        intensity={1.4}
        distance={maxHeight * 8}
        decay={1.5}
        color="#fffaf0"
      />
      {/* Холодный directional для контраста */}
      <directionalLight
        position={[cx + maxHeight * 2, maxHeight * 3, cz + maxHeight * 2]}
        intensity={0.5}
        color="#ffffff"
      />
      <directionalLight
        position={[cx - maxHeight * 2, maxHeight * 1.5, cz - maxHeight * 2]}
        intensity={0.3}
        color="#c7d2fe"
      />

      <primitive object={gridLarge} />
      <primitive object={gridSmall} />
      {wallsWithSides.map((pos) => {
        const wall = walls.find((w) => w.id === pos.wallId)
        if (!wall) return null
        return (
          <WallMesh
            key={wall.id}
            wall={wall}
            tile={tile}
            tileColors={tileColors[wall.id]}
            position={pos.position}
            rotationY={pos.rotationY}
            interiorSide={pos.interiorSide}
            renderLength={pos.renderLength}
            cut={cutByWall[wall.id]}
          />
        )
      })}
    </>
  )
}
