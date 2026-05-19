# Спек: Сессия 2.4 — Анимации + отложенные задачи 1.5

**Дата:** 2026-05-19  
**Стек:** React 18, CSS transitions/keyframes (без новых зависимостей)

---

## Инфраструктура

### `src/animations.css`
Новый файл, импортируется в `src/main.jsx` (или `src/App.jsx`). Содержит все `@keyframes` и утилитарные классы. В конце файла — один блок `@media (prefers-reduced-motion: reduce)` который обнуляет все длительности до 0.

---

## Блок А — Анимации

### З1 + З2: WallCard / MaskCard — появление и исчезновение

**Появление (mount):**
- Класс `.anim-card-enter` на корневом `<div>` карточки
- `@keyframes cardSlideDown`: `from { opacity: 0; transform: translateY(-10px); }` → `to { opacity: 1; transform: translateY(0); }`
- Длительность: 220ms ease-out
- Класс добавляется сразу при рендере (всегда присутствует на карточке, CSS анимирует при mount автоматически)

**Исчезновение (before removeWall / removeMask):**
- Локальный state `leaving` в WallCard и MaskCard (по аналогии с уже существующим `deleteConfirm` в WallCard)
- При подтверждении удаления: `setLeaving(true)` + `setTimeout(() => removeWall(wall.id), 190)`
- Класс `.anim-card-exit` при `leaving === true`
- `@keyframes cardSlideUp`: `from { opacity: 1; transform: translateY(0); }` → `to { opacity: 0; transform: translateY(-8px); }`
- Длительность: 180ms ease-in

**Примечание по MaskCard:** у неё нет `deleteConfirm` диалога — кнопка удаляет сразу. Добавить `leaving` state: клик → `setLeaving(true)` + setTimeout → `removeMask(wallId, mask.id)`.

### З3: Переключение вкладок — fade-in при входе

Из дизайна 1.5 (уже зафиксировано):

```css
.tab-panel[data-visible="true"] {
  animation: tabFadeIn 150ms ease-out both;
}
@keyframes tabFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

В `App.jsx`: заменить `style={{ display: activeTab === id ? 'block' : 'none' }}` на `data-visible={activeTab === id}` + CSS `display: none` для `[data-visible="false"]`. Выход — мгновенный (display:none), вход — fade 150ms.

**Важно:** 3D-вкладка при `display: none` останавливает render-loop Three.js — это желаемое поведение (экономия батареи). Нельзя заменять на `opacity/visibility`.

### З4: Feedback на кнопки

**«+ Добавить стену»:**
- `@keyframes btnTap`: `0% { transform: scale(1); } 50% { transform: scale(0.95); } 100% { transform: scale(1); }`
- Класс `.btn-tap` на время 120ms. Добавляется через `onPointerDown`, убирается через `transitionend` или setTimeout 120ms.
- Реализовать как хук `useTapFeedback()` → возвращает `{ tapping, onPointerDown }`.

**«Пикселизировать»:**
- При `sampling === true` кнопка получает класс `.btn-loading`
- CSS спиннер через `::before` псевдоэлемент: `border: 2px solid rgba(255,255,255,0.2); border-top-color: white; border-radius: 50%; width: 14px; height: 14px; animation: spin 600ms linear infinite;`
- Текст кнопки заменяется на «Обрабатываю…» (уже меняется на `'...'` — улучшить до читаемого)

**Кнопка удаления (✕ в WallCard):**
- `@keyframes deleteFlash`: `0% { background: transparent; } 40% { background: rgba(239,68,68,0.2); } 100% { background: transparent; }`
- Класс `.btn-delete-flash` на 150ms при `onPointerDown`

### З5: Bottom sheets — появление/исчезновение

Применяется к `WallSelectSheet.jsx`, `WallsSheet.jsx`, `PhotoSheet.jsx`.

**Появление:**
- Класс `.sheet-enter` на корневом div шита
- `@keyframes sheetSlideUp`: `from { transform: translateY(100%); opacity: 0.6; }` → `to { transform: translateY(0); opacity: 1; }`
- 250ms ease-out

**Исчезновение:**
- Prop `onClose` сейчас вызывает скрытие мгновенно (через состояние в родителе)
- Добавить `leaving` state внутри шита: кнопка закрытия → `setLeaving(true)` + setTimeout 200ms → `onCancel()`
- При `leaving` → класс `.sheet-exit`
- `@keyframes sheetSlideDown`: `from { transform: translateY(0); opacity: 1; }` → `to { transform: translateY(100%); opacity: 0.6; }`
- 200ms ease-in

### З6: Toast — slide in/out

Файл: `src/components/pixelizer/Toast.jsx`.

**Появление:** `@keyframes toastSlideIn`: `from { transform: translateY(20px); opacity: 0; }` → `to { transform: translateY(0); opacity: 1; }` — 200ms ease-out.

**Исчезновение:** toast уже скрывается после таймаута. Добавить `leaving` state с классом `.toast-exit`: `@keyframes toastSlideOut` — обратная анимация 150ms, перед размонтированием.

### З7: SavedToast — индикатор автосохранения

Новый компонент `src/components/shared/SavedToast.jsx`.

**Логика:**
- Zustand subscribe на весь store (или на конкретные поля: `walls`, `tileWidth`, `tileHeight`, `tileColor`, `groutColor`)
- Debounce 1500ms → показать pill на 2000ms → fade out 200ms
- Видим только на вкладках `room`, `pixelizer`, `viewer`

**Стиль (из дизайна 1.5):**
```
position: fixed
bottom: calc(57px + env(safe-area-inset-bottom, 0px) + 8px)
right: 16px
background: rgba(34, 197, 94, 0.12)
border: 1px solid rgba(34, 197, 94, 0.25)
color: #22c55e
fontSize: 11px, fontWeight: 500
padding: 4px 10px, borderRadius: 20px
opacity transition 200ms ease-in-out
```

**Текст:** `✓ Сохранено`

**Монтируется в `App.jsx`** над `<nav>`.

---

## Блок Б — Отложенные задачи 1.5

### EmptyState компонент

Новый `src/components/shared/EmptyState.jsx`.

**Props:** `{ icon: ReactNode, title: string, subtitle: string, actionLabel?: string, onAction?: () => void }`

**Стиль:** `position: absolute; inset: 0; display: flex; flexDirection: column; alignItems: center; justifyContent: center; gap: 12px; padding: 32px; textAlign: center`

**Применить:**
- `ViewerTab.jsx`: заменить `<p>` на `<EmptyState icon={<Box />} title="Нет стен для 3D-просмотра" subtitle="Заполните длину и высоту хотя бы одной стены" actionLabel="→ Перейти в Комнату" onAction={() => setActiveTab('room')} />`
- `PixelizerTab.jsx`: при `walls.length === 0` → `<EmptyState icon={<Camera />} title="Сначала добавь стены" subtitle="Фото накладывается только когда есть стена с размерами" actionLabel="→ Перейти в Комнату" onAction={() => setActiveTab('room')} />`

### Tab fade-in

Уже описан в З3 — реализуется там же.

### ExportTab — тизерная карточка

Файл: `src/components/export/ExportTab.jsx`. Полностью заменить содержимое.

- Иконка `PenLine` 36px, `#818cf8`, opacity 0.4
- «Схема укладки» — 18px/600, `#f1f5f9`
- Бейдж «В разработке» — pill: `background: rgba(124,58,237,0.15)`, `color: #a78bfa`, 11px
- CSS тайловая сетка 5×4: `border: 1px solid rgba(255,255,255,0.06)`, один тайл `background: rgba(124,58,237,0.2)`
- Фичи (12px, `#64748b`): «Экспорт схемы для мастера», «Разметка с порезами», «PDF + PNG»

### LayoutTab — тизерная карточка

Файл: `src/components/layout/LayoutTab.jsx`. Полностью заменить содержимое.

- Иконка `Grid3x3` 36px, `#818cf8`, opacity 0.4
- «План покупки» — 18px/600
- Бейдж «В разработке»
- Мини-таблица: строки «Стена 1 / 48», «Стена 2 / 32», «Итого +10% / 88»
- Фичи: «Подсчёт плитки по стенам», «Запас на бой (+10%)», «Список для магазина»

Вайрфрейм-блок стиль: `background: #0e1018; border: 1px solid rgba(255,255,255,0.06); borderRadius: 8px; padding: 8px`

### RoomTab — flow strip + empty hint

Файл: `src/components/room/RoomTab.jsx`.

**Flow strip** (видна только при `walls.length === 0`, над TileForm):
```
Комната → Фото → 3D → Схема → Укладка
```
Текущий шаг «Комната» — `#a78bfa`, fontWeight 600. Остальные — `#334155`. Шрифт 10px. Разделитель `→` в `#334155`.

**Empty hint** (в месте, где сейчас серый текст при отсутствии стен):
- Иконка `LayoutGrid` 28px, `#818cf8`, opacity 0.3
- «Стен пока нет» — 15px, `#94a3b8`
- «Нажмите "Добавить стену" ниже» — 13px, `#64748b`

### Таббар — стиль заглушек

В `App.jsx` (или nav CSS): вкладки `export` и `layout` — `color: #475569` вместо `#94a3b8`. Сигнал пользователю: «здесь пока нечего делать».

---

## prefers-reduced-motion

Один блок в конце `animations.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Порядок реализации

1. `src/animations.css` — все `@keyframes` и утилитарные классы
2. WallCard + MaskCard — `leaving` state + классы
3. Bottom sheets — `leaving` state + классы
4. Toast.jsx — slide in/out
5. Кнопки — tap feedback + loading spinner
6. Tab fade-in (App.jsx + App.css)
7. SavedToast компонент + монтаж в App.jsx
8. EmptyState компонент + применение в ViewerTab/PixelizerTab
9. ExportTab тизер
10. LayoutTab тизер
11. RoomTab flow strip + empty hint
12. Таббар — стиль заглушек
13. Запись результатов в `docs/sessions/state.md`
