# Сессионные промпты — проект Drape

## Как использовать

Каждая сессия:
1. Читает `state.md` — результаты предыдущих сессий
2. Выполняет свою работу
3. Дописывает свой блок в `state.md` перед завершением

Файл `state.md` — живой документ, накапливающий все решения.

## Порядок сессий

### Фаза 1 — Дизайн (ui-ux-pro-max)
- [1.1](prompts/1.1-design-system.md) — Дизайн-система и единый стиль
- [1.2](prompts/1.2-room-ui.md) — Комната: UI-доработки
- [1.3](prompts/1.3-photo-ui.md) — Фото: UI-доработки
- [1.4](prompts/1.4-3d-ui.md) — 3D: viewport и интерфейс
- [1.5](prompts/1.5-onboarding.md) — Онбординг и связь вкладок

### Фаза 2 — Код (brainstorming + superpowers)
- [2.1](prompts/2.1-photo-bugs.md) — Критичные баги вкладки Фото
- [2.2](prompts/2.2-3d-overhaul.md) — Переработка 3D-вьюера
- [2.3](prompts/2.3-room-polish.md) — Полировка Комнаты
- [2.4](prompts/2.4-animations.md) — Анимации
- [2.5](prompts/2.5-onboarding-impl.md) — Реализация онбординга
