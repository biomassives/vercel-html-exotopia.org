# SPEC_ECOCITY.md — ecocity.com Platform
### Sustainable Infrastructure Education, Workshop Curriculum & Settlement Object Library
*SCD Hub · GPL v3 · Living document — April 2026, blockchain/NFT scope corrected August 2026 (see SPEC.md §26)*

> **Scope correction (August 2026):** earlier drafts of this document described every Ecocity
> settlement object as an on-chain **EcocitySolution NFT**, minted to a wallet as the only
> acquisition path. That contradicted the local-first architecture confirmed in SPEC.md §26:
> settlement objects — Ecocity ones included — are unlocked as free, device-resident /
> Supabase-backed records via the same reward-track mechanism as everything else in the app.
> No wallet, blockchain, or account is required to earn, hold, or display one. An **optional**
> on-chain NFT anchor remains available via pon.ink for anyone who wants a portable, tradeable
> token — it is additive, never the only path. This pass corrects §0, §1.2, §2.2–2.3, §3, and
> §5.1 to match; the educational content in §2.1/§2.4 and the object catalogue in §3.2 were
> never blockchain-dependent and are unchanged.

---

## 0. What ecocity.com Is

**ecocity.com** is the **educational and design infrastructure layer** of the SCD Hub ecosystem. Where pon.ink handles culture and payments and Exotopia provides the cosmic address, ecocity.com provides the **knowledge and physical design models** that give those addresses meaning in the real world.

ecocity.com serves two purposes simultaneously:

1. **Educational platform**: A library of sustainable infrastructure design models, workshop curriculum, and vocational training content — delivered through the SCD Hub's mentor network and verifiable via completion certificates (local-first records, optional on-chain anchor via pon.ink).

2. **Settlement object library**: The source catalogue from which all **Ecocity settlement objects** are derived. Every object that can be placed in an Exotopia settlement — a water filter, a solar array, an aquaponics system, a composting unit — begins as a design specification on ecocity.com, and is unlocked in-settlement the same free, local-first way as every other settlement object (see SPEC.md §21/§26). An optional on-chain NFT anchor is available via pon.ink for anyone who wants a portable, tradeable credential; it is not required to earn, hold, or display the object.

The platform makes the connection explicit: learning about a water filtration system in an ecocity module is the same act as earning the right to place a water filter object in your virtual settlement. Real knowledge → virtual reward → real-world replication.

---

## 1. Platform Mission and Design Principles

### 1.1 Who ecocity.com Serves

| Audience | How they use ecocity.com |
|---|---|
| **Community participants** | Complete vocational modules to earn credentials; browse designs for their community context |
| **Facilitators and educators** | Deliver workshop curriculum; track participant completion; issue certifications |
| **Community builders and administrators** | Find design specifications for funded projects (e.g., Mpeketoni recycling center); link proposals to ecocity standards |
| **Visual artists and designers** | Source reference material for Exotopia settlement aesthetics; submit community design variations |
| **Funders and grant reviewers** | Access open data on module completion, field deployment, and community impact |

### 1.2 Design Principles

- **Design for where people are.** Every design specification must include a low-resource variant suitable for construction in Lamu, Nairobi, and similar contexts. Not every solution needs grid electricity or imported materials.
- **Curriculum follows the work.** Educational modules are sequenced around what communities are actually doing — if a community is building a recycling center, the relevant modules are water/waste management, circular resource economics, and composting. Theory follows practice.
- **Credentials are portable.** Module completion certificates are local-first, server-issued records — the same certificate mechanism used everywhere else in the app (SPEC.md §21/§24) — with a durable, shareable reference. They can be presented to employers, funders, and NGOs independent of the SCD Hub platform. An optional on-chain anchor via pon.ink is available for anyone who wants one. No platform lock-in on credentials, on-chain or off.
- **Open specifications.** All design documents are GPL v3. Community members can adapt, improve, and redistribute them. The SCD Hub does not own the designs — it curates and maintains them.
- **Earth first.** The virtual (Exotopia settlement objects) is derivative of the real (ecocity design specs). The platform does not celebrate building virtual water filters — it celebrates building real ones, with the virtual as a record and reward mechanism.

---

## 2. Educational Content System

### 2.1 Module Categories

Modules are organised around the five Ecocity settlement object categories, which map directly to settlement object types in Exotopia:

| Category | Module topics | Settlement object examples |
|---|---|---|
| **WATSAN** (water and sanitation) | Water quality testing, biosand filters, rainwater harvesting, composting toilets, waste mapping | Water filter, rainwater collector, composting unit, latrine system |
| **ENERGY** | Solar PV basics, micro-hydro, biogas from organic waste, energy efficiency audit | Solar array, biogas digester, micro-hydro turbine, LED lighting system |
| **SHELTER** | Compressed earth block construction, retrofitting for climate resilience, passive cooling, green roofing | Earthen block structure, green roof module, ventilation tower |
| **HEALTHCARE** | Community health worker protocols, water quality interpretation, health data logging, herbal medicine integration | Health post, water quality test station, herb garden |
| **FOOD** | Aquaponics system design, permaculture principles, climate-adapted crop selection, market linkage | Aquaponics tank, food garden bed, seed bank, solar dryer |

Each module includes:
- **Text content**: accessible reading level (Grade 8 English; Swahili versions in development)
- **Visual diagrams**: construction drawings, system schematics, material lists
- **Video content** (optional): field footage where available
- **Assessment**: 5–10 questions per module; passing score ≥ 70%
- **Field connection**: link to the relevant eco-ops check-in activity types (e.g., WATSAN module links to `wqMap` and `garbageMap` check-in types)

### 2.2 Module Completion → Certification

When a participant completes a module (passing the assessment), ecocity.com issues a completion certificate — a local-first, server-issued record, the same mechanism used for every other Exotopia certificate:

```
Certificate record:
  type:                  "ecocity_module_completion"
  module_id:             "watsan-biosand-filter-v2"
  module_name:           "Biosand Filter Construction and Water Quality Testing"
  category:              "WATSAN"
  participant_id:        [user's ecosystem ID]
  mentor_id:              [facilitator who ran the session, if applicable]
  completed_at:          [timestamp]
  score:                 82
  pdf_ref:               [certificate PDF — locally hosted, optionally pinned to IPFS]
  optional_chain_anchor: [pon.ink NFT reference, only if the participant chose to mint one]
```

The certificate is:
- Linked from the participant's Exotopia file cabinet (Certifications drawer) — no wallet or pon.ink account required
- Readable by the Robot Mule corpus (eco-ops summary includes certifications earned)
- Portable: a permanent reference usable in job applications or funding proposals, optionally pinned to IPFS for durability
- Optionally also displayed in the participant's pon.ink NFT portfolio, if they chose to mint the optional on-chain anchor

### 2.3 Workshop Delivery System

Modules are designed for **facilitated workshop delivery** — not solely for self-paced online completion. The SCD Hub model assumes a human facilitator is present, either in-person or via remote video.

**Workshop flow:**

```
1. FACILITATOR SCHEDULES WORKSHOP
   Creates event in pon.ink (event type: educational_airdrop or virtual_workshop)
   Selects module from ecocity.com curriculum library
   Sets attendance limit and POAP supply

2. PARTICIPANTS ENROLL
   Via pon.ink event registration (link, SMS, or QR at live event)

3. WORKSHOP RUNS
   Facilitator delivers module content (slides, video, discussion)
   Participants may be in-person, remote, or in an Exotopia virtual settlement
   Facilitator can walk participants to the relevant settlement interaction zone
   (e.g., the water feature zone in the settlement maps to the WATSAN module content)

4. ASSESSMENT
   Participants complete the 5–10 question assessment on their mobile browser
   Passing participants automatically trigger:
     · Completion certificate issued (local-first record, see §2.2)
     · The matching Ecocity settlement object unlocked in their Exotopia settlement
     · Optional, if configured: POAP minted for attendance, pon.ink airdrop
       bundle dispatched, on-chain certificate anchor minted

5. POST-WORKSHOP
   Facilitator receives participant completion list with scores
   Each completer's settlement gains the corresponding Ecocity settlement object
   Session recorded in pon.ink event archive with participant list + IPFS proof
```

### 2.4 Curriculum Alignment with Community Projects

Modules are not abstract — each module is explicitly connected to one or more active SCD Hub community projects. This makes the educational content directly relevant to participants' lives.

**Current alignments:**

| Community project | Relevant modules | Status |
|---|---|---|
| Mpeketoni Recycling Center (Uni-Kibaoni-Peace-Youth-SHG, Lamu) | Waste Mapping, Composting Systems, Circular Resource Economics, Water Quality Testing | Modules needed; project context documented |
| Pain in the Ghetto (OT Kulcha, studio) | Cultural Preservation (non-WATSAN module), Sound Recording Basics | Cultural module in development |
| Fana Ka street media (Nairobi) | Community Media Production, Digital Rights Basics | Media module planned |
| USA Artists (Glipish DJ, _am_lunchmeat) | Sound NFT Production, Visual Art Documentation | Modules to be developed with artists as co-authors |

---

## 3. Ecocity Settlement Object Library

### 3.1 What an Ecocity Settlement Object Is

An **Ecocity settlement object** is both a collectible virtual object (displayable in an Exotopia settlement) and a certified proof that a design specification was learned, built, or supported. It is the intersection of the virtual and the real. Earning one requires no wallet, blockchain, or account — it is unlocked by the same local-first reward mechanism as every other settlement object (SPEC.md §21). An optional NFT anchor is available via pon.ink for participants who want a portable, tradeable on-chain token; that anchor is not the object itself, and the object works identically without it.

Each Ecocity settlement object has:
- **Visual asset**: a voxel-vector model for display in the Exotopia settlement dome — a blocky base built with the same voxel builder used elsewhere, layered with smooth vector-path elements (domes, tanks, pipes) for the curved forms these designs need. A full authored GLTF model (simplified for mobile — < 5,000 triangles) can replace the voxel-vector preset later via the art-asset pipeline without changing how the object is earned or displayed.
- **Metadata**: category, design version, materials specification reference, ecocity.com module link — stored with the settlement record; optionally mirrored into NFT metadata if the participant mints the optional pon.ink anchor
- **Impact metrics**: estimated CO₂ offset, water volume processed, energy generated, or people served per year (from the design spec data)
- **Origin path**: how this object was acquired (earned via reward track / unlocked via a facilitated workshop) and the module completion or eco-ops milestone that triggered it

### 3.2 Object Catalogue — Current and Planned

**WATSAN:**

| Object | Visual | Impact metric |
|---|---|---|
| Biosand filter | Cylindrical filter vessel with sand layers visible | 200L/day clean water per filter |
| Rainwater harvester | Roof catchment + storage tank | Up to 50,000L/year per 100m² roof |
| Composting unit | Three-bay compost system with aeration pipes | 500kg compost/year from household waste |
| Waste map node | Data beacon with map pin | Network node for circular waste tracking |
| Latrine system | Ecological sanitation unit | Serves 10 households; 100% waste-to-resource |

**ENERGY:**

| Object | Visual | Impact metric |
|---|---|---|
| Solar array | 4-panel rooftop system | 1.5 kWh/day; offsets 180kg CO₂/year |
| Biogas digester | Underground dome reactor | 2–4 hours cooking gas/day per household |
| Micro-hydro turbine | Stream-mounted turbine with penstock | 500W continuous (site-dependent) |
| LED lighting cluster | 6-lamp distribution system | 80% energy reduction vs kerosene |

**SHELTER:**

| Object | Visual | Impact metric |
|---|---|---|
| Compressed earth block structure | Modular wall system from pressed earth | No cement required; local materials |
| Green roof module | Planted roof section with irrigation layer | Reduces roof temperature 8–12°C |
| Ventilation tower | Passive cooling stack | Reduces indoor temperature 4–6°C |

**HEALTHCARE:**

| Object | Visual | Impact metric |
|---|---|---|
| Health post | Small covered structure with basic equipment | Serves 50 households for primary screening |
| Water quality test station | Portable testing kit + data terminal | Generates Water Quality Certs (Supabase ledger record; optional on-chain anchor) |
| Herb garden | Medicinal plant cultivation beds | 15 species; reduces OTC medicine dependence |

**FOOD:**

| Object | Visual | Impact metric |
|---|---|---|
| Aquaponics tank | Fish + plant integrated system | 20kg fish + 40kg vegetables per year per unit |
| Food garden bed | Raised bed with climate-adapted crops | 30kg yield per season per 4m² bed |
| Seed bank | Climate-controlled seed storage pod | Preserves 50+ varieties; community seed sovereignty |
| Solar dryer | Parabolic concentrator + drying rack | Extends food shelf life 6–12 months |

### 3.3 Object Acquisition Pipeline

```
1. Design specification created by ecocity.com team + community input
2. 3D model created: a voxel-vector preset (voxel grid + vector-path curves,
   see settlement-items.ts) for MVP; a full GLTF model (< 5,000 triangles,
   UV-mapped for planet color schema overlay) can replace it later without
   changing the acquisition path
3. Settlement-object metadata defined: category, version, impact metrics,
   asset reference — the same catalogue shape as every other settlement item
4. Module written: curriculum content linking the design to the vocational skill
5. Acquisition path defined:
   a. Earned: reward-track completion (e.g., a PFAS/WATSAN check-in milestone
      → water filter) — the same local-first mechanism as every other
      settlement object, no wallet required
   b. Facilitated: workshop completion (facilitator runs the module; passing
      participants are unlocked the object directly, same mechanism as (a))
   c. Optional on-chain anchor: participants who want a portable, tradeable
      token can additionally mint one via pon.ink — additive, never the
      only path
6. Object appears in the settlement the moment it's unlocked (a Supabase
   settlement_items record) — no wallet, minting step, or NFT required
7. Optional: if the participant chose the on-chain anchor in step 5c, it
   also appears in their pon.ink NFT portfolio
```

This pipeline creates a direct connection: the design on ecocity.com, the module that teaches it, the eco-ops field work that validates it, and the virtual object that celebrates it are all one thread.

---

## 4. Site Features — Current State and Improvements Needed

### 4.1 Current Site Features (ecocity.com)

The current ecocity.com site is primarily informational — a design library and educational reference. Key gaps:

| Feature | Status |
|---|---|
| Design specification library (WATSAN, ENERGY, SHELTER, HEALTHCARE, FOOD) | Exists in some form; needs digital structuring and categorisation |
| Module content (text + diagrams) | Partially written; not yet delivered through pon.ink event system |
| Assessment system | Not yet implemented |
| On-chain certification minting | Not yet connected |
| Workshop scheduling (pon.ink integration) | Not yet connected |
| Ecocity settlement object catalogue | Designed in metadata schema; voxel-vector presets in progress (see settlement-items.ts), full authored 3D models not yet created |
| 3D settlement object integration (Exotopia) | Specced; not yet deployed |
| Community project case studies | Some documentation exists; not yet on-site |
| Impact data dashboard | Not yet built |

### 4.2 Improvements Needed — Prioritised

#### Priority 1 — Module Delivery Integration with pon.ink (3 days)
The most impactful immediate improvement: connect ecocity.com module completion to the pon.ink event system so that workshop facilitators can schedule a module delivery from within pon.ink, and completion automatically triggers the certificate + Ecocity settlement object unlock (with an optional on-chain NFT anchor for participants who want one).

**Required:**
- Module catalogue API endpoint (`GET /api/modules` → list with ID, title, category, settlement object linked)
- Completion webhook (`POST /api/module/complete` ← called by pon.ink after assessment score confirmed)
- Assessment UI: 5–10 question form embedded in the pon.ink event flow or ecocity.com module page

#### Priority 2 — Ecocity Settlement Object 3D Model Creation (ongoing)
Two tiers: an MVP voxel-vector preset (voxel grid + vector-path curves, built with the existing in-app voxel builder pipeline — see settlement-items.ts) gets an object rendering and reward-unlockable quickly; a full authored GLTF model can replace any preset later without changing how the object is earned. Full models must be < 5,000 triangles and UV-mapped to accept the planetary color schema overlay from Exotopia (see SPEC.md §18.2).

Suggested toolchain for the full-model tier: Blender → GLTF export → Draco compression → Exotopia Three.js loader.

This is an ongoing art/design task, not a single sprint item. Start with the 5 WATSAN objects as they are the most closely tied to active community projects (Mpeketoni recycling center).

#### Priority 3 — Design Specification Digital Library (2 days)
Structure the existing design content into a browsable library with:
- Category filters (WATSAN / ENERGY / SHELTER / HEALTHCARE / FOOD)
- Each spec page: description, material list, construction notes, impact metrics, linked module, linked settlement object (+ optional NFT anchor reference if minted)
- Download link for PDF version (IPFS-hosted, permanent)
- "Teach this module" button → routes to pon.ink event creation pre-filled with this module

#### Priority 4 — Community Project Case Studies (2 days)
Dedicated pages for each active project:
- **Mpeketoni Recycling Center**: project brief, target community (women + youth in Mkunumbi, Hongwe, Bahari ward), funding status, design specifications being applied, eco-ops data collected to date
- **OT Kulcha studio**: project context, "Pain in the Ghetto" collaboration, cultural modules in use
- **Fana Ka**: event history, rap battle format, digital rights curriculum planned

These pages serve double duty: community storytelling for new participants, and grant application evidence for funders.

#### Priority 5 — Impact Dashboard (2 days)
Public-facing `/impact` page (mirroring the pon.ink impact dashboard, with the educational lens):
- Module completions by category and region
- Certifications issued (count + optional on-chain anchor links)
- Ecocity settlement objects unlocked (count by type; optional on-chain anchors minted, if tracked separately)
- Community project milestone progress (% complete for Mpeketoni, etc.)
- Aggregate eco-ops field data linked from Arweave

#### Priority 6 — Swahili Localisation (ongoing)
All module content must be available in Swahili for the Lamu and Nairobi communities. This is not a technical task — it requires translation and community review. The translation pipeline should be established before module content is finalised in English, so Swahili can be developed in parallel rather than as a retrofit.

Priority language order: Swahili, then Patois (for OT Kulcha and Fana Ka Jamaican/Caribbean connections), then additional languages as community need arises.

---

## 5. Exotopia Settlement Integration

### 5.1 How ecocity Objects Appear in Settlements

When a user has unlocked one or more Ecocity settlement objects (via a completed reward track or facilitated workshop — see §3.3), the corresponding 3D objects appear in their Level 5 settlement dome view automatically. The settlement renderer reads the user's unlocked settlement-items record (Supabase, no wallet or blockchain query involved) and places each object at a procedurally determined position within the dome (outside the central walking path but within the dome radius).

Object placement rules:
- WATSAN objects cluster near the water feature zone
- ENERGY objects appear on the outer dome wall (rooftop mounting)
- FOOD objects appear in the garden area adjacent to the water feature
- SHELTER objects appear as structures within the dome perimeter
- HEALTHCARE objects appear near the library building

Users can **reposition objects** using the settlement customisation interface (drag-and-drop grid, position stored in Supabase).

### 5.2 Settlement Library Building

The **library building** in the settlement (Section 17.9 of SPEC.md) is directly connected to ecocity.com. When a user approaches the library building:
- The settlement interaction zone panel opens
- Displays: modules completed by the user + modules available for this settlement's category
- "Start module" button routes to ecocity.com module page (or embeds it in-settlement for Phase 3)
- Completed modules shown with green completion badge and certificate link

The library building thus becomes a portal into ecocity.com's curriculum — the virtual settlement is the access point for real educational content.

### 5.3 Water Feature Data Panel

The **water feature zone** in the settlement (Section 17.9 of SPEC.md) connects to live eco-ops field data. When a user approaches the water feature:
- Panel shows the user's water quality check-in history (if any)
- For Uni-Kibaoni members: shows the Lamu County water quality dataset from the field network
- Link to the Water Quality Certification for each reading (Supabase ledger record; optional on-chain anchor via pon.ink)
- "Run a water quality reading" button → routes to the eco-ops check-in form with `wqMap` pre-selected

The water feature is a live data terminal, not decoration. It is the physical representation of WATSAN work in the virtual space.

---

## 6. User Stories — ecocity.com Specific

### 6.1 Uni-Kibaoni Field Worker (Mpeketoni, Lamu)
> *As a field worker submitting water quality readings for the Mpeketoni recycling center proposal, I want to complete the WATSAN biosand filter module and receive a certificate that I can present to the county government as evidence of my technical training — so that my participation in the SCD Hub network qualifies me for formal project roles and helps the community win the grant.*

### 6.2 Facilitator Running an Aquaponics Workshop
> *As a facilitator running the Food Aquaponics module at a Fana Ka settlement workshop in Nairobi, I want to schedule the session in pon.ink, deliver the module content using ecocity.com's diagrams and assessment, and automatically unlock the Aquaponics Tank settlement object for participants who pass the assessment — so that the learning has a permanent, visible result in each participant's virtual settlement.*

### 6.3 Community Builder (Mpeketoni Recycling Center Proposal)
> *As the lead community builder for the Uni-Kibaoni-Peace-Youth-SHG project, I want to reference the ecocity.com design specifications for composting systems and water quality testing stations in the project proposal — so that funders can see that the infrastructure plan is based on documented, tested designs, and that the community has the training (certificates) to implement them.*

### 6.4 Visual Artist Seeking Reference
> *As a visual artist creating paintings and Exotopia settlement designs, I want to browse the ecocity.com object catalogue to understand what settlement objects look like and what they represent — so that my paintings and NFT art can visually reference real sustainable infrastructure and give the work cultural and educational depth.*

---

## 7. Open Questions for ecocity.com

- **3D model creation process:** Who creates the GLTF models for the settlement objects? This requires a 3D modeller with knowledge of Blender and Three.js requirements. Is this done in-house, contracted, or community-contributed?
- **Module authorship:** Who writes and maintains the curriculum content? The SCD Hub team has domain expertise, but module writing is time-intensive. A community module submission process (with SCD Hub editorial review) may be needed to scale.
- **Assessment security:** Assessments are currently planned as simple multiple-choice. Is there a risk of participants sharing answers? For low-stakes certifications (workshop attendance) this is acceptable. For certifications used in formal employment contexts, a more rigorous approach may be needed.
- **IP of design specifications:** All designs are GPL v3, but some reference proprietary third-party designs (e.g., specific commercial solar products). The licence boundary needs to be clearly documented.
- **Offline delivery:** Field communities in Lamu may not have reliable internet during workshops. Modules need an offline-capable format (downloadable PDF or packaged Progressive Web App). This is not yet designed.
- **ecocity.com domain and hosting:** Is ecocity.com a separate deployment from pon.ink and exotopia.org? What is the current hosting arrangement? This affects how the module completion API is structured.

---

*Cross-reference: `SPEC.md` (Exotopia — settlement objects §5.2, library zone §17.9) · `SPEC_PON_INK.md` (airdrop campaigns §2.3, event management §2.5)*
*GPL v3 · SCD Hub · Community owns its data*
