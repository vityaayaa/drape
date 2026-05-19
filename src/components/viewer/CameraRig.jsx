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

  // Fix 1: set initial target imperatively on mount (not via controlled prop)
  useEffect(() => {
    if (!orbitRef.current) return
    orbitRef.current.target.set(...initialTarget)
    orbitRef.current.update()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
          // Fix 3: tiny Z offset to avoid polar singularity
          camera.position.set(cx, camDist * 1.5, cz + 1)
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

  // Smart pivot: двойной клик / двойной тап → camera фокусируется на точке касания
  useEffect(() => {
    const canvas = gl.domElement

    // Fix 5: filter hits to only THREE.Mesh — ignore GridHelper LineSegments
    function doPivot(x, y) {
      if (!orbitRef.current) return
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({ x, y }, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
        .filter(hit => hit.object instanceof THREE.Mesh)
      if (hits.length > 0) {
        orbitRef.current.target.copy(hits[0].point)
        orbitRef.current.update()
        invalidate()
      }
    }

    function handleDblClick(e) {
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      doPivot(x, y)
    }

    // Fix 2: double-tap detection for mobile (dblclick is not fired on iOS/Android)
    let lastTapTime = 0
    function handleTouchEnd(e) {
      const now = Date.now()
      if (now - lastTapTime < 300 && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0]
        const rect = canvas.getBoundingClientRect()
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1
        doPivot(x, y)
        lastTapTime = 0
      } else {
        lastTapTime = now
      }
    }

    canvas.addEventListener('dblclick', handleDblClick)
    canvas.addEventListener('touchend', handleTouchEnd)
    return () => {
      canvas.removeEventListener('dblclick', handleDblClick)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [gl, camera, scene, invalidate])

  return (
    <OrbitControls
      ref={orbitRef}
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
