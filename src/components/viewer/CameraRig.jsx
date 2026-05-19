import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const CameraRig = forwardRef(function CameraRig(
  { initialPosition, initialTarget, camDist, cx, cz, maxHeight },
  ref,
) {
  const { camera, gl, scene, invalidate } = useThree()
  const orbitRef = useRef()

  // Начальный рендер при frameloop="demand"
  useEffect(() => {
    invalidate()
  }, [invalidate])

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        if (!orbitRef.current) return
        camera.position.set(...initialPosition)
        orbitRef.current.target.set(...initialTarget)
        orbitRef.current.update()
        invalidate()
      },
      setView(view) {
        if (!orbitRef.current) return
        const H = maxHeight / 2
        if (view === 'front') {
          camera.position.set(cx, H, cz + camDist)
          orbitRef.current.target.set(cx, H, cz)
        } else if (view === 'top') {
          camera.position.set(cx, camDist * 1.5, cz)
          orbitRef.current.target.set(cx, 0, cz)
        } else {
          // iso — то же что reset
          camera.position.set(...initialPosition)
          orbitRef.current.target.set(...initialTarget)
        }
        orbitRef.current.update()
        invalidate()
      },
    }),
    [initialPosition, initialTarget, camDist, cx, cz, maxHeight, camera, invalidate],
  )

  // Smart pivot: двойной клик → camera фокусируется на точке касания
  useEffect(() => {
    const canvas = gl.domElement
    function handleDblClick(e) {
      if (!orbitRef.current) return
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({ x, y }, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      if (hits.length > 0) {
        orbitRef.current.target.copy(hits[0].point)
        orbitRef.current.update()
        invalidate()
      }
    }
    canvas.addEventListener('dblclick', handleDblClick)
    return () => canvas.removeEventListener('dblclick', handleDblClick)
  }, [gl, camera, scene, invalidate])

  return (
    <OrbitControls
      ref={orbitRef}
      target={new THREE.Vector3(...initialTarget)}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      minDistance={50}
      maxDistance={camDist * 3}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
      enablePan
    />
  )
})

export default CameraRig
