import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from './member'
import { useSettlements, loadMySettlements } from 'src/lib/settlements'
import { useCommunityNodesStore } from './community-nodes'
import type { RewardEvent, Certificate } from './rewards'
import type { SettlementItem } from 'src/lib/settlement-items'

// ── Types for data with no existing store/composable ───────────────────────────

export interface EcoOpsRecord {
  id:                   string
  site_id:              string | null
  record_type:          string
  observed_at:          string
  observer_id:          string | null
  observer_alias:       string | null
  protocol:              string | null
  photos:                string[] | null
  notes:                 string | null
  proof_status:          'pending' | 'anchored' | 'verified'
  created_at:             string
}

export interface EcoOpsCertificateRow {
  id:            string
  site_id:       string | null
  recipient_id:  string | null
  cert_type:     string
  cert_subtype:  string | null
  country_code:  string | null
  badge_json:    Record<string, unknown> | null
  proof_hash:    string | null
  issued_at:     string
}

export interface FileCabinetCertificate {
  id:                     string
  source:                 'public' | 'eco_ops'
  certificate_type:       string
  cert_subtype?:          string | null
  issued_at:              string
  country_code?:          string | null
  proof_hash?:            string | null
  settlement_object_key?: string | null
}

export interface CreativeAsset {
  id:             string
  source:         'settlement_item' | 'community_node'
  label:          string
  kind:           string
  createdAt:      string
  settlementKey?: string
  ponInkUrl?:     string
  mediaLinks?:    string[]
  status?:        string
}

export interface ComingSoonEntry { label: string; note: string }

const COMING_SOON: ComingSoonEntry[] = [
  { label: 'NFT Ownership Records',                  note: 'Not built — this app has no wallet or blockchain layer today.' },
  { label: 'POAP Archive',                            note: 'Not built — no live event-attendance source yet.' },
  { label: '$BARS Soundbank',                         note: 'Not built.' },
  { label: 'Wormhole Whitelist',                      note: 'Not built.' },
  { label: 'Governance Votes',                        note: 'Not built.' },
  { label: 'Nickname History',                        note: 'Not built — settlement names are auto-generated today, not yet editable.' },
  { label: 'Whisper-Chat / Robot Conversation Logs',  note: 'Not built — no messaging system exists in this codebase.' },
]

export const useFileCabinetStore = defineStore('file-cabinet', () => {
  const rewardEvents        = ref<RewardEvent[]>([])
  const publicCertificates  = ref<Certificate[]>([])
  const ecoOpsCertificates  = ref<EcoOpsCertificateRow[]>([])
  const monitoringRecords   = ref<EcoOpsRecord[]>([])
  const settlementItemRows  = ref<{ settlement_key: string; items: SettlementItem[] }[]>([])

  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function loadMyFileCabinet() {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    loading.value = true
    const uid = member.userId

    const [rewards, pubCerts, ecoCerts, monitoring, items] = await Promise.all([
      supabase.from('reward_events').select('*').eq('member_id', uid).order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').eq('member_id', uid),
      supabase.schema('eco_ops').from('certificates').select('*').eq('recipient_id', uid),
      supabase.schema('eco_ops').from('monitoring_records').select('*').eq('observer_id', uid).order('observed_at', { ascending: false }),
      supabase.from('settlement_items').select('settlement_key, items').eq('owner_id', uid),
    ])

    rewardEvents.value       = (rewards.data as RewardEvent[]) ?? []
    publicCertificates.value = (pubCerts.data as Certificate[]) ?? []
    ecoOpsCertificates.value = (ecoCerts.data as EcoOpsCertificateRow[]) ?? []
    monitoringRecords.value  = (monitoring.data as EcoOpsRecord[]) ?? []
    settlementItemRows.value = (items.data as { settlement_key: string; items: SettlementItem[] }[]) ?? []

    error.value = rewards.error?.message ?? pubCerts.error?.message ?? ecoCerts.error?.message
      ?? monitoring.error?.message ?? items.error?.message ?? null
    loading.value = false

    // Safety-net loads for the two drawers backed by existing composables/stores
    // (both are idempotent and already called at sign-in elsewhere — this just
    // covers the case where the gallery is the first page visited this session).
    void loadMySettlements()
    void useCommunityNodesStore().fetchMyNodes()
  }

  // ── Drawer 1: Eco-Ops Records ─────────────────────────────────────────────────
  const ecoOpsDrawer = computed(() => monitoringRecords.value)

  // ── Drawer 2: Certifications (merged public + eco_ops) ──────────────────────────
  const certificationsDrawer = computed<FileCabinetCertificate[]>(() => [
    ...publicCertificates.value.map(c => ({
      id: c.id, source: 'public' as const, certificate_type: c.certificate_type,
      issued_at: c.issued_at, settlement_object_key: c.settlement_object_key,
    })),
    ...ecoOpsCertificates.value.map(c => ({
      id: c.id, source: 'eco_ops' as const, certificate_type: c.cert_type,
      cert_subtype: c.cert_subtype, issued_at: c.issued_at,
      country_code: c.country_code, proof_hash: c.proof_hash,
    })),
  ])

  // ── Drawer 3: Rewards / Points ───────────────────────────────────────────────────
  const rewardsDrawer = computed(() => rewardEvents.value)
  const totalPoints   = computed(() => rewardEvents.value.reduce((sum, e) => sum + e.points, 0))

  // ── Drawer 4: Settlement Documents — reuse the existing composable, don't re-query ──
  const settlementDocsDrawer = computed(() => useSettlements().settlements.value)

  // ── Drawer 5: Creative Assets (settlement_items + community_nodes, merged) ──────────
  const creativeAssetsDrawer = computed<CreativeAsset[]>(() => {
    const fromItems: CreativeAsset[] = settlementItemRows.value.flatMap(row =>
      row.items.map(it => ({
        id: it.id, source: 'settlement_item' as const, label: it.label, kind: it.meshPreset,
        settlementKey: row.settlement_key, createdAt: new Date(it.acquiredAt).toISOString(),
      }))
    )
    const fromNodes: CreativeAsset[] = useCommunityNodesStore().myNodes
      .filter(n => n.node_type === 'creative_page')
      .map(n => ({
        id: n.id, source: 'community_node' as const, label: n.title, kind: n.node_type,
        ponInkUrl: typeof n.metadata?.ponInkUrl === 'string' ? n.metadata.ponInkUrl as string : undefined,
        mediaLinks: Array.isArray(n.metadata?.mediaLinks) ? n.metadata.mediaLinks as string[] : undefined,
        status: n.status, createdAt: n.created_at,
      }))
    return [...fromItems, ...fromNodes]
  })

  // ── Drawer 6: Coming Soon — static, no query, no table ───────────────────────────
  const comingSoonDrawer = COMING_SOON

  return {
    rewardEvents, publicCertificates, ecoOpsCertificates, monitoringRecords, settlementItemRows,
    loading, error,
    ecoOpsDrawer, certificationsDrawer, rewardsDrawer, totalPoints, settlementDocsDrawer, creativeAssetsDrawer, comingSoonDrawer,
    loadMyFileCabinet,
  }
})
