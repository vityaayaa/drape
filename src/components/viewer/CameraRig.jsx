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

  // Pivot: строго двойной тап по одному и тому же месту.
  // Игнорируем: пинчи, свайпы, отпускание одного пальца при двух касаниях.
  useEffect(() => {
    const canvas = gl.domElement

    function doPivot(x, y) {
      if (!orbitRef.current) return
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({ x, y }, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
        .filter((hit) => hit.object instanceof THREE.Mesh)
      if (hits.length > 0) {
        orbitRef.current.target.copy(hits[0].point)
        orbitRef.current.update()
        invalidate()
      }
    }

    // Pixel-radius: точки тапов должны быть достаточно близко.
    const TAP_MAX_MOVE   = 14   // палец почти не двигается за один тап
    const TAP_MAX_DIST   = 30   // между двумя тапами
    const TAP_MAX_DELAY  = 320  // ms между тапами

    // Desktop: dblclick (положение всегда одно)
    function handleDblClick(e) {
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      doPivot(x, y)
    }

    // Mobile: ручная детекция «строго двух тапов в одну точку».
    let touchStartTime = 0
    let touchStartX = 0
    let touchStartY = 0
    let touchCountAtStart = 0
    let lastTapTime = 0
    let lastTapX = 0
    let lastTapY = 0

    function handleTouchStart(e) {
      touchCountAtStart = e.touches.length
      if (e.touches.length !== 1) {
        // Пинч / multi-touch — сбрасываем счётчик тапов
        lastTapTime = 0
        return
      }
      const t = e.touches[0]
      touchStartTime = Date.now()
      touchStartX = t.clientX
      touchStartY = t.clientY
    }

    function handleTouchMove() {
      // Если палец двигается заметно — это пан, а не тап
      // (проверяется при touchend через дистанцию).
    }

    function handleTouchEnd(e) {
      // Считаем тапом только когда:
      //  - в момент start был ровно 1 палец,
      //  - и сейчас отпустили все пальцы (touches.length === 0)
      if (touchCountAtStart !== 1) { lastTapTime = 0; return }
      if (e.touches.length !== 0)  { lastTapTime = 0; return }

      const t = e.changedTouches[0]
      const dx = t.clientX - touchStartX
      const dy = t.clientY - touchStartY
      const movedDist = Math.sqrt(dx * dx + dy * dy)
      const tapDuration = Date.now() - touchStartTime

      // Слишком долгий или сдвинутый — не считаем тапом
      if (tapDuration > 400 || movedDist > TAP_MAX_MOVE) {
        lastTapTime = 0
        return
      }

      const now = Date.now()
      const distFromLast = Math.sqrt(
        (t.clientX - lastTapX) ** 2 + (t.clientY - lastTapY) ** 2
      )
      if (now - lastTapTime < TAP_MAX_DELAY && distFromLast < TAP_MAX_DIST) {
        // Это double-tap
        const rect = canvas.getBoundingClientRect()
        const x = ((t.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((t.clientY - rect.top) / rect.height) * 2 + 1
        doPivot(x, y)
        lastTapTime = 0
      } else {
        lastTapTime = now
        lastTapX = t.clientX
        lastTapY = t.clientY
      }
    }

    canvas.addEventListener('dblclick', handleDblClick)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      canvas.removeEventListener('dblclick', handleDblClick)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
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
