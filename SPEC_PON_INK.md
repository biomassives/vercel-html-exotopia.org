# SPEC_PON_INK.md — pon.ink Platform
### Sound, Events, Payments, NFT Minting & User Dashboard
*SCD Hub · GPL v3 · Living document — April 2026*

---

## 0. What pon.ink Is

**pon.ink** ("put it on ink") is the **primary operations portal** for the SCD Hub ecosystem. It is the platform where artists create, communities organise, field workers get paid, and all activity is recorded permanently. While Exotopia is the cosmic visualization layer and ecocity.com is the educational layer, pon.ink is the **daily-use tool** — the place people return to every session.

The name encodes the mission: every action taken in this network — a check-in, a performance, a water quality reading, a sale — is permanently inked on-chain. Nothing is ephemeral.

---

## 1. Platform Mission and Design Principles

### 1.1 Who pon.ink Serves

Three archetypes define the platform's user base:

| Archetype | Who they are | What they need from pon.ink |
|---|---|---|
| **Ghetto Youth** | Music producers, DJs, visual artists, rappers in Nairobi, Lamu, Kingston — and USA counterparts | A professional home for their creative output: mint, sell, perform, connect |
| **Educator in Exile** | Field workers, health educators, environmental scientists who can't reach mainstream platforms | Tools to log, certify, and monetise their work at the field level, mobile-first |
| **Community Builder** | Facilitators, administrators, promoters, fundraisers building community capacity | Campaign tools, event hosting, group dashboards, POAP issuance, impact reporting |

A single user may move between archetypes over time. The platform accommodates this without forcing a role re-selection.

### 1.2 Design Principles

- **No wallet required to start.** Every core feature is accessible via email magic link. Wallet connection upgrades the experience; it does not gate it.
- **Net amount shown first.** Before any transaction confirms, the user sees what they actually receive in local currency (KES or USD) after all splits. No surprises.
- **3G mobile first.** Every page tested at 1 Mbps / 150ms on mid-range Android (375px minimum viewport). Desktop is an enhancement.
- **Plain language throughout.** No crypto jargon in user-facing UI. "Your planet deed" not "ARC-3 Exolocation NFT." Technical details are always available but never foregrounded.
- **Open by default.** GPL v3. All user data exportable. On-chain records are public.
- **Culture is the pipeline.** Sound, visual art, and event-based community work are not secondary to the mission — they are how the mission moves through communities.

---

## 2. Platform Features

### 2.1 User Identity and Dashboard

Every user has a **personal dashboard** that serves as their mission control across all three platforms (pon.ink, Exotopia, ecocity.com).

**Dashboard sections:**

| Section | Contents |
|---|---|
| **Identity bar** | Handle, display name, role badge, avatar/orb color, wallet address (if connected) |
| **Exotopia link** | Settlement name + planet, "View settlement" deep link to exotopia.org |
| **NFT portfolio** | All tokens owned: Exolocation, Station Modules, $BARS, POAPs, art, eco certs |
| **Activity feed** | Recent eco-ops check-ins, events attended, purchases, airdrops received |
| **Robot Mule panel** | Corpus summary, visitor count, current Mule tier (Foal / Colt / Stallion) |
| **Earnings** | Lifetime revenue by category (NFT sales, event royalties, referrals), in KES + USD |
| **Upcoming events** | Events the user is registered for or hosting |
| **Campaign status** | Active airdrop campaigns with progress bars (claimed / total) |

The dashboard adapts to the user's primary role. A DJ sees Sound Lab prominently. An eco advocate sees eco-ops metrics first. An administrator sees governance and compliance views.

---

### 2.2 ExoProperty — Virtual Real Estate Portal

The **ExoProperty page** is the pon.ink representation of the user's Exotopia settlement. It bridges the two platforms — users can view their virtual real estate from the pon.ink side without loading the full 3D environment.

**ExoProperty displays:**
- Settlement name and exoplanet address string
- Planet data summary (distance, host star, equilibrium temperature, habitable zone status)
- Zone color (derived from `favorable_zone` in planet data — green = habitable, amber = edge, red = extreme)
- Robot Mule section: greeting, corpus depth, visitor count, Mule tier badge
- NFT portfolio filtered to this settlement: Station Core, Station Modules, EcocitySolution objects
- "View on Exotopia.org" button — deep links to `/surface/:hostname/:planetName`
- "View Gallery" button — deep links to `/surface/:hostname/:planetName/gallery`
- Aftermarket action bar: list/delist settlement objects for sale, set royalty percentage

**Property tiers (Mule tier system):**

| Tier | Corpus depth | Visitor threshold | Unlocks |
|---|---|---|---|
| Foal | 0–2 items | 0–9 | Basic greeting, bio display |
| Colt | 3–5 items | 10–49 | Artwork descriptions, eco-ops summary |
| Stallion | 6–10 items | 50–199 | Full visitor analytics, event hosting badge |
| Sovereign | 11+ items | 200+ | Featured placement in SCD Hub directory, rare airdrop eligibility |

Tier advancement is automatic and happens without user action beyond filling the corpus and having visitors.

---

### 2.3 Airdrop Campaign Builder

The **Airdrop Campaign Builder** is the primary tool for event organisers, artists, and community leaders to distribute NFTs, music, and data to community members.

**Campaign types:**

| Type | Use case | Bundle contents |
|---|---|---|
| **Solo Artist** | Individual musician or visual artist release | $BARS or Art NFT + POAP + Exolocation mention |
| **Band / Collective** | Multi-artist collaboration | Multiple $BARS or Art NFTs + shared POAP + settlement badge |
| **Eco Node** | Community eco-ops milestone celebration | Water Quality Cert or EcocitySolution object + POAP + eco node badge |
| **Educational** | ecocity.com module completion | Module completion certificate + EcocitySolution object |
| **Event** | Live or virtual event attendance | POAP + event-specific NFT + settlement visitor badge |

**Campaign builder steps:**
1. **Select group type** — determines default bundle template
2. **Choose lesson domain** — cultural_preservation, environmental_action, economic_agency, health_advocacy, technical_skills
3. **Set trigger** — what activates the airdrop dispatch:
   - `event_attendance` — POAP code scanned at live or virtual event
   - `eco_ops_milestone` — check-in count threshold reached
   - `module_completion` — ecocity.com certificate issued
   - `mule_visitor_count` — settlement visitor threshold crossed
   - `planet_confirmation` — proposed exoplanet officially confirmed in NASA archive
   - `manual` — admin dispatches on demand
4. **Build bundle** — select NFTs and assets to include; set supply limit
5. **Set narrative** — title, lesson domain hook, call-to-action text (280 chars max), settlement reference
6. **Review and submit** — supply limit, claim window, recipient wallet list (if pre-targeted)

**Dry run mode:** Any campaign can be run in dry run mode — the full interface is live, data is written to Supabase, but no real minting or payment dispatch occurs. This enables event rehearsal, artist onboarding, and testing without on-chain cost.

---

### 2.4 Sound Lab — $BARS NFT Production

The **Sound Lab** is where DJ and sound artist users manage their sonic creative output.

**Sound Lab features:**
- **Upload session**: drag audio file → automatic IPFS upload via Pinata → IPFS CID generated → $BARS NFT metadata builder pre-filled
- **$BARS minting**: fill title, description, duration, BPM, key, sample credits → mint on Polygon or Solana (user selects chain)
- **Soundbank view**: all owned $BARS with play previews, mint date, current owner, last sale price
- **Collaboration credits**: field for co-producer, vocalist, and sample source attribution — all go on-chain
- **Licensing terms**: select from standard options (personal use, commercial, sync, exclusive) — terms encoded in token metadata
- **Revenue share setup**: split royalty between up to 3 wallets; SCD Hub 80/15/5 applied on top

**Sound Lab event integration:**
When a Sound Lab session is running during a pon.ink event, the $BARS being produced in real-time can be streamed as a "live mint preview" — participants hear the track before it's minted and can reserve a copy at the live price. This is the primary mechanism for Fana Ka and OT Kulcha live collaboration events.

---

### 2.5 Event Management

pon.ink is the **event registration and coordination layer** for all SCD Hub activities, virtual and physical.

**Event record fields:**
- Name, tagline, description
- Event type: live_session / virtual_workshop / field_day / educational_airdrop / rap_battle / showcase
- Lesson domain
- Date, time, timezone (always shown in EAT + the user's local time)
- Physical location (optional — GPS coordinates or venue name)
- Exotopia settlement binding (hostname + planet for virtual attendance)
- Max participants, POAP supply limit, claim window
- Co-host artists: list of pon.ink handles with their role in the event
- Bundle assignment: which airdrop campaign fires on attendance
- Livestream URL (optional — YouTube, RTMP, or internal Exotopia stream)

**Event lifecycle management:**

```
Draft → Dry Run → Live → Complete → Archived

Draft:     Private; only admin and co-hosts see it
Dry Run:   Full interface active; invited co-hosts can configure; no public claim
Live:      Public; claim codes active; POAP minting open; Exotopia banner live
Complete:  Claim window closes; attendance archived; POAP minting locked
Archived:  Read-only record; ghost replay link available; POAP still viewable
```

**Event discovery:**
Users can browse upcoming events filtered by: group type, lesson domain, artist, settlement planet, date range. Event cards show co-host avatars/orbs, Exotopia planet thumbnail, and a "Claim your spot" button for POAP-gated events.

---

### 2.6 Payments — M-Pesa, Stripe, and Wallet

All transactions on pon.ink apply the **Resonance Split** automatically:
- 80% to the artist / seller wallet
- 15% to the Community Hardware Fund
- 5% to platform maintenance

**Payment methods:**

| Method | Regions | Currency | Use cases |
|---|---|---|---|
| M-Pesa (Africa's Talking STK Push) | Kenya, Tanzania, Uganda | KES | All transactions for +254 users; eco-ops rewards, event payments |
| Stripe | Global | USD, EUR, GBP | International buyers purchasing NFTs or event tickets |
| Algorand wallet | Global | ALGO | Exolocation NFT purchases; on-chain governance |
| Phantom / Solana wallet | Global | SOL, USDC | Station Module, $BARS, EcocitySolution NFT transactions |
| MetaMask / Polygon | Global | MATIC, USDC | $BARS (Polygon), Health Card IDs, Water Quality Certs |

**Net-to-recipient display:**
Every transaction confirmation shows:
- Gross amount
- Split breakdown (80 / 15 / 5)
- **Net to your wallet: [amount] KES / USD**
- Estimated gas fee (if applicable)
- "Confirm" button only after the net amount is clearly shown

**Rate limiting:** M-Pesa STK Push limited to 3 attempts per 5 minutes per phone number. All payment events logged to Supabase audit table with receipt hash.

---

### 2.7 Aftermarket — NFT Secondary Sales

pon.ink hosts the **primary aftermarket** for all SCD Hub ecosystem NFTs. This is where settlement objects, artworks, $BARS soundbanks, and rare airdrops trade hands.

**Aftermarket features:**
- **Listing**: token owner sets price in USD (displayed to buyer also in KES and ALGO/SOL/MATIC equivalents)
- **Search and filter**: by NFT type, settlement planet, lesson domain, artist, price range, rarity
- **Settlement-linked browsing**: clicking "View settlement" from any NFT card routes to that NFT's gallery in Exotopia
- **Offer system**: buyers can make offers below listing price; seller notified via SMS (Africa's Talking) or email (Mailgun)
- **Royalty enforcement**: creator royalty (configurable 5–15% by artist) applied automatically on resale — no platform intervention required
- **Resonance signal**: NFTs with high gallery resonance (see SPEC.md §18.3) are surfaced with a "Community Pick" badge

**Aftermarket revenue feeds into the Earth-beneficial loop** (see SPEC.md §19.5): the 15% Hardware Fund slice on every secondary sale accumulates toward WATSAN equipment purchases for field communities.

---

### 2.8 Messaging Hub

pon.ink's **messaging hub** is the notification and communication backbone.

**Message types supported:**

| Type | Channel | Trigger |
|---|---|---|
| `artist_invite` | Email (Mailgun) | Admin invites artist to event dry run |
| `event_reminder` | SMS (Africa's Talking for +254; Twilio for +1/global) | 1 hour before event starts |
| `airdrop_dispatched` | Email + SMS | Bundle successfully sent to recipient wallet |
| `eco_milestone` | SMS | Eco-ops check-in count crosses milestone threshold |
| `payment_receipt` | Email | Successful M-Pesa or Stripe transaction |
| `offer_received` | SMS + Email | Buyer makes aftermarket offer below listing price |
| `planet_confirmation` | Email + in-app | NASA archive confirms a planet in a proposed location |
| `settlement_visitor` | In-app only | User's settlement crossed a visitor threshold |

All messages are opt-in per category. Default: in-app only. SMS requires explicit opt-in (consent stored in Supabase with timestamp).

---

## 3. Robot Mule System

The **Robot Mule** is the user's AI-adjacent representative in the ecosystem. In pon.ink it appears as a panel in the ExoProperty page; in Exotopia it appears as a 3D figure in the gallery (see SPEC.md §19).

**Mule corpus (pon.ink side):**
The corpus is built through the pon.ink dashboard. Each item the user adds to their corpus makes their Robot Mule smarter and more useful to visitors.

**Corpus management UI:**
- List of all corpus items with type chip, title, preview
- "Add item" form: type selector → title → body text (or asset URL for audio/art)
- Corpus depth meter: visual progress bar toward next Mule tier
- "Preview your Mule greeting" button: shows what a visitor would see when entering the gallery

**Mule greeting assembly:**
The greeting is assembled in this order:
1. Bio note (if present)
2. Dynamic element: visitor count, active event, or most recent eco-ops check-in
3. Call to action: "Explore the gallery" or "View [user]'s latest [NFT type]"

The mule does not generate language. It retrieves and joins corpus items. The user's own words are always the source.

---

## 4. Technical Architecture

### 4.1 Frontend

| Layer | Technology |
|---|---|
| Framework | Quasar (Vue 3) + Vite |
| State | Pinia stores: `user`, `wallet`, `events`, `campaign`, `mule` |
| Routing | Vue Router (hash mode) |
| Styling | Dark monospace aesthetic: `bg-black`, `font-mono`, minimal borders, amber warnings |
| UI library | Quasar components (q-btn, q-card, q-input, q-chip, q-timeline) |

### 4.2 Backend

| Layer | Technology |
|---|---|
| Database | Supabase / Postgres |
| Auth | Supabase Auth (email magic link OTP primary; wallet signature secondary) |
| Edge functions | Supabase Edge Functions (Deno runtime) |
| Messaging | Mailgun (email) · Africa's Talking (SMS +254) · Twilio (SMS global) |
| File storage | Pinata (IPFS NFT assets) · Supabase Storage (UI assets, thumbnails) |

### 4.3 Shared Supabase Tables (with Exotopia)

These tables are owned by the shared Supabase project and readable by both pon.ink and Exotopia:

```sql
eco_ops_checkins      -- written by Exotopia, triggers pon.ink milestone events
eco_ops_milestones    -- written by Supabase DB trigger; consumed by airdrop dispatch
user_addresses        -- written by Exotopia address assignment; bound to ExoProperty
settlement_presence   -- written by Exotopia; drives Robot Mule visitor count
exo_properties        -- written by pon.ink; read by Exotopia for zone color + sphere_id
event_schedule        -- written by pon.ink admin; read by Exotopia event banner
artist_profiles       -- written by pon.ink; read by both platforms for identity
mule_corpus           -- written by both platforms; canonical in pon.ink
```

### 4.4 Blockchain

| Chain | Use |
|---|---|
| Algorand (ARC-3 / ARC-69) | Exolocation NFTs — virtual real estate titles |
| Solana (Metaplex Bubblegum cNFT) | Station Core/Module, EcocitySolution, $BARS (alt) |
| Polygon | $BARS, Health Card IDs, Water Quality Certifications |

---

## 5. Site Features — Current State and Improvements Needed

### 5.1 Features Working Well

| Feature | Page | Quality |
|---|---|---|
| ExoProperty page with zone color, Robot Mule panel, visitor count | `ExoProperty.vue` | Good |
| Airdrop campaign builder (5 triggers, 5 group types, bundle preview) | `AirdropBuilder.vue` | Good |
| "View on Exotopia.org" button in ExoProperty action bar | `ExoProperty.vue` line 199 | Needs 1-line URL fix |
| Nairobi landing page with three archetypes | `Nairobi.vue` | Good |
| Index page with node network visualization | `IndexPage.vue` | Good |
| Dry run mode for events | Multiple pages | Scaffolded |

### 5.2 Improvements Needed — Prioritised

#### Priority 1 — ExoProperty Deep Link Fix (1 hour)
```html
<!-- Current (broken): -->
<q-btn label="View on Exotopia.org" />
<!-- Fix: -->
<q-btn label="View on Exotopia.org"
  :href="`https://exotopia.org/surface/${property.host_star}/${property.exo_planet_id}`"
  target="_blank" />
```
Same fix for "View Gallery":
```html
<q-btn label="View Gallery"
  :href="`https://exotopia.org/surface/${property.host_star}/${property.exo_planet_id}/gallery`"
  target="_blank" />
```

#### Priority 2 — Event Claim Endpoint (2–3 days)
Build `POST /api/event/claim` Supabase Edge Function:
- Validates claim code against `event_schedule`
- Writes `settlement_presence` record (via shared Supabase)
- Dispatches airdrop bundle
- Returns: `{ poap_id, settlement_badge_color, robot_mule_greeting }`

This is the critical path to the Fana Ka demo event. Without it, the POAP → orb → bundle loop cannot complete.

#### Priority 3 — Property Bind Endpoint (1 day)
Build `POST /api/property/bind` Edge Function:
- Called by Exotopia on first eco-ops check-in
- Creates or links ExoProperty record
- Initializes Robot Mule at Foal tier
- Fires `artist_invite`-style welcome message to user

#### Priority 4 — Mule Visitor Increment (1 day)
Build `PATCH /api/mule/:sphere_id/visit` endpoint:
- Called by Exotopia on wormhole arrival at any settlement
- Increments `visitor_count` on Robot Mule record
- Checks threshold → fires `mule_visitor_count` trigger if applicable

#### Priority 5 — Gallery Link in Dashboard (0.5 days)
Add "View Gallery" button to user dashboard beside the existing Exotopia link. This makes the gallery discoverable from the user's daily-use platform without requiring them to navigate 3D space.

#### Priority 6 — Event Discovery Page (2 days)
A `/events` browse page with filter controls. Currently events are only reachable if you know the URL. A public event calendar with upcoming events filtered by lesson domain, group type, and date increases organic discovery and participation.

#### Priority 7 — Aftermarket Browser (3 days)
A `/market` page listing all available NFTs for sale across the ecosystem. Filterable by type, planet, artist, price. Each listing card links to the seller's gallery in Exotopia ("View in settlement"). This is the primary revenue surface for artists.

#### Priority 8 — Impact Dashboard (2 days)
A public-facing `/impact` page showing aggregate ecosystem metrics:
- Total eco-ops check-ins (by activity type and region)
- Water quality readings on-chain
- Total participants across all events
- Hardware Fund balance and recent purchases
- Settlement count by planet

This page is the **grant application evidence page** — designed to be screenshotted and linked in funding proposals.

---

## 6. User Stories — pon.ink Specific

### 6.1 New USA Artist (Glipish DJ)
> *As a DJ and music producer invited to pon.ink as the first North American participant, I want to set up my creative space on a dry run basis, configure my Robot Mule with my bio and sound corpus, preview my airdrop bundle before the event, and link my music to a virtual settlement in Exotopia — so that when the live event fires, everything is in place and my work is permanently on record.*

### 6.2 Field Worker (Uni-Kibaoni, Lamu)
> *As a field worker who logs water quality readings for the Mpeketoni recycling proposal, I want my check-ins to automatically trigger milestone NFT rewards and an SMS notification when I reach a threshold — so that I know my real work is being recognised and my on-chain certifications are building without me having to navigate complex interfaces.*

### 6.3 Event Organiser (Fana Ka)
> *As the organiser of a Fana Ka rap battle, I want to build the airdrop campaign with the POAP claim trigger, set the Exotopia settlement as the event location, and monitor real-time claim progress during the event — so that participants receive their bundle the moment they engage, and the event is permanently recorded with a verifiable attendance list.*

### 6.4 Visual Artist (_am_lunchmeat)
> *As a visual artist who creates paintings that inspire reflection on contemporary survival, I want to mint my paintings as NFTs with proper provenance and attribution, display them in my gallery on Exotopia, and earn royalties on secondary sales — so that my creative work generates both cultural reach and sustainable income.*

---

## 7. Open Questions for pon.ink

- **Wallet custodial layer:** First-time users without a wallet need a custodial option that holds their NFTs safely. What provider? What the transition path to self-custody looks like is not yet decided.
- **$BARS licensing enforcement:** On-chain licensing terms are encoded in metadata. How are they enforced in practice if a buyer violates them? SCD Hub's position on this needs to be documented before $BARS launches publicly.
- **M-Pesa reverse flow:** When an artist earns KES from an NFT sale, how does the reverse flow work? STK Push is inbound only. Africa's Talking B2C payment may be the answer. Needs confirmation.
- **Galaxy discovery:** How do new users in Kenya and East Africa discover pon.ink? Current organic channel is live events. A referral system or regional SMS campaign may be needed.
- **Robot Mule V2 — domain specialist (local-network AI):** V2 is a purpose-built specialist assistant, not a general-purpose chatbot. A local-network AI (no LLM, no external cloud connection) reviews and compiles the corpus within five defined knowledge domains:

  1. **Educational advocacy materials** — translating real-world community development work into viable, shareable educational content that can support funding applications, grant reporting, and public advocacy.

  2. **Business planning metrics** — supporting community business planning with relevant data frameworks, cost models, and impact metrics drawn from the settlement's eco-ops record.

  3. **Community water system health** — tracking, analysis, and plain-language reporting on water quality data, infrastructure status, and maintenance schedules for the local water network.

  4. **Youth career development in environmental engineering** — guidance pathways, module completion tracking, and resource curation supporting young people building careers in WATSAN, renewable energy, and related environmental fields.

  5. **Hub Approvideo library maintenance** — curating, cataloguing, and keeping current the community's approved video resource library; flagging outdated content and surfacing relevant new materials across the five domains above.

  The Mule's corpus is structured around these domains. The local AI reviews and compiles it into safe, domain-appropriate responses. Settlement owners and facilitators interact with the knowledge database through a dedicated UI — browsing, editing, and approving what the Mule represents in each domain. No cloud inference. No external data exposure. The corpus remains fully sovereign to the community.

---

*Cross-reference: `SPEC.md` (Exotopia) · `SPEC_ECOCITY.md` (ecocity.com) · `pon_ink_exotopia_integration.md` (integration points)*
*GPL v3 · SCD Hub · Community owns its data*
