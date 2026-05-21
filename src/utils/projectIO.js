import { loadPhoto, savePhoto } from '../store/persistence.js'
import { useProjectStore } from '../store/projectStore.js'

export async function exportProject() {
  const snapshot = useProjectStore.getState().getSnapshot()
  const photoIds = [...new Set(
    Object.values(snapshot.pixelizer?.photoSettings ?? {})
      .map(s => s?.photoId).filter(Boolean)
  )]

  const photos = {}
  for (const photoId of photoIds) {
    const blob = await loadPhoto(photoId)
    if (blob) {
      const ab = await blob.arrayBuffer()
      const bytes = new Uint8Array(ab)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      photos[photoId] = { data: btoa(binary), type: blob.type }
    }
  }

  const payload = { version: 1, snapshot, photos }
  const json = JSON.stringify(payload)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `drape-project-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importProject(file) {
  const text = await file.text()
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('Невалидный JSON')
  }

  if (payload.version !== 1 || !payload.snapshot) {
    throw new Error('Неверный формат файла')
  }

  const { snapshot } = payload
  if (!Array.isArray(snapshot.walls) || typeof snapshot.tile !== 'object') {
    throw new Error('Повреждённый файл проекта')
  }

  const photos = payload.photos ?? {}
  for (const [photoId, { data, type }] of Object.entries(photos)) {
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type })
    await savePhoto(photoId, blob)
  }

  useProjectStore.getState().restoreSnapshot(snapshot)
}
