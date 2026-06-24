# Non-Milky Way Cluster Data Research Query
*April 19, 2026 — Exotopia / SCD Hub*

---

## 1. What We Have Now

The X-ray cluster layer (`public/clusters-xray.json`) contains **345 entries** from the
Takey2013 XMM-Newton survey of galaxy groups and clusters. Fields available:

| Field       | Description                                |
|-------------|---------------------------------------------|
| `name`      | Catalog designation (XMMXCS, 2XMM, etc.)   |
| `raDeg`     | Right ascension (degrees)                   |
| `decDeg`    | Declination (degrees)                       |
| `z`         | Redshift                                    |
| `distMpc`   | Luminosity distance (Mpc, derived from z)   |
| `tapKev`    | X-ray temperature (keV) — proxy for mass    |
| `source`    | Takey2013                                   |
| `colorHex`  | Derived display color from temperature      |

**What's missing:** Mass estimates, luminosity, optical richness, substructure flags,
cross-catalog identifiers, BCG properties, SZ effect data.

---

## 2. Recommended Data Sources (Priority Order)

### 2.1 eROSITA All-Sky Survey (eRASS1) — **HIGHEST PRIORITY**
*Most complete X-ray survey ever made*

- **Catalog:** eRASS1 cluster catalog (Bulbul et al. 2024, A&A)
- **Coverage:** 5,259 clusters over the western galactic hemisphere
- **New fields available:**
  - `M500` — cluster mass within r500 (in units of 10¹⁴ M☉)
  - `L_X` — X-ray luminosity (0.5–2 keV band, erg/s)
  - `r500` — physical radius in Mpc
  - `N_gal` — estimated member galaxy count
  - `z_photo` — photometric redshift (many without spectroscopic)
- **API / Download:**
  ```
  VizieR catalog: J/A+A/685/A106
  MAST: https://archive.stsci.edu/missions-and-data/erosita
  Direct: https://erosita.mpe.mpg.de/edr/eROSITASurvey/
  ```
- **Parser note:** CSV download from VizieR, filter `M500 > 0.5` to remove spurious detections

---

### 2.2 Planck SZ2 Catalog (PSZ2) — **MASS ESTIMATES**
*Best cluster mass estimates for massive clusters at 0.01 < z < 1.0*

- **Catalog:** PSZ2 — 1,653 clusters (Planck Collaboration 2016)
- **New fields:**
  - `MSZ` — SZ-derived mass (10¹⁴ M☉, calibrated against X-ray)
  - `SNR` — signal-to-noise ratio of SZ detection
  - `z_spec` / `z_photo` — spectroscopic or photometric redshift
  - `Y500` — integrated Compton-y parameter (total thermal energy proxy)
- **API / Download:**
  ```
  ESA Planck Legacy Archive: https://pla.esac.esa.int/
  VizieR: J/A+A/594/A27
  FITS: https://irsa.ipac.caltech.edu/data/Planck/release_2/catalogs/
  ```
- **Match to current catalog:** Cross-match on RA/Dec within 3 arcmin to augment
  existing clusters with SZ mass

---

### 2.3 SDSS redMaPPer Catalog — **OPTICAL RICHNESS**
*Richness = number of red-sequence galaxies; best proxy for total mass*

- **Catalog:** redMaPPer DR8 (Rykoff et al. 2014) — 26,111 clusters
- **New fields:**
  - `lambda` — optical richness (≈ number of member galaxies)
  - `z_lambda` — photometric cluster redshift
  - `ra_bcg` / `dec_bcg` — BCG (brightest cluster galaxy) coordinates
  - `p_mem` — per-galaxy membership probability
- **Download:**
  ```
  DES Science Portal: https://des.ncsa.illinois.edu/releases/dr2/dr2-products/dr2-catalog
  SDSS SkyServer: https://skyserver.sdss.org/dr16/en/help/browser/
  VizieR: J/ApJS/224/1
  ```
- **Use in Exotopia:** `lambda` maps directly to our `richness` (1–10) scale via
  `richness = clamp(log10(lambda) * 3.5, 1, 10)`

---

### 2.4 ACT-DR5 / SPT-SZ — **HIGH-REDSHIFT CLUSTERS**
*Push cosmological depth beyond z > 0.5 — what's visible at the edge of the observable universe*

- **ACT-DR5:** 4,195 clusters at 0.04 < z < 1.91 (Hilton et al. 2021)
- **SPT-SZ:** 677 clusters, 0.25 < z < 1.75 (Bleem et al. 2015)
- **New fields:**
  - `M500_UPP` — SZ mass using Universal Pressure Profile
  - `redshift_type` — spec / phot / predicted
  - `snr_act` — detection significance
- **Download:**
  ```
  ACT: https://lambda.gsfc.nasa.gov/product/act/actpol_dr5_clust_get.html
  SPT: https://pole.uchicago.edu/public/data/sptclusters/
  ```

---

### 2.5 MCXC Meta-Catalog — **CROSS-SURVEY CONSOLIDATION**
*Unified compilation from ROSAT, HIFLUGCS, BCS, XMM surveys — 1,743 clusters*

- **Catalog:** MCXC (Piffaretti et al. 2011)
- **Fields:**
  - `L500` — X-ray luminosity within r500
  - `M500` — mass from L-M scaling relation
  - `origin` — source survey name
- **VizieR:** J/A+A/534/A109
- **Value:** Bridges our Takey2013 data with ROSAT-era surveys; older clusters but
  well-calibrated masses

---

## 3. Additional Data Points for Settlement Narrative

Beyond masses and luminosities, these fields enrich the cosmic view narrative:

| Field                  | Source          | Use in Exotopia                              |
|------------------------|-----------------|-----------------------------------------------|
| BCG morphology         | NED / SIMBAD    | "Dominant elliptical" label in cluster panel  |
| Cool-core / non-cool   | ACCEPT catalog  | "Active plasma core" vs "cooling flow" badge  |
| Merging substructure   | X-ray images    | "Active merger" event flag                    |
| Strong lensing arcs    | HST archive     | "Gravitational lens" badge — link to image    |
| Cluster redshift z     | All catalogs    | Lookback time = 13.8 × (1 - 1/(1+z)) Gyr     |
| ICM entropy profile    | Chandra archive | Temperature gradient → "turbulent" flag       |
| Filament connectivity  | SDSS/2MASS      | Additional filament lines in cosmic web       |

---

## 4. Proposed Import Script

To extend `clusters-xray.json` with eRASS1 and Planck data:

```python
# parse_cluster_catalogs.py (to create)
# Step 1: Load existing clusters-xray.json
# Step 2: Download eRASS1 VizieR CSV (J/A+A/685/A106)
# Step 3: Spatial cross-match within 5 arcmin using astropy SkyCoord
# Step 4: Augment matched entries with M500, L_X, r500
# Step 5: Download PSZ2 FITS, cross-match within 3 arcmin
# Step 6: Add MSZ, Y500 to matched entries
# Step 7: Compute display fields:
#   cosmicDepth = lookback_time(z) / 13.8  → 0–1 scale
#   massCategory = 'group' | 'cluster' | 'supercluster'  from M500
#   displayRichness = clamp(log10(M500 * 1e14) * 1.8, 1, 10)
# Step 8: Write extended JSON with new fields preserved

import astropy.coordinates as coord
import astropy.units as u
import json, csv

CROSSMATCH_RADIUS_ARCMIN = 5.0

def lookback_time_gyr(z):
    # Simple flat ΛCDM approximation (H0=70, Ωm=0.3)
    import numpy as np
    dz = 0.001
    zs = np.arange(0, z, dz)
    integrand = 1.0 / (zs + 1) / np.sqrt(0.3 * (1+zs)**3 + 0.7)
    return (1/70) * np.trapz(integrand, zs) * 977.8  # convert to Gyr
```

---

## 5. New JSON Fields (Extended Format)

```jsonc
{
  "name": "XMMXCS J100026.4+015955",
  "raDeg": 150.110,
  "decDeg": 1.999,
  "z": 0.221,
  "distMpc": 1025.3,
  "tapKev": 3.2,
  "colorHex": "#ff9944",
  "source": "Takey2013",
  // New augmented fields:
  "m500_1e14Msun": 2.8,         // eRASS1 or Planck
  "lx_1e44ergs": 4.1,           // X-ray luminosity
  "r500_mpc": 0.78,             // physical radius
  "lookbackGyr": 2.7,           // derived from z
  "massCategory": "cluster",    // group | cluster | supercluster
  "richness": 6,                // 1–10 scale
  "isCoolCore": false,
  "isMerging": true,
  "szDetected": false,
  "bcgType": "cD elliptical"
}
```

---

## 6. Display Enhancement Plan

Once augmented data is imported, CosmicPage can show:

1. **Mass-colored sprites** — replace temperature-based `tapKev` color with mass category:
   - Groups (M500 < 0.5 × 10¹⁴ M☉): dim blue
   - Clusters (0.5–5): cyan gradient
   - Rich clusters (> 5): bright orange-white (analogous to O-type stars)

2. **Lookback time ring** — outer ring radius encodes how far back in time we're seeing:
   - z=0.1 → 1.3 Gyr ago → thin ring
   - z=1.0 → 7.7 Gyr ago → medium ring
   - z=2.0 → 10.5 Gyr ago → thick ring

3. **Merging cluster flash** — pulsing beacon ring at double the event ring rate

4. **Cool-core glow** — warm yellow-white inner halo for cool-core clusters (dense hot gas)

5. **Cluster panel enrichment** — show `M500`, `lookbackGyr`, and BCG type in side panel

---

*Cross-reference: `src/data/cosmic-structures.ts` (XRayCluster interface), `parse_exoplanet_export.py`
(existing parser pattern), `public/clusters-xray.json` (current 345-entry dataset)*
