#!/usr/bin/env python3
"""
Galaxy Oracle Generator — universe-221x

Generates per-cluster galaxy member data for all 345 XMM-Newton clusters.
Output lands in public/galaxy-oracle/ as one JSON file per cluster plus an index.

Universe versioning:
  Seed integer (221) + revision letter (x) = "universe-221x"
  Change the seed for a wholly different galaxy distribution.
  Increment the letter (x → a, b…) for parameter tuning within the same seed.

Run from the repo root:
    python3 datagathering/generate_galaxy_oracle.py

Or with a custom seed / revision:
    python3 datagathering/generate_galaxy_oracle.py --seed 222 --rev a
"""

import argparse
import json
import math
import os
import re
import sys
from datetime import datetime, timezone

# ── Constants — mirror of CosmicPage.vue values ───────────────────────────────

UNIVERSE_SEED    = 221
UNIVERSE_REV     = 'x'
MORPH_TYPES      = ['cD', 'E', 'S0', 'Sa', 'Sb', 'Irr']

# Morphology → [r, g, b] base tint (decimal 0-1) — mirrors morphColor() in CosmicPage
MORPH_TINT = {
    'cD':  (1.000, 0.878, 0.627),
    'E':   (1.000, 0.878, 0.627),
    'S0':  (1.000, 0.961, 0.878),
    'Sa':  (0.878, 0.941, 1.000),
    'Sb':  (0.753, 0.878, 1.000),
    'Irr': (0.627, 0.784, 1.000),
}

# ── Mulberry32 PRNG — identical to seededRng() in CosmicPage.vue ──────────────

def mulberry32(seed: int):
    """Returns a closure that yields floats in [0, 1) — matches JS seededRng."""
    state = [seed & 0xFFFFFFFF]

    def next_val() -> float:
        state[0] = (state[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = state[0]
        t = ((t ^ (t >> 15)) * ((t | 1) & 0xFFFFFFFF)) & 0xFFFFFFFF
        t = (t ^ (t + ((t ^ (t >> 7)) * ((t | 61) & 0xFFFFFFFF)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return (t & 0xFFFFFFFF) / 4294967296.0

    return next_val


# ── Morphology density relation — mirrors pickMorphology() ────────────────────

def pick_morphology(rng, r_frac: float, is_bcg: bool) -> str:
    if is_bcg:
        return 'cD'
    x = rng()
    if r_frac < 0.30:
        return 'E' if x < 0.65 else ('S0' if x < 0.90 else 'Sa')
    if r_frac < 0.65:
        return 'E' if x < 0.48 else ('S0' if x < 0.78 else ('Sa' if x < 0.92 else 'Irr'))
    return 'E' if x < 0.30 else ('S0' if x < 0.55 else ('Sa' if x < 0.80 else ('Sb' if x < 0.92 else 'Irr')))


def lerp_color(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def morph_color(morph: str, base_rgb: tuple, z_red: float) -> str:
    """Return '#rrggbb' for a galaxy given its morphology, cluster base colour, and redshift."""
    t_map = {'cD': 0.55, 'E': 0.55, 'S0': 0.25, 'Sa': 0.30, 'Sb': 0.40, 'Irr': 0.55}
    tint  = MORPH_TINT.get(morph, MORPH_TINT['E'])
    t     = t_map.get(morph, 0.30)
    r, g, b = lerp_color(base_rgb, tint, t)

    # Cosmological reddening toward warm orange (0xff7744 = 1.0, 0.467, 0.267)
    if z_red > 0:
        r, g, b = lerp_color((r, g, b), (1.0, 0.467, 0.267), z_red)

    return '#{:02x}{:02x}{:02x}'.format(
        max(0, min(255, round(r * 255))),
        max(0, min(255, round(g * 255))),
        max(0, min(255, round(b * 255))),
    )


def tap_kev_to_richness(tap_kev: float) -> float:
    """Convert X-ray temperature to richness proxy [0-10] — matches JS."""
    return min(10.0, max(1.0, tap_kev * 1.35))


def hex_to_rgb(hex_str: str) -> tuple:
    h = hex_str.lstrip('#')
    return (int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255)


def safe_id(name: str) -> str:
    """Convert an XMM cluster name to a safe filename component."""
    s = re.sub(r'[^a-zA-Z0-9]', '-', name)
    s = re.sub(r'-+', '-', s).strip('-').lower()
    return s


# ── Oracle generation ─────────────────────────────────────────────────────────

def generate_cluster(cluster: dict, universe_ver: str, seed_base: int) -> dict:
    name      = cluster['name']
    tap_kev   = cluster.get('tap_kev') or cluster.get('tapKev') or 3.0
    dist_mpc  = cluster.get('dist_mpc') or cluster.get('distMpc') or 500.0
    color_hex = cluster.get('color_hex') or cluster.get('colorHex') or '#ffe0b0'

    richness   = tap_kev_to_richness(tap_kev)
    base_rgb   = hex_to_rgb(color_hex)

    # Seed: mix cluster name characters with universe seed — mirrors JS seededRng call
    name_seed = ord(name[1]) * 997 + ord(name[min(5, len(name)-1)]) + seed_base * 31337
    rng = mulberry32(name_seed & 0xFFFFFFFF)

    count  = int(50 + round(richness * 8))
    radius = 0.55 + richness * 0.08

    z_dim = max(0.38, 1.0 - (dist_mpc - 300) / 2200) if dist_mpc > 300 else 1.0
    z_red = min(0.42, max(0.0, (dist_mpc - 800) / 2600))
    hot_boost = min(1.0, max(0.0, (tap_kev - 2.5) / 5.0))

    has_subcluster = richness >= 8
    sub_angle = rng() * math.pi * 2
    sub_core  = (radius * 0.32 * math.cos(sub_angle), 0.0, radius * 0.32 * math.sin(sub_angle))

    safe = safe_id(name)
    galaxies = []

    for i in range(count):
        is_bcg = i == 0
        in_sub = has_subcluster and not is_bcg and rng() < 0.28

        r_frac  = 0.04 if is_bcg else math.sqrt(rng()) * (0.15 + rng() * 0.85)
        r       = radius * r_frac
        theta   = rng() * math.pi * 2
        phi     = math.acos(max(-1.0, min(1.0, 2 * rng() - 1))) * (1 - r_frac * 0.4)

        morph_r_frac = max(0.0, r_frac - hot_boost * 0.20)
        morph = pick_morphology(rng, morph_r_frac, is_bcg)
        col   = morph_color(morph, base_rgb, z_red)

        # Schechter luminosity function
        u1, u2 = rng(), rng()
        lum = 2.0 if is_bcg else min(2.5, max(0.05, -math.log(max(0.001, u1)) * (u2 ** 0.40)))

        base_sz = {'cD': 0.040, 'E': 0.012, 'S0': 0.010}.get(morph, 0.013)
        size_su = round(base_sz * (0.45 + lum * 0.55), 4)

        # Position
        cx_off = sub_core[0] if in_sub else 0.0
        cz_off = sub_core[2] if in_sub else 0.0
        px = cx_off + r * math.sin(phi) * math.cos(theta)
        py = r * math.sin(phi) * math.sin(theta) * 0.65
        pz = cz_off + r * math.cos(phi)

        rot_rad = rng() * math.pi

        opacity_raw = z_dim * (0.92 if is_bcg else 0.55 + lum * 0.18)
        opacity = round(min(1.0, opacity_raw), 3)

        # Axis ratio (inclination for disk types)
        axis_ratio = 1.0
        if morph in ('S0', 'Sa', 'Sb', 'Irr'):
            incl = rng() * math.pi
            axis_ratio = round(0.2 + abs(math.cos(incl)) * 0.8, 3)

        galaxies.append({
            'gid':        f'{safe}_{i:04d}',
            'morph':      morph,
            'col_hex':    col,
            'size_su':    size_su,
            'pos_su':     [round(px, 4), round(py, 4), round(pz, 4)],
            'rot_rad':    round(rot_rad, 4),
            'opacity':    opacity,
            'axis_ratio': axis_ratio,
            'is_bcg':     is_bcg,
            'in_sub':     in_sub,
        })

    return {
        'cluster_id':   name,
        'universe_ver': universe_ver,
        'galaxies':     galaxies,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Generate galaxy oracle JSON files')
    parser.add_argument('--seed', type=int,  default=UNIVERSE_SEED)
    parser.add_argument('--rev',  type=str,  default=UNIVERSE_REV)
    parser.add_argument('--input',  default='public/clusters-xray.json')
    parser.add_argument('--outdir', default='public/galaxy-oracle')
    args = parser.parse_args()

    universe_ver = f'universe-{args.seed}{args.rev}'

    if not os.path.exists(args.input):
        sys.exit(f'Input not found: {args.input} (run from repo root)')

    with open(args.input) as f:
        clusters = json.load(f)

    os.makedirs(args.outdir, exist_ok=True)

    id_map   = {}
    total_gals = 0

    for i, cluster in enumerate(clusters):
        name  = cluster['name']
        safe  = safe_id(name)
        data  = generate_cluster(cluster, universe_ver, args.seed)
        total_gals += len(data['galaxies'])
        id_map[name] = safe

        out_path = os.path.join(args.outdir, f'{safe}.json')
        with open(out_path, 'w') as f:
            json.dump(data, f, separators=(',', ':'))

        if (i + 1) % 50 == 0 or i + 1 == len(clusters):
            print(f'  {i + 1}/{len(clusters)} clusters written…')

    # Write index
    index = {
        'universe_ver':  universe_ver,
        'seed':          args.seed,
        'generated_utc': datetime.now(timezone.utc).isoformat(),
        'cluster_count': len(clusters),
        'total_galaxies': total_gals,
        'id_map':        id_map,
    }
    index_path = os.path.join(args.outdir, 'index.json')
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=2)

    print(f'\n✓ {universe_ver}')
    print(f'  {len(clusters)} clusters · {total_gals} galaxies')
    print(f'  index → {index_path}')


if __name__ == '__main__':
    main()
