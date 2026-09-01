import { ref, computed } from 'vue'
import { safeRead, safeWrite } from './storage-cipher'
import { supabase } from './supabase'
import { recordFingerprint } from './record-fingerprint'

const STORAGE_KEY = 'e8.1'   // opaque — was 'exotopia_settlements_v1'

/** Per SPEC_EXOLOC_ADDRESS.md §3.7's branch-type registry. */
export type BranchType = 'public' | 'private' | 'branded' | 'research' | 'educational'

export interface SettlementRecord {
  key: string           // unique ID — see makeSettlementKey()
  type: 'surface' | 'cluster' | 'moon' | 'orbital' | 'bh-orbital' | 'stellar-orbital' | 'lunar-orbital' | 'branch'
  planetName: string
  hostname: string
  exolocation: string   // full address string for the deed
  displayName: string   // human-readable label for lists/UI
  createdAt: string     // ISO 8601
  lat?: number
  lon?: number
  clusterSlug?: string
  memberId?: string
  objects?: string[]    // unlocked reward-catalog object keys attached to this settlement
  focus?: string         // FocusOption id from MintPage's FOCUS_OPTIONS — editable via updateSettlement()
  /**
   * SHA-256 hex digest of this settlement's meaningful fields (see
   * fingerprintableFields() below), computed once at creation — an identity
   * marker, not a live integrity check. See SPEC_E8_RECORD_FINGERPRINT.md.
   * Render as the E8 theta commitment via record-fingerprint.ts's
   * renderFingerprintFromHex() — never recomputed after creation, so it
   * stays stable even if focus/items change later.
   */
  fingerprint?: string
  // ── branch (type: 'branch') fields only — see SPEC_EXOLOC_ADDRESS.md §3.7 ──
  branchId?: string        // e.g. "uni-kibaoni-aspire-2030" — the {owner-slug}-{purpose}-{version} convention
  branchType?: BranchType
  baseKey?: string         // the source settlement's own `key` — this branch's parent
  divergenceNote?: string  // how/why this branch differs from its base
}

/**
 * The subset of a settlement's fields that make it "this settlement" for
 * fingerprinting purposes — excludes createdAt and other pure bookkeeping so
 * the fingerprint doesn't change on every save for no meaningful reason.
 * Fixed key order (not a spread of the record) so the canonical string this
 * produces is stable regardless of how the record object was constructed.
 */
function fingerprintableFields(r: SettlementRecord) {
  return {
    type: r.type,
    planetName: r.planetName,
    hostname: r.hostname,
    exolocation: r.exolocation,
    displayName: r.displayName,
    focus: r.focus ?? null,
    objects: r.objects ?? [],
    lat: r.lat ?? null,
    lon: r.lon ?? null,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
//
// Every settlement key format below uses ':' as its field separator, and
// every field is ultimately sourced from a route param or query string (see
// SurfaceViewPage/StationInteriorPage/ClusterSurfacePage/MintPage etc.) — i.e.
// user-editable. A real designation/slug/label never contains ':', but
// another settlement's own key always does, so rejecting any ':' in these
// fields is a structural guard against building one settlement's address out
// of another settlement's address (e.g. a moon "orbiting" an orbital station,
// or a surface settlement keyed under a cluster world) — an unrealistic
// drill-down nesting the UI has no representation for. Same guard as
// moon-settlement.ts's assertBareName, kept local to each file per call-site
// count.

function assertBareField(fnName: string, field: string, value: string): void {
  if (typeof value !== 'string') {
    // Catches a caller passing a field that was never actually populated
    // (undefined/null from an incomplete object mapping upstream) — a plain
    // `.includes(':')` call turns that into an opaque "Cannot read
    // properties of undefined" several stack frames away from the real bug.
    throw new Error(`${fnName}: ${field} must be a string (got ${typeof value}: ${String(value)}).`)
  }
  if (value.includes(':')) {
    throw new Error(
      `${fnName}: ${field} must be a bare designation, not a settlement key (got "${value}"). ` +
      `Nesting one settlement's key inside another is not supported.`
    )
  }
}

/** Canonical key for a NASA exoplanet surface settlement. */
export function surfaceKey(planetName: string): string {
  assertBareField('surfaceKey', 'planetName', planetName)
  return `surface:${planetName}`
}

/** Canonical key for a cluster-world settlement. */
export function clusterKey(clusterSlug: string, memberId: string, systemName: string, planetLabel: string): string {
  assertBareField('clusterKey', 'clusterSlug', clusterSlug)
  assertBareField('clusterKey', 'memberId', memberId)
  assertBareField('clusterKey', 'systemName', systemName)
  assertBareField('clusterKey', 'planetLabel', planetLabel)
  return `cluster:${clusterSlug}:${memberId}:${systemName}:${planetLabel}`
}

/**
 * Canonical key for a moon settlement.
 *
 * planetName must be a bare NASA-archive planet designation (never contains
 * ':') — this is the structural guard against moon-of-moon nesting. Rejecting
 * any ':' here means a moon can never be built with another settlement —
 * moon included — as its parent, by construction, without needing a depth
 * counter or allowed-transition state machine.
 */
export function moonKey(planetName: string, moonIdx: number, coordVariant: string): string {
  assertBareField('moonKey', 'planetName', planetName)
  return `moon:${planetName}:${moonIdx}:${coordVariant}`
}

/** Canonical key for a bodyless orbital settlement (stellar/planetary/lunar orbit, or a black-hole zone). */
export function orbitalKey(coordSystem: string, hostname: string, refName?: string): string {
  assertBareField('orbitalKey', 'coordSystem', coordSystem)
  assertBareField('orbitalKey', 'hostname', hostname)
  if (refName !== undefined) assertBareField('orbitalKey', 'refName', refName)
  return refName ? `${coordSystem}:${hostname}:${refName}` : `${coordSystem}:${hostname}`
}

/**
 * Canonical key for a branch (parallel-dimension) settlement, per
 * SPEC_EXOLOC_ADDRESS.md §3.7.
 *
 * This is the one deliberate exception to every builder above's no-nesting
 * guard — a branch key IS its base settlement's own key nested inside, by
 * design (the spec's own wording: "the branch address always includes the
 * full base address"). `baseKey` is intentionally NOT passed through
 * assertBareField; only `branchId` is required to be a bare designation.
 */
export function branchKey(branchId: string, baseKey: string): string {
  assertBareField('branchKey', 'branchId', branchId)
  if (typeof baseKey !== 'string' || baseKey.length === 0) {
    throw new Error(`branchKey: baseKey must be a non-empty string (got ${typeof baseKey}: ${String(baseKey)}).`)
  }
  return `branch:${branchId}:${baseKey}`
}

/**
 * Full `exotopia:branch:{branch-id}/{base-address}` deed address string, per
 * SPEC_EXOLOC_ADDRESS.md §3.7. `baseAddress` is the base settlement's full
 * exolocation string — its own `exotopia:` prefix is stripped before
 * nesting, matching the spec's own examples.
 */
export function branchAddress(branchId: string, baseAddress: string): string {
  assertBareField('branchAddress', 'branchId', branchId)
  const basePath = baseAddress.startsWith('exotopia:') ? baseAddress.slice('exotopia:'.length) : baseAddress
  return `exotopia:branch:${branchId}/${basePath}`
}

/**
 * Creates a branch (parallel-dimension) settlement from an existing one —
 * same location, cloned decorative starting state, new branch identity.
 * Modeled on mint-style.ts's duplicateStyle(): deep-clone, mint fresh
 * identity, leave the source completely untouched. Returns the same shape
 * useSettlements().addSettlement() expects — callers persist it themselves:
 *   settlements.addSettlement(forkSettlement(source, branchId, 'private'))
 */
export function forkSettlement(
  source: SettlementRecord,
  branchId: string,
  branchType: BranchType,
  divergenceNote?: string,
): Omit<SettlementRecord, 'createdAt'> {
  const cloned = JSON.parse(JSON.stringify(source)) as SettlementRecord
  const { createdAt: _createdAt, fingerprint: _fingerprint, ...rest } = cloned
  return {
    ...rest,
    key:            branchKey(branchId, source.key),
    type:           'branch',
    exolocation:    branchAddress(branchId, source.exolocation),
    displayName:    `${source.displayName} — ${branchId}`,
    branchId,
    branchType,
    baseKey:        source.key,
    divergenceNote,
  }
}

// ── Reverse routing (address → route path) ───────────────────────────────────
//
// Used by GalleryNodePage.vue's "visit this settlement" link. Only handles key
// shapes that carry enough information to reconstruct their route on their
// own, resolvable for ANY visitor — not just the settlement's own browser
// (settlements are localStorage-only per SETTLEMENT_ADDRESS_API.md, so a
// visitor never has the author's SettlementRecord to look up):
//   - surface:<planetName>   — hostname isn't in the key, but it's a lookup
//     against the public static exoplanet-archive data (galaxy store), not
//     anything user-specific, so any visitor's browser can resolve it.
//   - <coordSystem>:<hostname>[:<refName>] (orbital/station keys) — both
//     fields the station-interior route needs are already in the key.
// moon:/cluster: keys don't carry enough to reconstruct losslessly (a moon's
// parent hostname isn't stored in moonKey; a cluster key's systemName isn't
// the systemIdx its route needs) — return null rather than guess wrong.

export interface ExolocRoute { path: string }

export function resolveExolocRoute(
  address: string,
  getPlanetHostname: (planetName: string) => string | undefined,
): ExolocRoute | null {
  const parts  = address.split(':')
  const prefix = parts[0] ?? ''

  if (prefix === 'surface') {
    const planetName = parts.slice(1).join(':')
    const hostname    = planetName ? getPlanetHostname(planetName) : undefined
    if (!hostname) return null
    return { path: `/surface/${encodeURIComponent(hostname)}/${encodeURIComponent(planetName)}` }
  }

  // branch:<branchId>:<baseKey> — baseKey itself contains ':', so it's every
  // remaining segment rejoined, not just parts[2]. Resolves recursively via
  // the base key's own route, then appends ?branch= so the branch-aware page
  // (see GalleryInteriorPage.vue) knows to render this dimension, not the base.
  if (prefix === 'branch') {
    const branchId = parts[1]
    const baseKey   = parts.slice(2).join(':')
    if (!branchId || !baseKey) return null
    const baseRoute = resolveExolocRoute(baseKey, getPlanetHostname)
    if (!baseRoute) return null
    const sep = baseRoute.path.includes('?') ? '&' : '?'
    return { path: `${baseRoute.path}${sep}branch=${encodeURIComponent(branchId)}` }
  }

  if (prefix.startsWith('exo-') && prefix.endsWith('-v1')) {
    const [, hostname, refName] = parts
    if (!hostname) return null
    const query = `?coordSystem=${encodeURIComponent(prefix)}`
    return { path: refName
      ? `/station-interior/${encodeURIComponent(hostname)}/${encodeURIComponent(refName)}${query}`
      : `/station-interior/${encodeURIComponent(hostname)}${query}` }
  }

  return null
}

// ── Reactive store ───────────────────────────────────────────────────────────

function loadFromStorage(): SettlementRecord[] {
  return safeRead<SettlementRecord[]>(STORAGE_KEY, [])
}

function saveToStorage(records: SettlementRecord[]) {
  safeWrite(STORAGE_KEY, records)
}

// Single shared reactive state (module-level singleton)
const _records = ref<SettlementRecord[]>(loadFromStorage())

// ── Server sync (015_settlements.sql) — signed-in members only ──────────────
//
// Anonymous settlement creation keeps working exactly as before: localStorage
// stays the source of truth read on every page load (fast, works offline,
// nothing changes for a signed-out visitor). For a signed-in member, every
// write is ALSO fired at the `settlements` table (owner-only RLS, mirrors
// settlement_profiles' pattern) so the same settlement survives a cleared
// cache or shows up on a second device. Sync is fire-and-forget on writes —
// callers of addSettlement/updateSettlement/removeSettlement don't need to
// change, they stay synchronous.
//
// No collision authority over `key`/`exolocation` here either, same as
// everywhere else in this design (SETTLEMENT_ADDRESS_API.md) — this table
// only guarantees ONE member can't have two rows for the same key, not that
// two different members can't each have their own row for the same address.

interface SettlementRow {
  key: string
  type: SettlementRecord['type']
  planet_name: string
  hostname: string
  exolocation: string
  display_name: string
  created_at: string
  lat: number | null
  lon: number | null
  cluster_slug: string | null
  cluster_member_id: string | null
  objects: string[] | null
  focus: string | null
  fingerprint: string | null
  branch_id: string | null
  branch_type: string | null
  base_key: string | null
  divergence_note: string | null
}

function recordToRow(r: SettlementRecord, ownerId: string) {
  return {
    owner_id: ownerId,
    key: r.key, type: r.type, planet_name: r.planetName, hostname: r.hostname,
    exolocation: r.exolocation, display_name: r.displayName,
    lat: r.lat ?? null, lon: r.lon ?? null,
    cluster_slug: r.clusterSlug ?? null, cluster_member_id: r.memberId ?? null,
    objects: r.objects ?? [], focus: r.focus ?? null,
    fingerprint: r.fingerprint ?? null,
    branch_id: r.branchId ?? null, branch_type: r.branchType ?? null,
    base_key: r.baseKey ?? null, divergence_note: r.divergenceNote ?? null,
  }
}

function rowToRecord(row: SettlementRow): SettlementRecord {
  return {
    key: row.key, type: row.type, planetName: row.planet_name, hostname: row.hostname,
    exolocation: row.exolocation, displayName: row.display_name, createdAt: row.created_at,
    lat: row.lat ?? undefined, lon: row.lon ?? undefined,
    clusterSlug: row.cluster_slug ?? undefined, memberId: row.cluster_member_id ?? undefined,
    objects: row.objects ?? undefined, focus: row.focus ?? undefined,
    fingerprint: row.fingerprint ?? undefined,
    branchId: row.branch_id ?? undefined, branchType: (row.branch_type as BranchType) ?? undefined,
    baseKey: row.base_key ?? undefined, divergenceNote: row.divergence_note ?? undefined,
  }
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

async function syncUpsert(record: SettlementRecord) {
  const uid = await currentUserId()
  if (!uid || !supabase) return
  await supabase.from('settlements').upsert(recordToRow(record, uid), { onConflict: 'owner_id,key' })
}

async function syncDelete(key: string) {
  const uid = await currentUserId()
  if (!uid || !supabase) return
  await supabase.from('settlements').delete().eq('owner_id', uid).eq('key', key)
}

/**
 * Called once when a member's session becomes available (see member.ts's
 * init()/onAuthStateChange — this is the one place that decides "am I signed
 * in," so this function is the integration point, not something every page
 * needs to remember to call). Pulls down every settlement this member has on
 * the server, merges into the local list (server data wins on key conflict),
 * then pushes up whatever was local-only — the one-time migration path for
 * settlements created before signing in, or created anonymously in a browser
 * that later signs in.
 */
export async function loadMySettlements(): Promise<void> {
  const uid = await currentUserId()
  if (!uid || !supabase) return
  const { data } = await supabase.from('settlements').select('*').eq('owner_id', uid)
  const serverRecords = ((data ?? []) as SettlementRow[]).map(rowToRecord)
  const serverKeys = new Set(serverRecords.map(r => r.key))

  const localOnly = _records.value.filter(r => !serverKeys.has(r.key))
  _records.value = [...serverRecords, ...localOnly]
  saveToStorage(_records.value)

  for (const r of localOnly) void syncUpsert(r)
}

export function useSettlements() {
  const settlements = computed(() => _records.value)

  function hasSettlement(key: string): boolean {
    return _records.value.some(r => r.key === key)
  }

  function getSettlement(key: string): SettlementRecord | undefined {
    return _records.value.find(r => r.key === key)
  }

  function addSettlement(record: Omit<SettlementRecord, 'createdAt'>) {
    if (hasSettlement(record.key)) return  // idempotent
    const full: SettlementRecord = { ...record, createdAt: new Date().toISOString() }
    _records.value = [..._records.value, full]
    saveToStorage(_records.value)
    void syncUpsert(full)

    // Fingerprinting needs crypto.subtle + WASM init, both async — addSettlement()
    // stays synchronous for existing callers, so this attaches the fingerprint
    // via updateSettlement() once it resolves rather than blocking creation on it.
    void recordFingerprint(JSON.stringify(fingerprintableFields(full)))
      .then(fp => updateSettlement(full.key, { fingerprint: fp.sha256Hex }))
  }

  function updateSettlement(key: string, patch: Partial<SettlementRecord>) {
    _records.value = _records.value.map(r => r.key === key ? { ...r, ...patch } : r)
    saveToStorage(_records.value)
    const updated = getSettlement(key)
    if (updated) void syncUpsert(updated)
  }

  function removeSettlement(key: string) {
    _records.value = _records.value.filter(r => r.key !== key)
    saveToStorage(_records.value)
    void syncDelete(key)
  }

  return { settlements, hasSettlement, getSettlement, addSettlement, updateSettlement, removeSettlement }
}
