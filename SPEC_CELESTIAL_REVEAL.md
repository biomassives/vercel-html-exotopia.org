# SPEC: Celestial Reveal — Linked Navigation & Real Imagery Integration

**Status:** Proposed  
**Date:** 2026-05-31  
**Scope:** Navigation completeness, LOD-driven image reveal, real observatory archive integration  
**Relates to:** SPEC_GALAXY_CLUSTER_VIEWER.md, SPEC_STARSYSTEM_ALGORITHM.md, SPEC_DEFENDERNAV.md

---

## 1. Motivation

Every object the user can see in Exotopia should be a door — something they can approach, click, and pass through to a deeper level of detail. Today, the five-level hierarchy (cosmic → cluster → galaxy → system → surface) is mostly implemented for the named-cluster path, but several chains are broken, and all visuals are procedurally generated. No real observatory imagery is shown anywhere.

This spec defines:
1. How to close every navigation gap so every visible object goes somewhere.
2. A progressive-reveal image system that blends procedural art into real science imagery as the user approaches.
3. Integration strategy for the three major public archives: **Webb (JWST)**, **Hubble (HST/HLA)**, and **Chandra (CXC)**.

---

## 2. Current Navigation Audit

### 2.1 Working chains

| From | To | Route |
|------|----|-------|
| CosmicPage cluster sphere | ClusterInteriorPage | `/cluster-interior/:slug` |
| ClusterInteriorPage galaxy row | ClusterGalaxyPage | `/cluster-galaxy/:slug/:memberId` |
| ClusterGalaxyPage system node | ClusterSystemPage | `/cluster-system/:slug/:memberId/:sysIdx` |
| ClusterSystemPage planet | ClusterSurfacePage | `/cluster-surface/:slug/:memberId/:sysIdx` |
| CosmicPage event beacon | CosmicPage fly-to | (in-page camera) |

### 2.2 Broken / missing chains

| Object visible | Expected destination | Current state |
|---------------|---------------------|---------------|
| X-ray cluster sprites (345 in public/clusters-xray.json) | ClusterInteriorPage or generated cluster view | **Dead end** — no click handler leads anywhere |
| GalaxyPage star field points | ClusterSystemPage or SurfaceViewPage | **Dead end** — scatter plot has no outbound nav |
| GalaxyPage system preview panel | ClusterSurfacePage | **Dead end** — "Enter Surface" not wired |
| PlanetSystemsPage entries | ClusterSystemPage | **Stub** — page exists but nav path unclear |
| Cosmic void shells (wireframe) | Void interior or void-edge wormhole | **Dead end** — no click target |
| Wormhole conduit markers | E8 portal transit | **Partially specced** in SPEC_DEFENDERNAV, not implemented |
| ClusterGalaxyPage X-ray/generated galaxies (no named entry) | Procedural system view | Missing for galaxies that have no named members catalog |

### 2.3 Image state

All textures are canvas-generated procedurally. No fetch from external archives. The `anchor_telescope` field in `system_architecture` names the source observatory but doesn't link to any actual image asset.

---

## 3. Design Principles

**Reveal-on-approach.** The user's camera distance determines information density. The further away, the more schematic; the closer, the more real. No wall of text appears until the user has moved close enough to deserve it.

**Every object is a door.** If it renders, it's clickable. Dead ends are navigation bugs, not acceptable states.

**Real science, gracefully degraded.** If a real image is available, show it. If the archive is unavailable or the object has no matching observation, fall back to the procedural art without the user noticing a hard failure.

**Attribution always visible.** When real imagery is shown, the telescope name, instrument, observation date, and PI/program ID appear. This is non-negotiable — the archives require it and users deserve it.

**Multi-wavelength layering.** Chandra sees X-rays, Hubble sees optical and UV, Webb sees infrared. Where all three overlap, the user should be able to slide between layers, not just see one composite.

---

## 4. Phase 1 — Navigation Completeness

*Goal: every visible object goes somewhere. No dead ends.*

### 4.1 X-ray cluster sprites → generated cluster interior

X-ray clusters in `public/clusters-xray.json` have RA/Dec, redshift, and richness but no named-member catalog. Add a fallback route:

```
/xcluster/:xid
```

`XClusterPage.vue` — a minimal ClusterInteriorPage variant that:
- Shows the cluster's X-ray properties (temperature keV, luminosity, redshift) in the side panel.
- Generates a procedural galaxy field using the cluster's `n_gal` count and richness, seeded by `xid`.
- Provides the same "browse galaxies → systems → surface" chain as named clusters, using fully procedural galaxy IDs (`xc-{xid}-g{n}`).
- Adds a `"Real Imagery"` tab that shows the MAST coordinate search result (Phase 3).

**CosmicPage change:** wrap X-ray sprite click handlers to push `router.push('/xcluster/' + entry.xid)`.

### 4.2 GalaxyPage → system → surface

GalaxyPage currently shows a scatter plot of systems but has no outbound navigation. Wire:

- Each system point: click → `router.push('/galaxy-system/:systemId')`.
- `GalaxySystemPage.vue` (new) — same orrery layout as ClusterSystemPage but pulling from the GalaxyStore / local group data.
- Each planet in the system list → `router.push('/galaxy-surface/:systemId/:planetIdx')`.
- `GalaxySurfacePage.vue` — reuse SurfaceViewPage with local-group context breadcrumb.

The GalaxyPage "system preview panel" already collects the data; it just needs the navigation button wired to these routes.

### 4.3 Void shells → void interior

Clicking a void wireframe shell transitions to a `VoidInteriorPage.vue`:
- Dark nearly-empty view with filament strands at the void boundary.
- Shows the handful of galaxies in the void (look up NED void catalogs, embed as small JSON).
- Closest wormhole conduit highlighted as the exit point.
- No star systems rendered inside (voids are underrepresented) — this is intentional and educationally correct.

### 4.4 PlanetSystemsPage wire-up

Audit `PlanetSystemsPage.vue` and connect each listed system entry to either `/cluster-system/...` or `/galaxy-system/...` depending on which store the system belongs to.

### 4.5 DefenderNav cross-level transit (stub → implemented)

Per SPEC_DEFENDERNAV, cosmic → cluster → galaxy → system → surface are also accessible via the 360° strip navigator. Phase 1 ensures the underlying routes exist; DefenderNav animation can be layered in Phase 2+.

---

## 5. Phase 2 — Image Asset Registry

*Goal: a data layer that maps every catalogued object to its available real images before any archive fetching happens.*

### 5.1 Image manifest schema

Add `src/data/image-manifest.ts`:

```typescript
export interface ImageAsset {
  id: string                        // unique asset ID
  object_id: string                 // NGC4486, J001817.2+161740, etc.
  level: 'cluster' | 'galaxy' | 'system' | 'surface'
  telescope: 'JWST' | 'HST' | 'Chandra' | 'XMM' | 'DSS' | 'PanSTARRS' | 'GALEX'
  instrument?: string               // ACS, WFC3, ACIS-S, NIRCam, etc.
  wavelength_band: string           // 'optical' | 'infrared' | 'xray' | 'uv' | 'radio'
  url: string                       // direct image URL (JPEG or PNG, ≤4MB)
  thumbnail_url?: string            // 256px version for LOD_MID
  fits_url?: string                 // FITS source if available
  ra: number                        // center RA
  dec: number                       // center Dec
  fov_arcmin: number                // field of view in arcminutes
  obs_date?: string                 // ISO-8601 observation date
  program_id?: string               // HST proposal ID, JWST program ID, etc.
  pi?: string                       // principal investigator name
  credit: string                    // required attribution string
  color_channels?: string           // e.g. "R:Ha, G:OIII, B:SII"
  compositable: boolean             // can be layered with other wavelengths of same object
}
```

Seed this manifest with hand-curated entries for the 13 named clusters and their brightest member galaxies. Priority objects:

| Object | Chandra | HST/ACS | JWST |
|--------|---------|---------|------|
| M87 (Virgo, NGC4486) | Jet, ICM | Optical core + jet | NIRCam deep field |
| Coma cluster | ICM mosaic | BCG1/BCG2 | — |
| Perseus cluster | ICM ripples | NGC1275 (filaments) | — |
| Bullet cluster | Bow shock | HST optical | — |
| Fornax cluster | ICM + AGN | NGC1399 | — |
| Centaurus cluster | ICM sloshing | NGC4696 | — |
| Ophiuchus cluster | ICM giant cavity | — | — |
| Virgo (cluster-wide) | XMM mosaic | VCC catalog | — |

For galaxies with `anchor_telescope` already set in their `system_architecture`, automatically link to the manifest lookup.

### 5.2 Coordinate-based index

Build a companion lookup `src/lib/image-lookup.ts`:

```typescript
// Returns best available asset for the given object at the requested LOD level
function getImageAsset(
  objectId: string,
  level: ImageAsset['level'],
  wavelength: ImageAsset['wavelength_band']
): ImageAsset | null

// Coordinate fallback — returns archive search URL for objects not in manifest
function getArchiveSearchUrl(
  ra: number,
  dec: number,
  radiusArcmin: number,
  telescope: 'MAST' | 'CXC'
): string
```

### 5.3 Extending CatalogMember

Add optional field to the existing `CatalogMember` type:

```typescript
image_assets?: string[]  // array of ImageAsset.id references
```

Populate for the 13 named-cluster member catalogs in a follow-up datagathering pass.

---

## 6. Phase 3 — Observatory Archive Integration

*Goal: fetch real images dynamically for any RA/Dec using public APIs.*

### 6.1 MAST / STScI (Webb + Hubble)

MAST provides a coordinate-search API returning all available observations. Use it as the dynamic fallback when no manifest entry exists.

**Endpoint (coordinate cone search):**
```
https://mast.stsci.edu/api/v0/invoke
  ?request=Mast.Caom.Cone.Tiled
  &params={"ra":{ra},"dec":{dec},"radius":{radius_deg},"pagesize":10}
```

Returns a list of observations with `dataproduct_type`, `filters`, `dataURI`. Filter for `dataproduct_type = "image"` and prefer:
1. JWST / NIRCam or MIRI
2. HST / ACS-WFC or WFC3
3. GALEX UV
4. DSS2 (fallback)

**Preview tile endpoint (no authentication required):**
```
https://hla.stsci.edu/cgi-bin/getdata.cgi
  ?config=ops&act=getimage&format=jpeg
  &ra={ra}&dec={dec}&size=0.05&scale=0.5&orient=RA
  &instrument=ACS,WFC3&spectral_elt=clear,f814w,f606w
```

This returns a JPEG cutout suitable for use as a THREE.Texture. Cache by `{ra},{dec}` rounded to 4 decimal places.

**Implementation — `src/lib/archive/mast.ts`:**
```typescript
export async function fetchHstCutout(
  ra: number, dec: number,
  fovDeg: number = 0.05
): Promise<string | null>  // returns object URL (blob) or null

export async function fetchJwstPreview(
  ra: number, dec: number
): Promise<string | null>
```

### 6.2 Chandra X-ray Center (CXC)

Chandra's CSC 2.0 (Chandra Source Catalog) provides an API for X-ray source lookup. For cluster-scale images, use CXC's public image library (they publish processed JPEG composites for all major targets).

**CSC 2.0 API (cone search):**
```
https://cda.cfa.harvard.edu/cscview/api/cone
  ?ra={ra}&dec={dec}&radius={radius_arcsec}&cols=name,ra,dec,flux_aper_b
```

For the 13 named clusters, Chandra has published observation images. Add their direct URLs to the manifest (these are stable CDN-served files, not dynamic API calls).

For dynamic X-ray clusters: use XMM-Newton's image server as a fallback:
```
https://nxsa.esac.esa.int/nxsa-web/tap/sync
  ?REQUEST=doQuery&LANG=ADQL
  &QUERY=SELECT+*+FROM+xsa.v_public_observation
  +WHERE+CONTAINS(POINT('ICRS',ra,dec),CIRCLE('ICRS',{ra},{dec},{radius}))=1
```

**Implementation — `src/lib/archive/chandra.ts`:**
```typescript
export async function fetchChandraPreview(
  ra: number, dec: number
): Promise<string | null>

export async function fetchXmmPreview(
  ra: number, dec: number
): Promise<string | null>
```

### 6.3 ESA / ESO (bonus tier)

- **ESA/Hubble**: `https://esahubble.org/images/` — curated HTML pages, not an API. Scrape is fragile; use only manifest entries for ESA/Hubble.
- **ESO/ESOcast**: Similar limitation. Manifest-only.
- **HiPS (Hierarchical Progressive Survey)**: The CDS Aladin protocol at `https://alasky.u-strasbg.fr/hips-image-services/` provides tileable all-sky surveys (DSS2, PanSTARRS, 2MASS). These can eventually replace static cutouts with a proper tiling layer in Three.js, but that is a post-v1.1 scope item (see §9).

### 6.4 Caching and rate-limiting

- Archive calls go through `src/lib/archive/cache.ts` — an IndexedDB store keyed by `{telescope}:{ra_4dp}:{dec_4dp}`.
- TTL: 72 hours (archive data changes infrequently).
- Parallel fetches per page: maximum 3 concurrent.
- Failed fetches silently fall back to procedural art; no error state shown to user.

---

## 7. Phase 4 — LOD-Driven Image Reveal

*Goal: replace or augment procedural canvas textures with real imagery as the user zooms in.*

### 7.1 Reveal thresholds (extending existing LOD system)

The existing CosmicPage LOD system (`LOD_FAR`, `LOD_MID`, `LOD_NEAR`, `LOD_REVEAL`) is extended:

```typescript
const LOD_IMAGE_PREFETCH = 15.0   // begin archive fetch in background
const LOD_IMAGE_BLEND_START = 6.0 // begin cross-fading real image in
const LOD_IMAGE_FULL = 2.0        // real image at full opacity, procedural faded out
```

**Procedural → real image blend:**

At `LOD_IMAGE_BLEND_START`, the cluster sprite (canvas texture) stays visible. A second plane mesh with the real image texture is layered on top with `opacity = 0`. As camera distance decreases from `LOD_IMAGE_BLEND_START` to `LOD_IMAGE_FULL`, the real image's opacity is lerped from 0 → 1 and the canvas sprite's opacity lerps from 1 → 0.

If the real image is not yet loaded by `LOD_IMAGE_FULL`, keep the procedural sprite at full opacity until the image resolves, then apply a 1.5-second fade transition.

### 7.2 Multi-wavelength selector

When the user reaches `LOD_IMAGE_FULL` and the cluster has both X-ray and optical assets:

- Show a small wavelength toggle in the cluster info panel: `[X-ray] [Optical] [Infrared] [Composite]`
- Switching wavelength cross-fades to the corresponding texture.
- `Composite` shows a THREE.ShaderMaterial that blends up to three texture channels (Chandra = blue/purple, HST optical = yellow/white, Webb infrared = red/orange) using additive blending.

**Composite shader** (new `src/lib/shaders/composite-image.glsl`):
```glsl
uniform sampler2D xrayTex;
uniform sampler2D opticalTex;
uniform sampler2D infraredTex;
uniform float xrayWeight;
uniform float opticalWeight;
uniform float infraredWeight;

void main() {
  vec4 xr  = texture2D(xrayTex, vUv)  * xrayWeight;
  vec4 opt = texture2D(opticalTex, vUv) * opticalWeight;
  vec4 ir  = texture2D(infraredTex, vUv) * infraredWeight;
  gl_FragColor = clamp(xr + opt + ir, 0.0, 1.0);
}
```

### 7.3 Galaxy-level reveal (ClusterInteriorPage)

Each galaxy mesh in ClusterInteriorPage currently uses a procedural galaxy sprite. Extend:

- On selection (click → info panel opens): begin fetching HST cutout at the galaxy's RA/Dec.
- Info panel gains an `Image` tab alongside `Data` and `Systems`.
- Image tab: shows the real HST/Webb image when loaded, with crosshair indicating center.
- `fov_arcmin` from the manifest sets the field of view for the cutout request.
- If no real image: Image tab shows the current procedural sprite at 4× resolution with a label `"No observation on file — procedural rendering"`.

### 7.4 System-level reveal (ClusterSystemPage)

The host galaxy image appears as the background of the orrery view:

- Heavily blurred (Gaussian blur pass via THREE.EffectComposer) so the planetary orbits read clearly on top.
- Tinted dark (exposure -1.5 stops) to function as ambient context, not a competing element.
- Attribution line in the bottom-left corner at 50% opacity.

### 7.5 Surface-level reveal

The surface view currently shows terrain + sky dome. Two integration points:

**Sky dome:** If the host cluster has a real X-ray image, apply it to the inner face of the sky dome as one of the background layers. At large angular scale this reads as the galaxy cluster glow filling part of the sky — physically plausible for a world deep inside a cluster.

**Atmospheric spectral overlay:** If Chandra data gives us the ICM temperature of the host cluster, show a subtle HUD overlay reading `"Local ICM: {keV} keV"` alongside the existing environmental notes.

---

## 8. Phase 5 — Image Browser Panel

*Goal: give users a dedicated space to explore real imagery without needing to be at the correct camera position.*

### 8.1 New route: `/observatory/:objectId`

`ObservatoryPage.vue` — a full-page image browser for a single celestial object:

- Left sidebar: list of all available observations for the object (telescope, date, band, FoV).
- Main canvas: deep-zoom viewer (Openseadragon or custom THREE.js tiling plane).
- Wavelength mixer: slider per channel (X-ray, UV, optical, IR) controlling blend weights.
- Metadata drawer: observation ID, program, PI, filter stack, exposure time.
- `"Navigate Here"` button: closes the panel and flies the camera to the object in CosmicPage.

This route is reachable from:
- The "Image" tab in any cluster/galaxy info panel.
- A dedicated `[Real Imagery]` button in ClusterInteriorPage.
- DefenderNav contextual menu (long-press on a cluster node).

### 8.2 Image panel in existing pages

For pages that don't warrant a full ObservatoryPage view, add an expandable `ImageReel` component:

```
src/components/ImageReel.vue
```

Receives: `objectId`, `ra`, `dec`. Internally fetches the manifest + archive fallback. Displays a horizontal filmstrip of available images (thumbnail_url size). Clicking a thumbnail opens ObservatoryPage at that observation.

Used in: ClusterInteriorPage galaxy info panel, ClusterGalaxyPage header, ClusterSystemPage sidebar.

---

## 9. Out of Scope for This Spec (Future)

The following are intentionally deferred:

- **HiPS tiling** — replacing static cutouts with a proper tile pyramid for arbitrary zoom. Requires a proxy server to re-project HiPS tiles into Three.js coordinate space. Target: post-v1.1.
- **FITS data visualization** — pixel-level scientific analysis, histogram stretching, WCS coordinate display. Requires a FITS parser (fitsjs or similar). Target: v2.0.
- **Radio overlay (ALMA/VLA)** — would add 4th wavelength band. Limited curated data available for our cluster set. Target: v2.0.
- **Time-domain imagery** — showing the same object across observation epochs (nova, jet precession, etc.). Target: speculative.
- **User-uploaded imagery** — community astrophotography pinned to cluster coordinates. Tracked in pon.ink interop spec.

---

## 10. Implementation Order & Priority

### Sprint 1 (Navigation Completeness)
- [ ] Wire X-ray cluster sprites → `/xcluster/:xid` route (new page: XClusterPage.vue)
- [ ] Wire GalaxyPage system points → `/galaxy-system/:systemId` (new page: GalaxySystemPage.vue)
- [ ] Wire GalaxyPage surface button → `/galaxy-surface/:systemId/:planetIdx` (new page: GalaxySurfacePage.vue)
- [ ] Wire PlanetSystemsPage entries to existing cluster-system or galaxy-system routes
- [ ] Add void shell click → `/void/:voidId` (new page: VoidInteriorPage.vue, minimal)
- [ ] Audit all `.vue` pages for unhandled click events on rendered objects; add "coming soon" panel as a safety net

### Sprint 2 (Image Data Layer)
- [ ] Write `src/data/image-manifest.ts` schema and seed with ~40 hand-curated entries (13 clusters × 3 telescopes, best BCGs)
- [ ] Write `src/lib/image-lookup.ts` (manifest get + archive search URL builder)
- [ ] Extend `CatalogMember` type with `image_assets?: string[]`
- [ ] Enrich `*-members.json` files with image_assets for named BCGs (M87, NGC4889, NGC1399, NGC1275, 1E0657-558)

### Sprint 3 (Archive Fetching)
- [ ] `src/lib/archive/mast.ts` — HST cutout + JWST preview fetch
- [ ] `src/lib/archive/chandra.ts` — Chandra/XMM preview fetch
- [ ] `src/lib/archive/cache.ts` — IndexedDB-backed cache with 72h TTL
- [ ] Wire archive fetchers into ClusterInteriorPage info panel "Image" tab

### Sprint 4 (LOD Reveal)
- [ ] Add `LOD_IMAGE_PREFETCH`, `LOD_IMAGE_BLEND_START`, `LOD_IMAGE_FULL` thresholds to CosmicPage
- [ ] Add second image plane mesh per named cluster LOD entry; implement opacity cross-fade
- [ ] Add `composite-image.glsl` shader; wire wavelength toggle in cluster panel
- [ ] Apply host galaxy image as blurred background in ClusterSystemPage orrery

### Sprint 5 (Image Browser)
- [ ] `src/components/ImageReel.vue` — filmstrip thumbnail component
- [ ] `src/pages/ObservatoryPage.vue` — full-page deep-zoom viewer
- [ ] Add route `/observatory/:objectId`
- [ ] Wire `ImageReel` into ClusterInteriorPage, ClusterGalaxyPage

---

## 11. Key Technical Decisions

**Why IndexedDB over memory cache?**  
Archive images can be 1–4 MB each. Caching in memory across page navigations in a Vue SPA would quickly exhaust the heap. IndexedDB persists across navigation and handles binary blobs natively.

**Why JPEG cutouts rather than FITS?**  
FITS files require a parser and are 10–100× larger. JPEG cutouts from HLA/MAST are processed and color-balanced by STScI staff scientists. For display purposes they are superior. FITS access is deferred to v2.0 for users who want to analyze raw data.

**Why blend in Three.js rather than CSS compositing?**  
The images need to live in the same coordinate space as the 3D scene for the LOD blend to look natural. Overlaying a DOM image element on top of a WebGL canvas would require pixel-perfect z-index management that breaks during camera movement. The ShaderMaterial approach keeps everything in the render pipeline.

**Why not use a HiPS viewer library (Aladin Lite)?**  
Aladin Lite uses its own canvas and doesn't integrate with the Three.js scene. Embedding it would require an iframe approach that fractures the navigation experience. HiPS tiling natively in Three.js is the correct long-term path (deferred to post-v1.1).

**Archive terms of service:**  
- STScI/MAST: public domain, attribution requested.  
- ESA/Hubble: Creative Commons Attribution 4.0, attribution required.  
- Chandra/CXC: public domain, credit line required.  
- XMM-Newton/ESA: Creative Commons Attribution 4.0.  
Attribution is handled by the `credit` field in `ImageAsset` displayed in ObservatoryPage and the ImageReel caption.
