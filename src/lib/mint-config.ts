/**
 * mint-config.ts — deployment-driven mint pathway configuration.
 * All values read from Vite env vars (VITE_* prefix) so they can be
 * set per-deployment without rebuilding. Falls back to sensible defaults.
 */

// ── Env reads ─────────────────────────────────────────────────────────────────

const env = (import.meta as any).env ?? {}

export const FREE_MINT          = env.VITE_FREE_MINT          !== 'false'
/** Platform fee rate on secondary sales: 0.25% (as decimal fraction). Community hardware fund: 0.75%. Creator receives 99%. */
export const AFTERMARKET_BENCH  = 0.0025
export const DEFAULT_CHAIN      = (env.VITE_DEFAULT_CHAIN      ?? 'polygon') as string
export const KES_RATE           = parseFloat(env.VITE_KES_RATE ?? '130')

/** Comma-separated pathway slugs. Controls which cards appear in the wizard. */
const PATHWAYS_RAW: string = env.VITE_ENABLED_PATHWAYS ?? 'eco,gallery,watsan,learning,food,command'
export const ENABLED_PATHWAY_IDS: string[] = PATHWAYS_RAW.split(',').map(s => s.trim()).filter(Boolean)

/** Comma-separated chain slugs. Controls which chain tabs appear. */
const CHAINS_RAW: string = env.VITE_ENABLED_CHAINS ?? 'polygon,algorand,solana'
export const ENABLED_CHAINS: string[] = CHAINS_RAW.split(',').map(s => s.trim()).filter(Boolean)

// ── Pathway definitions ───────────────────────────────────────────────────────

export interface MintPathway {
  id:          string
  name:        string
  emoji:       string
  tagline:     string
  description: string
  modules:     string[]   // moduleSlotOrder values
  color:       string     // primary accent
  bgFrom:      string
  bgTo:        string
  stationCategory: string
  exampleName: string     // example settlement name shown in the card
}

export const ALL_PATHWAYS: MintPathway[] = [
  {
    id:              'eco',
    name:            'Eco-Settlement',
    emoji:           '🌱',
    tagline:         'Water, food, shelter — the core sustainable stack',
    description:     'A full-cycle settlement designed around the WATSAN field protocol. Includes water quality monitoring, food production, and basic shelter. Mule pre-loaded with community water health and farming knowledge.',
    modules:         ['watsan', 'food', 'shelter'],
    color:           '#44cc88',
    bgFrom:          '#041808',
    bgTo:            '#021004',
    stationCategory: 'watsan',
    exampleName:     'Lamu Waterworks Station',
  },
  {
    id:              'gallery',
    name:            'Gallery Space',
    emoji:           '🎨',
    tagline:         'Art-first settlement with collector card gallery',
    description:     'Cultural space for artists and musicians from the Worldbridger One network. Includes the orbital gallery module, PON INK event support, and $SUNLIGHT NFT minting. Mule holds the Hub Approvideo art corpus.',
    modules:         ['gallery', 'command'],
    color:           '#aa66ff',
    bgFrom:          '#0c0420',
    bgTo:            '#060210',
    stationCategory: 'gallery',
    exampleName:     'Nairobi Orbital Gallery',
  },
  {
    id:              'watsan',
    name:            'Water Station',
    emoji:           '💧',
    tagline:         'Field water quality monitoring and reporting',
    description:     'Dedicated WATSAN node for real-time water quality measurement and on-chain certificate minting. Includes GPS-tagged pH, turbidity, nitrate, and coliform readings. Mule specialises in community water health data.',
    modules:         ['watsan', 'healthcare'],
    color:           '#44aaff',
    bgFrom:          '#010c20',
    bgTo:            '#010610',
    stationCategory: 'watsan',
    exampleName:     'Kilifi Water Monitor Alpha',
  },
  {
    id:              'learning',
    name:            'Learning Hub',
    emoji:           '📚',
    tagline:         'Youth career development and advocacy materials',
    description:     'Education-first settlement anchored in the Ecommunity DAO governance model. Supports mentorship circles, youth career pathways in environmental engineering, and Hub Approvideo library maintenance. Mule corpus: educational advocacy.',
    modules:         ['shelter', 'healthcare', 'command'],
    color:           '#ffcc44',
    bgFrom:          '#181000',
    bgTo:            '#0c0800',
    stationCategory: 'gallery',
    exampleName:     'Lamu Youth Futures Station',
  },
  {
    id:              'food',
    name:            'Food System',
    emoji:           '🌾',
    tagline:         'Agriculture, compost, and local food production',
    description:     'Permaculture and soil-health focused settlement. Tracks farm maps, product maps, and storage maps on-chain via the eco-ops check-in system. Mule corpus: business planning metrics for food co-ops.',
    modules:         ['food', 'shelter', 'energy'],
    color:           '#88cc44',
    bgFrom:          '#0c1400',
    bgTo:            '#060c00',
    stationCategory: 'food',
    exampleName:     'Fana Ka Food Co-op Station',
  },
  {
    id:              'command',
    name:            'Community Command',
    emoji:           '🌐',
    tagline:         'Full multi-module hub for established communities',
    description:     'The complete station: gallery, WATSAN, energy, shelter, healthcare, food, and command modules. Designed for established SCD Hub communities with multiple active domains. All five Mule specialist domains included.',
    modules:         ['gallery', 'watsan', 'energy', 'shelter', 'healthcare', 'food', 'command'],
    color:           '#ff8844',
    bgFrom:          '#100800',
    bgTo:            '#080400',
    stationCategory: 'command',
    exampleName:     'OT Kulcha Community Hub',
  },
]

/** Return only the pathways enabled for this deployment. */
export function getEnabledPathways(): MintPathway[] {
  return ALL_PATHWAYS.filter(p => ENABLED_PATHWAY_IDS.includes(p.id))
}

/** Return a pathway by id, or undefined. */
export function getPathway(id: string): MintPathway | undefined {
  return ALL_PATHWAYS.find(p => p.id === id)
}
