# Drape — Состояние дизайн-сессий

> Этот файл читает каждая новая сессия перед началом работы.
> Каждая сессия дописывает свой блок в конец.
>
> **Дизайн-система Dark Glow зафиксирована в сессии 1.1 этого файла — это единственный авторитетный источник токенов, типографики, радиусов и компонентов. Все новые разделы должны опираться на него, не переизобретая.**

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

## Сессия 2.3 — Комната Полировка ✅

### CSS-переменные

Добавлены в `src/App.css` блок `:root`:
```
--bg, --surface-1, --surface-2, --surface-overlay
--accent, --accent-light, --accent-glow
--text-primary, --text-secondary, --text-hint, --text-disabled
--border, --border-strong, --border-focus
--error, --success, --warning
--radius-card, --radius-btn, --radius-input
```

### Изменённые файлы
- `src/App.css` — З1: `:root` CSS-переменные, З7: gap + stub-вкладки
- `src/App.jsx` — З7: иконки Lucide в навбаре (LayoutGrid / Camera / Box / PenLine / Grid3x3)
- `src/components/room/TileForm.jsx` — З3: maxWidth убран с colorLabel, З8: валидация > 0
- `src/components/room/WallCard.jsx` — З8: валидация > 0, З9: scrollIntoView после addMask

### Что НЕ выполнялось (уже было в 1.2)
- З2 CornersSection layout — выполнено в сессии 1.2
- З4 WallCard override btn — выполнено в сессии 1.2
- З5 SummarySection grid — выполнено в сессии 1.2
- З6 WallCard удаление с confirm — выполнено в сессии 1.2

### Что НЕ удалось
- Inline-стили компонентов не переведены на `var(--token)` — рефакторинг для отдельной сессии

### Контекст для следующей сессии 2.4
CSS-переменные определены в `:root`, иконки в навбаре работают. Вкладки Комната, Фото, 3D — полностью отполированы.

Следующий блок — UI-задачи, запланированные в сессии 1.5 (перенесены через 2.2 → 2.3 → 2.4):
1. **SavedToast** (App.jsx) — pill «✓ Сохранено», Zustand subscribe + debounce 1500ms, fixed bottom-right над navbar.
2. **EmptyState компонент** (src/components/shared/EmptyState.jsx) — унифицированный icon+title+subtitle+button. Применить в ViewerTab и PixelizerTab.
3. **Tab fade-in** (App.css + App.jsx) — data-visible + @keyframes tabFadeIn 150ms. Выход мгновенный.
4. **ExportTab + LayoutTab** — tease-карточки с wireframe-превью и bullet-фичами (детали в сессии 1.5).
5. **RoomTab** — flow strip + улучшенный empty hint при walls.length===0.

---

## Сессия 2.4 — Анимации ✅

### Библиотека
CSS transitions + @keyframes (без зависимостей). Framer Motion не нужен — все анимации простые (fade, slide, scale).

### Реализованные анимации
- WallCard: slide-down при mount, slide-up перед удалением (leaving state + setTimeout 190ms)
- MaskCard: то же самое
- Bottom sheets (WallSelectSheet, WallsSheet): slide-up вход, slide-down выход (leaving + setTimeout 200ms)
- Tab panels: fade-in 150ms при входе, мгновенный выход (display:none — Three.js батарея)
- Pixelize кнопка: CSS спиннер через ::after при sampling=true, текст «Обрабатываю…»
- Delete кнопка (ActionBar): red flash при tap

### prefers-reduced-motion
Один блок `@media (prefers-reduced-motion: reduce)` в конце `src/animations.css` — обнуляет все animation-duration и transition-duration до 0.01ms.

### Что НЕ удалось
- PhotoSheet: exit анимация не добавлена (не упомянута явно в промпте)
- «+ Добавить стену» tap feedback: оставлен (TileForm не трогался)

### Контекст для следующей сессии 2.5
CSS анимации в `src/animations.css`. Tab fade-in работает через `data-visible` атрибут на `.tab-panel`. Финальная сессия 2.5 — онбординг и пустые состояния: SavedToast, EmptyState, tease-карточки Схема/Укладка, flow strip в Комнате.

---

## Сессия 2.5 — Онбординг ✅

### Реализованные пустые состояния

- **Комната** (`RoomTab.jsx`): flow strip при `walls.length === 0` — горизонтальная строка «Комната → Фото → 3D → Схема → Укладка», текущий шаг `#a78bfa`/600, остальные `#334155`. Исчезает после добавления первой стены. Ниже — улучшенный empty hint: иконка `LayoutGrid` 28px + «Стен пока нет» + «Нажмите «Добавить стену» ниже»
- **Фото** (`PixelizerTab.jsx` → `EmptyNoWalls`): при `walls.length === 0` — компонент `EmptyState` с иконкой `Camera`, заголовком «Сначала добавь стены», subtitle и кнопкой `→ Перейти в Комнату` (`setActiveTab('room')`)
- **3D** (`ViewerTab.jsx`): при `activeWalls.length === 0` — `EmptyState` с иконкой `Box`, заголовком «Нет стен для 3D-просмотра», subtitle и кнопкой `→ Перейти в Комнату`
- **Схема** (`ExportTab.jsx`): tease-карточка — иконка `PenLine`, бейдж «В разработке», wireframe сетка 5×4 (один тайл подсвечен акцентом), три bullet-фичи
- **Укладка** (`LayoutTab.jsx`): tease-карточка — иконка `Grid3x3`, бейдж «В разработке», wireframe таблица с примером данных, три bullet-фичи

### Индикатор автосохранения

Реализован: `src/components/shared/SavedToast.jsx`. Zustand subscribe + debounce 1500ms → pill «✓ Сохранено» `position: fixed`, bottom-right над navbar, виден 2 сек, fade-out 200ms. Только на вкладках room/pixelizer/viewer.

### Прогресс-индикатор

Пропущен — нижний таббар из 5 вкладок уже является прогресс-индикатором. Дополнение: вкладки-заглушки (Схема, Укладка) получили цвет `#475569` (мутнее активных) через `data-stub` атрибут в App.jsx.

### Связи между вкладками (З6)

Компонент `src/components/shared/EmptyState.jsx` — унифицированный: `{icon, title, subtitle, actionLabel, onAction}`. Кнопка `→ Перейти в Комнату` через `setActiveTab('room')` реализована в ViewerTab и PixelizerTab (`EmptyNoWalls`).

---

## ФАЗА 2 ЗАВЕРШЕНА ✅

Все технические задачи выполнены. Проект готов к следующему этапу (Схема — этап 6).

---

## Сессия 3.1 — Схема UI: layout и развёртка ✅

### Split-screen
- Пропорции по умолчанию: **60/40** (верх — развёртка, низ — легенда)
- Разделитель: полоска h:32px, зона тапа 44px, три горизонтальные черточки 20px по центру, цвет `#475569`, gap 3px, radius 2px. Фон `rgba(255,255,255,0.04)`.
- Минимум верхней части: 30% контентной зоны (~170px на iPhone 14)
- Минимум нижней части: 25% (~140px)

### Развёртка стен
- Масштабирование: пропорционально реальным размерам. Самая высокая стена ≈ 80% высоты верхней части при начальном zoom.
- Зазор между стенами: 16px. В зазоре по центру — название стены.
- Название стены: **над стеной**, по центру зазора. «Стена N», 9px, `#64748b`, fontWeight 500.
- Маски-препятствия: затемнённый прямоугольник `rgba(8,8,15,0.75)` + диагональная SVG-штриховка `rgba(255,255,255,0.08)`.

### Плитки
- Номер цвета: **числовой индекс** (1, 2, 3…), по центру клетки.
- Цвет текста: авто-контраст (L < 50% → `#f1f5f9`, иначе → `#0f172a`).
- Шрифт: 8px monospace, фиксированный (не масштабируется с zoom).
- Скрытие номера: когда клетка на экране < 14px — номера исчезают (opacity transition 100ms).
- Цвет шва: `grout_color` из настроек стены/глобальный. Ширина = `grout_width_mm * canvasScale`, min 1px.

### Жесты и zoom
- Верхняя часть: `react-zoom-pan-pinch` (уже используется в Фото). Нижняя — обычный overflow-y scroll. Зоны независимы.
- Кнопка reset zoom: плавающий `[⊡]` в правом нижнем углу верхней части. Появляется только при zoom ≠ 1. Иконка `Maximize2` 16px, 36×36px, radius 8px, `rgba(14,16,24,0.85)` + border `rgba(255,255,255,0.1)`.

### Пустое состояние
- Нет `tileColors` совсем: centered overlay — иконка `Camera` 28px (`#818cf8`, opacity 0.4) + «Схема не готова» (15px/500, `#94a3b8`) + subtitle 12px + кнопка Secondary «→ Перейти в Фото» h:40.
- Есть `tileColors` только у части стен: показывать схему частично. Стены без пикселизации — overlay с диагональной штриховкой + «Не пикселизировано».

### Toolbar и кнопка экспорта
- Toolbar сверху — **нет** (экономия места, split-screen и без того тесный).
- Кнопка «Скачать SVG»: в нижней части (легенда), в самом конце списка. Secondary button full-width h:48, иконка `Download` (Lucide) слева.

### Контекст для следующей сессии 3.2
Вкладка «Схема» — split-screen 60/40. Верх: react-zoom-pan-pinch, стены пропорционально реальным размерам, названия над стенами в зазоре 16px, маски — диагональная штриховка, номера плиток 8px monospace авто-контраст, скрываются < 14px, шов из настроек. Низ: прокручиваемая легенда, кнопка «Скачать SVG» в конце списка.

Задача 3.2 — шапка нижней части, поле «Запас %», строки легенды, диалог настроек SVG-экспорта, состояние загрузки.

---

## Сессия 3.2 — Схема UI: легенда и экспорт ✅

### Шапка нижней части
2 строки по 2 параметра, padding `12px 16px`, border-bottom `rgba(255,255,255,0.06)`:
- Строка 1: «75 × 150 мм» + «Шов: 2 мм»
- Строка 2: «Цвет шва: ■ #rrggbb» (квадратик 12×12 radius:3) + «3 стены, 2 маски»
- Labels: 10px `#64748b`, значения: 12px/500 `#94a3b8`

### Поле «Запас, %»
Степпер [−] [10%] [+] — отдельная строка между шапкой и легендой, padding `10px 16px`, border-bottom `rgba(255,255,255,0.06)`.
- Label «Запас на бой»: 13px/500, `#f1f5f9`
- Кнопки [−][+]: 32×32px, radius 8px, `rgba(255,255,255,0.06)`, border `rgba(255,255,255,0.08)`, иконки `Minus`/`Plus` 14px `#94a3b8`
- Значение: 13px/600, `#a78bfa`, min-width 40px, text-center
- Шаг 5%, диапазон 0–30%, default 10%

### Легенда и спецификация
Строка цвета: `■ N  #hex     X шт.  → Y шт.  ∨`
- Квадратик 20×20px, radius 4px, border `rgba(255,255,255,0.1)`
- Номер: 11px/600, `#a78bfa`
- Hex: 11px monospace, `#94a3b8`
- Количество: 12px/500, `#f1f5f9`, flex-right
- С запасом «→ Y шт.»: 12px, `#22c55e`, скрывается при запасе = 0
- Шеврон `ChevronDown/Up` 16px `#475569` — раскрытие разбивки по стенам
- Разбивка: отступ 28px, 11px `#64748b`, раскрывается по тапу (не сразу)
- Сортировка: по убыванию количества
- Разделитель между цветами: `border-bottom: 1px solid rgba(255,255,255,0.04)`

### Диалог экспорта SVG
Bottom sheet (как WallsSheet): `rgba(8,8,15,0.92)` + `backdrop-filter: blur(24px)`, border-radius `20px 20px 0 0`.
- Drag handle: 36×4px, `rgba(255,255,255,0.2)`, radius 2px
- Заголовок «Настройки экспорта»: 16px/600, `#f1f5f9`
- Секция «Масштаб»: карточка `#0e1018` radius 12px, два radio-варианта («На экран» / «Реальный размер 1:1»). Активный: чекмарк `#a78bfa`, текст `#f1f5f9`. Неактивный: `#94a3b8`.
- Секция «Швы»: toggle-switch «Рисовать швы». При grout_width = 0: disabled, opacity 0.38 + hint «Ширина шва = 0 — швы не нужны», 10px `#475569`.
- Primary button «↓ Скачать SVG» h:52, full width, `paddingBottom: calc(16px + env(safe-area-inset-bottom, 0px))`

### Состояние загрузки
Спиннер на кнопке (без overlay): кнопка → `opacity 0.7`, текст «Готовлю файл…», CSS-спиннер ::after (паттерн как у кнопки «Пикселизировать» из 2.4). Кнопка disabled. По готовности: sheet закрывается → скачивание.
Если > 3с: hint «Большой файл, ещё немного…» 10px `#64748b`, fade-in через 3с.

### Контекст для следующей сессии 3.3
Вкладка «Схема» полностью спроектирована (сессии 3.1 + 3.2). Все дизайн-решения зафиксированы.

Сессия 3.3 — реализация рендера развёртки: SchemaTab заменяет ExportTab, split-screen с drag-handle, react-zoom-pan-pinch в верхней части, рисование стен + плиток + масок на Canvas (или SVG-элементами), кнопка reset-zoom, пустое состояние.

Ключевые данные: `walls[]` (width_mm, height_mm, masks[]), `tileColors` (`wallId → { 'col_row': '#hex' }`), `tile` (tile_width, tile_height, grout_width, grout_color). Масштаб: самая высокая стена = 80% высоты верхней части при zoom=1. Шрифт номеров 8px monospace, скрывается при cellPx < 14.

---

## Сессия 3.3 — Схема: рендер развёртки ✅

### Реализованные файлы

**`src/utils/buildPalette.js`**
- `buildPalette(walls, tileColors)` — агрегирует цвета по всем стенам, сортирует по убыванию count. Возвращает `[{ index, hex, count, byWall }]`
- `withSurplus(count, surplusPercent)` — `Math.ceil(count + count * surplus/100)` (без float-артефактов)

**`src/utils/schemaRenderer.js`**
- `resolveWallTile(wall, globalTile)` — мёрджит tile_overrides с глобальными параметрами
- `contrastColor(hex)` — авто-контраст текста по luminance
- `buildSchemaLayout(walls, tile, availableH, opts)` — вычисляет позиции/размеры стен. Масштаб подбирается так чтобы самая высокая стена занимала `targetFill` от `availableH`
- `drawSchema(canvas, { walls, tile, tileColors, palette })` — рисует развёртку: шов как фон, плитки с цветами, номер в клетке при cellPx ≥ 14, маски с диагональной штриховкой, overlay «Не пикселизировано» на стенах без tileColors

**`src/utils/schemaRenderer.test.js`**
- 20 тестов: buildPalette, withSurplus, resolveWallTile, contrastColor, buildSchemaLayout
- Все 61 тест проекта зелёные

**`src/components/export/SchemaView.jsx`**
- `<canvas>` + `react-zoom-pan-pinch` (`TransformWrapper/TransformComponent`)
- Кнопка reset zoom (`Maximize2`) — появляется только при zoom ≠ 1
- `EmptyState` при `hasTileColors === false`
- `useEffect` перерисовывает canvas при изменении данных или высоты

**`src/components/export/ExportTab.jsx`** (обновлён)
- Split-screen: `<SchemaView>` 60% / drag-handle 4px / `<SchemaLegend>` 40%
- Drag-handle: pointer events, clamp MIN 30%/25%
- `palette` вычисляется через `useMemo(buildPalette)` как единый источник, передаётся в оба компонента

### Что НЕ удалось
- Canvas не знает точного CSS-размера до mount (ResizeObserver нужен в SchemaView — решено через `offsetWidth/offsetHeight` при каждом эффекте)

### Контекст для следующей сессии 3.4
Развёртка работает. ExportTab — split-screen с drag-handle. palette = buildPalette(walls, tileColors) вычисляется в ExportTab.
Сессия 3.4 — SchemaLegend: шапка параметров, степпер запаса, список цветов с разбивкой по стенам, кнопка «Скачать SVG».

---

## Сессия 3.4 — Схема: легенда и спецификация ✅

### Реализованные файлы

**`src/components/export/SchemaLegend.jsx`**
- Шапка: 2 строки — «Плитка W×H мм / Шов G мм» + «Цвет шва ■ #hex / N ст., M маск.»
- Степпер запаса: кнопки [−][+] шаг 5%, диапазон 0–30%, default 10%. Иконки `Minus`/`Plus` (Lucide)
- Список цветов из `palette`, сортировка по убыванию уже в buildPalette
- Строка: квадратик 20×20 + `#N` + hex + «N шт.» + `→ Y шт.` при surplus > 0 + chevron
- Раскрываемая разбивка по стенам (локальный state `expanded`)
- Кнопка «Скачать SVG» — primary full-width h:48, sticky footer, открывает `<ExportDialog>`
- Пустое состояние при palette.length === 0

**`withSurplus`** экспортируется из `buildPalette.js`, используется в SchemaLegend и schemaSVGBuilder

### Контекст для следующей сессии 3.5
SchemaLegend готова. ExportDialog подключён через dialogOpen state.
Сессия 3.5 — SVG-генератор (buildSchemaSVG) + ExportDialog с настройками.

---

## Сессия 3.5 — Схема: SVG-экспорт ✅

### buildSchemaSVG

**`src/utils/schemaSVGBuilder.js`**
- `buildSchemaSVG({ walls, tile, tileColors, palette, options })` — генерирует SVG-строку
- `options.scale: 'fit' | 'real'` — fit: `width="100%"` + viewBox; real: `width="Nmm"` + `height="Mmm"`
- `options.drawGrout: boolean` — при false groutW = 0 (плитки вплотную)
- `options.surplusPercent` — включается в легенду (колонка «→ M шт.»)
- При > 10 000 плиток: `<symbol id="tN">` + `<use href="#tN">` для оптимизации размера SVG
- Содержимое: развёртка стен + легенда под ней (шапка + строки цветов)
- Диагональная штриховка масок через `<pattern id="hatch">`
- Floor anchor для плиток (выравнивание снизу)
- `downloadSVG(svgString, filename)` — Blob → createObjectURL → a.click → revokeObjectURL

### ExportDialog

**`src/components/export/ExportDialog.jsx`** — bottom sheet (стиль как WallsSheet):
- `rgba(8,8,15,0.92)` + `backdrop-filter: blur(24px)`, borderRadius `20px 20px 0 0`
- Drag handle 36×4px
- Radio «На экран» / «Реальный размер 1:1» с описаниями
- Toggle «Рисовать швы» (disabled + opacity 0.38 при grout_width = 0)
- Кнопка «↓ Скачать SVG» h:52 — при нажатии: `loading=true`, генерация в `setTimeout(0)`, CSS-спиннер через inline `animation`, после готовности — sheet закрывается
- Hint «Большой файл, ещё немного…» через `setTimeout(3000)`

### Что НЕ удалось
- Тесты для SVG-генератора не написаны (DOM-зависимость для downloadSVG, buildSchemaSVG — чистая функция, но очень длинная строка сложна для assertion)

## ФАЗА 3 ЗАВЕРШЕНА ✅

Вкладка «Схема» реализована полностью.

### Итоговые файлы фазы 3
- `src/utils/buildPalette.js` — buildPalette, withSurplus
- `src/utils/schemaRenderer.js` — drawSchema, buildSchemaLayout, resolveWallTile, contrastColor
- `src/utils/schemaRenderer.test.js` — 20 новых тестов, все 61 зелёные
- `src/utils/schemaSVGBuilder.js` — buildSchemaSVG, downloadSVG
- `src/components/export/SchemaView.jsx` — canvas + zoom/pan + EmptyState
- `src/components/export/SchemaLegend.jsx` — легенда + степпер + список + кнопка экспорта
- `src/components/export/ExportDialog.jsx` — bottom sheet настроек + кнопка скачать
- `src/components/export/ExportTab.jsx` — split-screen с drag-handle

Следующий этап — вкладка «Укладка».

---

## Сессия 4.1 — Укладка UI: экран ✅

### Компоновка экрана

Вариант C — «Вертикальный стек с цветовым акцентом». Без скролла на iPhone 14 (787px рабочей зоны):

```
┌──────────────────────────┐  ← safe area top
│ [По рядам▾]    247/1820  │  ← 44px toolbar: переключатель режима + счётчик
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ [██] Цвет №7         │ │  ← цвет 72×72px слева, метаданные справа
│ │      #a78bfa         │ │  ← вся карточка ≈104px
│ │ Стена 2              │ │
│ │ Ряд 3 · Плитка 7     │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│                          │
│  [====== превью ======]  │  ← canvas 260px, overflow-x scroll
│                          │
├──────────────────────────┤
│  [◀  Предыдущая] [Следующая  ▶]  │  ← 68px, gap 8px
│  [        К плитке...        ]   │  ← 48px ghost
└──────────────────────────┘  ← tabbar 57px

Итого высот: 44 + 16 + 104 + 16 + 260 + 16 + 68 + 8 + 48 + 16 = 596px < 787px ✅
```

### Блок текущей плитки

- **Цветной квадрат:** 72×72px, `borderRadius: 12px`, float left
- **Строка 1:** «Цвет №7» — 18px/600, `#f1f5f9`
- **Строка 2:** `#a78bfa` — 13px monospace, `#94a3b8`
- **Строка 3:** «Стена 2» — 15px/500, `#f1f5f9`
- **Строка 4:** «Ряд 3 от пола · Плитка 7 слева» — 13px, `#94a3b8`
- **Карточка:** `background: #0e1018`, `borderRadius: 16px`, `padding: 16px`, border `rgba(255,255,255,0.07)`, `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)`
- **Hex показывать:** да — мастер сверяется с каталогом
- **Размер плитки:** не показывать — лишний шум
- **Счётчик прогресса:** в toolbar справа, 13px/500 `#64748b`
- **Предупреждение «нет пикселизации»:** желтый баннер 36px над карточкой при отсутствии tileColors

### Мини-превью стены

- **Размер:** высота 260px, ширина 100%, overflow-x auto (скролл для широких стен)
- **Масштаб:** самая высокая стена = 240px (padding 10px сверху/снизу)
- **Текущая плитка:** 3px обводка `#a78bfa` (фиолетовый, не цвет плитки)
- **Соседние 4 плитки** (L/R/U/D): overlay `rgba(167,139,250,0.18)` поверх цвета
- **Уложенные плитки:** overlay `rgba(0,0,0,0.45)` + «✓» 8px белый при клетке ≥18px
- **Маски:** штриховка как в schemaRenderer
- **Тап на плитку:** переход к ней, opacity 0.75 на 80ms как affordance
- **Авто-центрирование:** `scrollTo({ behavior: 'smooth' })` при смене currentTile
- **НЕ использовать react-zoom-pan-pinch** — зум избыточен, только горизонтальный scroll

### Навигация

- **«Предыдущая» / «Следующая»:** 50%/50% ширины, высота 68px, `borderRadius: 14px`, gap 8px
  - Пред: secondary (`rgba(255,255,255,0.06)`, `ChevronLeft` слева)
  - След: primary (градиент `#7c3aed → #6d28d9`, `ChevronRight` справа)
- **Swipe влево/вправо:** threshold 50px, `onTouchStart`/`onTouchEnd`
- **«К плитке…»:** ghost кнопка h:48, иконка `Hash`, открывает bottom sheet с numeric input

### Переключатель режима

- В toolbar слева: pill-сегмент h:32, `borderRadius: 20px`
- Активная: `rgba(124,58,237,0.35)`, `color: #a78bfa`/600
- Неактивная: `#64748b`
- При переключении: rebuildSequence + goTo(0)

### Смена стены

- Toast над навигацией «Переходим на Стена N+1», 2.5 сек
- `background: rgba(124,58,237,0.15)`, `border: 1px solid rgba(124,58,237,0.3)`, `color: #a78bfa`
- Slide-up 150ms / fade-out 200ms

### Завершение

- `LayoutDoneScreen`: иконка `CheckCircle` 64px `#22c55e`, заголовок, статистика, кнопка «Начать сначала» + «→ В схему»
- Без конфетти — отвлекает
- Анимация иконки: scale 0→1 300ms

### Пустые состояния

- **Нет стен:** EmptyState с `Grid3x3`, кнопка «→ Перейти в Комнату»
- **Нет пикселизации:** желтый баннер-предупреждение, укладка НЕ блокируется, цвет плитки = grout_color / #888888

### Контекст для следующей сессии 4.2

Компоновка: toolbar 44px (режим + счётчик) + карточка 104px + превью 260px + навигация 68+8+48px. Dark Glow токены. Canvas превью: высота 260px, overflow-x scroll, масштаб по высоте стены, обводка текущей `#a78bfa` 3px, соседние overlay `rgba(167,139,250,0.18)`. Нужно решить: хранение прогресса, уложенные плитки, детали режима «по цветам», анимации переходов, Wake Lock, toolbar/header.

---

## Сессия 4.2 — Укладка UI: детали ✅

### Хранение прогресса

- **layoutStore** — отдельный Zustand store с `persist` middleware в localStorage
- Ключ: `drape-layout-store`
- Сохраняет: `currentIndex`, `mode`, `completedTiles` (как массив, десериализуется в Set)
- При открытии: восстанавливается последний currentIndex. Если вышел за bounds sequence — сброс на 0
- НЕ в IndexedDB/projectStore — прогресс эфемерный, не часть проекта
- **«Начать сначала»:** только на экране завершения. На основном экране нет

### Отметка уложенных плиток

- **Реализовать** — но НЕ обязательный шаг (автоотметка при навигации не происходит)
- **Кнопка «✓ Отметить»:** ghost, h:36, padding `8px 12px` (итого ≥44px touch area), в карточке справа внизу
- При нажатии: добавить в completedTiles, кнопка → «✓ Уложена» зелёным. Повторный тап — снять
- **Хранение:** `Set<'wallId:col:row'>` в layoutStore, persist localStorage
- **Визуально:** затемнение + «✓» на превью (как в 4.1)
- **Navigate на уложенную:** отметка сохраняется, текущая плитка может быть уложенной

### Режим «по цветам» — детали

- **Toolbar при byColor:** добавляется цветной чип между переключателем и счётчиком
  - Квадратик 20×20px текущего цвета + «Цвет №3 (48 осталось)» — 12px, `#64748b`
- **Переключатель режима:** кнопка-дропдаун `[▾ По рядам]` h:32, открывает inline-sheet выбора
- **Toast при смене цвета:** «Переходим к Цвету №N» (аналогичен toast смены стены)

### Широкие стены — превью

- **Авто-центрирование:** `containerRef.scrollTo({ left: tileX - containerWidth/2 + tileWidth/2, behavior: 'smooth' })`
- **Индикатор скролла:** fade-градиент `rgba(8,8,15,0.5)` по краям, 16px, CSS `pointer-events: none`
- **Одна плитка:** работает штатно

### Touch targets и доступность

- Кнопки Пред/След: 68px — OK
- «К плитке»: 48px — OK
- «Отметить»: h:36 + padding 8px → ≥44px — OK
- **Swipe:** `onTouchStart/End` на всём экране. Threshold X: 50px. Допустимый уход Y: ±30px. `e.preventDefault()` при детектировании
- **Wake Lock:** `navigator.wakeLock.request('screen')` при `activeTab === 'layout'`, освобождать при уходе/visibilitychange. `try/catch` — Safari не поддерживает, тихий фейл

### Анимации переходов

- **Смена плитки (карточка):** fade-crossfade 80ms (40ms out + 40ms in). CSS transition `opacity 40ms ease-in/ease-out`
- **Превью:** без анимации — scrollTo плавный и так
- **Завершение:** иконка scale 0→1, 300ms, `cubic-bezier(0.34, 1.56, 1, 1)` (spring без библиотеки)
- **Toast:** `translateY(8px)→0` + `opacity 0→1`, 150ms ease-out
- **Flash при смене стены/цвета:** белый overlay 15% opacity на превью, 100ms fade-out

### Toolbar / выход

```
│ [▾ По рядам]  [████ №3 (48)]   247/1820 │  44px
```
- Нет кнопки «назад» — пользователь уходит через таббар (Укладка — полноценная вкладка)
- Нет заголовка «Укладка» — таббар уже показывает активную иконку
- Переключатель режима — всегда видим как `[▾ По рядам]`, тап → inline выбор (не bottom sheet)
- Чип цвета при byColor — появляется по центру, исчезает при byRow

### Контекст для следующей сессии 4.3

Все дизайн-решения зафиксированы. Сессия 4.3 — TDD реализация (ВЫПОЛНЕНА, см. ниже):

---

## Сессия 4.3 — Укладка: ядро логики ✅

### layoutSequencer.js

`src/utils/layoutSequencer.js` — 4 чистые функции:
- `buildTileSequence(walls, globalTile, tileColors, palette, mode)` — строит упорядоченный массив всех плиток. Фильтрует: mosaic_active=false, нет размеров, isFullyInsideMask. Поле `row` = canvasRow (0=верх), `rowFromFloor` = totalRows-1-canvasRow. byRow: wallIndex → rowFromFloor → col. byColor: colorIndex → wallIndex → rowFromFloor → col.
- `getTileAt(sequence, index)` — null при выходе за bounds
- `findTileIndex(sequence, wallId, col, canvasRow)` — поиск по wallId+col+row
- `sequenceStats(sequence)` → { total, byWall: Map, byColor: Map }

**Важное знание:** `resolveWallTile` умножает tile_width/height на 10 → единицы 0.1мм. Маски в СМ (×10 внутри isFullyInsideMask). wallW/H = parseFloat(wall.length/height) × 10.

### layoutStore.js

`src/store/layoutStore.js` — Zustand + persist localStorage ('drape-layout-store'):
- Поля: `currentIndex`, `mode`, `completedTiles[]` (массив, Set в памяти), `sequence[]` (не сохраняется)
- Actions: `setMode`, `goTo`, `goNext`, `goPrev`, `markCompleted` (toggle), `isCompleted`, `resetProgress`, `rebuildSequence`, `currentTile()`, `findAndGoTo`, `stats()`, `completedSet()`
- При rebuildSequence: если currentIndex вышел за bounds → сброс на 0

### LayoutWallPreview.jsx

`src/components/layout/LayoutWallPreview.jsx` — canvas 240px высота:
- Пропорциональный масштаб (по высоте и ширине), центрирование в контейнере
- Текущая плитка: 3px обводка `#a78bfa` (снаружи тайла)
- Соседние (L/R/U/D в canvas-координатах): overlay `rgba(167,139,250,0.18)`
- Уложенные: overlay `rgba(0,0,0,0.45)` + «✓» при тайле ≥14px
- Маски: штриховка (паттерн из schemaRenderer)
- Авто-центрирование при смене currentTile через `scrollTo`
- Hit-test через `canvas._drawMeta` → `onTileClick(col, canvasRow)`

### Тесты

25 новых тестов в `src/utils/layoutSequencer.test.js`. Всего: **86 тестов, все зелёные**.

### Что НЕ удалось

Всё запланированное выполнено.

### Контекст для следующей сессии 4.4

Файлы готовы: layoutSequencer.js, layoutStore.js, LayoutWallPreview.jsx.
Сессия 4.4 — UI компоненты и полная интеграция:
- LayoutTileCard.jsx — блок текущей плитки (72×72 цвет, метаданные, анимация fade 80ms)
- LayoutNav.jsx — кнопки Пред/След (68px), swipe, «К плитке» (bottom sheet)
- LayoutModeSwitch.jsx — дропдаун режима в toolbar
- LayoutDoneScreen.jsx — экран завершения
- LayoutTab.jsx — полная замена заглушки (useEffect rebuildSequence, Wake Lock, toast смены стены)
- `src/utils/layoutSequencer.js` — buildTileSequence, getTileAt, findTileIndex, sequenceStats
- `src/store/layoutStore.js` — Zustand + persist localStorage
- `src/components/layout/LayoutWallPreview.jsx` — canvas превью с подсветкой
- Тесты через Vitest

---

## Сессия 4.4 — UI компоненты и полная интеграция вкладки «Укладка»

**Дата:** 2026-05-21
**Статус:** завершена ✅

### Что сделано

#### LayoutTileCard.jsx
- Карточка текущей плитки: 72×72 цветной квадрат с `outlineOffset:2` для зелёной обводки при isCompleted
- Мета: «Цвет №N», hex (monospace), название стены, «Ряд X от пола · Плитка Y»
- Fade анимация 40ms при смене `currentIndex` (`setVisible(false)` → `setTimeout(40)` → `setVisible(true)`)
- Жёлтый баннер `noPalette` — предупреждение когда нет пикселизации
- Кнопка «Отметить» / «✓ Уложена» (h:36, padding → ≥44px touch area)

#### LayoutNav.jsx
- Кнопки «Предыдущая» (secondary `rgba(255,255,255,0.06)`) и «Следующая» (gradient violet) — h:68
- Swipe-жест на всём root-div: dx≥50px, |dy|≤30px → onPrev/onNext
- Кнопка «К плитке…» h:48 → bottom sheet с `inputMode="numeric"`, `autoFocus`, Enter → handleGoTo
- Передаёт `onGoTo(index)` — 0-based индекс

#### LayoutModeSwitch.jsx
- Pill-сегмент h:32, двойная таблетка в контейнере `rgba(255,255,255,0.05)` с `borderRadius:20`
- Активная: `rgba(124,58,237,0.35)` bg, `color:#a78bfa` | Неактивная: transparent, `#64748b`
- Transition 150ms на color/background

#### LayoutDoneScreen.jsx
- `CheckCircle` 64px `#22c55e` из lucide-react, `strokeWidth:1.5`
- Анимация монтирования: `requestAnimationFrame` → `scale(0.92)→(1)` + `opacity 0→1`, 240ms ease-out
- Карточка статистики: «Отмечено / Всего», прогресс-бар `linear-gradient(90deg, #7c3aed, #22c55e)`, %
- Кнопки: «Начать сначала» (secondary) + «В схему →» (primary gradient, опциональна)

#### LayoutTab.jsx — полная интеграция
- `useWakeLock(true)`: `navigator.wakeLock.request('screen')` в try/catch, автовосстановление при `visibilitychange`
- `useEffect` → `rebuildSequence(walls, tile, tileColors, null)` при изменении данных проекта
- Тулбар: `LayoutModeSwitch` слева + счётчик «N / Total» справа (tabular-nums)
- Превью стены: `LayoutWallPreview` + плашка с названием стены (абсолютная, top-left)
- `LayoutTileCard` в `padding:0 16px`
- `LayoutNav` с привязкой goTo (0-based)
- Пустое состояние: нет `mosaic_active && wall_active` стен → EmptyState с Layers icon
- Экран Done: `currentIndex >= totalCount && totalCount > 0` → `LayoutDoneScreen` со stats
- `noPalette`: `Object.keys(tileColors).length === 0` при непустой последовательности
- Клик по плитке на превью → `findAndGoTo(wallId, col, canvasRow)`
- «В схему» → `setActiveTab('schema')`

### Итог сессии

Все 5 компонентов реализованы. Сборка `vite build` — чистая ✅. 25 тестов layoutSequencer — зелёные ✅.

**Вкладка «Укладка» полностью готова к тестированию на устройстве.**

### Файлы сессии 4.4

- `src/components/layout/LayoutTileCard.jsx` — карточка плитки
- `src/components/layout/LayoutNav.jsx` — навигация + swipe + bottom sheet
- `src/components/layout/LayoutModeSwitch.jsx` — переключатель режима
- `src/components/layout/LayoutDoneScreen.jsx` — экран завершения
- `src/components/layout/LayoutTab.jsx` — полная интеграция (заменила заглушку)

Ключевые данные: tileColors ключ `'col_row'` (col=X, row=canvasRow, от верха). rowFromFloor = totalRows-1-canvasRow. Floor anchor: startY = H - rows*stepY. isFullyInsideMask принимает tileStartY_mm. resolveWallTile из schemaRenderer. mosaic_active=true — фильтр для стен.

---

## Аудит проекта — 2026-05-21 ✅

### Code Review (requesting-code-review subagent)

> Запущен как фоновый агент, результаты интегрированы ниже по итогам анализа.

#### Сильные стороны кода (что работает хорошо — не трогать)

- **pixelizerGeometry.js** — корректная реализация `isFullyInsideMask` с `tileStartY_mm` параметром. Floor anchor логика правильная (startY = H - rows*stepY). `Math.round()` применён к шагам сетки — скатерть-эффект исправлен.
- **pixelizerSampler.js** — `averageColor()` корректно округляет границы пикселей через `Math.round`, предотвращая out-of-bounds чтение. `sampleWallColors()` правильно вычисляет floor anchor симметрично с renderer.
- **schemaSVGBuilder.js** — `escapeXml()` корректно экранирует спецсимволы в SVG. `<symbol>/<use>` оптимизация при > 10 000 плиток — грамотное решение.
- **WallCanvas.jsx** — правильный паттерн: touch listeners с `{ passive: false }` только для `touchmove` (e.preventDefault нужен для pinch). Cleanup через `removeEventListener` в return функции useEffect.
- **persistence.js** — структура чистая, фото хранятся отдельно от state (правильное разделение).
- **layoutStore.js** — `partialize` правильно исключает `sequence` из localStorage. `completedTiles` как массив для persist + Set в памяти — хорошее решение.
- **SavedToast.jsx** — `unsub()` вызывается в cleanup useEffect, таймеры очищаются — нет утечек.
- **86 тестов, все зелёные** — хорошее покрытие критических утилит.
- **prefers-reduced-motion** — весь animations.css блок, нулевые длительности через `!important`.
- **CSS `100dvh`** — правильно, а не `100vh` (iOS Safari safe area).

#### Критичные проблемы

1. **[КРИТИЧНО] Формула колонок в schemaRenderer/schemaSVGBuilder расходится с roomGeometry в 10 раз**  
   - Файлы: `src/utils/schemaRenderer.js:52-53`, `src/utils/schemaSVGBuilder.js:38-39` vs `src/utils/roomGeometry.js:109`  
   - Что не так: `schemaRenderer` и `schemaSVGBuilder` вычисляют `columns = Math.ceil(wallW_mm / (tileW + groutW))`, где `tileW = parseFloat(...) * 10` (единицы 0.1 мм), а `wallW_mm = parseFloat(wall.length) * 10` (мм). Формула делит мм на 0.1-мм — результат в 10 раз меньше правильного. Для стены 300 см с плиткой 20 мм: правильно 137 колонок, схема рисует 14.  
   - Почему важно: схема и SVG-экспорт показывают принципиально неверную раскладку. Ключевая функция приложения работает неправильно.  
   - Что сделать: унифицировать через единую функцию `wallGridMm(wall, globalTile)` в мм без коэффициентов масштаба. Вариант быстрее: в schemaRenderer/schemaSVGBuilder убрать `* 10` из `resolveWallTile` или делить обратно перед вычислением колонок.

2. **[КРИТИЧНО] `byColor` режим укладки работает как `byRow` (palette = null)**  
   - Файл: `src/components/layout/LayoutTab.jsx:89`  
   - Что не так: `rebuildSequence(walls, tile, tileColors, null)` передаёт `null` как palette. Внутри `buildTileSequence` это → `new Map([])` → `hexToIndex.get(hex) = undefined` → `colorIndex = null` для всех плиток → `byColor` сортировка = `byRow`. Режим «по цветам» тихо не работает.  
   - Что сделать: вычислить `palette = useMemo(() => buildPalette(walls, tileColors), [walls, tileColors])` в LayoutTab и передать в `rebuildSequence`.

3. **[КРИТИЧНО] tile_overrides игнорируются при пикселизации и рендере canvas**  
   - Файлы: `src/components/pixelizer/PixelizerTab.jsx:273-279`, `src/components/pixelizer/WallCanvas.jsx:129-136`  
   - Что не так: `tileGrid` собирается из `parseFloat(tile.tile_width)` напрямую. Стена с tile_overrides получает неверные цвета из-за несовпадения размеров при сэмплировании.  
   - Что сделать: использовать `resolveWallTile(wall, tile)` из schemaRenderer.js. Значения вернуть в мм (разделить на 10, т.к. resolveWallTile возвращает в 0.1 мм).

4. **[КРИТИЧНО] handlePixelize — нет try/finally: sampling зависает навсегда при ошибке**  
   - Файл: `src/components/pixelizer/PixelizerTab.jsx:255-296`  
   - Что не так: если `createImageBitmap`, `sampleWallColors` или `loadPhoto` бросает ошибку (corrupt blob, out-of-memory, IndexedDB error) — `setSampling(false)` не вызывается, кнопка «Пикселизировать» остаётся навсегда заблокированной.  
   - Что сделать: `try { ... } catch(e) { showToast('Ошибка: ' + e.message) } finally { setSampling(false) }`.

5. **Web Worker не реализован — пикселизация в main thread**  
   - Файл: `src/workers/.gitkeep`  
   - Что не так: `sampleWallColors` выполняется в main thread. Для 18 750 плиток UI замерзает на 1–5 секунд на слабых iPhone. Зафиксировано в TEHC_STACK.md решение №6.  
   - Что сделать: `src/workers/pixelize.worker.js` с OffscreenCanvas + Transferable Objects.

6. **persistence.js — нет обработки ошибок IndexedDB**  
   - Файл: `src/store/persistence.js:9-57`  
   - Что не так: `initDB()`, `saveAll()`, `loadAll()` без `try/catch`. При QuotaExceededError или Safari Private Browsing — краш при старте.  
   - Что сделать: try/catch + fallback на in-memory режим с предупреждением.

7. **WallCanvas — нет devicePixelRatio: canvas мутный на Retina iPhone**  
   - Файл: `src/components/pixelizer/WallCanvas.jsx` (весь)  
   - Что не так: canvas размер без DPR. На iPhone 3x — 1/3 реального разрешения. schemaRenderer.js и LayoutWallPreview.jsx делают правильно — паттерн уже есть.  
   - Что сделать: `canvas.width = dims.width * dpr; canvas.height = dims.height * dpr; ctx.scale(dpr, dpr)`.

#### Важные проблемы

8. **ImageBitmap никогда не закрывается — утечка GPU-памяти**  
   - Файлы: `src/utils/pixelizerSampler.js:43`, `src/components/pixelizer/PixelizerTab.jsx:103`  
   - Что не так: `createImageBitmap()` выделяет GPU-память, требует явного `bmp.close()`. В sampleWallColors — создаётся каждый раз, не закрывается. В photoCache — накапливается при добавлении фото.  
   - Что сделать: `img.close()` после `getImageData` в sampleWallColors; `bmp.close()` при удалении фото из кеша.

9. **Race condition в загрузке photoCache — нет cancellation**  
   - Файл: `src/components/pixelizer/PixelizerTab.jsx:95-124`  
   - Что не так: если `pixelizer.photoSettings` меняется пока `Promise.all` не завершился — предыдущий resolved promise записывает устаревшие данные в кеш. Может показать удалённое фото.  
   - Что сделать: `let cancelled = false; ... .then(res => { if (cancelled) return; ... }); return () => { cancelled = true }`.

10. **No code splitting — Three.js грузится при старте**  
    - Файл: `src/App.jsx:5`  
    - Three.js + R3F + Drei ≈ 600 кБ из 1145 кБ бандла. Не нужны при старте.  
    - Что сделать: `React.lazy(() => import('./components/viewer/ViewerTab.jsx'))` + `<Suspense>`.

11. **rebuildSequence не обновляет sequence при смене режима**  
    - Файл: `src/store/layoutStore.js:25-27`  
    - `setMode` делает `set({ mode, currentIndex: 0 })` без вызова rebuildSequence. Последовательность пересчитается только при следующем рендере LayoutTab через useEffect. В strict mode / двойном рендере это проблема.  
    - Что сделать: вызвать rebuildSequence внутри setMode, или убедиться что useEffect в LayoutTab всегда видит актуальный mode при построении sequence.

12. **ExportTab drag-handle touch target 24px < 44px**  
    - Файл: `src/components/export/ExportTab.jsx:108-125`  
    - `height:4 + padding:10×2 = 24px`. Negative margin не увеличивает touch zone.

13. **eyeMode sync useEffect пропускает зависимость**  
    - Файл: `src/components/pixelizer/PixelizerTab.jsx:127-130`  
    - `pixelizer.gridVisible` читается внутри useEffect но не в deps array. При восстановлении из IndexedDB с другим значением — расхождение между UI и store.  
    - Что сделать: добавить `pixelizer.gridVisible` в deps, или убрать двустороннюю синхронизацию (gridVisible уже корректно выводится в renderParams на строке 307-314).

14. **layoutStore.isCompleted использует Array.includes — O(n) в hot render**  
    - Файл: `src/store/layoutStore.js:60-63`  
    - `completedTiles.includes(key)` вызывается для каждой плитки в LayoutWallPreview. При большой completedTiles — O(n²).  
    - Что сделать: использовать `completedSet()` внутри isCompleted.

15. **canvas._drawMeta — запись данных в DOM-узел**  
    - Файл: `src/components/layout/LayoutWallPreview.jsx:196`  
    - Anti-pattern. При замене canvasRef (key change) — старый `_drawMeta` теряется.  
    - Что сделать: `useRef` для хранения метаданных.

16. **restoreSnapshot — нет валидации полей**  
    - Файл: `src/store/projectStore.js:165-171`  
    - Импортированный JSON без валидации → мусор в store.  
    - Что сделать: минимальная проверка типов (walls — Array, tile — object).

17. **JSON импорт/экспорт UI не реализован**  
    - Решение №35 и №64 из DECISIONS.md — активны, но `src/utils/projectIO.js` не создан, UI отсутствует. Пользователь не может сохранить проект.

#### Незначительные замечания

18. **vite.config.js — icon purpose 'any maskable' устарел**  
    Файл: `vite.config.js:29`. Нужно два отдельных объекта: `{purpose:'any'}` и `{purpose:'maskable'}`.

19. **theme_color `#1a1a1a` ≠ `#08080f`**  
    Файлы: `index.html:5`, `vite.config.js:15`. Строка браузера при PWA-установке будет неверного цвета.

20. **panoramaH не обновляется при изменении размера окна**  
    Файл: `src/components/pixelizer/PixelizerTab.jsx:47-52`. Нет ResizeObserver — поворот устройства не обновляет canvasScale.

21. **showToast timer не отменяется при unmount / повторном вызове**  
    Файл: `src/components/pixelizer/PixelizerTab.jsx:133-136`. Быстрые повторные вызовы накапливают таймеры. Нужен useRef + clearTimeout.

22. **SavedToast — `showOnTabs` создаётся при каждом рендере**  
    Файл: `src/components/shared/SavedToast.jsx:12`. Константу вынести за пределы компонента.

23. **Дублированный import в PixelizerTab**  
    Файл: `src/components/pixelizer/PixelizerTab.jsx:5-6`. Два отдельных `import` из `pixelizerGeometry.js` — объединить в один.

24. **countMaskedTiles не учитывает floor anchor**  
    Файл: `src/utils/roomGeometry.js:56-61`. `rowStart = Math.ceil(my/stepY)` без tileStartY_mm поправки. Расхождение с isFullyInsideMask для стен разной высоты.

---

### Рекомендации по автоматизации (claude-automation-recommender)

#### MCP серверы
- **context7** — `claude mcp add context7 -- npx -y @upstash/context7-mcp`. Обоснование: Three.js/R3F, vite-plugin-pwa, Zustand — быстро меняющиеся API. Живая документация прямо в контексте.
- **Playwright MCP** — `claude mcp add playwright -- npx @playwright/mcp@latest`. Playwright уже в devDependencies, нет ни одного визуального теста PWA.

#### Хуки
- **PostToolUse: авто-запуск vitest** при изменении `src/utils/**` — 86 тестов за 322ms, нулевая цена за caught regression.
- **PreToolUse: защита design-документов** — `docs/sessions/state.md`, `planning/DECISIONS.md` не должны перезаписываться случайно.

#### Скиллы
- **`/drape-session`** — загружает контекст state.md + DECISIONS.md в начале новой сессии.
- **`/pixelizer-smoke`** — быстрая проверка алгоритма пикселизации (критический путь).

#### Плагины
- Нет дополнительных рекомендаций.

---

### Производительность

| Метрика | Значение | Оценка |
|---|---|---|
| Бандл (minified) | 1 145 кБ | ⚠️ Vite предупреждает (>500кБ) |
| Бандл (gzip) | 321 кБ | Приемлемо |
| Тесты (86 штук) | 322ms | ✅ Быстро |
| Сборка | 6.29s | ✅ |

**Главная проблема**: Three.js + R3F + Drei ≈ 600 кБ грузятся сразу при старте приложения, хотя 3D-вкладка нужна не всегда. Нет `React.lazy` ни для одного из 5 компонентов вкладок.

**Web Worker**: директория `src/workers/` существует, но содержит только `.gitkeep`. Пикселизация идёт в main thread через `sampleWallColors()` → `document.createElement('canvas')` → `getImageData()`. На большой стене (18 750 плиток) UI замерзает.

**Что хорошо**: `useMemo` для canvasScale, photoGroups, visibleWalls — правильно. photoCache как Map с lazy loading — правильно. `frameloop="demand"` в R3F Canvas — экономия батареи.

---

### Тесты — покрытие

**Покрыто (86 тестов):**
- `pixelizerGeometry.test.js` — все функции, включая floor anchor и isFullyInsideMask ✅
- `pixelizerSampler.test.js` — averageColor ✅
- `schemaRenderer.test.js` (20 тестов) — buildPalette, withSurplus, resolveWallTile, contrastColor, buildSchemaLayout ✅
- `layoutSequencer.test.js` (25 тестов) — buildTileSequence, getTileAt, findTileIndex ✅
- `computeWallPositions.test.js`, `roomGeometry.test.js`, `buildTileTexture.test.js` ✅

**Не покрыто (критично):**
- `pixelizerRenderer.js` — нет тестов. Canvas-зависимость, но floor anchor логика в `drawWallPhoto`/`drawWallMosaic` тестируемая через mock canvas.
- `schemaSVGBuilder.js` — явно упомянуто в state.md «тесты не написаны». Чистая функция, легко тестировать без DOM (только `buildSchemaSVG`, не `downloadSVG`).
- `buildPalette.js` — нет отдельных тестов (только косвенно через schemaRenderer.test).
- `persistence.js` — нет тестов. IndexedDB тестируется через mock.
- `layoutStore.js` — нет тестов (Zustand store с persist).
- `roomGeometry.js: countMaskedTiles` — не покрыто изолированно.

---

### PWA

| Параметр | Статус |
|---|---|
| vite-plugin-pwa подключён | ✅ |
| Service Worker (precache) | ✅ `registerType: 'autoUpdate'` |
| manifest (name, short_name, display) | ✅ |
| icons 192 + 512 | ✅ |
| viewport-fit=cover | ✅ (index.html) |
| offline работа | ✅ (precache всех ассетов) |
| apple-touch-icon | ⚠️ Нет в `public/`, только в manifest |
| icon purpose формат | ⚠️ `'any maskable'` вместо двух отдельных объектов |
| theme_color | ⚠️ `#1a1a1a` ≠ `#08080f` из дизайн-системы |

---

### Доступность и UX

**Хорошо:**
- `aria-label` есть на всех кнопках-иконках (ViewerToolbar, LayoutNav, SchemaLegend) ✅
- `prefers-reduced-motion` обнуляет все duration через `!important` ✅
- Touch targets ≥ 44px: nav-tab (~52px), WallCard delete (44×44), LayoutNav prev/next (68px), «К плитке» (48px) ✅
- `role="separator"` на drag-handle в ExportTab ✅

**Проблемы:**
- **ExportTab drag-handle**: `height:4 + padding:10 = 24px` — ниже 44px минимума. Критично для mobile UX.
- WallCanvas `<canvas>` без `role` и `aria-label` — screen reader не понимает что это.

---

### Хранилище и данные

| Сценарий | Обработка |
|---|---|
| IndexedDB недоступна (Safari incognito) | ❌ Краш при initDB() — нет try/catch |
| QuotaExceededError при saveAll() | ❌ Необработанное исключение |
| loadAll() с битыми данными | ❌ Нет try/catch |
| restoreSnapshot с невалидным JSON | ⚠️ Нет валидации полей |
| createImageBitmap невалидного фото | ✅ Бросит ошибку — natural error handling |
| Большой base64 в JSON экспорте | — JSON экспорт UI не реализован |

**JSON экспорт/импорт**: полностью отсутствует в UI. `src/utils/projectIO.js` из TEHC_STACK.md не создан. Пользователь не может сделать бэкап проекта.

---

### Мобильная специфика

| Параметр | Статус |
|---|---|
| `100dvh` вместо `100vh` | ✅ App.css |
| `env(safe-area-inset-bottom)` | ✅ Применено в 8 местах |
| WallCanvas devicePixelRatio | ❌ Не учитывается — мутные плитки на Retina |
| SchemaView (drawSchema) devicePixelRatio | ✅ `window.devicePixelRatio || 1` |
| LayoutWallPreview devicePixelRatio | ✅ |
| Горизонтальная ориентация | ⚠️ Не тестировалось |
| iOS font-size 200% | — Все размеры в px, не rem — потенциальная проблема |

**WallCanvas Retina**: самый серьёзный визуальный баг для основного сценария. SchemaView и LayoutWallPreview делают правильно — паттерн есть, нужно применить.

---

### Безопасность

| Параметр | Статус |
|---|---|
| `dangerouslySetInnerHTML` | ✅ Отсутствует |
| `eval()` | ✅ Отсутствует |
| SVG escapeXml() | ✅ Корректен |
| restoreSnapshot без валидации | ⚠️ |
| Photo MIME validation | ✅ `createImageBitmap` упадёт на невалидном |
| IndexedDB ключи без sanitize | ✅ Только system-generated IDs |

---

### Приоритизированный план действий

#### Критично (сделать до первого реального использования):

1. **Исправить формулу колонок в schemaRenderer/schemaSVGBuilder** — сейчас схема показывает в ~10 раз меньше плиток чем есть на самом деле. Ключевой функционал приложения работает неправильно. Унифицировать через общую функцию с roomGeometry.

2. **LayoutTab: передать palette в rebuildSequence** — режим «по цветам» тихо работает как «по рядам». Два вычисления: `useMemo(() => buildPalette(walls, tileColors))` и передать в `rebuildSequence`.

3. **PixelizerTab/WallCanvas: resolveWallTile** — tile_overrides игнорируются при пикселизации и рендере. Неверные цвета при использовании tile_overrides.

4. **handlePixelize: добавить try/finally** — при любой ошибке кнопка зависает навсегда. Одна строка `finally { setSampling(false) }`.

5. **persistence.js: добавить try/catch** — краш при Safari incognito или QuotaExceededError. Fallback на in-memory режим.

6. **WallCanvas: devicePixelRatio** — мутные плитки на iPhone 3x. Паттерн уже есть в schemaRenderer.js.

#### Важно (сделать до релиза):

7. **ImageBitmap.close()** — утечка GPU-памяти. В sampleWallColors после getImageData, при удалении фото из кеша.

8. **JSON экспорт/импорт UI** — пользователь не может сохранить проект. projectIO.js + кнопки в UI.

9. **Code splitting для Three.js** — `React.lazy(() => import('./components/viewer/ViewerTab.jsx'))`. 600 кБ при старте, 30 минут работы.

10. **Race condition в photoCache**: добавить `cancelled` флаг в useEffect загрузки фото.

11. **eyeMode useEffect: добавить pixelizer.gridVisible в deps** — расхождение UI/store при восстановлении из IndexedDB.

12. **ExportTab drag-handle**: увеличить touch target до 44px.

13. **Web Worker реализация** — большая задача (TEHC_STACK.md §6). Отдельная сессия.

#### Желательно (можно позже):

14. **schemaSVGBuilder тесты** — `buildSchemaSVG` чистая функция без DOM. Нужны после исправления формулы колонок.

15. **layoutStore.isCompleted через completedSet()** — O(n) → O(1).

16. **canvas._drawMeta → useRef** в LayoutWallPreview.

17. **calculateGrid поднять в PixelizerTab** через useMemo — убрать дублирование в каждом WallCanvas.

18. **theme_color**: `#1a1a1a` → `#08080f` в index.html и vite.config.js.

19. **icon purpose**: разделить на два отдельных объекта.

20. **panoramaH ResizeObserver** — обновлять canvasScale при повороте устройства.

21. **showToast timer useRef + clearTimeout** — не накапливать таймеры.

22. **countMaskedTiles: floor anchor** — согласовать с isFullyInsideMask или задокументировать.

23. **iOS font-size 200%** — рассмотреть переход с px на rem.
