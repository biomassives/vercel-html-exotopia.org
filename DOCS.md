# Exotopia.org — Document Index

**SCD Hub · GPL v3 · Updated June 2026**

All markdown files in this repository, organised by purpose.
Start at [README.md](README.md) or jump to a category below.

---

## Contents

- [Core Reference](#core-reference)
- [Master Specification](#master-specification)
- [Component Specifications](#component-specifications)
- [Ecosystem & Protocol Specifications](#ecosystem--protocol-specifications)
- [Blog Posts & Working Drafts](#blog-posts--working-drafts)
- [Research & Integration](#research--integration)
- [Community Field Work — Eco Ops](#community-field-work--eco-ops)
- [In-App Educational Pages](#in-app-educational-pages)

---

## Core Reference

| File | Description |
|---|---|
| [README.md](README.md) | Project overview, navigation hierarchy, architecture, data sources, key pages, developer setup, June 2026 status |
| [GLOSSARY.md](GLOSSARY.md) | Definitions for 47+ terms: exolocation, conduit, Ecommunity DAO, wormhole, trophic hierarchy, E8 lattice, mule-bot, and more |

---

## Master Specification

| File | Description |
|---|---|
| [SPEC.md](SPEC.md) | Full platform spec — 20+ sections covering settlement system, navigation hierarchy, PON INK token economy, five-level cosmic hierarchy, dome/orb/pyramid interior objects, gallery system, robot companion, DAO governance |

---

## Component Specifications

Technical specs for individual features and UI systems.

| File | Description | Status |
|---|---|---|
| [SPEC_CELESTIAL_REVEAL.md](SPEC_CELESTIAL_REVEAL.md) | LOD-driven reveal of real Webb/Hubble/Chandra imagery; nav gap fill; 5-sprint plan | Specced |
| [SPEC_COSMOS_ENTRY.md](SPEC_COSMOS_ENTRY.md) | CosmosPage rename from WelcomePage; WelcomeOverlay component; role-aware entry | Specced |
| [SPEC_DARK_MATTER_VIEW.md](SPEC_DARK_MATTER_VIEW.md) | Replaces the non-functional X-RAY view-mode toggle; halo-extent overlay from real per-cluster M200/r_vir data; one-off Bullet Cluster resolved-offset image | Draft |
| [SPEC_DEFENDERNAV.md](SPEC_DEFENDERNAV.md) | Defender arcade-style 360° horizontal strip navigator; 3 modes; GSAP fly-to + E8 portal transit | Specced |
| [SPEC_GALAXY_CLUSTER_VIEWER.md](SPEC_GALAXY_CLUSTER_VIEWER.md) | Galaxy cluster viewer upgrade; morphology bars; LOD star reveal; subcluster detection | Specced |
| [SPEC_NFT_FRONTIER.md](SPEC_NFT_FRONTIER.md) | Frontier exolocation NFTs for predicted/candidate/theoretical exoplanets; upgrade chain; 4-tier system | Specced |
| [SPEC_PROVENANCE.md](SPEC_PROVENANCE.md) | Provenance block schema; data source badging (catalog vs generated); observatory report field | Active |
| [SPEC_SHAREABLE_ROUTES.md](SPEC_SHAREABLE_ROUTES.md) | Standardized query-param convention (`at`/`cam`/`zoom`/`pan`/`bearing`) so a shared URL reproduces camera/zoom/pan state anywhere in the visualization, not just the coarse route | Draft |
| [SPEC_STARSYSTEM_ALGORITHM.md](SPEC_STARSYSTEM_ALGORITHM.md) | 3-stage deterministic pipeline: stellar populations → orbital architecture → planet composition; 2,823 galaxies → 10,900 planets | Active |
| [SPEC_XCLUSTER_STARSYSTEMS.md](SPEC_XCLUSTER_STARSYSTEMS.md) | Extends the star-system generation pipeline to the 345 Takey2013 X-ray clusters (26,225 galaxies, sprite-only today); tiered generation strategy; literature-researched calibration constants for all 15 named clusters | Draft |
| [SETTLEMENT_ADDRESS_API.md](SETTLEMENT_ADDRESS_API.md) | Dependency chain behind a settlement address (reference data → construction → local record → chain metadata → mint); companion to SPEC_EXOLOC_ADDRESS.md; documents that the spec's `/api/v1/exoloc` endpoint is not implemented | Active |
| [SPEC_COMMUNITY_NODES.md](SPEC_COMMUNITY_NODES.md) | Business listings/locations, creative pages, and future node types; populates the previously-empty OrbitalGalleryEntry pipeline; node_type extensibility mechanism; self-host/export story | Active |

---

## Ecosystem & Protocol Specifications

Specs for the broader SCD Hub platform and inter-platform protocols.

| File | Description | Status |
|---|---|---|
| [SPEC_ECOCITY.md](SPEC_ECOCITY.md) | ecocity.com platform — sustainable infrastructure education, workshop curriculum, settlement object library | Specced |
| [SPEC_ECOOPS_COMMUNITY_PLATFORM.md](SPEC_ECOOPS_COMMUNITY_PLATFORM.md) | Eco Ops community coordination platform (chain-free edition); Mpeketoni / Lamu field ops integration | Draft |
| [SPEC_EXOTOPIA_ECOSYSTEM.md](SPEC_EXOTOPIA_ECOSYSTEM.md) | Ecosystem technical overview + Jupyter notebook program for junior developers; Astropy, Plotly, NASA ExA | Reference |
| [SPEC_FEE_ISOLATION.md](SPEC_FEE_ISOLATION.md) | Ledger separation for protocol fees vs community payouts; auditability; inverse verification principle; Rust pseudocode | Active |
| [SPEC_GAMETHEORY.md](SPEC_GAMETHEORY.md) | Game theory mechanics — settlement competition, cooperation incentives, DAO voting strategies | Specced |
| [SPEC_MULEBOT_API.md](SPEC_MULEBOT_API.md) | mule-bot settlement query API; endpoint spec for corpus-driven AI companion | Draft |
| [SPEC_PON_INK.md](SPEC_PON_INK.md) | pon.ink platform — sound tools, events, M-Pesa/Stripe payments, NFT minting, user dashboard | Specced |
| [SPEC_PRIVACY_TIMESCALES.md](SPEC_PRIVACY_TIMESCALES.md) | Privacy architecture, vulnerability lifecycle, active defense, cross-scale anonymization | Specced |
| [SPEC_SECURITY_BULLETIN.md](SPEC_SECURITY_BULLETIN.md) | Security notification bulletin format; CVE alert relay; responsible disclosure pipeline | Draft |
| [SPEC_SELF_HOSTED_NETWORK.md](SPEC_SELF_HOSTED_NETWORK.md) | Blockchain-free self-hosting: Supabase/Git/Vercel baseline, Cloudflare/Redis/Appwrite refinements layer, and the open questions behind instance-to-instance data sharing | Draft |
| [SPEC_WORLDBRIDGER_ONE.md](SPEC_WORLDBRIDGER_ONE.md) | Worldbridger One protocol — collective creative attribution, multi-author asset fracturing, dynamic resource commitments | Specced |

> **Note:** `SPEC_FEE_ISOLATION00.md` is an older near-identical draft of `SPEC_FEE_ISOLATION.md` (two-line wording difference). Use `SPEC_FEE_ISOLATION.md` as canonical.

---

## Blog Posts & Working Drafts

Published-intent writing about the platform, ecosystem, and communities. All GPL v3.

| File | Topic | Audience |
|---|---|---|
| [blog-data-sources-unified-viz.md](blog-data-sources-unified-viz.md) | Astronomical catalog survey — what's live, what's missing, integration priorities (NASA ExA, HYG, XMM, NED); June 2026 progress addendum | Dev / data |
| [blog-every-object-a-door.md](blog-every-object-a-door.md) | How the 5-level navigation chain is wired: CosmicPage → XCluster → Galaxy → Surface; what's complete | Dev |
| [blog-surfing-the-realms.md](blog-surfing-the-realms.md) | Building a seamless zoom from cosmic web to colony door; pipeline gaps; sky accuracy problem | Dev |
| [blog-first-flag-remote-worlds.md](blog-first-flag-remote-worlds.md) | Extragalactic frontier settlements; predominance of cluster exoplanets; citizen science framing | Community |
| [blog-zero-fee-ecosystem.md](blog-zero-fee-ecosystem.md) | Why 0.25%: the 80/15/5 revenue split, fee isolation, and what "zero-fee for communities" means | Community |
| [blog-mule-v2-specialist.md](blog-mule-v2-specialist.md) | Why a domain-specialist AI (the Mule) is chosen over a general assistant; corpus design | Community / dev |
| [blog-eco-ops-without-blockchain.md](blog-eco-ops-without-blockchain.md) | Digital certificates vs on-chain records for grassroots field work; when blockchain is not the answer | Community |
| [blog-shared-language-lamu-ecoledger.md](blog-shared-language-lamu-ecoledger.md) | Introducing the Eco-Ledger for Mpeketoni; shared vocabulary for land and livelihood records | Field |
| [blog-costa-rica-biodiversity-platform.md](blog-costa-rica-biodiversity-platform.md) | Three-generation vision for biodiversity collaboration in Costa Rica; SCD Hub regional strategy | Field |
| [blog-settlement-address-api.md](blog-settlement-address-api.md) | The settlement address dependency chain end to end; confirms SPEC_EXOLOC_ADDRESS.md's `/api/v1/exoloc` endpoint isn't implemented and there's no server-side settlements table | Dev / ecosystem |
| [blog-self-hosted-exotopia.md](blog-self-hosted-exotopia.md) | The three-step blockchain-free self-host path (Supabase/Git/Vercel), the optional refinements layer, and the honest state of instance-to-instance data sharing | Dev / community / ecosystem |

---

## Research & Integration

Technical research documents, integration assessments, and sprint plans.

| File | Description | Date |
|---|---|---|
| [mvp_launch_apr20-2026.md](mvp_launch_apr20-2026.md) | MVP launch baseline assessment; prioritised sprint list; known gaps at April 2026 launch | Apr 2026 |
| [pon_ink_exotopia_integration.md](pon_ink_exotopia_integration.md) | API checklist for pon.ink ↔ exotopia interoperability; sphere/property-tier/bundle/POAP/Mule-tier protocols | Apr 2026 |
| [cluster_data_research_query.md](cluster_data_research_query.md) | Research query for non-Milky Way galaxy cluster data; NED TAP exploration; Takey2013 follow-up | Apr 2026 |
| [pon_ink_dryrun_prompt.md](pon_ink_dryrun_prompt.md) | Claude Code session prompt for the pon.ink dry run event (Glipish DJ & _am_lunchmeat, May 2026) | May 2026 |

---

## Community Field Work — Eco Ops

On-the-ground documentation for the SCD Hub Eco Ops programme in Lamu County, Kenya.

| File | Description |
|---|---|
| [baseline-mpeketoni-needs-assessment.md](baseline-mpeketoni-needs-assessment.md) | Ecological knowledge baseline assessment for Mpeketoni Group; coordinator: Muirithi Jariffe |
| [toolkit-baseline-evaluation-guideline.md](toolkit-baseline-evaluation-guideline.md) | Evaluation toolkit guideline for group coordinators, facilitators, school partners, and scientific advisors |
| [welcome-letter.md](welcome-letter.md) | Welcome letter template for PON INK / Exotopia onboarding; multi-channel (email / SMS / audio) |

---

## In-App Educational Pages

Interactive pages accessible within the Exotopia app, linked from `/docs`.

| Route | Source file | Topic | Audience |
|---|---|---|---|
| [/sky-lessons](src/pages/SkyLessonsPage.vue) | `src/pages/SkyLessonsPage.vue` | How exomoon skies are generated: parallax pipeline, raDecToVec3, starColorFromTeff, Hill sphere, ISCO; two lessons | Grades 8–11 + Graduate |
| [/void-math](src/pages/VoidMathPage.vue) | `src/pages/VoidMathPage.vue` | Void architecture and conduit mathematics: Hamaus profile, mpcToVec3, conduit placement algorithm, Boötes real data, 6 open questions | Developer / researcher |
| [/blog](src/pages/BlogIndexPage.vue) | `src/pages/BlogIndexPage.vue` + `src/pages/BlogPostPage.vue` | Indexed blog: 9 working-note posts in 5 series; audience filter; editorial callouts; related posts; sourced from root `blog-*.md` via Vite glob | All |

---

## Duplicate / Archive

| File | Note |
|---|---|
| [SPEC_FEE_ISOLATION00.md](SPEC_FEE_ISOLATION00.md) | Near-identical older draft of `SPEC_FEE_ISOLATION.md`. Two-line difference: `pub struct` vs `pub class` (line 78), minor wording (line 200). Kept for reference. |

---

*This index is maintained by hand. If you add a markdown file to the root, add a row here.*
