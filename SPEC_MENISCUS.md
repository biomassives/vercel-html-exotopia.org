# EXOTOPIA — MENISCUS: Neighbor Layers, Discovery & Citation System
**SCD Hub · SPEC v0.1 · GPL v3**
*Living document — extends [SPEC_DEFENDERNAV.md](SPEC_DEFENDERNAV.md), [SPEC_GAMETHEORY.md](SPEC_GAMETHEORY.md), [SPEC.md](SPEC.md) §§1–6*

---

## §0. Naming & Scope

**Meniscus** (working name): the curved interface where one scale of view meets the next — cosmic ↔ system, system ↔ neighbors, data ↔ its source. Four capabilities, one spec, because they share a data path (the exoplanet/eco-ops collection → scored/cited → surfaced in the strip → rewarded):

1. **§2 Surprise Me** — a real "random entry point" feature into the 6,298-system collection, weighted toward scientifically notable systems.
2. **§3 Neighbor Radar** — extends DefenderNav's existing Earth↔System inset from a single Sol-tether into a small radar of *procedurally/graph-nearby* objects (visited history + wormhole conduits + galleries), not raw parsec distance.
3. **§4 Citation Model** — attaches real paper/DOI references to both exoplanet data fields and library resources.
4. **§5 Unified Library** — merges `EcoLibrary.vue`'s video/resource system with `docs/` + `notebooks-and-guides/` into one schema, migrated in one pass.
5. **§6 Incentive Extension** — citation and data-contribution credit flows through the *existing* DRK-E/QNT-P activity-score economy and bounty-claim workflow — no new token, no new scoring system.

These decisions were confirmed in Q&A on 2026-07-15 and are treated as fixed for this draft; re-open only with explicit reason.

---

## §1. Current State Audit

| Piece | Where | Status |
|---|---|---|
| DefenderNav meta-tabs (`+1`/`+2`) | `DefenderNav.vue` `drawMetaOrrery` / `drawMetaGalaxy` | Built. Full-canvas zoom-out views, not composited with the strip. |
| Earth↔System inset | `DefenderNav.vue` `drawContextInset` | Built. Shows **only** Sol vs. current system (RA/Dec/distPc → 2D direction). No neighbor systems, no history. |
| View-mode pills (NAT/X-RAY/DK.MAT) | `DefenderNav.vue` `VIEW_MODES` | Built as **exclusive** picks (`viewMode` single ref) — not composited layers. Out of scope here; noted for future work. |
| Quick-transit strip / visit history | `DocPage0.vue` docs reference; local storage, most-recent-12, de-duped by route | Built and running today. This *is* the seed of a navigation graph — reuse it, don't rebuild it. |
| Wormhole conduits | `src/data/cosmic-structures.ts` `buildConduits`, `WormholeConduit` type | Built. Placed at void peripheries; one conduit per void. |
| Activity-score economy (DRK-E / QNT-P) | `SPEC_GAMETHEORY.md` §2–3 | Built spec, non-purchasable, earned via dwell/capture. Has defined unlock ladders — extend, don't fork. |
| Bounty / field-record workflow | `.github/ISSUE_TEMPLATE/bounty-field-record.yml`, `data/submissions/`, `docs/eco-ops-workflow-guide.md` | Built. `data/templates/water-quality-record.json` already has a `bounty_issue` field — citation field is a natural sibling. |
| Eco-ops resource library | `EcoLibrary.vue` | Built. Tabbed by domain, editable, exports JSON, has a `dirty`/`saveToRepo` localhost path. No citation field on any video entry. |
| Narrative docs | `docs/eco-ops-workflow-guide.md`, `docs/git-collaboration-guide.md`, `notebooks-and-guides/` | Built but separate from EcoLibrary — different nav, different schema. |
| Exoplanet collection | `public/topo-params.json` | 6,298 systems. Rich `meta` block per entry (`pl_eqt`, `pl_rade`, `pl_bmasse`, `pl_orbper`, `pl_orbeccen`, `st_teff`, `st_age`, `st_met`, `disc_year`, `disc_method`). No notability score, no citations, no "random/surprise" entry point anywhere in the codebase. |
| Cosmic-web coverage | `public/clusters/*.json` (15 clusters), `public/void-galaxies/` (Boötes only: `bootes-detail.json`, `bootes-viz.json`) | Named clusters are broad; void interiors are Boötes-only. Gap noted for §7. |
| Data provenance page | `DataCoveragePage.vue` | Built. Explains *what* is shown and *where from*, in prose — no per-field citation links yet. |

---

## §2. Surprise Me — Weighted Random Discovery Entry Point

### §2.1 Placement

A persistent control, not a buried menu item — it needs to be discoverable the way the bounty/claim workflow is discoverable. Two entry points:

- A `⟡ SURPRISE ME` pill in the DefenderNav header, next to the existing `⊙` event-finder button (same visual language, same row).
- A `/discover` route that does the same thing without requiring an active scene (for onboarding / cold-start users, per `OnboardPage.vue`).

### §2.2 Notability score

Computed **offline**, once, by a new script `scripts/generate-notability-scores.py` (sibling to the existing `scripts/generate-topo-params.py`), writing `public/notability-scores.json`: `{ [systemKey]: score }`. Not computed client-side — 6,298 entries, deterministic, cheap to precompute.

```
score(entry) =
    w1 · eccentricity_extremity(pl_orbeccen)      // |e − 0.3| inverted; very high or very low e is notable
  + w2 · recency(disc_year)                       // linear ramp, full weight for disc_year >= currentYear-2
  + w3 · atmosphere_confirmed(atm_confirmed)       // flat bonus — confirmed atmosphere beats modeled
  + w4 · surface_confirmed(surface_confirmed)      // flat bonus
  + w5 · extremity(pl_bmasse, pl_rade, insolation) // z-score vs. population distribution, clipped
  + w6 · detected_molecules_count                  // more detected molecules = more notable
  + w7 · has_citation                              // §4 — cited systems get a bonus once citations exist
```

Weights (`w1..w7`) live in the generator script as named constants, not magic numbers — this is a tuning knob the eco-ops/science team should be able to adjust without touching TypeScript.

Reference example already in hand from this session: **TOI-4562 c** (e=0.122 on its own isn't extreme, but sibling TOI-4562 b's long-period high-eccentricity warm-Jupiter status is the kind of story-worthy entry the scorer should surface — confirms the scoring needs a system-level aggregate, not pure per-planet scoring, since notability often lives on a sibling planet or the host star).

### §2.3 Selection algorithm

```typescript
// src/composables/useSurpriseMe.ts
function pickSurpriseSystem(recentlyVisited: string[]): SystemKey {
  const pool = notabilityScores.entries()
    .filter(([key]) => !recentlyVisited.includes(key))   // reuse quick-transit history — no immediate repeats
  const weighted = pool.map(([key, score]) => [key, Math.pow(score, 1.5)])  // soften long-tail dominance
  return weightedRandomPick(weighted)
}
```

`recentlyVisited` is read directly from the existing quick-transit local-storage list (`DocPage0.vue`'s documented mechanism) — do not create a second history store.

### §2.4 Transit and reward

Clicking Surprise Me triggers the same portal sequence as any cross-level DefenderNav target (`SPEC_DEFENDERNAV.md` §6), landing in `system` mode at the chosen host. On arrival, award a flat `+3 QNT-P` "discovery bonus" (small, matches existing capture-scale rewards in §3.4 of `SPEC_GAMETHEORY.md`) — this is the only new incentive hook this feature needs; it rides the existing economy per §6.

---

## §3. Neighbor Radar (extends the Earth↔System inset)

### §3.1 Confirmed direction: procedural/graph distance, not parsecs

The existing inset (`drawContextInset`) answers "how far is Sol?" The new radar answers **"what's reachable from here, and how?"** — nearness is defined by the platform's own navigation graph, not RA/Dec/parsec math. This is deliberate: it rewards exploration and conduit-building activity over raw astrophysical proximity, and it reuses data structures that already exist instead of requiring new astrometric computation.

**Graph edges**, in priority order:
1. **Wormhole conduits** (`WormholeConduit` in `cosmic-structures.ts`) — 1 hop, always shown first.
2. **Visit history** (quick-transit strip, most-recent-12) — systems the user has personally connected to this one by navigating between them in the same session/history window.
3. **Orbital galleries co-located at this system** (`OrbitalGalleryEntry[]`, already passed into `systemData.galleries`) — 0-hop, "you're already adjacent to these."
4. **Saved settlements** (existing settlement inventory, `SettlementInventory.vue`) — counts as a graph edge if the user owns a settlement at another system.

### §3.2 New inset: replaces/extends `drawContextInset`

Rename conceptually to **Neighbor Radar** — same bottom-right box, same aesthetic (`#010810` bg, cyan cores, `Courier New` labels — no new visual language per `SPEC_DEFENDERNAV.md` §9). Instead of one Sol dot + one system dot, it plots up to 5 graph-nearest nodes around a center dot (current system), radially, sized/labeled by edge type:

```
┌ NEIGHBOR RADAR ──────────┐
│         ◈ Kepler-16      │   ◈ = wormhole conduit (cyan diamond)
│    ✦          ·          │   ✦ = visited system (amber dot)
│      ● (you)             │   ⬠ = gallery here (violet, 0-hop, drawn at center ring)
│         ·        ◈       │   · = saved settlement (teal dot)
└───────────────────────────┘
```

### §3.3 Data model addition

```typescript
// src/lib/defender-nav.types.ts — additive, does not remove currentSystemRef
export interface NeighborRadarEntry {
  hostname:   string
  edgeType:   'conduit' | 'visited' | 'gallery' | 'settlement'
  hopWeight:  number        // 0 = co-located, 1 = direct edge, fades further out for chained edges
}

export interface DefenderNavData {
  // ...existing fields unchanged...
  neighborRadar?: NeighborRadarEntry[]   // resolved by parent page before redraw(), max 5 entries
}
```

Parent pages (`GalaxyPage.vue`, `SurfaceViewPage.vue`) build `neighborRadar` from the three sources in §3.1 before calling `redraw()`, same pattern as `stellarConfig` resolution already documented in `SPEC_DEFENDERNAV.md` §11.

### §3.4 Click behavior

Clicking a radar node fires the same fly-to/portal split as any DefenderNav target (§5 of `SPEC_DEFENDERNAV.md`): conduit and gallery nodes are 0/1-hop same-network → portal transit; visited/settlement nodes → portal transit to that system's `/galaxy?focusHost=` route.

### §3.5 Scope guard

Per the confirmed answer, this ships in **`system` mode only** for v1. `surface` and `cosmic` modes keep the existing simpler inset unchanged — do not generalize until system-mode usage validates the graph-distance model.

---

## §4. Citation Model

Citations attach in **both** places, per the confirmed answer — one schema, two attachment points.

### §4.1 Shared citation shape

```typescript
// src/lib/citation.types.ts (new file)
export interface Citation {
  doi?:        string          // preferred — e.g. "10.3847/1538-3881/ad1234"
  url?:        string          // fallback when no DOI (agency reports, preprints without DOI)
  title:       string
  authors?:    string          // "Smith et al." — not a full author list, keep it short
  year:        number
  sourceType:  'peer_reviewed' | 'preprint' | 'agency_report' | 'field_protocol'
}
```

### §4.2 Attachment point A — exoplanet data fields

`public/topo-params.json` entries gain an optional `citations` block scoped to the `meta` fields it supports — not every field needs a citation, only the ones a specific paper actually measured:

```jsonc
"meta": {
  "pl_orbeccen": 0.122,
  // ...
  "citations": {
    "pl_orbeccen": [{ "doi": "10.3847/...", "title": "TOI-4562: warm Jupiter on eccentric orbit", "year": 2024, "sourceType": "peer_reviewed" }]
  }
}
```

Populated incrementally — `scripts/fetch-exoplanet-archive.mjs` already pulls `st_age`/`st_met`/`pl_dens`/`st_lum` per the existing generator; extend it to also pull the NASA archive's `pl_refname` / `disc_refname` fields (the archive already carries reference strings) rather than hand-curating 6,298 citations.

**Surfaced**: `DataCoveragePage.vue` gets a per-field citation footnote in its existing explainer grid; DefenderNav tooltips (`SPEC_DEFENDERNAV.md` §4) gain an optional citation line when the hovered object has one.

### §4.3 Attachment point B — library resources

Every entry in the unified library (§5) — video, doc, dataset — gains an optional `citations: Citation[]` field in its schema. This is hand-curated (eco-ops team knows which paper a PFAS video is based on), not scraped.

### §4.4 Why both, concretely

Attachment point A gives the *cosmic* side scientific grounding (why does this planet look the way it does). Attachment point B gives the *eco-ops* side the same grounding (why does this protocol recommend this threshold). Both feed §6's incentive extension identically — a contribution is "cited work" whether it's a field record or a data correction.

---

## §5. Unified Library — Schema-First, Single Migration

Per the confirmed answer: no incremental phase. Design the end-state schema, migrate `EcoLibrary.vue`'s video resources and `docs/` + `notebooks-and-guides/` together.

### §5.1 Unified resource schema

```typescript
// src/lib/library.types.ts (new file — supersedes EcoLibrary's private area/sub/video types)
export type ResourceKind = 'video' | 'doc' | 'dataset' | 'guide'

export interface LibraryResource {
  id:          string            // stable slug
  kind:        ResourceKind
  domain:      string            // 'PFAS' | 'Forest Gardening' | 'Rain Gardens' | 'Bird Blinds' | ... existing EcoLibrary areas, plus 'Platform' for what's currently docs/
  title:       string
  description?: string
  tags?:       string[]
  citations?:  Citation[]        // §4.3
  // kind-specific:
  videoUrl?:   string            // kind === 'video'
  docPath?:    string            // kind === 'doc' | 'guide' — path into docs/ or notebooks-and-guides/
  datasetPath?: string           // kind === 'dataset' — path into data/templates or data/submissions
}

export interface LibraryDomain {
  domain:     string
  icon:       string
  accent:     string
  resources:  LibraryResource[]
}
```

### §5.2 Migration mapping

| Source | Becomes |
|---|---|
| `EcoLibrary.vue` video entries (per area/subcategory) | `LibraryResource` with `kind: 'video'`, `domain` = existing area name |
| `docs/eco-ops-workflow-guide.md` | One `LibraryResource` per `##` section, `kind: 'doc'`, `domain: 'Platform'` (or split by the domain each section covers, e.g. its PFAS section → `domain: 'PFAS'`) |
| `docs/git-collaboration-guide.md` | `kind: 'guide'`, `domain: 'Platform'` |
| `notebooks-and-guides/*` | `kind: 'guide'` or `kind: 'dataset'` per file, `domain` inferred from filename/content |
| `data/templates/*.json` | `kind: 'dataset'`, linked from the domain that uses it (e.g. `water-quality-record.json` → `domain: 'PFAS'` / water quality) |

### §5.3 UI

`EcoLibrary.vue`'s existing tab/tile/edit/export/save-to-repo interaction pattern is reused wholesale — it already does everything the unified library needs (tabbed by domain, badge counts, edit mode, JSON export, localhost repo-write). The migration is a **data-model change under an existing UI**, not a UI rewrite. Add one new top-level filter: kind (`video`/`doc`/`dataset`/`guide`) alongside the existing domain tabs.

### §5.4 Where citizen vs. professional scientists land

Professional-scientist-facing content (papers, dataset schemas, methodology docs) and citizen-facing content (how-to videos, field protocols) live in the **same** unified library, distinguished by `kind` and tag filtering — not a separate professional portal. This matches the platform's existing "reward the doers" principle in `SPEC.md` §0: no walled garden between contributor types.

---

## §6. Incentive Extension — No New Economy

Per the confirmed answer, citation/data-contribution credit extends `SPEC_GAMETHEORY.md`'s existing DRK-E/QNT-P ladders and the bounty-claim workflow. No new token, no new score.

### §6.1 New bounty template field

`.github/ISSUE_TEMPLATE/bounty-field-record.yml` and `data/templates/water-quality-record.json` gain an optional `citations` array (§4.1 shape) alongside the existing `bounty_issue` field. A submission that includes a peer-reviewed citation is flagged for a QNT-P bonus at claim-bot review time (`.github/workflows/bounty-claim.yml`).

### §6.2 New QNT-P unlock rung

Add one row to the existing table in `SPEC_GAMETHEORY.md` §3.4 rather than a parallel table:

| QNT-P | Effect |
|---|---|
| 20 | **Cited Contributor** badge — submission's citation appears with attribution in `DataCoveragePage.vue` and the unified library resource card |

Placed between the existing 15 and 30 rungs — small enough to be reachable by a single well-documented field submission, not a grind gate.

### §6.3 Professional scientists specifically

The confirmed answer keeps this inside the existing economy rather than a separate co-authorship system — but professional contributors are not expected to care about DRK-E/QNT-P as gamification. Their actual incentive is the **Cited Contributor badge + permanent attribution** (§6.2), which is a reputation artifact, not a token. The scoring mechanism is plumbing; the badge and public attribution are the real reward. This should be stated explicitly in the eventual PR/doc so the framing doesn't read as "professional scientists must grind XP."

---

## §7. Known Gaps / Explicitly Out of Scope for v1

- **Composited view-mode layers** (NAT+X-RAY+DK.MAT simultaneously) — flagged in §1, not built here. Revisit after Neighbor Radar ships and its canvas-budget impact (`SPEC_DEFENDERNAV.md` §10.3, 3ms/frame budget) is measured.
- **Void interior data beyond Boötes** — `public/void-galaxies/` only has Boötes detail. Surprise Me's notability scorer will therefore never surface void-interior discoveries outside Boötes; this is a data gap, not a scoring bug. Worth a follow-up spec for `scripts/fetch-bootes-void.mjs`-equivalent generators for other named voids.
- **Automated citation scraping for library resources** (§4.3) — hand-curated only in v1; NASA archive auto-pull is scoped to §4.2 exoplanet fields only, where the archive already carries reference strings.
- **`surface`/`cosmic` mode Neighbor Radar** — explicitly deferred per §3.5.

---

## §8. Open Questions for Next Round

1. Notability weights (`w1..w7` in §2.2) — should these be reviewed by whoever curates the eco-ops science content, or is an engineering first-pass fine to ship and tune later from usage data?
2. §6.1's claim-bot QNT-P bonus — does awarding it require a human reviewer to verify the citation is real (DOI resolves, paper actually supports the claim), or is presence-of-a-DOI-shaped-string sufficient for v1 with abuse handled later?
3. §5.2 migration — who does the actual content move (docs/notebooks-and-guides → unified schema) — scripted best-effort conversion, or manual pass per file given the domain-inference step isn't fully mechanical?
