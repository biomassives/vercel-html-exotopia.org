/**
 * src/lib/nav-history.ts
 *
 * Lightweight session-scoped navigation history for smart preset generation.
 *
 * Design:
 *   - Written to sessionStorage['exo_nav_history'] as a JSON array.
 *   - Capped at 30 entries (FIFO); older entries dropped automatically.
 *   - Cleared by the 48-hour enforceSessionHorizon() in src/lib/security.ts.
 *   - No PII stored — only star system names and planet identifiers from
 *     the NASA Exoplanet Archive (public data).
 *
 * Pages write events; MintStylePage reads them to generate contextual presets.
 */

import { createMintingStyle, type MintingStyle } from './mint-style'

// ── Storage key ───────────────────────────────────────────────────────────────

const HISTORY_KEY = 'exo_nav_history'
const MAX_ENTRIES = 30

// ── Event types ───────────────────────────────────────────────────────────────

export type NavEventType =
  | 'system_view'    // user entered a star system in galaxy view
  | 'surface_view'   // user visited a planet surface
  | 'moon_view'      // user visited a moon surface
  | 'context_zoom'   // user triggered the Earth↔System context zoom
  | 'hz_filter'      // user toggled HZ WORLDS filter on
  | 'nearby_filter'  // user toggled NEARBY filter on
  | 'cluster_view'   // user clicked a galaxy cluster in cosmic view

export interface NavEvent {
  type:  NavEventType
  ts:    number                       // Date.now()
  data:  Record<string, unknown>
}

// ── Read / write helpers ──────────────────────────────────────────────────────

export function readNavHistory(): NavEvent[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as NavEvent[]
  } catch {
    return []
  }
}

export function logNavEvent(type: NavEventType, data: Record<string, unknown>): void {
  try {
    const history = readNavHistory()
    history.push({ type, ts: Date.now(), data })
    // Keep only the most recent MAX_ENTRIES (FIFO)
    const trimmed = history.slice(-MAX_ENTRIES)
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch { /* sessionStorage full or unavailable */ }
}

// ── Smart preset generation ───────────────────────────────────────────────────

export interface SmartPreset {
  style:       MintingStyle
  reason:      string          // why this was suggested
  confidence:  'high' | 'medium' | 'low'
  activityTs:  number          // timestamp of the triggering event
}

/**
 * Analyse today's session history and return up to 5 contextually relevant
 * MintingStyle presets. Called by MintStylePage on mount.
 *
 * Priority order:
 *   1. Moon view       → L4/L5 SUBLUNARY moon surface preset
 *   2. HZ system visit → HZ Candidate Settlement (highlighted)
 *   3. System visits   → up to 2 unique planet settlements (most recent first)
 *   4. Context zoom    → "Cosmic Context" style (settlement + mule delta)
 *   5. Default fallback→ Eco-ops Community Token on Celo
 */
export function generateSmartPresets(history: NavEvent[]): SmartPreset[] {
  if (!history.length) return [defaultEcoOpsPreset()]

  const now     = Date.now()
  const presets: SmartPreset[] = []

  // ── 1. Moon view → L4 SUBLUNARY preset ───────────────────────────────────
  const moonEvents = history.filter(e => e.type === 'moon_view')
  for (const ev of moonEvents.slice(-1)) {      // most recent moon visit
    const style = createMintingStyle(
      `${ev.data.planetName ?? 'Moon'} Surface Settlement`
    )
    style.sources.settlement_status  = true
    style.settlementConfig.hostname   = String(ev.data.hostname ?? '')
    style.settlementConfig.planetName = String(ev.data.parentName ?? ev.data.hostname ?? '')
    style.ecocityConfig.modelId       = 'biosand-filter'  // water access on moon
    style.sources.ecocity_model       = true
    style.targetChain                 = 'algorand'
    // The MintPage exolocation tab will show exo-moon-surface-v1 when user mints
    style.description = `Moon surface settlement — L4 SUBLUNARY trophic level. ` +
      `Parent planet: ${ev.data.parentName ?? '?'}.`
    presets.push({
      style,
      reason:      `You visited the moon surface of ${ev.data.planetName ?? 'a moon'} this session`,
      confidence:  'high',
      activityTs:  ev.ts,
    })
  }

  // ── 2. HZ + system view → HZ Candidate Settlement ────────────────────────
  const hzFilter    = history.some(e => e.type === 'hz_filter')
  const systemViews = history.filter(e => e.type === 'system_view')
  const hzSystems   = systemViews.filter(e => e.data.hasHZ === true)

  for (const ev of hzSystems.slice(-1)) {
    const style = createMintingStyle(`${ev.data.hostname} — HZ Settlement`)
    style.sources.settlement_status  = true
    style.settlementConfig.hostname   = String(ev.data.hostname ?? '')
    style.settlementConfig.ecoOpsCount = 0
    style.settlementConfig.settlementAge = 0
    style.sources.ecocity_model       = true
    style.ecocityConfig.modelId       = 'aquaponics-tank'  // food + water for HZ habitation
    style.targetChain                 = 'algorand'
    style.description = `Habitable zone candidate at ${ev.data.hostname}. ` +
      `${(ev.data.dist as number | null) ? `${(ev.data.dist as number).toFixed(0)} pc from Earth.` : ''}`
    presets.push({
      style,
      reason: hzFilter
        ? `You filtered for HZ worlds and visited ${ev.data.hostname}`
        : `${ev.data.hostname} has a confirmed habitable-zone planet`,
      confidence: hzFilter ? 'high' : 'medium',
      activityTs: ev.ts,
    })
  }

  // ── 3. System visits → up to 2 unique planet settlements ─────────────────
  const seenSystems = new Set<string>(presets.map(p => p.style.settlementConfig.hostname))
  const uniqueSystems = [...new Map(
    [...systemViews].reverse()   // most recent first
      .filter(e => !seenSystems.has(String(e.data.hostname)))
      .map(e => [e.data.hostname, e])
  ).values()].slice(0, 2)

  for (const ev of uniqueSystems) {
    seenSystems.add(String(ev.data.hostname))
    const age = Math.round((now - ev.ts) / 60_000)    // minutes ago
    const style = createMintingStyle(`${ev.data.hostname} Settlement`)
    style.sources.settlement_status   = true
    style.settlementConfig.hostname    = String(ev.data.hostname ?? '')
    style.settlementConfig.ecoOpsCount = 0

    // If multi-star system, flag it
    if ((ev.data.snum as number | null) && (ev.data.snum as number) > 1) {
      style.description = `Binary/multi-star settlement at ${ev.data.hostname}. ` +
        `${ev.data.snum}-star system — tidal complexity increases.`
    } else {
      style.description = `Settlement at ${ev.data.hostname}. ` +
        `Visited ${age < 2 ? 'just now' : age < 60 ? `${age} min ago` : 'earlier today'}.`
    }

    style.sources.mule_delta         = true
    style.muleDeltaConfig.sphereId    = String(ev.data.hostname ?? '')
    style.muleDeltaConfig.settlementName = String(ev.data.hostname ?? '')
    style.targetChain                 = 'algorand'

    presets.push({
      style,
      reason: `You explored the ${ev.data.hostname} system ${age < 2 ? 'just now' : `${age} min ago`}`,
      confidence: age < 10 ? 'high' : 'medium',
      activityTs: ev.ts,
    })
  }

  // ── 4. Context zoom → Cosmic Context style ────────────────────────────────
  const ctxEvent = history.find(e => e.type === 'context_zoom')
  if (ctxEvent && presets.length < 4) {
    const lastSys = systemViews[systemViews.length - 1]
    if (lastSys && !seenSystems.has(String(lastSys.data.hostname))) {
      const style = createMintingStyle(`Cosmic Context — ${lastSys.data.hostname}`)
      style.sources.settlement_status = true
      style.sources.mule_delta        = true
      style.settlementConfig.hostname  = String(lastSys.data.hostname ?? '')
      style.muleDeltaConfig.sphereId   = String(lastSys.data.hostname ?? '')
      style.muleDeltaConfig.includeKnowledgeDelta = true
      style.muleDeltaConfig.deltaNote  = `Earth–System context view: ${(lastSys.data.dist as number | undefined)?.toFixed(0) ?? '?'} pc separation observed`
      style.description = `Multi-source style capturing the Earth↔${lastSys.data.hostname} cosmic perspective you explored.`
      style.targetChain = 'celo'
      presets.push({
        style,
        reason: 'You used the Earth↔System context zoom — recording that spatial perspective',
        confidence: 'medium',
        activityTs: ctxEvent.ts,
      })
    }
  }

  // ── 5. Fallback: always include an Eco-ops token if < 3 presets ──────────
  if (presets.length < 3) {
    presets.push(defaultEcoOpsPreset())
  }

  // Sort by confidence then recency
  const confOrder = { high: 0, medium: 1, low: 2 }
  presets.sort((a, b) =>
    confOrder[a.confidence] - confOrder[b.confidence] ||
    b.activityTs - a.activityTs
  )

  return presets.slice(0, 5)
}

// ── Default fallback presets ──────────────────────────────────────────────────

function defaultEcoOpsPreset(): SmartPreset {
  const style = createMintingStyle('Community Eco-ops Token')
  style.sources.settlement_status = true
  style.sources.ecocity_model     = true
  style.ecocityConfig.modelId     = 'biosand-filter'
  style.ecocityConfig.includeImpactMetrics = true
  style.targetChain               = 'celo'
  style.description = 'Eco-ops participation token for field check-ins and community milestones. Mints on Celo for low-cost mobile transactions.'
  return {
    style,
    reason: 'A good starting point — eco-ops tokens on Celo are the core community reward',
    confidence: 'low',
    activityTs: Date.now(),
  }
}
