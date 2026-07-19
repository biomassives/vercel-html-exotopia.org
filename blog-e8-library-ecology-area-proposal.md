# Filling the Gap: A Proposed Ecology & Biodiversity Area for the SCD Hub Library

## E8 capability axis analysis reveals what the existing library is missing — and here's the JSON to fill it

*SCD Hub / Exotopia.org — July 2026*

---

In our recent post ["Every Settlement a Possible World"](/blog/settlements-as-possible-worlds) we proposed that a settlement's **E8 dimensional address** — a score on eight orthogonal capability axes — could serve as a community self-assessment framework. The eight axes were:

| Axis | Capability domain |
|---|---|
| x₁ | Land stewardship and soil health monitoring |
| x₂ | Water quality and watershed integrity |
| x₃ | Biodiversity and ecological community health |
| x₄ | Community governance and decision-making capacity |
| x₅ | Technology maturity and tool access |
| x₆ | Educational reach and intergenerational knowledge |
| x₇ | Economic inclusion and income resilience |
| x₈ | Climate adaptation and long-term site planning |

This post turns that abstract framework into a concrete library proposal. The SCD Hub Eco Operations Library currently contains six areas — **Shelter, Water, Waste, Energy, Health, Food** — which correspond roughly to the physical-infrastructure axes. But four of the eight E8 axes are not meaningfully covered. Here's the gap analysis, a full JSON proposal for the first missing area, and the rationale for which area to tackle first.

---

## Gap analysis

The table below maps existing library areas to E8 axes. A ✓ means the existing area provides substantial resource coverage. A partial (▸) means adjacent coverage but not the axis itself. A blank means no coverage.

| E8 axis | Existing coverage |
|---|---|
| x₁ Land stewardship / soil | ▸ Food (urban gardening) — monitoring and soil science absent |
| x₂ Water quality / watershed | ▸ Water (purification, desalination, distribution) — ecological monitoring absent |
| x₃ Biodiversity | — |
| x₄ Community governance | — |
| x₅ Technology maturity | ▸ Energy (microgrids, solar) — general technology tooling absent |
| x₆ Educational reach | ▸ scattered across all areas — no dedicated pedagogy resources |
| x₇ Economic inclusion | — |
| x₈ Climate adaptation | ▸ Shelter (resilient construction) — planning and adaptive management absent |

The largest gap is **x₁, x₂ (monitoring side), and x₃**: the ecological sciences. The existing Water area teaches water *processing* (biosand filters, slow-sand, RO). Nothing teaches water *reading* — how to measure BMWP macroinvertebrate scores, interpret conductivity readings, or track a Secchi disk record over time. The Food area teaches growing techniques but not soil biology or land health assessment. Biodiversity — species identification, habitat assessment, wildlife ecology — is absent entirely.

This gap is not accidental. The platform's early content was curated for communities learning to build infrastructure. The citizen science layer — monitoring what that infrastructure is doing to the surrounding ecology — is the next phase.

---

## Proposed new area: Ecology & Biodiversity

The new area covers four subcategories, one per ecological scale:

1. **Soil Health & Land Stewardship** (x₁) — what lives below ground, how to assess it, and how land management decisions change it
2. **Biodiversity Monitoring & Citizen Science** (x₃) — standardised field protocols for species tracking, iNaturalist, eBird, BMWP macroinvertebrates
3. **Watershed Ecology & Water Quality Monitoring** (x₂ monitoring) — how to read water as a living system, not just treat it
4. **Climate Adaptation & Resilience Planning** (x₈) — phenology, local climate observation, adaptive management planning

---

## JSON proposal

This block follows the `ot6a.json` schema used by `EcoLibrary.vue`. It can be appended directly to the areas array in `/public/ot6a.json`. Video entries marked `"youtubeId": "PENDING"` are content slots awaiting curation; all others are confirmed available.

```json
{
  "area": "Ecology & Biodiversity",
  "featherIcon": "wind",
  "subcategories": [
    {
      "uniqueId": "ecology-0",
      "title": "Soil Health & Land Stewardship",
      "subtitle": "Understanding what lives below ground — and why it determines everything above",
      "description": "Soil is not dirt. A teaspoon of healthy agricultural soil contains more organisms than there are people on Earth. This subcategory covers how to assess soil biological, physical, and chemical health using field-accessible methods — and how land management decisions (tillage, cover crops, compaction, chemical inputs) shift that balance over time.",
      "tags": [
        "soil biology",
        "soil health",
        "carbon sequestration",
        "cover crops",
        "compaction",
        "earthworms",
        "fungi",
        "Haney test",
        "aggregate stability",
        "land stewardship"
      ],
      "context": "Targeted at community groups, school programmes, and smallholder farmers who want to move beyond NPK soil testing toward a whole-system understanding of land health. The Haney Soil Health Test and the NRCS soil health principles are the primary methodological frameworks. Field work requires only a soil probe, mason jars, and free smartphone apps (iNaturalist for macrofauna, Cornell Soil Health app for scoring).",
      "videos": [
        {
          "title": "Understanding Soil Health — The NRCS Soil Health Primer",
          "youtubeId": "8BZT2WTXLSI",
          "description": "USDA NRCS introduction to the four soil health principles: minimise disturbance, maintain living roots, maintain soil cover, maximise diversity. Covers aggregate stability, infiltration testing, and the earthworm dig test — three field assessments any community group can run without laboratory equipment.",
          "icon_tag_fa": "fas fa-seedling",
          "color_tag": "#6b7c3a",
          "localVideoFilename": "",
          "authors": "USDA NRCS",
          "researchReviewItems": [],
          "contentCreatorArchive": "https://www.youtube.com/@usdanrcs",
          "licence": "U.S. Government Work (public domain)",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["soil biology", "aggregate stability", "field assessment"]
        },
        {
          "title": "Gabe Brown: Unlocking the Secrets of the Soil",
          "youtubeId": "9yPjoh9YJMk",
          "description": "North Dakota regenerative farmer Gabe Brown explains how moving from five principles of soil health to a whole-farm management approach allowed him to eliminate purchased fertiliser and chemical inputs over 20 years. Accessible for non-technical audiences; the farm-scale narrative makes abstract soil biology concrete.",
          "icon_tag_fa": "fas fa-layer-group",
          "color_tag": "#92400e",
          "localVideoFilename": "",
          "authors": "Gabe Brown / Understanding Ag",
          "researchReviewItems": [],
          "contentCreatorArchive": "https://www.youtube.com/@understandingag",
          "licence": "Standard YouTube License",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["cover crops", "compaction", "land stewardship"]
        },
        {
          "title": "Haney Soil Health Test — What It Measures and Why",
          "youtubeId": "PENDING",
          "description": "PLACEHOLDER — Curators needed. Target: a 10–20 min explainer covering the H3A extraction, CO₂ burst, and PLFA components of the Haney test; how the Soil Health Score is calculated; and how to interpret results against NRCS benchmarks. Suggested channel: Ward Laboratories or Understanding Ag.",
          "icon_tag_fa": "fas fa-flask",
          "color_tag": "#374151",
          "localVideoFilename": "",
          "authors": "PENDING",
          "researchReviewItems": [],
          "contentCreatorArchive": "",
          "licence": "PENDING",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["Haney test", "soil biology"]
        }
      ],
      "videoTagDirectory": {
        "soil biology": {
          "description": "The living community inside soil — bacteria, fungi, nematodes, protozoa, earthworms — and how management decisions shift the balance between life forms and nutrient cycling pathways.",
          "link": "https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soils/soil-health",
          "linkLabel": "NRCS Soil Health Portal"
        },
        "Haney test": {
          "description": "The Haney Soil Health Test (H₃A extraction + CO₂ burst + PLFA) measures biological, chemical, and physical soil health in a single sample. Provides a Soil Health Score (0–100) comparable across sites and seasons.",
          "link": "https://wardlab.com/tests/haney-soil-health-test/",
          "linkLabel": "Ward Laboratories — Haney Test Guide"
        },
        "aggregate stability": {
          "description": "Aggregate stability measures how well soil particles clump into stable units. High stability means water infiltrates instead of running off; it is one of the fastest indicators of improving soil biology.",
          "link": "",
          "linkLabel": ""
        }
      }
    },
    {
      "uniqueId": "ecology-1",
      "title": "Biodiversity Monitoring & Citizen Science",
      "subtitle": "Standardised field protocols for community-level species tracking",
      "description": "Species richness is a leading indicator of ecosystem health. This subcategory covers the practical methods community groups use to monitor it: iNaturalist observations, eBird point counts, BMWP macroinvertebrate surveys, pollinatorwatch transects, and photo-point permanent plot monitoring. Emphasis is on protocols that produce data usable by researchers, regulators, and land managers — not just records for personal reference.",
      "tags": [
        "iNaturalist",
        "eBird",
        "BMWP",
        "macroinvertebrates",
        "pollinators",
        "species richness",
        "photo monitoring",
        "bioblitz",
        "citizen science",
        "biodiversity"
      ],
      "context": "Works alongside the east-coast citizen science curriculum units (Tick Watch Northeast, Cyanobacteria Watch, Freshwater Phenology Network). Most protocols require a smartphone and basic fieldcraft. The BMWP protocol requires kick-sampling nets (< $50) and a printed identification key; the eBird protocol requires only binoculars and the free app.",
      "videos": [
        {
          "title": "Getting Started with iNaturalist",
          "youtubeId": "VVTTal7CLuY",
          "description": "Official iNaturalist walkthrough covering how to make an observation, how the community ID system works, what makes an observation Research Grade, and how your data flows into the GBIF global biodiversity database. 14 minutes; suitable for first-time users.",
          "icon_tag_fa": "fas fa-camera",
          "color_tag": "#166534",
          "localVideoFilename": "",
          "authors": "iNaturalist",
          "researchReviewItems": [],
          "contentCreatorArchive": "https://www.youtube.com/@iNaturalist",
          "licence": "Standard YouTube License",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["iNaturalist", "citizen science", "biodiversity"]
        },
        {
          "title": "BMWP Macroinvertebrate Sampling — Kick and Sweep Method",
          "youtubeId": "PENDING",
          "description": "PLACEHOLDER — Curators needed. Target: a field demonstration of the 3-minute kick-sample method, white tray sorting, and BMWP score calculation for stream health assessment. Suggested sources: UK Environment Agency, Freshwater Biological Association, or a UK river trust. Should show the difference between a high-scoring (clean) and low-scoring (impaired) stream to make the index meaningful.",
          "icon_tag_fa": "fas fa-water",
          "color_tag": "#1e3a5f",
          "localVideoFilename": "",
          "authors": "PENDING",
          "researchReviewItems": [],
          "contentCreatorArchive": "",
          "licence": "PENDING",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["BMWP", "macroinvertebrates", "citizen science"]
        },
        {
          "title": "eBird — How to Submit a Checklist and Why It Matters",
          "youtubeId": "PENDING",
          "description": "PLACEHOLDER — Curators needed. Target: a 10-min walkthrough of the eBird app, submitting a stationary or travelling count, understanding effort (time, distance, species completeness), and how individual checklists aggregate into the eBird database powering global migration tracking. Suggested source: Cornell Lab of Ornithology official channel.",
          "icon_tag_fa": "fas fa-dove",
          "color_tag": "#4a1942",
          "localVideoFilename": "",
          "authors": "PENDING",
          "researchReviewItems": [],
          "contentCreatorArchive": "",
          "licence": "PENDING",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["eBird", "citizen science", "biodiversity"]
        }
      ],
      "videoTagDirectory": {
        "BMWP": {
          "description": "The Biological Monitoring Working Party (BMWP) score classifies stream health using macroinvertebrate families. Each family has a sensitivity score (1–10); lower scores tolerate pollution, higher scores indicate clean water. Summed over a sample, BMWP provides a rapid biological assessment requiring no chemistry.",
          "link": "https://www.fba.org.uk/",
          "linkLabel": "Freshwater Biological Association — BMWP Resources"
        },
        "iNaturalist": {
          "description": "iNaturalist is a joint initiative of the California Academy of Sciences and the National Geographic Society. Observations that reach Research Grade (community ID agreed to species level by two or more identifiers) are exported to GBIF, the primary global biodiversity data infrastructure.",
          "link": "https://www.inaturalist.org/",
          "linkLabel": "iNaturalist — Make an Observation"
        },
        "macroinvertebrates": {
          "description": "Aquatic macroinvertebrates (insects, crustaceans, worms, molluscs visible without a microscope) are the primary bioindicators used in stream health assessment worldwide. Their presence and absence reflects water quality over months and years, not just at the moment of a chemical sample.",
          "link": "",
          "linkLabel": ""
        }
      }
    },
    {
      "uniqueId": "ecology-2",
      "title": "Watershed Ecology & Water Quality Monitoring",
      "subtitle": "Reading water as a living system — beyond treatment to understanding",
      "description": "The existing Water library area covers treatment and distribution. This subcategory covers the other half: how to understand what a body of water is doing ecologically. Secchi disk transparency, dissolved oxygen, conductivity, nitrate/phosphate field tests, and physical habitat assessment using the EPA Rapid Bioassessment Protocol give communities the vocabulary to notice when their watershed changes — and evidence to take to regulators when it does.",
      "tags": [
        "Secchi disk",
        "dissolved oxygen",
        "conductivity",
        "nitrate",
        "phosphate",
        "HAB",
        "cyanobacteria",
        "rapid bioassessment",
        "watershed",
        "water quality monitoring"
      ],
      "context": "Companion to the Cyanobacteria Watch citizen science curriculum and BMWP macroinvertebrate subcategory above. Requires a Secchi disk (~$15 DIY), a multiparameter water quality meter (~$100–300 for a team), and API or Hach field test kits for nitrate/phosphate. USA: pairs with EPA's Volunteer Monitoring Program. UK: pairs with Environment Agency Citizen Science. Kenya: pairs with NEMA community monitoring programme.",
      "videos": [
        {
          "title": "How to Use a Secchi Disk — Lake Transparency Monitoring",
          "youtubeId": "PENDING",
          "description": "PLACEHOLDER — Curators needed. Target: a clear 5–10 min demonstration of Secchi disk deployment from a boat or dock, recording the disappearance and reappearance depths, calculating the Secchi depth, and recording to a monitoring log in a format compatible with the USA National Lakes Assessment or Secchi Dip-In database.",
          "icon_tag_fa": "fas fa-circle",
          "color_tag": "#0c4a6e",
          "localVideoFilename": "",
          "authors": "PENDING",
          "researchReviewItems": [],
          "contentCreatorArchive": "",
          "licence": "PENDING",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["Secchi disk", "water quality monitoring"]
        },
        {
          "title": "Harmful Algal Blooms — What to Report and How",
          "youtubeId": "PENDING",
          "description": "PLACEHOLDER — Curators needed. Target: identification of HAB visual signatures (surface scum, paint-like texture, blue-green or olive colour, odour), what to document (photos, GPS, date/time), which state or national reporting platforms to submit to (EPA HABs portal, state environmental agency), and health precautions. Should include a non-technical explanation of why HABs occur (nutrient loading + stratification + weather).",
          "icon_tag_fa": "fas fa-biohazard",
          "color_tag": "#365314",
          "localVideoFilename": "",
          "authors": "PENDING",
          "researchReviewItems": [],
          "contentCreatorArchive": "",
          "licence": "PENDING",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["HAB", "cyanobacteria", "water quality monitoring"]
        }
      ],
      "videoTagDirectory": {
        "Secchi disk": {
          "description": "A Secchi disk is a black-and-white weighted disk lowered into water until it disappears, then raised until it reappears. The average of the two depths is the Secchi depth — a simple, reproducible measure of water transparency and an indirect indicator of algal biomass and sediment loading.",
          "link": "https://www.secchidisk.org/",
          "linkLabel": "Secchi Dip-In — Global Citizen Monitoring"
        },
        "HAB": {
          "description": "Harmful algal blooms (HABs) occur when cyanobacteria or algae proliferate rapidly under high-nutrient, warm, stratified conditions. Some species produce cyanotoxins dangerous to humans, pets, and livestock. Early citizen reporting allows health departments to close swimming areas before illness occurs.",
          "link": "https://www.epa.gov/cyanohabs",
          "linkLabel": "EPA — Cyanobacterial HABs"
        },
        "watershed": {
          "description": "A watershed (also catchment or drainage basin) is all the land that drains to a single point — a stream gauge, lake outlet, or river mouth. Everything that happens on the land within a watershed eventually affects the water body at its lowest point. Understanding watershed boundaries is the first step in community water monitoring.",
          "link": "",
          "linkLabel": ""
        }
      }
    },
    {
      "uniqueId": "ecology-3",
      "title": "Climate Adaptation & Resilience Planning",
      "subtitle": "Observing and responding to a changing local climate — practical tools for communities without climatologists",
      "description": "Climate adaptation at community scale is not about global models — it is about noticing what your local indicators are doing and making decisions accordingly. This subcategory covers phenology (recording first flower, first frost, migrant arrival), local weather station networks, tree planting for microclimate management, and the structured adaptive management cycle (observe → assess → adjust → monitor) that allows a community to respond to change rather than just report on it.",
      "tags": [
        "phenology",
        "adaptive management",
        "microclimate",
        "tree planting",
        "weather monitoring",
        "USA-NPN",
        "Nature's Notebook",
        "resilience",
        "carbon",
        "climate observation"
      ],
      "context": "Connects to the Freshwater Phenology Network citizen science curriculum. USA-NPN's Nature's Notebook app is the primary data infrastructure; data submitted by community observers enters the National Phenology Database and is used in seasonal forecasting. No equipment required beyond a smartphone and willingness to observe the same plants and animals on a regular schedule.",
      "videos": [
        {
          "title": "Nature's Notebook — How to Become a Phenology Observer",
          "youtubeId": "PENDING",
          "description": "PLACEHOLDER — Curators needed. Target: the USA-NPN Nature's Notebook onboarding flow — registering a site, choosing a plant or animal to follow, making an observation using the yes/no/unsure phenophase protocol, and understanding how individual observations aggregate into the National Phenology Database. Suggested source: USA National Phenology Network official channel.",
          "icon_tag_fa": "fas fa-leaf",
          "color_tag": "#14532d",
          "localVideoFilename": "",
          "authors": "PENDING",
          "researchReviewItems": [],
          "contentCreatorArchive": "https://www.usanpn.org",
          "licence": "PENDING",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["phenology", "USA-NPN", "Nature's Notebook", "climate observation"]
        },
        {
          "title": "Adaptive Management — A Practical Introduction for Community Groups",
          "youtubeId": "PENDING",
          "description": "PLACEHOLDER — Curators needed. Target: a non-technical explanation of the adaptive management cycle (plan → implement → monitor → evaluate → adjust) applied to a community conservation or land stewardship project. Should include a concrete case study — ideally a riparian restoration or invasive species removal project — showing how monitoring data drove a mid-course adjustment.",
          "icon_tag_fa": "fas fa-sync-alt",
          "color_tag": "#1e3a5f",
          "localVideoFilename": "",
          "authors": "PENDING",
          "researchReviewItems": [],
          "contentCreatorArchive": "",
          "licence": "PENDING",
          "patreon": "",
          "socials": {},
          "fundraiser": "",
          "sponsorPages": [],
          "tags": ["adaptive management", "resilience"]
        }
      ],
      "videoTagDirectory": {
        "phenology": {
          "description": "Phenology is the study of cyclic and seasonal natural phenomena — first leaf, first flower, first frost, bird arrival, amphibian breeding. Because phenological events are tightly linked to temperature, long-term phenology records are among the most sensitive indicators of climate change at local scale.",
          "link": "https://www.usanpn.org/natures_notebook",
          "linkLabel": "USA-NPN — Nature's Notebook"
        },
        "adaptive management": {
          "description": "Adaptive management is a structured, iterative process for managing natural resources under uncertainty. It explicitly designs monitoring into the management plan, uses monitoring data to evaluate whether actions are achieving goals, and adjusts the plan accordingly. First developed for fisheries and later extended to all conservation contexts.",
          "link": "",
          "linkLabel": ""
        },
        "USA-NPN": {
          "description": "The USA National Phenology Network coordinates phenology observations from thousands of citizen observers across the United States. Data submitted via Nature's Notebook is quality-controlled and publicly available in the National Phenology Database at www.usanpn.org/data.",
          "link": "https://www.usanpn.org/",
          "linkLabel": "USA National Phenology Network"
        }
      }
    }
  ]
}
```

---

## What this area covers — and what it doesn't

This proposal covers E8 axes x₁, x₂ (monitoring), x₃, and x₈. Four axes remain absent from the library: x₄ (community governance), x₆ (educational reach), x₇ (economic inclusion), and the governance/coordination layer of x₅.

These four form a natural second new area: **Community Capacity & Knowledge Systems** — covering consensus decision-making methods (sociocracy, consensus mapping), cooperative finance and ROSCA-based saving models, facilitation and train-the-trainer protocols, and indigenous and elder knowledge documentation frameworks. That area will be the subject of a separate proposal.

---

## How to help curate this area

The JSON above has five `"youtubeId": "PENDING"` slots. These are content gaps, not placeholder slots — the topic descriptions are precise enough to find the right video with a short search. If you find a strong candidate:

1. Open a GitHub issue with the label `library-curation` and the subcategory `uniqueId` in the title
2. Include the YouTube URL, a note on whether it requires attribution conditions, and which tag(s) it best serves
3. A coordinator will verify the video, extract the `youtubeId`, and open a PR against `/public/ot6a.json`

Curators who contribute three or more accepted videos to this area receive a **library:contributor** tag in the bounty system and an eco:certificate credit for knowledge curation work.

---

## Technical integration note

Adding this area to the live library requires a single JSON append to `/public/ot6a.json`. The `EcoLibrary.vue` component discovers areas dynamically from that file — no component code changes are needed. To add corresponding icon/color/accent entries in the UI config:

```typescript
// In EcoLibrary.vue — AREA_ICONS, AREA_COLORS, AREA_ACCENTS
AREA_ICONS:   { 'Ecology & Biodiversity': 'mdi-leaf' }
AREA_COLORS:  { 'Ecology & Biodiversity': 'green-5' }
AREA_ACCENTS: { 'Ecology & Biodiversity': '#4ade80' }
```

These three additions are the only code changes required; the tab system and overview grid are already data-driven.

---

*The E8 axis framework is speculative design (see the companion post). The JSON above is a concrete, mergeable contribution to a real file that the EcoLibrary.vue component reads today. Pending curation of the five PENDING video slots, the area is ready to merge.*
