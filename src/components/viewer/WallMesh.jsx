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

  const dark = '#1e293b'

  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[L, H, 10]} />
      {/* торцы и наружная грань — тёмный нейтральный цвет */}
      <meshStandardMaterial attach="material-0" color={dark} />
      <meshStandardMaterial attach="material-1" color={dark} />
      <meshStandardMaterial attach="material-2" color={dark} />
      <meshStandardMaterial attach="material-3" color={dark} />
      {/* грань +Z (materialIndex 4) = интерьерная сторона → текстура плитки */}
      <meshStandardMaterial
        attach="material-4"
        map={texture ?? undefined}
        color={texture ? '#ffffff' : dark}
      />
      <meshStandardMaterial attach="material-5" color={dark} />
      {(wall.masks ?? []).map((mask) => (
        <MaskOverlay key={mask.id} mask={mask} wallLength={L} wallHeight={H} />
      ))}
    </mesh>
  )
}
