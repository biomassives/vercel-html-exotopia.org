#!/usr/bin/env python3
"""
generate_sky_data.py

Per-exoplanet "local sky" generator — SPEC.md §14. For a given settled exoplanet,
recomputes the apparent position and brightness of every bright-enough Hipparcos
star as actually seen from that planet (not Earth), so every settlement's sky is
genuinely different: nearby stars shift dramatically, distant ones barely move.

Inputs (all pre-fetched/cached alongside this script — see fetch commands below):
  hipparcos.csv              — 118,218-star Hipparcos main catalog (HIP, RA, Dec,
                                Plx, e_Plx, Vmag, B-V, SpType, pmRA, pmDE)
  hip-star-names.json        — HIP -> proper name (450 stars), from the HYG database
  western-constellations.json — all 88 IAU constellations, line patterns as HIP
                                sequences, from Stellarium's actively-maintained
                                stellarium-skycultures repo (JSON sky-culture format,
                                supersedes the older .fab format SPEC.md references)
  public/exoplanets-viz.json — target planets (ra, dec, sy_dist, st_teff, sy_snum, ...)

Output: one JSON file per planet in public/sky/{hostname-slug}.json, matching
SPEC.md §14.4's schema, plus public/sky/index.json listing what's available.

Deliberate scope reductions vs. the full SPEC.md §14 design (noted here so a
future pass knows what's simplified, not silently different):
  - No WDS binary-star cross-match (§14.3's "derived from WDS or Hipparcos
    cross-match" for binary component separation). sy_snum > 1 is conservatively
    classified 'binary_close' (rendered as one bright object) rather than
    attempting 'binary_wide'/'trinary' without real separation data.
  - No IAU constellation *boundary* data (which Earth constellation a star
    belongs to, `earth_constellation` field) — only line *patterns* (which stars
    connect to which), since boundaries aren't needed to draw the lines and
    require a second dataset (VI/49) fetched only if that field is later wanted.
  - color_hex is intentionally omitted from star records — the frontend already
    owns temperature->color via starColorFromTeff() (src/lib/three-utils.ts);
    duplicating that mapping here would just be a second place for it to drift.
  - Exotopia custom constellations (§14.7): the merge point exists
    (EXOTOPIA_CONSTELLATIONS_DIR) but is genuinely community-authored content
    that doesn't exist yet — ships as an empty array, not fabricated.

Fetch commands for the three cached inputs (re-run only if refreshing the data):
  python3 -c "from astroquery.vizier import Vizier; v = Vizier(columns=[
      'HIP','RAICRS','DEICRS','Plx','e_Plx','Vmag','B-V','SpType','pmRA','pmDE'
  ], row_limit=-1); v.get_catalogs('I/239/hip_main')[0].write(
      'datagathering/hipparcos.csv', format='csv', overwrite=True)"
  curl -s https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv -o /tmp/hygdata_v41.csv
      (then extract hip->proper via csv.DictReader — see git history of this script for the one-liner)
  curl -s https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/master/western/index.json \
      -o datagathering/western-constellations.json

Usage:
    python3 generate_sky_data.py --nearest 10       # 10 nearest systems by distance
    python3 generate_sky_data.py --planet "Kepler-452 b"
    python3 generate_sky_data.py --hostname "TRAPPIST-1"
    python3 generate_sky_data.py --all              # every planet with confirmed sy_dist (~800-1000; large, see §14.5.3)
    python3 generate_sky_data.py --dry-run --nearest 5
    python3 generate_sky_data.py --list-missing      # planets that would be skipped (no sy_dist/ra/dec) and why

Requirements: astropy, numpy (both already in this environment). No pandas —
the catalog is small enough (118k rows) that stdlib csv + numpy arrays cover
everything the spec's pandas-based design needed (filtering/sorting/merging),
without fighting this environment's externally-managed-package protection.
"""

import argparse
import csv
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from astropy.coordinates import SkyCoord
import astropy.units as u

ROOT              = Path(__file__).parent.parent
HIPPARCOS_CSV     = Path(__file__).parent / 'hipparcos.csv'
STAR_NAMES_JSON   = Path(__file__).parent / 'hip-star-names.json'
CONSTELLATIONS_JSON = Path(__file__).parent / 'western-constellations.json'
EXOPLANETS_JSON   = ROOT / 'public' / 'exoplanets-viz.json'
OUTPUT_DIR        = ROOT / 'public' / 'sky'
EXOTOPIA_CONSTELLATIONS_DIR = OUTPUT_DIR / 'exotopia-constellations'

GENERATOR_VERSION = '1.0.0'
# Below this distance, a catalog "star" is almost certainly the observer's own
# host star showing up as an independent Hipparcos entry with slightly
# different astrometry (the exoplanet archive's stellar position and
# Hipparcos' own parallax-derived position for the same star are never
# bit-identical) — no real stellar neighbour is ever this close. Excluded from
# `stars`/`nearby_alerts` since it's already described in `host_system.stars`.
HOST_STAR_EXCLUSION_PC = 0.01
# 6.5 = the real naked-eye limiting magnitude under dark skies — not SPEC.md's
# literal "9.0" (that number is Hipparcos' own ~survey-completeness limit, not
# a "still visible" threshold: 83k of the catalog's 118k stars already sit
# under Vmag 9 from Earth alone, so a 9.0 cutoff barely trims anything and
# blows past the spec's own stated "~3,000-8,000 stars per planet" target).
# 6.5 empirically lands at ~8,874 stars from Earth, matching that target.
MAG_CUTOFF        = 6.5
NEARBY_ALERT_PC   = 5.0

# ── Loaders ──────────────────────────────────────────────────────────────────

class Catalog:
    """Hipparcos catalog held as parallel numpy arrays (no pandas needed)."""
    def __init__(self):
        hip, ra, dec, plx, e_plx, vmag, bv, sptype = [], [], [], [], [], [], [], []
        with open(HIPPARCOS_CSV, newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                def fnum(key):
                    v = row.get(key, '').strip()
                    return float(v) if v else float('nan')
                hip.append(int(row['HIP']))
                ra.append(fnum('RAICRS'))
                dec.append(fnum('DEICRS'))
                plx.append(fnum('Plx'))
                e_plx.append(fnum('e_Plx'))
                vmag.append(fnum('Vmag'))
                bv.append(fnum('B-V'))
                sptype.append(row.get('SpType', '').strip())

        self.hip    = np.array(hip, dtype=np.int64)
        self.ra     = np.array(ra)
        self.dec    = np.array(dec)
        self.plx    = np.array(plx)
        self.e_plx  = np.array(e_plx)
        self.vmag   = np.array(vmag)
        self.bv     = np.array(bv)
        self.sptype = np.array(sptype, dtype=object)

        # Reliable-parallax mask — see SPEC.md §14.2.2 "Stars without reliable parallax"
        with np.errstate(invalid='ignore', divide='ignore'):
            frac_err = np.abs(self.e_plx / self.plx)
        self.reliable = (self.plx > 1.0) & np.isfinite(self.plx) & (frac_err <= 0.3)

        self.dist_pc = np.full(len(self.hip), np.nan)
        self.dist_pc[self.reliable] = 1000.0 / self.plx[self.reliable]

        # Precompute 3D Cartesian (parsecs) for reliable-distance stars only —
        # the vectorised inner loop per exoplanet operates on this subset.
        rel = self.reliable
        sc = SkyCoord(ra=self.ra[rel] * u.deg, dec=self.dec[rel] * u.deg,
                      distance=self.dist_pc[rel] * u.pc)
        self.xyz_reliable = np.column_stack([sc.cartesian.x.value, sc.cartesian.y.value, sc.cartesian.z.value])
        self.idx_reliable = np.where(rel)[0]

        self.teff_approx = bv_to_teff(self.bv)

    def name_for(self, hip: int, names: dict) -> str | None:
        return names.get(str(hip))


def bv_to_teff(bv: np.ndarray) -> np.ndarray:
    """Ballesteros (2012) analytic B-V -> effective temperature approximation.
    Reasonable across the whole main sequence + giants without needing a lookup
    table. NaN B-V (missing in catalog) propagates to NaN teff."""
    with np.errstate(invalid='ignore', divide='ignore'):
        return 4600.0 * (1.0 / (0.92 * bv + 1.7) + 1.0 / (0.92 * bv + 0.62))


def load_star_names() -> dict:
    if not STAR_NAMES_JSON.exists():
        return {}
    return json.loads(STAR_NAMES_JSON.read_text())


def load_constellations() -> list[dict]:
    """Western-constellations.json's per-constellation `lines` are polylines
    (sequences of >=2 HIP ids) — convert each to consecutive HIP-pairs to match
    SPEC.md §14.4's `[[hip1,hip2], [hip2,hip3], ...]` schema."""
    if not CONSTELLATIONS_JSON.exists():
        return []
    data = json.loads(CONSTELLATIONS_JSON.read_text())
    out = []
    for con in data.get('constellations', []):
        pairs = []
        for polyline in con.get('lines', []):
            for a, b in zip(polyline, polyline[1:]):
                pairs.append([a, b])
        out.append({
            'id':    con.get('iau', con['id']),
            'name':  con.get('common_name', {}).get('english', con['id']),
            'lines': pairs,
        })
    return out


def load_exotopia_constellations(hostname_slug: str) -> list[dict]:
    """Community-authored per-system constellations — SPEC.md §14.7. Genuinely
    empty until someone submits one; this just defines where that would land."""
    path = EXOTOPIA_CONSTELLATIONS_DIR / f'{hostname_slug}.json'
    if not path.exists():
        return []
    data = json.loads(path.read_text())
    return data.get('constellations', [])


def load_target_planets() -> list[dict]:
    return json.loads(EXOPLANETS_JSON.read_text())


# ── Helpers ──────────────────────────────────────────────────────────────────

def slugify(hostname: str) -> str:
    s = hostname.lower().strip()
    s = s.rstrip('*+')
    out = []
    for ch in s:
        out.append(ch if (ch.isalnum()) else '-')
    slug = ''.join(out)
    while '--' in slug:
        slug = slug.replace('--', '-')
    return slug.strip('-')


def classify_system_type(sy_snum) -> str:
    if sy_snum is None:
        return 'unknown'
    if sy_snum == 0:
        return 'rogue'
    if sy_snum == 1:
        return 'single'
    # >1: no WDS separation data in this pass (see module docstring) — treat
    # conservatively as appearing-as-one, matching SPEC.md's binary_close row.
    return 'binary_close'


# ── Compact array encoding ───────────────────────────────────────────────────
# Same information as the object-per-star schema, but each star is a plain
# array in a fixed column order (documented once via `star_columns`/
# `alert_columns` in the output, not repeated per row) — JSON's per-object key
# names are the dominant cost at ~8,800 stars/file; this removes it entirely.

STAR_COLUMNS = [
    'hip', 'name', 'app_ra', 'app_dec', 'app_mag', 'spectral', 'teff',
    'dist_from_planet_pc', 'dist_from_earth_pc', 'earth_ra', 'earth_dec',
    'pos_shift_deg', 'parallax_uncertain',
]
ALERT_COLUMNS = ['hip', 'name', 'dist_from_planet_pc', 'app_mag', 'pos_shift_deg']


def compact_rows(records: list[dict], columns: list[str]) -> list[list]:
    return [[r[c] for c in columns] for r in records]


# ── Core per-planet generation ──────────────────────────────────────────────

def generate_for_planet(planet: dict, cat: Catalog, names: dict, constellations: list[dict], compact: bool = False) -> dict | None:
    ra, dec, dist = planet.get('ra'), planet.get('dec'), planet.get('sy_dist')
    if ra is None or dec is None or dist is None:
        return None

    obs_sc = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, distance=dist * u.pc)
    obs_xyz = np.array([obs_sc.cartesian.x.value, obs_sc.cartesian.y.value, obs_sc.cartesian.z.value])

    # ── Reliable-parallax stars: full 3D parallax recompute (vectorised) ──────
    rel_xyz  = cat.xyz_reliable - obs_xyz
    rel_dist = np.linalg.norm(rel_xyz, axis=1)
    safe     = rel_dist > 1e-6
    app_sc = SkyCoord(x=rel_xyz[:, 0], y=rel_xyz[:, 1], z=rel_xyz[:, 2],
                       unit='pc', representation_type='cartesian').spherical
    app_ra  = np.mod(app_sc.lon.deg, 360.0)
    app_dec = app_sc.lat.deg

    idx = cat.idx_reliable
    earth_ra_r, earth_dec_r = cat.ra[idx], cat.dec[idx]
    earth_dist_r = cat.dist_pc[idx]
    with np.errstate(invalid='ignore', divide='ignore'):
        adj_mag_r = cat.vmag[idx] + 5.0 * np.log10(np.where(safe, rel_dist, np.nan) / np.maximum(earth_dist_r, 1e-6))

    earth_coord = SkyCoord(ra=earth_ra_r * u.deg, dec=earth_dec_r * u.deg)
    app_coord   = SkyCoord(ra=app_ra * u.deg, dec=app_dec * u.deg)
    shift_deg   = earth_coord.separation(app_coord).deg

    keep_r = safe & np.isfinite(adj_mag_r) & (adj_mag_r <= MAG_CUTOFF) & (rel_dist > HOST_STAR_EXCLUSION_PC)

    stars = []
    for i in np.where(keep_r)[0]:
        gi = idx[i]   # index into the full catalog
        hip = int(cat.hip[gi])
        stars.append({
            'hip': hip,
            'name': names.get(str(hip)),
            'app_ra': round(float(app_ra[i]), 4),
            'app_dec': round(float(app_dec[i]), 4),
            'app_mag': round(float(adj_mag_r[i]), 3),
            'spectral': cat.sptype[gi] or None,
            'teff': None if math.isnan(cat.teff_approx[gi]) else round(float(cat.teff_approx[gi])),
            'dist_from_planet_pc': round(float(rel_dist[i]), 3),
            'dist_from_earth_pc': round(float(earth_dist_r[i]), 3),
            'earth_ra': round(float(earth_ra_r[i]), 4),
            'earth_dec': round(float(earth_dec_r[i]), 4),
            'pos_shift_deg': round(float(shift_deg[i]), 4),
            'parallax_uncertain': False,
        })

    # ── Unreliable-parallax stars: kept at Earth-apparent position, flagged ──
    unrel_mask = ~cat.reliable
    unrel_keep = unrel_mask & (cat.vmag <= MAG_CUTOFF)
    for gi in np.where(unrel_keep)[0]:
        hip = int(cat.hip[gi])
        stars.append({
            'hip': hip,
            'name': names.get(str(hip)),
            'app_ra': round(float(cat.ra[gi]), 4),
            'app_dec': round(float(cat.dec[gi]), 4),
            'app_mag': round(float(cat.vmag[gi]), 3),
            'spectral': cat.sptype[gi] or None,
            'teff': None if math.isnan(cat.teff_approx[gi]) else round(float(cat.teff_approx[gi])),
            'dist_from_planet_pc': None,
            'dist_from_earth_pc': None,
            'earth_ra': round(float(cat.ra[gi]), 4),
            'earth_dec': round(float(cat.dec[gi]), 4),
            'pos_shift_deg': 0.0,
            'parallax_uncertain': True,
        })

    stars.sort(key=lambda s: s['app_mag'])
    if len(stars) > 10000:   # safety cap — see module docstring performance notes
        stars = stars[:10000]

    output_hips = {s['hip'] for s in stars}
    earth_constellations = []
    for con in constellations:
        lines = [pair for pair in con['lines'] if pair[0] in output_hips and pair[1] in output_hips]
        if lines:
            earth_constellations.append({'id': con['id'], 'name': con['name'], 'lines': lines})

    nearby_alerts = [
        {
            'hip': s['hip'], 'name': s['name'],
            'dist_from_planet_pc': s['dist_from_planet_pc'],
            'app_mag': s['app_mag'], 'pos_shift_deg': s['pos_shift_deg'],
        }
        for s in stars
        if s['dist_from_planet_pc'] is not None and s['dist_from_planet_pc'] < NEARBY_ALERT_PC
    ]

    hostname_slug = slugify(planet['hostname'])
    system_type = classify_system_type(planet.get('sy_snum'))
    host_stars = []
    if system_type != 'rogue':
        teff = planet.get('st_teff') or 5778
        host_stars.append({
            'id': planet['hostname'],
            'spectral_type': planet.get('st_spectype'),
            'teff': teff,
            'st_rad': planet.get('st_rad'),
            'app_mag_from_planet': None,   # host star is far too close for the Vmag/distance-modulus model above
            'note': 'Primary host star — rendered as moving sun in sky',
        })

    doc = {
        'meta': {
            'hostname': planet['hostname'],
            'pl_name': planet['pl_name'],
            'generated': datetime.now(timezone.utc).isoformat(),
            'generator_version': GENERATOR_VERSION,
            'catalog': 'HIP',
            'coord_epoch': 'J2000.0',
            'star_count': len(stars),
            'cutoff_app_mag': MAG_CUTOFF,
            'host_dist_pc': dist,
            'sky_complete': True,
            'encoding': 'compact-array' if compact else 'object',
        },
        'host_system': {'type': system_type, 'stars': host_stars},
        'constellations': {
            'earth': earth_constellations,
            'exotopia': load_exotopia_constellations(hostname_slug),
        },
    }

    if compact:
        doc['star_columns']  = STAR_COLUMNS
        doc['stars']         = compact_rows(stars, STAR_COLUMNS)
        doc['alert_columns'] = ALERT_COLUMNS
        doc['nearby_alerts'] = compact_rows(nearby_alerts, ALERT_COLUMNS)
    else:
        doc['stars']         = stars
        doc['nearby_alerts'] = nearby_alerts

    return doc, hostname_slug


# ── CLI ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--planet', help='Generate for one pl_name exactly')
    ap.add_argument('--hostname', help='Generate for every planet at this hostname')
    ap.add_argument('--nearest', type=int, help='Generate for the N nearest systems by sy_dist')
    ap.add_argument('--all', action='store_true', help='Generate for every planet with confirmed sy_dist/ra/dec')
    ap.add_argument('--list-missing', action='store_true', help='List planets that would be skipped, and why')
    ap.add_argument('--dry-run', action='store_true', help='Compute but do not write files')
    ap.add_argument('--compact', action='store_true', help='Write stars/nearby_alerts as column-ordered arrays instead of objects (smaller files)')
    args = ap.parse_args()

    if not HIPPARCOS_CSV.exists():
        sys.exit(f'Missing {HIPPARCOS_CSV} — see the fetch commands in this script\'s docstring.')

    planets = load_target_planets()

    if args.list_missing:
        missing = [p for p in planets if p.get('ra') is None or p.get('dec') is None or p.get('sy_dist') is None]
        print(f'{len(missing)} / {len(planets)} planets skipped (missing ra/dec/sy_dist):')
        for p in missing[:40]:
            print(' ', p['pl_name'])
        if len(missing) > 40:
            print(f'  ... and {len(missing) - 40} more')
        return

    targets = [p for p in planets if p.get('ra') is not None and p.get('dec') is not None and p.get('sy_dist') is not None]

    if args.planet:
        targets = [p for p in targets if p['pl_name'] == args.planet]
    elif args.hostname:
        targets = [p for p in targets if p['hostname'] == args.hostname]
    elif args.nearest:
        targets = sorted(targets, key=lambda p: p['sy_dist'])[:args.nearest]
    elif not args.all:
        ap.error('Specify one of --planet, --hostname, --nearest N, --all, or --list-missing')

    print(f'Loading Hipparcos catalog ({HIPPARCOS_CSV})...')
    cat = Catalog()
    print(f'  {len(cat.hip)} stars, {cat.reliable.sum()} with reliable parallax')
    names = load_star_names()
    constellations = load_constellations()
    print(f'  {len(names)} named stars, {len(constellations)} constellations loaded')

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    index = {}
    if not args.dry_run and (OUTPUT_DIR / 'index.json').exists():
        index = json.loads((OUTPUT_DIR / 'index.json').read_text())

    print(f'Generating sky data for {len(targets)} planet(s)...')
    seen_hosts = set()
    for i, planet in enumerate(targets):
        if planet['hostname'] in seen_hosts:
            continue   # one sky file per host star, not per planet — siblings share a vantage point
        seen_hosts.add(planet['hostname'])

        result = generate_for_planet(planet, cat, names, constellations, compact=args.compact)
        if result is None:
            continue
        doc, slug = result

        print(f'  [{i+1}/{len(targets)}] {planet["hostname"]} -> {slug}.json '
              f'({doc["meta"]["star_count"]} stars, {len(doc["nearby_alerts"])} nearby alerts)')

        if not args.dry_run:
            out_path = OUTPUT_DIR / f'{slug}.json'
            out_path.write_text(json.dumps(doc, indent=None, separators=(',', ':')))
            index[slug] = {
                'hostname': planet['hostname'],
                'pl_name': planet['pl_name'],
                'star_count': doc['meta']['star_count'],
            }

    if not args.dry_run:
        (OUTPUT_DIR / 'index.json').write_text(json.dumps(index, indent=2, sort_keys=True))
        print(f'Wrote {OUTPUT_DIR / "index.json"} ({len(index)} systems total)')


if __name__ == '__main__':
    main()
