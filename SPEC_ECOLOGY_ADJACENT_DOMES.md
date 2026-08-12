# SPEC_ECOLOGY_ADJACENT_DOMES.md — Generated Biome Layouts in an Adjacent Dome

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Living document — Grouping 2 of `SPEC_AUTHORED_ART_LIBRARY.md` (split out per that document's §5, Q3).
Planning only — nothing in this document is built yet.*

---

## 1. What this is

A second, optional dome per settlement for settlers whose primary citizen-science mode is
**ecology work** rather than decon-tech work — so the Technologies grouping
(`SPEC_AUTHORED_ART_LIBRARY.md`) isn't the only visible outcome of doing real field work in this
app. Instead of one model per cataloged item (Technologies' approach — 8 methods, 8 models), this
grouping is **simple generated layouts** from a small authored prop kit: **generated forests**,
**water systems**, and **ecosystem-effect gardens**. A settler doing ecology/biodiversity field
work gets a place that visibly reflects that, the same way a decon-tech settler's dome now can.

This is explicitly scoped **simple** per the planning discussion — a small number of curated
layout presets scattered from a prop kit, not a procedural ecosystem simulation.

## 2. Architecture: one optional additional dome per settlement

Today (`src/lib/settlements.ts`) one `SettlementRecord` = one dome, addressed by one
`settlementKey` (`surfaceKey`/`moonKey`/etc.), rendered by `DomeInteriorPage.vue` or
`StationInteriorPage.vue`. There is no multi-dome concept anywhere in the codebase yet. Proposed,
kept deliberately minimal:

- Each settlement gains **at most one** additional dome — an "Ecology Annex" — not an arbitrary
  N-dome graph. (Flagged as Q1 below in case that's too restrictive.)
- Reached via a short transition from inside the primary dome — visually and mechanically the same
  pattern `LocalStepPortal`/`local-step-portal.ts` already established for the cluster-system →
  planet-surface "gateway" transition, re-themed rather than reinvented: a doorway/archway prop in
  the primary dome's `gateway` zone that, on interaction, plays a brief transition and swaps the
  rendered scene to the annex.
- `SettlementRecord` (`src/lib/settlements.ts`) gains an optional field:
  ```ts
  ecologyAnnex?: {
    unlocked:   boolean
    biomeType:  'forest' | 'water-system' | 'ecosystem-garden'
    layoutSeed: string      // deterministic scatter seed, same pattern as settlementHue()
    unlockedAt: string      // ISO 8601
  }
  ```
  One biome type active at a time for v1 (changeable, not additive) — see Q2.

## 3. The three layout types

Each is a **small authored prop kit** (Grouping 2's asset sub-groupings, following
`SPEC_AUTHORED_ART_LIBRARY.md` §4's extensibility mechanism — one `public/assets/ecology-<type>/`
folder per kit) plus a **deterministic scatter algorithm**, not hand-placed items:

| Layout | Prop kit (indicative, not final — for the artist to size against) | Scatter pattern |
|---|---|---|
| Generated forest | 3–5 tree/shrub variants | Poisson-ish scatter across the annex footprint, seeded, density fixed for v1 (not tied to a point total — see Q3) |
| Water system | Pond/stream-segment/reed-cluster props | A single curated arrangement (pond + 1–2 stream segments), not a scatter — "system" implies a connected layout, not random placement |
| Ecosystem-effect garden | Mixed planting bed props (a handful of species-coded bed types) | Grid-ish bed layout around the annex perimeter, seeded species selection per bed |

Scatter/placement reuses the seeded-RNG convention already established elsewhere in the codebase
(`mulberry32` in `CosmosPage.vue`, `seededRng` in `CosmicPage.vue`, `settlementHue()`'s
`hashStorageKey`-derived seed in `settlement-items.ts`) — `layoutSeed` above should derive from the
settlement key the same way `settlementHue()` does, so a given settlement's annex looks the same
every time it's rendered rather than re-randomizing per visit.

## 4. Acquisition — resolved, data side done

**Update: the logging table now exists.** `supabase/migrations/009_ecology_biodiversity.sql` adds
`ecology_sites` → `ecology_projects` → `ecology_log_entries`, mirroring
`focus_areas`/`decon_projects`/`project_log_entries` exactly, plus a `points_catalog` entry
(`ecology_field_log`, 6 pts, self-reportable, daily cap 2 — same values as `decon_progress_log`).
`ecology_sites` additionally carries an `access_status` lifecycle (`unresearched` →
`map_research_done` → `inquiry_sent` → `access_confirmed`/`not_required`) that `focus_areas` doesn't
have, backed by `src/data/ecology-fieldwork-library.ts` (map-research guidance, a site-type →
contact-pathway table, and a letter-of-inquiry generator) and surfaced in
`src/pages/EcologyCitizenSciencePage.vue` at `/ecology-citizen-science`.

So Q3's original either/or is resolved on the **data** side: real ecology field work now has
somewhere to log to, the same evidentiary basis `decon-site-marker` has via `decon_progress_log`.
**What's still unbuilt is everything in §2-§3 above** — the annex dome itself, the transition into
it, and the three generated-layout prop kits. `ecology_field_log` activity existing is what would
gate `'eco-ops'`-type annex access (matching `decon-site-marker`'s acquisition convention) once
that's built — this section no longer blocks on data, only on the 3D/routing work.

## 5. Open questions

**Q1 — Exactly one annex, or could a settlement eventually want more than one biome type at once?**
v1 above assumes one annex, one active biome type (switchable). If a settler doing both forest and
water-system work wants both simultaneously, that's a bigger multi-dome-graph feature, not a v1
scope item — confirm v1's single-annex/single-type assumption is right before building the
transition/routing machinery around it.

**Q2 — Switching biome types: does the old layout's props just disappear?**
Given `layoutSeed` is deterministic per settlement, switching `biomeType` regenerates a different
scatter from the new kit — the old one isn't "saved" anywhere. Fine for v1 (matches "simple"), but
worth confirming a settler won't feel like they lost something they'd grown attached to.

**Q3 — Resolved: real logging table shipped, decorative-only question is now moot.**
`009_ecology_biodiversity.sql` is built (§4) — annex access can be gated on real `ecology_field_log`
activity from day one, no decorative-only fallback needed. What remains open is purely the annex
itself: no dome-transition/routing work, no scatter-placement code, and no prop-kit art exist yet.
Treat "build the annex" as its own follow-up scoped from §2-§3 above, now unblocked on the data
side.

## 6. Related documents

- `SPEC_AUTHORED_ART_LIBRARY.md` — Grouping 1 (Technologies) and the extensibility mechanism this
  document's prop kits follow
- `src/lib/settlement-items.ts` — `settlementHue()`/seeded-color precedent for `layoutSeed`
- `src/lib/local-step-portal.ts` — the transition-effect precedent for the primary-dome → annex
  gateway
- `supabase/migrations/009_ecology_biodiversity.sql` — the real logging table §4 describes, shipped
- `src/data/ecology-fieldwork-library.ts` / `src/pages/EcologyCitizenSciencePage.vue` — the
  map-research → letter-of-inquiry → access-confirmed workflow now live at `/ecology-citizen-science`
- `public/ot6a.json` — the existing Ecology & Biodiversity video library referenced in §1
