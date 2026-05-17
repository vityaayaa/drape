# Этап 3 — Pixelizer: дизайн

Дата: 2026-05-12
Ветка: `stage_3`

---

## Область этапа

Вкладка «Фото»: плоская горизонтальная развёртка всех стен комнаты с двумя режимами работы — позиционирование фото и пикселизация (вычисление цвета каждой плитки из зоны фото). Маски-препятствия получают поле цвета (изменение в Room tab). Фотографии хранятся в отдельной таблице IndexedDB. Вычисленные цвета плиток сохраняются в основном хранилище и передаются в Stage 3 (3D) и Stage 5 (Схема). Undo/redo в проекте отсутствует.

---

## Два режима работы

### Режим 1 — Позиционирование («Фото»)

Пользователь загружает фото, двигает и масштабирует его, настраивает прозрачность. На каждой стене: фото видно сквозь «окна» плиток, швы непрозрачны в цвете шва (Вариант А).

### Режим 2 — Мозаика («Пикселизировать»)

После нажатия кнопки «Пикселизировать»: приложение вычисляет средний цвет каждой плитки из соответствующей зоны фото. Каждый тайл заливается вычисленным цветом. Швы — в цвете шва. Фото больше не видно — только цветная мозаика.

Переключение между режимами не уничтожает данные: всегда можно вернуться к позиционированию, перепозиционировать фото и нажать «Пикселизировать» заново.

---

## Что видит пользователь

### Верхняя зона — развёртка стен

Все активные (wall_active = true) стены рисуются в горизонтальный ряд на Canvas. Каждая стена — пропорциональный прямоугольник в масштабе от высоты экрана.

**Базовый масштаб:**
```
BASE_SCALE = (viewportHeight × 0.75) / maxWallHeight_mm
```
При старте — все стены влезают по высоте. Ширина может выходить за экран → горизонтальный скролл.

**Жесты:**
- Свайп одним пальцем по горизонтали → прокрутка развёртки
- Щипок двумя пальцами → зум всей развёртки (CSS transform scale)
- Тап на стену → выбрать стену (нижняя панель переключается)

**Отступ между стенами:** 16px (в масштабированных единицах).

### Нижняя панель управления

Фиксирована по низу экрана, над навигацией.

**Режим позиционирования — панель по умолчанию:**
```
[ Стены ▾ ]  [ + Фото ]  [ Сетка ]  [ Пикселизировать → ]
```

**Когда выбрана стена с фото (тап на стену), добавляется строка управления фото:**
```
[ X: __ мм ]  [ Y: __ мм ]  [ Масштаб: __% ]  [ Прозрачность: ─●── ]
```

**Режим мозаики:**
```
[ ← Назад к фото ]  [ Стены ▾ ]  [ Сетка ]
```

**Кнопка «Стены»** → шторка снизу:
- Список всех стен с чекбоксами (видимость)
- «Все» / «Сбросить»

**Кнопка «+ Фото»** → шторка снизу:
- «Добавить на все стены»
- Список конкретных стен (нажать → выбрать файл)

**Кнопка «Сетка»** → переключает отображение плиточной сетки на всех стенах.

**Кнопка «Пикселизировать →»** → запускает вычисление цветов, переключает в режим мозаики.

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
  mode: 'photo',             // 'photo' | 'mosaic'
  visibleWalls: null,        // null = все; string[] = список wall id
  gridVisible: true,
  photoSettings: {
    // wallId → позиция/прозрачность фото
    'w_123': {
      photoId: 'ph_456',     // ключ в IndexedDB таблице photos
      offsetX_mm: 0,
      offsetY_mm: 0,
      scale: 1.0,
      opacity: 1.0,
    }
  },
  tileColorsStale: {
    // wallId → true если photoSettings изменились после последней пикселизации
    'w_123': false,
  },
  tileColors: {
    // wallId → вычисленные цвета плиток
    'w_123': {
      '0_0': '#a3b4c2',      // ключ: "col_row", значение: hex-цвет
      '0_1': '#8fa2b1',
      // ...
    }
  }
}
```

`tileColors` сохраняется в IndexedDB вместе со всем проектом и передаётся в Stage 3 (3D) и Stage 5 (Схема).

### IndexedDB

Используется уже существующая таблица `photos` (заложена в Stage 1):
```
photos store: key=photoId (string), value=Blob
```
Blob-файлы хранятся отдельно от основного состояния проекта.

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
  pixelizerSampler.js       — вычисление среднего цвета тайла из зоны фото
```

---

## Алгоритм рендеринга (pixelizerRenderer.js)

### Режим «Фото» (Вариант А — шов вырезает фото)

```
drawWallPhoto(ctx, W, H, tileGrid, photo, photoSettings, masks):

  1. fillRect(0, 0, W, H) цветом #2a2a3a          // фон

  2. если gridVisible И tileGrid задан:
       a. fillRect(0, 0, W, H) цветом grout_color  // вся стена = цвет шва
       b. globalAlpha = photo ? photoSettings.opacity : 1.0
          Для каждого тайла (col, row) не внутри маски:
            ctx.save()
            ctx.beginPath()
            ctx.rect(tileX, tileY, tileW, tileH)
            ctx.clip()
            если photo: ctx.drawImage(photo, с учётом offset/scale)
            иначе:      ctx.fillStyle = '#3a3a4a'
                        ctx.fillRect(tileX, tileY, tileW, tileH)
            ctx.restore()
       c. globalAlpha = 1.0

  3. если НЕ gridVisible И photo:
       globalAlpha = photoSettings.opacity
       ctx.drawImage(photo, offsetX_px, offsetY_px, photoW_px, photoH_px)
       globalAlpha = 1.0

  4. Для каждой маски:
       globalAlpha = 0.55
       fillStyle = mask.color
       fillRect(maskX_px, maskY_px, maskW_px, maskH_px)
       globalAlpha = 1.0
```

### Режим «Мозаика»

```
drawWallMosaic(ctx, W, H, tileGrid, tileColors, masks):

  1. fillRect(0, 0, W, H) цветом grout_color      // фон = цвет шва

  2. Для каждого тайла (col, row) не внутри маски:
       color = tileColors['col_row'] ?? '#3a3a4a'
       fillStyle = color
       fillRect(tileX, tileY, tileW, tileH)

  3. Для каждой маски:
       globalAlpha = 0.55
       fillStyle = mask.color
       fillRect(maskX_px, maskY_px, maskW_px, maskH_px)
       globalAlpha = 1.0
```

---

## Алгоритм пикселизации (pixelizerSampler.js)

Вызывается при нажатии «Пикселизировать». Для каждой стены с фото и заданными параметрами плитки:

```
sampleWallColors(photo, photoSettings, tileGrid, canvasScale) → { 'col_row': hexColor }

  1. Создать offscreen canvas размером стены (W × H)
  2. Нарисовать фото с применением offset/scale/opacity
  3. Для каждого тайла (col, row) не внутри маски:
       a. px = getImageData(tileX, tileY, tileW, tileH)
       b. Вычислить средний R, G, B по всем пикселям зоны
       c. Сохранить как '#rrggbb'

  Возвращает объект { '0_0': '#a3b4c2', ... }
```

Для стен с > 5 000 плиток — вычисление в Web Worker (`src/workers/pixelizerWorker.js`) чтобы не блокировать UI.

---

## Сохранение фото

```
Пользователь выбирает файл
→ FileReader → Blob
→ idb.put('photos', blob, photoId)
→ projectStore.pixelizer.photoSettings[wallId] = { photoId, offsetX_mm: 0, ... }
→ Автосохранение projectStore срабатывает (photoSettings — часть снапшота)
→ При восстановлении: idb.get('photos', photoId) → ObjectURL
```

---

## UX-поведение

**Нет параметров плитки** → сетка и кнопка «Пикселизировать» недоступны; показывается только фото на фоне стены.

**Нет фото** → режим «Фото» показывает нейтральный цвет `#3a3a4a` в каждом тайл-окне. Режим «Мозаика» недоступен (нечего пикселизировать).

**Стена без размеров** → прямоугольник-заглушка с надписью «нет данных».

**Перепозиционировал фото после пикселизации** → `tileColorsStale[wallId]` выставляется в `true`; кнопка «Пикселизировать» подсвечивается как «обновить». После повторной пикселизации флаг сбрасывается.

**Удаление стены** → удаляются `photoSettings[wallId]`, `tileColors[wallId]`, `tileColorsStale[wallId]`, запись в IndexedDB `photos`.

---

## Изменения в существующих файлах

| Файл | Изменение |
|------|-----------|
| `src/store/projectStore.js` | Добавить срез `pixelizer`, методы `setPhotoSettings`, `setTileColors`, `setPixelizerMode`, `setPixelizerParam`. Добавить `color` к маскам в `addMask`. |
| `src/store/persistence.js` | Убедиться, что таблица `photos` создаётся; добавить хелперы `savePhoto`, `loadPhoto`, `deletePhoto`. |
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
| `src/utils/pixelizerRenderer.js` | Логика рисования (оба режима) |
| `src/utils/pixelizerGeometry.js` | Пересчёт координат |
| `src/utils/pixelizerSampler.js` | Вычисление среднего цвета тайла |
| `src/workers/pixelizerWorker.js` | Web Worker для > 5 000 плиток |

---

## Вне области Stage 4

- Ручное редактирование цвета отдельной плитки (Stage 5 — Схема)
- 3D-вид (Stage 3)
- Экспорт развёртки как изображения (Stage 6 — Export tab)
- Редактирование маски прямо на развёртке (только через Room tab)
