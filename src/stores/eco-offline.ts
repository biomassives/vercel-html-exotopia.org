import { defineStore }  from 'pinia'
import { ref, computed } from 'vue'
import { supabase }      from 'src/lib/supabase'
import { useRewardsStore } from './rewards'

// ── Types ─────────────────────────────────────────────────────────────────

export type RecordType =
  | 'water_quality'
  | 'macroinvertebrate'
  | 'tick_drag'
  | 'phenology'
  | 'pfas_sample'
  | 'cso_event'

export interface QueuedSubmission {
  id:         string
  type:       'monitoring_record' | 'water_quality_obs' | 'macroinvertebrate_sample'
  siteId:     string
  siteName:   string
  payload:    Record<string, unknown>
  photos:     string[]    // resized base64 JPEG data-URIs (≤ ~150 KB each)
  status:     'pending' | 'syncing' | 'synced' | 'failed'
  enqueuedAt: string
  syncedAt?:  string
  error?:     string
  retries:    number
}

export interface MonitoringDraft {
  draftKey:   string      // crypto.randomUUID() — one per wizard session
  siteId:     string
  siteName:   string
  recordType: RecordType | null
  step:       number
  observedAt: string
  formData:   Record<string, unknown>
  photos:     string[]    // resized base64 JPEG data-URIs
  notes:      string
  savedAt:    string
}

// ── Table name mapping (eco_ops schema) ──────────────────────────────────

const TABLE: Record<QueuedSubmission['type'], string> = {
  monitoring_record:        'monitoring_records',
  water_quality_obs:        'water_quality_obs',
  macroinvertebrate_sample: 'macroinvertebrate_samples',
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────
// DB version 2: adds draft-store alongside existing submission-queue (v1)

const DB_NAME    = 'eco-ops-offline'
const DB_VERSION = 2
const Q_STORE    = 'submission-queue'
const D_STORE    = 'draft-store'

let _db: IDBDatabase | null = null

function openDb(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(Q_STORE)) {
        const q = db.createObjectStore(Q_STORE, { keyPath: 'id' })
        q.createIndex('status',     'status',     { unique: false })
        q.createIndex('siteId',     'siteId',     { unique: false })
        q.createIndex('enqueuedAt', 'enqueuedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(D_STORE)) {
        const d = db.createObjectStore(D_STORE, { keyPath: 'draftKey' })
        d.createIndex('siteId',  'siteId',  { unique: false })
        d.createIndex('savedAt', 'savedAt', { unique: false })
      }
    }
    req.onsuccess = () => { _db = req.result; resolve(req.result) }
    req.onerror   = () => reject(req.error)
  })
}

async function idbAll<T>(store: string): Promise<T[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror   = () => reject(req.error)
  })
}

async function idbPut(store: string, item: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(item)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

async function idbDel(store: string, key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ── Pinia store ───────────────────────────────────────────────────────────

export const useEcoOfflineStore = defineStore('ecoOffline', () => {

  const queue       = ref<QueuedSubmission[]>([])
  const drafts      = ref<MonitoringDraft[]>([])
  const online      = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const panelOpen   = ref(false)
  const syncing     = ref(false)
  const initialised = ref(false)

  const pending      = computed(() => queue.value.filter(q => q.status === 'pending'))
  const failed       = computed(() => queue.value.filter(q => q.status === 'failed'))
  const syncedItems  = computed(() => queue.value.filter(q => q.status === 'synced'))
  const pendingCount = computed(() => pending.value.length)
  const failedCount  = computed(() => failed.value.length)
  const draftCount   = computed(() => drafts.value.length)

  // ── Bootstrap ──────────────────────────────────────────────────────────

  async function init() {
    if (initialised.value) return
    await Promise.all([refreshQueue(), refreshDrafts()])
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    if (online.value && pending.value.length) void syncNow()
    initialised.value = true
  }

  function onOnline()  { online.value = true;  void syncNow() }
  function onOffline() { online.value = false }

  async function refreshQueue() {
    const items = await idbAll<QueuedSubmission>(Q_STORE)
    queue.value = items.sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt))
  }

  async function refreshDrafts() {
    const items = await idbAll<MonitoringDraft>(D_STORE)
    drafts.value = items.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  }

  // ── Queue management ───────────────────────────────────────────────────

  async function enqueue(
    item: Omit<QueuedSubmission, 'id' | 'enqueuedAt' | 'status' | 'retries'>
  ): Promise<string> {
    const entry: QueuedSubmission = {
      ...item,
      id:         crypto.randomUUID(),
      status:     'pending',
      enqueuedAt: new Date().toISOString(),
      retries:    0,
    }
    await idbPut(Q_STORE, entry)
    queue.value = [...queue.value, entry]
    if (online.value) void syncNow()
    return entry.id
  }

  async function patchQueueItem(id: string, patch: Partial<QueuedSubmission>) {
    const item = queue.value.find(q => q.id === id)
    if (!item) return
    const updated = { ...item, ...patch }
    await idbPut(Q_STORE, updated)
    queue.value = queue.value.map(q => q.id === id ? updated : q)
  }

  async function removeQueueItem(id: string) {
    await idbDel(Q_STORE, id)
    queue.value = queue.value.filter(q => q.id !== id)
  }

  async function retryItem(id: string) {
    await patchQueueItem(id, { status: 'pending', error: undefined })
    if (online.value) void syncNow()
  }

  // Remove synced items older than maxAgeDays to keep IDB from growing unbounded
  async function cleanSynced(maxAgeDays = 7) {
    const cutoff = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString()
    const old = syncedItems.value.filter(q => (q.syncedAt ?? '') < cutoff)
    await Promise.all(old.map(q => removeQueueItem(q.id)))
  }

  // ── Sync engine ────────────────────────────────────────────────────────

  async function syncNow() {
    if (!supabase || !online.value || syncing.value) return
    const items = queue.value.filter(q => q.status === 'pending')
    if (!items.length) return

    syncing.value = true
    try {
      for (const item of items) {
        await patchQueueItem(item.id, { status: 'syncing' })
        try {
          const { error } = await supabase
            .schema('eco_ops')
            .from(TABLE[item.type])
            .insert(item.payload)
          if (error) throw error

          void useRewardsStore().logVolunteerAction('eco_submission', { type: item.type, siteId: item.siteId })

          const photoWarnings: string[] = []
          for (let i = 0; i < item.photos.length; i++) {
            const dataUri = item.photos[i]
            if (!dataUri) continue
            try {
              const blob = dataUriToBlob(dataUri)
              const ext  = blob.type.split('/')[1] ?? 'jpg'
              const { error: photoErr } = await supabase.storage
                .from('eco-ops-photos')
                .upload(`monitoring/${item.siteId}/${item.id}-${i}.${ext}`, blob, { upsert: true })
              if (photoErr) photoWarnings.push(photoErr.message)
            } catch (pe) {
              photoWarnings.push(String(pe))
            }
          }

          const patch: Partial<QueuedSubmission> = {
            status:   'synced',
            syncedAt: new Date().toISOString(),
          }
          if (photoWarnings.length) {
            // Record is in Supabase; photos failed. Log as warning, not a sync failure.
            patch.error = `⚠ ${photoWarnings.length} photo(s) failed to upload: ${photoWarnings.join('; ')}`
          }
          await patchQueueItem(item.id, patch)

        } catch (err) {
          await patchQueueItem(item.id, {
            status:  'failed',
            error:   String(err),
            retries: (item.retries ?? 0) + 1,
          })
        }
      }
    } finally {
      syncing.value = false
    }
  }

  // ── Draft management ───────────────────────────────────────────────────

  async function saveDraft(draft: MonitoringDraft) {
    const updated = { ...draft, savedAt: new Date().toISOString() }
    await idbPut(D_STORE, updated)
    const idx = drafts.value.findIndex(d => d.draftKey === draft.draftKey)
    if (idx >= 0) {
      const next = [...drafts.value]
      next[idx] = updated
      drafts.value = next
    } else {
      drafts.value = [updated, ...drafts.value]
    }
  }

  async function deleteDraft(draftKey: string) {
    await idbDel(D_STORE, draftKey)
    drafts.value = drafts.value.filter(d => d.draftKey !== draftKey)
  }

  function draftsForSite(siteId: string): MonitoringDraft[] {
    return drafts.value.filter(d => d.siteId === siteId)
  }

  // ── Data export ────────────────────────────────────────────────────────

  function exportJson(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      queue: queue.value.map(q => ({
        ...q,
        photos: q.photos.map(() => '[photo-omitted]'),
      })),
      drafts: drafts.value.map(d => ({
        ...d,
        photos: d.photos.map(() => '[photo-omitted]'),
      })),
    }, null, 2)
  }

  return {
    // State
    queue, drafts, online, panelOpen, syncing, initialised,
    // Computed
    pending, failed, syncedItems, pendingCount, failedCount, draftCount,
    // Lifecycle
    init, refreshQueue, refreshDrafts,
    // Queue
    enqueue, patchQueueItem, removeQueueItem, retryItem, cleanSynced, syncNow,
    // Drafts
    saveDraft, deleteDraft, draftsForSite,
    // Export
    exportJson,
  }
})

// ── Utility ───────────────────────────────────────────────────────────────

function dataUriToBlob(dataUri: string): Blob {
  const [header, b64] = dataUri.split(',')
  const mime   = header?.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(b64 ?? '')
  const bytes  = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
