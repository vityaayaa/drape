export default function MaskOverlay({ mask, wallLength, wallHeight }) {
  const x = parseFloat(mask.x)
  const y = parseFloat(mask.y)
  const w = parseFloat(mask.width)
  const h = parseFloat(mask.height)

  if ([x, y, w, h].some(isNaN) || w <= 0 || h <= 0) return null

  const localX = x + w / 2 - wallLength / 2
  const localY = y + h / 2 - wallHeight / 2

  return (
    <mesh position={[localX, localY, 0.5]}>
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
