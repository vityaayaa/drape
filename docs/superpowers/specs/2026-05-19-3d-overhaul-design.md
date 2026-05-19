# Сессия 2.2 — Переработка 3D-вьювера: Дизайн-спек

**Дата:** 2026-05-19  
**Статус:** Утверждён

---

## Цель

Переработать вкладку «3D» (ViewerTab / RoomScene / WallMesh) по дизайн-решениям сессии 1.4:
правильная камера, объёмные стены, сетка пола, освещение изнутри, UI-оверлеи, настроенные
OrbitControls со smart pivot, пустое состояние.

Стек: React Three Fiber (R3F), @react-three/drei, Three.js. `frameloop="demand"` — не менять.

---

## Архитектура

### Новые файлы

| Файл | Назначение |
|---|---|
| `src/components/viewer/CameraRig.jsx` | Компонент внутри Canvas: управляет OrbitControls, экспозирует `reset()` и `setView()` через `forwardRef`, обрабатывает smart pivot |
| `src/components/viewer/ViewerToolbar.jsx` | HTML-оверлей поверх Canvas: Reset, F/T/ISO, gesture hint |

### Изменённые файлы

| Файл | Что меняется |
|---|---|
| `ViewerTab.jsx` | Камера, интеграция CameraRig и ViewerToolbar, пустое состояние |
| `RoomScene.jsx` | Сетка пола, освещение, принимает `cx / cz / maxHeight` |
| `WallMesh.jsx` | BoxGeometry + массив из 6 материалов |
| `MaskOverlay.jsx` | z-offset 0.5 → 5.5 |

---

## З1 — Камера по умолчанию

**Позиция:**
```
position: [cx + dist*0.7,  dist*0.5,  cz + dist*0.7]
target:   [cx, maxHeight/2, cz]
fov: 55   near: 1   far: camDist * 12
```

Где:
- `cx, cz` — горизонтальный центр комнаты (из `computeWallPositions`)
- `maxHeight` — высота самой высокой активной стены
- `dist = Math.max(totalSpan * 0.9, maxHeight * 2.5, 400)` — уже вычислено в ViewerTab как `camDist`

При изменении набора активных стен Canvas пересоздаётся через `canvasKey` (уже работает) —
камера автоматически сбрасывается на начальные параметры.

`CameraRig` при монтировании сохраняет начальные `position` и `target` для кнопки Reset.

---

## З2 — Объёмные стены

**Геометрия:** `<boxGeometry args={[L, H, 10]} />` (10 units = 100мм при 1 unit = 1 cm).

**Материалы** — массив из 6 элементов (R3F per-face через `attach`):
```
materialIndex 0 (+X, правый торец)  → #1e293b
materialIndex 1 (-X, левый торец)   → #1e293b
materialIndex 2 (+Y, верх)          → #1e293b
materialIndex 3 (-Y, низ)           → #1e293b
materialIndex 4 (+Z, лицо/интерьер) → tile texture (map={texture})
materialIndex 5 (-Z, наружная)      → #1e293b
```

Убрать `side={THREE.DoubleSide}`.

**MaskOverlay:** z-offset обновить 0.5 → 5.5 (грань +Z теперь на z=+5 в локальных координатах).

---

## З3 — Сетка пола

Два `<primitive>` (`gridHelper`) в `RoomScene` на `y=0`:

| Слой | size | divisions | colorCenter | colorGrid |
|---|---|---|---|---|
| Крупный (1м) | 20000 | 20 | `#3a3f52` | `#252b3b` |
| Мелкий (10см) | 20000 | 200 | `#1e2435` | `#181d2b` |

Создаются через `useMemo(() => new THREE.GridHelper(...), [])` чтобы не пересоздавать на каждый рендер.

---

## З4 — Освещение

Убрать `<directionalLight>` и `<ambientLight intensity={0.7}>` из ViewerTab.

Добавить в `RoomScene` (принимает `cx, cz, maxHeight` как пропы):
```jsx
<ambientLight intensity={0.5} />
<pointLight position={[cx, maxHeight * 0.95, cz]} intensity={1.2} color="#fffaf0" />
<hemisphereLight skyColor="#e0e7ff" groundColor="#1e1b2e" intensity={0.4} />
```

---

## З5 — UI-оверлеи

### ViewerToolbar.jsx

HTML-компонент (`position: absolute` поверх Canvas):

```
┌─────────────────────────────────────┐  ← safe area top
│ [↩]              [F] [T] [ISO]      │  48px, background #0e1018
│                                     │  border-bottom: 1px rgba(255,255,255,0.07)
├────────────────────────────────────┤
│           3D Canvas                 │
│                                     │
│   «Вращайте 1 пальцем              │  ← gesture hint (centered overlay)
│    Масштаб — 2 пальца»             │     pointerEvents: none, 4 сек auto-dismiss
└─────────────────────────────────────┘
```

**Reset кнопка** (слева): иконка `RotateCcw` 20px, hit area 44×44, `borderRadius: 10`.
При нажатии: `onReset()` → CameraRig.reset().

**Кнопки вида** (справа): [F] / [T] / [ISO], ширина 40px, высота 36px.
Активная: `background: rgba(124,58,237,0.25)`, `border: 1px solid #7c3aed`.
При нажатии: `onSetView('front' | 'top' | 'iso')` → CameraRig.setView().

**Gesture hint**: `position: absolute, bottom: 60px`, центрирован по горизонтали.
- Текст: «Вращайте 1 пальцем · Масштаб — 2 пальца»
- `pointerEvents: none`, `fontSize: 12`, `color: rgba(255,255,255,0.45)`
- `background: rgba(8,8,15,0.75)`, `borderRadius: 20`, padding 8px 14px
- Показывается один раз: флаг `drape_3d_hint_shown` в localStorage
- Автоматически исчезает через 4 секунды (`opacity` transition 300ms)

### Стиль ViewerTab (оверлей-обёртка)

```jsx
<div style={{ position: 'relative', width: '100%', height: '100%' }}>
  <ViewerToolbar onReset={...} onSetView={...} />
  <Canvas ...>
    ...
    <CameraRig ref={cameraRef} initialPosition={...} initialTarget={...} dist={camDist} cx={cx} cz={cz} maxHeight={maxHeight} />
  </Canvas>
</div>
```

---

## З6 — OrbitControls (в CameraRig)

```
enableDamping    dampingFactor={0.05}
rotateSpeed={0.6}   zoomSpeed={0.8}
minDistance={50}    maxDistance={camDist * 3}
minPolarAngle={0}   maxPolarAngle={Math.PI}
enablePan={true}
```

**Smart pivot (двойной тап):**
1. В `CameraRig`, через `useEffect`: `gl.domElement.addEventListener('dblclick', handler)`
2. `raycaster.setFromCamera` по NDC-координатам клика
3. `raycaster.intersectObjects(scene.children, true)` → берём первое пересечение
4. Обновляем `orbitRef.current.target`, вызываем `controls.update()` и `invalidate()`

**Методы CameraRig (через forwardRef):**

- `reset()` — восстанавливает `camera.position` и `controls.target` до сохранённых начальных значений, вызывает `controls.update()` и `invalidate()`
- `setView('front' | 'top' | 'iso')` — перемещает камеру на заданную позицию относительно центра комнаты:
  - `front`: `[cx, H/2, cz + dist]` → смотрит прямо на стену
  - `top`: `[cx, dist * 1.5, cz]` → сверху вниз
  - `iso`: начальная позиция (то же что reset)

---

## З7 — Пустое состояние

Заменить текущий `<p>` в ViewerTab на inline-блок по дизайну сессии 1.5:

```
[Box icon 32px, #818cf8, opacity 0.5]
Нет стен для 3D-просмотра          ← 15px, #94a3b8
Заполните длину и высоту            ← 12px, #64748b, max-width 240px
хотя бы одной стены

[→ Перейти в Комнату]               ← secondary button h:40
```

Кнопка вызывает `setActiveTab('room')` из store.

---

## Ограничения и допущения

- `frameloop="demand"`: после любого camera action вызывать `invalidate()` из `useThree`.
- `canvasKey` остаётся — Canvas пересоздаётся при смене набора стен. CameraRig монтируется заново, параметры пересчитываются.
- MaterialIndex 4 (+Z face) = внутренняя сторона стены. Это соответствует тому, что PlaneGeometry normal тоже указывает в +Z локально.
- Пустое состояние без shared `EmptyState` компонента — UI-задачи (сессия 2.2 оригинал) перенесены в другую сессию.
