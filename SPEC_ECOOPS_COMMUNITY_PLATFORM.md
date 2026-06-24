# SPEC_ECOOPS_COMMUNITY_PLATFORM.md
### Eco Ops — Community Coordination Platform (Chain-Free Edition)
*SCD Hub · GPL v3 · Working draft — June 2026*

---

## 0. What This Spec Is

This document respecifies the Eco Ops system without any blockchain dependency. The core proposition — that real environmental action should be recognised, rewarded, and made legible across a community — does not require a distributed ledger to work. It requires good data, trusted issuers, and a reward loop that people actually want to participate in.

The vocabulary changes as follows:

| Old term | New term | What it actually is |
|---|---|---|
| NFT | **Digital Certificate** | A signed, verifiable credential stored in a database and exportable as a PDF or shareable link |
| On-chain wallet | **Impact Profile** | A user's account page: certificates earned, points accumulated, projects contributed to |
| Minting | **Issuing** | An authorised facilitator or the platform confirms an action and issues a certificate |
| Marketplace | **Certificate Gallery** | A public listing of certificates held by community members |
| Token / crypto | **Points** | A simple integer in a database, redeemable for platform benefits |

Nothing about the user experience needs to feel lesser for this change. Digital certificates issued under a recognised standard (see §2) are more interoperable with employers, schools, and grant bodies than any NFT ever was.

---

## 1. Platform Mission

Eco Ops is the **action coordination and recognition layer** of the SCD Hub ecosystem.

It connects three things that community environmental programs typically fail to connect:

1. **The work itself** — planting, cleaning, monitoring, building, teaching
2. **The knowledge behind the work** — why this species, why this design, what the data means
3. **The recognition of the work** — something the participant can keep, share, and build on

The platform is not primarily a gamification system. Points and certificates are instruments of coordination: they make visible who has done what, who can teach whom, and where the community's capacity actually lives.

### 1.1 Primary audiences

| Audience | Core need |
|---|---|
| **Community volunteers** | Do work, earn recognition, learn, connect with mentors |
| **Mentors and facilitators** | Track who needs what, issue certificates, build reputation |
| **Project coordinators** | Assign tasks, see team capacity, report outcomes to funders |
| **Educators and curriculum developers** | Publish lessons, track engagement, receive field feedback |
| **Funders and NGO partners** | Read verified impact data without having to trust anyone's spreadsheet |

---

## 2. Digital Certificates

### 2.1 Standard

Certificates are issued using the **Open Badges 3.0** specification (W3C Verifiable Credentials profile). This is a mature, funder-recognised standard used by universities, UNESCO, and large NGOs. A certificate issued by the SCD Hub can be:

- Embedded in a LinkedIn profile
- Submitted to a grant application
- Verified by a third party via a public URL
- Exported as a signed PDF for offline use
- Displayed in the participant's Impact Profile on the platform

No blockchain is needed. The issuer's cryptographic signature on the credential is the trust anchor, not a ledger. The SCD Hub acts as the trusted issuer.

### 2.2 Certificate types

| Type | Trigger | Issued by | Visible on |
|---|---|---|---|
| **Action Certificate** | Verified eco-action logged in the app | Platform (automated after verification) | Impact Profile, Gallery |
| **Completion Certificate** | Module or course finished | Platform (on assessment pass) | Impact Profile, shareable link |
| **Mentorship Certificate** | Mentor completes a mentorship cycle with a mentee | Platform + lead facilitator co-sign | Impact Profile, mentor directory |
| **Project Contribution Certificate** | Meaningful contribution to a named project | Project coordinator issues | Impact Profile |
| **Biodiversity Observer Badge** | N verified species observations submitted | Platform (automated threshold) | Impact Profile, species map |
| **Facilitator Credential** | Trained and endorsed to run workshops | Senior facilitator co-signs | Facilitator directory |

### 2.3 Verification

Every certificate has:
- A unique ID and a stable public URL (`ecoops.scd-hub.org/cert/{id}`)
- The issuer's digital signature
- The recipient's display name (or pseudonym if preferred)
- The criteria met (linked to the relevant spec or lesson)
- An issuance date and optional expiry

Anyone with the URL can verify the certificate is genuine without creating an account.

### 2.4 Certificate as settlement object (Exotopia integration)

When a participant earns a certificate on a category that maps to an Exotopia settlement object (see SPEC_ECOCITY.md §2.1), the platform automatically makes the corresponding object available in their settlement. This preserves the "real knowledge → virtual reward" loop without requiring an NFT.

The mapping is stored in a simple database table: `certificate_type → settlement_object_key`.

---

## 3. Points and Rewards System

Points are a simple ledger in a PostgreSQL table. They are not currency. They are a coordination signal: they show who is active, unlock platform features, and allow the community to set its own thresholds for recognition.

### 3.1 Earning points

| Action | Points | Notes |
|---|---|---|
| Log a verified eco-action | 10 | Verification by project leader or GPS+photo |
| Complete a lesson module | 25 | Assessment required for full points |
| Submit a species observation | 8 | Cross-checked against iNaturalist if linked |
| Complete a mentorship session | 40 | Both mentor and mentee confirm |
| Mentor completes a full cycle | 150 | Cycle = 4–6 sessions with one mentee |
| Contribute data to a community report | 20 | Coordinator confirms contribution |
| Attend or facilitate a workshop | 30 | QR check-in at venue |
| Recruit a new participant | 15 | New participant completes first action |

### 3.2 Spending / redeeming points

Points do not have monetary value. They unlock:

- Access to advanced lesson modules (threshold: 100 points)
- Eligibility for facilitator training (threshold: 300 points)
- Priority placement in funded project teams (threshold: 200 points)
- Recognition in community leaderboard and annual report
- Nomination rights for community awards
- Discount or waiver on SCD Hub workshop registration fees (if applicable)

### 3.3 Decay and fairness

Points accumulated more than 18 months ago decay at 20% per quarter if the participant has been inactive. This prevents long-inactive accounts from holding permanent status. Active participants are not affected.

---

## 4. Mentorship Program

Mentorship is the mechanism by which accumulated knowledge moves through the community rather than staying locked in a few individuals. The platform structures and recognises this.

### 4.1 Mentor tiers

| Tier | Requirement | Capacity | Benefit |
|---|---|---|---|
| **Peer guide** | 100 points + 1 completed module | Guide 1 mentee at a time | Peer Guide certificate |
| **Community mentor** | 300 points + Facilitator Credential | Guide up to 3 mentees | Mentor directory listing, priority in funded projects |
| **Lead facilitator** | 500 points + 2 completed mentorship cycles | Run workshops, co-sign certificates | Facilitator credential, stipend eligibility |
| **Master practitioner** | Nominated by 3 lead facilitators | Curriculum development rights | Co-authorship credit on published modules |

### 4.2 Session structure

A mentorship session is:
- **Scheduled** in the platform (both parties confirm date/time)
- **Conducted** wherever works (in person, WhatsApp call, voice note exchange)
- **Logged** after: mentor submits a brief note (what was covered, next steps); mentee confirms the session happened
- **Credited** to both: mentor earns points and builds toward their cycle certificate; mentee earns points and tracks progress

The platform does not record the session content — that is private. It records only that the session happened and what topic area it covered.

### 4.3 Mentorship matching

The platform provides a simple matching interface:

- Mentee states what they want to learn (from a topic taxonomy)
- Available mentors are listed by their certified skills and current capacity
- Mentee sends a request; mentor accepts or declines
- No algorithmic matching — human choice is preserved

### 4.4 Cohort learning

Mentors can also run **cohort groups**: 4–8 participants working through the same module together with a mentor as guide. This is more efficient than 1:1 for foundational content and builds peer bonds. Cohort sessions are logged the same way as 1:1 sessions.

---

## 5. Biodiversity Preservation Coordination

### 5.1 What the platform does

The platform provides a **lightweight coordination layer** for community biodiversity work — not a species database (that is iNaturalist's job) but the tools for organising who does what, where, and when.

### 5.2 Observation campaigns

A project coordinator can create an **observation campaign**:

- Define a target area (polygon on a map, or a named location)
- Set a time window
- Specify target taxa or habitat types
- Assign roles: observers, data reviewers, report authors

Participants log their observations either directly in the Eco Ops app or via iNaturalist (linked account). The platform aggregates counts and flags any participant whose observations reach the **Biodiversity Observer Badge** threshold.

### 5.3 iNaturalist integration

Participants can link their iNaturalist account. The platform imports observation counts and species IDs automatically. This means:
- No duplicate data entry
- Observations are validated by the iNaturalist community ID process (a stronger validation than anything the platform could do itself)
- Participants who are already active on iNaturalist get immediate credit

### 5.4 Species-of-concern watch list

Community coordinators can maintain a local **watch list** of species of concern — threatened plants, pollinators in decline, invasive species to monitor. The platform highlights any observation of a watch-list species and notifies the relevant coordinator automatically.

### 5.5 Habitat action tracking

Beyond species, the platform tracks **habitat interventions**:
- Area of invasive species cleared (m²)
- Trees planted (count + species + GPS point)
- Riparian buffer restored (linear metres)
- Degraded habitat assessed and scored

These numbers feed directly into project reports and funder dashboards.

---

## 6. Environmental Engineering Lesson Library

### 6.1 Philosophy: low hanging fruit first

The lesson library is built around **interventions with a high effort-to-impact ratio** — things a small community group can actually do with limited resources that have measurable, lasting effect. The platform explicitly labels each lesson with:

- **Difficulty**: community (no special skills), facilitated (needs a trained person), professional (requires contractor)
- **Resource tier**: minimal, moderate, funded
- **Impact category**: water, air, soil, biodiversity, energy, waste, food, climate resilience
- **Evidence quality**: demonstrated locally, demonstrated regionally, research-backed

### 6.2 Core lesson tracks

**Track 1 — Water**
- Biosand filter construction and maintenance
- Rainwater harvesting: sizing and siting
- Greywater recycling for food gardens
- Basic water quality testing: what the numbers mean
- Watershed mapping with community participants

**Track 2 — Soil and Composting**
- Hot composting: ratios, timing, troubleshooting
- Vermicomposting at household and community scale
- Biochar production from agricultural waste
- Soil health assessment: texture, structure, biology
- Sheet mulching for weed suppression and water retention

**Track 3 — Urban and Peri-urban Greening**
- Street tree selection for local climate and soil
- Green roof basics: substrate depth, plant selection, drainage
- Permeable surface retrofitting (paths, parking, courtyards)
- Pocket parks and rewilding strips: design and maintenance
- Urban heat island mapping and mitigation interventions

**Track 4 — Energy and Buildings**
- Passive cooling design: orientation, thermal mass, cross-ventilation
- Solar PV basics: sizing a simple off-grid system
- Biogas from kitchen and agricultural waste
- Insulation retrofits for existing structures
- Efficient cookstove construction (rocketstove, institutional designs)

**Track 5 — Biodiversity and Ecological Restoration**
- Identifying and removing invasive plants in your area
- Native plant propagation from seed and cuttings
- Creating pollinator corridors in built environments
- Riparian buffer planting: species selection and spacing
- Monitoring progress: transect surveys and photo-monitoring

**Track 6 — Waste and Circular Resources**
- Community waste audit: how to do one, what to do with the results
- Repair café and tool library: setting up and sustaining
- Upcycling: bottle walls, tyre garden beds, pallet furniture
- Organic waste to resource: bokashi, black soldier fly, anaerobic digestion
- Reducing single-use plastics at event and institution scale

**Track 7 — Food Systems**
- Community garden design: layout, water access, governance
- Seed library: collection, storage, lending
- Food forest design: layers, species selection, succession
- Market linkage: connecting surplus produce to local buyers
- Climate-adapted crop selection for changing rainfall patterns

### 6.3 Lesson format

Each lesson includes:
- **Summary card**: 1 page, printable, key facts + action steps
- **Full guide**: 5–15 pages with diagrams, material lists, construction notes
- **Field checklist**: what to bring, what to document
- **Data template**: a simple sheet for recording outcomes in a standard format
- **Discussion prompts**: for facilitator-led workshops
- **Video** (where available): 3–10 minute field demonstration

All content is CC BY-SA 4.0. Community members can translate, adapt, and redistribute with attribution.

---

## 7. Proposed New Areas — Not Yet Leveraged

These are areas where the community platform could create meaningful additional value without large technical investment.

### 7.1 Citizen science data pipelines

The community is already collecting field data. That data has scientific value beyond the community itself. The platform could:

- Format observation data to Darwin Core standard (the biodiversity data interchange format used by GBIF, iNaturalist, and all major scientific databases)
- Submit community datasets to GBIF or regional biodiversity nodes on a quarterly basis
- Acknowledge individual contributors in the submission metadata
- Generate a DOI-citable dataset from each annual campaign

This turns community volunteers into co-authors of the scientific record — a powerful recognition that no certificate alone can provide.

### 7.2 Carbon and ecosystem service accounting

Each logged action has a potential numerical environmental value. The platform is in a position to aggregate these into community-level accounting:

- Trees planted × species survival rate × growth model = estimated CO₂ sequestration
- Composting volume → avoided methane emissions
- Rainwater harvested → groundwater recharge equivalent
- Invasive species cleared × habitat quality score → biodiversity unit change

This is not for carbon credit markets (which require third-party verification and a different legal framework). It is for **community reporting**: being able to say to a funder, a school, or a local government "our community did measurable X this year." That number, produced transparently from community data, is more credible than a narrative impact story.

### 7.3 Municipal and local government partnership layer

Most environmental volunteer work happens in parallel to local government rather than in connection with it. The platform could provide:

- A read-only **funder/partner dashboard** for verified government or NGO accounts: see aggregated project outcomes, certificate counts, active participant numbers — without accessing individual data
- A **project proposal template** aligned with municipal planning language, so community projects can be submitted as formal input to local environmental plans
- A **regulatory linkage layer**: when a community completes an action that relates to a local bylaw or conservation area (e.g., riparian buffer planting near a protected watercourse), the platform flags the relevant authority so the work is officially visible

### 7.4 School and university integration

Young people doing environmental work for school credit or university practicum hours are an underserved cohort. The platform could:

- Accept students as a participant type with a linked institution
- Generate signed **practicum hour reports** exportable to the institution's format
- Allow teachers or academic supervisors to create class-sized projects and track participation
- Issue academic-partner certificates co-signed by both the SCD Hub and the institution
- Build a **portfolio link**: a stable URL a student can include in university applications showing their verified environmental work history

### 7.5 Traditional and indigenous ecological knowledge

Much of the most effective local environmental knowledge is not in any lesson library. It lives with elders, farmers, and long-term residents. The platform could:

- Provide a **community knowledge submission** pathway: a structured interview guide and recording template that community coordinators use to document local ecological knowledge
- Publish submissions with explicit attribution and consent controls (the contributor decides what is public, what is community-only, and what remains private)
- Link traditional practices to the relevant scientific literature where it exists — not to validate the traditional knowledge through science, but to make the connection visible for funders and partners who need it
- Issue a **Knowledge Keeper** recognition certificate to contributors

This is sensitive work and requires community governance to be done well. The platform provides the container; the community controls what goes in it.

### 7.6 Peer-reviewed field reporting

Community participants are doing work that generates genuine field observations. With light structure, that work can become citable:

- **Community field report** template: structured sections for location, methods, observations, photographs, data tables
- Reports peer-reviewed within the platform by trained reviewers (Lead Facilitators or above)
- Published on the platform with a stable URL and the reviewer's endorsement
- Submitted to platforms like the Citizen Science Association journal or local academic partners

This creates a **publishing pipeline** from community action to public record that does not depend on academic institutions as gatekeepers.

### 7.7 Phenology and seasonal observation network

Phenology — the timing of seasonal biological events (first flowering, bird arrival, insect emergence) — is one of the clearest signals of climate change at a local level and requires exactly the kind of long-term distributed observation that community science networks can provide.

The platform could maintain a simple **seasonal calendar**:
- Community members log "first sighting" events for locally significant species or phenomena
- The platform aggregates these into a community phenology record
- Year-on-year comparison becomes automatic after the first season
- Data is formatted for submission to national phenology programs (e.g., UK Phenology Network, USA-NPN, regional equivalents)

This is high scientific value, very low technical cost, and gives long-term participants a reason to keep logging across seasons and years.

### 7.8 Built environment quick-wins inventory

Many of the highest-impact urban environmental interventions require no planning permission and no specialist skills: replacing a section of impermeable paving with gravel and plants, installing a rain barrel, planting a tree pit, hanging a swift nest box, removing an invasive shrub. The platform could maintain a **local quick-wins map**:

- Community members submit candidate locations with a photo and brief description
- Coordinators tag them with the relevant lesson track and estimated effort
- Teams sign up to complete a quick-win; completion is logged and the map updates
- The aggregate becomes a visual record of neighbourhood-scale transformation over time

### 7.9 Repair, reuse, and material exchange

Waste reduction is one of the most accessible environmental actions at community scale, and it builds social infrastructure as well as environmental outcomes. The platform could coordinate:

- **Repair café scheduling**: recurring events where skilled members fix things for the community
- **Tool library**: a borrowable inventory of tools for community projects (logged out/in through the platform)
- **Material exchange board**: surplus compost, seeds, timber offcuts, gravel — listed and claimed within the community before going to waste

Each of these generates platform activity (and points) without requiring any new physical infrastructure.

### 7.10 Disaster preparedness and ecological restoration

Communities that have built environmental coordination capacity are better positioned to respond when something goes wrong. The platform could include:

- A **restoration registry**: degraded sites that the community has formally committed to restoring, with a baseline assessment and a multi-year action plan
- **Post-event response protocols**: what to do in the first weeks after a flood, drought, wildfire, or storm event — in the form of rapid-deployment lesson cards
- **Mutual aid coordination**: after a climate event, who in the community has what skills and resources available to help

This connects the long-term ecological work to the community resilience dimension that funders increasingly require.

---

## 8. Technical Architecture

### 8.1 No blockchain required — what we use instead

| Need | Blockchain solution | Platform solution |
|---|---|---|
| Tamper-evident records | Immutable ledger | PostgreSQL with append-only audit log + periodic hash checkpoints |
| Portable credentials | NFT | Open Badges 3.0 signed JWT — verifiable with any OB3 validator |
| Public verification | On-chain lookup | Public certificate verification URL |
| Decentralised identity | Wallet address | Email + optional DID (decentralised identifier) — user's choice |
| Scarcity / uniqueness | Token supply | Platform-enforced: a certificate is only issued once per person per criterion |

### 8.2 Core data model (simplified)

```
users
  id, display_name, email_hash, location, joined_at, points_balance

certificates
  id, user_id, type, criteria_id, issued_at, issuer_id, signature, public_url

actions
  id, user_id, action_type, project_id, logged_at, verified_at, verifier_id, points_awarded, media_url

mentorship_sessions
  id, mentor_id, mentee_id, topic, conducted_at, confirmed_mentor, confirmed_mentee, points_awarded

observations
  id, user_id, species_name, taxon_id, location_point, observed_at, inaturalist_id, verified

projects
  id, name, coordinator_id, area_polygon, start_date, end_date, status, funder

lessons
  id, track, title, difficulty, resource_tier, impact_categories[], evidence_quality, content_url

certificate_to_settlement_object
  certificate_type, settlement_object_key
```

### 8.3 Integration points

| External system | Direction | Purpose |
|---|---|---|
| **iNaturalist API** | Pull | Import species observations for linked accounts |
| **GBIF** | Push | Export community datasets in Darwin Core format |
| **Open Badges validator** | Pull | Allow third parties to verify certificates |
| **Exotopia.org** | Push | Unlock settlement objects on certificate issue |
| **WhatsApp Business API** | Push | Session reminders, action confirmations for low-bandwidth users |
| **Google Forms / ODK** | Pull | Structured field data entry for users without smartphones |
| **PDF generation service** | Render | Signed PDF export of any certificate |

### 8.4 Offline and low-bandwidth design

Many community members work in areas with unreliable internet. The platform must:

- Work offline for action logging (Progressive Web App with local storage sync)
- Support QR-code check-in for workshops (offline-validated against a locally cached session list)
- Accept photo uploads on reconnect rather than requiring live upload
- Send confirmations via SMS or WhatsApp where email is not reliable

---

## 9. Governance

### 9.1 Who can issue certificates

- **Platform (automated)**: Action certificates, observation badges, module completion certificates — based on verified data
- **Project coordinators**: Project contribution certificates — for participants on their projects
- **Lead facilitators**: Mentorship certificates — co-signed with the platform
- **Senior facilitators (nominated)**: Facilitator credentials — co-signed with the platform
- **No one**: Can issue a certificate for someone who did not meet the criteria. The audit log shows every issuance and the evidence it was based on

### 9.2 Dispute resolution

If a participant believes a certificate was incorrectly denied or incorrectly issued:
1. They submit a dispute through the platform (written, with supporting evidence)
2. A coordinator not involved in the original decision reviews within 7 days
3. Decision is final unless the participant escalates to the platform steward

### 9.3 Data privacy

- Participants control which fields of their Impact Profile are public, community-only, or private
- Location data on actions is stored at municipality level by default (exact GPS only stored with explicit consent)
- Participants can request full export of their data at any time
- Accounts can be deactivated (data anonymised but not deleted, to preserve project records)

---

## 10. Open Questions for Q&A Iteration

These are areas where the design is intentionally underspecified pending community input:

1. **Certificate naming**: "Digital Certificate" is neutral. Does the community want something more evocative — "Eco Credential", "Field Badge", "Community Seal"? Names shape how seriously things are taken.

2. **Points redemption scope**: The spec lists platform-internal benefits. Are there external redemption options worth pursuing — local business discounts, event priority, co-op membership? These require partner relationships but may increase motivation.

3. **Mentorship stipend eligibility**: The spec mentions stipends for Lead Facilitators. What is the funding source? Grant income, SCD Hub operating budget, or a community contribution model?

4. **Traditional knowledge governance**: Who specifically makes decisions about what traditional knowledge is published and how? This needs a named community body, not just "the community."

5. **Phenology network scope**: Which species or phenomena are worth tracking in the primary community contexts (Lamu, Nairobi, diaspora nodes)? This requires local ecological knowledge to answer well.

6. **Carbon accounting methodology**: Several methods exist for estimating sequestration from planting data. Which is credible enough for funder reporting without requiring expensive third-party verification?

7. **School integration priority**: Is the primary target secondary schools, universities, or vocational/technical colleges? The certificate co-signing relationship looks different in each case.

8. **Repair café and tool library**: Is this a feature the platform coordinates, or should it point to an existing platform (e.g., ShareTribe, Sharetribe) with deep integration? Building inventory management from scratch is non-trivial.

---

*SCD Hub · GPL v3 · For iteration — share questions and revisions directly.*
