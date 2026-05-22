export default function MaskOverlay({ mask, wallLength, wallHeight, interiorSide = 'positive' }) {
  const x = parseFloat(mask.x)
  const y = parseFloat(mask.y)
  const w = parseFloat(mask.width)
  const h = parseFloat(mask.height)

  if ([x, y, w, h].some(isNaN) || w <= 0 || h <= 0) return null

  const localX = x + w / 2 - wallLength / 2
  const localY = y + h / 2 - wallHeight / 2
  // Маска должна лежать поверх интерьерной грани.
  const z = interiorSide === 'positive' ? 5.5 : -5.5
  const rotY = interiorSide === 'positive' ? 0 : Math.PI

  return (
    <mesh position={[localX, localY, z]} rotation={[0, rotY, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial
        color={mask.color ?? '#888888'}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </mesh>
  )
}
