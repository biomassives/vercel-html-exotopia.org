# Fixing the Descent, Not Just the Click

## A review of every click-to-descend path across our 15 named clusters and 345 X-ray clusters found one dead-end already patched, one silent accuracy bug, and one crash waiting for our own generation pipeline to ship. Here's what we found and fixed.

*SCD Hub / Exotopia.org — August 2026*

---

Exotopia's cosmic navigation has a chain: galaxy view → cluster interior → cluster galaxy → star system, each level a click deeper. Clicking a galaxy inside a cluster is supposed to feel identical whether that cluster is one of our 15 hand-placed named clusters or one of the 345 real X-ray clusters from the Takey et al. 2013 NASA/HEASARC catalog. It doesn't, quite — and the gap between "should feel identical" and "does" is what this pass was about: not adding a feature, but checking whether the transition and click-to-descend layer actually holds up across every generated object set we ship, not just the one it was most recently tested against.

## The starting point: one dead end, already fixed

A recent fix (commit `aeda0a9`) closed a real dead end. In the Local Void and Boötes Void clusters — the two catalogs whose members carry a `cluster_zone` field and get the ring-shaped `VoidDefenderNav` overlay — clicking a galaxy on the outer ring used to just fly the camera over and select it, leaving you on a details panel with an "Explore Star Systems" button you had to find and click a second time. The fix was one line: the ring click now calls the same `exploreGalaxy()` function the button already used, so the ring is a real one-click shortcut instead of a detour. Good fix, and because the void classification is data-driven (any cluster whose members carry `cluster_zone` gets this behavior automatically) rather than hardcoded to a cluster name, it already covers both void clusters correctly.

But it only covers two of our clusters. The other 360 — 13 named clusters with real astrophysics and 345 X-ray clusters — go through a different code path entirely, and nobody had checked whether *it* holds up the same way.

## What "properly accommodated" actually meant to check

We have three tiers of generated data behind these clusters, and they're at very different stages:

- **13 named clusters** (Virgo, Coma, Fornax, Perseus, and ten others) have real Stage-1 generated star-system documents in `public/star-systems/`.
- **Local Void and Boötes Void** — the two clusters with the ring UI — have *no* generated star-system data at all; every galaxy in them falls back to procedural generation.
- **345 X-ray clusters** have galaxy positions and morphology (`public/galaxy-oracle/`, 26,225 galaxies) but zero generated star-system content. Every single one is currently rendered by the procedural fallback path. The generator scripts `SPEC_XCLUSTER_STARSYSTEMS.md` proposes for this tier — `enrich_xcluster_architecture.py`, `generate_xcluster_starsystems.py` — don't exist yet.

That third tier is the actual "new generated object set" this review was about: not new files that landed this week, but the 345-cluster set our own roadmap is about to start generating real content for. The question worth asking now, before that pipeline ships, is whether the frontend that will render it is actually ready — and going through the full descent chain end to end turned up three places where it wasn't.

## What we found

**1. Real morphology and distance were being computed, passed, and then silently thrown away.** Both descent paths — `XClusterPage.vue` and `ClusterInteriorPage.vue` — build a `morph` query parameter from the real oracle data before navigating to the galaxy-interior view. `ClusterGalaxyPage.vue` never read it. Worse, the X-ray tier has no `/clusters/{slug}-members.json` catalog (that file only exists for the 13 named clusters), so the galaxy-data loader's fallback stage always fired — and it hardcoded every X-ray-cluster galaxy to a generic elliptical at a fixed 65 Mpc, regardless of whether the real oracle said `cD` at 2,313 Mpc or `Sb` at 340 Mpc. No error, no console warning about the mismatch — just quietly wrong. We threaded the dropped `morph` parameter through as a fallback hint, and added a small cached lookup against `clusters-xray.json` (the same file that already supplies the cluster-level distance shown in the X-ray cluster header) so the real distance is used instead of the placeholder. This was wrong for all 345 clusters today, not a future risk — it's the first thing fixed.

**2. Five places assumed a `star_systems` array that our own spec says won't always be there.** `SPEC_XCLUSTER_STARSYSTEMS.md` proposes that most of the ~26,000 non-anchor X-ray galaxies get a lightweight generated document with no `star_systems` array at all, to keep the generation pipeline's output size sane. Five call sites across `useClusterGalaxyData.ts`, `ClusterGalaxyPage.vue`, and `ClusterInteriorPage.vue` read `doc.star_systems.length` or `.slice(...)` directly, with no null-check. None of them have broken yet, because every document we fetch today — generated or procedural — happens to include the array. They would break, with a hard crash, the moment the pipeline described in our own spec starts shipping the lightweight documents it proposes. We added the guards now, ahead of that work, rather than after the first bug report from it.

**3. The X-ray-cluster descent was a hard cut.** Every other transition between views in this app — cluster interior to galaxy, galaxy to star system, the void ring shortcut — goes through the same lightning/iris scene-transition effect. The X-ray cluster path (`XClusterPage.vue → navigateToGalaxy`) never called it; it was a plain route push. Visually inconsistent with everything else in the descent chain, so we wired it up to match.

**4. Void classification only checked the first member of a catalog.** `isVoid` was `!!clusterData.value?.members[0]?.system_architecture?.cluster_zone` — reading one field off one array element to classify an entire cluster. If a catalog were ever built incrementally (a real possibility once cluster generation is automated) and its first member happened to be missing that field while later members had it, the whole cluster would silently lose its ring navigation. Changed to check across all members instead of just the first.

## What this doesn't claim

This pass didn't generate any new star-system content, and it didn't change how many of the 345 X-ray clusters have real astrophysics behind them — that's still zero, honestly, until the generation scripts referenced above actually get written and run. What changed is narrower and, we think, more important to get right first: the code that will render whatever that pipeline produces no longer silently discards the real data it's handed, no longer hardcodes a placeholder morphology and distance in its place, and won't crash on the exact document shape our own spec says is coming. Quality here isn't a new feature — it's making sure the parts of the app that already touch every one of the 345 clusters treat all of them the same way the two clusters they were actually tested against.

## References

- `src/composables/useClusterGalaxyData.ts` — three-stage galaxy data loader (generated → members catalog → procedural fallback) and the new `GalaxyDocHints` morph/distance passthrough
- `src/pages/XClusterPage.vue`, `src/pages/ClusterInteriorPage.vue`, `src/pages/ClusterGalaxyPage.vue` — the two descent chains that converge on a shared galaxy-interior view
- `SPEC_XCLUSTER_STARSYSTEMS.md` — the 345-cluster generation plan this review checked the frontend's readiness against
- Commit `aeda0a9` — the void edge-ring fix that prompted this broader review
