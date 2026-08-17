/**
 * src/data/domain-competency.ts
 * Client-side slice of the domain vocabulary defined in SPEC_DOMAIN_COMPETENCY.md
 * ("Domain taxonomy" section) — reused verbatim here, not reinvented. Used to
 * classify free-text mentor_sessions.topic strings into a domain for the
 * group-leader view in RewardsPage.vue.
 *
 * mentor_sessions has no domain column (see supabase/migrations/002_rewards.sql) —
 * topic is free text a mentor types when requesting a session. This is a best-
 * effort keyword classifier over that text, not a certified domain assignment.
 * "policy/library-research" focuses (no formal domain exists yet — see the
 * spec's "Pending domains" section) fall through to `unclassified`.
 */

export interface DomainInfo {
  code:  string
  label: string
  color: string
  /** EcoLibrary area label this domain corresponds to (src/pages/EcoLibrary.vue AREA_* maps), if any. */
  ecoLibraryArea?: string
  /** Route to send a mentor to for content in this domain. */
  route: string
}

export const DOMAINS: Record<string, DomainInfo> = {
  water: {
    code: 'water', label: 'Water (WATSAN)', color: '#26c6da',
    ecoLibraryArea: 'Water', route: '/eco-library',
  },
  energy: {
    code: 'energy', label: 'Energy', color: '#ffca28',
    ecoLibraryArea: 'Energy', route: '/eco-library',
  },
  food: {
    code: 'food', label: 'Food Systems & Agriculture', color: '#9ccc65',
    ecoLibraryArea: 'Food', route: '/eco-library',
  },
  circular: {
    code: 'circular', label: 'Waste & Circular Economy', color: '#66bb6a',
    ecoLibraryArea: 'Waste', route: '/eco-library',
  },
  shelter: {
    code: 'shelter', label: 'Shelter & Construction', color: '#78909c',
    ecoLibraryArea: 'Shelter', route: '/eco-library',
  },
  health: {
    code: 'health', label: 'Health & Community Wellbeing', color: '#ef9a9a',
    ecoLibraryArea: 'Health', route: '/eco-library',
  },
  biodiversity: {
    code: 'biodiversity', label: 'Biodiversity & Habitat', color: '#4db6ac',
    ecoLibraryArea: 'Ecology & Biodiversity', route: '/ecology-citizen-science',
  },
  soil: {
    code: 'soil', label: 'Soil Health & Land Stewardship', color: '#a1887f',
    route: '/eco-library',
  },
  climate: {
    code: 'climate', label: 'Climate Adaptation & Monitoring', color: '#4fc3f7',
    route: '/eco-library',
  },
  restoration: {
    code: 'restoration', label: 'Ecosystem Restoration / Remediation', color: '#ff7043',
    ecoLibraryArea: 'Decontamination', route: '/pfas-citizen-science',
  },
  iek: {
    code: 'iek', label: 'Indigenous & Traditional Ecological Knowledge', color: '#d4a75a',
    route: '/knowledge-keepers',
  },
  arts: {
    code: 'arts', label: 'Arts, Culture & Creative Practice', color: '#ba68c8',
    route: '/gallery',
  },
  unclassified: {
    code: 'unclassified', label: 'Policy / library research / unclassified', color: '#78909c',
    route: '/eco-library',
  },
}

// Keyword hints per domain — matched against a session's free-text topic,
// lowercased. First match wins; order matters (more specific domains first).
const DOMAIN_KEYWORDS: [string, string[]][] = [
  ['restoration', ['pfas', 'pfoa', 'decontamination', 'decon', 'remediation', 'reforestation', 'wetland restoration', 'ecosystem restoration']],
  ['water', ['watsan', 'water', 'sanitation', 'latrine', 'filtration', 'distillation', 'wash ', 'rainwater']],
  ['biodiversity', ['biodiversity', 'habitat', 'species', 'pollinator', 'wildlife', 'inaturalist', 'transect', 'ecology']],
  ['energy', ['solar', 'biogas', 'wind turbine', 'micro-hydro', 'rocket stove', 'off-grid', 'energy']],
  ['food', ['agroforestry', 'composting', 'ipm', 'seed saving', 'agriculture', 'farming', 'crop']],
  ['circular', ['recycl', 'upcycl', 'briquette', 'zero waste', 'circular economy', 'waste management']],
  ['shelter', ['natural building', 'cob', 'adobe', 'shelter', 'construction', 'passive cooling']],
  ['health', ['first aid', 'psychosocial', 'nutrition', 'public health', 'hygiene promotion']],
  ['soil', ['soil', 'erosion', 'land stewardship', 'cover crop']],
  ['climate', ['climate', 'weather station', 'phenology', 'early warning']],
  ['iek', ['traditional knowledge', 'indigenous', 'elder', 'knowledge keeper', 'tek']],
  ['arts', ['art', 'creative', 'design', 'craft']],
]

/** Best-effort classification of a mentor_sessions.topic string into a domain code. */
export function classifyMentorTopic(topic: string): string {
  const t = (topic ?? '').toLowerCase()
  for (const [domain, keywords] of DOMAIN_KEYWORDS) {
    if (keywords.some(k => t.includes(k))) return domain
  }
  return 'unclassified'
}
