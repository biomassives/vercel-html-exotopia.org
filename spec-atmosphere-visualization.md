# Atmosphere Visualization Spec
## Exotopia — Scientifically Grounded Rendering

---

## 1. Problem Statement

The current code assigns fog/atmosphere colors to **all** planets via `surfacePaletteFor(eqt)`,
regardless of whether the planet can physically retain an atmosphere. This creates a false
impression: a 2000 K lava world gets a dense orange haze, a hot Jupiter moon gets a haze
it likely cannot hold, and a bare rocky world below the irradiation threshold gets sky-blue
atmosphere fog.

**Goal:** Only render atmospheric fog, sky glow, and atmosphere UI labels when the planet/moon
is scientifically plausible to have one. Absence of atmosphere should render as hard vacuum
(sharp stars, no fog, no scattering).

---

## 2. Data Available from NASA Exoplanet Archive

Per-planet fields already loaded in the galaxy store:

| Field | Description |
|---|---|
| `pl_eqt` | Equilibrium temperature (K) — main driver |
| `pl_rade` | Planet radius (Earth radii) — size proxy for gravity/type |
| `pl_bmasse` | Planet mass (Earth masses) — gravity proxy |
| `pl_orbsmax` | Semi-major axis (AU) |
| `pl_orbper` | Orbital period (days) |
| `st_teff` | Host star effective temperature (K) — irradiation driver |
| `st_lum` | Host star luminosity (log L☉) |
| `sy_dist` | Distance (pc) — not directly relevant |
| `sy_mnum` | Known moon count |

---

## 3. Atmosphere Presence Rules

### 3a. Gas Giants / Sub-Neptunes — Always Have Atmosphere

**Rule:** If `pl_rade > 1.8 R⊕` OR `pl_bmasse > 10 M⊕`, the planet is a gas-dominated
world and always has a thick atmosphere (primarily H₂/He envelope).

- Exception: **Ultra-hot Jupiters** (`pl_eqt > 2200 K`) undergo intense photoevaporation
  and may be in transition — flag as "highly eroded" but still show atmosphere.

**Atmosphere type:** H₂/He envelope → blue-white/gray-white sky, thick haze.

---

### 3b. Rocky / Terrestrial — Conditional

**Rule:** A rocky planet (`pl_rade ≤ 1.8 R⊕` OR `pl_bmasse ≤ 10 M⊕` when rade unavailable)
**may** have an atmosphere based on:

| Condition | Outcome |
|---|---|
| `pl_eqt > 1800 K` | **No atmosphere.** Above the silicate-vapor threshold; any volatiles long lost to photoevaporation/thermal escape. Show vacuum. |
| `pl_eqt > 700 K AND pl_rade < 1.2` | **No atmosphere.** Small rocky world in intense irradiation zone (Venus analog threshold). |
| `700 K ≥ pl_eqt > 400 K` | **Thin, CO₂-dominated** atmosphere possible if `pl_rade ≥ 0.8`. Haze: faint amber/orange. |
| `400 K ≥ pl_eqt > 180 K` | **Full atmosphere** plausible (habitable zone or adjacent). N₂/CO₂/O₂ mix. Haze: blue-to-gray depending on composition. |
| `pl_eqt ≤ 180 K` | **Thin/cryogenic** atmosphere possible (N₂/CH₄ ices, like Titan/Triton) if `pl_rade ≥ 0.8`. Below this radius: no atmosphere (Pluto-class). |
| `pl_eqt` null | Estimate from `pl_orbsmax` and `st_lum`; if still unknown, show **vacuum** as default and note "atmosphere: unknown." |

---

### 3c. Exomoons

**Moons are much harder to retain atmosphere** (lower gravity, tidal heating, secondary irradiation from planet).

| Condition | Outcome |
|---|---|
| Moon around gas giant at `pl_eqt > 1200 K` | **No atmosphere.** Hot Jupiter moons likely don't exist (tidal disruption). |
| Moon modeled as large (mass proxy: gas giant with `pl_rade > 4 R⊕`) | **Possibly thick atmosphere** (Titan-like) if `eqt 70–200 K`. |
| Moon around temperate rocky planet | **No atmosphere** by default; mark as "atmosphere: unlikely" unless archive has data. |
| Moon around any system with `pl_eqt 70–300 K` | Show **thin N₂/CH₄ haze** if moon mass proxy is large enough. |
| All others | **Vacuum.** Show no fog; hard star field. |

---

## 4. Atmosphere Type → Visualization Mapping

| Atmosphere Type | `fogColor` | `fogDensity` | Sky glow | Description shown in UI |
|---|---|---|---|---|
| **None / vacuum** | none (no fog) | 0 | none | "Vacuum — no atmosphere detected" |
| **Thin CO₂** (rocky, hot dry) | `0x3a2808` amber-brown | 0.00008 | faint rust | "Thin CO₂ atmosphere — trace pressure" |
| **N₂/CO₂ temperate** | `0x1a2a40` blue-gray | 0.00015 | pale blue | "Mixed N₂/CO₂ atmosphere" |
| **N₂/O₂ habitable** | `0x1a3050` medium blue | 0.00020 | blue | "Nitrogen-oxygen atmosphere — habitable candidate" |
| **Thick H₂/He** (gas giants) | `0x203848` blue-white | 0.00040 | blue-white | "Thick hydrogen-helium envelope" |
| **H₂/He eroded** (ultra-hot) | `0x401808` orange-brown | 0.00035 | orange | "Eroded H₂ atmosphere — active mass loss" |
| **Cryogenic N₂/CH₄** (icy) | `0x101828` dark blue | 0.00010 | pale blue-purple | "Thin cryogenic N₂/CH₄ atmosphere" |
| **CO₂ greenhouse** (runaway) | `0x201410` dark amber | 0.00030 | orange-red | "Dense CO₂ greenhouse — Venus-like" |

---

## 5. Derived Atmosphere Type Function

Proposed signature for a new utility function:

```typescript
// src/lib/planet-climate.ts or atmosphere.ts
export type AtmosphereType =
  | 'none'
  | 'thin_co2'
  | 'n2_co2'
  | 'n2_o2'
  | 'h2_he'
  | 'h2_he_eroded'
  | 'cryo_n2_ch4'
  | 'co2_greenhouse'

export interface AtmosphereProfile {
  type:         AtmosphereType
  pressureBar:  number | null     // null = unknown
  fogColor:     number | null     // hex, null = no fog
  fogDensity:   number
  skyGlow:      number | null     // hex, null = none
  label:        string            // UI display
}

export function atmosphereProfileFor(
  eqt:     number | null,
  rade:    number | null,
  bmasse:  number | null,
  isMoon:  boolean,
): AtmosphereProfile
```

---

## 6. UI Changes Required

1. **`surfacePaletteFor`** in `three-utils.ts` — currently always returns a fog color.
   Should call `atmosphereProfileFor` and only set fog when `type !== 'none'`.

2. **`SurfaceViewPage.vue`** — The `atmosphereLabel` computed is currently always
   non-empty. Should show "Vacuum — no atmosphere" for airless worlds. The sky glow
   (HemisphereLight color) should also be black/null for vacuum worlds.

3. **`ClusterSurfacePage.vue`** — HemisphereLight sky color should not use atmosphere
   color when planet has no atmosphere.

4. **Info panel** — add "Atmosphere" row that shows `AtmosphereProfile.label` instead of
   the current hardcoded string guesses.

5. **`SettlementHashmark.vue`** — The settlement design's `atmType` is already derived
   from `eqt`/`rade` logic. This should be replaced with `atmosphereProfileFor` output.

---

## 7. Known Gaps / Open Questions

1. **No direct atmosphere detection** — NASA archive does not include confirmed
   atmosphere presence for most exoplanets. Our rules are physical models, not
   observations. The UI should indicate this (e.g., "Atmosphere: modeled estimate").

2. **Tidally locked planets** — The day-side of a tidally locked rocky world can lose
   atmosphere from dayside heating even if the global eqt looks temperate. Should we
   flag this? HD 128311 b (period ~448 days) is likely NOT tidally locked.

3. **Stellar age / XUV history** — Young stars emit far more XUV; older stars may
   have already stripped atmospheres from inner planets. The archive does include
   `st_age` for some systems — could be a secondary modifier.

4. **Detecting exomoon mass** — We have no real moon mass data; all moon properties
   are estimated. Moon atmosphere rules are therefore highly approximate.

5. **O₂ detection** — We currently label habitable-zone candidates as "N₂/O₂" which
   implies life. Should we use "N₂/CO₂ (habitable zone candidate)" instead and reserve
   "N₂/O₂" only if the archive confirms biosignature data (essentially never for
   current archive)?

---

## 8. Implementation Priority

| Priority | Task |
|---|---|
| 1 | Write `atmosphereProfileFor()` function in `src/lib/planet-climate.ts` |
| 2 | Update `surfacePaletteFor` to use it for fog decisions |
| 3 | Update `SurfaceViewPage` hemisphere light for vacuum worlds |
| 4 | Update `ClusterSurfacePage` hemisphere light |
| 5 | Update `atmosphereLabel` computed in SurfaceViewPage |
| 6 | Update `SettlementHashmark` atmType derivation |

---

*Draft for review — not yet implemented.*
