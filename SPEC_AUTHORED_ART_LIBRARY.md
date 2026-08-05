# SPEC_AUTHORED_ART_LIBRARY.md — Authored 3D/2D Asset Library, Grouped by Source Library

**SCD Hub · Exotopia.org · Draft — v0.2 · GPL v3**
*Living document — extends the asset-loader scaffolding (`src/lib/asset-loader.ts`) landed this pass.
§5's Q1–Q3 are resolved as of v0.2; see each answer inline. The Ecology & Biodiversity grouping
gets its own document, `SPEC_ECOLOGY_ADJACENT_DOMES.md`, per Q3.*

---

## 1. What this is

A place to plan authored art (3D models, textures) as an organized **library of groupings**,
where each grouping is driven by an existing data catalogue already in the repo — not a loose pile
of one-off assets. The first grouping is **Technologies**: one 3D model per real-world PFAS
remediation method already cataloged in `src/data/pfas-methods-library.ts`
(`REMEDIATION_METHODS`), so a decontamination project's chosen method
(`decon_projects.method_proposal_id` → `method_proposals.method_key`) can eventually be
*represented*, not just named in text.

This is a **planning document, not an implementation** — the scaffolding it plans against
(`asset-loader.ts`'s `tryLoadGLTF`/`tryLoadTexture`, cache-by-URL, fail-soft-to-null) already
exists and already ships one grouping's worth of drop-in folders
(`public/assets/settlement-items/`, `public/assets/planets/`, `public/assets/portal/`, from the
prior pass). §5 below is unresolved by design — see the open-questions list before any of it is
built.

## 2. Relationship to the existing (symbolic) asset scaffolding

`public/assets/settlement-items/` (from the prior pass) is a **different kind of asset** than what
this spec is about, and the distinction matters for how each should look:

| | `settlement-items/` (existing) | Technologies grouping (this spec) |
|---|---|---|
| Represents | An abstract achievement/contribution (Signal Beacon, Resonance Crystal, Community Monument…) | A real, named piece of remediation equipment (a GAC filter vessel, an IX resin skid…) |
| Source of truth | `ITEM_MESH_PRESETS` in `settlement-items.ts` — no external data, just a label/color/zone | `REMEDIATION_METHODS` in `pfas-methods-library.ts` — a real catalogue with mechanism/limitations/citations already written |
| Art direction | Stylized sci-fi settlement decor | Should read as identifiably *that* technology — a GAC vessel and an IX skid should not be visually interchangeable, the way two settlement reward objects can share a family look |
| Acquisition | Certificate-gated or eco-ops-built (`ItemAcquisitionType`) | `'eco-ops'`, tied to real logged decon-project work — resolved in §5, Q1 |
| Recolor | Not recolored once a `.glb` exists (`item.color` unused) | Same convention — literal, untinted. Resolved in §5, Q2 |

Both groupings will likely share the same *loader* mechanism (`tryLoadGLTF`, cache-by-URL,
fail-soft) — this spec is about extending `ASSET_PATHS` and the drop-in folder convention with a
second, source-linked category, not about building new loading machinery.

## 3. Grouping 1 — Technologies (PFAS remediation methods)

One `.glb` per `REMEDIATION_METHODS[].key`, matching `pfas-methods-library.ts` exactly so the key
never has to be translated between the data layer and the asset layer:

| `key` | Name | Media | Maturity |
|---|---|---|---|
| `gac` | Granular Activated Carbon (GAC) filtration | water | established |
| `ix` | Ion Exchange (IX) resin | water | established |
| `membrane` | High-pressure membrane filtration (RO/NF) | water | established |
| `foam-fractionation` | Foam fractionation | water | established |
| `in-situ-stabilization` | In-situ soil stabilization/solidification | soil | established |
| `electrochemical-oxidation` | Electrochemical oxidation | water | emerging |
| `scwo` | Supercritical Water Oxidation (SCWO) | both | emerging |
| `phytoremediation` | Phytoremediation (plant-based uptake) | soil | emerging |

`media` is a useful art-direction cue: `water` methods are plausibly tank/vessel/pipe assemblies;
`soil` methods (`in-situ-stabilization`, `phytoremediation`) are plausibly ground-level/planted
forms, not vessels — worth designing to that distinction rather than one generic "industrial box"
silhouette repeated 8 times.

### 3.1 Linked info (the actual stated priority for this grouping)

Per the planning discussion, the primary improvement this grouping delivers is **the model plus
its existing catalogue data shown together, accessibly** — not the model alone. `pfas-methods-library.ts`
already has real written content per method (`mechanism`, `chainLengthNote`, `costNote`,
`limitations`, `citations`) that nothing in the 3D view surfaces today. Wherever a Technology model
renders (a settlement dome, per Q1 below), interacting with it (click/tap, matching the existing
hover-then-click pattern `DomeInteriorPage.vue`/`StationInteriorPage.vue` already use for other
items) should open a panel showing that method's real text — the model is the *entry point* to the
library entry, not a decoration standing apart from it. This is a UI wiring detail, not a new data
requirement — `pfas-methods-library.ts` already has everything needed.

## 4. The extensibility mechanism (future groupings)

Same shape as `SPEC_COMMUNITY_NODES.md` §2's `node_type` mechanism, applied to asset groupings
instead of database rows — adding a grouping should never require touching the loader itself:

1. Add one `ASSET_PATHS` entry (a `(key) => path` function) in `asset-loader.ts`, keyed off that
   grouping's existing source catalogue — never a hand-maintained duplicate list of keys.
2. Add one `public/assets/<grouping>/README.md` documenting the exact filenames (mirroring
   `settlement-items/README.md`'s format), generated from the source catalogue's keys so it can't
   drift out of sync.
3. Wire one call site where that grouping is actually rendered (see §5 — undetermined for
   Technologies specifically).

Candidate future groupings, **not scoped in this pass** — named here only so the mechanism above is
validated against more than one example before it's built:

- **Ecology & Biodiversity field kit** — `public/ot6a.json`'s Ecology & Biodiversity subcategories
  (from this session's library work) suggest field-technique props (a bird-blind silhouette, a
  quadrat frame, a soil-core sampler) rather than one model per video.
- **Microplastics sampling equipment** — same library, Microplastics area — a manta trawl, a
  filtration rig.

Both would need their own source-catalogue shape decided first (unlike Technologies, `ot6a.json`
entries are videos, not equipment records — there is no existing `key`-per-prop list to key art
off of yet). Flagged, not designed, here.

## 5. Resolved decisions

**Q1 — Where does a Technology asset render? → the owner's personal dome, via the mechanism that already exists.**
Correction from v0.1: no schema change is needed. `PfasCitizenSciencePage.vue` already has this
solved for `decon-site-marker` — `attachMarker()` (lines ~296-323) is a **manual, client-initiated**
action: the signed-in owner picks which of *their* settlements (`useSettlements()`) to attach to
from a dropdown, then calls `useSettlementItems(settlementKey).addItem()` directly, writing
`{ type: 'eco-ops', meshPreset: 'decon-site-marker', color: statusMarkerColor(project.status) }`
into that settlement's local item list. `decon_projects.branch_settlement_id` (the exo-branch-v1
research table) is unrelated to this — it's the "simulated vs. real" framing, not the dome-attachment
mechanism. Resolved: Technology models follow the exact same manual-attach pattern, just letting
the owner also pick *which* technology model (from the project's `method_proposals.method_key` if
it has one) instead of always attaching the generic marker. No migration required — this is
UI wiring on top of what `settlement-items.ts`/`asset-loader.ts` already provide.

**Q2 — Recolor or literal? → literal, untinted.**
Technology models follow the same convention as authored reward objects (`item.color` unused once
a `.glb` exists) — a GAC vessel looks like a GAC vessel. Project status (`planning`/`active`/
`monitoring`/`complete`) should surface some other way — e.g. a small separate status chip in the
linked-info panel (§3.1) — rather than tinting the model itself, since these are meant to read as
identifiable real equipment, not palette-matched decor.

**Q3 — Scope. → Technologies is the primary/first-built grouping.**
Ecology & Biodiversity is real second-grouping work, but reframed from the original "field-kit
props tied to `ot6a.json` video entries" idea in §4 to something bigger: procedurally-**generated**
biome layouts (forests / water systems / ecosystem-effect gardens) in an **adjacent dome**, for
settlers whose primary citizen-science mode is ecology work rather than decon-tech work. That's
enough of its own architecture (a settlement doesn't currently have more than one dome) to warrant
its own document rather than a subsection here — see `SPEC_ECOLOGY_ADJACENT_DOMES.md`.
`§4`'s Microplastics-equipment idea remains flagged-not-designed, unchanged.

## 6. Follow-on work identified during planning, not designed here

Resolving Q1 (technology objects living in a member's personal dome) surfaced a related but
distinct need: once real settlements carry real citizen-science content, people need ways to
*find* that across the population of settlements, not just decorate their own. Raised in
discussion, each is a real feature, not a one-line addition:

- **A real scoreboard for settlements** — `src/pages/CosmosPage.vue` already has a "leaderboard"
  tab, but it ranks arbitrary exoplanets by a synthetic habitability-style score computed from raw
  catalog fields (distance/temperature/star-teff) — it has no connection to actual member
  settlements or `public.member_points` (the view migration 002 already built "for a future
  leaderboard" and which nothing currently reads). Making this real means ranking actual owned
  settlements by actual `reward_events`/certificate data.
- **A solar-system scan of settlements** — given a system (a `hostname`), show which real
  settlements/community nodes exist there, distinct from today's static gallery listing.
- **Invite-to-network** — a way for a settler to send another person an invite that starts a
  `connections` row (the same green-light mechanism already gating comment/mentor-session
  visibility, per `001_blog_comments.sql`), rather than connections only forming after both people
  already have accounts and happen to find each other.

Recommend a dedicated `SPEC_SETTLEMENT_DISCOVERY.md` (or similar) planning pass for these three
together, since they share a foundation (real settlement/member data surfaced outward) — not
scoped or designed further in this document.

## 7. Related documents

- `src/data/pfas-methods-library.ts` — the source catalogue Grouping 1 keys off
- `src/lib/asset-loader.ts` — the loader scaffolding both groupings will share
- `public/assets/settlement-items/README.md` — format precedent (glTF 2.0 `.glb`, pivot/scale/poly
  conventions) this spec's asset format should match unless a reason emerges not to
- `supabase/migrations/002_rewards.sql` — `public.member_points`, the unused view behind §6's
  scoreboard item
- `supabase/migrations/003_pfas_citizen_science.sql` — `decon_projects`/`branch_settlements` schema
  behind Q1
- `SPEC_COMMUNITY_NODES.md` §2 — the extensibility-mechanism pattern §4 mirrors
- `SPEC_ECOLOGY_ADJACENT_DOMES.md` — Grouping 2, split out per Q3
