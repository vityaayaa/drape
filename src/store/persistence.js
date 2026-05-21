import { openDB } from 'idb'
import { useProjectStore } from './projectStore.js'

const DB_NAME = 'drape'
const DB_VERSION = 1

let db = null

export async function initDB() {
  try {
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
  } catch (e) {
    console.warn('[persistence] IndexedDB unavailable:', e.message)
    db = null
  }
}

export async function saveAll() {
  if (!db) return
  try {
    const snapshot = useProjectStore.getState().getSnapshot()
    const { activeTab } = useProjectStore.getState()
    await db.put('project', snapshot, 'state')
    await db.put('project', activeTab, 'activeTab')
  } catch (e) {
    console.warn('[persistence] saveAll failed:', e.message)
  }
}

export async function loadAll() {
  if (!db) return null
  try {
    const state = await db.get('project', 'state')
    const activeTab = await db.get('project', 'activeTab')

    if (state) {
      useProjectStore.getState().restoreSnapshot(state)
    }
    if (activeTab) {
      useProjectStore.getState().setActiveTab(activeTab)
    }
  } catch (e) {
    console.warn('[persistence] loadAll failed:', e.message)
    return null
  }
}

export async function savePhoto(photoId, blob) {
  if (!db) return
  await db.put('photos', blob, photoId)
}

export async function loadPhoto(photoId) {
  if (!db) return null
  return db.get('photos', photoId)
}

export async function deletePhoto(photoId) {
  if (!db) return
  await db.delete('photos', photoId)
}
