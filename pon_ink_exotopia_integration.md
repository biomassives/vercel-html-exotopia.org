# pon.ink ↔ Exotopia Integration Assessment
*April 19, 2026 — Greg Willson / SCD Hub*

---

## Overview

Both platforms are further along than they appear in isolation. pon.ink has a complete
airdrop campaign builder (`AirdropBuilder.vue`), a property detail page (`ExoProperty.vue`)
with a "View on Exotopia.org" button already in the action bar, a Robot Mule presence
system, and a trigger architecture that maps directly onto Exotopia's missing features.
Exotopia has the visualization, the chronometer, the wormhole transit, and a nearly-complete
settlement surface. The gap is identity and events — which pon.ink already has the
scaffolding to provide.

This document identifies the five concrete integration points, what each requires, and
the order to build them.

---

## 1. Integration Point Map

### 1.1 "View on Exotopia.org" — Already Wired, Needs URL

**pon.ink file:** `ExoProperty.vue` line 199  
**Current state:** Button renders, href is empty  
**What's needed:** Deep-link format confirmed between both projects

The ExoProperty action bar already has:
```html
<q-btn outline color="white" label="View on Exotopia.org" icon="open_in_new" class="font-mono q-px-lg" />
```

The `property.exo_planet_id` field (`"Kepler-452b"`) maps to Exotopia's route
`/surface/:hostname/:planetName`. The hostname is `property.host_star` (`"Kepler-452"`).

**Required change (pon.ink, 1 line):**
```html
<q-btn outline color="white" label="View on Exotopia.org" icon="open_in_new"
  class="font-mono q-px-lg"
  :href="`https://exotopia.org/surface/${property.host_star}/${property.exo_planet_id}`"
  target="_blank"
/>
```

**No Exotopia changes needed.** Route already handles `/surface/:hostname/:planetName`.
This is a same-day fix — it enables any pon.ink property holder to jump directly to
their Exotopia settlement.

---

### 1.2 Event Attendance POAP ↔ Settlement Presence

**This is the primary integration for Fana Ka and OT Kulcha events.**

**pon.ink side:** `AirdropBuilder.vue` — trigger `event_attendance`:  
> "POAP code scanned at a live or virtual event"

**Exotopia side:** MVP P4 (settlement presence, named orbs)

**The bridge:** When Exotopia hosts an event at a settlement, it displays an event QR code
in the settlement UI. Scanning or entering the claim code:
1. Confirms the user's attendance in Exotopia (writes presence record to Supabase)
2. Fires pon.ink's `event_attendance` trigger → airdrop bundle dispatched (POAP + any
   attached music NFT, art NFT, or eco data)
3. User's named orb appears in the settlement for other participants

**Architecture:**

```
Event organiser creates campaign in AirdropBuilder
  → selects "event_attendance" trigger
  → sets claim code + supply limit
  → pon.ink stores: { event_id, claim_code, bundle_id, settlement_planet }

During Fana Ka rap battle:
  User arrives at Exotopia settlement (/surface/Kepler-442/Kepler-442+b)
  → settlement shows "Event active: Fana Ka Rap Battle [Claim POAP]" banner
  → user clicks banner → claim dialog opens → enters code
  → Exotopia writes: settlement_presence record (user present)
  → Exotopia calls pon.ink webhook: POST /api/event/claim
      { claim_code, user_id, wallet_address?, planet_id }
  → pon.ink validates code, dispatches bundle
  → response includes: { poap_id, settlement_badge_color }
  → Exotopia: named orb appears, badge colour from POAP tier
```

**New infrastructure needed:**
- `POST /api/event/claim` endpoint in pon.ink (consumes claim code, fires airdrop)
- Event schedule table in Supabase (shared between both platforms or replicated)
- Claim dialog in Exotopia settlement UI

**Effort:** 2–3 days (spans both codebases). This is the critical path to the Fana Ka demo.

---

### 1.3 Eco-Ops Check-In ↔ eco_ops_milestone Trigger

**pon.ink trigger:** `eco_ops_milestone`  
> "Contamination event confirmed in Supabase node network"

**Exotopia:** MVP P2 — eco-ops check-in form (writes to `eco_ops_checkins` table)

**The bridge:** The Exotopia check-in form already plans to write to Supabase. If both
platforms share the same Supabase project (or pon.ink polls/subscribes to `eco_ops_checkins`
via real-time), milestones can fire automatically.

**Milestone rules (to define with SCD Hub team):**
- First check-in from a new user → triggers address assignment + welcome POAP
- 10th submission from a specific node (e.g., Lamu recycling drive) → milestone bundle fires
- Contamination flag confirmed by 3+ field workers → environmental NFT issued

**Architecture (Supabase-only, no webhook required):**
```
eco_ops_checkins table:
  { id, user_id, planet_id, activity_type, node_id, timestamp, milestone_hit? }

Supabase database function / trigger:
  ON INSERT INTO eco_ops_checkins
    → count submissions for node_id
    → if count reaches milestone threshold: INSERT into eco_ops_milestones
    → pon.ink subscribes to eco_ops_milestones via real-time → fires airdrop
```

This keeps both platforms loosely coupled through shared Supabase state.

**Effort:** 1 day (after MVP P2 check-in form exists). Mostly Supabase configuration.

---

### 1.4 Settlement Visits ↔ Robot Mule Visitor Count

**pon.ink trigger:** `mule_visitor_count`  
> "Property Mule reaches a visitor count threshold"

**pon.ink display:** `ExoProperty.vue` lines 155–157  
Shows `property.robot_mule.visitor_count` with a "Social fluency" progress bar.

**The bridge:** Every wormhole arrival at a settlement in Exotopia is a Robot Mule visit.
When a user transits to a planet, Exotopia increments that planet's mule visitor count in
Supabase.

**Game loop:**
```
User travels to Kepler-452b via wormhole
  → Exotopia writes settlement_presence record
  → POST to pon.ink: PATCH /api/mule/{sphere_id}/visit
      { visitor_id, planet_id, source: 'exotopia_transit' }
  → pon.ink increments visitor_count on robot_mule record
  → if visitor_count crosses threshold: mule_visitor_count trigger fires
  → bundle dispatched to property owner
```

**ExoProperty.vue already renders the state.** The visitor count goes up as people explore
the galaxy. Property owners are rewarded for having an interesting, visited settlement.

**Effort:** 1 day. Requires pon.ink `PATCH /api/mule/:sphere_id/visit` endpoint.

---

### 1.5 Address Assignment ↔ ExoProperty Sphere Binding

**Exotopia:** MVP P3 — `assignAddress(userId)` picks a planet deterministically

**pon.ink:** `property.sphere_id` field (`"EXO-SPHERE-0147"`) and `property.exo_planet_id`

**The bridge:** When Exotopia assigns a user their planet (after first eco-ops check-in),
it should register that assignment with pon.ink so that a corresponding ExoProperty record
is created or linked.

**Binding protocol:**
```
User submits first eco-ops check-in
  → Exotopia: assignAddress(userId) → planet = "Kepler-442 b", hostname = "Kepler-442"
  → Exotopia writes to user_addresses table
  → POST to pon.ink: /api/property/bind
      { user_id, wallet_address?, exo_planet_id, hostname, address_string,
        sphere_id: hash(user_id) }
  → pon.ink creates or links ExoProperty record for that user
  → ExoProperty.vue "View on Exotopia.org" link becomes live
  → Robot Mule initialized at Foal tier (0 corpus items)
```

This is how a check-in in Nairobi results in a property visible on pon.ink within seconds.
The full cycle — real work → virtual address → NFT property page — completes in one flow.

**Effort:** 1 day. Requires pon.ink `POST /api/property/bind` endpoint.

---

## 2. Integration Order (aligned with MVP sprint)

| Step | Integration | Depends on | Effort | Demo value |
|---|---|---|---|---|
| 1 | "View on Exotopia.org" deep link (pon.ink 1-line fix) | Nothing | 1 hour | High — immediate |
| 2 | Address binding: check-in → property bind | MVP P2 + P3 | 1 day | Critical — closes the loop |
| 3 | Event claim: POAP code → presence + airdrop | MVP P4 | 2–3 days | Critical — Fana Ka demo |
| 4 | Eco-ops milestone → bundle trigger | MVP P2 | 1 day | High — Uni-Kibaoni field |
| 5 | Settlement visits → Robot Mule count | MVP P4 | 1 day | Medium — retention game loop |

---

## 3. What Exists in pon.ink Today That Exotopia Can Use Immediately

These are working features in pon.ink that require **no new pon.ink code** — only Exotopia
consuming them.

| Feature | pon.ink location | Exotopia use |
|---|---|---|
| ExoProperty deep link | `ExoProperty.vue` line 199 (1-line fix) | Settlement header badge links back to pon.ink NFT |
| Bundle templates by group type | `AirdropBuilder.vue` lines 371–405 | Community drop screen in Exotopia shows bundle preview for their group type |
| Lesson domains | `AirdropBuilder.vue` lines 455–463 | Eco-ops check-in `lesson_domain` field matches these exactly |
| Zone color palette | `ExoProperty.vue` lines 260–268 | Exotopia settlement dome color could reflect favorable_zone from the NFT |
| POAP trigger `event_attendance` | `AirdropBuilder.vue` trigger list | Exotopia event banner "Claim your POAP" flows into this |
| Robot Mule greeting | `ExoProperty.vue` lines 308–312 | Exotopia settlement welcome modal can surface the mule greeting |

---

## 4. Shared Supabase Tables (to create once, read from both)

Rather than duplicating data across two Supabase projects, these tables should live in a
single shared Supabase project readable by both pon.ink and exotopia.org.

```sql
-- Owned by the shared project
eco_ops_checkins      -- written by Exotopia, read by pon.ink milestone triggers
eco_ops_milestones    -- written by Supabase trigger, consumed by pon.ink airdrop
user_addresses        -- written by Exotopia P3, read by pon.ink property binding
settlement_presence   -- written by Exotopia P4, read by pon.ink mule visitor counter
exo_properties        -- written by pon.ink, read by Exotopia (zone color, sphere_id)
event_schedule        -- written by pon.ink admin, read by Exotopia event banner
```

Both apps use the same Supabase anon key for reads. Writes are scoped by row-level security
to the platform that owns each table.

---

## 5. What Not to Build in This Sprint

These integrations are desirable but would expand scope beyond what the May 2 demo requires.

| Feature | Why defer |
|---|---|
| Robot Mule conversational API in Exotopia settlement | Requires WebSocket; mule greeting as static text is sufficient for demo |
| pon.ink generative art linked to planet surface palette | Art generation not yet wired; use zone color from property record instead |
| $BARS token display in settlement | Wallet adapter deferred to v1.1 |
| Aftermarket (OpenSea/Rarible) links in settlement | NFT minting not yet live |
| M-Pesa distribution trigger from settlement | Payment rail deferred to v1.2 |

---

## 6. Demo Narrative With Integration Active

With steps 1–3 complete, the Fana Ka demo script gains a new chapter:

```
[User arrives at Kepler-442 b settlement via wormhole]
  Settlement banner: "Fana Ka Rap Battle — LIVE NOW — 47 participants"
  User taps "Claim POAP"
  → Enters claim code from event host
  → Named orb appears in the settlement

[After event]
  User opens pon.ink app
  → ExoProperty page shows their settlement: "Resonance Fields"
  → Robot Mule: "Welcome back. 47 people visited during the battle."
  → Assets: Fana Ka POAP + "Pain in the Ghetto" music NFT now in bundle
```

This is the complete loop: real community event → virtual presence → permanent NFT record.

---

*Cross-reference: `mvp_launch_apr20-2026.md` (P1–P4), `SPEC.md` §17 (settlement presence),  
`../pon.ink/SPEC_EXOTOPIA_INTEROP.MD` (webhook contracts)*
