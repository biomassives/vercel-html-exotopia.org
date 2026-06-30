# SPEC — Online Learning Curriculum: WATSAN, Solar, and Citizen Science

**Platform:** SCD Hub / Exotopia.org / ApproVideo  
**Status:** Draft v1 — June 2026  
**Depends on:** [SPEC_DOMAIN_COMPETENCY.md](SPEC_DOMAIN_COMPETENCY.md), [compliance/POLYNOMICS-CONTRIBUTION.md §3F](compliance/POLYNOMICS-CONTRIBUTION.md)  
**Certificate output:** `learn:foundation`, `learn:practitioner`, `learn:advanced` in `water`, `energy`, and `biodiversity` domains

---

## Overview

This spec defines the online learning and certification system for three priority curriculum tracks: **WATSAN** (water and sanitation), **Solar** (solar energy systems), and **Citizen Science** (ecological observation and monitoring). These are the first three tracks to be built on the ApproVideo / SCD Hub learning platform.

Each track uses four interlocking pedagogical methods:

| Method | Purpose | Best for |
|---|---|---|
| **Flashcard decks** | Vocabulary, recall, visual identification | Terminology, equipment parts, species ID, safety sequences |
| **Time-sequence curriculum** | Structured knowledge progression | Building complete understanding; prerequisite gating |
| **Quiz** | Formative and summative assessment; certification gate | Verifying comprehension; enabling certificate issuance |
| **Peer art method** | Creative expression as evidence of understanding | Deep comprehension; low-literacy contexts; cultural adaptation; portfolio building |

These methods work together in a defined sequence within each module. They are not alternatives — a learner moves through all four within each unit. The combination addresses different cognitive modes and is designed to be effective across literacy levels, learning styles, and connectivity constraints.

---

## The four methods — detailed specification

### Method A — Flashcard decks

**Format:** SVG-based card pairs. Each card is a valid SVG file: front face (question/image), back face (answer + context). Cards are presented in a web interface or downloadable as a ZIP for offline use. The deck format is open (JSON manifest + SVG assets) so decks can be forked, translated, and extended by community partners.

**Deck structure:**

```
deck/
  manifest.json          — title, domain, language, card count, version
  cards/
    001-front.svg        — question or image
    001-back.svg         — answer, explanation, field tip
    002-front.svg
    002-back.svg
    ...
```

**Interaction model:** The learner sees the front face, attempts to recall the answer, then flips to see the back. They mark: *Got it* / *Nearly* / *Again*. A simple SM-2 spaced repetition scheduler determines when each card reappears. Learned cards resurface after 1 day, then 3 days, then 7, then 21. Cards marked *Again* reappear within the same session.

**Card types within a deck:**

| Type | Front | Back |
|---|---|---|
| Term → Definition | Word or acronym | Plain-language definition + diagram |
| Image → Name | Photograph of equipment/organism/condition | Species/equipment name + key identifying features |
| Process step | "Step 3 of making a biosand filter is…?" | Correct answer + illustration of the step |
| Hazard recognition | Photo of a condition (cloudy water, damaged PV wire, etc.) | Hazard name + correct response |
| Field calculation | "A household uses 15L/day. How many days will a 200L tank last?" | Answer + working + rule of thumb |
| True/False | Statement about a concept or practice | Correct/incorrect + explanation |
| Peer art recall | Thumbnail of a peer's artwork from the module | Description of the ecological concept it represents |

**Offline capability:** Full decks downloadable as ZIP. Progress syncs on reconnection. Critical for low-connectivity field contexts.

**Deck building as peer activity:** Advanced and Facilitator learners create new flashcard decks as a contribution activity. A high-quality community-created deck earns a `contrib:docs` certificate. Decks are peer-reviewed before being added to the library.

---

### Method B — Time-sequence curriculum

The time-sequence curriculum is a visual map of the learning journey through a domain. It shows:
- All modules in the track, in order
- Prerequisite relationships between modules (which must be completed before which)
- Estimated time per module
- Which method(s) are used in each module (flashcard / quiz / peer art)
- Where certificate checkpoints fall

**Visual format:** A horizontal timeline with branching paths where the curriculum splits into specialisms. Each node is a module. Completed nodes are filled; current node is highlighted; locked nodes are greyed out. The map is rendered as an SVG in the platform UI and embedded in the printed curriculum guide.

**Module anatomy:** Every module has the same structure:

```
MODULE [number] — [Title]
Domain: [domain code]    Level: [foundation/practitioner/advanced]
Estimated time: [N] hours (self-paced) / [N] hours (facilitated group)
Prerequisite: [module number or "none"]

OBJECTIVES (3–5 specific, observable outcomes)

CONTENT (text + embedded ApproVideo clips where available)

FLASHCARD DECK (link to relevant deck; learner completes before quiz)

FIELD ACTIVITY (what the learner does in the real world to demonstrate the learning)

PEER ART TASK (creative assignment that consolidates the module — see Method D)

QUIZ (5–10 questions gating progression to next module)

CERTIFICATE CHECKPOINT (yes/no — if yes, which certificate is issued on passing)
```

**Pacing:** Modules are self-paced with no time minimum. A module can be completed in a single session or spread over weeks — the platform tracks progress. For facilitated group delivery, each module has a recommended group session time (usually 2–3 hours) and a facilitator guide.

---

### Method C — Quiz

Quizzes serve two roles: **formative** (within a module, to check understanding and guide re-study) and **summative** (at certificate checkpoints, to formally verify competency).

**Formative quiz:** 3–5 questions embedded mid-module. Low stakes. No pass threshold. Incorrect answers reveal the correct answer with an explanation and link to the relevant flashcard. Not recorded in the certificate record.

**Summative quiz:** 10–20 questions at module end. Pass threshold: 75% (Foundation), 80% (Practitioner), 85% (Advanced). Unlimited attempts. Different question variants drawn from a question bank on each attempt (prevents rote memorisation of a specific question set). Passed summative quizzes are recorded and contribute to the certificate checkpoint.

**Question types:**

| Type | Description | Used for |
|---|---|---|
| Multiple choice (4 options) | One correct answer; distractors are plausible | Terminology, procedures, safety |
| Image identification | Photograph shown; learner selects correct label from 4 options | Species, equipment condition, water quality signs |
| Sequencing | Drag steps into correct order | Construction sequences, treatment processes, safety procedures |
| Scenario | Short description of a real situation; learner selects best response | Decision-making, problem-solving |
| Calculation | Numeric answer with tolerance (e.g., ±5%) | Sizing calculations, measurements |
| Short answer | Free text; assessed by facilitator or peer (not auto-graded) | Reflection, context-specific knowledge |
| Peer art interpretation | Shown a peer's artwork; asked to describe the ecological concept it represents | Used at Practitioner level and above |

**Accessibility:** All image questions have alt text. All questions are available in audio format (text-to-speech, or recorded by a community voice for local language versions). Calculation questions can be answered on paper and photographed if the platform UI is inaccessible.

**Certificate gate:** A summative quiz pass at a certificate checkpoint triggers the certificate issuance flow — the learner provides their wallet address (or creates one), the platform generates the SVG certificate, and the on-chain record is minted. The quiz score, question count, pass threshold, and attempt number are embedded in the certificate metadata.

---

### Method D — Peer art method

The peer art method is the most distinctive element of this curriculum. It is not decoration and it is not optional — it is a required evidence component at every module and the primary assessment pathway for learners who struggle with text-based quizzes.

**What it is:** After completing the content and flashcard work in a module, the learner creates a **visual representation** of one or more concepts from the module. The medium is their choice: pencil sketch, painted diagram, collage, photograph of a physical model, digital illustration, annotated field drawing, mural photograph. The artwork is submitted as part of the module completion record.

**Why it works:**
- Forces the learner to synthesise and reconstruct knowledge, not just recall it
- Accessible to learners with low literacy — a diagram can communicate understanding that written text cannot
- Culturally adaptable — local visual traditions and aesthetics are encouraged, not suppressed
- Creates a portfolio of learning artifacts that can be shared, displayed, and reused
- Produces community-owned educational material (other learners' artwork becomes teaching material in future cohorts)
- Strong artwork can generate a `art:visual` certificate alongside the learning certificate — dual recognition

**The peer art review process:**

1. Learner creates artwork and submits a photograph or digital file
2. The artwork is anonymised and shared with 2–3 peers in the same cohort or platform community
3. Peers review using a guided rubric (see below)
4. Peer comments are returned to the creator with facilitator moderation
5. The creator optionally revises the work in response to feedback
6. The facilitator makes a final determination: *demonstrates understanding*, *partially demonstrates*, or *does not demonstrate* — the only assessment outcomes

**Peer review rubric (used by reviewers — plain language):**

| Question | Guidance |
|---|---|
| What do you think this artwork is trying to show? | Describe in your own words — do not critique |
| What does it help you understand? | Identify one specific thing you learned from looking at it |
| Is anything missing or confusing? | Be specific and kind — point to what, not to the person |
| What is the strongest part of this work? | Must name something specific |

The rubric deliberately avoids aesthetic judgement. The question is whether the artwork communicates ecological understanding, not whether it is technically skilled.

**Artwork gallery:** All artwork marked *demonstrates understanding* is added to the cohort gallery (with creator permission). The gallery is accessible to other learners and to the public at `exotopia.org/learn/gallery`. Strong artworks are nominated by facilitators for a `art:visual` certificate.

**Physical-first option:** In contexts without reliable device access, the peer art task can be done entirely on paper. The facilitator photographs and uploads artwork on behalf of the cohort. Peer review happens in the group session (facilitator reads comments aloud; creator responds verbally). This is the default for facilitated group delivery in low-connectivity contexts.

---

## Curriculum Track 1 — WATSAN

**Domain:** `water` + `health:wash`  
**Certificate pathway:** `learn:foundation` → `learn:practitioner` → `learn:advanced` in `eco:water`  
**Prerequisite:** None (open entry)  
**Total estimated time:** Foundation 8h / Practitioner 16h / Advanced 24h  
**ApproVideo content used:** Water Purifier, Evaporative Distiller, DIY Water Distillation System

---

### Curriculum map — WATSAN

```
FOUNDATION TRACK (Modules W1–W4)
──────────────────────────────────────────────────────────────────
W1 Water & Life (2h)
  └─ W2 Contamination & Disease (2h)
       └─ W3 Household Treatment Methods (2h)
            └─ W4 Sanitation & Hygiene Basics (2h)
                 └─ [CHECKPOINT] learn:foundation + eco:water

PRACTITIONER TRACK (Modules W5–W9) — prerequisite: W4 passed
──────────────────────────────────────────────────────────────────
W5 Building a Biosand Filter (3h)
W6 Solar Distillation Systems (3h)
W7 Water Quality Testing in the Field (3h)
W8 Rainwater Harvesting Systems (3h)
W9 Community WASH Facilitation (4h)
  └─ [CHECKPOINT] learn:practitioner + eco:water

ADVANCED TRACK (Modules W10–W13) — prerequisite: W9 passed
──────────────────────────────────────────────────────────────────
W10 Community Water System Design (6h)
W11 Multi-Parameter Quality Monitoring (6h)
W12 WASH Programme Planning & Evaluation (6h)
W13 Training Trainers in Water & Sanitation (6h)
  └─ [CHECKPOINT] learn:advanced + eco:water
```

---

### Module W1 — Water and Life

**Level:** Foundation | **Time:** 2h | **Prerequisite:** None

**Objectives:**
- Identify the three main sources of fresh water (surface, groundwater, rainwater) and their characteristics
- Explain the water cycle in plain language using a diagram
- Name four uses of water in a household and rank them by health priority
- Describe what "safe water" means and does not mean

**Content:** Text + embedded ApproVideo segments on water sources. Illustrated cross-section of water cycle. Household water use survey tool.

**Flashcard deck W1:** 24 cards — water source images, water cycle terms, household water use scenarios, "safe or unsafe?" image pairs (visually clear and turbid water, covered and uncovered storage, etc.)

**Field activity:** Conduct a household water audit — identify all water sources used in the last 24 hours, estimated volume, and purpose. Record in the field notebook format provided.

**Peer art task:** Draw or illustrate the water cycle as it happens in your local landscape (not the generic global diagram — the learner's own river, rain, well, roof, etc.). Label at least four parts.

**Summative quiz:** 10 questions. Pass: 75%. Covers: water source types, water cycle, household uses, safe vs. unsafe water signs.

**Certificate checkpoint:** No — this module feeds into W4 checkpoint.

---

### Module W2 — Contamination and Disease

**Level:** Foundation | **Time:** 2h | **Prerequisite:** W1

**Objectives:**
- Name the four main categories of water contaminants (biological, chemical, physical, radiological) with examples of each
- Explain the faecal-oral transmission route using a diagram
- Identify at least five water-borne diseases and their symptoms
- Describe two ways contamination enters storage water after collection

**Content:** F-diagram (Faeces → Fluids → Fingers → Flies → Fields → Food → oral entry). Case studies from WATSAN field contexts. Contaminant identification guide.

**Flashcard deck W2:** 30 cards — contaminant type images, disease name → symptoms pairs, F-diagram element matching, "contamination pathway" scenarios.

**Field activity:** Walk the water chain from source to storage to use in one household. Document every point where contamination could enter. Photograph or sketch three points.

**Peer art task:** Illustrate the F-diagram using people, animals, and objects from your local environment. Replace the generic stick figures with figures from your own context. Label every pathway.

**Summative quiz:** 10 questions. Pass: 75%.

---

### Module W3 — Household Water Treatment Methods

**Level:** Foundation | **Time:** 2h | **Prerequisite:** W2

**Objectives:**
- Describe how four treatment methods work: boiling, chlorination, filtration, solar disinfection (SODIS)
- Explain when each method is and is not appropriate
- Correctly demonstrate SODIS setup using a clear PET bottle
- Identify the correct chlorine dose for a 20-litre container of water

**Content:** Illustrated guides to each treatment method. ApproVideo Water Purifier segment. SODIS protocol (WHO/EAWAG standard).

**Flashcard deck W3:** 28 cards — method name → how it works, method → appropriate context, equipment identification, dosage calculation scenarios.

**Field activity:** Implement SODIS for one day's household drinking water supply. Record setup time, exposure time, weather conditions, and whether the water was consumed.

**Peer art task:** Create a step-by-step illustrated guide (minimum 6 steps) for one water treatment method. Design it so someone who cannot read could follow it correctly.

**Summative quiz:** 10 questions. Pass: 75%.

---

### Module W4 — Sanitation and Hygiene Basics

**Level:** Foundation | **Time:** 2h | **Prerequisite:** W3

**Objectives:**
- Demonstrate the seven-step handwashing technique correctly
- Identify the five critical handwashing moments (WHO framework)
- Explain the purpose and basic design of a pit latrine and a pour-flush latrine
- Describe what constitutes open defecation and its health consequences

**Content:** WHO five moments for hand hygiene. Latrine typology comparison. Menstrual hygiene management basics. CLTS (Community-Led Total Sanitation) principles overview.

**Flashcard deck W4:** 25 cards — handwashing moments, latrine types, hygiene behaviour images (correct/incorrect), sanitation terminology.

**Field activity:** Conduct a WASH observation at a public space (school, market, health facility). Record: Is soap available? Is water available at the handwashing point? Is a latrine present and accessible? Are there signs of open defecation? Complete the observation checklist.

**Peer art task:** Create a handwashing poster in your local language and visual style. The poster must communicate the five critical moments without using any English text. Test it on one person who has not seen the module content — can they identify the moments?

**Summative quiz:** 10 questions. Pass: 75%.

**CERTIFICATE CHECKPOINT — `learn:foundation` + `eco:water`**  
Issued on passing W4 summative quiz. The certificate records: modules completed (W1–W4), total study time logged, field activities submitted, peer art module count, issuing organisation, date.

---

### Module W5 — Building a Biosand Filter

**Level:** Practitioner | **Time:** 3h | **Prerequisite:** W4 passed

**Objectives:**
- Explain the three mechanisms by which a biosand filter removes contaminants (mechanical straining, adsorption, biological predation in the schmutzdecke)
- Select appropriate sand and gravel grades for a biosand filter using a field sieve test
- Construct a correctly layered biosand filter from locally available materials
- Conduct a flow rate test and interpret results
- Explain the 3-week ripening period and why users must maintain daily flow

**Content:** CAWST Biosand Filter manual (open access). ApproVideo Water Purifier segment. Illustrated construction guide. Sand grading reference card.

**Flashcard deck W5:** 32 cards — filter layer identification, schmutzdecke biology, flow rate calculation, troubleshooting scenarios (slow flow, cloudy output, cracked concrete, etc.), sand grading images.

**Field activity:** Build a functional biosand filter. Document with: materials list and costs, construction photos (minimum one per step), flow rate test result, water quality visual before/after. Submit documentation package.

**Peer art task:** Create a cross-section diagram of a completed biosand filter showing all layers, the schmutzdecke, and the biological mechanisms operating at each layer. Annotate in your local language. Must be accurate enough to serve as a construction reference.

**Summative quiz:** 15 questions. Pass: 80%. Includes one image-based filter layer identification question and one flow rate calculation.

---

### Module W6 — Solar Distillation Systems

**Level:** Practitioner | **Time:** 3h | **Prerequisite:** W4 passed

**Objectives:**
- Explain the evaporation-condensation cycle that drives solar distillation
- Build a simple solar still from a basin, glass/plastic sheet, and collection vessel
- Measure and record distillate production under given conditions
- Explain when distillation is preferable to filtration and when it is not
- Connect the ApproVideo Evaporative Distiller design to the underlying principles

**Content:** ApproVideo Evaporative Distiller and DIY Water Distillation System segments. Illustrated basin still construction guide. Distillate yield estimation table (by basin area and solar irradiance).

**Flashcard deck W6:** 26 cards — evaporation/condensation terminology, solar still component identification, yield factors (angle, basin colour, ambient temperature), limitations of distillation.

**Field activity:** Build a basin solar still and measure its output over one full sunny day. Record: basin area, cover material, tilt angle, weather conditions, total distillate collected (ml). Calculate yield per m² per day.

**Peer art task:** Illustrate the physics of solar distillation — show the sun's energy, evaporation from the contaminated basin, condensation on the cover, and collection — in a way that makes the physics visible. The illustration should work as a teaching tool for explaining why the water is safe after distillation.

**Summative quiz:** 12 questions. Pass: 80%.

---

### Modules W7–W9 (summary — full detail in extended curriculum)

**W7 — Water Quality Testing in the Field:** Coliform testing (Petrifilm / DelAgua kit), turbidity measurement (Secchi disk, turbidity tube), pH and chlorine residual testing. Interpreting results against WHO guidelines. Documenting results in a community monitoring register.

**W8 — Rainwater Harvesting Systems:** Catchment area calculation, first-flush diverter design and construction, tank sizing, mosquito screening, overflow management. Inspecting an existing system for defects.

**W9 — Community WASH Facilitation:** Designing and delivering a community WASH session. Participatory risk mapping. Behaviour change communication principles. Monitoring behaviour change over time. Creating culturally appropriate WASH materials. Supervising a community handwashing infrastructure installation.

**CERTIFICATE CHECKPOINT W9 — `learn:practitioner` + `eco:water`**

---

## Curriculum Track 2 — Solar

**Domain:** `energy` (solar thermal + solar PV)  
**Certificate pathway:** `learn:foundation` → `learn:practitioner` → `learn:advanced` in `eco:energy`  
**Prerequisite:** None (open entry)  
**Total estimated time:** Foundation 8h / Practitioner 16h / Advanced 24h  
**ApproVideo content used:** Rocket Stove, Solar Oven, Solar Cookers (all four types), Fuel Briquette Press

---

### Curriculum map — Solar

```
FOUNDATION TRACK (Modules S1–S4)
──────────────────────────────────────────────────────────────────
S1 Energy Basics and the Sun (2h)
  └─ S2 Solar Thermal Cooking (2h)
       └─ S3 Biomass and Improved Cookstoves (2h)
            └─ S4 Introduction to Solar PV (2h)
                 └─ [CHECKPOINT] learn:foundation + eco:energy

PRACTITIONER TRACK (Modules S5–S9)
──────────────────────────────────────────────────────────────────
S5 Building a Solar Box Cooker (3h)
S6 Building a Parabolic Solar Cooker (3h)
S7 Solar PV System Sizing (3h)
S8 PV Installation and Wiring (3h)
S9 Maintenance and Troubleshooting (4h)
  └─ [CHECKPOINT] learn:practitioner + eco:energy

── SPECIALISM BRANCH (choose one or both)
   S-A: Solar Thermal Advanced Track (S10–S11)
   S-B: Solar PV Advanced Track (S12–S13)
──────────────────────────────────────────────────────────────────
S10 Evacuated Tube and Large-Scale Solar Thermal (6h)
S11 Community Cooking and Food Drying Systems (6h)
  └─ [CHECKPOINT] learn:advanced + eco:energy [solar-thermal specialism]

S12 Off-Grid PV System Design (6h)
S13 Mini-Grid and Battery Systems (6h)
  └─ [CHECKPOINT] learn:advanced + eco:energy [solar-pv specialism]
```

---

### Module S1 — Energy Basics and the Sun

**Level:** Foundation | **Time:** 2h | **Prerequisite:** None

**Objectives:**
- Define energy in plain language and give five examples from daily life
- Explain the difference between renewable and non-renewable energy sources
- Describe how solar radiation reaches Earth and varies by latitude, season, and cloud cover
- Read a simple solar resource map and identify high, medium, and low solar resource zones

**Content:** Energy concept introduction. Solar radiation diagrams (direct, diffuse, reflected). Peak sun hours concept. Solar resource map for the learner's region (Global Solar Atlas).

**Flashcard deck S1:** 28 cards — energy type image matching, solar radiation term definitions, "renewable or not?" scenarios, peak sun hour values for key cities.

**Field activity:** Shadow tracking — at the same location, mark and photograph the shadow of a vertical stick at 8am, 12pm, and 4pm on one day. Record the sun's path and identify when solar energy intensity is highest. Connect to optimal cooker/panel positioning.

**Peer art task:** Draw the sun's energy journey from the star to a solar cooker or solar panel at a specific location you know. Show: the sun, the atmosphere, clouds (if present), the device, and what the energy becomes (heat, electricity, cooked food). Label everything.

**Summative quiz:** 10 questions. Pass: 75%.

---

### Module S2 — Solar Thermal Cooking

**Level:** Foundation | **Time:** 2h | **Prerequisite:** S1

**Objectives:**
- Explain how a solar cooker converts sunlight to heat using reflection, transmission, and absorption
- Compare the four cooker types (box, parabolic, panel, evacuated tube) by temperature, materials, food type, and skill required
- Identify the correct sun-tracking technique for a box cooker and a parabolic cooker
- List three safety considerations for using a parabolic cooker

**Content:** ApproVideo Solar Oven, Solar Cookers (all four types) segments. Comparison table. Temperature range reference chart. Safety guide for high-temperature solar cooking.

**Flashcard deck S2:** 30 cards — cooker type identification from photographs, temperature ranges, material functions (reflector / glazing / absorber / insulation), sun-tracking rules, safety rules.

**Field activity:** Cook a complete meal using a solar cooker. Record: cooker type, start time, food type, weather conditions, time to cooking temperature, final temperature, result. Compare energy cost to the usual cooking method.

**Peer art task:** Design your ideal solar cooker for your local context — what materials are locally available, what temperature do you need, what food will you cook? Create an annotated design drawing showing all components and their function. Note one engineering trade-off you had to make.

**Summative quiz:** 10 questions. Pass: 75%.

---

### Module S3 — Biomass and Improved Cookstoves

**Level:** Foundation | **Time:** 2h | **Prerequisite:** S1

**Objectives:**
- Explain the combustion triangle and why rocket stoves burn more efficiently than open fires
- Identify the key design features of a rocket stove (L-shaped combustion chamber, insulated elbow, small fuel feed, high burn temperature)
- Describe the health effects of indoor air pollution from inefficient biomass combustion
- Explain how fuel briquettes are made and their advantages over raw biomass

**Content:** ApproVideo Rocket Stove and Fuel Briquette Press segments. Indoor air pollution health brief (WHO household air pollution data). Combustion efficiency comparison charts.

**Flashcard deck S3:** 26 cards — combustion triangle, rocket stove component identification, smoke health effects images, briquette production steps, efficiency comparison data.

**Field activity:** Build a basic rocket stove from locally available materials (bricks, clay, or metal). Conduct a simple water-boiling test comparing it to an open fire: time to boil 1 litre, fuel used, smoke produced (visual observation). Document with photos.

**Peer art task:** Create an illustrated cross-section of a rocket stove showing the combustion process — where air enters, where fuel feeds, where the hottest combustion occurs, where the heat transfers to the pot. Show why it uses less wood than an open fire.

**Summative quiz:** 10 questions. Pass: 75%.

---

### Module S4 — Introduction to Solar PV

**Level:** Foundation | **Time:** 2h | **Prerequisite:** S1

**Objectives:**
- Explain the photovoltaic effect in plain language
- Identify the five main components of a basic solar PV system (panel, charge controller, battery, inverter, load)
- Read a simple PV panel specification sheet (Wp, Voc, Isc, efficiency)
- Describe the difference between on-grid and off-grid systems

**Content:** Illustrated PV component guide. Sample specification sheet with annotations. On-grid vs. off-grid comparison. Energy balance concept (what you generate vs. what you use).

**Flashcard deck S4:** 28 cards — component identification photographs, specification terms, "on-grid or off-grid?" scenarios, wiring diagram labelling.

**Field activity:** Identify and photograph a solar PV installation in your community (school, health post, neighbour's home). Record: panel count, approximate size, what it powers, whether it has a battery, condition of the installation. If no installation is available, photograph a photograph or diagram and annotate it.

**Peer art task:** Draw a complete off-grid PV system showing all five components connected correctly, with arrows showing the direction of energy flow. Label each component with its function in one sentence. Mark where energy is stored and where it is used.

**Summative quiz:** 10 questions. Pass: 75%.

**CERTIFICATE CHECKPOINT — `learn:foundation` + `eco:energy`**

---

### Module S5 — Building a Solar Box Cooker

**Level:** Practitioner | **Time:** 3h | **Prerequisite:** S4 passed

**Objectives:**
- Select and prepare materials for a solar box cooker (outer box, inner box, insulation, glazing, reflector panels, absorber plate)
- Construct a functional solar box cooker using the standard build sequence
- Test cooker performance using a standardised water-heating test (time to 65°C and to 100°C)
- Identify common construction defects and their solutions

**Content:** Illustrated box cooker construction manual. Materials sourcing guide (what substitutions work). Standardised performance test protocol (Solar Cookers International standard).

**Flashcard deck S5:** 30 cards — component function, construction sequence steps, material substitution options, defect images → diagnosis → fix.

**Field activity:** Build a complete solar box cooker. Conduct performance test (water heating to 100°C). Document: materials list and local costs, construction time, test results (temperature vs. time graph), photo of completed cooker and cooked food.

**Peer art task:** Create a construction guide for the solar box cooker — illustrated, step-by-step, without relying on English text. Design it for a first-time builder who has your module flashcard knowledge but has not read the manual. Exchange with a peer: can they follow your guide to build one?

**Summative quiz:** 15 questions. Pass: 80%. Includes one defect-diagnosis image question.

---

### Module S6 — Building a Parabolic Solar Cooker

**Level:** Practitioner | **Time:** 3h | **Prerequisite:** S5

**Objectives:**
- Explain why a parabolic shape concentrates light to a focal point
- Construct a parabolic reflector from a parabolic mould, cardboard/metal, and reflective material
- Align the cooker to the sun and locate the focal point safely
- Describe the specific safety protocols for a high-temperature solar cooker (never look at the reflector in sunlight; never leave unattended; protect children from focal zone)
- Achieve a cooking temperature of at least 150°C

**Content:** ApproVideo Parabolic Solar Cooker segment. Parabolic geometry explanation (accessible). Reflective material options and their reflectance values. Safety protocol card.

**Flashcard deck S6:** 24 cards — parabolic geometry terms, reflectance values of common materials, safety rules (visual card for each rule), alignment technique steps.

**Field activity:** Build a parabolic cooker. Achieve cooking temperature ≥150°C (measured with a cooking thermometer). Cook one dish that requires high heat (oil, bread, meat). Document safety measures taken. Photograph focal point using a piece of paper to show the light concentration (never look directly).

**Peer art task:** Create the safety card for a parabolic solar cooker. It must communicate the three critical safety rules to someone who cannot read. The card should be printable, weather-resistant (laminated or on card), and usable by children as a reminder. Test it — show it to a child without explanation and ask them to describe what they must not do.

**Summative quiz:** 12 questions. Pass: 80%. Includes mandatory safety question — must answer correctly to pass regardless of overall score.

---

### Modules S7–S13 (summary — full detail in extended curriculum)

**S7 — PV System Sizing:** Load assessment, peak sun hours, panel sizing, battery sizing, charge controller and inverter selection. Worked examples. Common sizing mistakes.

**S8 — PV Installation and Wiring:** Roof mounting, ground mounting, tilt angle optimisation, wiring diagrams, correct cable sizing, fuse and protection requirements, battery connection sequence.

**S9 — Maintenance and Troubleshooting:** Monthly inspection checklist, battery maintenance, cleaning panels, diagnosing low output, replacing components, safety when working with batteries.

**S10 — Evacuated Tube and Large-Scale Solar Thermal:** Higher temperature applications (water heating, process heat, drying), evacuated tube collector physics, large-scale box and parabolic trough systems.

**S11 — Community Cooking and Food Drying Systems:** Designing a community solar cooking centre, institutional cooker sizing, solar food drying for preservation, cold chain alternatives.

**S12 — Off-Grid PV System Design:** Full system design methodology, load profiles, seasonal variation, system reliability calculations, battery bank sizing, inverter specification.

**S13 — Mini-Grid and Battery Systems:** Community mini-grid design, metering and tariff structures, battery system management, diesel backup integration, community governance of shared energy infrastructure.

---

## Curriculum Track 3 — Citizen Science

**Domain:** `biodiversity` + `eco:climate` + `eco:water`  
**Certificate pathway:** `learn:foundation` → `learn:practitioner` → `learn:advanced` in `eco:biodiversity`  
**Prerequisite:** None (open entry)  
**Total estimated time:** Foundation 8h / Practitioner 16h / Advanced 24h  
**Platform integrations:** iNaturalist, GBIF, OpenStreetMap, eBird, Global Solar Atlas, CoCoRaHS (rainfall)

---

### Curriculum map — Citizen Science

```
FOUNDATION TRACK (Modules C1–C4)
──────────────────────────────────────────────────────────────────
C1 What Is Citizen Science? (2h)
  └─ C2 The Art of Observation (2h)
       └─ C3 Using iNaturalist and Field Apps (2h)
            └─ C4 Data Quality and Verification (2h)
                 └─ [CHECKPOINT] learn:foundation + eco:biodiversity

PRACTITIONER TRACK (Modules C5–C9)
──────────────────────────────────────────────────────────────────
C5 Transect and Point Count Surveys (3h)
C6 Water Quality Citizen Monitoring (3h)
C7 Community Weather and Climate Observation (3h)
C8 Habitat Mapping with Open Tools (3h)
C9 Communicating Science to Your Community (4h)
  └─ [CHECKPOINT] learn:practitioner + eco:biodiversity

── SPECIALISM BRANCH
   C-A: Ecological Monitoring
   C-B: Climate and Water Data
──────────────────────────────────────────────────────────────────
C10 Designing a Community Monitoring Programme (6h)
C11 Data Analysis and Reporting (6h)
C12 Advocacy with Citizen Science Data (6h)
C13 Training Citizen Scientists (6h)
  └─ [CHECKPOINT] learn:advanced + eco:biodiversity
```

---

### Module C1 — What Is Citizen Science?

**Level:** Foundation | **Time:** 2h | **Prerequisite:** None

**Objectives:**
- Define citizen science and give three examples of citizen science projects that have produced peer-reviewed findings
- Explain why community-collected ecological data has scientific value when protocols are followed
- Describe the difference between contributory, collaborative, and co-created citizen science models
- Identify one citizen science project operating in their country or region

**Content:** History of citizen science (Christmas Bird Count 1900 → iNaturalist 2008 → Galaxy Zoo → etc.). Real research examples using citizen science data. Types of citizen science model. Map of active projects in target regions.

**Flashcard deck C1:** 22 cards — citizen science definition and examples, project type matching, data use scenarios, "is this citizen science?" yes/no with explanation.

**Field activity:** Find and photograph one species you cannot identify, using your phone or a simple description. This observation becomes the starting point for the iNaturalist account set up in C3.

**Peer art task:** Draw a map of your local environment — your neighbourhood, village, or field site — and mark every living thing you can think of that is present there. Include plants, insects, birds, mammals, fungi, aquatic life. This is your baseline community mental map. You will return to it at the end of the Foundation track.

**Summative quiz:** 10 questions. Pass: 75%.

---

### Module C2 — The Art of Observation

**Level:** Foundation | **Time:** 2h | **Prerequisite:** C1

**Objectives:**
- Distinguish between observation (what you directly perceive) and inference (what you conclude)
- Apply the four-dimension observation framework: What / Where / When / How many
- Make a detailed written description of a plant or animal that would allow another person to identify it
- Photograph a specimen correctly for identification (focus, lighting, multiple angles, scale reference)

**Content:** Observation vs. inference exercises. The four-dimension framework. Field photography guide (camera angle, distance, lighting, depth of field basics for phone cameras). Written description format.

**Flashcard deck C2:** 26 cards — observation vs. inference scenarios, photography quality comparisons ("good ID photo" vs. "poor ID photo"), four-dimension framework practice scenarios, common photography errors.

**Field activity:** Make and record 10 observations from a single 30-minute outdoor session. For each: written description, photograph (if possible), four-dimension data. At least three observations must be of organisms you cannot identify.

**Peer art task:** Choose your strongest observation from the field activity. Create a scientific illustration of the organism — not a photograph, but a drawn or painted depiction that captures identifying features (leaf shape, wing pattern, body segments, etc.). Use the naturalist illustration tradition — accurate enough that another person could identify the species from your drawing alone.

**Summative quiz:** 10 questions. Pass: 75%. Includes one "observation or inference?" categorisation question set.

---

### Module C3 — Using iNaturalist and Field Apps

**Level:** Foundation | **Time:** 2h | **Prerequisite:** C2

**Objectives:**
- Create an iNaturalist account and make a first observation
- Upload a correctly structured observation (photo + location + date + notes)
- Request and interpret an identification from the iNaturalist community
- Understand how iNaturalist observations become "research grade" and why that matters for science

**Content:** iNaturalist tutorial (adapted for low-bandwidth contexts). Research grade criteria. How iNaturalist data flows to GBIF and national biodiversity databases. Alternative apps for specific taxa (eBird for birds, PlantNet for flora, GBIF Identify).

**Flashcard deck C3:** 20 cards — iNaturalist interface elements, research grade criteria, data flow diagram (observation → iNaturalist → GBIF → researcher), common upload errors and fixes.

**Field activity:** Make 5 iNaturalist observations and achieve at least one "Research Grade" observation (two agreeing community identifications). Screenshot your profile page showing the observations.

**Peer art task:** Design a one-page "iNaturalist Quick Start Guide" for your community — in your local language, using illustrations rather than screenshots. Focus on the most important three steps: how to take a good photo, how to add a location, how to submit. Test on one community member who has never used the app.

**Summative quiz:** 10 questions. Pass: 75%. Includes one iNaturalist interface screenshot identification question.

---

### Module C4 — Data Quality and Verification

**Level:** Foundation | **Time:** 2h | **Prerequisite:** C3

**Objectives:**
- Explain why data quality standards exist and what happens to research when data quality is poor
- Identify the three most common data quality errors (wrong location, wrong date, misidentification) and how to prevent them
- Apply the iNaturalist community review process to assess the quality of an observation you did not make
- Understand the difference between casual, needs ID, and research grade observations

**Content:** Data quality case studies (when bad data leads to wrong conclusions). Location accuracy techniques. Date/time recording protocols. How the iNaturalist review community works. Common misidentification traps in local taxa.

**Flashcard deck C4:** 24 cards — data quality error images → diagnosis → fix, quality level definitions, GPS accuracy scenarios, common local look-alike species pairs.

**Field activity:** Review 10 observations from other iNaturalist users in your local area. For each: assess the photo quality, location plausibility, and identification. Add one identification or comment to at least three observations.

**Peer art task:** Return to the mental map you drew in C1. Add to it: (1) species you have since identified using iNaturalist, (2) species you observed but could not identify, (3) species you expected to find but did not. How has your observation changed? Write or draw this reflection.

**Summative quiz:** 10 questions. Pass: 75%.

**CERTIFICATE CHECKPOINT — `learn:foundation` + `eco:biodiversity`**

---

### Modules C5–C9 (summary)

**C5 — Transect and Point Count Surveys:** Standard transect design, belt transect vs. line transect, point count protocol for birds, distance sampling basics, recording sheets, avoiding observer bias.

**C6 — Water Quality Citizen Monitoring:** Macroinvertebrate sampling as a bioindicator of water quality, BMWP scoring system, turbidity and DO measurement, citizen-led water quality monitoring network design.

**C7 — Community Weather and Climate Observation:** Rain gauge installation and reading (CoCoRaHS protocol), phenological observation (first flower, first migration, frost dates), extreme weather documentation, seasonal calendar disruption recording.

**C8 — Habitat Mapping with Open Tools:** OpenStreetMap contribution, satellite imagery interpretation (Google Earth / Sentinel-2), sketch mapping, GPS track recording, habitat classification in local context.

**C9 — Communicating Science to Your Community:** Science communication principles, infographic design basics, community presentation skills, connecting ecological data to community decisions, managing conflicting findings.

---

## Cross-track integration

The three tracks are designed to reinforce each other. Learners who complete more than one track receive a **cross-domain recognition note** on their certificates. Three combinations have named integrations:

**WATSAN + Citizen Science → "Water Quality Monitor"**  
Learners who hold `learn:practitioner` in both tracks can issue `eco:water` certificates with a Water Quality Monitor endorsement, recognising their combined capacity for chemical/biological water testing and ecological indicator monitoring.

**Solar + Citizen Science → "Solar Field Researcher"**  
Learners who hold practitioner in both tracks are equipped for solar resource assessment using citizen observation data (shadow tracking, cloud cover recording, temperature logging) — foundational for community energy planning.

**All three tracks → "Community Environmental Practitioner"**  
The full combination certificate is issued as an Advanced recognition to learners completing practitioner level in all three tracks. This is the highest recognition in the curriculum short of a Facilitator certificate in any individual domain.

---

## Platform technical requirements

### Minimum viable for launch

- Flashcard deck viewer (front/back flip, SM-2 scheduler, offline ZIP download)
- Module content pages (markdown-rendered text + embedded video iframe from ApproVideo)
- Formative quiz widget (multiple choice + image ID)
- Summative quiz engine (question bank, randomised draw, score threshold gate, attempt logging)
- Peer art submission (image upload, anonymised display to reviewers, rubric form)
- Progress tracker (which modules completed, which quizzes passed, which certificates issued)
- Certificate issuance flow (wallet connection or email → SVG generation → on-chain mint)

### Accessibility requirements

- All content available in text form (no video-only content)
- All images have descriptive alt text
- All quizzes available in audio format (text-to-speech minimum; local-language voice recording preferred)
- Flashcard decks downloadable for offline use
- Peer art submission accepts: JPEG/PNG (photo of physical artwork), SVG (digital), PDF
- Facilitator dashboard for group delivery: bulk submission, cohort progress view, manual certificate trigger

### Language priorities

Phase 1 launch languages: English, Kiswahili, Spanish  
Phase 2: French, Portuguese, Bahasa Indonesia, Arabic  
Phase 3: Amharic, Luganda, Bislama, Tagalog, Hindi

Translation of flashcard decks is a community contribution task — earns `contrib:translation` certificate. Community translators are paired with domain experts for accuracy review.

---

## Related documents

- [SPEC_DOMAIN_COMPETENCY.md](SPEC_DOMAIN_COMPETENCY.md) — domain competency levels and evidence requirements
- [compliance/POLYNOMICS-CONTRIBUTION.md §3F](compliance/POLYNOMICS-CONTRIBUTION.md) — certificate system and SVG specification
- [compliance/digital-credentials-law/REGIONAL-PLAN.md](compliance/digital-credentials-law/REGIONAL-PLAN.md) — regional qualification framework alignment
- [compliance/digital-credentials-law/TRUST-HIERARCHY.md](compliance/digital-credentials-law/TRUST-HIERARCHY.md) — issuer governance

---

*SCD Hub · Exotopia.org · ApproVideo · GPL v3 · June 2026*
