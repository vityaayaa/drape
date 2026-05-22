import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import MaskOverlay from './MaskOverlay.jsx'
import { buildTileTexture } from '../../utils/buildTileTexture.js'

export default function WallMesh({ wall, tile, tileColors, position, rotationY, interiorSide = 'positive', renderLength }) {
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

  // Для зеркальной грани (-Z) нужно отразить текстуру по X,
  // иначе плитки будут «зеркальными».
  const textureFlipped = useMemo(() => {
    if (!canvas) return null
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.repeat.x = -1
    tex.offset.x = 1
    return tex
  }, [canvas])

  useEffect(() => {
    return () => { texture?.dispose(); textureFlipped?.dispose() }
  }, [texture, textureFlipped])

  const L = parseFloat(wall.length)
  const H = parseFloat(wall.height)
  if (!L || !H) return null
  // Длина бокса — обрезанная (renderLength), чтобы стены сходились на углах вровень.
  const boxL = renderLength ?? L

  const THICKNESS = 10
  const EXTERIOR = '#3b425a'   // приятный нейтральный exterior (не чёрный)
  const FRAME    = '#4a5568'   // торцы стены

  // material-4 = +Z грань, material-5 = -Z грань
  const interiorIsPositive = interiorSide === 'positive'
  const interiorTexture = interiorIsPositive ? texture : textureFlipped

  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[boxL, H, THICKNESS]} />
      <meshStandardMaterial attach="material-0" color={FRAME} />
      <meshStandardMaterial attach="material-1" color={FRAME} />
      <meshStandardMaterial attach="material-2" color={FRAME} />
      <meshStandardMaterial attach="material-3" color={FRAME} />
      {/* +Z грань */}
      <meshStandardMaterial
        attach="material-4"
        map={interiorIsPositive ? (interiorTexture ?? undefined) : undefined}
        color={interiorIsPositive ? '#ffffff' : EXTERIOR}
        roughness={0.85}
        metalness={0.05}
      />
      {/* -Z грань */}
      <meshStandardMaterial
        attach="material-5"
        map={!interiorIsPositive ? (interiorTexture ?? undefined) : undefined}
        color={!interiorIsPositive ? '#ffffff' : EXTERIOR}
        roughness={0.85}
        metalness={0.05}
      />
      {(wall.masks ?? []).map((mask) => (
        <MaskOverlay
          key={mask.id}
          mask={mask}
          wallLength={L}
          wallHeight={H}
          interiorSide={interiorSide}
        />
      ))}
    </mesh>
  )
}
