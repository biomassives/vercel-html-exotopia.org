#!/usr/bin/env python3
"""
enrich_with_rc3.py
Enriches pre-generated cluster member JSON files with RC3 structural data
(axis ratio, position angle, angular size, numerical Hubble type) so that
the LOD 3 renderer can build accurate galaxy structure textures.

Reads from:  public/clusters/<slug>-members.json
Writes back: public/clusters/<slug>-members.json  (in-place update)

Requirements: pip install astropy astroquery
"""

import json
import math
from pathlib import Path

try:
    from astroquery.vizier import Vizier
    import astropy.units as u
    HAS_ASTROQUERY = True
except ImportError:
    HAS_ASTROQUERY = False
    print("WARNING: astroquery not installed. Run: pip install astropy astroquery")

MPC_SCALE  = 1 / 15
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'clusters'

# RC3 VizieR table: VII/155/rc3
RC3_VIZIER = 'VII/155/rc3'

# Cache: avoid querying the same galaxy twice
_rc3_cache = {}


def query_rc3(name):
    """Query RC3 for a galaxy by name. Returns dict or None."""
    if name in _rc3_cache:
        return _rc3_cache[name]

    if not HAS_ASTROQUERY:
        return None

    try:
        v = Vizier(columns=['Name', 'T', 'D25', 'r25', 'PA', 'BT'], row_limit=5)
        result = v.query_constraints(Name=name, catalog=RC3_VIZIER)
        if not result or len(result[0]) == 0:
            _rc3_cache[name] = None
            return None
        row = result[0][0]
        data = {
            'T_type':     float(row['T'])   if row['T']   else None,
            'D25_arcmin': float(row['D25']) if row['D25'] else None,
            'axis_ratio': float(row['r25']) if row['r25'] else 0.8,
            'pa_deg':     float(row['PA'])  if row['PA']  else 0.0,
            'bt_mag_rc3': float(row['BT'])  if row['BT']  else None,
        }
        _rc3_cache[name] = data
        return data
    except Exception as e:
        print(f"  [WARN] RC3 query failed for {name}: {e}")
        _rc3_cache[name] = None
        return None


def T_type_to_hubble(T):
    if T is None: return None
    T = float(T)
    if T <= -4: return 'cD'
    if T <= -1: return 'E'
    if T <=  0: return 'S0'
    if T <=  2: return 'Sa'
    if T <=  5: return 'Sb'
    return 'Irr'


def lod3_params_from_rc3(rc3, dist_mpc):
    """Compute LOD3 rendering params from RC3 data."""
    T   = rc3.get('T_type')
    D25 = rc3.get('D25_arcmin') or 0.5
    r25 = rc3.get('axis_ratio') or 0.8

    # Physical major axis (kpc)
    phys_kpc = (D25 / 60) * math.radians(1) * dist_mpc * 1000

    # Visual scale: real size × 8 for visibility at cluster distances
    scene_su = max(0.003, phys_kpc / 1000 * MPC_SCALE * 8)

    T_val = float(T) if T is not None else 0
    if T_val <= -1:  pitch, n_arms = 0,  0
    elif T_val <= 0: pitch, n_arms = 0,  0
    elif T_val <= 2: pitch, n_arms = 8,  2
    elif T_val <= 5: pitch, n_arms = 12, 2
    else:            pitch, n_arms = 18, 2

    return {
        'scene_su':   round(scene_su, 5),
        'axis_ratio': round(float(r25), 3),
        'pitch_deg':  pitch,
        'n_arms':     n_arms,
        'pa_deg':     round(float(rc3.get('pa_deg') or 0), 1),
        'T_type':     T_val,
    }


def enrich_file(json_path):
    print(f"\nEnriching: {json_path.name}")
    with open(json_path) as f:
        data = json.load(f)

    dist_mpc = data['dist_mpc']
    updated  = 0
    skipped  = 0

    for m in data['members']:
        # Try to find galaxy name for RC3 lookup
        name = m.get('name') or m.get('id', '')
        if not name:
            skipped += 1
            continue

        rc3 = query_rc3(name)
        if rc3 is None:
            # Try alternate names
            for alt in (m.get('aliases') or []):
                rc3 = query_rc3(alt)
                if rc3: break

        if rc3:
            # Update hubble type if RC3 has T_type
            rc3_hubble = T_type_to_hubble(rc3['T_type'])
            if rc3_hubble:
                m['hubble']   = rc3_hubble
            m['lod3_params'] = lod3_params_from_rc3(rc3, dist_mpc)
            m['rc3']         = rc3
            updated += 1
        else:
            skipped += 1

    print(f"  Updated: {updated}  |  No RC3 data: {skipped}")

    with open(json_path, 'w') as f:
        json.dump(data, f, indent=1)
    print(f"  ✓ Saved {json_path}")


def main():
    if not OUTPUT_DIR.exists():
        print(f"No cluster files found in {OUTPUT_DIR}")
        print("Run fetch_cluster_catalogs.py first.")
        return

    json_files = sorted(OUTPUT_DIR.glob('*-members.json'))
    if not json_files:
        print("No *-members.json files found. Run fetch_cluster_catalogs.py first.")
        return

    for path in json_files:
        enrich_file(path)

    print(f"\nDone. {len(json_files)} cluster files enriched.")


if __name__ == '__main__':
    main()
