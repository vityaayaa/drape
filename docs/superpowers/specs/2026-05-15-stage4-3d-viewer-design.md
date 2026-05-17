# Этап 4 — 3D-просмотр комнаты: дизайн

Дата: 2026-05-15  
Ветка: `stage_4`

## Область этапа

Вкладка «Просмотр» (`ViewerTab`): заменить заглушку с вращающимся кубом на реальную 3D-сцену комнаты. Пользователь видит стены с плиткой, масками и швами. Свободная навигация камерой (orbit + zoom). Пол и потолок не отображаются.

## Модель данных

### Изменение corners

Текущий формат хранит только перекрытие угла. Добавляется поле `angle`:

```js
// было
corners: { "w1-w2": "auto" }

// стало
corners: { "w1-w2": { overlap: "auto", angle: 90 } }
```

Угол — внутренний угол комнаты в градусах (90° по умолчанию). Вводится в секции «Углы» на вкладке «Комната» рядом с переключателем перекрытия. Существующая логика перекрытия берётся из `corner.overlap` вместо `corner` напрямую.

### Используемые данные (без изменений)

```js
// из store
walls[]          → length, height, wall_active, masks[], tile_overrides
tile             → tile_width, tile_height, grout_width, grout_color
pixelizer        → tileColors[wallId][col_row]
corners          → { overlap, angle }
```

## Компоненты

```
src/components/viewer/
├── ViewerTab.jsx          ← рефакторинг: заменить заглушку на <RoomScene>
├── RoomScene.jsx          ← новый: читает store, вычисляет позиции, рендерит стены
├── WallMesh.jsx           ← новый: одна стена — PlaneGeometry + текстура + маски
└── MaskOverlay.jsx        ← новый: полупрозрачный прямоугольник поверх стены

src/utils/
└── buildTileTexture.js    ← новый: wall + tileParams + tileColors → HTMLCanvasElement
```

### ViewerTab.jsx

Тонкий контейнер. Читает `walls` из store, если все стены неактивны или пусты — показывает заглушку «нет стен». Иначе рендерит R3F `<Canvas>` с `<RoomScene>`.

```jsx
<Canvas camera={{ position: [cameraX, cameraY, cameraZ], fov: 60 }}>
  <ambientLight intensity={0.7} />
  <directionalLight position={[5, 8, 5]} intensity={0.8} />
  <RoomScene />
  <OrbitControls target={[centerX, centerY, centerZ]} enablePan={true} />
</Canvas>
```

Начальная позиция камеры: центр масс всех стен + отступ по Y (сверху-сбоку), `target` — центр масс.

### RoomScene.jsx

Вычисляет позиции стен цепочкой (алгоритм ниже) → рендерит массив `<WallMesh>`.

### WallMesh.jsx

```jsx
<mesh position={pos} rotation={[0, rotY, 0]}>
  <planeGeometry args={[wall.length, wall.height]} />
  <meshStandardMaterial map={texture} side={THREE.FrontSide} />
  {wall.masks.map(mask => <MaskOverlay key={mask.id} mask={mask} wall={wall} />)}
</mesh>
```

Текстура создаётся через `buildTileTexture`, оборачивается в `THREE.CanvasTexture`. Пересчитывается при изменении `wall`, `tile`, `tileColors`.

### MaskOverlay.jsx

Дочерний `<mesh>` в локальных координатах стены:

```jsx
// позиция в локальном пространстве стены:
// x: от центра стены до центра маски по горизонтали
// y: от центра стены до центра маски по вертикали
// z: 0.005 (чуть впереди плоскости стены)
<mesh position={[localX, localY, 0.005]}>
  <planeGeometry args={[mask.width, mask.height]} />
  <meshBasicMaterial color={mask.color} transparent opacity={0.45} depthWrite={false} />
</mesh>
```

Единицы: перед рендером всё нормализуется в сантиметры (wall.length, wall.height, mask.x/y/width/height). В store стены в см, маски — проверить при реализации (spec этапа 2 указывает см, но в коде может быть мм). В Three.js 1 unit = 1 cm.

## Алгоритм позиционирования стен

Стены выстраиваются цепочкой в плоскости XZ. Обрабатываются только `wall_active = true`.

```
pos = { x: 0, z: 0 }
dir = 0°                         // угол направления движения (0° = вдоль +X)

для каждой активной стены i:
  dx = cos(dir_rad) * wall.length
  dz = sin(dir_rad) * wall.length

  center = { x: pos.x + dx/2, z: pos.z + dz/2 }

  position = [center.x, wall.height / 2, center.z]
  rotation_y = dir_rad
  // PlaneGeometry нормаль по умолчанию = +Z,
  // после rotation_y = dir_rad нормаль смотрит влево от движения = внутрь комнаты

  pos.x += dx
  pos.z += dz

  если есть corner[i → i+1]:
    exterior = 180° - corner.angle
    dir -= exterior              // поворот вправо (по часовой сверху)
```

При `angle = 90°` везде → стандартный прямоугольник. При одной стене — просто одна плоскость.

## Генерация Canvas-текстуры

`buildTileTexture(wall, tileParams, tileColors)` — чистая функция, без side effects.

```
1. Вычислить effectiveTile = merge(tileParams, wall.tile_overrides)
2. Вычислить cols = ceil(wall.length / (tileW + groutW))
         rows = ceil(wall.height / (tileH + groutW))
3. cellPx = clamp(floor(1024 / max(cols, rows)), 4, 32)
   canvasW = cols * cellPx, canvasH = rows * cellPx
4. Создать canvas, залить grout_color
5. Для каждой ячейки (col, row):
     color = tileColors[wall.id][`${col}_${row}`] ?? '#ffffff'
     drawRect(groutW_px/2, groutW_px/2, cellPx - groutW_px, cellPx - groutW_px)
6. Вернуть canvas
```

`groutW_px = max(1, round(groutW / (tileW + groutW) * cellPx))`

Функция вызывается внутри `WallMesh` через `useMemo` при изменении входных данных.

## Изменения в UI (вкладка «Комната»)

В секции «Углы» (`CornersSection`) добавить числовой ввод угла (от 10° до 350°) рядом с каждым переключателем перекрытия. Дефолт: 90°. При изменении — `updateCorner(key, { ...corner, angle: value })`.

Миграция существующих данных: если `corners[key]` — строка (`"auto"` / `"wall_id"`), при чтении преобразовать в `{ overlap: value, angle: 90 }`.

## Стек

Все зависимости уже установлены:
- `three ^0.167`
- `@react-three/fiber ^8.17`
- `@react-three/drei ^9.109`

Никаких новых пакетов не требуется.

## Что не входит в этап 5

- Пол и потолок
- Тени от масок
- Анимация перехода между стенами
- Экспорт 3D-скриншота
- Отображение размеров/подписей стен в 3D
