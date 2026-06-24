# SPEC_ECOCITY.md — ecocity.com Platform
### Sustainable Infrastructure Education, Workshop Curriculum & Settlement Object Library
*SCD Hub · GPL v3 · Living document — April 2026*

---

## 0. What ecocity.com Is

**ecocity.com** is the **educational and design infrastructure layer** of the SCD Hub ecosystem. Where pon.ink handles culture and payments and Exotopia provides the cosmic address, ecocity.com provides the **knowledge and physical design models** that give those addresses meaning in the real world.

ecocity.com serves two purposes simultaneously:

1. **Educational platform**: A library of sustainable infrastructure design models, workshop curriculum, and vocational training content — delivered through the SCD Hub's mentor network and verifiable via on-chain completion certificates.

2. **Settlement object library**: The source catalogue from which all **EcocitySolution NFTs** are derived. Every object that can be placed in an Exotopia settlement — a water filter, a solar array, an aquaponics system, a composting unit — begins as a design specification on ecocity.com.

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
- **Credentials are portable.** Module completion certificates are minted as NFTs. They can be presented to employers, funders, and NGOs independent of the SCD Hub platform. No platform lock-in on credentials.
- **Open specifications.** All design documents are GPL v3. Community members can adapt, improve, and redistribute them. The SCD Hub does not own the designs — it curates and maintains them.
- **Earth first.** The virtual (Exotopia settlement objects) is derivative of the real (ecocity design specs). The platform does not celebrate building virtual water filters — it celebrates building real ones, with the virtual as a record and reward mechanism.

---

## 2. Educational Content System

### 2.1 Module Categories

Modules are organised around the five EcocitySolution NFT categories, which map directly to settlement object types in Exotopia:

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

### 2.2 Module Completion → On-Chain Certification

When a participant completes a module (passing the assessment), ecocity.com mints an on-chain completion certificate:

```
Certificate NFT:
  type:           "ecocity_module_completion"
  module_id:      "watsan-biosand-filter-v2"
  module_name:    "Biosand Filter Construction and Water Quality Testing"
  category:       "WATSAN"
  participant_id: [user's ecosystem ID]
  mentor_id:      [facilitator who ran the session, if applicable]
  completed_at:   [timestamp]
  score:          82
  chain:          Polygon
  ipfs_cid:       [certificate PDF on IPFS]
```

The certificate is:
- Displayed in the participant's pon.ink NFT portfolio
- Linked from the participant's Exotopia file cabinet (Certifications drawer)
- Readable by the Robot Mule corpus (eco-ops summary includes certifications earned)
- Portable: the IPFS link is a permanent reference usable in job applications or funding proposals

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
     · On-chain certificate minted
     · EcocitySolution NFT dispatched (the relevant settlement object)
     · POAP minted for attendance
     · pon.ink airdrop bundle dispatched if configured

5. POST-WORKSHOP
   Facilitator receives participant completion list with scores
   Each completer's settlement gains the corresponding EcocitySolution object
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

## 3. EcocitySolution NFT Library

### 3.1 What an EcocitySolution NFT Is

An **EcocitySolution NFT** is both a collectible virtual object (displayable in an Exotopia settlement) and a certified proof that a design specification was learned, built, or supported. It is the intersection of the virtual and the real.

Each EcocitySolution NFT has:
- **Visual asset**: a 3D-renderable GLTF model for display in the Exotopia settlement dome (simplified for mobile — < 5,000 triangles)
- **On-chain metadata**: category, design version, materials specification reference, ecocity.com module link
- **Impact metrics**: estimated CO₂ offset, water volume processed, energy generated, or people served per year (from the design spec data)
- **Origin path**: how this NFT was acquired (earned / airdropped / purchased) and the module completion or eco-ops milestone that triggered it

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
| Water quality test station | Portable testing kit + data terminal | Generates on-chain Water Quality Certs |
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
2. 3D model created: GLTF, < 5,000 triangles, UV-mapped for planet color schema overlay
3. NFT metadata schema defined: category, version, impact metrics, IPFS asset CID
4. Module written: curriculum content linking the design to the vocational skill
5. Acquisition path defined:
   a. Earned: eco-ops activity milestone (e.g., 10 water quality readings → water filter)
   b. Airdrop: workshop completion (facilitator deploys the campaign in pon.ink)
   c. Purchased: listed in pon.ink aftermarket
6. Smart contract (Solana Bubblegum cNFT) deployed with correct metadata
7. Object appears in settlement when NFT lands in user's wallet
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
| EcocitySolution NFT catalogue | Designed in metadata schema; 3D models not yet created |
| 3D settlement object integration (Exotopia) | Specced; not yet deployed |
| Community project case studies | Some documentation exists; not yet on-site |
| Impact data dashboard | Not yet built |

### 4.2 Improvements Needed — Prioritised

#### Priority 1 — Module Delivery Integration with pon.ink (3 days)
The most impactful immediate improvement: connect ecocity.com module completion to the pon.ink event system so that workshop facilitators can schedule a module delivery from within pon.ink, and completion automatically triggers the certificate + EcocitySolution NFT dispatch.

**Required:**
- Module catalogue API endpoint (`GET /api/modules` → list with ID, title, category, NFT object linked)
- Completion webhook (`POST /api/module/complete` ← called by pon.ink after assessment score confirmed)
- Assessment UI: 5–10 question form embedded in the pon.ink event flow or ecocity.com module page

#### Priority 2 — EcocitySolution 3D Model Creation (ongoing)
Create GLTF models for the 15 highest-priority settlement objects (the catalogue in Section 3.2). Models must be < 5,000 triangles and UV-mapped to accept the planetary color schema overlay from Exotopia (see SPEC.md §18.2).

Suggested toolchain: Blender → GLTF export → Draco compression → Exotopia Three.js loader.

This is an ongoing art/design task, not a single sprint item. Start with the 5 WATSAN objects as they are the most closely tied to active community projects (Mpeketoni recycling center).

#### Priority 3 — Design Specification Digital Library (2 days)
Structure the existing design content into a browsable library with:
- Category filters (WATSAN / ENERGY / SHELTER / HEALTHCARE / FOOD)
- Each spec page: description, material list, construction notes, impact metrics, linked module, linked NFT
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
- Certifications issued (count + on-chain links)
- EcocitySolution NFTs in circulation (count by type)
- Community project milestone progress (% complete for Mpeketoni, etc.)
- Aggregate eco-ops field data linked from Arweave

#### Priority 6 — Swahili Localisation (ongoing)
All module content must be available in Swahili for the Lamu and Nairobi communities. This is not a technical task — it requires translation and community review. The translation pipeline should be established before module content is finalised in English, so Swahili can be developed in parallel rather than as a retrofit.

Priority language order: Swahili, then Patois (for OT Kulcha and Fana Ka Jamaican/Caribbean connections), then additional languages as community need arises.

---

## 5. Exotopia Settlement Integration

### 5.1 How ecocity Objects Appear in Settlements

When a user owns one or more EcocitySolution NFTs, the corresponding 3D objects appear in their Level 5 settlement dome view automatically. The settlement renderer queries the user's wallet for EcocitySolution NFTs and places each object at a procedurally determined position within the dome (outside the central walking path but within the dome radius).

Object placement rules:
- WATSAN objects cluster near the water feature zone
- ENERGY objects appear on the outer dome wall (rooftop mounting)
- FOOD objects appear in the garden area adjacent to the water feature
- SHELTER objects appear as structures within the dome perimeter
- HEALTHCARE objects appear near the library building

Users can **reposition objects** using the settlement customisation interface (drag-and-drop grid, non-NFT preference stored in Supabase).

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
- Link to the on-chain Water Quality Certification for each reading
- "Run a water quality reading" button → routes to the eco-ops check-in form with `wqMap` pre-selected

The water feature is a live data terminal, not decoration. It is the physical representation of WATSAN work in the virtual space.

---

## 6. User Stories — ecocity.com Specific

### 6.1 Uni-Kibaoni Field Worker (Mpeketoni, Lamu)
> *As a field worker submitting water quality readings for the Mpeketoni recycling center proposal, I want to complete the WATSAN biosand filter module and receive an on-chain certificate that I can present to the county government as evidence of my technical training — so that my participation in the SCD Hub network qualifies me for formal project roles and helps the community win the grant.*

### 6.2 Facilitator Running an Aquaponics Workshop
> *As a facilitator running the Food Aquaponics module at a Fana Ka settlement workshop in Nairobi, I want to schedule the session in pon.ink, deliver the module content using ecocity.com's diagrams and assessment, and automatically dispatch EcocitySolution Aquaponics Tank NFTs to participants who pass the assessment — so that the learning has a permanent, visible result in each participant's virtual settlement.*

### 6.3 Community Builder (Mpeketoni Recycling Center Proposal)
> *As the lead community builder for the Uni-Kibaoni-Peace-Youth-SHG project, I want to reference the ecocity.com design specifications for composting systems and water quality testing stations in the project proposal — so that funders can see that the infrastructure plan is based on documented, tested designs, and that the community has the training (on-chain certificates) to implement them.*

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
