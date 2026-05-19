---
name: room-polish-session-2.3
description: Полировка вкладки Комната — CSS-переменные, иконки навбара, валидация, scrollIntoView, цвет шва
metadata:
  type: project
---

# Сессия 2.3 — Полировка вкладки «Комната»

## Статус задач

| # | Задача | Статус |
|---|---|---|
| З1 | CSS-переменные `:root` | **Новое** |
| З2 | CornersSection layout | Уже выполнено в 1.2 |
| З3 | TileForm colorSwatch ширина | **Новое** (убрать maxWidth: 110) |
| З4 | WallCard override btn | Уже выполнено в 1.2 |
| З5 | SummarySection grid | Уже выполнено в 1.2 |
| З6 | WallCard удаление с confirm | Уже выполнено в 1.2 |
| З7 | Таббар с иконками | **Новое** |
| З8 | Валидация > 0 | **Новое** |
| З9 | ScrollIntoView после addMask | **Новое** |

## З1 — CSS-переменные в :root

Добавить в `src/App.css` блок `:root` со всеми токенами дизайн-системы Dark Glow (сессия 1.1).
Inline-стили компонентов **не трогаем** — это рефакторинг для другой сессии.

```css
:root {
  --bg:              #08080f;
  --surface-1:       #0e1018;
  --surface-2:       #141820;
  --surface-overlay: rgba(8,8,15,0.92);
  --accent:          #7c3aed;
  --accent-light:    #a78bfa;
  --accent-glow:     rgba(124,58,237,0.25);
  --text-primary:    #f1f5f9;
  --text-secondary:  #94a3b8;
  --text-hint:       #64748b;
  --text-disabled:   #334155;
  --border:          rgba(255,255,255,0.07);
  --border-strong:   rgba(255,255,255,0.12);
  --border-focus:    rgba(124,58,237,0.60);
  --error:           #ef4444;
  --success:         #22c55e;
  --warning:         #f59e0b;
  --radius-card:     16px;
  --radius-btn:      12px;
  --radius-input:    10px;
}
```

Файл: `src/App.css`

## З3 — TileForm: цвет шва на всю ширину

Проблема: `colorLabel` имеет `maxWidth: 110` — ограничивает ширину colorSwatch.

Решение: убрать `maxWidth: 110` из `colorLabel`. `flex: 1` уже стоит — colorSwatch растянется до ширины других inputWrap.

Файл: `src/components/room/TileForm.jsx`

## З7 — Нижний таббар с иконками

Lucide-иконки под текстом каждой вкладки. Иконки 22px.

Иконки по сессии 1.1:
- Комната → `LayoutGrid`
- Фото → `Camera`
- 3D → `Box`
- Схема → `PenLine`
- Укладка → `Grid3x3`

Изменения в `src/App.jsx`:
- Импортировать иконки из `lucide-react`
- Добавить поле `icon` в TABS
- В JSX рендерить `<tab.icon size={22} />` над текстом

Стиль иконки — наследует цвет от `.nav-tab` (color). Добавить в `App.css` для `.nav-tab`:
```css
gap: 3px;  /* между иконкой и текстом */
```

Вкладки-заглушки (Схема, Укладка) — цвет в неактивном состоянии `#475569` (мутнее `#3f4a5e` у активных вкладок). Реализация: добавить `data-stub="true"` атрибут на кнопки export/layout, добавить в CSS:
```css
.nav-tab[data-stub="true"] { color: #475569; }
.nav-tab[data-stub="true"].active { color: #a78bfa; }
```

Файлы: `src/App.jsx`, `src/App.css`

## З8 — Валидация размеров (> 0)

Показывать inline-ошибку под полем при значении ≤ 0 или пустом (после первого взаимодействия с полем — при blur).

**Паттерн:** `touched` state на каждое поле. Ошибка показывается только если `touched[key] === true`.

### WallCard

Поля: `length`, `height`.

```jsx
const [touched, setTouched] = useState({})

// на input добавить:
onBlur={() => setTouched(t => ({ ...t, [fieldKey]: true }))}

// под input:
{touched[fieldKey] && Number(wall[fieldKey]) <= 0 && (
  <span style={s.fieldError}>Должно быть больше 0</span>
)}
```

Стиль: `fieldError: { fontSize: 11, color: '#ef4444', marginTop: 2, display: 'block' }`

### TileForm

Поля: `tile_width`, `tile_height` (только в основной форме, не в override — там поля необязательны).

Тот же паттерн с `touched`. Ошибка только когда `!isOverride && touched[key] && Number(value) <= 0`.

Файлы: `src/components/room/WallCard.jsx`, `src/components/room/TileForm.jsx`

## З9 — ScrollIntoView после addMask

После `addMask(wall.id)` прокрутить к только что добавленной маске.

Реализация в `WallCard.jsx`:
- Хранить `useRef` на список масок `masksListRef`
- После `addMask` через `setTimeout(() => { const last = masksListRef.current?.lastElementChild; last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, 50)`

50мс — время на ре-рендер React перед scrollIntoView.

Файл: `src/components/room/WallCard.jsx`

## Затронутые файлы

1. `src/App.css` — З1 (`:root` переменные), З7 (иконки nav-tab)
2. `src/App.jsx` — З7 (иконки + TABS)
3. `src/components/room/TileForm.jsx` — З3 (maxWidth), З8 (валидация)
4. `src/components/room/WallCard.jsx` — З8 (валидация), З9 (scrollIntoView)
