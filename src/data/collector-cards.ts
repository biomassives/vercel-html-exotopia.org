/**
 * src/data/collector-cards.ts
 *
 * Backwards-compatibility shim — re-exports from the edition registry.
 *
 * Edition 1 (Extrapolation Edition) data lives in:
 *   src/data/editions/extrapolation-edition.ts
 *
 * Edition 2 (Anti-AI Slop Drop) data lives in:
 *   src/data/editions/anti-ai-slop-drop.ts
 *
 * All editions are registered in:
 *   src/data/editions/index.ts
 *
 * COLLECTOR_CARDS is kept for backwards compatibility with components
 * that import it directly. It returns Edition 1 cards only.
 * For multi-edition access use EDITIONS from src/data/editions/index.ts.
 */

export type CardRarity = 'legendary' | 'rare' | 'uncommon' | 'common'

export interface CollectorCard {
  id:           number          // 1–11, unique within the edition
  name:         string
  series:       string          // 'Extrapolation Edition'
  edition:      number          // same as id
  maxEdition:   number          // 11
  rarity:       CardRarity
  rarityScore:  number          // 1–10 (10 = most rare)
  description:  string
  // NFT attributes (ERC-721 / OpenSea compatible)
  attributes:   Array<{ trait_type: string; value: string | number }>
  // Visual palette — used by CollectorCard.vue to render unique art
  bgFrom:       string          // gradient start (hex)
  bgTo:         string          // gradient end (hex)
  borderColor:  string          // rarity border hex
  artColors:    string[]        // up to 5 colors for central artwork
  glowColor:    string          // outer glow hex
  // Mint state
  ipfsCid?:     string          // set after Pinata upload
  mintedCount:  number          // 0 until minted
}

// ── Rarity display config ─────────────────────────────────────────────────────

export const RARITY_CONFIG: Record<CardRarity, { label: string; color: string; glow: string }> = {
  legendary: { label: 'LEGENDARY', color: '#ffd700', glow: 'rgba(255,215,0,0.55)' },
  rare:      { label: 'RARE',      color: '#4488ff', glow: 'rgba(68,136,255,0.45)' },
  uncommon:  { label: 'UNCOMMON',  color: '#22cc66', glow: 'rgba(34,204,102,0.40)' },
  common:    { label: 'COMMON',    color: '#667788', glow: 'rgba(102,119,136,0.30)' },
}

// ── 11-card catalog ───────────────────────────────────────────────────────────

export const COLLECTOR_CARDS: CollectorCard[] = [

  // ── LEGENDARY ────────────────────────────────────────────────────────────────

  {
    id: 1, name: 'Blue Supergiant', series: 'Extrapolation Edition',
    edition: 1, maxEdition: 11, rarity: 'legendary', rarityScore: 10, mintedCount: 0,
    description: 'An O-type blue supergiant blazing at 40,000 K. 500,000 times the luminosity of Sol. These titans live fast and die as supernovae, seeding the cosmos with heavy elements.',
    bgFrom: '#000820', bgTo: '#001a3a',
    borderColor: '#ffd700', glowColor: 'rgba(100,160,255,0.60)',
    artColors: ['#cad7ff', '#88aaff', '#4466dd', '#001888', '#ffffff'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '1 of 11' },
      { trait_type: 'Rarity',     value: 'Legendary' },
      { trait_type: 'Teff (K)',   value: 40000 },
      { trait_type: 'Luminosity', value: '500,000 L☉' },
      { trait_type: 'Spectral',   value: 'O-type' },
      { trait_type: 'Fate',       value: 'Supernova / Neutron Star' },
    ],
  },

  {
    id: 2, name: 'Wormhole Conduit', series: 'Extrapolation Edition',
    edition: 2, maxEdition: 11, rarity: 'legendary', rarityScore: 10, mintedCount: 0,
    description: 'An E8 lattice transit node at the periphery of a great cosmic void. Where dark matter filaments converge, the fabric of spacetime permits shortcuts — if you know the geometry.',
    bgFrom: '#0a0020', bgTo: '#18003a',
    borderColor: '#ffd700', glowColor: 'rgba(180,80,255,0.65)',
    artColors: ['#cc55ff', '#8800cc', '#00e5ff', '#ffffff', '#440088'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '2 of 11' },
      { trait_type: 'Rarity',     value: 'Legendary' },
      { trait_type: 'Type',       value: 'E8 Coxeter transit node' },
      { trait_type: 'Location',   value: 'Void periphery' },
      { trait_type: 'Protocol',   value: 'PON INK v1.0' },
      { trait_type: 'Access',     value: 'Whitelisted destinations only' },
    ],
  },

  {
    id: 3, name: 'Cosmic Web', series: 'Extrapolation Edition',
    edition: 3, maxEdition: 11, rarity: 'legendary', rarityScore: 9, mintedCount: 0,
    description: 'The large-scale structure of the universe — galaxy clusters connected by dark matter filaments, enclosing vast empty voids. The longest brushstroke ever painted.',
    bgFrom: '#000408', bgTo: '#000c18',
    borderColor: '#ffd700', glowColor: 'rgba(50,180,220,0.50)',
    artColors: ['#4488cc', '#1a3a6a', '#00e5ff', '#ffd480', '#334455'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '3 of 11' },
      { trait_type: 'Rarity',     value: 'Legendary' },
      { trait_type: 'Scale',      value: '~93 billion light-years' },
      { trait_type: 'Clusters',   value: '>2 million catalogued' },
      { trait_type: 'Dark Matter', value: '~27% of total energy' },
    ],
  },

  // ── RARE ─────────────────────────────────────────────────────────────────────

  {
    id: 4, name: 'Habitable World', series: 'Extrapolation Edition',
    edition: 4, maxEdition: 11, rarity: 'rare', rarityScore: 7, mintedCount: 0,
    description: 'A confirmed temperate exoplanet in its star\'s habitable zone — equilibrium temperature between 200–380 K, liquid water possible on the surface. One of 142 confirmed candidates in the NASA archive.',
    bgFrom: '#000c10', bgTo: '#001a20',
    borderColor: '#4488ff', glowColor: 'rgba(0,200,150,0.55)',
    artColors: ['#22ff88', '#0066aa', '#005533', '#44aadd', '#ffffff'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '4 of 11' },
      { trait_type: 'Rarity',     value: 'Rare' },
      { trait_type: 'Zone',       value: 'Habitable (conservative)' },
      { trait_type: 'Eq. Temp',   value: '233–320 K' },
      { trait_type: 'Status',     value: 'HZ candidate' },
      { trait_type: 'Catalog',    value: 'NASA Exoplanet Archive' },
    ],
  },

  {
    id: 5, name: 'Binary Dance', series: 'Extrapolation Edition',
    edition: 5, maxEdition: 11, rarity: 'rare', rarityScore: 7, mintedCount: 0,
    description: 'Two stars locked in mutual orbit, sharing a barycentre. Circumbinary planets orbit both — Tatooine-style double sunsets are real. ~50% of nearby star systems are multiple.',
    bgFrom: '#0c0800', bgTo: '#1a1200',
    borderColor: '#4488ff', glowColor: 'rgba(255,200,80,0.50)',
    artColors: ['#ffd480', '#ff9944', '#ffffff', '#cc6600', '#221100'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '5 of 11' },
      { trait_type: 'Rarity',     value: 'Rare' },
      { trait_type: 'System',     value: 'Circumbinary' },
      { trait_type: 'Orbit Type', value: 'P-type (planets orbit both)' },
      { trait_type: 'Example',    value: 'Kepler-16, Kepler-47' },
    ],
  },

  {
    id: 6, name: 'The Void', series: 'Extrapolation Edition',
    edition: 6, maxEdition: 11, rarity: 'rare', rarityScore: 6, mintedCount: 0,
    description: 'A cosmic supervoid — hundreds of millions of light-years of near-emptiness, bordered by luminous filaments. The Boötes Void is 330 Mpc across. Almost nothing lives here. Almost.',
    bgFrom: '#000002', bgTo: '#050008',
    borderColor: '#4488ff', glowColor: 'rgba(60,40,100,0.40)',
    artColors: ['#220044', '#110022', '#440088', '#000000', '#4444aa'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '6 of 11' },
      { trait_type: 'Rarity',     value: 'Rare' },
      { trait_type: 'Type',       value: 'Cosmic supervoid' },
      { trait_type: 'Reference',  value: 'Boötes Void (~330 Mpc)' },
      { trait_type: 'Density',    value: '<60% of cosmic average' },
    ],
  },

  {
    id: 7, name: 'The Nebula', series: 'Extrapolation Edition',
    edition: 7, maxEdition: 11, rarity: 'rare', rarityScore: 6, mintedCount: 0,
    description: 'A stellar nursery — clouds of gas and dust collapsing under gravity to birth new stars. The ionised hydrogen glows red; oxygen blue-green. Stars are born screaming in color.',
    bgFrom: '#0a0015', bgTo: '#180025',
    borderColor: '#4488ff', glowColor: 'rgba(200,80,255,0.45)',
    artColors: ['#ff3366', '#cc55ff', '#00ddcc', '#ff8833', '#6600aa'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '7 of 11' },
      { trait_type: 'Rarity',     value: 'Rare' },
      { trait_type: 'Type',       value: 'Emission nebula / stellar nursery' },
      { trait_type: 'Spectrum',   value: 'Hα red, OIII blue-green' },
      { trait_type: 'Age',        value: '10,000–1,000,000 years' },
    ],
  },

  // ── UNCOMMON ─────────────────────────────────────────────────────────────────

  {
    id: 8, name: 'Red Dwarf Companion', series: 'Extrapolation Edition',
    edition: 8, maxEdition: 11, rarity: 'uncommon', rarityScore: 4, mintedCount: 0,
    description: 'An M-type red dwarf hosts a rocky companion in a tight orbit. 75% of all stars are M-dwarfs. Their habitable zones are close — planets are tidally locked, one face always lit.',
    bgFrom: '#100400', bgTo: '#200800',
    borderColor: '#22cc66', glowColor: 'rgba(255,80,40,0.45)',
    artColors: ['#ff3300', '#cc2200', '#ff9966', '#440000', '#ffcc88'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '8 of 11' },
      { trait_type: 'Rarity',     value: 'Uncommon' },
      { trait_type: 'Spectral',   value: 'M5V' },
      { trait_type: 'Teff (K)',   value: 3000 },
      { trait_type: 'HZ (AU)',    value: '0.1–0.2' },
      { trait_type: 'Occurrence', value: '75% of all stars' },
    ],
  },

  {
    id: 9, name: 'Settlement Pioneer', series: 'Extrapolation Edition',
    edition: 9, maxEdition: 11, rarity: 'uncommon', rarityScore: 4, mintedCount: 0,
    description: 'The geodesic dome, stone circle, and water feature of an Exotopia virtual settlement. 40 acres on an exoplanet. One mule. Permanent deed. Built through eco-ops check-ins and community work.',
    bgFrom: '#000c10', bgTo: '#001420',
    borderColor: '#22cc66', glowColor: 'rgba(0,200,240,0.45)',
    artColors: ['#0099dd', '#22ff88', '#004488', '#00ccff', '#005533'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '9 of 11' },
      { trait_type: 'Rarity',     value: 'Uncommon' },
      { trait_type: 'Area',       value: '40 virtual acres' },
      { trait_type: 'Protocol',   value: 'PON INK v1.0' },
      { trait_type: 'Chain',      value: 'Algorand ARC-3' },
      { trait_type: 'Mule Tier',  value: 'Foal → Sovereign' },
    ],
  },

  {
    id: 10, name: 'The Mule', series: 'Extrapolation Edition',
    edition: 10, maxEdition: 11, rarity: 'uncommon', rarityScore: 3, mintedCount: 0,
    description: 'The mule-bot — a corpus-driven knowledge assistant that lives in your settlement gallery. It speaks in your words, not ours. Each item added to its corpus deepens its voice.',
    bgFrom: '#0a0800', bgTo: '#181000',
    borderColor: '#22cc66', glowColor: 'rgba(255,180,40,0.45)',
    artColors: ['#ffd480', '#ffaa00', '#cc8800', '#332200', '#ffeeaa'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '10 of 11' },
      { trait_type: 'Rarity',     value: 'Uncommon' },
      { trait_type: 'Type',       value: 'Knowledge assistant' },
      { trait_type: 'Tiers',      value: 'Foal / Colt / Stallion / Sovereign' },
      { trait_type: 'Corpus',     value: 'Visitor-facing, owner-authored' },
    ],
  },

  // ── COMMON ───────────────────────────────────────────────────────────────────

  {
    id: 11, name: 'Water Quality', series: 'Extrapolation Edition',
    edition: 11, maxEdition: 11, rarity: 'common', rarityScore: 2, mintedCount: 0,
    description: 'An on-chain Water Quality Certification — tamper-evident, permanent. pH 7.1 · turbidity 0.3 NTU · potable: YES. Every reading submitted through the Mpeketoni field network builds this record.',
    bgFrom: '#000814', bgTo: '#001022',
    borderColor: '#667788', glowColor: 'rgba(0,200,255,0.35)',
    artColors: ['#00aaff', '#0066cc', '#00ddff', '#003366', '#aaddff'],
    attributes: [
      { trait_type: 'Series',     value: 'Extrapolation Edition' },
      { trait_type: 'Edition',    value: '11 of 11' },
      { trait_type: 'Rarity',     value: 'Common' },
      { trait_type: 'Type',       value: 'Water Quality Certification' },
      { trait_type: 'Standard',   value: 'WHO 2022' },
      { trait_type: 'Chain',      value: 'Polygon / Celo' },
      { trait_type: 'Tamper',     value: 'Evidence: on-chain + Arweave' },
    ],
  },
]
