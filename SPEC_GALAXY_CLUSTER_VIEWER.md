# EXOTOPIA — GALAXY CLUSTER VIEWER UPGRADE
**SCD Hub · SPEC v0.1 · GPL v3**  
*Living document — extends SPEC_GAMETHEORY.md and SPEC.md §§1–6*

---

## §1. Current State Audit

### What exists
| Layer | Data | Visual |
|---|---|---|
| XRay clusters (345) | name, RA/Dec, z, dist_Mpc, tapKev | Point sprite (canvas, resolution upgrades on approach) |
| Named clusters (10) | RA/Dec, dist_Mpc, richness, brightGalaxies[] | Sprite + wireframe boundary |
| Bright galaxies | name, type string, lum, scene-unit offset | Glow sprite (makeStarMesh) |
| XRay LOD field | Procedural star sprites → galaxy morphology sprites (DONE) | Galaxy morphology canvas sprites |
| Named cluster LOD field | Procedural galaxy morphology sprites (DONE) | Same |

### Critical gaps
1. **No catalog positions for cluster members** — offsets in `brightGalaxies[]` were placed arbitrarily (±0.55 su), not computed from actual RA/Dec
2. **No member count or morphology distribution data** — everything is procedural
3. **No LOD level for individual galaxy internal structure** (arms, HII regions, star clusters)
4. **No stellar content within galaxies** (LOD 4)
5. **No line-of-sight depth for members** — all members placed in a thin 2D shell

---

## §2. Five-Level LOD Architecture

```
Distance from cluster centre (scene units, MPC_SCALE = 1/15)

LOD 0  d > 60 su (>900 Mpc)
       Single point sprite — optimised for depth-of-field rendering
       DATA: None beyond what exists

LOD 1  d 20–60 su (300–900 Mpc)
       Multi-peak sprite: 2–4 overlapping Gaussian peaks hinting at subclustering
       DATA: known subcluster separations from the literature

LOD 2  d 5–20 su (75–300 Mpc)  ← current implementation
       Individual galaxy morphology sprites (canvas-rendered)
       Morphology-density relation applied
       DATA: catalog member lists with RA/Dec/morphtype/magnitude → scene offsets

LOD 3  d 0.5–5 su (7.5–75 Mpc)
       Full galaxy structure textures per member
       Hubble type → dedicated canvas texture (arms, dust lanes, HII knots)
       DATA: RC3 axis_ratio + position_angle + morph_index → texture parameters

LOD 4  d < 0.5 su (<7.5 Mpc)
       Internal stellar content
       - Statistical star distribution matching galaxy luminosity profile
       - HII regions as bright blue knots
       - OB associations as young blue clusters
       - For very nearby (<5 Mpc): individual bright stars from HYG catalog
       DATA: HYG Database v3 (nearby galaxies), SINGS star-forming region catalog
```

---

## §3. Data Sources — Priority Ranked

### P1 — Immediate value, small files, download now

#### Virgo Cluster Catalog (VCC)
- **Source**: Binggeli, Sandage & Tammann 1985; updated VCC2
- **VizieR TAP**: `https://tapvizier.cds.unistra.fr/TAPVizieR/tap` table `VII/62A/vcc`
- **Size**: ~2096 entries, ~200 KB as JSON
- **Fields**: `VCC, RA1950, DE1950, Type, BT, Notes`
- **Use**: LOD 2 & 3 member positions for Virgo Cluster

#### Fornax Cluster Catalog (FCC)
- **Source**: Ferguson 1989, AJ 98, 367
- **VizieR**: `VII/70A/fcc`
- **Size**: 340 entries, ~40 KB
- **Use**: LOD 2 & 3 for Fornax Cluster

#### RC3 — Third Reference Catalogue of Bright Galaxies
- **Source**: de Vaucouleurs et al. 1991
- **VizieR**: `VII/155/rc3`
- **Size**: 23,022 entries, ~3 MB
- **Key fields**: `Name, RAJ2000, DEJ2000, T, BT, D25, r25, PA`
  - `T`: numerical Hubble type (−5=E, 0=S0, 1=Sa … 7=Sd, 10=Irr)
  - `D25`: major axis at 25 mag/arcsec² isophote (arcmin)
  - `r25`: axis ratio D25/d25
  - `PA`: position angle
- **Use**: LOD 3 texture parameters for all named bright galaxies

### P2 — Medium term, medium size

#### NED Cluster Queries (live or cached)
- **NASA/IPAC NED API**: `https://ned.ipac.caltech.edu/tap/sync`
- **Query pattern**: Cone search around each named cluster centre, r < 3×Rvir
- **Fields**: `RA, Dec, Preferred Name, Morphology, Redshift, Distance`
- **Clusters to query**: Virgo, Coma, Perseus, Centaurus, Hydra, Fornax, Norma
- **Use**: Supplement VCC/FCC with redshift-confirmed members + depth (line-of-sight)

#### Coma Cluster Spectroscopic Members
- **Source**: SDSS-based; Chiboucas et al. 2010 or Mahajan et al. 2010
- **Alternative**: Direct NED query RA=194.95, Dec=27.98, z=0.023±0.01, r<1.5°
- **Expected**: ~800 confirmed members with velocities (→ depth offsets)
- **Use**: LOD 2 & 3 for Coma, including bimodal NGC4889/NGC4874 structure

#### HYG Database v3
- **Source**: https://github.com/astronexus/HYG-Database
- **File**: `hygdata_v3.csv` — 119,614 stars
- **Fields**: `ra, dec, dist, mag, spect, x, y, z` (galactic + equatorial)
- **Size**: 5 MB uncompressed, ~1 MB gzipped
- **Use**: LOD 4 stellar content for Milky Way and nearby galaxies (<5 Mpc)

### P3 — Longer term

#### SDSS DR17 PhotoObj (nearby clusters)
- Photometric catalog, ~500M sources
- Filter: `type=3` (galaxy), appropriate RA/Dec cone, `r < 20`
- Provides: Petrosian radii, colours, morphological estimates
- Use: Faint member population in Coma, Virgo, Perseus

#### 2MASS XSC (Extended Source Catalog)
- ~1.6M galaxies, K-band photometry
- More complete in southern sky and through dust
- Particularly useful for Norma Cluster (zone of avoidance)

#### THINGS (The HI Nearby Galaxy Survey)
- 34 nearby spiral galaxies, HI 21-cm maps
- Provides HII region positions + gas distribution
- Use: LOD 4 HII knot placement for nearby spirals

---

## §4. Data Processing Pipeline

### Step 1: Download and parse raw catalogs

```python
# fetch_cluster_catalogs.py
# Requirements: pip install astropy astroquery requests

from astroquery.vizier import Vizier
from astropy.coordinates import SkyCoord
import astropy.units as u
import json, math

MPC_SCALE = 1 / 15   # 1 Mpc → 0.0667 scene units

def mpc_to_scene(dist_mpc):
    return dist_mpc * MPC_SCALE

def angular_offset_to_scene(delta_ra_deg, delta_dec_deg, dist_mpc):
    """Convert angular separation from cluster centre to 3D scene-unit offset.
    Uses small-angle approximation valid for cluster member separations.
    delta_ra_deg already corrected for cos(dec) projection.
    Returns (x, y, z_estimated=0) in scene units.
    """
    delta_ra_mpc  = math.radians(delta_ra_deg)  * dist_mpc
    delta_dec_mpc = math.radians(delta_dec_deg) * dist_mpc
    return [
        delta_ra_mpc  * MPC_SCALE,   # east-west
        delta_dec_mpc * MPC_SCALE,   # north-south
        0.0                           # depth unknown unless redshift available
    ]

def fetch_vcc(virgo_ra=187.7, virgo_dec=12.4, virgo_dist_mpc=16.5):
    v = Vizier(columns=['VCC', '_RAJ2000', '_DEJ2000', 'Type', 'BT', 'Notes'], row_limit=-1)
    result = v.query_region(
        SkyCoord(virgo_ra, virgo_dec, unit='deg', frame='icrs'),
        radius=6 * u.deg,
        catalog='VII/62A/vcc'
    )
    tbl = result[0]
    members = []
    for row in tbl:
        dra  = (row['_RAJ2000'] - virgo_ra) * math.cos(math.radians(virgo_dec))
        ddec = row['_DEJ2000'] - virgo_dec
        members.append({
            'id':     f"VCC {row['VCC']}",
            'ra':     float(row['_RAJ2000']),
            'dec':    float(row['_DEJ2000']),
            'morph':  str(row['Type']).strip() if row['Type'] else 'E',
            'bt_mag': float(row['BT']) if row['BT'] else 18.0,
            'offset': angular_offset_to_scene(dra, ddec, virgo_dist_mpc),
        })
    return members

def assign_hubble_code(type_str):
    """Map VCC/RC3 type strings to our Hubble codes."""
    t = type_str.lower().strip() if type_str else ''
    if any(x in t for x in ['cd', 'c d', 'bcg']): return 'cD'
    if t.startswith('e'):  return 'E'
    if 's0' in t or 'lenticular' in t: return 'S0'
    if 'sa' in t and 'b' not in t:  return 'Sa'
    if 'sb' in t or 'spiral' in t:  return 'Sb'
    if 'sc' in t or 'sd' in t:      return 'Sb'
    if 'irr' in t or 'im' in t:     return 'Irr'
    if t.startswith('s'):            return 'Sa'
    return 'E'   # default for unknown

if __name__ == '__main__':
    print("Fetching VCC...")
    vcc = fetch_vcc()
    out = {
        'cluster':    'Virgo Cluster',
        'center_ra':  187.7,
        'center_dec': 12.4,
        'dist_mpc':   16.5,
        'richness':   7,
        'members': [
            {**m, 'hubble': assign_hubble_code(m['morph'])}
            for m in vcc
        ]
    }
    with open('public/clusters/virgo-members.json', 'w') as f:
        json.dump(out, f, indent=1)
    print(f"Written {len(vcc)} Virgo members")
```

### Step 2: Add depth estimates from redshifts

```python
# add_depth_from_redshifts.py
# For members with known redshifts, compute line-of-sight offset.

H0 = 70.0   # km/s/Mpc
def peculiar_to_depth_offset_mpc(peculiar_vel_km_s, cluster_dist_mpc):
    """Convert peculiar velocity to depth offset via Hubble flow."""
    return peculiar_vel_km_s / H0   # sign: positive = behind, negative = in front

# For Virgo: cluster mean cz ≈ 1050 km/s
# Member with cz = 1500 km/s → Δz = +450 km/s → +6.4 Mpc behind centre
```

### Step 3: Enrich with RC3 morphological data

```python
# enrich_with_rc3.py
# Adds axis ratio, position angle, and angular size to each named member.
# RC3 fields: T (Hubble type), D25 (arcmin), r25 (axis ratio), PA (deg)

def get_rc3_entry(galaxy_name):
    """Query RC3 for a specific galaxy by name."""
    from astroquery.vizier import Vizier
    v = Vizier(columns=['Name', 'T', 'D25', 'r25', 'PA'])
    result = v.query_constraints(Name=galaxy_name, catalog='VII/155/rc3')
    if not result:
        return None
    r = result[0][0]
    return {
        'T_type':    int(r['T']) if r['T'] else 0,
        'D25_arcmin':float(r['D25']) if r['D25'] else 0.5,
        'axis_ratio':float(r['r25']) if r['r25'] else 0.8,
        'pa_deg':    float(r['PA']) if r['PA'] else 0,
    }
```

### Step 4: Pre-compute LOD 3 texture parameters

```python
# generate_galaxy_texture_params.py
# For each cluster member compute the parameters needed by the LOD 3 renderer.

def galaxy_texture_params(hubble_code, T_type, D25_arcmin, axis_ratio, dist_mpc):
    """
    Returns parameters consumed by makeGalaxyStructureTexture() in the browser.
    angular_size_su: apparent size in scene units (D25 projected at dist_mpc)
    pitch_angle: logarithmic spiral pitch (tighter for Sa, looser for Sc)
    n_arms: 0 for E/S0, 2 for most spirals, 4 for some Sa
    """
    # Physical size from angular diameter
    phys_kpc  = (D25_arcmin / 60) * (math.pi / 180) * dist_mpc * 1000   # kpc
    scene_su  = phys_kpc / 1000 * MPC_SCALE   # kpc → Mpc → scene units

    # Spiral parameters scale with Hubble type
    if T_type < 0:   pitch = 0;   n_arms = 0   # E
    elif T_type < 1: pitch = 0;   n_arms = 0   # S0
    elif T_type < 3: pitch = 8;   n_arms = 2   # Sa
    elif T_type < 5: pitch = 12;  n_arms = 2   # Sb
    elif T_type < 8: pitch = 18;  n_arms = 2   # Sc/Sd
    else:            pitch = 0;   n_arms = 0   # Irr

    return {
        'scene_su':   max(0.004, scene_su),
        'axis_ratio': axis_ratio,
        'pitch_deg':  pitch,
        'n_arms':     n_arms,
    }
```

---

## §5. JSON Schema — Cluster Member Files

Store pre-processed data in `/public/clusters/<cluster-slug>-members.json`:

```json
{
  "cluster":      "Virgo Cluster",
  "slug":         "virgo",
  "center_ra":    187.7,
  "center_dec":   12.4,
  "dist_mpc":     16.5,
  "rvir_mpc":     1.1,
  "members": [
    {
      "id":          "NGC 4486",
      "aliases":     ["M87", "Virgo A", "3C 274"],
      "ra":          187.706,
      "dec":         12.391,
      "hubble":      "cD",
      "T_type":      -4,
      "bt_mag":      9.59,
      "D25_arcmin":  3.53,
      "axis_ratio":  0.82,
      "pa_deg":      155,
      "lum_solar":   2e12,
      "offset":      [-0.0611, 0.0013, 0.0],
      "depth_mpc":   0.0,
      "notes":       "BCG; 6.5B M☉ BH; relativistic jet; X-ray cavities",
      "lod3_params": {
        "scene_su":   0.0157,
        "axis_ratio": 0.82,
        "pitch_deg":  0,
        "n_arms":     0
      }
    }
  ]
}
```

`offset` is in scene units: `[x_east, y_north, z_depth]` — directly usable as `THREE.Vector3.set(...m.offset)`.

---

## §6. Rendering Architecture — LOD 2 & 3

### LOD 2 — Galaxy morphology sprite (current)

Already implemented via `makeGalMorphSprite(morph, col, sz)`. With catalog data:
- Use `m.hubble` instead of procedural `pickMorphology()`
- Scale sprite by `m.lod3_params.scene_su * LOD2_SCALE_FACTOR`
- Apply `m.axis_ratio` to sprite y-scale
- Use `m.pa_deg` to rotate the sprite

### LOD 3 — Full galaxy structure texture (new)

New function `makeGalaxyStructureTexture(params)`:

```typescript
interface GalStructureParams {
  hubble:       string       // 'cD' | 'E' | 'S0' | 'Sa' | 'Sb' | 'Sc' | 'Irr'
  T_type:       number       // −5 to 10
  color:        THREE.Color
  pitchDeg:     number       // spiral arm pitch angle
  nArms:        number       // 0, 2, or 4
  axisRatio:    number       // b/a (1 = face-on, 0 = edge-on)
  paDeg:        number       // position angle
}
```

For each galaxy in the LOD 3 range:
1. `CircleGeometry(m.scene_su, 96)` — sized from catalog
2. Scale y by `m.axis_ratio` (projection)
3. Rotate by `m.pa_deg` (sky position angle)
4. Apply `makeGalaxyStructureTexture(params)` as texture

The structure texture is similar to `makeMWGalaxyTexture()` but:
- Parameters driven by Hubble type (E galaxies = pure de Vaucouleurs, S0 = disk only, spirals = arms)
- Cached by `(hubble, pitchDeg, nArms)` — not per galaxy
- Resolution 256px (LOD 3 is viewed close-up)

### LOD 3 subcluster handling

Several named clusters have known subclusters:
- Virgo: A (M87), B (M49), C (NGC 4261) — three BCGs at different positions
- Coma: NGC 4889 + NGC 4874 — bimodal BCG pair
- Centaurus: Cen30 + Cen45 — two subclusters at different distances

At LOD 3, each subcluster gets its own dominant BCG glow and member distribution.

### LOD 4 — Stellar content (stub → full)

**Phase 1 (stub)**: Statistical star distribution matching the galaxy's luminosity profile:
- Sérsic profile `I(r) = Ie × exp(−bn × ((r/re)^(1/n) − 1))`
  - E/cD: n=4 (de Vaucouleurs), warm stellar colours
  - S0: n=2 disk + n=4 bulge, two-component
  - Spirals: n=1 disk + bright blue knots for HII regions
- `Points` geometry, 2000–8000 points per galaxy
- Spectral colours weighted by stellar population age

**Phase 2 (full)**: HYG catalog stars for Local Group galaxies:
- Andromeda (M31): HYG + Gaia for resolved bright stars
- LMC/SMC: proper star catalog positions
- For anything >2 Mpc: statistical only

---

## §7. Expected Visual by Sky Region

| Cluster | Dominant morphology | Key features | Visual character |
|---|---|---|---|
| Virgo (RA 187°) | ~50% E, 30% S0, 20% Sa | M87 jet, many face-on spirals in outer regions | Mixed, warm core, blue spiral halos |
| Coma (RA 195°) | ~80% E/S0 | Bimodal NGC4889+4874 core, extreme galaxy harassment | Almost no spirals, uniformly warm amber |
| Perseus (RA 49°) | ~75% E, Seyfert BCG | Perseus A radio lobes, X-ray cavities | Compact warm core, prominent central Seyfert |
| Centaurus (RA 192°) | ~60% E, two subclusters | Cen30 at 35 Mpc + Cen45 at 45 Mpc | Elongated double core |
| Hydra (RA 159°) | ~55% E, moderate | Compact but not extreme | Moderate density, some S0s |
| Fornax (RA 54°) | ~45% E, many S0s | Very regular, near-spherical | Smooth, well-resolved at 20 Mpc |
| Norma/GA (RA 243°) | ~65% E, dust obscured | Zone of avoidance — reddened spirals | Reddish tint from galactic dust extinction |
| Shapley (RA 202°) | Multiple rich subclusters | A3558, A3562, A3556 in supercluster | Huge complex, many overlapping clusters |

---

## §8. Implementation Phases

### Phase 1 — Data (2 sprints)
1. Run `fetch_cluster_catalogs.py` for VCC and FCC
2. Run `enrich_with_rc3.py` for all brightGalaxies[] members
3. Correct the existing `offset` values in cosmic-structures.ts using proper angular math
4. Store pre-processed JSON in `/public/clusters/`
5. Load and use catalog data in `spawnNamedStarField()` for Virgo and Fornax

### Phase 2 — LOD 2 catalog-driven (1 sprint)
1. Update `spawnNamedStarField()` to load cluster member JSON when available
2. Replace hardcoded offsets with catalog-computed offsets
3. Apply catalog morphology types instead of procedural `pickMorphology()`
4. Scale galaxy sprites using catalog `scene_su` from LOD3 params

### Phase 3 — LOD 3 galaxy structure (2 sprints)
1. Implement `makeGalaxyStructureTexture(params)` — type-parametric canvas renderer
2. Add LOD_STRUCT trigger: `camera.distanceTo(member.pos) < LOD_STRUCT_NEAR`
3. Swap morphology sprite → structure texture when inside LOD_STRUCT range
4. Implement spiral arm pitch, dust lane, HII knot rendering
5. Correct aspect ratio and position angle from catalog data

### Phase 4 — LOD 4 stellar content (2 sprints)
1. Load HYG database (gzipped, lazy) when approaching Milky Way or Andromeda
2. Implement `spawnGalaxyStarField(galaxy, maxStars)` for LOD 4
3. HII region positioning from SINGS/THINGS for nearby spirals
4. OB association proxies (blue point clusters) for young stellar regions

### Phase 5 — Enhancement (ongoing)
1. NED live queries for clusters not covered by cached catalogs
2. Subcluster identification within Virgo, Coma, Perseus
3. Galaxy interaction indicators (tidal bridges, ram-pressure stripping trails)
4. Gravitational lensing visual cue for highest-mass clusters

---

## §9. Math Verification Checklist

Per the established protocol for math-heavy features:

- [ ] Angular position → scene offset: verify MW is at offset `[0,0,0]` from its cluster centre
- [ ] RC3 D25 → physical size → scene_su: verify M87 at 16.5 Mpc, D25=3.53' → 17.0 kpc → 0.00113 su (tiny at cluster scale — LOD 3 radius should be ×10 for visibility)
- [ ] Virgo member distribution: verify that M87 at offset [−0.061, 0.001, 0] is within Rvir (1.1 Mpc = 0.073 su) ✓
- [ ] Depth from redshift: verify Δcz=450 km/s → 6.4 Mpc → 0.43 su offset along z
- [ ] Morphology-density trigger distances: LOD_STRUCT_NEAR should be < current LOD_NEAR (9 su) — propose 2.5 su
- [ ] HYG star count per galaxy: verify Points(8000) renders below 2 ms per frame at target 60fps

---

## §10. Files to Create / Modify

| File | Action | Phase |
|---|---|---|
| `datagathering/fetch_cluster_catalogs.py` | New — VCC + FCC download | 1 |
| `datagathering/enrich_with_rc3.py` | New — RC3 enrichment | 1 |
| `public/clusters/virgo-members.json` | Generated | 1 |
| `public/clusters/fornax-members.json` | Generated | 1 |
| `public/clusters/coma-members.json` | Generated | 2 |
| `public/clusters/perseus-members.json` | Generated | 2 |
| `src/data/cosmic-structures.ts` | Update brightGalaxies offsets | 1 |
| `src/lib/star-sprites.ts` | Add `makeGalaxyStructureTexture()` | 3 |
| `src/pages/CosmicPage.vue` | LOD 3 trigger + structure textures | 3 |
| `src/pages/CosmicPage.vue` | LOD 4 HYG star field | 4 |
| `src/stores/galaxy.ts` | Add `loadHygStars()` (lazy) | 4 |
