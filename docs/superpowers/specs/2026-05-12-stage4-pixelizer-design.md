# Stage 4 — Pixelizer: Design Spec

Date: 2026-05-12
Branch: `stage_4`

---

## Scope

Вкладка «Фото»: плоская горизонтальная развёртка всех стен комнаты с наложением мозаичной сетки и фотографий. Фотографии хранятся в отдельной таблице IndexedDB (не попадают в снапшот undo/redo). Маски-препятствия получают поле цвета (изменение в Room tab).

---

## Что видит пользователь

### Верхняя зона — развёртка стен

Все активные (wall_active = true) стены рисуются в горизонтальный ряд на общем Canvas. Каждая стена — пропорциональный прямоугольник в масштабе, рассчитанном от высоты экрана.

**Базовый масштаб:**
```
BASE_SCALE = (viewportHeight × 0.75) / maxWallHeight_mm
```
При старте — всё видно по высоте. Ширина может выходить за экран → горизонтальный скролл.

**Жесты:**
- Свайп одним пальцем по горизонтали → прокрутка развёртки
- Щипок двумя пальцами → зум всей развёртки (CSS transform scale на контейнере)
- Тап на стену → выбрать стену для редактирования фото (нижняя панель переключается)

**Отступ между стенами:** 16px (в масштабированных единицах).

### Рендеринг каждой стены (Canvas, Вариант А)

Слои снизу вверх:

1. **Фон стены** — заливка цветом `#2a2a3a` (нейтральный тёмный, если фото нет)
2. **Фото** (если добавлено) — `drawImage` с применением `offsetX_mm`, `offsetY_mm`, `scale` и `opacity`
3. **Плиточная сетка** (если tile params заполнены и grid ON):
   - Сначала вся область стены заливается цветом шва (`grout_color`)
   - Затем поверх рисуется каждый тайл — прямоугольник вырезает «окно» в фото через `drawImage` с clip-регионом
   - Ячейки, полностью внутри маски → не рисуются (ни заливка, ни clip)
   - Граничные ячейки (частично перекрыты маской) → рисуются
4. **Маски** — `fillRect` в цвете маски с `globalAlpha = 0.55`

**Результат Варианта А:** фото видно сквозь «окна» каждой плитки; швы непрозрачны в цвете шва; маска — цветная полупрозрачная плашка.

### Нижняя панель управления

Фиксирована по низу экрана, над навигацией. Три режима:

**Режим по умолчанию:**
```
[ Стены ▾ ]  [ + Фото ]  [ ≡ Сетка вкл ]
```

**Когда выбрана стена с фото (тап на стену):**
```
[ X: __ мм ]  [ Y: __ мм ]  [ Масштаб: __% ]  [ Прозрачность: ─●── ]
```
Числовые поля и слайдер прозрачности (0–100%).

**Кнопка «Стены»** → шторка снизу:
- Список всех стен с чекбоксами (видимость)
- «Все» / «Сбросить»

**Кнопка «+ Фото»** → шторка снизу:
- «Добавить на все стены»
- Список конкретных стен (нажать → выбрать файл)

**Кнопка «≡ Сетка вкл/выкл»** → переключает отображение плиточной сетки на всех стенах.

---

## Изменения в Room tab — цвет маски

В `MaskCard.jsx` добавляется поле `color`:
- Кнопка-кружок с текущим цветом маски (по умолчанию `#888888`) в строке полей
- Нажатие открывает `<input type="color">`
- Цвет сохраняется в `mask.color` в сторе

---

## Модель данных

### Добавить к маске

```js
// в masks[]:
{ id, name, x, y, width, height, color: '#888888' }
```

### Новый срез в projectStore

```js
pixelizer: {
  visibleWalls: null,        // null = все; string[] = список wall id
  gridVisible: true,         // сетка вкл/выкл
  photoSettings: {
    // wallId → настройки позиции/прозрачности
    'w_123': {
      photoId: 'ph_456',     // ключ в IndexedDB таблице photos
      offsetX_mm: 0,
      offsetY_mm: 0,
      scale: 1.0,
      opacity: 1.0,          // 0..1
    }
  }
}
```

### IndexedDB

Используется уже существующая таблица `photos` (заложена в Stage 1):
```
photos store: key=photoId (string), value=Blob
```
Блоб конвертируется в ObjectURL при рендеринге; не попадает в снапшот undo/redo.

---

## Компонентная структура

```
src/components/pixelizer/
  PixelizerTab.jsx          — контейнер: жесты zoom/scroll, компоновка
  WallCanvas.jsx            — <canvas> одной стены; перерисовка через useEffect
  PixelizerControls.jsx     — нижняя панель управления (режимы)
  PhotoSheet.jsx            — шторка «добавить фото»
  WallsSheet.jsx            — шторка «видимость стен»

src/utils/
  pixelizerRenderer.js      — чистые функции рисования (без React, без стора)
  pixelizerGeometry.js      — перевод wall data → canvas-координаты (масштаб)
```

---

## Рендеринг: алгоритм (pixelizerRenderer.js)

```
drawWall(ctx, wall, tileParams, photo, photoSettings, canvasScale):

  1. fillRect(0, 0, W, H) цветом #2a2a3a     // фон по умолчанию

  2. если gridVisible И tile params заполнены:

       a. fillRect(0, 0, W, H) цветом grout_color
          // Вся стена залита цветом шва — это и есть швы

       b. ctx.globalAlpha = photo ? photoSettings.opacity : 1.0
          Для каждого тайла (col, row) в [0..cols) × [0..rows):
            - если тайл полностью внутри хотя бы одной маски → пропустить
            - иначе:
                ctx.save()
                ctx.rect(tileX, tileY, tileW, tileH)   // clip-регион = окно плитки
                ctx.clip()
                если photo:  ctx.drawImage(photo, ...)  // кусок фото в окне
                иначе:       ctx.fillStyle = '#3a3a4a'
                             ctx.fillRect(tileX, tileY, tileW, tileH)
                ctx.restore()
          ctx.globalAlpha = 1.0

  3. если НЕ gridVisible (или tile params не заполнены) И photo:
       ctx.globalAlpha = photoSettings.opacity
       ctx.drawImage(photo, offsetX_px, offsetY_px, photoW_px, photoH_px)
       ctx.globalAlpha = 1.0
       // Показываем фото без нарезки на плитки

  4. Для каждой маски:
       ctx.globalAlpha = 0.55
       ctx.fillStyle = mask.color
       ctx.fillRect(maskX_px, maskY_px, maskW_px, maskH_px)
       ctx.globalAlpha = 1.0
```

`offsetX_mm` / `offsetY_mm` переводятся в пиксели через `canvasScale` (px/mm) перед вызовом `drawWall`.

**Производительность:** при walls с > 5000 плиток — рендеринг переносится в Web Worker через OffscreenCanvas (папка `src/workers/` заложена в Stage 1). При ≤ 5000 — рисуем в main thread.

---

## Сохранение фото

```
Пользователь выбирает файл
→ FileReader → Blob
→ idb.put('photos', blob, photoId)
→ projectStore.pixelizer.photoSettings[wallId] = { photoId, offsetX_mm: 0, offsetY_mm: 0, scale: 1.0, opacity: 1.0 }
→ Автосохранение projectStore срабатывает (photoSettings — часть снапшота)
→ При восстановлении: idb.get('photos', photoId) → ObjectURL
```

---

## UX-поведение

**Нет параметров плитки** → сетка не рисуется; на Canvas только фон + фото (если есть) + маски.

**Нет фото** → в каждом тайл-окне — нейтральный цвет `#3a3a4a`. Выглядит как «пустая мозаика».

**Стена без размеров** → рисуется как прямоугольник-заглушка с надписью «нет данных».

**Удаление стены** → её photoSettings и запись в `photos` (IndexedDB) удаляются.

**Отмена/повтор** → затрагивает только `pixelizer.visibleWalls`, `gridVisible`, `photoSettings` (позиция/прозрачность). Сами Blob-фотографии не входят в undo/redo.

---

## Изменения в существующих файлах

| Файл | Изменение |
|------|-----------|
| `src/store/projectStore.js` | Добавить срез `pixelizer`, метод `setPhotoSettings`, `setPixelizerParam`. Добавить `color` к маскам в `addMask`. |
| `src/store/persistence.js` | Убедиться, что `photos` таблица создаётся; добавить хелперы `savePhoto`, `loadPhoto`, `deletePhoto`. |
| `src/components/room/MaskCard.jsx` | Добавить color picker к полям маски. |

---

## Новые файлы

| Файл | Что делает |
|------|------------|
| `src/components/pixelizer/PixelizerTab.jsx` | Заменяет заглушку |
| `src/components/pixelizer/WallCanvas.jsx` | Canvas одной стены |
| `src/components/pixelizer/PixelizerControls.jsx` | Нижняя панель |
| `src/components/pixelizer/PhotoSheet.jsx` | Шторка добавления фото |
| `src/components/pixelizer/WallsSheet.jsx` | Шторка видимости стен |
| `src/utils/pixelizerRenderer.js` | Логика рисования |
| `src/utils/pixelizerGeometry.js` | Пересчёт координат |
| `src/workers/pixelizerWorker.js` | Web Worker для > 5000 плиток |

---

## Out of Scope для Stage 4

- Индивидуальный цвет каждой плитки (это Stage 5 / Схема)
- 3D-вид (Stage 3)
- Экспорт развёртки как изображения (Stage 6 — Export tab)
- Редактирование маски прямо на развёртке (только через Room tab)
