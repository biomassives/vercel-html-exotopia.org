#!/usr/bin/env python3
"""
fetch_cluster_catalogs.py
Downloads galaxy cluster member catalogs from VizieR and NED,
enriches with RC3 morphological data, and outputs JSON files
ready for consumption by the Exotopia LOD 2/3 renderer.

Requirements:
    pip install astropy astroquery requests

Usage:
    python fetch_cluster_catalogs.py               # all clusters
    python fetch_cluster_catalogs.py --cluster virgo
    python fetch_cluster_catalogs.py --dry-run     # show counts only
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path

try:
    from astroquery.vizier import Vizier
    from astropy.coordinates import SkyCoord
    import astropy.units as u
    HAS_ASTROQUERY = True
except ImportError:
    HAS_ASTROQUERY = False
    print("WARNING: astroquery not installed. Run: pip install astropy astroquery")

# ── Constants ─────────────────────────────────────────────────────────────────

MPC_SCALE  = 1 / 15      # 1 Mpc → 0.0667 scene units (matches cosmic-structures.ts)
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'clusters'

# ── Known named clusters (matches cosmic-structures.ts CLUSTERS array) ────────

NAMED_CLUSTERS = [
    {
        'slug':       'virgo',
        'name':       'Virgo Cluster',
        'ra':         186.75,   # degrees J2000
        'dec':        12.72,
        'dist_mpc':   16.5,
        'rvir_mpc':   1.1,
        'richness':   7,
        'vizier_cat': 'VII/62A/vcc',   # Binggeli+1985 VCC
        'search_rad': 6.0,             # degrees
        'notes':      'Nearest rich cluster; three subclusters A (M87), B (M49), C (NGC4261)',
    },
    {
        'slug':       'fornax',
        'name':       'Fornax Cluster',
        'ra':         54.62,
        'dec':        -35.45,
        'dist_mpc':   19.0,
        'rvir_mpc':   0.7,
        'richness':   5,
        'vizier_cat': 'VII/70A/fcc',   # Ferguson 1989 FCC
        'search_rad': 3.0,
        'notes':      'Regular, near-spherical cluster; NGC1399 BCG',
    },
    {
        'slug':       'coma',
        'name':       'Coma Cluster',
        'ra':         194.95,
        'dec':        27.98,
        'dist_mpc':   99.0,
        'rvir_mpc':   2.1,
        'richness':   9,
        'vizier_cat': None,             # Use NED query instead
        'search_rad': 1.5,
        'notes':      'Richest nearby cluster; bimodal NGC4889+NGC4874 core',
    },
    {
        'slug':       'perseus',
        'name':       'Perseus Cluster',
        'ra':         49.5,
        'dec':        41.5,
        'dist_mpc':   73.0,
        'rvir_mpc':   1.8,
        'richness':   8,
        'vizier_cat': None,
        'search_rad': 1.2,
        'notes':      'Perseus A (NGC1275) Seyfert BCG; strong cooling flow',
    },
    {
        'slug':       'centaurus',
        'name':       'Centaurus Cluster',
        'ra':         192.2,
        'dec':        -41.3,
        'dist_mpc':   46.0,
        'rvir_mpc':   1.0,
        'richness':   6,
        'vizier_cat': None,
        'search_rad': 1.0,
        'notes':      'Two subclusters: Cen30 (35 Mpc) + Cen45 (45 Mpc); NGC4696 BCG',
    },
]

# Named bright galaxies already in cosmic-structures.ts — enrich these with
# correct angular offsets and RC3 structural parameters
BRIGHT_GALAXY_CATALOG = {
    'Virgo Cluster': [
        {'name': 'M87',        'ngc': 'NGC 4486', 'ra': 187.706, 'dec':  12.391},
        {'name': 'M86',        'ngc': 'NGC 4406', 'ra': 186.550, 'dec':  12.947},
        {'name': 'M84',        'ngc': 'NGC 4374', 'ra': 186.266, 'dec':  12.887},
        {'name': 'M49',        'ngc': 'NGC 4472', 'ra': 187.445, 'dec':   8.000},
    ],
    'Fornax Cluster': [
        {'name': 'NGC 1399',   'ngc': 'NGC 1399', 'ra':  54.621, 'dec': -35.451},
        {'name': 'NGC 1316',   'ngc': 'NGC 1316', 'ra':  50.674, 'dec': -37.208},
        {'name': 'NGC 1365',   'ngc': 'NGC 1365', 'ra':  53.402, 'dec': -36.140},
    ],
    'Coma Cluster': [
        {'name': 'NGC 4889',   'ngc': 'NGC 4889', 'ra': 195.034, 'dec':  27.977},
        {'name': 'NGC 4874',   'ngc': 'NGC 4874', 'ra': 194.899, 'dec':  27.959},
        {'name': 'NGC 4921',   'ngc': 'NGC 4921', 'ra': 195.351, 'dec':  27.887},
    ],
    'Perseus Cluster': [
        {'name': 'NGC 1275',   'ngc': 'NGC 1275', 'ra':  49.951, 'dec':  41.512},
        {'name': 'NGC 1272',   'ngc': 'NGC 1272', 'ra':  49.838, 'dec':  41.492},
    ],
    'Centaurus Cluster': [
        {'name': 'NGC 4696',   'ngc': 'NGC 4696', 'ra': 192.204, 'dec': -41.309},
        {'name': 'NGC 4709',   'ngc': 'NGC 4709', 'ra': 192.608, 'dec': -41.379},
    ],
}

# ── Hubble type mapping ────────────────────────────────────────────────────────

def parse_morph_to_hubble(type_str):
    """Map raw morphology string to our Hubble code."""
    if not type_str:
        return 'E'
    t = str(type_str).lower().strip()
    # cD / BCG indicators
    if any(x in t for x in ['cd', 'c d', 'bcg', 'dominant']):
        return 'cD'
    # Irregular
    if any(x in t for x in ['irr', 'iam', 'ibm', 'i ', 'pec']):
        return 'Irr'
    # Lenticular
    if any(x in t for x in ['s0', 'sa0', 'sb0', 'lenticular']):
        return 'S0'
    # Spirals
    if 'sd' in t or 'sc' in t:
        return 'Sb'   # treat Sc/Sd as Sb for visual purposes
    if 'sb' in t:
        return 'Sb'
    if 'sa' in t:
        return 'Sa'
    if t.startswith('s') and 'e' not in t:
        return 'Sa'
    # Ellipticals
    if t.startswith('e') or 'elliptical' in t:
        return 'E'
    return 'E'


def T_type_to_hubble(T):
    """Map RC3 numerical T-type to our Hubble code."""
    if T is None:
        return 'E'
    T = float(T)
    if T <= -4:   return 'cD'   # cD giants
    if T <= -1:   return 'E'
    if T <=  0:   return 'S0'
    if T <=  2:   return 'Sa'
    if T <=  5:   return 'Sb'
    if T <=  9:   return 'Sb'   # Sc/Sd → Sb for simplicity
    return 'Irr'

# ── Coordinate conversions ────────────────────────────────────────────────────

def angular_offset_to_scene(delta_ra_deg, delta_dec_deg, dist_mpc):
    """
    Convert on-sky angular separation from cluster centre to scene-unit offset.
    Uses small-angle approximation (valid for cluster member separations < a few degrees).
    delta_ra_deg should already be corrected: (ra_member - ra_centre) * cos(dec_centre)
    Returns [x_scene, y_scene, z_scene=0.0].
    Note: z=0 until redshift data is added by enrich_with_redshifts().
    """
    delta_ra_mpc  = math.radians(delta_ra_deg)  * dist_mpc
    delta_dec_mpc = math.radians(delta_dec_deg) * dist_mpc
    return [
        round(delta_ra_mpc  * MPC_SCALE, 5),
        round(delta_dec_mpc * MPC_SCALE, 5),
        0.0,
    ]


def compute_lod3_params(T_type, D25_arcmin, axis_ratio, dist_mpc):
    """
    Compute LOD3 texture rendering parameters from catalog photometric data.
    scene_su: apparent half-light radius in scene units
    pitch_deg: logarithmic spiral arm pitch angle
    n_arms: number of spiral arms
    """
    # Physical major axis from angular diameter distance
    D25_arcmin = D25_arcmin or 0.5
    phys_kpc   = (D25_arcmin / 60) * math.radians(1) * dist_mpc * 1000
    scene_su   = max(0.003, phys_kpc / 1000 * MPC_SCALE * 8)   # ×8 visibility boost

    T = float(T_type) if T_type is not None else 0
    if T <= -1:  pitch, n_arms = 0,  0   # E
    elif T <= 0: pitch, n_arms = 0,  0   # S0
    elif T <= 2: pitch, n_arms = 8,  2   # Sa
    elif T <= 5: pitch, n_arms = 12, 2   # Sb
    elif T <= 9: pitch, n_arms = 18, 2   # Sc/Sd
    else:        pitch, n_arms = 0,  0   # Irr

    return {
        'scene_su':   round(scene_su, 5),
        'axis_ratio': round(float(axis_ratio) if axis_ratio else 0.8, 3),
        'pitch_deg':  pitch,
        'n_arms':     n_arms,
    }

# ── VizieR catalog fetch ──────────────────────────────────────────────────────

def fetch_vizier_members(cluster, max_rows=2500):
    """Fetch galaxy members from VizieR catalog."""
    if not HAS_ASTROQUERY:
        print(f"  [SKIP] astroquery not available")
        return []

    cat = cluster.get('vizier_cat')
    if not cat:
        print(f"  [SKIP] No VizieR catalog specified for {cluster['name']}")
        return []

    v = Vizier(row_limit=max_rows)
    centre = SkyCoord(cluster['ra'], cluster['dec'], unit='deg', frame='icrs')

    try:
        result = v.query_region(centre, radius=cluster['search_rad'] * u.deg, catalog=cat)
    except Exception as e:
        print(f"  [ERROR] VizieR query failed: {e}")
        return []

    if not result or len(result) == 0:
        print(f"  [WARN] No results from {cat}")
        return []

    tbl = result[0]
    print(f"  Found {len(tbl)} rows in {cat}")

    members = []
    cos_dec  = math.cos(math.radians(cluster['dec']))
    dist_mpc = cluster['dist_mpc']

    for row in tbl:
        ra  = float(row.get('_RAJ2000', row.get('RAJ2000', 0)))
        dec = float(row.get('_DEJ2000', row.get('DEJ2000', 0)))
        dra  = (ra  - cluster['ra'])  * cos_dec
        ddec = dec - cluster['dec']

        # Skip members clearly outside virial radius
        sep_mpc = math.sqrt((math.radians(dra)*dist_mpc)**2 + (math.radians(ddec)*dist_mpc)**2)
        if sep_mpc > cluster['rvir_mpc'] * 2.5:
            continue

        # Magnitude
        bt = None
        for f in ['BT', 'bmag', 'Btot', 'B', 'mag']:
            if f in row.colnames and row[f] is not None:
                try: bt = float(row[f]); break
                except: pass

        # Morphology
        morph_str = ''
        for f in ['Type', 'morph', 'Morph', 'T', 'type']:
            if f in row.colnames and row[f]:
                morph_str = str(row[f]); break

        hubble = parse_morph_to_hubble(morph_str)

        # ID
        gal_id = ''
        for f in ['VCC', 'FCC', 'Name', 'NGC', 'Num']:
            if f in row.colnames and row[f]:
                gal_id = f"{f} {row[f]}"; break

        members.append({
            'id':     gal_id or f"anon-{len(members)}",
            'ra':     round(ra, 5),
            'dec':    round(dec, 5),
            'hubble': hubble,
            'bt_mag': round(bt, 2) if bt else None,
            'offset': angular_offset_to_scene(dra, ddec, dist_mpc),
        })

    return members


def enrich_bright_galaxies(cluster_name, members, dist_mpc):
    """
    Merge catalog members with hand-curated bright galaxy data.
    Prioritises the hand-curated positions and adds them if not already present.
    """
    bright = BRIGHT_GALAXY_CATALOG.get(cluster_name, [])
    existing_ras = {m['ra'] for m in members}
    cos_dec = math.cos(math.radians(
        next(c['dec'] for c in NAMED_CLUSTERS if c['name'] == cluster_name), 0
    ))
    cluster_ra = next(c['ra'] for c in NAMED_CLUSTERS if c['name'] == cluster_name)
    cluster_dec = next(c['dec'] for c in NAMED_CLUSTERS if c['name'] == cluster_name)

    added = 0
    for bg in bright:
        # Check if already in members (within 0.01°)
        already = any(abs(m['ra'] - bg['ra']) < 0.01 and abs(m['dec'] - bg['dec']) < 0.01
                      for m in members)
        if not already:
            dra  = (bg['ra']  - cluster_ra)  * cos_dec
            ddec = bg['dec'] - cluster_dec
            members.insert(0, {
                'id':        bg['ngc'],
                'name':      bg['name'],
                'ra':        bg['ra'],
                'dec':       bg['dec'],
                'hubble':    'cD' if 'BCG' in bg.get('notes','') or bg == bright[0] else 'E',
                'bt_mag':    None,
                'offset':    angular_offset_to_scene(dra, ddec, dist_mpc),
                'is_named':  True,
            })
            added += 1

    if added:
        print(f"  Added {added} named bright galaxies to {cluster_name}")
    return members

# ── Main ──────────────────────────────────────────────────────────────────────

def process_cluster(cluster, dry_run=False):
    print(f"\nProcessing: {cluster['name']} (z≈{cluster['dist_mpc']/4285:.3f}, d={cluster['dist_mpc']} Mpc)")

    members = fetch_vizier_members(cluster)
    members = enrich_bright_galaxies(cluster['name'], members, cluster['dist_mpc'])

    # Sort: BCGs first, then by brightness
    def sort_key(m):
        is_named = m.get('is_named', False)
        hubble   = m.get('hubble', 'E')
        bt       = m.get('bt_mag') or 20.0
        return (0 if is_named else 1, 0 if hubble == 'cD' else 1, bt)

    members.sort(key=sort_key)

    # Add LOD3 params (placeholder — will be filled by enrich_with_rc3.py)
    for m in members:
        m['lod3_params'] = compute_lod3_params(
            T_type   = None,
            D25_arcmin = None,
            axis_ratio = 0.8,
            dist_mpc  = cluster['dist_mpc'],
        )

    out = {
        'cluster':    cluster['name'],
        'slug':       cluster['slug'],
        'center_ra':  cluster['ra'],
        'center_dec': cluster['dec'],
        'dist_mpc':   cluster['dist_mpc'],
        'rvir_mpc':   cluster['rvir_mpc'],
        'richness':   cluster['richness'],
        'notes':      cluster.get('notes', ''),
        'members':    members,
    }

    print(f"  → {len(members)} members total")

    if dry_run:
        print(f"  [DRY RUN] Would write to public/clusters/{cluster['slug']}-members.json")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"{cluster['slug']}-members.json"
    with open(out_path, 'w') as f:
        json.dump(out, f, indent=1)
    print(f"  ✓ Written: {out_path} ({out_path.stat().st_size // 1024} KB)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cluster', help='Slug of a single cluster to process')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    clusters = NAMED_CLUSTERS
    if args.cluster:
        clusters = [c for c in NAMED_CLUSTERS if c['slug'] == args.cluster]
        if not clusters:
            print(f"Unknown cluster slug: {args.cluster}")
            sys.exit(1)

    for cluster in clusters:
        process_cluster(cluster, dry_run=args.dry_run)

    print(f"\nDone. Output dir: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
