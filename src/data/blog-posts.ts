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
  // Strip the leading H1 and H2 (title/subtitle are already shown in the page
  // header) — `\n+` rather than `\n` so this also consumes the blank line
  // every post in this repo puts between the two headings; without it the H2
  // was left behind and rendered a second time as a duplicate subtitle.
  const stripped = raw.replace(/^#[^#][^\n]*\n+/, '').replace(/^##[^#][^\n]*\n+/, '')
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
    slug:     'east-coast-citizen-science-units',
    title:    'Ticks, Toxic Blooms, and the Pulse of Freshwater',
    subtitle: 'Three Citizen Science Programs for East Coast Participants — and a call for SMEs, trainers, and community groups',
    date:     'July 2026',
    audience: ['field', 'community'],
    series:   'field',
    status:   'public-draft',
    description:
      'Two East Coast and one national citizen science curriculum units: Tick Watch Northeast (blacklegged tick surveillance and Lyme prevention), Cyanobacteria Watch and Lake Health (eutrophication, Secchi disk, HAB reporting), and the Freshwater Phenology Network (BMWP macroinvertebrate monitoring, USA-NPN). Includes a deep dive on pyrethroid/pyrethrum tick control toxicology, biodiversity, watershed, and human health impacts; alternative methods including entomopathogenic fungi and opossum ecology; winter tick and moose population ecology; and a proposed Kaggle citizen data science challenge for moose tick burden spatial prediction. Includes SME recruitment call and project-based learning frameworks.',
    editorialNote: 'SME contacts and state reporting pathway links to be confirmed before publishing. Review moose tick burden numbers and winter tick research citations against current Maine IF&W and UNH wildlife lab publications.',
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
  {
    slug:     'field-ready-global-systems',
    title:    'Field-Ready and Globally Connected',
    subtitle: 'Offline-first citizen science and the SCD Hub bounty network — how the platform now works in rural Kenya, coastal Costa Rica, a Vermont watershed, and the UK',
    date:     'July 2026',
    audience: ['field', 'community', 'ecosystem'],
    series:   'field',
    status:   'public-draft',
    description:
      'Two interlocking systems just shipped: an offline-first field data layer (PWA, IndexedDB queue, local draft persistence, photo resize, LocalDataPanel) and a global bounty network that pays community members and SMEs for completing specific environmental data tasks including direct regulatory agency submissions. Covers the technical foundation, geographic reach (US, Kenya, Costa Rica, UK, Canada), and what each audience — field teams, SMEs, educators, funders, developers — needs to know.',
    editorialNote: 'Confirm M-Pesa B2C disbursement is live before publishing. Remove "early" caveats once field testing with both user groups is complete.',
  },
  {
    slug:     'claim-bot-bounty-workflow',
    title:    'The Claim Bot: A Complete Guide to Bounties on SCD Hub',
    subtitle: 'How to find work, claim it, submit it, and get paid — and how the system keeps itself honest',
    date:     'July 2026',
    audience: ['field', 'community', 'dev'],
    series:   'ecosystem',
    status:   'public-draft',
    description:
      'The full operational guide to SCD Hub\'s GitHub-based bounty system. Covers finding bounties via label filters, the /claim and /unclaim slash commands and the Actions bot behind them, the field data collection workflow using the offline-first PWA, agency submission pathways (EPA, EA, NEMA, SINAC), chain-of-custody for PFAS samples, PR submission with evidence, review and verification, payment methods (M-Pesa, bank transfer, Algorand ALGO, eco:certificate credit), SME bounty workflow, and tips for group coordinators.',
    editorialNote: 'Review once the first real bounties have been claimed and completed — update any process details that turn out to differ from this description.',
  },
  {
    slug:     'e8-library-ecology-area-proposal',
    title:    'Filling the Gap: A Proposed Ecology & Biodiversity Area for the SCD Hub Library',
    subtitle: 'E8 capability axis analysis reveals what the existing library is missing — and here\'s the JSON to fill it',
    date:     'July 2026',
    audience: ['dev', 'field', 'community'],
    series:   'protocol',
    status:   'public-draft',
    description:
      'The SCD Hub library has six areas (Shelter, Water, Waste, Energy, Health, Food) but four of the eight E8 capability axes are uncovered. This post maps the gap — E8 axes x₁ (soil), x₂ monitoring, x₃ (biodiversity), and x₈ (climate adaptation) — then proposes a complete new "Ecology & Biodiversity" library area in the ot6a.json format, with four subcategories (Soil Health, Biodiversity Monitoring, Watershed Ecology, Climate Adaptation), curated video entries, and videoTagDirectory definitions. Five PENDING video slots are open for community curation via GitHub issues. Also covers the three-line code change needed to add the area to EcoLibrary.vue\'s icon/color config.',
    editorialNote: 'Five video slots are marked PENDING — merge only after at least three confirmed. YouTube IDs in confirmed entries should be verified against current availability before publishing.',
  },
  {
    slug:     'upstream-pfas-producer-responsibility',
    title:    'Clean Compost from Source',
    subtitle: 'An upstream producer responsibility toolkit for community advocates — Nederland, Colorado and beyond',
    date:     'July 2026',
    audience: ['field', 'community'],
    series:   'field',
    status:   'public-draft',
    description:
      'A practical guide for volunteer advocates working to remove PFAS-contaminated packaging from municipal compost input streams. Covers: the garden contamination pathway (compost → soil → plant uptake → food); the water drop test for field screening; high-priority packaging categories (pizza boxes, "compostable" cups, deli paper, fast-food wrappers); the Colorado HB 23-1034 compliance timeline (2025 prohibition on PFAS in food packaging); PFAS-free alternatives list (World Centric, Vegware, Eco-Products, plain bagasse); the business engagement playbook (friendly audit, alternatives, Clean Compost Partner recognition); a 5-step community compost testing cycle; and the compost distribution gate for protecting gardens while testing is underway. Nederland/Cat case study; Bear Creek → South Boulder Creek watershed context.',
    editorialNote: 'Verify HB 23-1034 implementation dates against current Colorado DEQ guidance. Confirm third-party test documentation availability for named brands before publishing.',
  },
  {
    slug:     'letters-patent-deed-format',
    title:    'Forty Acres and a Mule in the Cosmos',
    subtitle: 'The Letters Patent deed format — how PON INK issues virtual land titles, what the metadata carries, and why the Reconstruction Era framing was the right choice',
    date:     'July 2026',
    audience: ['community', 'ecosystem', 'dev'],
    series:   'economy',
    status:   'public-draft',
    description:
      'The first Letters Patent exolocation deed has been minted under PON INK v1.0. This post covers the format: what a Letters Patent is (historical land grant precedent from English Crown patents through Homestead Act to Reconstruction\'s unfulfilled forty-acre promise), why that framing fits what Exotopia is actually doing with virtual settlement titles, and the complete technical anatomy of the deed JSON — name/description/SVG image, ERC-721 + Algorand ARC3 dual standard, the exoloc_address hierarchy (cluster → galaxy → host → planet), trophic levels (L1 Stellar / L2 Planetary / L3 Lunar / L4 Orbital), pathway attributes (watsan, energy, biodiversity), resonance_split for creator/community/platform revenue, and the seller_fee_basis_points field for secondary royalties. Also covers the onboarding redesign that connects new users to specific commitment pathways — learning, project making, certification, platform help, or eco field work — before reserving their settlement.',
    editorialNote: 'Verify that exoloc_address prefix is corrected to exo-surface-v1 in the minted deed before publishing. Confirm seller_fee_basis_points and resonance_split convention (proportions vs basis points) is documented in the PON INK spec. Review trophic level / hostname consistency for the moon case.',
  },
  {
    slug:     'onboarding-path-redesign',
    title:    'One Thing First',
    subtitle: 'Why we rebuilt the Exotopia onboarding around a single committed first step — and what the five paths are',
    date:     'July 2026',
    audience: ['community', 'ecosystem'],
    series:   'field',
    status:   'public-draft',
    description:
      'The Exotopia onboarding page has been rebuilt from the ground up. The old flow asked users to select a role (field worker, artist, educator, coordinator, explorer) and a community group before they had any reason to care. The new flow opens with the SCD Hub mission, asks users to choose one of five commitment paths (Learning & Discovery, Make a Project, Train & Certify, Help Build This Platform, Eco Field Work), and then asks them to pick exactly one first action before reserving a planet. The Eco Field Work path introduces PFAS and microplastics monitoring specifically — PFOS, PFOA, and related forever chemicals from semiconductor manufacturing, firefighting foam, food packaging, and textiles are active contaminants in 2026 watersheds globally, and citizen science mapping makes them visible and attributable. The cosmic layer framing is explicit: the same ecocity systems knowledge that applies to a habitat orbiting a black hole applies to the atmosphere, watersheds, and soil of the planet you are standing on right now.',
    editorialNote: 'Link /learn and /eco-library pages should be verified to have content for each commitment path before publishing. Citizen Science track must exist at /learn before the certify path is promoted.',
  },
  {
    slug:     'settlements-as-possible-worlds',
    title:    'Every Settlement a Possible World',
    subtitle: 'A dialogue on exoplanet settlements as simulation chambers, emergent economies, and the geometry of what could be — with a side trip through E8, the Leech lattice, and a designation system for parallel futures',
    date:     'July 2026',
    audience: ['dev', 'community', 'ecosystem'],
    series:   'protocol',
    status:   'public-draft',
    description:
      'A Q&A dialogue between Greg Willson (SCD Hub) and Claude (Anthropic) hypothesising about whether Exotopia\'s settlement concept has more structural depth than its current implementation reveals. We work through: settlements as simulation chambers with real physics; curriculum units that run inside a community\'s specific history; emergent businesses that compound from bounty records; E8 capability axes for each settlement; the Λ₂₄ Leech lattice as a space for parallel universe designations (current state · aspirational state · relational context); counterfactual comparisons between branches; and what the Monster group\'s 8×10⁵³ symmetries might mean for surfacing non-obvious collaboration opportunities. Speculative design, not implemented features — except the E8 identity layer, which is built.',
    editorialNote: 'Companion to the e8-art-hash-zkp post. Mathematical claims (E8, Λ₂₄, Monster group, monstrous moonshine) are accurate; application to settlement architecture is design speculation. The eight-axis E8 capability mapping is proposed, not decided.',
  },
  {
    slug:     'black-hole-observatory-expansion',
    title:    'Ten Black Holes, Four Shapes',
    subtitle: 'Expanding the Galactic Center scene into a real observatory — the research, the architecture, and the honesty tradeoffs',
    date:     'July 2026',
    audience: ['dev', 'community'],
    series:   'science',
    status:   'public-draft',
    description:
      'The /bh/:bhId route existed since early on but only ever rendered Sagittarius A*. This post covers the research pass across every category of "how do we know this is a black hole" (EHT imaging, megamaser Keplerian dynamics, Gaia astrometric orbit-fitting, X-ray binary monitoring, HST hypervelocity-star evidence), the resulting ten-object catalog (M87*, NGC 4258, Omega Centauri\'s IMBH, Gaia BH1/BH2/BH3, Cygnus X-1, V404 Cygni, GRO J1655-40, A0620-00), the shared event-horizon/photon-ring/ISCO/disk rendering core extracted from the existing Sgr A* work, the four scene-dressing types built because a galactic nucleus, an X-ray binary, a jetted AGN, and a megamaser disk are genuinely different environments, and a real scale bug found and fixed where a fixed-size compact-object bubble tuned for Cygnus X-1 turned out to be larger than the entire orbit for the tightest binaries.',
    editorialNote: 'Verify the /black-holes index page and Explore-menu link are live before publishing.',
  },
  {
    slug:     'anticipated-objects-methodology',
    title:    'What Else Is Out There',
    subtitle: 'An honest methodology for populating the black hole observatory with statistically anticipated objects — and why "anticipated" has to mean something specific',
    date:     'July 2026',
    audience: ['dev', 'community'],
    series:   'science',
    status:   'public-draft',
    description:
      'Every confirmed object in the black hole observatory (companion stars, jets, tracer stars) is real and citable — but no black hole sits in a vacuum, and right now every scene renders as if it does. This post introduces a third "ANTICIPATED" category (extending the site\'s existing confirmed/candidate/frontier pattern from the galaxy view) for statistically generated populations: a Jurić et al. 2008 exponential thin-disk field-star model for the 7 Milky Way x-ray binaries, a King (1962) profile for Omega Centauri, and a Bahcall & Wolf (1976) stellar cusp for M87* and NGC 4258. Covers the full methodology, citations, and honesty caveats, plus the new stdlib-only Python generator (datagathering/generate_bh_anticipated_objects.py) that produced real output for all 9 objects — data generation only; 3D scene integration is future work.',
    editorialNote: 'Verify the generator script path and output location remain accurate if the data pipeline is refactored before the 3D rendering integration ships.',
  },
  {
    slug:     'financial-literacy-parallel-universe-powerup',
    title:    'Power-Up',
    subtitle: 'Personal finance literacy as the first "power-up" criterion for young people to spawn their own numbered parallel-universe settlement — starting as simple as a Linktree',
    date:     'July 2026',
    audience: ['community', 'ecosystem'],
    series:   'protocol',
    status:   'draft',
    description:
      'A proposal connecting two existing but separate ideas — the Train & Certify onboarding path and the speculative Λ₂₄ Leech-lattice "parallel universe" designation system — into a specific pitch: add a Personal Finance Literacy track whose completion unlocks the ability for a young person (millennial, Gen Z, or Gen Alpha) to spawn their own numbered parallel settlement, usable on day one as nothing more than a personal link page, growing into a full settlement as engagement deepens.',
    editorialNote: 'Not cleared for publication. This program is aimed partly at minors and touches financial-education content — needs a compliance review (COPPA and equivalent) for any under-13 reach, and financial-content review to confirm nothing reads as advice or a promise of monetary value, before this leaves draft status.',
  },
  {
    slug:     'sgr-a-black-hole-swarm',
    title:    'The Swarm Around the Center',
    subtitle: 'What we actually know about the black holes gathering near Sagittarius A* — and what we corrected before publishing this',
    date:     'July 2026',
    audience: ['dev', 'community'],
    series:   'science',
    status:   'public-draft',
    description:
      'A fact-check turned into the post: "string of pearls" is a real term, but for young star clusters around a black hole in NGC 2110 (Swinburne, 2014), not for black holes at Sagittarius A*. The real, well-documented phenomenon is the 2018 Chandra "black hole swarm" finding (Hailey et al., Nature) — about a dozen detected stellar-mass black hole X-ray binaries within roughly a parsec of Sgr A*, implying a population of 10,000-20,000 black holes accumulated via dynamical friction over the galaxy\'s history. Covers the mechanism (mass segregation/dynamical friction), the eventual fate (extreme mass ratio inspirals, LISA-detectable), and ties it to the site\'s own IRS 13E object.',
    editorialNote: 'Companion to the black-hole-observatory-expansion post.',
  },
  {
    slug:     'following-through',
    title:    'Following Through',
    subtitle: 'A press release promised a working zero-knowledge payment system for our Kenya field partners. It doesn\'t exist yet. Here\'s what we actually shipped instead, and what changes about how we talk about this platform going forward.',
    date:     'July 2026',
    audience: ['community', 'ecosystem', 'dev'],
    series:   'ecosystem',
    status:   'public-draft',
    description:
      'An accountability post: the June 2026 Kenya press release described a working ZK-proof field-verification + M-Pesa payout system for the Mpeketoni Eco Ops Group that does not exist in code, and the Platform page promised a finance-literacy settlement reward before any ledger existed to back it. This post names both gaps directly, reports what actually shipped instead (a Supabase rewards ledger covering finance literacy, volunteering, and mentor credit — no payments, no ZK proof, self-reported trust model except for server-enforced mentor confirmation), covers the unrelated void-navigation feature shipped the same pass including a real camera bug fix and an honestly-labeled data gap, and commits to a standing practice of describing what is running rather than what is specified. Companion to the new SPEC.md §21-23.',
    editorialNote: 'Sensitive — names a real credibility gap involving a named external community partner (Muirithi Jariffe / Mpeketoni Eco Ops Group) and a specific prior press release. Confirm with Greg before moving off public-draft.',
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
