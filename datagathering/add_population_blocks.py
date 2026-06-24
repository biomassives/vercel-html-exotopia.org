#!/usr/bin/env python3
"""
add_population_blocks.py

Adds a 'population' block to every public/star-systems/{cluster}/{galaxy}.json.

The block is the compact "source of truth" that the frontend uses to
procedurally uncollapse a galaxy's full star-system population on demand —
no extra network data needed beyond the existing per-galaxy JSON.

  population.nav_count   total navigable system density (visual + anchor)
  population.seed        deterministic integer seed (= hash of galaxy_id)

nav_count is calibrated from:
  galaxy_hubble          morphology baseline (cD 5000 → dIrr 250)
  icm_stress             from provenance.inputs (or radiation_factor proxy)
  environment flags      merger / agn modifiers

The frontend generates background positions + spectral colors entirely from
nav_count + seed using mulberry32.  anchor_systems (star_systems in the JSON)
remain the fully detailed, physically motivated subset.

Idempotent — re-running recalibrates with the current model.

Usage:
    cd datagathering
    python add_population_blocks.py                 # all clusters
    python add_population_blocks.py --cluster virgo
    python add_population_blocks.py --dry-run
    python add_population_blocks.py --stats
"""

import argparse
import json
import os
from collections import defaultdict
from pathlib import Path

ROOT       = Path(__file__).parent.parent
STAR_DIR   = ROOT / 'public' / 'star-systems'

# ── Population baseline by Hubble type ────────────────────────────────────────
# Tuned for navigation game feel — dense enough to look populated, not so large
# that it stresses the GPU (THREE.Points handles 5000 easily at 60 fps).
BASE_NAV: dict[str, int] = {
    'cD':   5000,   # BCG — massive stellar halo, central AGN, post-core-collapse
    'E':    1500,   # Giant elliptical
    'S0':   1100,   # Lenticular — old disk, no arms
    'Sa':   2000,   # Early spiral — tight, metal-rich
    'Sb':   2500,   # Late spiral — loose arms, younger pop
    'Irr':   800,   # Irregular / tidally disturbed
    'dE':    400,   # Dwarf elliptical
    'dIrr':  250,   # Dwarf irregular
}
DEFAULT_NAV = 1000

# ── Seeded RNG matching JS mulberry32 ─────────────────────────────────────────
def _str_seed(s: str) -> int:
    h = 0
    for i, c in enumerate(s):
        h = (h + ord(c) * (i + 1)) & 0xFFFFFFFF
    return h

# ── nav_count calculation ─────────────────────────────────────────────────────
def compute_population(doc: dict) -> dict:
    morph  = doc.get('galaxy_hubble', 'E')
    base   = BASE_NAV.get(morph, DEFAULT_NAV)

    # ICM stress: prefer provenance.inputs, fall back to radiation_factor proxy
    icm = 0.0
    inputs = doc.get('provenance', {}).get('inputs', {})
    if 'icm_stress' in inputs:
        icm = float(inputs['icm_stress'])
    else:
        rf  = float(doc.get('environment', {}).get('radiation_factor', 1.0))
        icm = max(0.0, min(1.0, (rf - 1.0) / 5.0))

    env = doc.get('environment', {})
    if env.get('merger'):
        icm = min(1.0, icm + 0.20)   # tidal disruption reduces stable systems
    if env.get('agn') and icm > 0.4:
        icm = min(1.0, icm + 0.12)   # additional AGN radiation penalty

    nav_count = max(50, int(round(base * max(0.35, 1.0 - 0.55 * icm))))
    seed      = _str_seed(doc.get('galaxy_id', 'unknown'))

    return {'nav_count': nav_count, 'seed': seed}

# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--cluster', default=None, help='Only process one cluster slug')
    parser.add_argument('--dry-run', action='store_true', help='Print counts without writing')
    parser.add_argument('--stats',   action='store_true', help='Print per-cluster summary only')
    args = parser.parse_args()

    slugs = [args.cluster] if args.cluster else sorted(
        d.name for d in STAR_DIR.iterdir() if d.is_dir()
    )

    cluster_stats: dict[str, dict] = defaultdict(lambda: {'galaxies': 0, 'total_nav': 0})
    updated = skipped = 0

    for slug in slugs:
        cluster_dir = STAR_DIR / slug
        if not cluster_dir.is_dir():
            print(f'[WARN] {slug}: directory not found, skipping')
            continue

        files = sorted(cluster_dir.glob('*.json'))
        for fp in files:
            with open(fp) as f:
                doc = json.load(f)

            pop    = compute_population(doc)
            morph  = doc.get('galaxy_hubble', '?')
            anchor = len(doc.get('star_systems', []))

            if args.stats:
                cluster_stats[slug]['galaxies'] += 1
                cluster_stats[slug]['total_nav'] += pop['nav_count']
                continue

            # Check if already identical
            existing = doc.get('population', {})
            if (existing.get('nav_count') == pop['nav_count'] and
                    existing.get('seed')      == pop['seed']):
                skipped += 1
                continue

            if args.dry_run:
                print(f'  {slug}/{fp.name:<30s}  hubble={morph:<4s}  '
                      f'anchor={anchor:2d}  nav_count={pop["nav_count"]:5d}  seed={pop["seed"]}')
                updated += 1
                continue

            doc['population'] = pop
            with open(fp, 'w', encoding='utf-8') as f:
                json.dump(doc, f, indent=2, ensure_ascii=False)
                f.write('\n')
            updated += 1

    if args.stats:
        total_galaxies = total_nav = 0
        for slug, s in sorted(cluster_stats.items()):
            g, n = s['galaxies'], s['total_nav']
            avg  = n // max(1, g)
            print(f'{slug:<30s}  galaxies:{g:4d}  total_nav:{n:8d}  avg/galaxy:{avg:5d}')
            total_galaxies += g; total_nav += n
        print(f'{"TOTAL":<30s}  galaxies:{total_galaxies:4d}  total_nav:{total_nav:8d}  '
              f'avg/galaxy:{total_nav//max(1,total_galaxies):5d}')
        return

    verb = '[DRY RUN] Would update' if args.dry_run else 'Updated'
    print(f'\n{verb} {updated} files, {skipped} already current.')

if __name__ == '__main__':
    main()
