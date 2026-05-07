import { openDB } from 'idb'
import { useProjectStore } from './projectStore.js'

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

export async function saveAll() {
  if (!db) return
  const snapshot = useProjectStore.getState().getSnapshot()
  const { activeTab } = useProjectStore.getState()
  await db.put('project', snapshot, 'state')
  await db.put('project', activeTab, 'activeTab')
}

export async function loadAll() {
  if (!db) return
  const state = await db.get('project', 'state')
  const activeTab = await db.get('project', 'activeTab')

  if (state) {
    useProjectStore.getState().restoreSnapshot(state)
  }
  if (activeTab) {
    useProjectStore.getState().setActiveTab(activeTab)
  }
}
