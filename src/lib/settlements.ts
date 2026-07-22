import { ref, computed } from 'vue'
import { safeRead, safeWrite } from './storage-cipher'

const STORAGE_KEY = 'e8.1'   // opaque — was 'exotopia_settlements_v1'

export interface SettlementRecord {
  key: string           // unique ID — see makeSettlementKey()
  type: 'surface' | 'cluster' | 'moon' | 'orbital' | 'bh-orbital'
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
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Canonical key for a NASA exoplanet surface settlement. */
export function surfaceKey(planetName: string): string {
  return `surface:${planetName}`
}

/** Canonical key for a cluster-world settlement. */
export function clusterKey(clusterSlug: string, memberId: string, systemName: string, planetLabel: string): string {
  return `cluster:${clusterSlug}:${memberId}:${systemName}:${planetLabel}`
}

/** Canonical key for a moon settlement. */
export function moonKey(planetName: string, moonIdx: number, coordVariant: string): string {
  return `moon:${planetName}:${moonIdx}:${coordVariant}`
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
  }

  function updateSettlement(key: string, patch: Partial<SettlementRecord>) {
    _records.value = _records.value.map(r => r.key === key ? { ...r, ...patch } : r)
    saveToStorage(_records.value)
  }

  function removeSettlement(key: string) {
    _records.value = _records.value.filter(r => r.key !== key)
    saveToStorage(_records.value)
  }

  return { settlements, hasSettlement, getSettlement, addSettlement, updateSettlement, removeSettlement }
}
