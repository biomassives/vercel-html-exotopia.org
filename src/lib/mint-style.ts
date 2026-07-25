/**
 * src/lib/mint-style.ts
 *
 * Generative Minting Style — types, source catalogue, and metadata composer.
 *
 * A MintingStyle is a named RECIPE that combines up to five network data sources
 * into a single NFT metadata object.  The same style applied at different times
 * produces different (but related) NFTs that reflect the current live state of
 * each source — artist output, ecocity model selection, Mule knowledge delta,
 * gallery event, and settlement history.
 *
 * Sources:
 *   wb1_artist        — Worldbridger One artist/musician profile and output
 *   ecocity_model     — Ecocity sustainable design object (exchangeable 3D code)
 *   mule_delta        — mule-bot corpus knowledge delta since last mint
 *   gallery_event     — Exotopia gallery show / event metadata
 *   settlement_status — Exotopia settlement state and eco-ops history
 */

import { STANDARD_SPLIT, toSunlightShape } from './resonance-split'

import type { Erc721Metadata, Erc721Attribute } from './evm/erc721-metadata'

// ── Source catalogue — Ecocity sustainable models ─────────────────────────────

export interface EcocityModelEntry {
  id:       string
  name:     string
  category: 'watsan' | 'energy' | 'shelter' | 'healthcare' | 'food'
  impact:   string
  gltfCid?: string   // IPFS CID for the 3D GLTF model (set when uploaded)
}

export const ECOCITY_MODELS: EcocityModelEntry[] = [
  // WATSAN
  { id: 'biosand-filter',     name: 'Biosand Filter',       category: 'watsan',     impact: '200 L/day clean water per unit' },
  { id: 'rainwater-harvest',  name: 'Rainwater Harvester',  category: 'watsan',     impact: 'Up to 50,000 L/year per 100m² roof' },
  { id: 'composting-unit',    name: 'Composting Unit',       category: 'watsan',     impact: '500 kg compost/year from household waste' },
  { id: 'waste-map-node',     name: 'Waste Map Node',        category: 'watsan',     impact: 'Network node for circular waste tracking' },
  { id: 'latrine-system',     name: 'Latrine System',        category: 'watsan',     impact: 'Serves 10 households — 100% waste-to-resource' },
  // ENERGY
  { id: 'solar-array',        name: 'Solar Array',           category: 'energy',     impact: '1.5 kWh/day — offsets 180 kg CO₂/year' },
  { id: 'biogas-digester',    name: 'Biogas Digester',       category: 'energy',     impact: '2–4 hours cooking gas/day per household' },
  { id: 'micro-hydro',        name: 'Micro-hydro Turbine',   category: 'energy',     impact: '500 W continuous (site-dependent)' },
  { id: 'led-cluster',        name: 'LED Lighting Cluster',  category: 'energy',     impact: '80% energy reduction vs kerosene' },
  // SHELTER
  { id: 'earth-block',        name: 'Compressed Earth Block',category: 'shelter',    impact: 'No cement required — local materials only' },
  { id: 'green-roof',         name: 'Green Roof Module',     category: 'shelter',    impact: 'Reduces roof temperature 8–12°C' },
  { id: 'ventilation-tower',  name: 'Ventilation Tower',     category: 'shelter',    impact: 'Reduces indoor temperature 4–6°C' },
  // HEALTHCARE
  { id: 'health-post',        name: 'Health Post',           category: 'healthcare', impact: 'Serves 50 households for primary screening' },
  { id: 'wq-test-station',    name: 'WQ Test Station',       category: 'healthcare', impact: 'Generates on-chain Water Quality Certs' },
  { id: 'herb-garden',        name: 'Herb Garden',           category: 'healthcare', impact: '15 species — reduces OTC medicine dependence' },
  // FOOD
  { id: 'aquaponics-tank',    name: 'Aquaponics Tank',       category: 'food',       impact: '20 kg fish + 40 kg vegetables per year' },
  { id: 'food-garden-bed',    name: 'Food Garden Bed',       category: 'food',       impact: '30 kg yield per season per 4m² bed' },
  { id: 'seed-bank',          name: 'Seed Bank',             category: 'food',       impact: 'Preserves 50+ varieties — community seed sovereignty' },
  { id: 'solar-dryer',        name: 'Solar Dryer',           category: 'food',       impact: 'Extends food shelf life 6–12 months' },
]

export const ECOCITY_CATEGORIES = ['watsan', 'energy', 'shelter', 'healthcare', 'food'] as const
export type EcocityCategory = typeof ECOCITY_CATEGORIES[number]

// ── Minting style types ───────────────────────────────────────────────────────

export type TargetChain  = 'algorand' | 'solana' | 'polygon' | 'celo'
export type OutputFormat = 'erc721'   | 'arc3'   | 'metaplex'

export interface Wb1Config {
  artistHandle:  string
  community:     string
  artistRole:    string      // DJ / Visual Artist / Musician / etc.
  includeMusic:  boolean
  trackTitle:    string
  audioCid:      string      // IPFS CID of the audio track
  includeVisual: boolean
  artworkTitle:  string
  artworkCid:    string      // IPFS CID of artwork image
  license:       'personal_use' | 'commercial' | 'sync' | 'exclusive'
}

export interface EcocityConfig {
  modelId:              string
  includeImpactMetrics: boolean
  includeGltfRef:       boolean   // embed 3D object CID as exchangeable asset ref
  customImpactNote:     string    // override impact metric description
}

export interface MuleDeltaConfig {
  sphereId:             string    // planet name / settlement identifier
  settlementName:       string
  tier:                 'Foal' | 'Colt' | 'Stallion' | 'Sovereign'
  corpusDepth:          number    // number of corpus items
  includeKnowledgeDelta: boolean
  deltaNote:            string    // what new knowledge was added since last mint
  visitorCount:         number
  includeVisitorStats:  boolean
}

export interface GalleryEventConfig {
  eventId:          string
  eventTitle:       string
  venuePlanet:      string
  eventDate:        string        // ISO date
  curatorHandle:    string
  artworkCount:     number
  includeAttendance: boolean
  attendeeCount:    number
  eventType:        'exhibition' | 'live_session' | 'workshop' | 'rap_battle' | 'showcase'
}

export interface SettlementConfig {
  hostname:             string
  planetName:           string
  ecoOpsCount:          number
  activityTypes:        string[]   // ['wqMap', 'farmMap', ...]
  objectsInstalled:     number
  includeEcoOpsHistory: boolean
  includeObjectList:    boolean
  settlementAge:        number     // days since first check-in
  milestones:           string[]   // earned milestone names
}

export interface MintingStyle {
  id:          string
  name:        string
  description: string
  created:     string   // ISO date
  updated:     string
  mintCount:   number   // how many times this style has been used to mint

  // Source activation flags
  sources: {
    wb1_artist:        boolean
    ecocity_model:     boolean
    mule_delta:        boolean
    gallery_event:     boolean
    settlement_status: boolean
  }

  // Per-source config
  wb1Config:        Wb1Config
  ecocityConfig:    EcocityConfig
  muleDeltaConfig:  MuleDeltaConfig
  galleryConfig:    GalleryEventConfig
  settlementConfig: SettlementConfig

  // Output
  targetChain:  TargetChain
  nftSymbol:    string
  outputFormat: OutputFormat
}

// ── Default configs ───────────────────────────────────────────────────────────

export function defaultWb1Config(): Wb1Config {
  return {
    artistHandle: '', community: '', artistRole: 'Artist',
    includeMusic: false, trackTitle: '', audioCid: '',
    includeVisual: true, artworkTitle: '', artworkCid: '',
    license: 'personal_use',
  }
}

export function defaultEcocityConfig(): EcocityConfig {
  return {
    modelId: 'biosand-filter',
    includeImpactMetrics: true,
    includeGltfRef: true,
    customImpactNote: '',
  }
}

export function defaultMuleConfig(): MuleDeltaConfig {
  return {
    sphereId: '', settlementName: '',
    tier: 'Foal', corpusDepth: 0,
    includeKnowledgeDelta: true, deltaNote: '',
    visitorCount: 0, includeVisitorStats: false,
  }
}

export function defaultGalleryConfig(): GalleryEventConfig {
  return {
    eventId: '', eventTitle: '', venuePlanet: '',
    eventDate: new Date().toISOString().split('T')[0]!,
    curatorHandle: '', artworkCount: 0,
    includeAttendance: false, attendeeCount: 0,
    eventType: 'exhibition',
  }
}

export function defaultSettlementConfig(): SettlementConfig {
  return {
    hostname: '', planetName: '', ecoOpsCount: 0,
    activityTypes: [], objectsInstalled: 0,
    includeEcoOpsHistory: true, includeObjectList: false,
    settlementAge: 0, milestones: [],
  }
}

export function createMintingStyle(name = 'New Style'): MintingStyle {
  const now = new Date().toISOString()
  return {
    id:          crypto.randomUUID(),
    name,
    description: '',
    created:     now,
    updated:     now,
    mintCount:   0,
    sources: {
      wb1_artist:        false,
      ecocity_model:     false,
      mule_delta:        false,
      gallery_event:     false,
      settlement_status: false,
    },
    wb1Config:        defaultWb1Config(),
    ecocityConfig:    defaultEcocityConfig(),
    muleDeltaConfig:  defaultMuleConfig(),
    galleryConfig:    defaultGalleryConfig(),
    settlementConfig: defaultSettlementConfig(),
    targetChain:  'celo',
    nftSymbol:    'PONINK',
    outputFormat: 'erc721',
  }
}

// ── Metadata composer ─────────────────────────────────────────────────────────

export interface ComposeResult {
  meta:     Erc721Metadata
  serial:   number            // style.mintCount + 1
  sources:  string[]          // active source names
  warnings: string[]
}

export function composeMetadata(style: MintingStyle): ComposeResult {
  const attrs:    Erc721Attribute[] = []
  const sources:  string[]          = []
  const warnings: string[]          = []
  const serial = style.mintCount + 1

  let nameParts: string[] = [style.name]
  const descParts: string[] = []

  // ── Worldbridger One — artist/musician ─────────────────────────────────────
  if (style.sources.wb1_artist) {
    const c = style.wb1Config
    if (!c.artistHandle.trim()) warnings.push('Worldbridger One: artist handle is empty')
    else {
      sources.push('worldbridger-one')
      attrs.push({ trait_type: 'Artist',    value: c.artistHandle })
      attrs.push({ trait_type: 'Community', value: c.community || '—' })
      attrs.push({ trait_type: 'Role',      value: c.artistRole })
      attrs.push({ trait_type: 'License',   value: c.license })
      descParts.push(`Created in collaboration with ${c.artistHandle} (${c.community}).`)

      if (c.includeMusic && c.trackTitle) {
        attrs.push({ trait_type: 'Featured Track', value: c.trackTitle })
        if (!c.audioCid) warnings.push('Worldbridger One: audio CID missing — track reference incomplete')
      }
      if (c.includeVisual && c.artworkTitle) {
        attrs.push({ trait_type: 'Artwork',       value: c.artworkTitle })
        nameParts = [`${c.artworkTitle} — ${style.name}`]
      }
    }
  }

  // ── Ecocity — sustainable design model (exchangeable 3D object code) ────────
  if (style.sources.ecocity_model) {
    const c   = style.ecocityConfig
    const mdl = ECOCITY_MODELS.find(m => m.id === c.modelId)
    if (!mdl) {
      warnings.push('Ecocity: model not found — check model ID')
    } else {
      sources.push('ecocity')
      attrs.push({ trait_type: 'Eco Model',  value: mdl.name })
      attrs.push({ trait_type: 'Category',   value: mdl.category.toUpperCase() })
      if (c.includeImpactMetrics) {
        attrs.push({ trait_type: 'Impact',   value: c.customImpactNote || mdl.impact })
      }
      if (c.includeGltfRef) {
        attrs.push({ trait_type: '3D Model (GLTF)', value: mdl.gltfCid ? `ipfs://${mdl.gltfCid}` : 'pending IPFS upload' })
        if (!mdl.gltfCid) warnings.push(`Ecocity: ${mdl.name} GLTF not yet uploaded to IPFS`)
      }
      descParts.push(`Represents the Ecocity ${mdl.name} design (${mdl.category.toUpperCase()}).`)
    }
  }

  // ── mule-bot — knowledge delta ───────────────────────────────────────────
  if (style.sources.mule_delta) {
    const c = style.muleDeltaConfig
    if (!c.sphereId.trim()) warnings.push('mule-bot: sphere ID is empty')
    else {
      sources.push('robot-mule')
      attrs.push({ trait_type: 'Settlement Sphere', value: c.settlementName || c.sphereId })
      attrs.push({ trait_type: 'Mule Tier',         value: c.tier })
      attrs.push({ trait_type: 'Corpus Depth',      value: c.corpusDepth, display_type: 'number' })
      if (c.includeKnowledgeDelta && c.deltaNote) {
        attrs.push({ trait_type: 'Knowledge Delta', value: c.deltaNote })
      }
      if (c.includeVisitorStats) {
        attrs.push({ trait_type: 'Visitor Count',   value: c.visitorCount, display_type: 'number' })
      }
      descParts.push(`Mule tier ${c.tier} — corpus depth ${c.corpusDepth}.`)
    }
  }

  // ── Gallery show / event ───────────────────────────────────────────────────
  if (style.sources.gallery_event) {
    const c = style.galleryConfig
    if (!c.eventTitle.trim()) warnings.push('Gallery Event: event title is empty')
    else {
      sources.push('gallery-event')
      attrs.push({ trait_type: 'Event',      value: c.eventTitle })
      attrs.push({ trait_type: 'Event Type', value: c.eventType.replace('_', ' ') })
      attrs.push({ trait_type: 'Venue',      value: c.venuePlanet || '—' })
      attrs.push({ trait_type: 'Date',       value: c.eventDate })
      if (c.curatorHandle) attrs.push({ trait_type: 'Curated By', value: c.curatorHandle })
      if (c.artworkCount)  attrs.push({ trait_type: 'Artworks Shown', value: c.artworkCount, display_type: 'number' })
      if (c.includeAttendance) {
        attrs.push({ trait_type: 'Attendance', value: c.attendeeCount, display_type: 'number' })
      }
      descParts.push(`Provenance from gallery event "${c.eventTitle}" on ${c.eventDate}.`)
    }
  }

  // ── Settlement status / history ────────────────────────────────────────────
  if (style.sources.settlement_status) {
    const c = style.settlementConfig
    if (!c.hostname.trim()) warnings.push('Settlement: hostname is empty')
    else {
      sources.push('settlement')
      attrs.push({ trait_type: 'Settlement Host', value: c.hostname })
      attrs.push({ trait_type: 'Planet',          value: c.planetName || '—' })
      if (c.includeEcoOpsHistory) {
        attrs.push({ trait_type: 'Eco-ops Count',    value: c.ecoOpsCount,    display_type: 'number' })
        attrs.push({ trait_type: 'Settlement Age',   value: c.settlementAge,  display_type: 'number' })
        if (c.activityTypes.length) {
          attrs.push({ trait_type: 'Activity Types', value: c.activityTypes.join(', ') })
        }
        if (c.milestones.length) {
          attrs.push({ trait_type: 'Milestones', value: c.milestones.join(' · ') })
        }
      }
      if (c.includeObjectList) {
        attrs.push({ trait_type: 'Objects Installed', value: c.objectsInstalled, display_type: 'number' })
      }
      descParts.push(`Settlement at ${c.planetName} (${c.hostname}) — ${c.ecoOpsCount} eco-ops check-ins.`)
    }
  }

  if (sources.length === 0) warnings.push('No sources are active — enable at least one source')

  // ── Standard attributes ────────────────────────────────────────────────────
  attrs.push({ trait_type: 'Protocol',        value: 'PON INK v1.0' })
  attrs.push({ trait_type: 'Minting Style',   value: style.name })
  attrs.push({ trait_type: 'Sources Combined', value: sources.length, display_type: 'number' })
  attrs.push({ trait_type: 'Serial',          value: serial, display_type: 'number' })
  attrs.push({ trait_type: 'Chain',           value: style.targetChain })

  const finalName = `${nameParts[0]} #${String(serial).padStart(4, '0')}`
  const description = descParts.join(' ')
    || `Generative NFT composed via PON INK minting style "${style.name}".`

  const meta: Erc721Metadata = {
    name:        finalName,
    description,
    image:       style.sources.wb1_artist && style.wb1Config.artworkCid
                   ? `ipfs://${style.wb1Config.artworkCid}`
                   : '',
    external_url: 'https://pon.ink',
    animation_url: style.sources.wb1_artist && style.wb1Config.includeMusic && style.wb1Config.audioCid
                   ? `ipfs://${style.wb1Config.audioCid}`
                   : null,
    attributes:  attrs,
    pon_ink: {
      nft_type:      'generative_composition',
      style_id:      style.id,
      style_name:    style.name,
      sources,
      serial,
      target_chain:  style.targetChain,
      composed_at:   new Date().toISOString(),
      resonance_split: toSunlightShape(STANDARD_SPLIT),
    },
  }

  return { meta, serial, sources, warnings }
}
