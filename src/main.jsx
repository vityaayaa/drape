import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import './animations.css'
import { initDB, loadAll, saveAll } from './store/persistence.js'
import { useProjectStore } from './store/projectStore.js'

async function bootstrap() {
  // 1. Открыть базу данных
  await initDB()

  // 2. Восстановить сохранённое состояние
  await loadAll()

  // 3. Отрисовать приложение
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )

  // 4. Подписаться на изменения — авто-сохранение с debounce, чтобы не спамить
  //    IndexedDB на каждый тик слайдера (цветокоррекция, прозрачность и т.п.).
  let saveTimer = null
  useProjectStore.subscribe(() => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveAll(), 400)
  })
}

bootstrap()
