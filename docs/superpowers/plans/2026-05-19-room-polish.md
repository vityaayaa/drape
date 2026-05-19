# Room Polish 2.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить CSS-переменные дизайн-системы, иконки в навбар, валидацию полей > 0 и scrollIntoView после добавления маски.

**Architecture:** Четыре независимые задачи — З1 (App.css `:root`), З3 (TileForm цвет шва), З7 (App.jsx иконки), З8+З9 (WallCard/TileForm валидация + scroll). Каждая задача трогает изолированный файл. З2/З4/З5/З6 уже реализованы в сессии 1.2 — не трогаем.

**Tech Stack:** React 18, lucide-react (уже установлен), CSS custom properties

---

### Task 1: CSS-переменные дизайн-системы в :root

**Files:**
- Modify: `src/App.css` — добавить блок `:root` в начало файла (перед `*`)

- [ ] **Step 1: Добавить `:root` блок в App.css**

Открыть `src/App.css`. Вставить в самое начало файла (строка 1, перед `*, *::before, *::after`):

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

- [ ] **Step 2: Убедиться что переменные видны браузеру**

Запустить dev-сервер (`npm run dev`) и в DevTools > Elements > :root проверить наличие переменных `--bg`, `--accent` и т.д.

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(design): add CSS custom properties :root block (session 2.3)"
```

---

### Task 2: TileForm — цвет шва на всю ширину

**Files:**
- Modify: `src/components/room/TileForm.jsx` — строка с `colorLabel` в объекте `s`

- [ ] **Step 1: Убрать maxWidth из colorLabel**

В `src/components/room/TileForm.jsx` найти объект `s` в конце файла. Изменить строку `colorLabel`:

```js
// БЫЛО:
colorLabel: { flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative', maxWidth: 110 },

// СТАЛО:
colorLabel: { flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' },
```

- [ ] **Step 2: Проверить визуально**

В браузере открыть вкладку «Комната». Строка «Цвет шва» должна иметь цветовую полосу той же ширины, что поля «Ширина плитки», «Высота плитки» и т.д. (≈84px + единицы измерения).

- [ ] **Step 3: Commit**

```bash
git add src/components/room/TileForm.jsx
git commit -m "fix(room): stretch grout color swatch to match field width"
```

---

### Task 3: Навбар с иконками Lucide

**Files:**
- Modify: `src/App.jsx` — добавить импорт иконок, поле `icon` в TABS, иконку в JSX кнопки
- Modify: `src/App.css` — добавить `gap` и стиль для stub-вкладок

- [ ] **Step 1: Добавить иконки в App.jsx**

Открыть `src/App.jsx`. Заменить полностью:

```jsx
import { useProjectStore } from './store/projectStore.js'
import { LayoutGrid, Camera, Box, PenLine, Grid3x3 } from 'lucide-react'
import RoomTab from './components/room/RoomTab.jsx'
import PixelizerTab from './components/pixelizer/PixelizerTab.jsx'
import ViewerTab from './components/viewer/ViewerTab.jsx'
import ExportTab from './components/export/ExportTab.jsx'
import LayoutTab from './components/layout/LayoutTab.jsx'

const TABS = [
  { id: 'room',      label: 'Комната', icon: LayoutGrid },
  { id: 'pixelizer', label: 'Фото',    icon: Camera },
  { id: 'viewer',    label: '3D',      icon: Box },
  { id: 'export',    label: 'Схема',   icon: PenLine,  stub: true },
  { id: 'layout',    label: 'Укладка', icon: Grid3x3,  stub: true },
]

export default function App() {
  const { activeTab, setActiveTab } = useProjectStore()

  return (
    <div className="app">
      <div className="tab-content">
        <div className="tab-panel" style={{ display: activeTab === 'room' ? 'block' : 'none' }}>
          <RoomTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'pixelizer' ? 'block' : 'none' }}>
          <PixelizerTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'viewer' ? 'block' : 'none' }}>
          <ViewerTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'export' ? 'block' : 'none' }}>
          <ExportTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'layout' ? 'block' : 'none' }}>
          <LayoutTab />
        </div>
      </div>

      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            data-stub={tab.stub ? 'true' : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={22} strokeWidth={1.75} />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: Обновить стили навбара в App.css**

В `src/App.css` найти блок `.nav-tab` и добавить `gap: 3px` к существующим свойствам:

```css
.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 4px;
  background: none;
  border: none;
  color: #3f4a5e;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;
  -webkit-appearance: none;
}
```

Добавить в конец файла (после `.eye-pop` блока):

```css
/* ─── Stub tabs (Схема, Укладка) ─── */
.nav-tab[data-stub="true"] { color: #475569; }
.nav-tab[data-stub="true"].active { color: #a78bfa; }
```

- [ ] **Step 3: Проверить визуально**

В браузере проверить: иконки видны под текстом во всех 5 вкладках. Схема и Укладка — чуть темнее остальных. Активная вкладка — фиолетовая (иконка + текст).

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat(nav): add Lucide icons to bottom navigation bar"
```

---

### Task 4: Валидация полей > 0 в WallCard

**Files:**
- Modify: `src/components/room/WallCard.jsx` — добавить `touched` state, onBlur, error span, стиль `fieldError`

- [ ] **Step 1: Добавить touched state и валидацию**

Открыть `src/components/room/WallCard.jsx`. Добавить state после строки `const [deleteConfirm, setDeleteConfirm] = useState(false)`:

```js
const [touched, setTouched] = useState({})
```

- [ ] **Step 2: Обновить поле Длина в sizeRow**

Найти блок `<div style={s.field}>` для поля «Длина» и заменить его полностью:

```jsx
<div style={s.field}>
  <label style={s.fieldLabel}>Длина</label>
  <div style={s.inputWrap}>
    <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.length}
      onChange={(e) => updateWall(wall.id, 'length', e.target.value)}
      onBlur={() => setTouched(t => ({ ...t, length: true }))} />
    <span style={s.unit}>см</span>
  </div>
  {touched.length && !(Number(wall.length) > 0) && (
    <span style={s.fieldError}>Больше 0</span>
  )}
</div>
```

- [ ] **Step 3: Обновить поле Высота в sizeRow**

Найти блок `<div style={s.field}>` для поля «Высота» и заменить его полностью:

```jsx
<div style={s.field}>
  <label style={s.fieldLabel}>Высота</label>
  <div style={s.inputWrap}>
    <input style={s.input} type="number" min="0" step="any" placeholder="—" value={wall.height}
      onChange={(e) => updateWall(wall.id, 'height', e.target.value)}
      onBlur={() => setTouched(t => ({ ...t, height: true }))} />
    <span style={s.unit}>см</span>
  </div>
  {touched.height && !(Number(wall.height) > 0) && (
    <span style={s.fieldError}>Больше 0</span>
  )}
</div>
```

- [ ] **Step 4: Добавить стиль fieldError в объект s**

В объекте `s` в конце файла добавить:

```js
fieldError: { display: 'block', fontSize: 11, color: '#ef4444', marginTop: 2 },
```

- [ ] **Step 5: Проверить визуально**

В браузере: открыть вкладку «Комната», добавить стену. Кликнуть на поле «Длина», стереть значение, уйти с поля (blur) — должна появиться надпись «Больше 0» красным под полем. Ввести положительное число — ошибка исчезает.

- [ ] **Step 6: Commit**

```bash
git add src/components/room/WallCard.jsx
git commit -m "feat(room): inline validation for wall length/height (> 0)"
```

---

### Task 5: Валидация полей > 0 в TileForm

**Files:**
- Modify: `src/components/room/TileForm.jsx` — добавить `touched` state, onBlur, error span

- [ ] **Step 1: Импортировать useState**

Открыть `src/components/room/TileForm.jsx`. Изменить первую строку:

```js
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore.js'
```

- [ ] **Step 2: Добавить touched state**

В теле функции `TileForm`, после строки `const currentColor = ...` добавить:

```js
const [touched, setTouched] = useState({})
```

- [ ] **Step 3: Обновить рендер полей FIELDS**

Найти блок `{FIELDS.map(({ key, label, unit }) => (` и заменить его полностью:

```jsx
{FIELDS.map(({ key, label, unit }) => {
  const value = isOverride ? (overrides?.[key] ?? '') : tile[key]
  const showError = !isOverride && touched[key] && !(Number(value) > 0)
  return (
    <div key={key} style={s.row}>
      <label style={s.label}>{label}</label>
      <div style={s.inputWrap}>
        <input
          style={s.input}
          type="number"
          min="0"
          step="any"
          placeholder="—"
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          onBlur={() => !isOverride && setTouched(t => ({ ...t, [key]: true }))}
        />
        <span style={s.unit}>{unit}</span>
      </div>
      {showError && <span style={s.fieldError}>Больше 0</span>}
    </div>
  )
})}
```

- [ ] **Step 4: Добавить стиль fieldError в объект s**

В объекте `s` в конце файла добавить:

```js
fieldError: { display: 'block', fontSize: 11, color: '#ef4444', marginTop: 2 },
```

- [ ] **Step 5: Проверить визуально**

В браузере: открыть вкладку «Комната». В форме «Параметры плитки» кликнуть на «Ширина плитки», стереть значение, уйти с поля — должна появиться надпись «Больше 0». В override-форме внутри WallCard ошибка появляться не должна (поля там необязательны).

- [ ] **Step 6: Commit**

```bash
git add src/components/room/TileForm.jsx
git commit -m "feat(room): inline validation for tile dimensions (> 0)"
```

---

### Task 6: ScrollIntoView после добавления маски

**Files:**
- Modify: `src/components/room/WallCard.jsx` — добавить `useRef`, обновить addMask handler, добавить ref на список масок

- [ ] **Step 1: Добавить useRef в импорт**

В `src/components/room/WallCard.jsx` изменить первую строку:

```js
import { useState, useEffect, useRef } from 'react'
```

- [ ] **Step 2: Добавить ref на список масок**

В теле компонента `WallCard`, после строки `const [touched, setTouched] = useState({})`, добавить:

```js
const masksListRef = useRef(null)
```

- [ ] **Step 3: Добавить обработчик addMask со scroll**

Найти строку с кнопкой `+ Добавить` в masksHeader:

```jsx
<button style={s.addMaskBtn} onClick={() => addMask(wall.id)}>+ Добавить</button>
```

Заменить на:

```jsx
<button style={s.addMaskBtn} onClick={() => {
  addMask(wall.id)
  setTimeout(() => {
    const last = masksListRef.current?.lastElementChild
    last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, 50)
}}>+ Добавить</button>
```

- [ ] **Step 4: Добавить ref на контейнер масок**

Найти строку:

```jsx
{wall.masks.map(mask => <MaskCard key={mask.id} wallId={wall.id} mask={mask} />)}
```

Обернуть в div с ref:

```jsx
<div ref={masksListRef}>
  {wall.masks.map(mask => <MaskCard key={mask.id} wallId={wall.id} mask={mask} />)}
</div>
```

- [ ] **Step 5: Проверить визуально**

В браузере: добавить стену с несколькими масками (чтобы список маски вышел за экран). Нажать «+ Добавить» — страница должна плавно прокрутиться к новой маске.

- [ ] **Step 6: Commit**

```bash
git add src/components/room/WallCard.jsx
git commit -m "feat(room): scroll to new mask after addMask()"
```

---

### Task 7: Записать итоги сессии 2.3 в state.md

**Files:**
- Modify: `docs/sessions/state.md` — заменить блок «Сессия 2.3 — [ОЖИДАЕТ ВЫПОЛНЕНИЯ]»

- [ ] **Step 1: Обновить state.md**

Найти блок:
```
## Сессия 2.3 — [ОЖИДАЕТ ВЫПОЛНЕНИЯ]

*Результаты будут записаны сюда после завершения сессии.*
```

Заменить на:

```markdown
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
- `src/App.jsx` — З7: иконки Lucide в навбаре
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

Следующий блок — UI-задачи, запланированные в сессии 1.5 (перенесены через 2.2 → 2.3):
1. **SavedToast** (App.jsx) — pill «✓ Сохранено», Zustand subscribe + debounce 1500ms, fixed bottom-right над navbar.
2. **EmptyState компонент** (src/components/shared/EmptyState.jsx) — унифицированный icon+title+subtitle+button. Применить в ViewerTab и PixelizerTab.
3. **Tab fade-in** (App.css + App.jsx) — data-visible + @keyframes tabFadeIn 150ms. Выход мгновенный.
4. **ExportTab + LayoutTab** — tease-карточки с wireframe-превью и bullet-фичами (детали в сессии 1.5).
5. **RoomTab** — flow strip + улучшенный empty hint при walls.length===0.
6. **Таббар** — иконки добавлены в 2.3; Схема/Укладка уже #475569.
```

- [ ] **Step 2: Commit**

```bash
git add docs/sessions/state.md
git commit -m "docs: record session 2.3 — Room polish complete"
```
