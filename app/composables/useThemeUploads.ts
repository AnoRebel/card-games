/**
 * User-uploaded theme assets (card backs / table backgrounds), stored as Blobs
 * in Dexie/IndexedDB (the structured-persistent tier). Object URLs are derived
 * reactively for rendering and revoked on cleanup.
 */
import { useDb, type ThemeAsset } from '~/db'

const MAX_BYTES = 3 * 1024 * 1024 // 3 MB
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']

export interface UploadedAsset {
  id: number
  kind: 'card-back' | 'background'
  name: string
  url: string
}

export function useThemeUploads() {
  const db = useDb()

  const assets = useLiveQuery<ThemeAsset[]>(
    () => db.themeAssets.toArray(),
    [],
  )

  // Map blobs → object URLs, revoking stale ones when the list changes.
  const urls = ref<Map<number, string>>(new Map())
  watch(
    assets,
    (list) => {
      const next = new Map<number, string>()
      for (const a of list) {
        if (a.id === undefined) continue
        next.set(a.id, urls.value.get(a.id) ?? URL.createObjectURL(a.blob))
      }
      // Revoke URLs no longer present.
      for (const [id, url] of urls.value) {
        if (!next.has(id)) URL.revokeObjectURL(url)
      }
      urls.value = next
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    for (const url of urls.value.values()) URL.revokeObjectURL(url)
  })

  const cardBacks = computed<UploadedAsset[]>(() =>
    assets.value
      .filter((a) => a.kind === 'card-back' && a.id !== undefined)
      .map((a) => ({ id: a.id!, kind: 'card-back', name: a.name, url: urls.value.get(a.id!) ?? '' })),
  )
  const backgrounds = computed<UploadedAsset[]>(() =>
    assets.value
      .filter((a) => a.kind === 'background' && a.id !== undefined)
      .map((a) => ({ id: a.id!, kind: 'background', name: a.name, url: urls.value.get(a.id!) ?? '' })),
  )

  /** Validate + persist an uploaded file. Returns the new asset id or an error. */
  async function upload(
    file: File,
    kind: 'card-back' | 'background',
    name?: string,
  ): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
    if (!ACCEPTED.includes(file.type)) {
      return { ok: false, error: 'Unsupported image type' }
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: 'Image is too large (max 3 MB)' }
    }
    const id = await db.themeAssets.add({
      kind,
      name: name || file.name,
      blob: file,
      createdAt: new Date().toISOString(),
    })
    return { ok: true, id: id as number }
  }

  async function remove(id: number) {
    await db.themeAssets.delete(id)
  }

  return { cardBacks, backgrounds, upload, remove, ACCEPTED, MAX_BYTES }
}
