# Drape — Состояние дизайн-сессий

> Этот файл читает каждая новая сессия перед началом работы.
> Каждая сессия дописывает свой блок в конец.

---

## Контекст проекта

**Drape** — мобильное PWA-приложение для укладки плитки (React 18 + Vite).
Целевая платформа: мобильный телефон (iPhone, Android). Тёмная тема.

**Вкладки приложения:**
- **Комната** — параметры плитки, стены, маски-препятствия, углы, итог
- **Фото** — панорамная развёртка стен, наложение фото, пикселизация цветов плитки
- **3D** — трёхмерный просмотр комнаты с плиткой
- **Схема** — заглушка (этап 6)
- **Укладка** — заглушка (этап 7)

**Стек:** React 18, Zustand 4, Vite 5, Three.js / R3F, react-zoom-pan-pinch, IndexedDB

**Структура src/:**
```
components/
  room/       — RoomTab, WallCard, MaskCard, TileForm, CornersSection, SummarySection
  pixelizer/  — PixelizerTab, PhotoPanorama, ControlsPane, ActionBar, WallCanvas, ...
  viewer/     — ViewerTab, RoomScene, WallMesh, MaskOverlay
  export/     — ExportTab (заглушка)
  layout/     — LayoutTab (заглушка)
store/
  projectStore.js  — Zustand store
  persistence.js   — IndexedDB
utils/
  pixelizerGeometry.js, pixelizerRenderer.js, pixelizerSampler.js
  computeWallPositions.js, buildTileTexture.js
  roomGeometry.js
```

**Текущие проблемы (полный список):**
Технические:
- Фото: однопальцевый жест не двигает фото (двигает весь мир) — режим трансформации не реализован
- Фото: яркость/контраст/насыщенность не применяются к canvas (только в store)
- Фото: масштаб — сломан controlled input (value.toFixed(2) перезаписывает при каждом keystroke)
- Фото: ввод "050" — баг iOS number input с leading zero
- Фото: нет явного отрицательного сдвига в UI (min не указан, но нет обозначения)
- Фото: разная высота стен — плитки не выровнены по нижнему краю (floor anchor)
- 3D: PlaneGeometry — стены без толщины
- 3D: текстура зеркалится на внешнюю сторону
- 3D: камера смотрит снаружи комнаты, а не изнутри
- 3D: освещение снаружи, изнутри темно
- Комната: нумерация стен не обновляется при удалении
- Нет валидации размеров (0, отрицательные)

Визуальные:
- Комната: "стена перекрывает + градус" не влезает в одну строку
- Комната: цвет шва — узкий, не как другие поля
- Комната: "Переопределить плитку" — длинная текст-ссылка, не кнопка
- Комната: значения в SummarySection не выровнены под заголовками
- Фото: дублирование кнопок "+ Фото" и "+ Добавить фото"
- Фото: "Пикселизировать" активна даже без фото
- Фото: дублирование ViewModeControl (глазик + сегментированный переключатель)
- Фото: панель настроек скроллится — должна растягиваться на всё место
- Фото: сетка разноцветная (скатерть-эффект) — должна быть одного цвета
- Фото: WallSelectSheet и WallsSheet перекрываются нижним таббаром
- 3D: нет сетки пола, нет UI-оверлеев, нет управления видом
- Общее: разные стили у Комнаты и Фото — нет единой дизайн-системы
- Нет онбординга и visual flow между вкладками
- Нет анимаций (добавление/удаление карточек, переходы)

---

## Сессия 1.1 — Дизайн-система ✅

### Направление
**Dark Glow** — тёмные solid-поверхности (без blur на карточках) + свечение через box-shadow + статичный blur только на фиксированных оверлеях (навбар, шиты, модалки). Компромисс между красотой и производительностью.

### Палитра
- Фон: `#08080f`
- Поверхность 1 (карточки, формы): `#0e1018` — solid, без blur
- Поверхность 2 (вложенные секции): `#141820`
- Поверхность overlay (nav, sheets): `rgba(8,8,15,0.92)` + `backdrop-filter: blur(24px)` — только на fixed-элементах
- Акцент: `#7c3aed`
- Акцент светлый (активный tab, glow): `#a78bfa`
- Акцент glow (box-shadow): `rgba(124,58,237,0.25)`
- Текст основной: `#f1f5f9`
- Текст вторичный: `#94a3b8`
- Текст hint: `#64748b`
- Текст disabled: `#334155`
- Граница: `rgba(255,255,255,0.07)`
- Граница сильная: `rgba(255,255,255,0.12)`
- Граница focus: `rgba(124,58,237,0.60)`
- Ошибка: `#ef4444`
- Успех: `#22c55e`
- Warning: `#f59e0b`

### Типографика
- Шрифт: Inter (через system-ui, уже в коде)
- Заголовок: 18px, вес 600
- Body: 15px, вес 400
- Label: 13px, вес 500
- Hint/Caption: 12px, вес 400

### Отступы
- Base unit: 8px
- s-1: 4px — иконка ↔ текст
- s-2: 8px — inline-элементы
- s-3: 12px — вертикальный padding кнопок
- s-4: 16px — padding карточек
- s-5: 20px — горизонтальный padding страницы
- s-6: 24px — gap между карточками
- s-8: 32px — отступы между секциями

### Радиусы
- Карточка: 16px
- Кнопка primary/secondary: 12px
- Кнопка ghost/маленькая: 8px
- Инпут: 10px
- Иконка-кнопка (круглая): 50%
- Bottom sheet: 20px 20px 0 0
- Toast: 12px

### Кнопки
- **Primary:** фиолетовый градиент (#7c3aed → #6d28d9), свечение через box-shadow, инсет световая полоска сверху. При нажатии сжимается до 0.97.
- **Secondary:** полупрозрачный тёмный фон, тонкая граница, белый текст. При hover чуть светлее.
- **Ghost:** прозрачный фон, серый текст. При hover лёгкий фон и белый текст.
- **Danger:** красноватый полупрозрачный фон, красная граница, красный текст.

### Карточки
Тёмный solid-фон (#0e1018) + тонкая граница + инсет световая полоска сверху (имитация стеклянного края без blur) + тень снизу для глубины.

### Инпуты
Полупрозрачный тёмный фон, тонкая граница, высота 44px (минимум для iOS). При фокусе — фиолетовая граница и лёгкое фиолетовое свечение.

### Иконки навбара (Lucide, 24px)
- Комната: `LayoutGrid`
- Фото: `Camera`
- 3D: `Box`
- Схема: `PenLine`
- Укладка: `Grid3x3`

### Контекст для следующей сессии 1.2
Дизайн-система согласована: Dark Glow. Фон #08080f, карточки solid #0e1018 (без blur), акцент #7c3aed / #a78bfa, blur только на nav и sheets. Типографика Inter: заголовок 18/600, body 15/400, label 13/500, hint 12/400. Отступы 8px grid. Радиусы: карточка 16px, кнопка 12px, инпут 10px. Иконки навбара: LayoutGrid / Camera / Box / PenLine / Grid3x3 (Lucide).

Задача 1.2 — применить дизайн-систему к вкладке **Комната**: унифицировать TileForm, WallCard, MaskCard, CornersSection, SummarySection. Исправить визуальные баги: "стена перекрывает + градус" не влезает в строку, цвет шва слишком узкий, "Переопределить плитку" — оформить как кнопку, значения SummarySection выровнять под заголовками. Добавить кнопку добавления стены в едином стиле.

---

## Сессия 1.2 — Комната UI ✅

### CornersSection layout
**Проблема:** label + select + angleInput не влезали в 350px (usable width на 390px).

**Решение:** двухстрочный блок вместо одной flex-строки.
- `cornerItem` — block-контейнер, `marginBottom: 12`
- `label` — `display: 'block'`, отдельная строка над контролами
- `controls` — `display: 'flex', gap: 8`: `select` (flex:1, height 44) + `angleInput` (width 64, height 44) + `°`

```
Стена 1 / Стена 2                    ← label сверху
[ Стена 1 перекрывает ▾ ] [90][°]   ← controls снизу, select растягивается
```

### TileForm — цвет шва
**Проблема:** `<input type="color" width:40>` — маленький квадрат, выбивается из ряда.

**Решение:** `<label>` оборачивает скрытый `<input type="color">` + видимый `<div>` цветовой полосы.
- `colorLabel`: `flex: 1, maxWidth: 110, cursor: pointer`
- `colorSwatch`: `flex: 1, height: 44, borderRadius: 10` — полоса цвета во всю правую часть строки
- `colorInputHidden`: `opacity: 0, width: 0, height: 0` — клик по полосе открывает нативный пикер
- Та же структура применена к MaskCard (поле «Цвет»)

### WallCard — переопределение плитки
**Проблема:** `fontSize: 12, color: '#475569', border: 'none'` — не читается как действие.

**Решение:** Secondary button, полная ширина, иконка состояния.
- `overrideBtn`: `height: 40, borderRadius: 12, background: rgba(255,255,255,0.04), border: 1px solid rgba(255,255,255,0.1), color: #94a3b8, fontSize: 13, fontWeight: 500`
- Текст: «Параметры плитки стены» (короче, понятнее)
- Иконка состояния `▾/▴` слева

### SummarySection
**Проблема:** числовые `<th>` были `textAlign: left`, данные — `textAlign: right` → разрыв.

**Решение:** добавлен стиль `thNum` (`textAlign: right`) для колонок «Колонок», «Рядов», «Плиток».
Добавлен `fontVariantNumeric: 'tabular-nums'` для `tdNum` — числа не прыгают при обновлении.

### WallCard — удаление стены
**Проблема:** `padding: '3px 8px'` (~20px зона тапа), нет подтверждения.

**Решение:** двухшаговый inline-confirm:
- `delBtn`: круглая иконка-кнопка 44×44, `borderRadius: 50%` — соответствует touch target
- После первого тапа: `deleteConfirm=true` → в header появляются «Удалить?» + [Да] (danger) + [Нет] (ghost)
- `useEffect` + `setTimeout(3000)` автоматически сбрасывает через 3 секунды
- Кнопка [Нет] сбрасывает вручную

### MaskCard
**Проблема:** 5 полей в одном flex-ряду — overflow, шрифт 11px, нечитаемо.

**Решение:** вертикальный layout (option 1) — каждое поле на отдельной строке:
- `row`: `display: flex, alignItems: center, gap: 8`
- `fieldLabel`: `flex: 1, fontSize: 13, fontWeight: 500` — label слева, растягивается
- `numInput`: `width: 84, height: 40, borderRadius: 8` — input фиксирован справа + единица
- Поле «Цвет» — та же colorSwatch структура что в TileForm

Карточка маски теперь: `background: #141820` (Surface 2), `borderRadius: 12`.

### Общее — токены дизайн-системы
Применено ко всем компонентам Комнаты:
- **Фон страницы:** `#08080f`
- **Карточки (WallCard):** `background: #0e1018` — убран `backdropFilter: blur(12px)`
- **Карточки радиус:** 14px → 16px
- **Вложенные секции:** `background: #141820` (overrideBlock, MaskCard)
- **Инпуты:** `height: 44, borderRadius: 10, boxSizing: border-box`
- **Заголовки секций:** 15px/700 → 18px/600
- **Кнопка «+ Добавить стену»:** radius 10 → 12px, height 48px, inset highlight
- **Box-shadow карточек:** `inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)`
- **Границы:** unified `rgba(255,255,255,0.07)` / `0.1` / `0.12`
- **Warning color:** унифицирован на `#f59e0b` (было `#fbbf24`)

### Контекст для следующей сессии 1.3
Дизайн-система 1.1 (Dark Glow) применена к вкладке **Комната**: все 6 компонентов обновлены.
Токены: фон #08080f, карточки #0e1018 solid (без blur), вложенные секции #141820, акцент #7c3aed/#a78bfa, инпуты height:44/radius:10, заголовки 18/600, кнопки radius:12.

Задача 1.3 — применить те же токены к вкладке **Фото** и исправить визуальные баги:
- Дублирование кнопок «+ Фото» / «+ Добавить фото»
- «Пикселизировать» активна без фото — отключить
- Дублирование ViewModeControl (глазик + сегментированный переключатель)
- Панель настроек скроллится вместо растяжки на всё место
- Сетка разноцветная (скатерть-эффект) — сделать монохромной
- WallSelectSheet и WallsSheet перекрываются нижним таббаром

---

## Сессия 1.3 — Фото UI ✅

### Дублирование кнопок — решение
Убрать `<button>+ Добавить фото</button>` из `EmptyPhotos` (ControlsPane.jsx, строки 76-78).
Единственный триггер — кнопка `+ Фото` в ActionBar.
В `EmptyPhotos` заменить кнопку на hint-текст: «Нажмите **+ Фото** внизу, чтобы добавить снимок» (жирный текст — выделяет label кнопки, сохраняет discoverability без дублирования действия).

### "Пикселизировать" disabled-состояние
Применить `opacity: 0.38` к кнопке `primary` в ActionBar, когда `!hasPhotos`.
Форма, цвет, позиция — не меняются. Стандартный Material Design disabled-паттерн: кнопка выглядит как "есть, но неактивна", а не сломана.
При tap — Toast остаётся (уже реализован).
Изменение: в `ActionBar.jsx` добавить к стилю primary → `opacity: hasPhotos ? 1 : 0.38`.

### ViewModeControl — оставляем
Оставить **только сегментированный переключатель** в ControlsPane (ViewModeControl). Убрать глазик-кнопку из PhotoPanorama в режиме navigate с фото.

Почему сегментированный лучше: он показывает все варианты одновременно, пользователь видит текущее состояние и куда можно переключиться. Глазик-цикл — слепое переключение без контекста.

Исключение: в режиме `transform` ControlsPane показывает TransformPane (без ViewModeControl) — глазик там нужен. Реализация: передать в PhotoPanorama проп `hideEye={uiMode === 'navigate' && hasPhotos}`, скрыть кнопку по условию.

### TransformPane — compact layout
Убрать section headers («Позиционирование», «Коррекция»), заменить тонким разделителем. Убрать `overflowY: auto` — панель не скроллится.

```
┌──────────────────────────────────────┐
│ Сдвиг X  [ ______ ]  Сдвиг Y  [ ______ ] │  ← 2-col grid, input h:36px
│ Масштаб         [ ________________ ] │  ← full width input
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤  ← hr: 1px rgba(255,255,255,0.06)
│ Прозрачность  ━━━━━━━━━━━━━━  85%   │  ← range row h:32px
│ Яркость       ━━━━━━━━━━━━━━ 100%   │
│ Контраст      ━━━━━━━━━━━━━━ 100%   │
│ Насыщенность  ━━━━━━━━━━━━━━ 100%   │
└──────────────────────────────────────┘
```

Изменения в `ControlsPane.jsx`:
- `numInput` height: 40 → 36px, padding: `6px 8px`
- `fieldLabel` fontSize: 11 → 10px, marginBottom: 4 → 2px
- `transformGrid` gap: 10 → 8px, paddingBottom: 12 → 8px
- `correctionGrid` gap: 10 → 6px, paddingBottom: 12 → 8px
- `s.root` (`TransformPane`): убрать `overflowY: 'auto'`, заменить на `overflow: 'hidden'`
- Заменить оба `<div style={s.sectionHeader}>` на `<hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 16px' }} />`
- Убрать `<p style={s.gestureHint}>` (см. п. Gesture hint)

Итоговая высота блока ≈ 280px — влезает в нижнюю половину (60vh − 60px ActionBar = ~340px на iPhone 14).

### Bottom sheets — safe area решение
Проблема: `.bottom-nav` — flex-child (~57px + `env(safe-area-inset-bottom)`), НЕ fixed-позиционирован. Оба sheet — `position: fixed, bottom: 0`. Если sheet перекрывает nav по z-index — это правильное поведение (стандарт iOS/Android). Если nav рендерится поверх sheet — z-index баг.

Надёжное решение:
1. В `App.css` добавить к `.bottom-nav` → `position: relative; z-index: 50;`
2. Убедиться: WallSelectSheet `z-index: 200`, WallsSheet overlay `z-index: 300` — оба выше 50. ✓
3. WallSelectSheet `.actions` — уже имеет `paddingBottom: calc(12px + env(safe-area-inset-bottom, 0px))`. Достаточно, т.к. sheet перекрывает nav целиком.
4. WallsSheet `.sheet` — аналогично имеет `paddingBottom: calc(20px + env(safe-area-inset-bottom, 0px))`. ✓

Backdrop-filter на nav создаёт stacking context — добавление явного `z-index: 50` устраняет неоднозначность во всех браузерах.

### Panorama empty state
Сохранить сетку стен (даёт контекст «куда пойдёт фото»). Добавить centered overlay поверх панорамы, visible только при `!hasPhotos && uiMode === 'navigate'`:

```jsx
<div style={{
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  pointerEvents: 'none', gap: 8,
}}>
  {/* иконка Camera 28px, opacity 0.25, color #818cf8 */}
  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', textAlign: 'center' }}>
    Нажмите <strong style={{ color: '#818cf8' }}>+ Фото</strong> внизу,<br/>
    чтобы наложить снимок
  </p>
</div>
```

Добавить в `PhotoPanorama.jsx`, внутри `<div style={s.container}>`, рядом с eyeBtn.

### Сетка — что исправить
Причина «скатерти»: дробные пиксели. `tileW_mm * canvasScale` и `groutW_mm * canvasScale` — нецелые числа. Canvas рисует `fillRect` с дробными координатами + anti-aliasing → полупрозрачные пиксели на краях плиток. Накапливаясь по всей сетке, дают чередующийся светлый/тёмный паттерн.

**Кодеру — что исправить:**

В `pixelizerRenderer.js`, функция `drawWallPhoto`, блок рисования сетки (≈строки 56-84):
```js
// БЫЛО:
const tileWpx = tileW_mm * canvasScale
const tileHpx = tileH_mm * canvasScale
const groutPx = Math.max(1, groutW_mm * canvasScale)

// СТАЛО:
const tileWpx = Math.round(tileW_mm * canvasScale)
const tileHpx = Math.round(tileH_mm * canvasScale)
const groutPx  = Math.max(1, Math.round(groutW_mm * canvasScale))
```

И все `ctx.fillRect(col * stepX + tileWpx, ...)` и `ctx.fillRect(0, row * stepY + tileHpx, ...)`:
```js
ctx.fillRect(Math.round(col * stepX + tileWpx), 0, groutPx, H)
ctx.fillRect(0, Math.round(row * stepY + tileHpx), W, groutPx)
```

Аналогично в `pixelizerGeometry.js`, функция `tileRect()` — все возвращаемые значения `x, y, w, h` обернуть в `Math.round()`.

### Gesture hint
Хинт «Жест 1 пальца — двигать фото · пинч — масштабировать» — функция НЕ реализована. Пользователь пробует жест, ничего не происходит — негативный UX.

**Решение: убрать хинт полностью.** Числовые поля самоочевидны (label + input). Когда gesture-transform будет реализован — вернуть хинт с актуальным описанием.
Удалить из `ControlsPane.jsx`: строку `<p style={s.gestureHint}>...</p>` и стиль `gestureHint` из объекта `s`.

### Контекст для следующей сессии 1.4
Дизайн-система Dark Glow применена к вкладкам Комната (сессия 1.2) и Фото (сессия 1.3). Токены: фон #08080f, карточки #0e1018 solid, акцент #7c3aed/#a78bfa, инпуты h:44/radius:10, кнопки radius:12.

Вкладка Фото (PixelizerTab) имеет State Machine: navigate / addPhoto / transform. Панорама — react-zoom-pan-pinch (весь мир), canvasScale масштабирует px↔mm. Три canvas-режима: photo, photo+grid, grid-only, mosaic (через renderParams). Пикселизация: sampleWallColors → setTileColors → drawWallMosaic.

Задача 1.4 — применить дизайн-систему к вкладке **3D** (ViewerTab) и исправить баги:
- Камера смотрит снаружи → переместить внутрь комнаты
- Текстура зеркалится на внешнюю сторону → side: BackSide или отдельные плоскости
- Освещение снаружи, изнутри темно → добавить pointLight / ambientLight внутри
- Стены PlaneGeometry без толщины → добавить BoxGeometry (минимальная толщина)
- Нет сетки пола, нет UI-оверлеев управления камерой

---

## Сессия 1.4 — 3D UI ✅

### Камера по умолчанию
Вид C — orbit снаружи комнаты, стартовая позиция с угла (видны 2 стены).
```
position: [cx + dist*0.7, cy + dist*0.5, cz + dist*0.7]
target:   [cx, H/2, cz]
fov: 55°
near: 1, far: camDist*12
```
Где `dist = Math.max(totalSpan * 0.9, maxHeight * 2.5, 400)` — уже вычислен в ViewerTab.

### Управление камерой
```
enableDamping: true
dampingFactor: 0.05
rotateSpeed:   0.6       ← спокойнее, меньше "дикость" при близком приближении
zoomSpeed:     0.8
minDistance:   50
maxDistance:   camDist * 3
minPolarAngle: 0
maxPolarAngle: Math.PI   ← без ограничений, можно смотреть снизу
enablePan:     true
```
**Smart pivot (двойной тап):** raycast по сцене → обновить `orbitControls.target` → `invalidate()`.
Реализация: ref на OrbitControls, обработчик `onDoubleClick` на Canvas, `raycaster.setFromCamera`.

### Сетка пола
Два слоя GridHelper, позиция y=0:

| Слой | size | divisions | шаг | colorCenter | colorGrid |
|---|---|---|---|---|---|
| Крупный (1м) | 20000 | 20 | 1000мм | `#3a3f52` | `#252b3b` |
| Мелкий (100мм) | 20000 | 200 | 100мм | `#1e2435` | `#181d2b` |

Blender-стиль: почти невидимые линии, не мешают плитке. Сетка 20×20 метров — перекрывает любую ванную/кухню.

### Толщина стен
100мм → `<boxGeometry args={[L, H, 100]}/>`.
Материал плитки — только на `front face` (materialIndex 4 у BoxGeometry: +Z face = внутренняя сторона).
Остальные грани: нейтральный тёмный цвет `#1e293b`.

### Освещение
Убрать `<directionalLight>` (освещает снаружи, изнутри темно).
Добавить:
```jsx
<ambientLight intensity={0.5} />
<pointLight position={[cx, H*0.95, cz]} intensity={1.2} color="#fffaf0" />
<hemisphereLight skyColor="#e0e7ff" groundColor="#1e1b2e" intensity={0.4} />
```
`hemisphereLight` — мягкий ambient gradient (небо/пол), даёт "живость" без HDR и нагрузки.
`cx, cz` = центр комнаты (из `computeWallPositions`), `H` = maxHeight.

### UI-оверлеи
**Верхняя панель управления** (занимает полосу сверху, НЕ плавающие кнопки):

```
┌─────────────────────────────────────┐  ← safe area top
│ [↩]              [Спереди][Сверху][ISO] │  48px, background #0e1018
├──────────────────────────────────────┤  ← border-bottom 1px rgba(255,255,255,0.07)
│                                      │
│           3D CANVAS                  │
│        (OrbitControls + grid)        │
│                                      │
│   «Вращайте 1 пальцем               │
│    Масштаб — 2 пальца»              │  ← gesture hint, только 1й раз, 4 сек
└─────────────────────────────────────┘  ← tabbar
```

**Кнопка Reset** (слева): иконка `RotateCcw` (Lucide 20px), hit area 44×44.
**Переключатели вида** (справа): 3 кнопки в ряд — «F» / «T» / «ISO». Активная: `background: rgba(124,58,237,0.25)` + `border: 1px solid #7c3aed`.
**Gesture hint**: centered overlay внизу canvas, показывается 1 раз (localStorage флаг `drape_3d_hint_shown`), исчезает через 4 сек, `pointerEvents: none`.

### Стиль оверлеев
Solid-карточка, без blur (экономия батареи на слабых телефонах):
```css
background: #0e1018
border-bottom: 1px solid rgba(255,255,255,0.07)  /* для toolbar */
border-radius: 10px  /* для отдельных кнопок */
color: #f1f5f9
```
Соответствует карточкам вкладок Комната и Фото — единый стиль.

### Контекст для следующей сессии 1.5
Дизайн-система Dark Glow применена к вкладкам Комната (1.2), Фото (1.3), 3D (1.4).

Вкладка 3D (ViewerTab / RoomScene / WallMesh) использует Three.js / React Three Fiber.
Текущие баги: камера снаружи, PlaneGeometry без толщины, directionalLight снаружи, нет сетки и UI.

**Что реализовать в коде (сессия 1.5):**

1. **WallMesh.jsx**: PlaneGeometry → BoxGeometry(L, H, 100). Front face (materialIndex 4) = плитка, остальные грани = `#1e293b`. Убрать `DoubleSide`.

2. **ViewerTab.jsx — камера**: позиция `[cx + dist*0.7, cy + dist*0.5, cz + dist*0.7]`, target `[cx, H/2, cz]`.

3. **ViewerTab.jsx — OrbitControls**: добавить `enableDamping dampingFactor={0.05} rotateSpeed={0.6} zoomSpeed={0.8} maxDistance={camDist*3}`. Smart pivot: ref на OrbitControls, `onDoubleClick` на Canvas → raycast → update target → invalidate().

4. **RoomScene.jsx — сетка**: два `<gridHelper>` — крупный (size=20000, div=20, colors #3a3f52/#252b3b) + мелкий (size=20000, div=200, colors #1e2435/#181d2b). Position y=0.

5. **RoomScene.jsx — освещение**: убрать `<directionalLight>`, добавить `<pointLight position={[cx, H*0.95, cz]} intensity={1.2} color="#fffaf0"/>` + `<hemisphereLight skyColor="#e0e7ff" groundColor="#1e1b2e" intensity={0.4}/>`.

6. **ViewerTab.jsx — toolbar**: `<div>` 48px поверх Canvas (flex row), background #0e1018, border-bottom. Reset кнопка слева (RotateCcw, 44×44). Три кнопки вида справа (Front/Top/ISO). Gesture hint — centered overlay внизу canvas, localStorage флаг `drape_3d_hint_shown`, 4 сек auto-dismiss.

7. **ViewerTab.jsx — background**: `#08080f` вместо `#0f172a` (дизайн-система).

---

## Сессия 1.5 — Онбординг ✅

### Пустое состояние Комнаты

Два дополнения к существующей форме (TileForm не трогается — всегда видна):

**A. Мини-флоу (flow strip)** — горизонтальная строка над TileForm, видна только при `walls.length === 0`:
```
Комната → Фото → 3D → Схема → Укладка
```
Текущий шаг (Комната) — `#a78bfa`/600, остальные — `#334155`. Шрифт 10px.
Исчезает после добавления первой стены. Даёт весь контекст flow с первого взгляда.

**B. Улучшенный empty hint** (заменяет текущий серый текст):
- Иконка `LayoutGrid` 28px, `#818cf8`, opacity 0.3
- «Стен пока нет» — 15px, `#94a3b8`
- «Нажмите "Добавить стену" ниже» — 13px, `#64748b`

### Пустые состояния Фото и 3D

Унифицированный компонент `EmptyState({ icon, title, subtitle, onAction, actionLabel })`.
Стиль: `position: absolute, inset: 0`, flexColumn, center, gap 12px, padding 32px.

**Фото — нет стен (`walls.length === 0`):**
- Иконка `Camera` 32px, `#818cf8`, opacity 0.5
- «Сначала добавь стены» — 15px, `#94a3b8`
- «Фото накладывается только когда есть стена с размерами» — 12px, `#64748b`, max-width 240px, text-center
- Кнопка [→ Перейти в Комнату] (secondary, h:40) → `setActiveTab('room')`

**Фото — стены есть, фото нет:** дизайн сессии 1.3 без изменений (Camera иконка + overlay-хинт над панорамой).

**3D — нет стен с размерами** (заменяет текущий одинокий `<p>`):
- Иконка `Box` 32px, `#818cf8`, opacity 0.5
- «Нет стен для 3D-просмотра» — 15px, `#94a3b8`
- «Заполните длину и высоту хотя бы одной стены» — 12px, `#64748b`
- Кнопка [→ Перейти в Комнату] (secondary, h:40) → `setActiveTab('room')`

### Заглушки Схема/Укладка

Вместо «Раздел появится в этапе N» — **tease-карточка**: иконка + бейдж «В разработке» + CSS-вайрфрейм-превью + 3 bullet-фичи.

**Схема (ExportTab.jsx):**
- Иконка `PenLine` 36px, `#818cf8`, opacity 0.4
- «Схема укладки» — 18px/600, `#f1f5f9`
- Бейдж «В разработке» — pill, `bg rgba(124,58,237,0.15)`, `text #a78bfa`, 11px
- CSS тайловая сетка 5×4 — border `rgba(255,255,255,0.06)`, один тайл подсвечен `rgba(124,58,237,0.2)`
- Фичи (12px, `#64748b`): «Экспорт схемы для мастера», «Разметка с порезами», «PDF + PNG»

**Укладка (LayoutTab.jsx):**
- Иконка `Grid3x3` 36px, `#818cf8`, opacity 0.4
- «План покупки» — 18px/600
- Бейдж «В разработке»
- CSS мини-таблица: строки «Стена 1 / 48», «Стена 2 / 32», «Итого +10% / 88»
- Фичи: «Подсчёт плитки по стенам», «Запас на бой (+10%)», «Список для магазина»

Стиль вайрфрейм-блоков: `background: #0e1018, border: 1px solid rgba(255,255,255,0.06), borderRadius: 8px, padding: 8px`.

### Прогресс-индикатор

**Не нужен.** Нижний таббар уже является прогресс-индикатором — 5 вкладок стоят в правильном порядке слева направо. Дублировать — визуальный шум.

Единственное изменение таббара: вкладки-заглушки (Схема, Укладка) — мутный текст `#475569` вместо `#94a3b8` (сигнал: здесь пока нечего делать).

Flow strip в Комнате достаточно для ориентации новичка.

### Индикатор автосохранения

**Компонент `SavedToast`** — глобальный, живёт в `App.jsx` над `<nav>`.

- Триггер: 1.5 сек debounce после любого изменения в store
- Продолжительность: виден 2 сек, затем fade out
- Вид: pill «✓ Сохранено»
- `position: fixed, bottom: calc(57px + env(safe-area-inset-bottom, 0px) + 8px), right: 16px`
- `background: rgba(34,197,94,0.12)` + `border: 1px solid rgba(34,197,94,0.25)`
- `color: #22c55e`, fontSize 11px, fontWeight 500, padding 4px 10px, borderRadius 20px
- Анимация: `opacity` transition 200ms ease-in-out
- Показывается только на вкладках room/pixelizer/viewer (заглушки не изменяются)

### Анимации переходов между вкладками

**Fade-in при входе, 150ms. Выход — мгновенный.**

Обоснование: 3D вкладка при `display:none` останавливает render-loop Three.js (экономия батареи). Замена на `opacity/visibility` заставит Canvas рендерить в фоне — недопустимо. Поэтому выход всегда мгновенный, вход — плавный fade.

```css
/* App.css */
.tab-panel[data-visible="true"] {
  animation: tabFadeIn 150ms ease-out both;
}
@keyframes tabFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```
В App.jsx добавить `data-visible={activeTab === tab.id}` на каждый panel.

### ИТОГ ФАЗЫ 1 — Готово к реализации

Все дизайн-решения зафиксированы. Фаза 2 (код) может начинаться.

Полная система:
- Дизайн-система Dark Glow (сессия 1.1)
- Вкладка Комната UI (сессия 1.2)
- Вкладка Фото UI (сессия 1.3)
- Вкладка 3D UI (сессия 1.4)
- Онбординг и пустые состояния (сессия 1.5)

### Контекст для следующей сессии 2.1

```
Прочитай файл docs/sessions/state.md — там полный контекст проекта.

Ты опытный React-разработчик. Реализуешь задачи фазы 2 (код) для мобильного PWA Drape.
Дизайн-система: Dark Glow (фон #08080f, карточки #0e1018 solid, акцент #7c3aed/#a78bfa, blur только на nav/sheets).

Приоритетный порядок реализации сессии 2.1:

1. **SavedToast** (App.jsx) — глобальный компонент автосохранения. Zustand subscribe + debounce 1500ms → pill «✓ Сохранено» fixed bottom-right над navbar, opacity transition 200ms, виден 2с. Только на вкладках room/pixelizer/viewer.

2. **EmptyState компонент** (src/components/shared/EmptyState.jsx) — унифицированный: icon + title + subtitle + actionLabel + onAction. Применить в ViewerTab.jsx (заменить <p> на EmptyState с кнопкой → room) и PixelizerTab.jsx (walls.length === 0 → EmptyState с кнопкой → room).

3. **Tab fade-in** (App.css + App.jsx) — data-visible атрибут + @keyframes tabFadeIn 150ms ease-out. Выход мгновенный (display:none остаётся).

4. **ExportTab и LayoutTab** — tease-карточки с иконкой, бейджем «В разработке», CSS wireframe-превью и bullet-фичами. Детали в сессии 1.5.

5. **RoomTab — flow strip + улучшенный empty hint** — мини-флоу над TileForm при walls.length===0, улучшенный empty state вместо серого текста.

6. **Таббар — стиль заглушек** — текст Схема/Укладка в цвет #475569 (мутнее остальных).

Изменять логику store, пикселизатор, 3D-рендер — НЕ нужно. Только UI.
```

---

## Сессия 2.1 — Баги Фото ✅

### П1 — Режим трансформации (жесты)
Touch-обработчики добавлены на canvas активного фото в `WallCanvas.jsx`. Однопальцевый жест — пан (обновляет offsetX_mm/offsetY_mm), два пальца — масштаб. Мировая навигация (TransformWrapper) продолжает работать вне canvas активного фото. `worldScale` отслеживается в `PhotoPanorama` через `onTransform` и передаётся вниз по цепочке. Стабильные колбэки через `useCallback` в `PixelizerTab`.
Файлы: `PixelizerTab.jsx`, `PhotoPanorama.jsx`, `WallCanvas.jsx`.

### П2 — Яркость/Контраст/Насыщенность
Фильтры уже были реализованы в `pixelizerRenderer.js` и `pixelizerSampler.js` — код присутствовал до начала сессии. Изменений не потребовалось, верификация подтвердила корректность.

### П3 — Числовые поля (сломанный ввод)
`Field` компонент в `ControlsPane.jsx` переписан на uncontrolled паттерн: локальный строковый state `localVal`, `onChange` обновляет только строку, `onBlur` фиксирует значение с парсингом и clamp. Нажатие Enter вызывает blur.
Файл: `ControlsPane.jsx`.

### П4 — iOS leading zero ("050")
Решено совместно с П3: `type="number"` заменён на `type="text" inputMode="decimal"`.
Файл: `ControlsPane.jsx`.

### П5 — Отрицательный сдвиг
Подтверждено: offsetX_mm и offsetY_mm передавались без `min=` ограничений и до исправлений — изменений не потребовалось. Negative values работают корректно после перехода на text input.

### П6 — Floor anchor (выравнивание плиток снизу)
Добавлена функция `floorAnchorStartY(H, rows, tileH_mm, groutW_mm, canvasScale)` в `pixelizerRenderer.js`. Все Y-координаты плиток смещены на `startY = H - rows * stepY`. `isFullyInsideMask` получил параметр `tileStartY_mm` для корректного пересечения маска-плитка. Аналогичные изменения в `drawWallMosaic` и `pixelizerSampler.js`.
Файлы: `pixelizerGeometry.js`, `pixelizerGeometry.test.js`, `pixelizerRenderer.js`, `pixelizerSampler.js`.

### П7 — Качество изображения
`ctx.imageSmoothingEnabled = true` и `ctx.imageSmoothingQuality = 'high'` добавлены перед `drawImage` в `drawWallPhoto`.
Файл: `pixelizerRenderer.js`.

### Тесты
45 тестов, все зелёные. Новый тест для `isFullyInsideMask` с `tileStartY_mm` проверяет оба режима (обратная совместимость + floor anchor).

### Что НЕ удалось / остаток
- П1 (жесты) работает только при тапе на canvas активного фото. Если пользователь хочет прокрутить панораму в режиме transform — возможно через другие стены или фоновую область.
- Все остальные баги сессии 2.1 реализованы и проверены двухэтапным ревью.

### Коммиты
- `3c314e6` — П7 image quality
- `fa0c0cf` — П3+П4+П5 Field input
- `588ec9c` — П6 floor anchor
- `bbda4b0` — П1 gesture transform
- `71cfbdd` — quality fix: useCallback + passive comment

### Контекст для следующей сессии 2.2

Вкладка Фото исправлена. Следующий блок — переработка вкладки **«3D»**.

⚠️ Задачи сессии 2.2 определены в `docs/sessions/prompts/2.2-3d-overhaul.md` — использовать его, а не этот раздел. UI-задачи (SavedToast, EmptyState, анимации) покрываются сессиями 2.4 и 2.5.

---

## Сессия 2.2 — 3D Переработка ✅

### З1 — Камера
ISO вид с угла: `position: [cx + camDist*0.7, maxHeight/2 + camDist*0.5, cz + camDist*0.7]`, `target: [cx, maxHeight/2, cz]`, fov: 55°.
`camDist = Math.max(totalSpan * 0.9, maxHeight * 2.5, 400)`. Canvas пересоздаётся через `canvasKey` при смене стен.

### З2 — Объёмные стены
`BoxGeometry([L, H, 10])` (10 units = 100мм). materialIndex 4 (+Z face) = tile texture. Остальные 5 граней = `#1e293b`. MaskOverlay z-offset: 5.5.

### З3 — Пол
Два `GridHelper` через `useMemo` в RoomScene:
- Крупный: size=20000, div=20, colors `#3a3f52`/`#252b3b`
- Мелкий: size=20000, div=200, colors `#1e2435`/`#181d2b`

### З4 — Освещение
`ambientLight intensity={0.5}` + `pointLight [cx, maxH*0.95, cz] intensity=1.2 color="#fffaf0"` + `hemisphereLight args={['#e0e7ff','#1e1b2e',0.4]}`. `directionalLight` удалён.

### З5 — UI-оверлеи
`ViewerToolbar.jsx`: position:absolute, toolbar 48px + gesture hint (localStorage `drape_3d_hint_shown`, 4с). `CameraRig.jsx`: forwardRef, reset()/setView(), smart pivot через `gl.domElement.addEventListener('dblclick')`.

### З6 — OrbitControls
`enableDamping dampingFactor=0.05`, `rotateSpeed=0.6`, `zoomSpeed=0.8`, `minDistance=50`, `maxDistance=camDist*3`, `minPolarAngle=0`, `maxPolarAngle=Math.PI`. Smart pivot: double-click refocuses target on hit point.

### Что НЕ удалось
Всё запланированное выполнено. UI-задачи (SavedToast, EmptyState shared component, tab fade-in, tease-карточки, flow strip) перенесены в сессию 2.3.

### Промпт для следующей сессии 2.3

```
Прочитай docs/sessions/state.md — там полный контекст проекта и итоги сессий 1.x и 2.x.

Выполнены: Комната UI (1.2), Фото UI (1.3), 3D UI (1.4+2.2), баги Фото (2.1).

Следующий блок — UI-задачи, запланированные в сессии 1.5:
1. **SavedToast** (App.jsx) — pill «✓ Сохранено», Zustand subscribe + debounce 1500ms, fixed bottom-right над navbar.
2. **EmptyState компонент** (src/components/shared/EmptyState.jsx) — унифицированный icon+title+subtitle+button. Применить в ViewerTab и PixelizerTab.
3. **Tab fade-in** (App.css + App.jsx) — data-visible + @keyframes tabFadeIn 150ms. Выход мгновенный.
4. **ExportTab + LayoutTab** — tease-карточки с wireframe-превью и bullet-фичами (детали в сессии 1.5).
5. **RoomTab** — flow strip + улучшенный empty hint при walls.length===0.
6. **Таббар** — Схема/Укладка цвет #475569 (мутнее активных вкладок).
```

---

## Сессия 2.3 — [ОЖИДАЕТ ВЫПОЛНЕНИЯ]

*Результаты будут записаны сюда после завершения сессии.*

---

## Сессия 2.4 — [ОЖИДАЕТ ВЫПОЛНЕНИЯ]

*Результаты будут записаны сюда после завершения сессии.*

---

## Сессия 2.5 — [ОЖИДАЕТ ВЫПОЛНЕНИЯ]

*Результаты будут записаны сюда после завершения сессии.*
