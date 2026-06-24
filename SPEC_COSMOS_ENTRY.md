# SPEC_COSMOS_ENTRY — CosmosPage + WelcomeOverlay

**SCD Hub · Exotopia.org · Working spec · GPL v3**
*Companion to SPEC.md §§1–3 and the phase2-unified-viz branch*

---

## The change

`WelcomePage.vue` was the landing page at `/welcome`. It rendered a cinematic cosmic scene (Laniakea, black holes, quasars, supernovae, iridescent void membranes) using its own WebGL context — separate from the shared `useVizRenderer` singleton used by all other visualization pages.

The phase2 migration wires WelcomePage into the shared renderer. The private canvas and renderer are gone. The cosmic visualization survives route transitions.

The rename follows from the migration: the page is no longer a welcome screen. It is the **first level of the navigable universe**. The welcome function moves to an overlay component.

---

## Rename plan

| Old | New | Route | Role |
|---|---|---|---|
| `WelcomePage.vue` | `CosmosPage.vue` | `/` (root) | Unified cosmic entry — the universe from which all navigation descends |
| `CosmicPage.vue` | merge or keep at `/cosmic` | `/cosmic` | Full data-rich cosmic view; can redirect to `/` once CosmosPage absorbs its features |
| `WelcomeOverlay.vue` | (new component) | N/A | Mounts on top of CosmosPage; role-specific messaging; dismissable |

### Route change

Currently:
```
/ → redirect to /welcome
/welcome → WelcomePage (cinematic cosmic scene)
/cosmic → CosmicPage (data-rich cosmic scene)
```

After rename:
```
/ → CosmosPage (unified cosmic scene — cinematic + data)
/cosmic → redirect to /
```

The two cosmic views (cinematic decorative scene in WelcomePage, real-data scene in CosmicPage) will eventually merge into one `CosmosPage`. For now, they are separate `pageGroup` populations that share the renderer — both can be active simultaneously if desired, or we can make CosmosPage absorb CosmicPage's scene builders.

**Immediate migration steps** (this sprint):
1. Rename `src/pages/WelcomePage.vue` → `src/pages/CosmosPage.vue`
2. Update `src/router/routes.ts`: `/welcome` → `/`, component `CosmosPage`
3. Redirect `/cosmic` to `/` OR keep CosmicPage at `/cosmic` and let them coexist
4. Create `src/components/WelcomeOverlay.vue`
5. Mount `<WelcomeOverlay>` inside `CosmosPage` template

---

## WelcomeOverlay — design

The overlay sits as an absolute-positioned panel over the CosmosPage scene. It is:
- **Dismissable**: a single click anywhere on the 3D scene, or an explicit close button, hides it
- **Role-aware**: content changes based on detected user state
- **Persistent for new visitors**: shown on every cold visit until dismissed; `sessionStorage` flag suppresses it on return within session
- **Non-blocking**: the 3D scene renders and auto-rotates behind the overlay at all times

### State detection (pre-auth)

Since full authentication is pon.ink–managed, the overlay uses local signals:

| Signal | Detected by | Role indication |
|---|---|---|
| Has settlements in localStorage | `useSettlements()` | Returning settler |
| Has galaxy store planets loaded | `galaxyStore.isLoaded` | Active user |
| Route query `?role=artist` / `?role=facilitator` etc. | `useRoute().query` | Referral from pon.ink deep link |
| Route query `?ref=ponink` | `useRoute().query` | New pon.ink recruit |
| No localStorage, no query | Default | New visitor |

### Content by state

**New visitor (no signals)**
```
EXOTOPIA
──────────────────────────────────────────
The navigable universe.

Every confirmed exoplanet is a settlement address.
Every eco-ops check-in earns virtual real estate.

→  EXPLORE  (dismisses overlay, scene becomes interactive)
→  GET STARTED  (routes to /onboard)
→  SIGN IN  (opens pon.ink auth)
──────────────────────────────────────────
Scale: 1 scene unit = 15 Mpc · Sources: XMM-Newton, NASA ExA, HYG v3
```

**Returning settler**
```
WELCOME BACK
──────────────────────────────────────────
Your settlement:  [planet name] · [host star]
                  [distance] ly · [temp] K

Nearby activity this week:
  · [cluster name] — [N] new check-ins
  · [event title] — [datetime]

→  ENTER SETTLEMENT     → EXPLORE UNIVERSE
──────────────────────────────────────────
```

**Artist referral (`?role=artist` or `?ref=ponink&role=artist`)**
```
ORBITAL GALLERY AVAILABLE
──────────────────────────────────────────
Artists earn an orbital gallery level above their settlement.
Mint an NFT → your work appears in your gallery.

Gallery tiers: Surface → Orbital → Cluster → Cosmic

→  BROWSE GALLERY LEVELS    → GET STARTED
──────────────────────────────────────────
```

**Facilitator referral**
```
HOST A SESSION
──────────────────────────────────────────
Your settlement includes a workshop amphitheatre dome.
Sessions held here issue POAPs to attendees.

→  VIEW MY DOME    → SCHEDULE SESSION (pon.ink)
──────────────────────────────────────────
```

**Eco / Health Educator referral**
```
YOUR FIELD DATA NODE
──────────────────────────────────────────
Check-ins from the field appear as activity pulses
on your settlement dome.

Currently active:  [N] field nodes near [location]

→  VIEW SETTLEMENT    → LOG CHECK-IN (eco-ops)
──────────────────────────────────────────
```

### Visual design

- Semi-transparent dark panel (80% opacity black with `backdrop-filter: blur(8px)`)
- Cyan accent (`#00d4aa`) for primary CTAs, matching global exo-page palette
- Position: centred vertically, left-third of screen — leaves the 3D scene visible on the right
- On mobile: full-width bottom sheet, 60vh max height
- Fade-in on mount (`transition: opacity 0.6s 0.8s` — delayed until cinematic pull-in is running)
- Fade-out on dismiss (`opacity 0 pointer-events none`, 0.4s)

### Implementation notes

- Component receives `settlementData` prop from CosmosPage (passed from `galaxyStore` + `useSettlements()`)
- Emits `dismiss` event; parent sets `overlayVisible = false`
- No router push in the overlay itself — all navigation is prop/event-driven
- The overlay is NOT a dialog or drawer — it is a plain `<div class="welcome-overlay">` with `v-if` and a CSS transition
- `sessionStorage.setItem('exo_overlay_seen', '1')` on dismiss; `onMounted` checks this to skip re-display

---

## CosmicPage merge strategy (medium-term)

The current split between `CosmosPage` (cinematic scene: voids, black holes, quasars, supernovae, Laniakea) and `CosmicPage` (data scene: X-ray clusters, named clusters, filaments, conduits) is artificial. Both scenes live in the same `useVizRenderer` shared renderer. Eventually:

1. CosmosPage absorbs CosmicPage's scene builders (the real cluster data, filaments, conduit markers)
2. CosmicPage becomes a redirect to `/`
3. The decorative elements (quasars, decorative black holes, time-aware supernovae) and the real-data elements (X-ray clusters, void navigation, filament connections) coexist in one unified scene

The trigger for the merge: when DefenderNav is wired to the real cluster data (replacing the simplified cluster list it currently receives from CosmosPage). At that point, the two scenes should be one.

---

## Route map after rename

```
/                  → CosmosPage (cinematic cosmic entry + WelcomeOverlay)
/cosmic            → redirect → /
/void/:voidId      → VoidInteriorPage
/xcluster/:xid     → XClusterPage
/cluster-interior/:slug  → ClusterInteriorPage
/cluster-galaxy/:slug/:id    → ClusterGalaxyPage
/cluster-system/:slug/:id/:idx   → ClusterSystemPage
/cluster-surface/:slug/:id/:idx  → ClusterSurfacePage
/galaxy            → GalaxyPage (Milky Way star field + exoplanet hosts)
/surface/:host/:planet   → SurfaceViewPage (planet surface + settlement)
/station/:id?      → StationPage (orbital zone habitat — scene needed)
/planet-systems    → PlanetSystemsPage (settlement guide + notable worlds)
/mint              → MintPage
/gallery           → GalleryPage
/onboard           → OnboardPage
```

Routes still missing scenes: `/station` (orbital zone), and no route yet for exomoon surfaces (currently reached via `/surface` with `?parent=` param — needs its own page or a scene mode in SurfaceViewPage).

---

*SCD Hub · Exotopia.org · GPL v3*
