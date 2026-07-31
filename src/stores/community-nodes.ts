import { defineStore }    from 'pinia'
import { ref, computed }  from 'vue'
import { supabase }       from 'src/lib/supabase'
import { useMemberStore } from './member'
import type {
  OrbitalGalleryEntry, GalleryType, GalleryOwnershipModel, GalleryAccessLevel, GalleryOrbitAnchor,
} from 'src/lib/defender-nav.types'

// ── Types ─────────────────────────────────────────────────────────────────
//
// node_type is intentionally narrower than GalleryType (defender-nav.types.ts)
// — that type also covers 'research'/'stage'/'info' galleries this table
// doesn't model yet. Extending this list is a small additive migration
// (widen the community_nodes.node_type CHECK) plus a case here, not a schema
// rewrite — see 008_community_nodes.sql's header note.

export type CommunityNodeType = 'business_listing' | 'business_location' | 'creative_page'
export type CommunityNodeStatus = 'draft' | 'published' | 'archived'

export interface CommunityNode {
  id:              string
  owner_id:        string
  node_type:       CommunityNodeType
  title:           string
  description:     string | null
  metadata:        Record<string, unknown>
  hostname:        string | null    // StarSystem.hostname — which system's gallery this appears in
  exoloc_address:  string | null    // optional full exolocation address (SPEC_EXOLOC_ADDRESS.md)
  orbit_anchor:    GalleryOrbitAnchor | Record<string, unknown>
  ownership_model: GalleryOwnershipModel
  access_level:    GalleryAccessLevel
  status:          CommunityNodeStatus
  created_at:      string
  reviewed_at:     string | null
  reviewed_by:     string | null
}

export interface QueuedNodeChange {
  id:         string          // local queue id, not the row id
  action:     'create' | 'update'
  nodeId?:    string          // set for 'update' — the community_nodes.id being patched
  payload:    Partial<Omit<CommunityNode, 'id' | 'owner_id' | 'created_at' | 'reviewed_at' | 'reviewed_by'>>
  status:     'pending' | 'syncing' | 'synced' | 'failed'
  enqueuedAt: string
  syncedAt?:  string
  error?:     string
  retries:    number
}

export interface NodeDraft {
  draftKey:  string       // crypto.randomUUID() — one per authoring session
  nodeType:  CommunityNodeType
  formData:  Record<string, unknown>
  savedAt:   string
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────
// Same shape as src/stores/eco-offline.ts — a submission queue for writes
// (so authoring a listing works offline and syncs when connectivity
// returns) plus a draft store for in-progress, not-yet-submitted forms.

const DB_NAME    = 'community-nodes-offline'
const DB_VERSION = 1
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
        q.createIndex('enqueuedAt', 'enqueuedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(D_STORE)) {
        const d = db.createObjectStore(D_STORE, { keyPath: 'draftKey' })
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

export const useCommunityNodesStore = defineStore('communityNodes', () => {

  const myNodes     = ref<CommunityNode[]>([])
  const queue       = ref<QueuedNodeChange[]>([])
  const drafts      = ref<NodeDraft[]>([])
  const online      = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const syncing     = ref(false)
  const loading     = ref(false)
  const initialised = ref(false)

  const pending      = computed(() => queue.value.filter(q => q.status === 'pending'))
  const failed       = computed(() => queue.value.filter(q => q.status === 'failed'))
  const pendingCount = computed(() => pending.value.length)
  const draftCount   = computed(() => drafts.value.length)

  // ── Bootstrap ──────────────────────────────────────────────────────────

  async function init() {
    if (initialised.value) return
    await Promise.all([refreshQueue(), refreshDrafts(), fetchMyNodes()])
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    if (online.value && pending.value.length) void syncNow()
    initialised.value = true
  }

  function onOnline()  { online.value = true;  void syncNow() }
  function onOffline() { online.value = false }

  async function refreshQueue() {
    const items = await idbAll<QueuedNodeChange>(Q_STORE)
    queue.value = items.sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt))
  }

  async function refreshDrafts() {
    const items = await idbAll<NodeDraft>(D_STORE)
    drafts.value = items.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  }

  // ── Reads (direct — only writes need the offline queue) ────────────────

  async function fetchMyNodes() {
    const uid = useMemberStore().userId
    if (!supabase || !uid) { myNodes.value = []; return }
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('community_nodes')
        .select('*')
        .eq('owner_id', uid)
        .order('created_at', { ascending: false })
      if (!error) myNodes.value = (data ?? []) as CommunityNode[]
    } finally {
      loading.value = false
    }
  }

  /**
   * All nodes, for admin moderation (AdminNodesPage.vue). RLS's
   * community_nodes_read policy only returns every row to an actual admin —
   * a non-admin caller silently gets back just their own rows, so this is
   * safe to expose; the admin-only UI gating is for UX, not the real gate.
   */
  async function fetchAllNodesForAdmin(): Promise<CommunityNode[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('community_nodes')
      .select('*')
      .order('created_at', { ascending: false })
    return error || !data ? [] : (data as CommunityNode[])
  }

  /** Admin-only status set (archive/restore), bypassing the offline queue —
   *  moderation happens online, at a desk, not in the field. */
  async function setNodeStatusAsAdmin(nodeId: string, status: CommunityNodeStatus): Promise<boolean> {
    if (!supabase) return false
    const { error } = await supabase.from('community_nodes').update({ status }).eq('id', nodeId)
    return !error
  }

  /**
   * Published nodes for the OrbitalGalleryEntry pipeline (DefenderNav.vue),
   * scoped to one star system's gallery. Shared by GalaxyPage.vue and
   * SurfaceViewPage.vue so the JSONB -> gallery mapping lives in one place
   * instead of being duplicated per page.
   *
   * hostname must match StarSystem.hostname exactly (e.g. sys.hostname) —
   * omitting it returns every published node with no hostname set at all
   * (system-agnostic nodes), not every node globally, so two different
   * systems' galleries never collide.
   */
  async function fetchGalleryNodes(hostname: string | null, nodeTypes?: CommunityNodeType[]): Promise<OrbitalGalleryEntry[]> {
    if (!supabase) return []
    let q = supabase.from('community_nodes').select('*').eq('status', 'published')
    q = hostname ? q.eq('hostname', hostname) : q.is('hostname', null)
    if (nodeTypes?.length) q = q.in('node_type', nodeTypes)
    const { data, error } = await q
    if (error || !data) return []

    return (data as CommunityNode[]).map((n): OrbitalGalleryEntry => {
      const anchor = (n.orbit_anchor && 'type' in n.orbit_anchor)
        ? n.orbit_anchor as GalleryOrbitAnchor
        : { type: 'free' as const, radiusAU: 40, initialAngleDeg: 0 }
      return {
        id:              n.id,
        name:            n.title,
        galleryType:     nodeTypeToGalleryType(n.node_type),
        ownershipModel:  n.ownership_model,
        orbitAnchor:     anchor,
        currentAngleDeg: anchor.type === 'free' ? anchor.initialAngleDeg : 0,
        radiusAU:        anchor.type === 'free' || anchor.type === 'circumbinary' ? anchor.radiusAU : 0,
        meetingState:    'idle',
        accessLevel:     n.access_level,
        presenceCount:   0,
        ponInkUrl:       (n.metadata?.ponInkUrl as string | undefined),
      }
    })
  }

  function nodeTypeToGalleryType(t: CommunityNodeType): GalleryType {
    // business_listing/business_location both read as 'community' venues in
    // the existing gallery taxonomy; creative_page maps to 'art'.
    if (t === 'creative_page') return 'art'
    return 'community'
  }

  // ── Draft management ───────────────────────────────────────────────────

  async function saveDraft(draft: NodeDraft) {
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

  // ── Queue management (writes) ───────────────────────────────────────────

  async function enqueue(
    change: Omit<QueuedNodeChange, 'id' | 'enqueuedAt' | 'status' | 'retries'>
  ): Promise<string> {
    const entry: QueuedNodeChange = {
      ...change,
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

  async function patchQueueItem(id: string, patch: Partial<QueuedNodeChange>) {
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

  async function cleanSynced(maxAgeDays = 7) {
    const cutoff = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString()
    const old = queue.value.filter(q => q.status === 'synced' && (q.syncedAt ?? '') < cutoff)
    await Promise.all(old.map(q => removeQueueItem(q.id)))
  }

  // Convenience wrappers — every write goes through the queue so the same
  // code path works online or offline; enqueue() fires syncNow() immediately
  // when online, so in practice this resolves right away with connectivity.
  function createNode(payload: QueuedNodeChange['payload']) {
    return enqueue({ action: 'create', payload })
  }
  function updateNode(nodeId: string, payload: QueuedNodeChange['payload']) {
    return enqueue({ action: 'update', nodeId, payload })
  }
  function archiveNode(nodeId: string) {
    return enqueue({ action: 'update', nodeId, payload: { status: 'archived' } })
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
          const uid = useMemberStore().userId
          if (!uid) throw new Error('not signed in')

          if (item.action === 'create') {
            const { error } = await supabase
              .from('community_nodes')
              .insert({ ...item.payload, owner_id: uid })
            if (error) throw error
          } else {
            if (!item.nodeId) throw new Error('update queued without nodeId')
            const { error } = await supabase
              .from('community_nodes')
              .update(item.payload)
              .eq('id', item.nodeId)
            if (error) throw error
          }

          await patchQueueItem(item.id, { status: 'synced', syncedAt: new Date().toISOString() })
        } catch (err) {
          await patchQueueItem(item.id, {
            status:  'failed',
            error:   String(err),
            retries: (item.retries ?? 0) + 1,
          })
        }
      }
      await fetchMyNodes()
    } finally {
      syncing.value = false
    }
  }

  // ── Self-host / data-portability export ─────────────────────────────────
  //
  // A richer, re-importable bundle than the flat account-wide export in
  // member.ts::exportMyData() — every field needed to recreate these nodes
  // elsewhere, structured per node rather than as an opaque table dump.

  function exportForSelfHost(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      formatNote: 'One row per owned community node, in the shape accepted by createNode(). ' +
                  'Re-import by POSTing each entry to another Exotopia-compatible instance, ' +
                  'or by running this repo (GPL v3) against your own Supabase project.',
      nodes: myNodes.value,
      unsyncedDrafts: drafts.value,
    }, null, 2)
  }

  return {
    // State
    myNodes, queue, drafts, online, syncing, loading, initialised,
    // Computed
    pending, failed, pendingCount, draftCount,
    // Lifecycle
    init, refreshQueue, refreshDrafts, fetchMyNodes, fetchGalleryNodes,
    // Admin
    fetchAllNodesForAdmin, setNodeStatusAsAdmin,
    // Drafts
    saveDraft, deleteDraft,
    // Writes
    createNode, updateNode, archiveNode, retryItem, removeQueueItem, cleanSynced, syncNow,
    // Export
    exportForSelfHost,
  }
})
