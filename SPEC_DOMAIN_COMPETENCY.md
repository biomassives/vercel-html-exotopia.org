# SPEC — Domain Competency Framework

**Platform:** SCD Hub / Exotopia.org / ApproVideo  
**Status:** Draft v1 — June 2026  
**Depends on:** [compliance/POLYNOMICS-CONTRIBUTION.md §3F](compliance/POLYNOMICS-CONTRIBUTION.md), [compliance/digital-credentials-law/REGIONAL-PLAN.md](compliance/digital-credentials-law/REGIONAL-PLAN.md)  
**Certificate system:** SVG on-chain credentials, W3C VC 2.0 / Open Badges 3.0

---

## Purpose

This spec defines the **domain competency structure** underpinning SCD Hub's certificate system. It answers:

- What domains do we recognise?
- What does competency look like at each level within a domain?
- What evidence is required to issue a certificate at each level?
- How do our domains map to the ApproVideo knowledge taxonomy, UN SDGs, ESCO occupational standards, and regional qualifications frameworks?

Every certificate issued through the SCD Hub system (see `POLYNOMICS-CONTRIBUTION.md §3F`) belongs to one or more domains defined here. This document is the authoritative reference for what any given certificate category means in terms of real-world competency.

---

## Competency levels — universal across all domains

Four levels apply across all domains. Level names are consistent so a recipient with certificates from multiple domains can communicate their overall profile simply.

| Level | Slug | What it means |
|---|---|---|
| Foundation | `foundation` | Aware and can participate. Understands core concepts, can follow established methods under supervision, can describe what they observe. |
| Practitioner | `practitioner` | Can do independently. Applies methods correctly in real contexts, produces verifiable outputs, can identify problems and adapt. |
| Advanced | `advanced` | Can lead and adapt. Designs approaches, trains others informally, can work across sub-domains, produces outputs that others build on. |
| Facilitator | `facilitator` | Can certify others. Holds authority to assess and issue `foundation` and `practitioner` certificates in this domain within their community. Requires SCD Hub counter-signature at issuance. |

Evidence requirements by level:

| Level | Minimum evidence |
|---|---|
| Foundation | Attendance or participation record; short reflective note or quiz; facilitator observation |
| Practitioner | Documented output (field report, working prototype, merged code, completed design); peer or facilitator review |
| Advanced | Portfolio of 3+ practitioner-level outputs; demonstrated adaptation or innovation; evidence of informal teaching |
| Facilitator | Advanced-level portfolio; completed SCD Hub facilitator assessment; nomination by a Level 2 partner organisation |

---

## Domain taxonomy

Twelve primary domains. Each domain has a short code used in certificate slugs, a set of sub-domains, the applicable certificate category prefixes, and alignment to external frameworks.

---

### Domain 1 — Water

**Code:** `water`  
**Certificate prefix:** `eco:water`  
**ApproVideo tags:** purification, desalination, filtration, distillation, wastewater, water security  
**UN SDG alignment:** SDG 6 (Clean Water and Sanitation)  
**ESCO alignment:** Environmental technician (3257); Sanitation technician

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Filtration & purification | `water:filtration` | Sand/gravel filters, biosand, ceramic filtration, UV treatment, chlorination |
| Distillation & desalination | `water:distillation` | Solar stills, evaporative distillers, DIY distillation systems, sea/brackish water treatment |
| Storage & distribution | `water:storage` | Rainwater harvesting, tank systems, gravity-fed distribution, contamination prevention |
| Wastewater & sanitation | `water:sanitation` | Grey water treatment, constructed wetlands, composting toilets, pit latrine improvement |
| Watershed monitoring | `water:monitoring` | Flow measurement, water quality testing (pH, turbidity, nitrates, coliform), data collection protocols |
| Community water governance | `water:governance` | Water user associations, tariff structures, maintenance planning, community ownership models |

#### Competency levels

**Foundation — `learn:foundation` + `eco:water`**
- Understands sources of water contamination and disease transmission pathways
- Can describe at least one filtration or purification method and how it works
- Can correctly collect a water sample for testing
- Recognises signs of infrastructure failure (leaks, blockages, contamination)

**Practitioner — `learn:practitioner` + `eco:water`**
- Can build, operate, and maintain a biosand or ceramic filter from available materials
- Can conduct a basic water quality test (field kit) and interpret results
- Can design and install a small rainwater harvesting system for a household or small community
- Can lead a community session on water safety and household treatment options

**Advanced — `learn:advanced` + `eco:water`**
- Can design a community-scale water system (source assessment, distribution layout, treatment train)
- Can conduct multi-parameter water quality monitoring and produce a written assessment
- Can train others to build and maintain water treatment systems
- Has documented at least one water system installation or improvement that is still operational

**Facilitator — `learn:facilitator` + `eco:water`**
- Holds Advanced level
- Can assess Foundation and Practitioner competency in others
- Has delivered at least two structured learning sessions in the water domain
- Nominated by a Level 2 partner with water domain scope

---

### Domain 2 — Energy

**Code:** `energy`  
**Certificate prefix:** `eco:energy`  
**ApproVideo tags:** solar, biogas, wind, hydropower, fuel efficiency, zero-fuel, sustainable cooking, off-grid  
**UN SDG alignment:** SDG 7 (Affordable and Clean Energy)  
**ESCO alignment:** Renewable energy technician (3123); Energy efficiency consultant

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Solar thermal | `energy:solar-thermal` | Solar ovens (box, parabolic, panel, evacuated tube), water heaters, crop dryers |
| Solar photovoltaic | `energy:solar-pv` | PV system sizing, installation, battery storage, inverters, off-grid wiring |
| Biomass & biogas | `energy:biomass` | Rocket stoves, fuel briquette production, improved cookstoves, biogas digesters |
| Wind & micro-hydro | `energy:wind-hydro` | Small wind turbine installation, run-of-river micro-hydro, community energy assessment |
| Energy efficiency | `energy:efficiency` | Building insulation, load assessment, LED retrofits, HVAC optimisation in low-resource contexts |
| Community energy governance | `energy:governance` | Mini-grid cooperatives, tariff design, maintenance committees, energy access planning |

#### Competency levels

**Foundation**
- Understands the difference between energy sources and their trade-offs in off-grid contexts
- Can describe how a solar oven or rocket stove works and when each is appropriate
- Can identify basic solar PV components and their function
- Understands household energy audit concepts

**Practitioner**
- Can build and operate a solar box cooker or parabolic reflector from available materials
- Can size and install a basic solar PV system for household lighting and phone charging
- Can produce fuel briquettes from organic waste using a press or mould
- Can conduct a household energy audit and identify priority improvements

**Advanced**
- Can design a community-scale solar PV mini-grid or micro-hydro installation
- Can train others to build and maintain cookstoves, solar cookers, and small PV systems
- Has documented at least one community energy installation with usage and performance data

**Facilitator**
- Holds Advanced level; can assess Foundation and Practitioner in others
- Has delivered structured learning in energy domain
- Nominated by Level 2 partner with energy domain scope

---

### Domain 3 — Food Systems & Agriculture

**Code:** `food`  
**Certificate prefix:** `eco:food`  
**ApproVideo tags:** organic, soil improvement, IPM, cover cropping, diversified agriculture, agroforestry, specialty crops  
**UN SDG alignment:** SDG 2 (Zero Hunger); SDG 15 (Life on Land)  
**ESCO alignment:** Agronomist (2131); Agricultural technician (3142); Agroecology specialist

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Soil health & fertility | `food:soil` | Composting, cover cropping, green manures, soil testing, carbon-building practices |
| Pest & disease management | `food:ipm` | Integrated pest management, biological control, companion planting, trap cropping |
| Agroforestry & polyculture | `food:agroforestry` | Multi-strata systems, shade-grown crops, silvopasture, fodder trees, windbreaks |
| Seed sovereignty | `food:seeds` | Open-pollinated variety selection, seed saving, community seed banks, variety documentation |
| Community food systems | `food:systems` | Food access mapping, community gardens, food hubs, cooperative purchasing, post-harvest handling |
| Aquaculture & fisheries | `food:aqua` | Small-scale aquaculture systems, sustainable fishing practices, community resource management |

#### Competency levels

**Foundation**
- Understands basic principles of soil fertility and why it matters
- Can identify common crop pests and describe at least one non-chemical management approach
- Understands the concept of seed saving and why open-pollinated varieties matter
- Can describe a simple crop rotation sequence

**Practitioner**
- Can establish and maintain a composting system producing usable compost
- Can implement an IPM plan for a specific crop/pest combination
- Can set up a simple agroforestry system (at least two layers)
- Can save, dry, and store seeds from at least three food crop varieties
- Has documented a growing season with yield data and observations

**Advanced**
- Can design a whole-farm agroecological system for a specific site and context
- Can train others in soil health assessment, IPM, and seed saving
- Has documented a community food system intervention and its outcomes
- Can conduct a participatory variety selection process with a community group

**Facilitator**
- Holds Advanced level; can assess Foundation and Practitioner in others
- Nominated by a Level 2 partner with food/agriculture domain scope

---

### Domain 4 — Waste & Circular Economy

**Code:** `circular`  
**Certificate prefix:** `eco:circular`  
**ApproVideo tags:** composting, recycling, upcycling, zero waste, solid waste management, fuel briquettes  
**UN SDG alignment:** SDG 11 (Sustainable Cities); SDG 12 (Responsible Consumption)  
**ESCO alignment:** Waste management officer (2133); Resource efficiency consultant

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Composting & organic processing | `circular:composting` | Hot composting, vermicomposting, bokashi, compost tea, community-scale systems |
| Material recovery & upcycling | `circular:upcycling` | Sorting and processing waste streams, upcycled construction materials, plastic recycling basics |
| Fuel from waste | `circular:fuel` | Fuel briquette production from agricultural residues, charcoal production efficiency, biochar |
| Zero waste systems design | `circular:systems` | Community waste audit, source reduction strategies, repair café models, extended producer responsibility advocacy |
| Sanitation & solid waste governance | `circular:governance` | Community waste collection systems, fee structures, landfill diversion metrics |

#### Competency levels

**Foundation**
- Can sort waste into compostable, recyclable, and residual streams correctly
- Understands the difference between aerobic and anaerobic decomposition
- Can explain the concept of a circular economy in accessible language
- Knows at least one local waste-related health hazard and how to reduce it

**Practitioner**
- Can operate a community composting system from setup to finished compost
- Can produce usable fuel briquettes from organic waste
- Can conduct a household or community waste audit and produce a simple report
- Can facilitate a community clean-up with documented outcomes

**Advanced**
- Can design a community-scale material recovery and composting system
- Can assess a waste stream and recommend appropriate processing pathways
- Has trained others in waste reduction practices
- Has documented at least one circular economy intervention with before/after data

**Facilitator**
- Holds Advanced level; assessed Foundation and Practitioner in others
- Nominated by Level 2 partner with circular economy scope

---

### Domain 5 — Shelter & Construction

**Code:** `shelter`  
**Certificate prefix:** (maps to `contrib:community` for facilitation; `eco:restoration` for natural building material sourcing)  
**ApproVideo tags:** natural building, insulation, ventilation, temporary shelter, permanent housing, plumbing  
**UN SDG alignment:** SDG 11 (Sustainable Cities and Communities)  
**ESCO alignment:** Building technician (3123); Natural building specialist

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Natural & vernacular building | `shelter:natural` | Cob, adobe, rammed earth, bamboo, thatch, stone — locally-sourced material construction |
| Temporary & emergency shelter | `shelter:emergency` | Rapid deployment shelters, tarpaulin systems, transitional shelter standards, humanitarian shelter protocols |
| Thermal comfort & ventilation | `shelter:thermal` | Passive cooling, passive heating, insulation retrofits, cross-ventilation design |
| Sanitation infrastructure | `shelter:sanitation` | Pour-flush latrines, ventilated improved pit latrines, handwashing stations, menstrual hygiene facilities |
| Urban upgrading | `shelter:urban` | Incremental housing, settlement upgrading principles, community land trusts, participatory planning |

#### Competency levels

**Foundation**
- Understands the principles of passive thermal comfort (shade, ventilation, thermal mass)
- Can identify locally available building materials and their properties
- Understands the difference between temporary, transitional, and permanent shelter
- Can explain basic sanitation infrastructure requirements

**Practitioner**
- Can build a basic structure using natural materials (cob, adobe, or bamboo as locally appropriate)
- Can install a ventilated improved pit latrine to basic standards
- Can conduct a shelter assessment for a household or small community
- Can design a simple passive cooling retrofit for an existing building

**Advanced**
- Can manage a community natural building project from site selection to completion
- Can train others in natural building techniques
- Has documented at least one completed shelter project with photos, materials list, and occupant feedback

**Facilitator**
- Holds Advanced level; assessed Foundation and Practitioner in others
- Nominated by Level 2 partner with shelter/construction domain scope

---

### Domain 6 — Health & Community Wellbeing

**Code:** `health`  
**Certificate prefix:** `contrib:community` (facilitation); `learn:practitioner` (health education)  
**ApproVideo tags:** public health, field medicine, PTSD care, water-borne disease, hygiene  
**UN SDG alignment:** SDG 3 (Good Health and Wellbeing)  
**ESCO alignment:** Community health worker (3253); Health promotion officer

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Water & sanitation hygiene (WASH) | `health:wash` | Handwashing behaviour, safe water handling, ORS preparation, hygiene promotion |
| Community first aid | `health:firstaid` | Basic first aid, wound care, shock management, referral pathways |
| Psychosocial support | `health:psychosocial` | Active listening, psychological first aid, group support facilitation, trauma-informed approaches |
| Nutrition & food safety | `health:nutrition` | Malnutrition identification, therapeutic feeding basics, food preservation, safe food handling |
| Environmental health | `health:environment` | Vector control, indoor air quality (cookstove smoke), lead/arsenic exposure prevention |

#### Competency levels

**Foundation**
- Can demonstrate correct handwashing technique and explain when it is required
- Understands oral rehydration therapy and when to use it
- Can identify signs of malnutrition in children under five
- Knows local referral pathways for basic health emergencies

**Practitioner**
- Can deliver a WASH hygiene promotion session to a community group
- Can provide basic first aid including wound care and recognition of shock
- Can conduct a simple environmental health assessment of a household or community
- Can deliver psychological first aid in a crisis context

**Advanced**
- Can train community health workers in WASH and nutrition
- Can design a community health campaign and document its reach and impact
- Has documented at least one community health intervention with outcome data

**Facilitator**
- Holds Advanced level; assessed Foundation and Practitioner in others
- Nominated by Level 2 partner with health domain scope (note: health facilitators require additional safeguarding background check)

---

### Domain 7 — Biodiversity & Habitat

**Code:** `biodiversity`  
**Certificate prefix:** `eco:biodiversity`  
**ApproVideo tags:** ecology, habitat, species, field survey  
**UN SDG alignment:** SDG 15 (Life on Land); SDG 14 (Life Below Water)  
**ESCO alignment:** Biodiversity officer (2133); Field ecologist; Conservation technician

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Species identification | `biodiversity:species` | Flora/fauna identification methods, field guides, iNaturalist protocols, vouchering |
| Habitat mapping | `biodiversity:habitat` | Vegetation survey methods, habitat classification, GPS mapping, GIS basics |
| Wildlife monitoring | `biodiversity:wildlife` | Camera trapping, transect surveys, point counts (birds), track identification |
| Marine & freshwater ecology | `biodiversity:aquatic` | Reef health assessment, macroinvertebrate surveys, riparian zone assessment |
| Invasive species management | `biodiversity:invasives` | Identification of key invasive species, removal methods, prevention protocols |
| Community biodiversity stewardship | `biodiversity:stewardship` | Community conservation agreements, payment for ecosystem services, biodiversity monitoring by local custodians |

#### Competency levels

**Foundation**
- Can identify 20+ plant and/or animal species in their local ecosystem using a field guide or iNaturalist
- Understands the concept of habitat and why biodiversity matters for ecosystem function
- Can record a basic species observation with location, date, and description
- Understands the difference between native and invasive species in their context

**Practitioner**
- Can conduct a structured transect survey or point count using standard protocols
- Can use GPS equipment and record spatial data in a field notebook or digital system
- Can identify the major habitat types in their local landscape and map them at a basic level
- Can operate an iNaturalist project and quality-control submitted observations
- Has contributed a minimum of 50 verified species observations to a community biodiversity dataset

**Advanced**
- Can design a biodiversity monitoring programme for a specific site and purpose
- Can analyse a species dataset and produce a written ecological assessment
- Has trained others in field survey techniques
- Has contributed data to a national or regional biodiversity database (GBIF, OBIS, national herbarium, etc.)

**Facilitator**
- Holds Advanced level; assessed Foundation and Practitioner in others
- Nominated by Level 2 partner with biodiversity domain scope

---

### Domain 8 — Soil Health & Land Stewardship

**Code:** `soil`  
**Certificate prefix:** `eco:soil`  
**UN SDG alignment:** SDG 15; SDG 2  
**ESCO alignment:** Soil scientist (2131); Land management technician

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Soil assessment | `soil:assessment` | Field soil tests (texture, structure, colour, pH, compaction), Munsell colour chart, soil profile description |
| Carbon & organic matter | `soil:carbon` | Organic matter measurement, carbon sequestration practices, biochar application, no-till assessment |
| Erosion & land degradation | `soil:erosion` | Erosion identification, contour mapping, gully stabilisation, windbreak establishment |
| Restoration agronomy | `soil:restoration` | Cover cropping, green manures, subsoil improvement, waterlogging management |
| Participatory land mapping | `soil:mapping` | Participatory rural appraisal land mapping, sketch mapping, community land tenure documentation |

#### Competency levels

**Foundation**
- Can perform a basic field soil texture test (jar test / ribbon test)
- Can describe the difference between healthy and degraded soil visually
- Understands the role of organic matter in soil fertility
- Recognises signs of erosion and their causes

**Practitioner**
- Can conduct a full soil profile description and basic field assessment
- Can design and implement a soil erosion prevention measure (contour bund, check dam, vetiver grass)
- Can measure soil organic matter change using before/after sampling
- Has documented a soil improvement intervention with baseline and follow-up data

**Advanced**
- Can lead a participatory land assessment and produce a community land management plan
- Can design a soil restoration programme for a degraded site
- Has trained others in soil assessment and restoration techniques

**Facilitator** — holds Advanced; assessed others; nominated by Level 2 partner

---

### Domain 9 — Climate Adaptation & Monitoring

**Code:** `climate`  
**Certificate prefix:** `eco:climate`  
**UN SDG alignment:** SDG 13 (Climate Action)  
**ESCO alignment:** Climate change analyst (2133); Environmental monitoring technician

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Local climate observation | `climate:observation` | Rain gauge installation and reading, temperature recording, extreme event documentation, phenological observation |
| Community vulnerability assessment | `climate:vulnerability` | Participatory mapping of climate hazards, livelihood exposure assessment, adaptive capacity inventory |
| Adaptation planning | `climate:adaptation` | Community climate adaptation plan development, priority measure identification, implementation tracking |
| Early warning systems | `climate:early-warning` | Community-based early warning protocols, flood markers, drought indicators, communication systems |
| Climate knowledge documentation | `climate:knowledge` | Recording local ecological indicators of climate change, seasonal calendar disruptions, species range shifts |

#### Competency levels

**Foundation**
- Can read and record data from a rain gauge, thermometer, and simple weather station
- Can describe climate hazards that affect their community and identify which livelihoods are most exposed
- Understands the difference between climate variability and long-term climate change
- Can locate their community on a basic climate hazard map

**Practitioner**
- Can install and maintain a community weather station and contribute data to a national/regional network
- Can facilitate a community climate vulnerability assessment using participatory methods
- Has documented a seasonal calendar disruption or ecological change with community members
- Can draft a simple community climate adaptation plan

**Advanced**
- Can design and manage a community-based monitoring network
- Can train others in climate data collection and vulnerability assessment
- Has produced a climate vulnerability report used in community planning or advocacy

**Facilitator** — holds Advanced; assessed others; nominated by Level 2 partner

---

### Domain 10 — Ecosystem Restoration

**Code:** `restoration`  
**Certificate prefix:** `eco:restoration`  
**UN SDG alignment:** SDG 15; SDG 14; SDG 13  
**ESCO alignment:** Restoration ecologist (2133); Reforestation technician

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| Reforestation & agroforestry | `restoration:reforestation` | Native species nursery production, planting techniques, aftercare, survival monitoring |
| Wetland & riparian restoration | `restoration:wetland` | Riparian buffer planting, wetland hydrology, invasive removal in aquatic contexts |
| Degraded land rehabilitation | `restoration:land` | Assisted natural regeneration, bare land stabilisation, pioneer species selection |
| Ocean & coastal restoration | `restoration:coastal` | Mangrove restoration, seagrass transplanting, coral fragment propagation basics |
| Restoration monitoring | `restoration:monitoring` | Vegetation recovery tracking, survival rate assessment, ecological function indicators |

#### Competency levels

**Foundation**
- Understands the principles of ecological succession and natural regeneration
- Can identify native pioneer species suitable for restoration in their local context
- Can plant a tree correctly (correct depth, mulching, watering, protection)
- Understands why invasive species removal precedes restoration planting

**Practitioner**
- Can run a native species nursery including seed collection, germination, and seedling management
- Can implement an assisted natural regeneration protocol on a degraded site
- Can establish and monitor a reforestation plot with survival and growth data
- Has participated in the removal and disposal of invasive species at a restoration site

**Advanced**
- Can design a multi-year restoration programme for a specific site
- Can train others in restoration techniques and monitoring
- Has documented a restoration project through at least two growing seasons with data

**Facilitator** — holds Advanced; assessed others; nominated by Level 2 partner

---

### Domain 11 — Indigenous & Traditional Ecological Knowledge

**Code:** `iek`  
**Certificate prefix:** `eco:indigenous`  
**Governance note:** Certificates in this domain are ALWAYS jointly issued with the relevant community governance body. SCD Hub does not issue `eco:indigenous` certificates unilaterally. FPIC (Free, Prior and Informed Consent) documentation must be embedded in the certificate metadata.  
**UN SDG alignment:** SDG 15; SDG 2; SDG 11  
**Framework alignment:** UNDRIP Article 31; CBD Nagoya Protocol; ILO Convention 169

#### The legal foundation: ILO Convention No. 169 explained

**ILO Convention No. 169** — the *Indigenous and Tribal Peoples Convention* (Geneva, 1989) — is the International Labour Organization's primary binding international treaty on indigenous rights. Unlike the UN Declaration on the Rights of Indigenous Peoples (UNDRIP, 2007), which is a political declaration with no enforcement mechanism, C169 is a **ratified treaty** — in countries that have signed it, its provisions are enforceable in domestic courts.

As of 2026, 23 countries have ratified C169. The majority are in Latin America — the same region where a large portion of SCD Hub's eco-ops work occurs:

*Latin America (14):* Bolivia, Peru, Ecuador, Colombia, Brazil, Costa Rica, Honduras, Guatemala, El Salvador, Nicaragua, Mexico, Chile, Argentina, Paraguay  
*Europe (5):* Denmark (covering Greenland), Spain, Luxembourg, Netherlands, Norway  
*Africa/Pacific (4):* Central African Republic, Fiji, Nepal, Venezuela

**What C169 requires that directly shapes how we issue `eco:indigenous` certificates:**

**Article 1 — Self-identification:** Indigenous status is determined by the peoples themselves, not by governments or outside organisations. SCD Hub cannot decide which communities qualify as indigenous for certification purposes. The community governance body makes that determination. Our certificates must reflect the community's own name and territorial description, not an outside classification.

**Articles 6–7 — Consultation obligation:** Before any programme, activity, or measure that affects indigenous peoples, there must be genuine consultation with them through their representative institutions — before the activity begins, not after. For us: the `eco:indigenous` certificate programme in any community must begin with a formal consultation with the community governance body (council, assembly, federation). The consultation record must be documented and embedded in the FPIC metadata of every certificate issued.

**Article 15 — Natural resource rights:** Indigenous peoples hold rights to the natural resources in their territories. Courts and legal scholars have consistently interpreted this to extend to *traditional knowledge about those resources* — knowledge of medicinal plants, seasonal fish movements, soil management practices, and ecological calendars. Documenting and certifying this knowledge without community control and consent would violate Article 15 in any C169 ratifying country.

**Article 23 — Traditional activities:** The convention explicitly recognises traditional agriculture, hunting, fishing, handicrafts, and related activities as economic and cultural rights that states must actively support. The ecological practices our certificates document are precisely the activities Article 23 protects.

**FPIC — the operational standard:**  
C169 uses the language of "consultation." UNDRIP (non-binding but broader) uses the stronger phrase "free, prior and informed consent." Our process adopts the UNDRIP FPIC standard in all contexts, even where C169 is the applicable law — because FPIC is more protective of community rights and reduces our legal exposure everywhere.

FPIC in our context means:
- **Free:** No coercion, pressure, or inducement. The community's participation in the certificate programme must be entirely voluntary.
- **Prior:** Consent is sought *before* any documentation activity begins — not after the fact.
- **Informed:** The community understands exactly what the certificates will say, who will see them, where the data will be stored, what they can and cannot do with the records, and what their right to withdraw looks like.

The FPIC record embedded in every `eco:indigenous` certificate includes: the name of the community governance body, the date and form of consultation, the consent decision, the scope of what was consented to (specific knowledge domains, specific territory, specific use), and a revocation clause stating how the community can withdraw consent and what happens to existing certificates if they do.

**Why joint issuance is non-negotiable:**  
The joint-issuance requirement (community governance body + SCD Hub co-sign every certificate) is the operational expression of Articles 6, 15, and 23. It means:
- The community retains visible authorship of the knowledge being certified
- No certificate can be issued without the community's active, ongoing participation
- The community can revoke its co-signature at any time, immediately invalidating all affected certificates
- SCD Hub cannot unilaterally continue a certification programme in a community that has withdrawn consent

**Countries where C169 creates legal liability (not just ethical obligation):**  
In all 23 ratifying countries, failure to follow C169's consultation process before conducting any programme affecting indigenous peoples can result in court orders halting the programme, damages claims, and reputational consequences. In Bolivia (which has the most protective domestic indigenous rights law globally, via the 2009 Constitution and Law 222), failure to consult is grounds for criminal prosecution of project promoters.

---

#### Sub-domains

| Sub-domain | Slug | Description |
|---|---|---|
| TEK documentation | `iek:documentation` | Recording traditional ecological calendars, indicator species, land management practices — with community governance and FPIC |
| Biocultural mapping | `iek:mapping` | Documenting culturally significant landscapes, sacred sites, resource management territories with community participation |
| Language and knowledge revitalisation | `iek:language` | Documenting ecological vocabulary, species names, and land-use concepts in endangered languages |
| Community custodianship | `iek:custodianship` | Supporting community governance systems for managing access to and application of traditional knowledge |

#### Competency levels

Competency in this domain is defined by the community governance body, not by SCD Hub. The following describes the minimum SCD Hub expectation for each level — the community may set higher or different standards.

**Foundation**
- Has participated in community-led TEK documentation or biocultural mapping activities
- Understands FPIC principles and the C169/UNDRIP legal basis for them
- Can describe the relationship between their community's ecological practices and ecosystem health
- Can explain what a consultation record contains and why it matters

**Practitioner**
- Can facilitate a community TEK documentation session using participatory methods
- Has produced documented records (in any format the community approves) of traditional ecological knowledge
- Understands the specific C169 obligations in their jurisdiction (ratifying country or UNDRIP-only)
- Can identify when a proposed activity triggers the consultation requirement under C169 Article 6

**Advanced**
- Can design and lead a TEK documentation or biocultural mapping programme with full community governance
- Has produced a FPIC documentation package that would satisfy both C169 and UNDRIP standards
- Has advocated for IEK recognition in a policy, land management, or education context

**Facilitator**
- Defined by the community governance body — SCD Hub issues the technical certificate; the community issues the recognition of facilitator status
- Has completed SCD Hub's FPIC and C169/UNDRIP legal briefing module (see SPEC_LEARNING_CURRICULUM.md)

---

### Domain 12 — Arts, Culture & Creative Practice

**Code:** `arts`  
**Certificate prefix:** `art:visual`, `art:spatial`, `art:music`, `art:writing`, `art:motion`  
**UN SDG alignment:** SDG 11 (Cultural heritage); SDG 4 (Quality Education)  
**Framework alignment:** UNESCO Convention on the Protection and Promotion of the Diversity of Cultural Expressions (2005); UNESCO Intangible Cultural Heritage framework

#### Sub-domains

| Sub-domain | Slug | Certificate | Description |
|---|---|---|---|
| Visual art | `arts:visual` | `art:visual` | Drawing, painting, printmaking, photography, illustration, generative art |
| Spatial & 3D | `arts:spatial` | `art:spatial` | Sculpture, ceramics, 3D modelling, settlement design objects, installation |
| Music & sound | `arts:music` | `art:music` | Composition, performance, field recording, sound design, audio production |
| Writing & narrative | `arts:writing` | `art:writing` | Essays, poetry, storytelling, community histories, ecological narratives |
| Motion & interactive | `arts:motion` | `art:motion` | Animation, video, interactive media, performance documentation |
| Traditional & intangible | `arts:traditional` | `art:visual` + cultural note | Weaving, carving, textile arts, oral tradition documentation — aligned to UNESCO ICH |

#### Competency levels

Arts competency is assessed differently from technical domains — output quality and community significance matter more than procedural compliance.

**Foundation**
- Has completed a defined creative project or learning module in the sub-domain
- Work is their own original creation
- Can describe their creative process and intention

**Practitioner**
- Has produced a body of work (minimum 3 pieces) in the sub-domain
- Work has been shared with a community or public audience in some form
- Can give and receive constructive feedback on work in the sub-domain

**Advanced**
- Has produced work that has been adopted for community use, exhibited, performed, or published
- Can mentor others in the creative practice
- Has documented their practice with a portfolio or artist statement

**Facilitator**
- Can design and deliver creative learning experiences for others
- Has led at least two community creative projects
- Nominated by Level 2 partner with arts domain scope

---

## Domain-to-certificate mapping (summary)

| Domain | Certificate prefix | Level suffix |
|---|---|---|
| Water | `eco:water` | `+learn:[level]` for structured learning |
| Energy | `eco:energy` | `+learn:[level]` |
| Food & Agriculture | `eco:food` | `+learn:[level]` |
| Waste & Circular | `eco:circular` | `+learn:[level]` |
| Shelter & Construction | `contrib:community` / `eco:restoration` | — |
| Health & Wellbeing | `contrib:community` / `learn:[level]` | — |
| Biodiversity | `eco:biodiversity` | `+learn:[level]` |
| Soil Health | `eco:soil` | `+learn:[level]` |
| Climate | `eco:climate` | `+learn:[level]` |
| Restoration | `eco:restoration` | `+learn:[level]` |
| Indigenous Ecological Knowledge | `eco:indigenous` | community-defined |
| Arts & Culture | `art:[medium]` | foundation/practitioner/advanced |

For domains where a `learn:*` certificate is issued alongside the `eco:*` certificate: the `learn:*` certificate represents the formal learning pathway completion; the `eco:*` certificate represents the verified field practice. Both can be issued for the same achievement — they complement rather than duplicate each other.

---

## Cross-domain specialisms

Some real-world practitioners combine domains in ways that deserve recognition beyond any single domain. Three cross-domain specialisms are currently defined:

**Specialism 1 — Integrated Water-Food-Soil (IWFS)**  
Practitioners who work across water management, soil health, and food systems — the classic smallholder agroecologist or watershed farmer. Requires Practitioner level in at least two of: `water`, `soil`, `food`. Issues a combined certificate with IWFS specialism tag.

**Specialism 2 — Community Energy-Shelter (CES)**  
Practitioners who combine energy system installation with natural building — the off-grid homestead builder, the eco-village facilitator. Requires Practitioner in `energy` and Foundation in `shelter`. Issues combined certificate with CES specialism tag.

**Specialism 3 — Biodiversity-Restoration-Climate (BRC)**  
Field ecologists working across the three ecological monitoring domains. Requires Practitioner in `biodiversity` and Foundation in both `restoration` and `climate`. Issues combined certificate with BRC specialism tag.

---

## ApproVideo content alignment

The ApproVideo library (hub.approvideo.org / approvideo.org) maps to domains as follows. Completing a verified ApproVideo learning pathway contributes toward a `learn:foundation` or `learn:practitioner` certificate in the relevant domain.

| ApproVideo content | Domain | Sub-domain | Certificate level |
|---|---|---|---|
| Rocket Stove | Energy | `energy:biomass` | Foundation |
| Solar Oven / Solar Cookers | Energy | `energy:solar-thermal` | Foundation–Practitioner |
| Fuel Briquette Press | Waste & Circular | `circular:fuel` | Foundation–Practitioner |
| Evaporative Distiller | Water | `water:distillation` | Foundation |
| DIY Water Distillation System | Water | `water:distillation` | Practitioner |
| Water Purifier (layered filter) | Water | `water:filtration` | Foundation–Practitioner |
| Composting content | Waste & Circular | `circular:composting` | Foundation |
| IPM / Cover Cropping content | Food & Agriculture | `food:ipm` / `food:soil` | Foundation |
| Natural Building content | Shelter | `shelter:natural` | Foundation |
| WASH / Hygiene content | Health | `health:wash` | Foundation |

Viewing alone does not issue a certificate. Certificates require evidence of application — building the stove, running the filter, conducting the survey. ApproVideo content provides the knowledge layer; eco-ops field verification provides the evidence layer.

---

## Pending domains (for future spec versions)

- **Digital & Data Literacy** — smartphone use for ecological monitoring, community data collection, open data publishing. Currently partially covered by `contrib:*` certificates.
- **Governance & Cooperative Development** — cooperative governance, community bylaws, participatory budgeting, land tenure advocacy. High demand from eco-ops partner organisations.
- **Conflict Transformation & Peacebuilding** — relevant to SCD Hub's work in conflict-adjacent regions (Sahel, Horn of Africa, Central American Dry Corridor). Requires specialist partner organisations as Level 2.

---

## Related documents

- [compliance/POLYNOMICS-CONTRIBUTION.md](compliance/POLYNOMICS-CONTRIBUTION.md) — certificate system technical specification (§3F)
- [compliance/digital-credentials-law/TRUST-HIERARCHY.md](compliance/digital-credentials-law/TRUST-HIERARCHY.md) — issuer governance
- [compliance/digital-credentials-law/REGIONAL-PLAN.md](compliance/digital-credentials-law/REGIONAL-PLAN.md) — regional implementation
- [compliance/INDEX.md](compliance/INDEX.md) — compliance overview
- [FOCUS_LOCATION_OWNERSHIP.md](FOCUS_LOCATION_OWNERSHIP.md) — ownership and onboarding language

---

*SCD Hub · Exotopia.org · ApproVideo · GPL v3 · June 2026*
