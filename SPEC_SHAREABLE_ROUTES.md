# Shareable Deep Links — Spec

**Version:** 0.1 (draft)
**Date:** 2026-08-04
**Status:** Draft

---

## 1. Goal

A user should be able to copy the URL at nearly any point in the visualization — a specific
galaxy cluster, a member galaxy, a star system, a planet surface, a specific pan/zoom position
on the DefenderNav strip — send it to someone else, and have them land on **the same place**,
not just the same page.

---

## 2. Current state: the path hierarchy is solid, the view state isn't captured

Exotopia's route hierarchy (`src/router/routes.ts`) already encodes *which object* you're
looking at as path segments — `/cluster-galaxy/:clusterSlug/:memberId`,
`/surface/:hostname/:planetName`, `/xcluster/:xid`, and so on. That part already works: a URL
to a specific galaxy or planet reliably opens that galaxy or planet.

What's missing is *how you're looking at it* — camera position, zoom, pan offset, selected
sub-object. That state exists today only as scattered, page-specific query params with no
shared convention:

| Page | Param(s) | What it captures |
|---|---|---|
| `GalaxyPage.vue:2896-2897` | `focusHost`, `contextView` | Which system is focused, camera context |
| `GalaxyPage.vue:2893` | `hz` | Habitable-zone filter toggle |
| `SurfaceViewPage.vue:2941` | `at`, `cam` | Surface camera position (presence-only check, not fully read back) |
| `SurfaceViewPage.vue:864` | `parent` | Parent object name for breadcrumb |
| `ClusterGalaxyPage.vue:394` | `bearing` | Camera bearing angle |
| `ClusterGalaxyPage.vue:163` | `action=claim` | Deep-links straight into the claim flow |

Four different naming conventions, four different pages, and most viz pages (`XClusterPage`,
`ClusterSystemPage`, `ClusterInteriorPage`, `VoidGalaxyPage`, `CosmosPage`) capture **no** view
state at all — a shared link to those always opens on the default camera position, even if the
sender was looking at something specific. **DefenderNav's own pan/zoom state
(`viewOffset`, `zoomCurrent` in `src/components/DefenderNav.vue`) isn't in the URL at all** —
worth calling out specifically since it's the piece of navigation UI this session's other work
concerned.

---

## 3. Proposed convention

A small, fixed set of query param names, reused wherever a page has the corresponding concept
— not every page needs every param, but no page should invent its own name for a concept
another page already has a name for.

| Param | Meaning | Used by (today or after rollout) |
|---|---|---|
| `at` | id of the currently focused/selected object (planet, galaxy, gallery node) | SurfaceViewPage (exists) → extend to ClusterGalaxyPage, ClusterSystemPage |
| `cam` | Compact camera position encoding (implementation TBD — likely `lat,lon,dist` or similar, not raw XYZ) | SurfaceViewPage (partial) → extend everywhere a free camera exists |
| `zoom` | Numeric zoom level | New — maps directly to `DefenderNav`'s `zoomCurrent`, `GalaxyPage`'s zoom state |
| `pan` | Pan/view-offset along a strip's primary axis | New — maps directly to `DefenderNav`'s `viewOffset` (degrees) |
| `bearing` | Camera bearing/azimuth | ClusterGalaxyPage (exists) — keep name, reuse elsewhere |
| `parent` | Parent object for breadcrumb context | SurfaceViewPage (exists) — reuse as-is |

Rename `focusHost`/`contextView` to `at`/(fold into existing page context) during rollout so
`GalaxyPage` matches the shared convention rather than keeping a fourth name for the same
concept.

---

## 4. Implementation shape

- **New composable: `src/composables/useShareableView.ts`.** Each viz page opts in by
  declaring which of the params above it supports. On mount, reads matching query params and
  applies them to initial camera/zoom/pan state (falling back to today's defaults if absent or
  malformed — no query param may ever be able to break a page, mirroring the graceful-fallback
  philosophy already established in `useClusterGalaxyData.ts`'s 3-stage data fallback). Exposes
  a `buildShareUrl()` function that serializes current state back into the same param set.
- **`router.replace`, not `router.push`, for state-only updates** — this pattern already exists
  (`GalaxyPage.vue:1501`: `router.replace({ query: { focusHost: sys.hostname } })`) specifically
  so panning/zooming doesn't spam the back-button history with every frame of interaction. Keep
  it, and make sure any new `pan`/`zoom` writes for DefenderNav follow the same
  debounced-replace pattern rather than firing on every `redraw()`.
- **A visible "Copy link" affordance.** Currently sharing a URL means manually copying the
  address bar, which only works for pages that already read their own query params back (a
  minority). Add one small, consistently-placed share icon/button — DefenderNav's header bar
  (`src/components/DefenderNav.vue`, alongside the existing zoom-slider/collapse-toggle row) is
  a natural home since it's present across `system`/`surface`/`cosmic` modes — that calls
  `buildShareUrl()` and copies to clipboard.

---

## 5. Rollout order

1. Standardize the params that already exist under inconsistent names (`focusHost` → `at`) —
   no new capability, just consistency, low risk.
2. Add `zoom`/`pan` support to `DefenderNav.vue` — directly reuses this session's `viewOffset`/
   `zoomCurrent` state, and is the most concrete, already-scoped piece of this spec.
3. Extend `at`/`cam` coverage to `XClusterPage`, `ClusterSystemPage`, `ClusterInteriorPage` —
   the pages with currently zero view-state capture.
4. Add the "Copy link" affordance once at least DefenderNav's own state round-trips correctly.

---

## 6. Out of scope for this pass

- Encoding animated/time-based state (e.g. a binary star's current orbital phase) — freezing a
  shareable link to a single instant is enough for v1; resuming "live" animation state is a
  later refinement if it turns out to matter.
- A URL shortener or vanity-link service — plain query params are sufficient; don't build
  backend infrastructure for this.
