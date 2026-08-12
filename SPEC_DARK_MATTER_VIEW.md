# Dark Matter View — Spec

**Version:** 0.1 (draft)
**Date:** 2026-08-04
**Status:** Draft

---

## 1. What exists today, and why it's not enough

The cosmic view (`CosmicPage.vue`) has three view-mode toggles, rendered as pills on
`DefenderNav`'s header bar (`src/components/DefenderNav.vue`, `VIEW_MODES`):

| Pill | Label | What it actually does |
|---|---|---|
| `natural` | NAT | Default render |
| `xray` | X-RAY | Recolors the wormhole conduit meshes orange (`CONDUIT_XRAY`, `onCosmicViewModeChange` in `CosmicPage.vue`) |
| `dark_matter` | DK.MAT | Recolors conduits purple + scales them up (`CONDUIT_DKM`) + shows a static text panel ("void-edge conduit network") |

Neither mode touches a single cluster's actual data. X-ray mode's own tooltip claims it
"highlights hot gas, clusters, and AGN" (`DefenderNav.vue` `VIEW_MODES` description) — it does
none of that; it recolors a decorative wormhole. DK.MAT is a half-step further (it at least
gestures at a real concept — dark matter filaments concentrating at void edges — with a legend),
but still touches nothing about any specific cluster's actual measured mass.

**This spec removes the X-RAY pill and replaces DK.MAT's content with a real one**, built on
data this app already ships: every named cluster's `public/clusters/*-members.json` file already
carries a real `M200_1e14` (total mass) and `rvir_mpc` (virial radius) — the same figures the
recent 13-cluster literature research pass verified (`SPEC_XCLUSTER_STARSYSTEMS.md` §5). Nothing
new needs to be fetched to build the core of this; it needs to be drawn.

---

## 2. What "real" means here — and the one honest limit

Companion post: [blog-dark-matter-in-exotopia.md](blog-dark-matter-in-exotopia.md) makes the
scientific case in full; the short version for the spec is the same distinction that runs
through this project's other data work (`blog-counting-the-universe.md`): **halo extent is
real and generalizable; a resolved dark-matter distribution map is real but not
generalizable.**

- **Halo-extent overlay (all 15 named clusters + extendable to X-ray clusters):** every named
  cluster has a real, cited `M200_1e14`/`rvir_mpc`. Drawing a translucent sphere at that radius,
  centered on the cluster, is a true statement about that cluster's real measured mass extent —
  it doesn't need to claim anything about the halo's internal shape or density profile to be
  honest, just its size and total mass.
- **Resolved offset map (Bullet Cluster only):** the pink-gas / blue-mass separation is a real,
  specific, published 2D projected mass reconstruction (Clowe et al. 2006) — it exists for
  exactly one object in this app's featured set. Building a generic version of this for every
  cluster would be fabricating data no one has measured. It stays a one-off, explicitly labeled
  as the Bullet Cluster's own real image, not a template.
- **Conduit/filament framing (existing, keep):** the "dark matter filaments converge at void
  edges" idea behind the current conduit recoloring is real large-scale-structure cosmology
  (filaments actually do connect at these densities), but this app has no real filament-map
  dataset — so this stays exactly what it already honestly is, a stylized thematic overlay, not
  measured data. Keep the legend saying so.

---

## 3. Changes

### 3.1 Remove the X-RAY pill

`src/components/DefenderNav.vue`:
- `ViewMode` type: `'natural' | 'xray' | 'dark_matter'` → `'natural' | 'dark_matter'`.
- `VIEW_MODES` array: drop the `xray` entry.

`src/pages/CosmicPage.vue`:
- `cosmicViewMode` type, `onCosmicViewModeChange` signature: drop `'xray'`.
- Remove `CONDUIT_XRAY`; the `mode === 'xray' ? CONDUIT_XRAY :` branch collapses to a plain
  `mode === 'dark_matter' ? CONDUIT_DKM : CONDUIT_NAT`.
- Any other `xray`/`X-RAY` references tied to this *view-mode* toggle specifically (not the
  X-ray *cluster* catalog/route, which is unrelated and unaffected — `xrayCluster`,
  `/xcluster/:xid`, `xrayLodEntries` all stay exactly as they are; the Takey2013 X-ray cluster
  catalog and the view-mode pill are unrelated concepts that happen to share the word "X-ray.")

### 3.2 Halo-extent overlay, active in `dark_matter` mode

For each named cluster with an active LOD entry (`activeNamedLodEntry`, populated by the
existing `spawnNamedStarField`/`despawnNamedStarField` lifecycle in `CosmicPage.vue`), add a
translucent sphere mesh sized from that cluster's real `rvir_mpc` (converted to scene units via
the existing `MPC_SCALE`/`VSPREAD` constants already used elsewhere in this file), centered on
the cluster's existing scene position, visible only when `cosmicViewMode === 'dark_matter'`.

- **Geometry:** a low-poly `THREE.SphereGeometry`, additive-blended, radial-gradient-style
  material (dense near center, fading to the `rvir_mpc` edge) — cheap to render, doesn't need to
  look like anything more precise than "this is roughly how big and how massive the invisible
  part is."
- **Color:** distinct from the existing conduit purple (`0xcc55ff`) so the two don't read as the
  same thing — suggest a cooler, dimmer violet-grey (something like `0x6a5a9c`, low opacity
  ~0.12–0.18) so cluster galaxies stay legible through it.
- **Label:** on hover/click, a small readout using data already on the cluster object: mass
  (`M200_1e14 × 10¹⁴ M☉`), virial radius (`rvir_mpc` Mpc), and — where derivable — a rough
  visible-vs-total fraction (member galaxy luminosity proxy vs. M200; doesn't need to be
  precise, "≈X% of this cluster's mass is outside what you can see" is the honest framing, not
  a precise baryon-fraction claim per §2).
- **Lifecycle:** spawn/despawn alongside `spawnNamedStarField`/`despawnNamedStarField` exactly
  like the LOD star field already does, just gated additionally on `cosmicViewMode ===
  'dark_matter'` — reuse the existing near/far hysteresis, don't build a second one.

### 3.3 Bullet Cluster resolved-offset image (one-off)

When the Bullet Cluster specifically is the active/selected cluster in `dark_matter` mode, show
a small inset image or overlay reproducing the real Clowe et al. 2006 pink/blue composite (X-ray
gas in pink, lensing mass contours in blue) — sourced from a real public-domain/CC astronomy
image (NASA/Chandra press release imagery is public domain; confirm exact usage terms before
shipping), not a from-scratch recreation. Labeled explicitly as "the actual measurement for this
cluster" to contrast with the generic halo-extent spheres shown everywhere else — the contrast
*is* the point, and should be legible in the UI copy itself ("this is the one place we're
showing you the real map, not an estimate of the extent").

### 3.4 Conduit/filament panel — keep, retitle

Keep the existing `.dm-overlay` text panel and conduit recoloring largely as-is — it's already
honestly framed ("filament / dark matter wall" in the legend, not "here is a filament map"). Two
small edits: drop the "prototype" ambiguity by being explicit it's thematic (e.g. "a stylized
stand-in for real large-scale-structure filaments — this app doesn't have a filament survey
dataset"), and reference the new halo overlay in the panel body so a user encountering both in
the same mode understands they're two different kinds of claim (measured cluster mass extent vs.
thematic filament framing).

### 3.5 X-ray clusters (Takey2013, 345 clusters)

Out of scope for the first pass — those clusters only have `tap_kev`/`dist_mpc`/`z` today (see
`SPEC_XCLUSTER_STARSYSTEMS.md`), no `M200`. A T_x–M scaling relation could derive an approximate
mass the same way that spec proposes deriving `system_architecture` for them, but ship the
halo-extent overlay for the 15 named clusters first (where the mass is real, cited literature,
not a formula) before extending to a formulaic estimate for 345 more.

---

## 4. Open questions

- Confirm the halo-sphere color/opacity doesn't muddy the existing conduit purple in the same
  scene when both are visible at once — may need to test side-by-side before committing to the
  exact hex value in §3.2.
- Confirm licensing/usage terms for the specific Bullet Cluster composite image before shipping
  it (§3.3) — NASA/Chandra press imagery is generally public domain, but verify the specific
  asset's terms rather than assuming.
- The visible-vs-total mass fraction readout in §3.2 needs a defensible "visible mass" proxy —
  worth a quick pass to confirm member luminosity data (Schechter LF magnitudes already used in
  the population generators) is usable for this, or if it should be dropped in favor of just
  mass + radius (safer, still honest, less to get wrong).

---

## 5. Related documents

- `blog-dark-matter-in-exotopia.md` — the research/explainer companion this spec implements.
- `SPEC_XCLUSTER_STARSYSTEMS.md` §5 — the calibration research this spec's real M200/r_vir
  values ultimately trace back to; also where the X-ray-cluster extension (§3.5 above) would
  hook in.
- `SPEC_DEFENDERNAV.md` — `VIEW_MODES` pill definitions live in `DefenderNav.vue`, spec'd there.
