import { openDB } from 'idb'
import { useProjectStore } from './projectStore.js'
import { useHistoryStore } from './historyStore.js'

const DB_NAME = 'drape'
const DB_VERSION = 1

let db = null

export async function initDB() {
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('project')) {
        database.createObjectStore('project')
      }
      if (!database.objectStoreNames.contains('photos')) {
        database.createObjectStore('photos')
      }
    },
  })
}

// Сохраняет текущее состояние + историю в IndexedDB
export async function saveAll() {
  if (!db) return
  const snapshot = useProjectStore.getState().getSnapshot()
  const history = {
    past: useHistoryStore.getState().past,
    future: useHistoryStore.getState().future,
  }
  await db.put('project', snapshot, 'state')
  await db.put('project', history, 'history')
}

// Восстанавливает состояние и историю из IndexedDB
export async function loadAll() {
  if (!db) return
  const state = await db.get('project', 'state')
  const history = await db.get('project', 'history')

  if (state) {
    useProjectStore.getState().restoreSnapshot(state)
  }
  if (history) {
    useHistoryStore.setState({
      past: history.past ?? [],
      future: history.future ?? [],
    })
  }
}
