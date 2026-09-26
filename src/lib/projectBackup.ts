import { idbDel, idbGet, idbPut, revokeAssetUrl } from './assetsDb'
import { useAppStore, type UserAssetMeta } from '../store/useAppStore'
import type { HouseDef } from '../data/house'
import type { PlacedItem } from '../store/useAppStore'

export const BACKUP_VERSION = 1

export type ProjectBackup = {
  version: number
  app: 'emlakvr'
  exportedAt: string
  state: {
    house: HouseDef
    activeRoomId: string
    items: PlacedItem[]
    userAssets: UserAssetMeta[]
    customCategories: string[]
    promisedItems: PlacedItem[] | null
    deliveredItems: PlacedItem[] | null
    snapMm: number
    showMeasures: boolean
    hiddenCatalogIds: string[]
  }
  blobs: Record<string, { mime: string; data: string }>
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = String(reader.result ?? '')
      const i = s.indexOf(',')
      resolve(i >= 0 ? s.slice(i + 1) : s)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(data: string, mime: string): Blob {
  const bin = atob(data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime || 'model/gltf-binary' })
}

export async function buildProjectBackup(): Promise<ProjectBackup> {
  const s = useAppStore.getState()
  const blobs: ProjectBackup['blobs'] = {}
  for (const a of s.userAssets) {
    const blob = await idbGet(a.assetId)
    if (!blob) continue
    blobs[a.assetId] = {
      mime: blob.type || 'model/gltf-binary',
      data: await blobToBase64(blob),
    }
  }
  return {
    version: BACKUP_VERSION,
    app: 'emlakvr',
    exportedAt: new Date().toISOString(),
    state: {
      house: structuredClone(s.house),
      activeRoomId: s.activeRoomId,
      items: structuredClone(s.items),
      userAssets: structuredClone(s.userAssets),
      customCategories: [...s.customCategories],
      promisedItems: s.promisedItems ? structuredClone(s.promisedItems) : null,
      deliveredItems: s.deliveredItems ? structuredClone(s.deliveredItems) : null,
      snapMm: s.snapMm,
      showMeasures: s.showMeasures,
      hiddenCatalogIds: [...s.hiddenCatalogIds],
    },
    blobs,
  }
}

export async function downloadProjectBackup(filename?: string) {
  const backup = await buildProjectBackup()
  const name =
    filename ??
    `emlakvr-${(backup.state.house.name || 'proje').replace(/\s+/g, '-').toLowerCase()}-${backup.exportedAt.slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export async function importProjectBackup(file: File): Promise<void> {
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Geçersiz JSON dosyası')
  }
  const backup = raw as ProjectBackup
  if (!backup || backup.app !== 'emlakvr' || !backup.state || !backup.blobs) {
    throw new Error('Bu dosya EmlakVR yedeği değil')
  }

  const prev = useAppStore.getState().userAssets
  for (const a of prev) {
    revokeAssetUrl(a.assetId)
    await idbDel(a.assetId)
  }

  for (const [id, entry] of Object.entries(backup.blobs)) {
    await idbPut(id, base64ToBlob(entry.data, entry.mime))
  }

  useAppStore.getState().hydrateFromBackup(backup.state)
}
