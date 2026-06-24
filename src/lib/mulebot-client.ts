/**
 * src/lib/mulebot-client.ts
 *
 * mule-bot API client — queries a local-network settlement node.
 *
 * URL pattern:
 *   /mulebot/v1/{coord-system}/{reference-body}/{location}/{resource}
 *
 * The exolocation address (e.g. "exo-surface-v1:Kepler-442b:15N,23W") is
 * split on ":" and encoded as URL path segments. The location segment
 * percent-encodes commas (15N,23W → 15N%2C23W).
 *
 * Phase 1 (current): client returns mock data from MOCK_RESPONSES.
 * Phase 2: swap to real fetch against localhost:8888 node.
 * Phase 3: federation — node discovery via /.well-known/node.
 *
 * See SPEC_MULEBOT_API.md for the full endpoint specification.
 */

import { ref, type Ref } from 'vue'

// ── Node config ───────────────────────────────────────────────────────────────

/** Local mule-bot node base URL. Override per deployment. */
export const MULEBOT_NODE = (import.meta as any).env?.VITE_MULEBOT_NODE ?? 'http://localhost:8888'

/** Phase flag — when false, return mock data instead of real fetch */
const LIVE_NODE = false

// ── URL builder ───────────────────────────────────────────────────────────────

/**
 * Convert an exolocation address to a mule-bot API base path.
 *
 * "exo-surface-v1:Kepler-442b:15N,23W"
 *  → "/mulebot/v1/exo-surface-v1/Kepler-442b/15N%2C23W"
 */
function exolocToPath(exoloc: string): string {
  const parts = exoloc.split(':')
  if (parts.length !== 3) throw new Error(`Invalid exolocation: ${exoloc}`)
  const [coord, body, loc] = parts
  return `/mulebot/v1/${coord}/${body}/${encodeURIComponent(loc!)}`
}

async function mbFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  if (!LIVE_NODE) return mockResponse(path) as T
  const url = `${MULEBOT_NODE}${path}`
  const res  = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new MulebotError(err.message ?? res.statusText, res.status)
  }
  return res.json() as Promise<T>
}

export class MulebotError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

// ── Response types ────────────────────────────────────────────────────────────

export interface MulebotStatus {
  exoloc:           string
  settlement_name:  string
  mulebot_version:  string
  persona:          string
  corpus_items:     number
  corpus_updated:   string
  sunlight_balance: string
  art_pending:      number
  next_action?: {
    type:    string
    label:   string
    reward?: string
    link?:   string
  }
}

export interface MulebotEarnings {
  total_sunlight:    string
  total_art:         number
  art_pending:       number
  art_resold:        number
  art_resold_value?: string
  events: Array<{
    date:    string
    type:    string
    amount:  number | string
    reason:  string
    chain:   string
    tx_hash?: string
  }>
}

export interface PlanItem {
  priority:      number
  action:        string
  eco_ops_type?: string
  reward?:       string
  rationale:     string
  due_by?:       string
  approvideo_ref?: string
}

export interface MulebotPlan {
  horizon:   string
  generated: string
  plan:      PlanItem[]
}

export interface CorpusSummary {
  item_count:      number
  updated:         string
  topics:          string[]
  corpus_seed:     string
  integrity_hash?: string
}

export interface CorpusQueryResult {
  query:   string
  results: Array<{ id: string; type: string; excerpt: string; relevance: number }>
}

export interface LandCareStatus {
  zone:    string
  planet?: string
  health_summary: {
    water?: { status: string; last_ph?: number; trend?: string }
    soil?:  { status: string; notes?: string }
    air?:   { status: string }
  }
  top_recommendation: string
}

export interface ApprovideoCuratedItem {
  id:               string
  title:            string
  duration:         string
  language:         string
  category:         string
  relevance_reason: string
  url:              string
  thumbnail?:       string
}

export interface EcoOpsSubmitResult {
  status:         'queued' | 'confirmed' | 'error'
  corpus_item?:   string
  art_earned?:    number
  cert_preview?:  { cert_id: string; chain: string }
  queue_position?: number
  error?:         string
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Settlement overview — mule-bot status, next action, balance summary */
export function getMulebotStatus(exoloc: string): Promise<MulebotStatus> {
  return mbFetch<MulebotStatus>(`${exolocToPath(exoloc)}/`)
}

/** All token earnings, optionally filtered by chain/token/date */
export function getMulebotEarnings(exoloc: string, opts?: {
  chain?:  'polygon' | 'celo' | 'algorand' | 'all'
  token?:  'sunlight' | 'art' | 'all'
  since?:  string   // ISO date
  limit?:  number
  offset?: number
}): Promise<MulebotEarnings> {
  const params = new URLSearchParams(opts as Record<string, string>)
  return mbFetch<MulebotEarnings>(`${exolocToPath(exoloc)}/earnings/?${params}`)
}

/** ART reward optimisation plan — ranked list of actions to maximise earnings */
export function getArtOptimisationPlan(exoloc: string): Promise<PlanItem[]> {
  return mbFetch<{ items: PlanItem[] }>(`${exolocToPath(exoloc)}/earnings/art/optimize/`)
    .then(r => r.items)
}

/** Participation plan — recommended actions for the next N days */
export function getMulebotPlan(exoloc: string, opts?: {
  horizon?: '7d' | '30d' | '90d'
  focus?:   'art' | 'sunlight' | 'settlement' | 'all'
}): Promise<MulebotPlan> {
  const params = new URLSearchParams(opts as Record<string, string>)
  return mbFetch<MulebotPlan>(`${exolocToPath(exoloc)}/plan/?${params}`)
}

/** Corpus metadata summary */
export function getCorpusSummary(exoloc: string): Promise<CorpusSummary> {
  return mbFetch<CorpusSummary>(`${exolocToPath(exoloc)}/corpus/`)
}

/** Natural-language query against the corpus */
export function queryCorpus(exoloc: string, q: string): Promise<CorpusQueryResult> {
  return mbFetch<CorpusQueryResult>(
    `${exolocToPath(exoloc)}/corpus/query?q=${encodeURIComponent(q)}`
  )
}

/** Add an item to the corpus */
export function addCorpusItem(exoloc: string, item: {
  type:     string
  source?:  string
  content:  string
  date?:    string
  gps?:     { lat: number; lon: number }
  cert_id?: string
}): Promise<{ id: string; indexed: boolean }> {
  return mbFetch(`${exolocToPath(exoloc)}/corpus/`, {
    method: 'POST',
    body:   JSON.stringify(item),
  })
}

/** Land care status and advice, optionally filtered to one domain */
export function getLandCare(exoloc: string, domain?: 'water' | 'soil' | 'climate' | 'regenerative'): Promise<LandCareStatus> {
  const seg = domain ? `/${domain}` : ''
  return mbFetch<LandCareStatus>(`${exolocToPath(exoloc)}/land-care${seg}/`)
}

/** Hub Approvideo curated feed personalised to this settlement */
export function getApprovideo(exoloc: string, opts?: {
  category?: string
  language?: 'en' | 'sw' | 'fr' | 'pt' | 'ar'
  limit?:    number
}): Promise<{ items: ApprovideoCuratedItem[] }> {
  const params = new URLSearchParams(opts as Record<string, string>)
  return mbFetch(`${exolocToPath(exoloc)}/approvideo/?${params}`)
}

/** Submit an eco-ops check-in — mule-bot validates, adds to corpus, queues on-chain */
export function submitEcoOps(exoloc: string, data: {
  type:      'wqMap' | 'farmMap' | 'garbageMap' | 'sourceMap' | 'cleaningMap' | 'storageMap'
  readings?: Record<string, number | boolean>
  gps?:      { lat: number; lon: number }
  date_utc?: string
  photo_cid?: string
  notes?:    string
}): Promise<EcoOpsSubmitResult> {
  return mbFetch<EcoOpsSubmitResult>(`${exolocToPath(exoloc)}/eco-ops/`, {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

// ── Vue composable ────────────────────────────────────────────────────────────

export interface UseMulebot {
  status:   Ref<MulebotStatus | null>
  plan:     Ref<MulebotPlan | null>
  earnings: Ref<MulebotEarnings | null>
  loading:  Ref<boolean>
  error:    Ref<string>
  refresh:  () => Promise<void>
  query:    (q: string) => Promise<CorpusQueryResult>
  submit:   (data: Parameters<typeof submitEcoOps>[1]) => Promise<EcoOpsSubmitResult>
}

export function useMulebot(exoloc: string): UseMulebot {
  const status   = ref<MulebotStatus | null>(null)
  const plan     = ref<MulebotPlan | null>(null)
  const earnings = ref<MulebotEarnings | null>(null)
  const loading  = ref(false)
  const error    = ref('')

  async function refresh() {
    loading.value = true
    error.value   = ''
    try {
      ;[status.value, plan.value, earnings.value] = await Promise.all([
        getMulebotStatus(exoloc),
        getMulebotPlan(exoloc),
        getMulebotEarnings(exoloc),
      ])
    } catch (e: any) {
      error.value = e.message ?? 'mule-bot unreachable'
    } finally {
      loading.value = false
    }
  }

  const query  = (q: string) => queryCorpus(exoloc, q)
  const submit = (data: Parameters<typeof submitEcoOps>[1]) => submitEcoOps(exoloc, data)

  return { status, plan, earnings, loading, error, refresh, query, submit }
}

// ── Mock responses (Phase 1) ──────────────────────────────────────────────────

function mockResponse(path: string): unknown {
  if (path.includes('/eco-ops')) {
    return {
      status: 'queued', corpus_item: 'item-mock-001',
      art_earned: 12, queue_position: 1,
      cert_preview: { cert_id: 'WQC-MOCK-2026-0001', chain: 'polygon' },
    } satisfies EcoOpsSubmitResult
  }
  if (path.includes('/earnings/art/optimize')) {
    return { items: [
      { priority: 1, action: 'Water quality check-in', eco_ops_type: 'wqMap',
        reward: '+12 ART', rationale: 'Last reading 8 days ago', due_by: '2026-05-24' },
      { priority: 2, action: 'Farm map submission', eco_ops_type: 'farmMap',
        reward: '+8 ART', rationale: 'No farmMap in corpus — unlocks food module' },
    ]}
  }
  if (path.includes('/earnings')) {
    return {
      total_sunlight: '14.2 $SUNLIGHT', total_art: 87, art_pending: 3,
      art_resold: 12, art_resold_value: 'KES 2,400',
      events: [
        { date: '2026-05-20', type: 'art_earned', amount: 12,
          reason: 'Water quality check-in — Kilifi site', chain: 'polygon' },
        { date: '2026-05-18', type: 'sunlight_mint', amount: '1 $SUNLIGHT',
          reason: 'Field recording — shore sounds', chain: 'polygon' },
      ],
    } satisfies MulebotEarnings
  }
  if (path.includes('/plan')) {
    return {
      horizon: '30d', generated: new Date().toISOString(),
      plan: [
        { priority: 1, action: 'Water quality check-in', eco_ops_type: 'wqMap',
          reward: '+12 ART', rationale: 'Last reading overdue', due_by: '2026-05-24' },
        { priority: 2, action: 'Record and mint $SUNLIGHT', reward: '100% of resale',
          rationale: '$SUNLIGHT volume low — good time for visibility',
          approvideo_ref: 'track/how-to-record-field-audio' },
        { priority: 3, action: 'Farm map check-in', eco_ops_type: 'farmMap',
          reward: '+8 ART', rationale: 'Settlement has no farmMap — unlocks food upgrade' },
      ],
    } satisfies MulebotPlan
  }
  if (path.includes('/corpus/query')) {
    return {
      query: 'mock', results: [
        { id: 'item-0001', type: 'eco_ops_reading',
          excerpt: 'pH 7.1, turbidity 0.3 NTU, Kilifi borehole — 2026-05-20',
          relevance: 0.94 },
      ],
    } satisfies CorpusQueryResult
  }
  if (path.includes('/land-care/water')) {
    return {
      readings: [{ date: '2026-05-20', ph: 7.1, turbidity_ntu: 0.3, potable: true }],
      trend: 'stable',
      approvideo_refs: [
        { id: 'wq/biosand-filter', title: 'Biosand filter maintenance', url: '#' },
      ],
    }
  }
  if (path.includes('/land-care')) {
    return {
      zone: 'Tropical coastal, humid',
      health_summary: {
        water: { status: 'good', last_ph: 7.1, trend: 'stable' },
        soil:  { status: 'needs_attention', notes: 'No farmMap data yet' },
      },
      top_recommendation: 'Add soil organic matter measurement to next farm visit',
    } satisfies LandCareStatus
  }
  if (path.includes('/approvideo')) {
    return { items: [
      { id: 'wq/biosand-002', title: 'Testing water pH in the field', duration: '8:32',
        language: 'sw', category: 'water',
        relevance_reason: 'Active wqMap eco-ops in settlement',
        url: 'https://hub.scd.org/approvideo/wq/biosand-002' },
    ]}
  }
  if (path.includes('/corpus')) {
    return {
      item_count: 42, updated: new Date().toISOString(),
      topics: ['water quality', 'soil health', 'seed saving'],
      corpus_seed: '7C4E2B8F',
    } satisfies CorpusSummary
  }
  // Default: status
  return {
    exoloc:          'exo-surface-v1:Kepler-442b:15N,23W',
    settlement_name: 'Demo Settlement',
    mulebot_version: '2.0',
    persona:         'Natural & Regenerative Land Care Specialist',
    corpus_items:    42,
    corpus_updated:  new Date().toISOString(),
    sunlight_balance:'14.2 $SUNLIGHT',
    art_pending:     3,
    next_action: {
      type:  'eco_ops',
      label: 'Water quality check-in overdue — last reading 8 days ago',
      reward:'+12 ART',
    },
  } satisfies MulebotStatus
}
