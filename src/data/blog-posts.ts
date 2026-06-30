import { marked } from 'marked'

export type BlogAudience = 'dev' | 'community' | 'field' | 'ecosystem'
export type BlogStatus   = 'internal' | 'draft' | 'public-draft' | 'published'
export type BlogSeries   = 'navigation' | 'science' | 'economy' | 'field' | 'ecosystem' | 'protocol'

export interface BlogPostMeta {
  slug: string
  title: string
  subtitle?: string
  date: string
  audience: BlogAudience[]
  description: string
  editorialNote?: string
  status: BlogStatus
  series: BlogSeries
}

// Vite 2 eager glob — transformed to { default: string } by markdownPlugin in quasar.config.js
const rawModules = import.meta.globEager('../../blog-*.md') as Record<string, { default: string }>

export function getBlogContent (slug: string): string {
  return rawModules[`../../blog-${slug}.md`]?.default ?? ''
}

export function readingTime (content: string): number {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
}

export function renderMarkdown (raw: string): string {
  // Strip the leading H1 (title is shown in page header)
  const stripped = raw.replace(/^#[^#][^\n]*\n/, '').replace(/^##[^#][^\n]*\n/, '')
  return marked.parse(stripped, { async: false }) as string
}

export const AUDIENCE_COLOR: Record<BlogAudience, string> = {
  dev:       '#00e5ff',
  community: '#44ff88',
  field:     '#ffaa33',
  ecosystem: '#cc88ff',
}

export const AUDIENCE_LABEL: Record<BlogAudience, string> = {
  dev:       'Technical',
  community: 'Community',
  field:     'Field',
  ecosystem: 'Ecosystem',
}

export const STATUS_LABEL: Record<BlogStatus, string> = {
  internal:      'Internal',
  draft:         'Working draft',
  'public-draft':'Public draft',
  published:     'Published',
}

export const STATUS_COLOR: Record<BlogStatus, string> = {
  internal:      '#ff5555',
  draft:         '#ffaa33',
  'public-draft':'#44ff88',
  published:     '#00e5ff',
}

export const SERIES_LABEL: Record<BlogSeries, string> = {
  navigation: 'Navigation & Visualization',
  science:    'Science & Data',
  economy:    'Token Economy',
  field:      'Field & Community',
  ecosystem:  'Platform & Protocol',
  protocol:   'Cryptography & ZK',
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug:     'every-object-a-door',
    title:    'Every Object a Door',
    subtitle: "Wiring Exotopia's Celestial Navigation",
    date:     'April 2026',
    audience: ['dev'],
    series:   'navigation',
    status:   'draft',
    description:
      'How the five-level navigation chain was wired — from CosmicPage click handlers through XClusterPage, ClusterGalaxyPage, and ClusterSystemPage to planet surface. What got built, why the connective tissue was harder than it looked, and what celestial reveal is intended to become.',
    editorialNote: 'Review route names and data claims before publishing.',
  },
  {
    slug:     'surfing-the-realms',
    title:    'Surfing the Realms',
    subtitle: 'Building a Seamless Zoom from Cosmic Web to Colony Door',
    date:     'April 2026',
    audience: ['dev'],
    series:   'navigation',
    status:   'draft',
    description:
      'The pipeline gaps behind a fully navigable universe: where catalog data runs out, why sky accuracy from an exoplanet surface is an open problem, and what solving it at each of the five levels requires.',
    editorialNote: 'Review data claims before publishing.',
  },
  {
    slug:     'data-sources-unified-viz',
    title:    'The Cartography Problem',
    subtitle: "Data sources for a navigable universe — what we have, what we're missing, and which catalogs would close the gaps",
    date:     'June 2026',
    audience: ['dev'],
    series:   'navigation',
    status:   'draft',
    description:
      'A survey of the astronomical catalogs behind Exotopia — NASA ExA, HYG, Takey2013/XMM-Newton, NED TAP — what is live, what is missing, and the integration priority analysis for filling gaps from the cosmic web to an exomoon colony.',
    editorialNote: 'Verify catalog coverage numbers and status flags before publishing.',
  },
  {
    slug:     'first-flag-remote-worlds',
    title:    'First Flag on a Remote World',
    subtitle: 'The preponderance of exoplanets in galaxy clusters — modelling, citizen science, and why a hypothesized world still deserves a name',
    date:     'April 2026',
    audience: ['community', 'dev'],
    series:   'science',
    status:   'public-draft',
    description:
      'Every confirmed exoplanet sits within 8,500 light-years of Earth. The Virgo Cluster is 54 million light-years away. The absence of detections is not a scientific result — it is a detection limit. What the occurrence-rate data actually says about the trillion worlds in clusters we can see but not yet measure.',
    editorialNote: 'Verify all occurrence-rate figures and citation years before publishing.',
  },
  {
    slug:     'zero-fee-ecosystem',
    title:    'Why Exotopia Takes 0.25%',
    subtitle: 'And what that actually means',
    date:     'May 2026',
    audience: ['ecosystem', 'community'],
    series:   'economy',
    status:   'internal',
    description:
      'The 80/15/5 revenue split, fee isolation from community payouts, and what "zero-fee for communities" means in practice. Why 0.25% is the right platform charge and how ledger separation makes it auditable.',
    editorialNote: 'Internal working draft — not cleared for public release. Fee model under review.',
  },
  {
    slug:     'mule-v2-specialist',
    title:    'The Mule Knows Five Things',
    subtitle: 'Why we chose a domain specialist over a general AI assistant',
    date:     'May 2026',
    audience: ['ecosystem', 'community'],
    series:   'ecosystem',
    status:   'draft',
    description:
      'The design decision behind the Robot Mule: why a corpus-driven specialist tuned to SCD Hub knowledge outperforms a general assistant for settlement visitors, and what "knowing five things well" means for community trust.',
  },
  {
    slug:     'eco-ops-without-blockchain',
    title:    'Eco Ops Without a Blockchain',
    subtitle: 'Why Digital Certificates Do the Job Better',
    date:     'May 2026',
    audience: ['community', 'field'],
    series:   'field',
    status:   'draft',
    description:
      'When is a blockchain the wrong tool? A direct comparison of on-chain records vs digital certificates for grassroots eco-ops field work — and the case for certificates that are permanent, auditable, and accessible without a wallet.',
    editorialNote: 'Review data claims before publishing.',
  },
  {
    slug:     'shared-language-lamu-ecoledger',
    title:    'A Shared Language for the Land',
    subtitle: 'Introducing the Eco-Ledger for Mpeketoni',
    date:     'May 2026',
    audience: ['field', 'community'],
    series:   'field',
    status:   'draft',
    description:
      'The Eco-Ledger is a shared vocabulary for land and livelihood records in Mpeketoni, Lamu County. How it was designed with the Uni-Kibaoni-Peace-Youth-SHG group led by Muirithi Jariffe, and what it allows communities to record, verify, and own.',
    editorialNote: 'English edition — Swahili and community translations to follow.',
  },
  {
    slug:     'online-safety-and-private-comms',
    title:    'The Surveillance Bargain Hidden Inside Online Safety Laws',
    subtitle: 'Why KOSA, the UK Online Safety Act, and Australia\'s framework threaten consent-based private communications — and what we\'re doing about it',
    date:     'June 2026',
    audience: ['community', 'ecosystem'],
    series:   'ecosystem',
    status:   'public-draft',
    description:
      'We built a seven-person private comment system. Under current or proposed law in Australia, the UK, and the US it may be non-compliant — not because it causes harm but because it refuses to build surveillance infrastructure. We explain the specific laws, our design choices, the honest complications, and why SCD Hub is lobbying Rep. Neguse (CO-02) against KOSA in its current form.',
    editorialNote: 'Review Neguse committee assignments and KOSA status before publishing — legislative status changes quickly.',
  },
  {
    slug:     'e8-art-hash-zkp',
    title:    'The Most Symmetrical Object in Mathematics Is Now Protecting Field Workers in Coastal Kenya',
    subtitle: 'E8, Leech lattice, PLONK/halo2 proofs, and art-hashes you can verify with human eyes',
    date:     'June 2026',
    audience: ['dev', 'community'],
    series:   'protocol',
    status:   'public-draft',
    description:
      'How the 240-root E8 lattice becomes the foundation for trustless field telemetry verification — PLONK proofs with no trusted setup, the E8→Λ₂₄ bridge for large collaborative groups, and art-hashes: SVG images that are simultaneously visual fingerprints and cryptographic proofs, readable by human eyes and machine scanners alike.',
  },
  {
    slug:     'costa-rica-biodiversity-platform',
    title:    'Three Generations, One Forest',
    subtitle: 'A Vision for Biodiversity Collaboration in Costa Rica',
    date:     'April 2026',
    audience: ['field', 'community'],
    series:   'field',
    status:   'draft',
    description:
      'A three-generation vision for biodiversity collaboration in Costa Rica — how local ecological knowledge, scientific monitoring, and SCD Hub\'s platform infrastructure can combine to support long-term forest stewardship.',
    editorialNote: 'Review local data claims and regional partner details before publishing.',
  },
]

export function getRelatedPosts (post: BlogPostMeta, limit = 3): BlogPostMeta[] {
  return BLOG_POSTS
    .filter(p => p.slug !== post.slug)
    .map(p => {
      const seriesMatch    = p.series === post.series ? 2 : 0
      const audienceMatch  = p.audience.some(a => post.audience.includes(a)) ? 1 : 0
      return { post: p, score: seriesMatch + audienceMatch }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post)
}
