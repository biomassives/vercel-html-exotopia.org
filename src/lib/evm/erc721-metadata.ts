/**
 * src/lib/evm/erc721-metadata.ts
 *
 * ERC-721 / OpenSea-compatible metadata builders for all EVM-chain NFT types
 * in the PON INK protocol.
 *
 * All builders return a plain JSON object ready for:
 *   1. Pinata IPFS upload (then use returned CID as tokenURI)
 *   2. On-chain URI storage (if metadata is small enough)
 *   3. Dry-run display in MintPage.vue
 *
 * Fee isolation:
 *   Metadata reflects creator attribution and community impact only.
 *   Network gas costs are NEVER included in the metadata schema.
 *
 * Chains:
 *   Polygon (MATIC) — $SUNLIGHT, Water Quality Certs, Health Card IDs
 *   Celo            — Community Badges, Eco-ops Participation Tokens
 */

// ── Shared types ──────────────────────────────────────────────────────────────

export interface Erc721Attribute {
  trait_type:   string
  value:        string | number
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date'
}

export interface Erc721Metadata {
  name:          string
  description:   string
  image:         string          // IPFS URI: ipfs://<CID>
  external_url?: string
  animation_url?: string | null
  attributes:    Erc721Attribute[]
  // PON INK extension fields (shown in explorers that support arbitrary properties)
  pon_ink?:      Record<string, unknown>
}

function today(): string {
  return new Date().toISOString().split('T')[0]!
}

// ── $SUNLIGHT — Sunlight Creative NFT (Polygon) ──────────────────────────────────────

export interface SunlightParams {
  title:          string
  artist:         string          // pon.ink handle
  duration_sec:   number
  bpm?:           number | null
  key?:           string | null   // musical key e.g. "Am"
  genre?:         string | null
  ipfs_audio_cid: string          // audio file IPFS CID
  ipfs_cover_cid?: string         // cover art IPFS CID
  license:        'personal_use' | 'commercial' | 'sync' | 'exclusive'
  co_artists?:    string[]
  sample_credits?: string[]
  description?:   string
}

export function buildSunlightMeta(p: SunlightParams): Erc721Metadata {
  const attrs: Erc721Attribute[] = [
    { trait_type: 'NFT Type',    value: '$SUNLIGHT NFT' },
    { trait_type: 'Artist',      value: p.artist },
    { trait_type: 'Duration',    value: p.duration_sec, display_type: 'number' },
    { trait_type: 'License',     value: p.license },
    { trait_type: 'Protocol',    value: 'PON INK v1.0' },
    { trait_type: 'Chain',       value: 'Polygon' },
    { trait_type: 'Mint Date',   value: today() },
  ]
  if (p.bpm)   attrs.push({ trait_type: 'BPM',   value: p.bpm,   display_type: 'number' })
  if (p.key)   attrs.push({ trait_type: 'Key',   value: p.key })
  if (p.genre) attrs.push({ trait_type: 'Genre', value: p.genre })
  if (p.co_artists?.length) attrs.push({ trait_type: 'Co-artists', value: p.co_artists.join(', ') })

  return {
    name:          p.title,
    description:   p.description ?? `$SUNLIGHT Sunlight NFT by ${p.artist} on PON INK.`,
    image:         p.ipfs_cover_cid ? `ipfs://${p.ipfs_cover_cid}` : '',
    external_url:  'https://pon.ink',
    animation_url: `ipfs://${p.ipfs_audio_cid}`,
    attributes:    attrs,
    pon_ink: {
      nft_type:       'sunlight',
      chain:          'polygon',
      audio_cid:      p.ipfs_audio_cid,
      sample_credits: p.sample_credits ?? [],
      license_terms:  p.license,
      resonance_split: { creator: 0.99, hardware_fund: 0.0075, platform: 0.0025 },
    },
  }
}

// ── Water Quality Certification (Polygon) ────────────────────────────────────

export interface WqCertParams {
  cert_id:        string          // e.g. "WQC-LAMU-2026-0012"
  location_name:  string          // human-readable site name
  lat?:           number | null
  lng?:           number | null
  measured_by:    string          // field worker pon.ink handle
  date_utc:       string          // ISO date of measurement
  // measurements
  ph?:            number | null
  turbidity_ntu?: number | null
  conductivity_us_cm?: number | null
  nitrate_mg_l?:  number | null
  coliform_cfu_100ml?: number | null
  // outcome
  potable:        boolean
  ipfs_report_cid?: string        // PDF report CID
}

export function buildWqCertMeta(p: WqCertParams): Erc721Metadata {
  const attrs: Erc721Attribute[] = [
    { trait_type: 'NFT Type',      value: 'Water Quality Certificate' },
    { trait_type: 'Cert ID',       value: p.cert_id },
    { trait_type: 'Location',      value: p.location_name },
    { trait_type: 'Measured By',   value: p.measured_by },
    { trait_type: 'Date',          value: p.date_utc },
    { trait_type: 'Potable',       value: p.potable ? 'YES' : 'NO' },
    { trait_type: 'Protocol',      value: 'PON INK v1.0' },
    { trait_type: 'Chain',         value: 'Polygon' },
  ]
  if (p.ph != null)                 attrs.push({ trait_type: 'pH',                    value: p.ph,                display_type: 'number' })
  if (p.turbidity_ntu != null)      attrs.push({ trait_type: 'Turbidity (NTU)',        value: p.turbidity_ntu,     display_type: 'number' })
  if (p.conductivity_us_cm != null) attrs.push({ trait_type: 'Conductivity (µS/cm)',  value: p.conductivity_us_cm,display_type: 'number' })
  if (p.nitrate_mg_l != null)       attrs.push({ trait_type: 'Nitrate (mg/L)',         value: p.nitrate_mg_l,      display_type: 'number' })
  if (p.coliform_cfu_100ml != null) attrs.push({ trait_type: 'Coliform (CFU/100mL)',  value: p.coliform_cfu_100ml,display_type: 'number' })
  if (p.lat != null && p.lng != null) {
    attrs.push({ trait_type: 'Latitude',  value: p.lat,  display_type: 'number' })
    attrs.push({ trait_type: 'Longitude', value: p.lng,  display_type: 'number' })
  }

  return {
    name:         `Water Quality Certificate — ${p.location_name}`,
    description:  `On-chain water quality certification for ${p.location_name} measured on ${p.date_utc}. Potable: ${p.potable ? 'YES' : 'NO'}.`,
    image:        '',
    external_url: 'https://pon.ink/wqcert',
    attributes:   attrs,
    pon_ink: {
      nft_type:      'wq_cert',
      chain:         'polygon',
      cert_id:       p.cert_id,
      report_cid:    p.ipfs_report_cid ?? null,
      tamper_evident: true,
      data_standard: 'WHO-2022',
    },
  }
}

// ── Community Badge (Celo) ────────────────────────────────────────────────────

export interface CommunityBadgeParams {
  badge_id:       string          // e.g. "BADGE-FANA-KA-2026-042"
  badge_name:     string          // e.g. "Fana Ka Founding Member"
  community:      string          // e.g. "Fana Ka"
  recipient:      string          // pon.ink handle
  awarded_for:    string          // human-readable reason
  event_id?:      string | null   // pon.ink event ID if event-triggered
  tier:           'bronze' | 'silver' | 'gold' | 'platinum'
  ipfs_art_cid?:  string
  description?:   string
}

export function buildCommunityBadgeMeta(p: CommunityBadgeParams): Erc721Metadata {
  const tierColors: Record<string, string> = {
    bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2',
  }
  const attrs: Erc721Attribute[] = [
    { trait_type: 'NFT Type',    value: 'Community Badge' },
    { trait_type: 'Badge ID',    value: p.badge_id },
    { trait_type: 'Community',   value: p.community },
    { trait_type: 'Recipient',   value: p.recipient },
    { trait_type: 'Tier',        value: p.tier.charAt(0).toUpperCase() + p.tier.slice(1) },
    { trait_type: 'Awarded For', value: p.awarded_for },
    { trait_type: 'Chain',       value: 'Celo' },
    { trait_type: 'Protocol',    value: 'PON INK v1.0' },
    { trait_type: 'Awarded',     value: today() },
  ]
  if (p.event_id) attrs.push({ trait_type: 'Event ID', value: p.event_id })

  return {
    name:         p.badge_name,
    description:  p.description ?? `Community badge awarded to ${p.recipient} by ${p.community}: "${p.awarded_for}".`,
    image:        p.ipfs_art_cid ? `ipfs://${p.ipfs_art_cid}` : '',
    external_url: 'https://pon.ink/community',
    attributes:   attrs,
    pon_ink: {
      nft_type:  'community_badge',
      chain:     'celo',
      badge_id:  p.badge_id,
      community: p.community,
      tier:      p.tier,
      tier_color: tierColors[p.tier],
    },
  }
}

// ── Exolocation NFT — virtual land deed (Algorand ARC-3 / ERC-721) ───────────
// This is the primary NFT for the Exotopia ecosystem: a permanent on-chain
// address anchoring a settlement to a specific point on a confirmed exoplanet.

export interface ExolocParams {
  // Identity
  planet_name:      string    // e.g. "Kepler-442b"
  hostname:         string    // e.g. "Kepler-442"
  // Coordinate
  coord_system:     string    // e.g. "exo-surface-v1"
  region:           string    // e.g. "15N,23W" — human-readable label
  boundary?:        string    // full exoloc address string
  plot_lat?:        number
  plot_lon?:        number
  // Zone metadata
  zone_name?:       string    // e.g. "Equatorial Dayside Terra"
  climate_class?:   string    // e.g. "temperate"
  trophic_level?:   string    // e.g. "L4 SUBLUNARY"
  // Moon-specific (when coord_system is exo-moon-*)
  moon_index?:      number
  lagrange_point?:  string    // "L4" | "L5"
  interface_zone?:  string    // "hill-sphere" | "roche-limit" | …
  // Settlement pathway + mule
  pathway_id?:      string    // "eco" | "gallery" | "watsan" | …
  mule_corpus_seed?: string   // hex seed for Mule knowledge base
  // Stellar context
  host_spectype?:   string    // e.g. "G2V"
  host_teff?:       number    // e.g. 5778 (K)
  dist_pc?:         number    // distance in parsecs
  // Deed metadata
  design_hash?:     string    // SHA-256 from SettlementHashmark
  resonance_split:  { creator: number; hardware_fund: number; platform: number }
  minted_by?:       string    // wallet address of minter
}

/**
 * Generate a Letters Patent deed SVG as an inline data URI.
 * Used as `image` in exolocation metadata until an IPFS CID is available.
 * The URI is compatible with OpenSea and most NFT explorers.
 */
export function buildDeedSvgUri(p: ExolocParams): string {
  const latStr = p.plot_lat != null
    ? `${Math.abs(p.plot_lat).toFixed(1)}°${p.plot_lat >= 0 ? 'N' : 'S'}`
    : '—'
  const lonStr = p.plot_lon != null
    ? `${Math.abs(p.plot_lon).toFixed(1)}°${p.plot_lon >= 0 ? 'E' : 'W'}`
    : '—'
  const coords = p.plot_lat != null ? `${latStr}, ${lonStr}` : p.region
  const deedNo = `EXO-${p.hostname.slice(0, 4).toUpperCase()}-${p.planet_name.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase()}`
  const issued = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 220" width="900" height="220">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1c0d00"/><stop offset="50%" stop-color="#150900"/><stop offset="100%" stop-color="#0e0600"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f0c040"/><stop offset="50%" stop-color="#d4900c"/><stop offset="100%" stop-color="#c07808"/>
  </linearGradient>
  <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#6a3800" stop-opacity="0"/>
    <stop offset="20%" stop-color="#c8880a"/>
    <stop offset="50%" stop-color="#f0c040"/>
    <stop offset="80%" stop-color="#c8880a"/>
    <stop offset="100%" stop-color="#6a3800" stop-opacity="0"/>
  </linearGradient>
  <filter id="glow" x="-5%" y="-20%" width="110%" height="140%">
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<rect width="900" height="220" fill="url(#bg)"/>
<rect x="6" y="6" width="888" height="208" rx="4" fill="none" stroke="#d4900c" stroke-width="1.5" stroke-opacity="0.70"/>
<rect x="14" y="14" width="872" height="192" rx="3" fill="none" stroke="#c8880a" stroke-width="0.6" stroke-opacity="0.45"/>
<text x="450" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="10" letter-spacing="0.28em" fill="#a06010" opacity="0.80">EXOTOPIA SETTLEMENT AUTHORITY &amp;middot; PON INK PROTOCOL</text>
<rect x="100" y="47" width="700" height="0.8" fill="url(#goldH)" opacity="0.55"/>
<text x="450" y="82" text-anchor="middle" filter="url(#glow)" font-family="Georgia,serif" font-size="32" font-weight="bold" letter-spacing="0.12em" fill="#f0c040">LETTERS PATENT</text>
<text x="450" y="100" text-anchor="middle" font-family="Georgia,serif" font-size="11" letter-spacing="0.22em" fill="#e8a020" opacity="0.88">TERRITORIAL LAND DEED &amp;middot; FORTY ACRES AND A MULE</text>
<rect x="60" y="108" width="780" height="1.0" fill="url(#goldH)" opacity="0.70"/>
<text x="450" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="9.5" fill="#c8a060" opacity="0.75" letter-spacing="0.04em">Be it known that the bearer has lawfully claimed the herein described parcel of virtual land,</text>
<text x="450" y="144" text-anchor="middle" font-family="Georgia,serif" font-size="9.5" fill="#c8a060" opacity="0.75" letter-spacing="0.04em">held in perpetuity under the PON INK Protocol, GPL v3, and the customs of the Ecommunity DAO.</text>
<text x="450" y="170" text-anchor="middle" filter="url(#glow)" font-family="monospace" font-size="15" font-weight="700" fill="#f0c040" letter-spacing="0.08em">${p.planet_name}   &amp;middot;   ${coords}</text>
<rect x="60" y="180" width="780" height="0.8" fill="url(#goldH)" opacity="0.55"/>
<text x="90" y="200" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="0.12em" fill="#66cc66" opacity="0.80">FREE TO MINT &amp;middot; 0 USDC</text>
<text x="450" y="198" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="0.10em" fill="#8a6020" opacity="0.70">DEED NO. ${deedNo} &amp;middot; ISSUED ${issued}</text>
<circle cx="840" cy="110" r="42" fill="none" stroke="#c8880a" stroke-width="0.8" opacity="0.40"/>
<circle cx="840" cy="110" r="36" fill="none" stroke="#c8880a" stroke-width="0.5" opacity="0.30"/>
<text x="840" y="118" text-anchor="middle" font-family="monospace" font-size="5.5" letter-spacing="0.14em" fill="#a06010" opacity="0.60">PON INK</text>
<text x="840" y="128" text-anchor="middle" font-family="monospace" font-size="5" letter-spacing="0.10em" fill="#a06010" opacity="0.55">EXOTOPIA</text>
<circle cx="60" cy="110" r="38" fill="none" stroke="#c8880a" stroke-width="0.8" opacity="0.35"/>
<text x="60" y="116" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#c8880a" opacity="0.45">&#9733;</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * ERC-721 / OpenSea-compatible metadata for Exolocation deeds.
 * Works for Polygon/Celo on-chain storage and Algorand ARC-3 IPFS upload.
 */
export function buildExolocMeta(p: ExolocParams): Erc721Metadata {
  const exolocAddr = p.boundary
    ?? `${p.coord_system}:${p.planet_name}:${p.region}`

  const attrs: Erc721Attribute[] = [
    { trait_type: 'NFT Type',        value: 'Exolocation Deed' },
    { trait_type: 'Coord System',    value: p.coord_system },
    { trait_type: 'Reference Body',  value: p.planet_name },
    { trait_type: 'Host Star',       value: p.hostname },
    { trait_type: 'Region',          value: p.region },
    { trait_type: 'Plot Area',       value: '40 virtual acres (10° × 10°)' },
    { trait_type: 'Protocol',        value: 'PON INK v1.0' },
    { trait_type: 'Minted',          value: today() },
  ]

  if (p.zone_name)      attrs.push({ trait_type: 'Zone',          value: p.zone_name })
  if (p.climate_class)  attrs.push({ trait_type: 'Climate Class', value: p.climate_class })
  if (p.trophic_level)  attrs.push({ trait_type: 'Trophic Level', value: p.trophic_level })
  if (p.pathway_id)     attrs.push({ trait_type: 'Pathway',       value: p.pathway_id })
  if (p.host_spectype)  attrs.push({ trait_type: 'Stellar Class', value: p.host_spectype })
  if (p.host_teff)      attrs.push({ trait_type: 'Stellar Temp',  value: p.host_teff, display_type: 'number' })
  if (p.dist_pc)        attrs.push({ trait_type: 'Distance (pc)', value: p.dist_pc,   display_type: 'number' })
  if (p.plot_lat != null) attrs.push({ trait_type: 'Latitude',    value: p.plot_lat,  display_type: 'number' })
  if (p.plot_lon != null) attrs.push({ trait_type: 'Longitude',   value: p.plot_lon,  display_type: 'number' })
  if (p.moon_index)     attrs.push({ trait_type: 'Moon Index',    value: p.moon_index, display_type: 'number' })
  if (p.lagrange_point) attrs.push({ trait_type: 'Lagrange Point',value: p.lagrange_point })
  if (p.mule_corpus_seed) attrs.push({ trait_type: 'Mule Corpus Seed', value: p.mule_corpus_seed })
  if (p.design_hash)    attrs.push({ trait_type: 'Design Hash',   value: p.design_hash.slice(0, 12) + '…' })

  return {
    name:         `Exolocation — ${p.planet_name} · ${p.region}`,
    description:  `Virtual land deed: 40 acres on ${p.planet_name} (${p.hostname}) at ${p.region}. `
                + `Coordinate system: ${p.coord_system}. `
                + (p.zone_name ? `Zone: ${p.zone_name}. ` : '')
                + `Issued under PON INK v1.0 · GPL v3.`,
    image:        buildDeedSvgUri(p),   // inline SVG deed; replaced with IPFS CID after upload
    external_url: `https://exotopia.org/surface/${encodeURIComponent(p.hostname)}/${encodeURIComponent(p.planet_name)}`,
    attributes:   attrs,
    pon_ink: {
      nft_type:        'exolocation',
      exoloc_address:  exolocAddr,
      coord_system:    p.coord_system,
      reference_body:  p.planet_name,
      hostname:        p.hostname,
      region:          p.region,
      ...(p.plot_lat != null ? { plot_lat: p.plot_lat } : {}),
      ...(p.plot_lon != null ? { plot_lon: p.plot_lon } : {}),
      ...(p.zone_name       ? { zone_name: p.zone_name } : {}),
      ...(p.climate_class   ? { climate_class: p.climate_class } : {}),
      ...(p.trophic_level   ? { trophic_level: p.trophic_level } : {}),
      ...(p.pathway_id      ? { pathway: p.pathway_id } : {}),
      ...(p.design_hash     ? { design_hash: p.design_hash } : {}),
      ...(p.mule_corpus_seed? { mule_corpus_seed: p.mule_corpus_seed } : {}),
      ...(p.minted_by       ? { minted_by: p.minted_by } : {}),
      resonance_split: p.resonance_split,
      standard:        'ERC-721 + Algorand-ARC3-compatible',
    },
  }
}

/**
 * Algorand ARC-69 note field (compact, ≤ 1 KB, stored on-chain in the ASA note).
 * This is the tamper-evident fingerprint that proves the full ARC-3 metadata.
 */
export function buildArc69Note(p: ExolocParams, arc3IpfsCid: string): Record<string, unknown> {
  return {
    standard:       'arc69',
    media_url:      `ipfs://${arc3IpfsCid}`,
    mime_type:      'application/json',
    properties: {
      exoloc:       `${p.coord_system}:${p.planet_name}:${p.region}`,
      chain:        'algorand',
      protocol:     'pon_ink_v1',
      design_hash:  p.design_hash ?? null,
      resonance:    p.resonance_split,
    },
  }
}

// ── Eco-ops Participation Token (Celo) ────────────────────────────────────────

export interface EcoOpsTokenParams {
  token_id:       string          // e.g. "ECO-LAMU-WQ-2026-0001"
  activity_type:  'wqMap' | 'garbageMap' | 'farmMap' | 'productMap' | 'transportMap' | 'storageMap' | 'sourceMap' | 'cleaningMap'
  participant:    string          // pon.ink handle
  location_name:  string
  checkin_count:  number          // eco-ops check-ins that triggered this token
  milestone:      string          // e.g. "10 water quality readings"
  group?:         string | null   // SHG group name if applicable
  ipfs_art_cid?:  string
}

const ACTIVITY_LABELS: Record<string, string> = {
  wqMap:        'Water Quality Mapping',
  garbageMap:   'Waste Resource Mapping',
  farmMap:      'Farm Practice / Climate Credit',
  productMap:   'Circular Resource Production',
  transportMap: 'Resource Transport',
  storageMap:   'Resource Storage',
  sourceMap:    'Material Sourcing',
  cleaningMap:  'Community Cleaning',
}

export function buildEcoOpsTokenMeta(p: EcoOpsTokenParams): Erc721Metadata {
  const attrs: Erc721Attribute[] = [
    { trait_type: 'NFT Type',      value: 'Eco-ops Participation Token' },
    { trait_type: 'Token ID',      value: p.token_id },
    { trait_type: 'Activity Type', value: ACTIVITY_LABELS[p.activity_type] ?? p.activity_type },
    { trait_type: 'Participant',   value: p.participant },
    { trait_type: 'Location',      value: p.location_name },
    { trait_type: 'Check-ins',     value: p.checkin_count, display_type: 'number' },
    { trait_type: 'Milestone',     value: p.milestone },
    { trait_type: 'Awarded',       value: today() },
    { trait_type: 'Chain',         value: 'Celo' },
    { trait_type: 'Protocol',      value: 'PON INK v1.0' },
  ]
  if (p.group) attrs.push({ trait_type: 'SHG Group', value: p.group })

  return {
    name:         `Eco-ops Token — ${ACTIVITY_LABELS[p.activity_type] ?? p.activity_type}`,
    description:  `Eco-ops participation token for ${p.participant}: ${p.milestone} at ${p.location_name}.`,
    image:        p.ipfs_art_cid ? `ipfs://${p.ipfs_art_cid}` : '',
    external_url: 'https://pon.ink/eco-ops',
    attributes:   attrs,
    pon_ink: {
      nft_type:      'eco_ops_token',
      chain:         'celo',
      token_id:      p.token_id,
      activity_type: p.activity_type,
      checkin_count: p.checkin_count,
      milestone:     p.milestone,
      tamper_evident: true,
    },
  }
}
