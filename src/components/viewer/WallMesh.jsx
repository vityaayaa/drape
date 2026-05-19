import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import MaskOverlay from './MaskOverlay.jsx'
import { buildTileTexture } from '../../utils/buildTileTexture.js'

export default function WallMesh({ wall, tile, tileColors, position, rotationY }) {
  const canvas = useMemo(
    () => buildTileTexture(wall, tile, tileColors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wall.id, wall.length, wall.height, wall.tile_overrides, tile, tileColors],
  )

  const texture = useMemo(() => {
    if (!canvas) return null
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [canvas])

  useEffect(() => {
    return () => { texture?.dispose() }
  }, [texture])

  const L = parseFloat(wall.length)
  const H = parseFloat(wall.height)
  if (!L || !H) return null

  const THICKNESS = 10 // 100 мм = 10 см
  const exterior = '#2d3748'
  const interior = texture ? '#ffffff' : '#4a5568'

  // mat-0 +X, mat-1 -X, mat-2 +Y, mat-3 -Y, mat-4 +Z, mat-5 -Z
  // +Z грань смотрит внутрь когда rotationY ≈ 0 или π/2,
  // наружу когда rotationY ≈ π или 3π/2 — используем DoubleSide для текстуры

  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[L, H, THICKNESS]} />
      <meshStandardMaterial attach="material-0" color={exterior} />
      <meshStandardMaterial attach="material-1" color={exterior} />
      <meshStandardMaterial attach="material-2" color={exterior} />
      <meshStandardMaterial attach="material-3" color={exterior} />
      {/* интерьерная сторона — DoubleSide чтобы текстура была видна независимо от поворота */}
      <meshStandardMaterial
        attach="material-4"
        map={texture ?? undefined}
        color={interior}
        side={THREE.DoubleSide}
      />
      <meshStandardMaterial attach="material-5" color={exterior} />
      {(wall.masks ?? []).map((mask) => (
        <MaskOverlay key={mask.id} mask={mask} wallLength={L} wallHeight={H} />
      ))}
    </mesh>
  )
}
