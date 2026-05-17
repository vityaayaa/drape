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
    return () => {
      texture?.dispose()
    }
  }, [texture])

  const L = parseFloat(wall.length)
  const H = parseFloat(wall.height)
  if (!L || !H) return null

  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[L, H]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? '#ffffff' : '#94a3b8'}
        side={THREE.DoubleSide}
      />
      {(wall.masks ?? []).map((mask) => (
        <MaskOverlay key={mask.id} mask={mask} wallLength={L} wallHeight={H} />
      ))}
    </mesh>
  )
}
