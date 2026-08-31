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

// 'internal' and 'draft' posts are pre-publication — not for public listing or
// direct linking. Editorial holds (e.g. a compliance/legal review still
// pending) rely on this actually gating the route, not just showing a badge.
export function isPubliclyVisible (status: BlogStatus): boolean {
  return status === 'public-draft' || status === 'published'
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
    slug:     'cluster-transition-quality-pass',
    title:    'Fixing the Descent, Not Just the Click',
    subtitle: 'A review of every click-to-descend path across our 15 named clusters and 345 X-ray clusters found one dead-end already patched, one silent accuracy bug, and one crash waiting for our own generation pipeline to ship.',
    date:     'August 2026',
    audience: ['dev', 'community'],
    series:   'navigation',
    status:   'draft',
    description:
      'A quality pass on the galaxy-cluster descent chain (XClusterPage/ClusterInteriorPage → ClusterGalaxyPage → ClusterSystemPage): a silently-dropped morphology/distance query parameter that hardcoded every one of the 345 X-ray-cluster galaxies to a generic elliptical at 65 Mpc, five unguarded star_systems accesses that would crash on the lightweight documents SPEC_XCLUSTER_STARSYSTEMS.md proposes, a missing scene-transition on the X-ray descent path, and a void-classification check broadened from the first cluster member to all of them.',
    editorialNote: 'Fixes landed on fix/exotopia-liability-and-integrity; verify in a running build (X-ray cluster → galaxy descent showing real morph/distance, void ring still working) before publishing.',
  },
  {
    slug:     'counting-the-universe',
    title:    'Counting the Universe',
    subtitle: 'How many galaxies, stars, planets, and moons are real in Exotopia — and how many did we generate — and is any of this a realistic way to build a cosmic visualization?',
    date:     'August 2026',
    audience: ['dev', 'community'],
    series:   'science',
    status:   'draft',
    description:
      'A full whole-app tally of real vs. procedurally generated content — 345 real X-ray clusters, 26,225 generated cluster galaxies, 35,896 real exoplanet records, 10,900 generated planets, 0 bulk-generated moons — and an honest evaluation of whether the generation approach is scientifically defensible.',
    editorialNote: 'Companion to data-sources-unified-viz; verify counts against live data files before publishing.',
  },
  {
    slug:     'how-many-stars',
    title:    'How Many Stars?',
    subtitle: "An audit of Exotopia's 61,817-star field — where it sits among real catalogs, and whether the sky it draws has any gaps",
    date:     'August 2026',
    audience: ['dev', 'community'],
    series:   'science',
    status:   'draft',
    description:
      "A depth-and-coverage audit of Exotopia's star field: how 61,817 compares to naked-eye, HYG, Hipparcos, Tycho-2, 2MASS, and Gaia DR3, plus a galactic-coordinate density analysis showing no artificial sky gaps — the one real pattern (plane vs. pole density) is physical, not a catalog defect. Companion interactive chart published separately.",
    editorialNote: 'Companion to counting-the-universe and data-sources-unified-viz; verify counts against live data files before publishing.',
  },
  {
    slug:     'dark-matter-in-exotopia',
    title:    'What Dark Matter Actually Looks Like',
    subtitle: 'The DK.MAT button recolors a wormhole purple. Here\'s what the clusters we already have data for would show if it didn\'t.',
    date:     'August 2026',
    audience: ['dev', 'community'],
    series:   'science',
    status:   'draft',
    description:
      "The real evidence for dark matter (Zwicky's 1933 Coma discovery, the Bullet Cluster's direct lensing/gas offset, NGC 1407's overmassive halo) laid out using this project's own cluster calibration research, as the case for SPEC_DARK_MATTER_VIEW.md — replacing the cosmic view's non-functional X-RAY toggle with a halo-extent overlay built from real M200/r_vir data this app already ships.",
    editorialNote: 'Companion to SPEC_DARK_MATTER_VIEW.md; verify cluster mass figures match generate_cluster_catalog.py once the calibration corrections from SPEC_XCLUSTER_STARSYSTEMS.md §5 are applied.',
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
    slug:     'municipal-compost-campaign-strategy',
    title:    'Designing a Municipal Compost Producer-Responsibility Campaign',
    subtitle: 'A strategy framework for testing municipal compost and building an upstream producer-responsibility campaign — for any community, not just one town',
    date:     'August 2026',
    audience: ['community', 'field', 'ecosystem'],
    series:   'field',
    status:   'public-draft',
    description:
      'Companion strategy document to "Clean Compost from Source" — that post is the field-execution toolkit for one town\'s food-scrap composter; this one is the planning layer underneath it. Distinguishes two genuinely different PFAS-in-compost pathways (packaging-derived in food-scrap compost vs. biosolids-derived in land-applied sludge compost) and gives each its own strategy. Situates both inside the wider, decade-plus state movement phasing out toxic chemicals (bisphenols, phthalates, flame retardants) in consumer products and increasingly reframing plastics as a health issue rather than a waste issue — drawing on and directly attributing Safer States\' "Beyond PFAS: class-based approach for toxic chemicals and plastics" analysis, including Washington\'s stronger producer-responsibility template of identifying safer alternatives as part of the regulatory process, not just banning the harmful chemical, and the list of 18+ states expected to consider toxics/plastics policy this year. Covers the current 2026 regulatory moment (12+ states restricting PFAS food packaging, several effective in 2026 itself; EPA\'s July 2026 draft PFOA/PFOS biosolids risk-reduction guidance with a public-comment deadline of September 4, 2026) as concrete, dated hooks for advocacy rather than an abstract someday-issue. Lays out a five-phase framework — map your pathway, build the evidence base, run dual-audience public education (residents vs. businesses), turn evidence into producer-responsibility advocacy, institutionalize and share — plus a regulatory-landscape reference table and a first-30-days checklist that routes into Exotopia\'s PFAS/Ecology citizen-science tools and method-proposal system.',
    editorialNote: 'Every state-law effective date and the EPA comment-period deadline (Sept 4, 2026) must be re-verified against current agency guidance before publishing — PFAS policy at both state and federal level is moving quickly in 2026. The "bigger picture" section is directly attributed to Safer States\' "Beyond PFAS: class-based approach for toxic chemicals and plastics" (linked inline at that section) — verify the 18-state list and Washington framing against that page\'s current version before publishing, since it may be updated.',
  },
  {
    slug:     'regional-ecological-priorities-snapshot',
    title:    'Five Places, Five Priorities',
    subtitle: 'What locals in each of Exotopia\'s outreach regions actually see as urgent right now — checked before designing any biodiversity action plan, not after',
    date:     'August 2026',
    audience: ['community', 'field', 'ecosystem'],
    series:   'field',
    status:   'public-draft',
    description:
      'Companion research pass to SPEC_BIODIVERSITY_ACTION_PLANS.md — before designing a pollinator-stepping-stone planting plan for any region in Exotopia\'s outreach pipeline, this checks what the people who actually live there say is urgent, sourced from 2025-2026 reporting rather than assumed. Covers five regions with a colorized OpenStreetMap-based map for each: Boulder & Douglas Counties, Colorado (drought/wildfire, and how native low-water planting rides alongside that conversation instead of competing with it); Costa Rica (pesticide exposure from the pineapple export industry, a much bigger fight than a garden program); Seoul, South Korea (air quality and urban heat island, where the city\'s own green-space policy is close to a ready-made mandate); Lamu & Mpeketoni, Kenya (mangrove loss and the LAPSSET/Lamu Port development pressure on it, where stepping-stone habitat restoration translates almost directly to existing community-centered mangrove work); and Nairobi, Kenya (sanitation/water/air pollution in informal settlements as the priority baseline biodiversity work must acknowledge first, with Nairobi National Park\'s direct city-edge border as the one place a corridor frame is immediately locally legible). Closes with a synthesis: none of the five regions support a generic "just plant pollinator gardens" campaign as-is — each needs its own sequencing.',
    editorialNote: 'Every regional claim is dated to 2025-2026 sourcing (drought status, air quality rankings, project timelines) and should be re-verified before use in real outreach material — these conditions shift faster than this post will be updated. Map images are recolored OpenStreetMap data (© OpenStreetMap contributors, ODbL) generated via scripts/generate-region-maps.mjs — regenerate rather than hand-edit if a different region/extent is needed.',
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
    slug:     'how-we-actually-test-and-ship',
    title:    'How We Actually Test and Ship Exotopia',
    subtitle: 'Playwright, Vite, Vercel, Cloudflare, Supabase-local, localStorage — and what "E8" in your browser really is',
    date:     'August 2026',
    audience: ['dev'],
    series:   'protocol',
    status:   'draft',
    description:
      'A walkthrough of the real toolchain behind a settlement-features testing pass — local Supabase vs. production, the GitHub->GitLab mirror we found completely broken (failing silently since creation), Playwright techniques for testing a WebGL-heavy app behind Supabase auth without real magic-link emails, and a direct, unhedged clarification: the "e8" localStorage key prefix used for settlement data is a codename for a basic XOR obfuscation utility, not the real E8 lattice / zero-knowledge-proof system described in the separate e8-art-hash-zkp post (which is itself clearly labeled as a not-yet-built specification, not a shipped feature).',
    editorialNote: 'Written the same day as the settlement-persistence Playwright pass it describes. Explicitly cross-checked against e8-art-hash-zkp to avoid contradicting or restating its claims out of context — that post\'s own "what we are building now" section already says the ZK system isn\'t built; this post should not be read as walking that back or as newly confirming it. Verify the exotopia.org/blog/e8-art-hash-zkp link resolves before publishing.',
  },
  {
    slug:     'black-hole-observatory-expansion',
    title:    'Ten Black Holes, Four Shapes',
    subtitle: 'Expanding the Galactic Center scene into a real observatory — the research, the architecture, and the honesty tradeoffs',
    date:     'July 2026',
    audience: ['dev', 'community'],
    series:   'science',
    status:   'published',
    description:
      'The /bh/:bhId route existed since early on but only ever rendered Sagittarius A*. This post covers the research pass across every category of "how do we know this is a black hole" (EHT imaging, megamaser Keplerian dynamics, Gaia astrometric orbit-fitting, X-ray binary monitoring, HST hypervelocity-star evidence), the resulting ten-object catalog (M87*, NGC 4258, Omega Centauri\'s IMBH, Gaia BH1/BH2/BH3, Cygnus X-1, V404 Cygni, GRO J1655-40, A0620-00), the shared event-horizon/photon-ring/ISCO/disk rendering core extracted from the existing Sgr A* work, the four scene-dressing types built because a galactic nucleus, an X-ray binary, a jetted AGN, and a megamaser disk are genuinely different environments, and a real scale bug found and fixed where a fixed-size compact-object bubble tuned for Cygnus X-1 turned out to be larger than the entire orbit for the tightest binaries.',
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
    status:   'published',
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
  {
    slug:     'twin-cylinder-station-interior',
    title:    'The Twin-Cylinder Station',
    subtitle: 'Some locations were never going to have a garden and a dome. Here\'s what we built instead, for orbits, black holes, and worlds with no ground to stand on.',
    date:     'July 2026',
    audience: ['community', 'dev'],
    series:   'navigation',
    status:   'public-draft',
    description:
      'A settlement-view bug report (intersecting geometry navigating to some Tau Cet locations) traced back to an architectural gap: the renderer only knew how to build a dome on solid ground, regardless of whether ground existed at the destination. Covers the fix — a real no-ground classifier consuming the topo-params surface_type field that was already computed and never used, four navigation entry points now checking before committing to a scene (with SurfaceViewPage itself as the real backstop), a real pre-existing black-hole-claim hardcoding bug fixed along the way — and the new twin counter-rotating cylinder station interior itself, researched against real O\'Neill-cylinder/Stanford-Torus artificial-gravity literature rather than invented from scratch. Includes a screenshot carousel and an honest list of what is not yet claimed (dim lighting, flat walking surface, the literal reported bug never reproduced live before the fix shipped).',
    editorialNote: 'Screenshots are from a local dev capture, not a production deploy — interior lighting is genuinely underlit as shipped, called out directly in the post rather than color-corrected.',
  },
  {
    slug:     'nft-value-framing-fix',
    title:    'Cards Without a Ranking System',
    subtitle: 'A legal-risk review flagged our collector cards as a securities-framing problem. Here\'s what we removed, and what a mint screen looks like when it isn\'t trying to sell you on scarcity.',
    date:     'July 2026',
    audience: ['community', 'dev', 'ecosystem'],
    series:   'economy',
    status:   'public-draft',
    description:
      'RISK_REDUCTION_RECOMMENDATIONS.md flagged the collector-card system\'s four-tier ranked rarity (Legendary/Rare/Uncommon/Common, with a numeric score/10) as Howey-test/securities-framing exposure. This post covers the full removal per SPEC_NFT_VALUE_FRAMING.md: CardRarity/rarityScore and the on-chain Rarity trait removed from all 27 cards across three editions (not just the marketing copy), a required and logged pre-mint disclaimer added to the one live mint path, redundant rarity filter tabs removed in favor of the edition switcher already on the page, and a real unrelated bug found and fixed along the way (every card\'s back face hardcoded "ANTI-AI SLOP DROP" regardless of its actual series). Includes a before/after screenshot carousel and is explicit that this is a product change, not a substitute for the legal review the same document also calls for.',
    editorialNote: 'Companion to SPEC_NFT_VALUE_FRAMING.md and RISK_REDUCTION_RECOMMENDATIONS.md — this post describes a real code change, not legal advice; keep that distinction explicit if this moves off public-draft.',
  },
  {
    slug:     'risk-reduction-pass',
    title:    'Being Cautious On Purpose',
    subtitle: 'What changed after we actually read our own risk-reduction memo — including removing a working marketplace feature.',
    date:     'July 2026',
    audience: ['community', 'dev', 'ecosystem'],
    series:   'economy',
    status:   'public-draft',
    description:
      'A full pass through RISK_REDUCTION_RECOMMENDATIONS.md\'s remaining items. The headline change: pon.ink\'s "Exchange Depot" — a working mock secondary marketplace with token pricing, offers, and a public listing form, reachable from the main nav — is removed entirely, along with the KES exchange-rate displays on the mint/station fee panels and the marketing copy advertising an 80% resale-royalty aftermarket. Also covers: fixing a real enforcement gap where draft/internal blog posts (including a COPPA-flagged financial-literacy piece) were only badge-labeled, not actually gated from public URLs; wiring a self-attested age bracket into onboarding that the private-comment system\'s youth-mode gate already expected but never received; writing the previously-missing Community Guidelines document a live route and the Terms of Service already referenced; a standing disclaimer and correction-request path added to the PFAS citizen-science page; a 90-day prune for unsubmitted local drafts; a new site-wide footer with a real contact/report link; and a timestamped consent-acceptance log. Explicit about what a small team fixes in code versus what still needs an actual lawyer (M-Pesa licensing structure, jurisdiction-specific review).',
    editorialNote: 'Companion to RISK_REDUCTION_RECOMMENDATIONS.md — describes real code/doc changes, not legal advice. The removed marketplace feature is gone from the app but its aspirational design still lives in SPEC_PON_INK.md/SPEC.md as an explicitly-labeled future vision, not corrected in this pass.',
  },
  {
    slug:     'networks-of-trust',
    title:    'Networks of Trust',
    subtitle: 'Four features, one design decision — a graded, four-rung system for when a relationship claim should substitute for verification, and the hard line where it never should.',
    date:     'July 2026',
    audience: ['community', 'dev', 'ecosystem'],
    series:   'economy',
    status:   'public-draft',
    description:
      'Names a pattern that had been independently reinvented across private comments (green-light mutual connections), the onboarding age self-attestation, and the new Knowledge Keeper feature: trust in a self-reported relationship is graded across four rungs (act immediately / soft nudge / hold pending a written artifact / no shortcut, route to a formal process) rather than treated as binary verified-or-not. Explains the new Knowledge Keeper submission feature (/knowledge-keepers) built on this pattern per docs/eco-ops-workflow-guide.md Part 7, with the graded submitter-relationship tiers (self/family publish immediately, friend gets a soft confirmation nudge, student/researcher is held for review) enforced server-side via a Postgres trigger, not just client-side trust. The core argument is the boundary between rung 3 and rung 4: closeness of relationship is legitimate trust information right up until the person whose consent actually matters isn\'t the one using the product — a family member, a minor, an elder speaker of a threatened language — at which point Free Prior and Informed Consent (ILO C169, UNDRIP Art. 31, Nagoya Protocol) and COPPA-grade parental consent both apply, and no self-attestation at any relationship distance substitutes for them. Companion to the new SPEC_NETWORKS_OF_TRUST.md.',
    editorialNote: 'Companion to SPEC_NETWORKS_OF_TRUST.md — the pattern description, not legal advice. The Knowledge Keeper feature\'s Supabase migration (005) hasn\'t been applied to any live project yet, so the live site shows the empty/sign-in states shown in the screenshots, not populated records.',
  },
  {
    slug:     'platform-services-tour',
    title:    "A Tour of What's Here",
    subtitle: 'Settlement identity, elder knowledge, citizen science, and your own data — a walk through the newest corners of Exotopia.',
    date:     'July 2026',
    audience: ['community', 'field', 'ecosystem'],
    series:   'ecosystem',
    status:   'public-draft',
    description:
      'A product-facing tour (not a legal/compliance writeup) of the platform after the recent risk-reduction and Networks of Trust passes: the Settlement Registry at /pon-ink (identity records, no pricing, the former mock marketplace fully removed), the new Wisdom from Elders / Knowledge Keeper records feature at /knowledge-keepers with its graded consent tiers, the PFAS/PFOA citizen science page\'s standing disclaimer and field-safety waiver, the new self-service Account & Privacy page at /account (data export, deletion requests), the six-step onboarding flow with its self-attested age bracket, and the unbundled two-checkbox consent modal every visitor sees first. Includes a five-slide screenshot carousel across desktop and mobile.',
    editorialNote: 'Screenshots show the signed-out/empty states for features that require authentication (Knowledge Keeper submission, Account export/deletion) — this environment has no way to complete the magic-link sign-in flow for a live screenshot of the authenticated views.',
  },
  {
    slug:     'settlement-address-api',
    title:    'The Settlement URL Is an Address, Not Yet an API',
    subtitle: 'SPEC_EXOLOC_ADDRESS.md documents a public API for looking up a settlement. We went looking for it. Here\'s the actual dependency chain, and what changed since blockchain minting was removed.',
    date:     'August 2026',
    audience: ['dev', 'ecosystem'],
    series:   'protocol',
    status:   'public-draft',
    description:
      'Traces what actually happens when a settlement address gets "placed" — from the NASA Exoplanet Archive reference data, through the pure string-building functions in settlements.ts/moon-settlement.ts, into a client-only localStorage record (obfuscated, not encrypted, by the E8-lattice-keyed storage-cipher.ts — explicitly not a cryptographic primitive by its own header comment), and out through an optional IPFS pin via ipfs-pinning.ts. Updated from its original July 2026 draft, which described three chain-specific NFT metadata writers (EVM, Solana, Algorand) as the real source of truth — that path has been removed, not just deprecated, and this version explains why the address-collision question is now a closed design decision rather than an open one. Confirms two real gaps found while writing this: the `GET /api/v1/exoloc` endpoint named in SPEC_EXOLOC_ADDRESS.md\'s header does not exist anywhere in the codebase, and there is still no settlements table in any Supabase migration. Also draws an explicit line between this cipher and the unrelated, unbuilt E8/Λ₂₄ zero-knowledge-proof design in SPEC_ECO_OPS_API.md, the same distinction the project\'s own Kenya press-release correction post exists to reinforce.',
    editorialNote: 'Companion to the updated SETTLEMENT_ADDRESS_API.md reference doc, which this post was rewritten to match after the blockchain/NFT scope correction in SPEC.md §26. Describes current implementation status, not a roadmap commitment — the read-side lookup directory is an open design question, not yet scheduled work; the collision-authority question is not open, see the post itself.',
  },
  {
    slug:     'self-hosted-exotopia',
    title:    'Run Your Own Exotopia',
    subtitle: 'A three-step, blockchain-free path to standing up an independent instance — and why we want you to',
    date:     'August 2026',
    audience: ['dev', 'community', 'ecosystem'],
    series:   'ecosystem',
    status:   'public-draft',
    description:
      'Exotopia no longer needs a wallet or a blockchain to run: a fresh instance is Supabase (for the schema), a git host of your choice (GitLab, Gitea, or GitHub — no vendor lock-in), and Vercel (to deploy). Walks through why that baseline stack was chosen, the optional refinements layer (Cloudflare, Redis, or a fully standalone Appwrite deployment for a home-network setup with zero external SaaS dependency), and the actual pitch behind making self-hosting this easy: independent instances doing their own visualization and citizen-science work in the humanitarian-engineering and biodiversity space, while staying part of the same collaborative effort rather than a fork nobody talks to again. Companion to SPEC_SELF_HOSTED_NETWORK.md, which has the open engineering questions this post deliberately doesn\'t pretend are settled.',
    editorialNote: 'The instance-to-instance data-sharing mechanism is not yet designed — see the spec\'s Open Questions section. This post describes the deploy path, which is real and working today, not the federation layer, which isn\'t.',
  },
  {
    slug:     'local-first-by-default',
    title:    'Your Browser Is the Database',
    subtitle: 'Why most of Exotopia runs on localStorage, what that buys you, and where the line to a server actually sits',
    date:     'August 2026',
    audience: ['dev', 'community', 'ecosystem'],
    series:   'protocol',
    status:   'public-draft',
    description:
      'Walks through the local-first storage architecture underneath settlements, staged items, mint styles, onboarding progress, and the block list: localStorage as the always-on source of truth, Supabase writes as fire-and-forget background sync that only activates once a member signs in, and a one-time merge-not-replace step on login (server wins per-key for settlements, union for the block list) that reconciles anonymous local data with the server copy. Distinguishes the two separate ciphers in the codebase on purpose — storage-cipher.ts\'s E8-lattice localStorage obfuscation (explicitly not real security, by its own header comment) versus encrypted-backup.ts\'s real AES-256-GCM+PBKDF2 export flow — and is direct about the real limits: no cross-device sync while signed out, a silent no-op past the localStorage quota, and clearing site data being unrecoverable without an exported backup.',
    editorialNote: 'Companion to self-hosted-exotopia — describes the client-side half of "server as optional sync layer, not custodian." Written after a member asked what a specific /rest/v1/blocked_members call in local dev actually was.',
  },
  {
    slug:     'the-lessons-are-real',
    title:    'The Lessons Are Real',
    subtitle: "A status check on Learn, Sky Lessons, and the Eco-Ops Library — the mentoring tools next to them, and the citizen-science roadmap items that aren't built yet",
    date:     'August 2026',
    audience: ['community', 'field'],
    series:   'field',
    status:   'public-draft',
    description:
      "A direct status check on the three lessons surfaces (finance/science quizzes at /learn, astronomy/navigation at /sky-lessons, and the 104-video Eco-Ops Library), why two of them were nearly invisible in the main nav until this post's companion fix, the new group-leader view on the Rewards page for mentors running several mentees through WATSAN/biodiversity/remediation work, and the community_nodes business_listing/business_location directory as the real, shipped hook for small-business earth-services listings. Includes a short Q&A on what the platform is and isn't, and a clearly separated roadmap section — simulation-strategy sharing, decontamination target-setting, deeper business integration — labeled as not yet built.",
    editorialNote: 'Written alongside the MainLayout.vue nav-prominence fix and the mentor group-leader view it describes — both shipped in the same change as this post, not pre-existing.',
  },
  {
    slug:     'milky-way-rebuild',
    title:    'We Rebuilt the Milky Way',
    subtitle: "Real spiral arm data, a bug that put our galaxy's core on top of the Sun, and a night sky that finally looks like one",
    date:     'August 2026',
    audience: ['dev', 'community'],
    series:   'science',
    status:   'public-draft',
    description:
      "How GalaxyPage.vue's face-on spiral disk and the new SurfaceViewPage.vue sky band were rebuilt on real data: Reid et al. 2019's per-arm pitch/azimuth structure (7 real arms, including the previously-missing 3-kpc arm and Local Arm/Orion Spur) replacing an invented 4-arms-at-90° model, Wegg & Gerhard 2013's bar angle (27°, not 44°), a structural fix that had been drawing the galactic core on top of the Sun's own position, population-based star coloring instead of per-arm hues, and a new all-sky galactic band for planet-surface views oriented via the real IAU North Galactic Pole. Ends with a researched 'what's next' list — real datasets and Three.js techniques evaluated for fit with the existing stack.",
    editorialNote: 'Companion to SPEC_MILKY_WAY_VISUALIZATION.md, which has the exact file/line citations this post summarizes in plain language.',
  },
  {
    slug:     'status-report-aug17-2026',
    title:    'Status Report: August 17, 2026',
    subtitle: 'A navigable 3D universe, zero users, built in the open — what shipped this week, what\'s honestly still missing, and what\'s next',
    date:     'August 2026',
    audience: ['community', 'dev', 'field'],
    series:   'ecosystem',
    status:   'public-draft',
    description:
      'A plain-language snapshot of the project as it actually stands, written to hand to someone who\'s never seen it before: still pre-launch, still zero users, everything below is "what\'s real and working," not "what people are using." Covers a week of shipped work — the Milky Way rebuilt on real Reid et al. 2019 spiral-arm data with a new all-sky galactic band from a settlement\'s surface, station interiors getting real circular "porthole" windows and a deck-map guide panel, settlement gallery structures becoming enterable File Cabinets backed by the same Supabase tables as the rest of the platform, /sky-lessons and the 104-video Eco-Ops field library finally getting nav entries after being reachable only through onboarding or a buried deep link, a mentor group-leader rollup view on the Rewards page, a new /my-listings business directory, a fix to the Local Void detail page that was silently failing over to an empty catalog on a NASA/IPAC NED query timeout, and a cleanup that archived unused Hardhat/Solana/Metaplex blockchain tooling to archive/chains/ rather than deleting it outright. Just as direct about what isn\'t done: the sky-data "regime" architecture is specced but not built, the installable PWA identity still only covers the citizen-science module, and the onboarding welcome-letter template still describes settlement addresses as "recorded on the blockchain" — stale relative to the actual local-first/IPFS architecture, flagged but not yet fixed.',
    editorialNote: 'Supersedes the August 10 status report; nothing in that one was wrong, this one is just more current. Published alongside an open call for testers, mentors, and technical collaborators.',
  },
  {
    slug:     'call-for-collaboration-testing',
    title:    'Exotopia Is Looking for People to Try to Break It',
    subtitle: 'An open call for testers, mentors, and technical collaborators — pre-launch, zero users, built in the open',
    date:     'August 2026',
    audience: ['community', 'dev', 'field'],
    series:   'ecosystem',
    status:   'public-draft',
    description:
      "A direct ask, distinct from the conservation-biology co-authorship call: pre-launch software needs people willing to actually drive it and try to break it, not review scientific content. Names concrete flows ready to test today (the five-level cosmic descent, no-account settlement persistence, the rebuilt Milky Way, station interiors, the File Cabinet, mentor group tooling, /my-listings) and what kind of help is wanted — click-through testers with no technical background, mentors/group leaders, developers willing to read src/ rather than just click through it, and anyone willing to try onboarding cold. Bug reports route to GitHub Issues (already wired via the in-app report modal and bug_report.yml) for testers with a GitHub account, or ecocommunity@protonmail.com — the existing privacy-policy-covered support channel, not a new intake surface — for everyone else. Explicit about what's not being asked for (money, a long commitment, forced public credit) and what's honestly still rough before you start.",
    editorialNote: 'Companion to status-report-aug17-2026 — read that first for the full current-state snapshot this call points to.',
  },
  {
    slug:     'visual-library-proposal',
    title:    'The Fourth Track',
    subtitle: 'A proposal for a Visual Library of settlement objects and design elements — and an open question about what the Financial Literacy Power-Up actually delivers today',
    date:     'August 2026',
    audience: ['community', 'dev', 'ecosystem'],
    series:   'protocol',
    status:   'public-draft',
    description:
      'A review of the P-Fin 8/28 financial-literacy incentive system against SPEC.md §21/§21.5, followed by a concrete proposal for the fourth RewardTrack §21.5 already named as the shortest path to a "library curation" and "model contribution" track: a public, browsable Visual Library of the settlement-object catalog (src/lib/settlement-items.ts), built on the same submission/endorsement pattern PFAS method proposals already use (no formal peer-reviewer role invented, matching SPEC.md §24.3\'s honest gap), feeding the same points/certificate/settlement-object plumbing the finance-literacy and volunteering tracks already use. Also reports, as an open question rather than a fix, that PlatformPage.vue\'s live "Financial Literacy Power-Up" callout describes a personal link-page settlement seed and a numbered parallel-universe upgrade with a full Train & Certify toolset — none of which exists in src/stores/rewards.ts or src/lib/settlements.ts today. What actually happens on quiz completion is a real points award, a real server-issued certificate, and a real decorative object (Seed Vault / Signal Beacon) added to the member\'s existing settlement.',
    editorialNote: 'The PlatformPage.vue / rewards-catalog.ts copy finding needs a maintainer decision before any correction ships — this post deliberately does not rewrite that copy. See SPEC.md §23, which already corrected one earlier version of this same promise.',
  },
]

export function getRelatedPosts (post: BlogPostMeta, limit = 3): BlogPostMeta[] {
  return BLOG_POSTS
    .filter(p => p.slug !== post.slug && isPubliclyVisible(p.status))
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
