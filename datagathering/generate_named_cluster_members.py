#!/usr/bin/env python3
"""
generate_named_cluster_members.py

Generates synthetic galaxy-member catalogs for named galaxy groups/clusters that
are defined in src/data/cosmic-structures.ts but lack public/clusters/*-members.json.

Uses weighted algorithms for galactic density and morphological types:
  - King profile for projected radial distribution
  - Morphology-density relation (Dressler 1980), adjusted for group richness
  - Schechter luminosity function (α ≈ −1.1, M* ≈ −22.2) for B-band magnitudes
  - Named (brightGalaxies) anchors placed at their cosmic-structures offsets ÷ VSPREAD
    → ensures spatial continuity as overview orbs fade and catalog sprites appear

Usage:
    python generate_named_cluster_members.py               # generate all defined clusters
    python generate_named_cluster_members.py andromeda     # one cluster (partial name match)
    python generate_named_cluster_members.py --list        # list defined clusters
    python generate_named_cluster_members.py --dry-run     # preview without writing

Requirements: none (stdlib only)
"""

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Optional

# ── Paths ──────────────────────────────────────────────────────────────────────

ROOT       = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / 'public' / 'clusters'
MPC_SCALE  = 1 / 15   # 1 Mpc → 0.0667 scene units (matches cosmic-structures.ts)
VSPREAD    = 7.0       # renderer multiplies catalog offsets by this

# ── Named cluster definitions (mirrors cosmic-structures.ts) ──────────────────
# Each brightGalaxy must have a morphology hint for the catalog.

NAMED_CLUSTERS = [
    {
        'name':     'Andromeda Group',
        'slug':     'andromeda-group',
        'ra_deg':   10.68,
        'dec_deg':  41.27,
        'dist_mpc': 0.77,
        'richness': 2,
        # Very low-density group → warm gas, few early-types, many spirals
        'hot_boost': 0.0,
        # Virial radius for a compact group (Local Group equivalent)
        'rvir_mpc': 0.50,
        # Member count: sparse local group
        'count':    55,
        # brightGalaxies from cosmic-structures.ts — offsets in scene units (pre-VSPREAD)
        # catalog offsets = scene_offset / VSPREAD  (so renderer × 7 lands them correctly)
        'named': [
            {
                'id':      'M31',
                'name':    'M31',
                'hubble':  'Sb',     # Giant barred spiral → Sb
                'bt_mag':  4.4,
                'scene_offset': [0.18,  0.09, -0.12],   # from cosmic-structures.ts
                'axis_ratio':   0.55,
                'pa_deg':       35.0,
                'notes': 'BCG-equivalent; largest galaxy in Local Group; 1 trillion L☉',
            },
            {
                'id':      'M33',
                'name':    'M33 — Triangulum',
                'hubble':  'Sa',     # Spiral galaxy
                'bt_mag':  6.3,
                'scene_offset': [-0.15, 0.04,  0.11],
                'axis_ratio':   0.50,
                'pa_deg':       23.0,
                'notes': 'Third largest in Local Group; 3.6 billion L☉',
            },
            {
                'id':      'M32',
                'name':    'M32 — NGC 221',
                'hubble':  'E',      # Compact elliptical
                'bt_mag':  9.0,
                'scene_offset': [0.07, -0.08,  0.05],
                'axis_ratio':   0.80,
                'pa_deg':       170.0,
                'notes': 'Compact elliptical satellite of M31; 850 million L☉',
            },
        ],
    },
    {
        'name':     'Eridanus Supergroup',
        'slug':     'eridanus-supergroup',
        'ra_deg':   51.0,
        'dec_deg':  -23.0,
        'dist_mpc': 23.0,
        'richness': 4,
        # Moderate-density supergroup → mix of early and late types
        'hot_boost': 0.22,
        # Virial radius for a moderate supergroup
        'rvir_mpc': 0.80,
        # Member count: richer than Andromeda
        'count':    110,
        'named': [
            {
                'id':      'NGC1407',
                'name':    'NGC 1407',
                'hubble':  'cD',     # Dominant elliptical (BCG)
                'bt_mag':  11.9,
                'scene_offset': [0.12,  0.05, -0.10],
                'axis_ratio':   0.87,
                'pa_deg':       60.0,
                'notes': 'BGC (dominant elliptical); 800 billion L☉; group core',
            },
            {
                'id':      'NGC1395',
                'name':    'NGC 1395',
                'hubble':  'E',
                'bt_mag':  12.5,
                'scene_offset': [-0.18, -0.08,  0.14],
                'axis_ratio':   0.75,
                'pa_deg':       140.0,
                'notes': 'Giant elliptical; 300 billion L☉',
            },
        ],
    },
]


# ── Seeded RNG (Mulberry32) ───────────────────────────────────────────────────

class Mulberry32:
    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def __call__(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((self.state ^ (self.state >> 15)) * (1 | self.state)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t))) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return t / 4_294_967_296


# ── Morphology-density relation ───────────────────────────────────────────────

def pick_morphology(rng: Mulberry32, r_frac: float, hot_boost: float) -> str:
    """
    r_frac:    0 (centre) → 1 (virial edge)
    hot_boost: 0 (spiral-rich poor group) → 1 (elliptical-dominated massive cluster)

    The morphology-density relation is scaled by hot_boost so that galaxy groups
    (hot_boost ≈ 0) produce a spiral-rich mix while massive clusters (hot_boost ≈ 1)
    are elliptical-dominated. Intermediate values interpolate linearly.
    """
    x = rng()
    # Shift r_frac toward core for cluster environment
    eff_frac = max(0.0, r_frac - hot_boost * 0.22)

    # Group regime (hot_boost < 0.15): spiral-dominated field-like IMF
    # Probabilities blend smoothly from group to cluster via hot_boost weight
    hb = min(1.0, max(0.0, hot_boost))

    if eff_frac < 0.30:
        # Inner region: cluster=very E-rich, group=moderate E+spiral mix
        e_thresh  = 0.65 * hb + 0.28 * (1 - hb)
        s0_thresh = 0.90 * hb + 0.55 * (1 - hb)
        sa_thresh = 1.00 * hb + 0.80 * (1 - hb)
        return 'E' if x < e_thresh else 'S0' if x < s0_thresh else 'Sa' if x < sa_thresh else 'Sb'
    if eff_frac < 0.65:
        # Mid region
        e_thresh  = 0.48 * hb + 0.18 * (1 - hb)
        s0_thresh = 0.78 * hb + 0.38 * (1 - hb)
        sa_thresh = 0.92 * hb + 0.68 * (1 - hb)
        sb_thresh = 1.00 * hb + 0.90 * (1 - hb)
        return 'E' if x < e_thresh else 'S0' if x < s0_thresh else 'Sa' if x < sa_thresh else 'Sb' if x < sb_thresh else 'Irr'
    # Outer region: cluster=mixed, group=spiral-dominated
    e_thresh  = 0.30 * hb + 0.08 * (1 - hb)
    s0_thresh = 0.55 * hb + 0.22 * (1 - hb)
    sa_thresh = 0.80 * hb + 0.52 * (1 - hb)
    sb_thresh = 0.92 * hb + 0.85 * (1 - hb)
    return 'E' if x < e_thresh else 'S0' if x < s0_thresh else 'Sa' if x < sa_thresh else 'Sb' if x < sb_thresh else 'Irr'


# ── Schechter luminosity function ─────────────────────────────────────────────

M_STAR  = -22.2
M_FAINT = -14.5


def schechter_bt_mag(rng: Mulberry32, morph: str, dist_mpc: float) -> float:
    for _ in range(40):
        u1 = max(1e-6, rng())
        u2 = rng()
        abs_mag = M_STAR - 2.5 * math.log10(-math.log(u1) * (u2 ** 0.45))
        if abs_mag > M_FAINT:
            break
    else:
        abs_mag = M_FAINT + rng() * 2

    morph_offset = {'cD': -0.4, 'E': -0.2, 'S0': 0.0, 'Sa': 0.2, 'Sb': 0.3, 'Irr': 0.6}
    abs_mag += morph_offset.get(morph, 0.0)

    dist_pc  = max(1, dist_mpc) * 1e6
    dist_mod = 5 * math.log10(dist_pc / 10)
    apparent = abs_mag + dist_mod + (rng() - 0.5) * 0.6
    return round(apparent, 1)


# ── King profile radius ───────────────────────────────────────────────────────

def king_profile_r(rng: Mulberry32) -> float:
    u = rng()
    r_frac = math.sqrt(u) * (0.20 + rng() * 0.80)
    return min(1.0, r_frac)


# ── Catalog offset from physical radius ───────────────────────────────────────

def make_physical_offset(rng: Mulberry32, r_frac: float, rvir_mpc: float) -> list:
    """
    Returns catalog offset [x,y,z] such that renderer × VSPREAD = scene position.
    More spiral-plane flattening for poor groups (z compressed).
    """
    r_mpc = r_frac * rvir_mpc
    theta  = rng() * math.tau
    phi    = math.acos(2 * rng() - 1) * (1 - r_frac * 0.4)

    x = r_mpc * math.sin(phi) * math.cos(theta)
    y = r_mpc * math.sin(phi) * math.sin(theta) * 0.55
    z = r_mpc * math.cos(phi)

    SU = MPC_SCALE / VSPREAD
    return [round(x * SU, 6), round(y * SU, 6), round(z * SU, 6)]


# ── lod3_params ───────────────────────────────────────────────────────────────

def make_lod3_params(rng: Mulberry32, morph: str, rvir_mpc: float,
                     axis_ratio: Optional[float] = None,
                     pa_deg: Optional[float] = None) -> dict:
    scene_su = rvir_mpc * MPC_SCALE * (0.02 + rng() * 0.025)
    scene_su = round(max(0.006, min(0.04, scene_su)), 5)

    if morph in ('E', 'cD', 'S0'):
        ar     = axis_ratio if axis_ratio is not None else round(0.40 + rng() * 0.55, 3)
        pitch  = 0
        n_arms = 0
    else:
        ar     = axis_ratio if axis_ratio is not None else round(0.30 + rng() * 0.65, 3)
        pitch  = 8 if morph in ('Sa', 'Sb') else 0
        n_arms = 2 if morph in ('Sa', 'Sb') else 0

    pa = pa_deg if pa_deg is not None else round(rng() * 180, 1)
    return {'scene_su': scene_su, 'axis_ratio': ar, 'pitch_deg': pitch,
            'n_arms': n_arms, 'pa_deg': pa}


# ── Main catalog generator ────────────────────────────────────────────────────

def generate_named_cluster(cluster: dict) -> dict:
    name     = cluster['name']
    slug     = cluster['slug']
    ra_deg   = cluster['ra_deg']
    dec_deg  = cluster['dec_deg']
    dist_mpc = cluster['dist_mpc']
    richness = cluster['richness']
    hot_boost = cluster['hot_boost']
    rvir_mpc  = cluster['rvir_mpc']
    total     = cluster['count']

    seed = sum(ord(c) * i for i, c in enumerate(name, 1)) & 0xFFFFFFFF
    rng  = Mulberry32(seed)

    members = []

    # ── Named (brightGalaxy) anchor members ───────────────────────────────────
    for ng in cluster['named']:
        so   = ng['scene_offset']
        # Divide by VSPREAD: renderer will multiply back to restore scene position
        offset = [round(so[0] / VSPREAD, 6), round(so[1] / VSPREAD, 6), round(so[2] / VSPREAD, 6)]
        lod3   = make_lod3_params(rng, ng['hubble'], rvir_mpc,
                                  axis_ratio=ng.get('axis_ratio'),
                                  pa_deg=ng.get('pa_deg'))
        # Named members get larger scene_su
        lod3['scene_su'] = 0.02 if ng['hubble'] == 'cD' else 0.014

        entry: dict = {
            'id':        ng['id'],
            'name':      ng['name'],
            'ra':        round(ra_deg + (rng() - 0.5) * 0.3, 5),
            'dec':       round(dec_deg + (rng() - 0.5) * 0.3, 5),
            'hubble':    ng['hubble'],
            'bt_mag':    ng['bt_mag'],
            'offset':    offset,
            'lod3_params': lod3,
            'is_named':  True,
        }
        if ng.get('notes'):
            entry['notes'] = ng['notes']
        members.append(entry)

    # ── Procedural faint members ──────────────────────────────────────────────
    proc_count = total - len(cluster['named'])
    for i in range(proc_count):
        r_frac = 0.08 + king_profile_r(rng) * 0.92   # avoid exact centre (named galaxies there)
        morph  = pick_morphology(rng, r_frac, hot_boost)
        bt_mag = schechter_bt_mag(rng, morph, dist_mpc)
        offset = make_physical_offset(rng, r_frac, rvir_mpc)
        lod3   = make_lod3_params(rng, morph, rvir_mpc)

        member: dict = {
            'id':    f'proc-{i:04d}',
            'ra':    round(ra_deg + (rng() - 0.5) * rvir_mpc / 57.3, 5),
            'dec':   round(dec_deg + (rng() - 0.5) * rvir_mpc / 57.3, 5),
            'hubble':    morph,
            'bt_mag':    bt_mag,
            'offset':    offset,
            'lod3_params': lod3,
        }
        members.append(member)

    return {
        'cluster':      name,
        'slug':         slug,
        'center_ra':    ra_deg,
        'center_dec':   dec_deg,
        'dist_mpc':     dist_mpc,
        'rvir_mpc':     round(rvir_mpc, 2),
        'richness':     richness,
        'notes':        (f'Synthetic catalog — named anchors from cosmic-structures.ts; '
                         f'procedural members via King profile + morphology-density relation. '
                         f'richness={richness}, rvir={rvir_mpc} Mpc'),
        'member_count': len(members),
        'members':      members,
    }


# ── CLI ───────────────────────────────────────────────────────────────────────

def write_catalog(catalog: dict, dry_run: bool = False) -> None:
    slug = catalog['slug']
    path = OUTPUT_DIR / f'{slug}-members.json'
    if dry_run:
        print(f'  [dry-run] {path.name}  ({catalog["member_count"]} members, '
              f'{sum(1 for m in catalog["members"] if m.get("is_named"))} named)')
        return
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        json.dump(catalog, f, separators=(',', ':'))
    print(f'  ✓ {path.name}  ({catalog["member_count"]} members, '
          f'{sum(1 for m in catalog["members"] if m.get("is_named"))} named)')


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Generate named-cluster member catalogs for exotopia.org')
    parser.add_argument('cluster', nargs='?', metavar='NAME',
                        help='Partial cluster name (omit to generate all)')
    parser.add_argument('--list',    action='store_true', help='List defined clusters')
    parser.add_argument('--dry-run', action='store_true', help='Preview without writing')
    parser.add_argument('--overwrite', action='store_true',
                        help='Overwrite existing files (default: skip if exists)')
    args = parser.parse_args()

    if args.list:
        print('\nDefined named clusters:')
        for c in NAMED_CLUSTERS:
            path = OUTPUT_DIR / f'{c["slug"]}-members.json'
            status = '✓ exists' if path.exists() else '  missing'
            print(f'  {status}  {c["name"]}  ({c["count"]} members, '
                  f'{len(c["named"])} named anchors)')
        return

    targets = NAMED_CLUSTERS
    if args.cluster:
        q = args.cluster.lower()
        targets = [c for c in NAMED_CLUSTERS if q in c['name'].lower()]
        if not targets:
            print(f"No cluster matching '{args.cluster}'. Use --list to see options.",
                  file=sys.stderr)
            sys.exit(1)

    print(f'\nGenerating {len(targets)} named cluster catalog(s)…\n')
    for c in targets:
        slug = c['slug']
        path = OUTPUT_DIR / f'{slug}-members.json'
        if path.exists() and not args.overwrite:
            content = json.loads(path.read_text())
            if content.get('members'):  # non-empty
                print(f'  Skipping {c["name"]} — file exists (use --overwrite)')
                continue
        catalog = generate_named_cluster(c)
        write_catalog(catalog, dry_run=args.dry_run)

    print()


if __name__ == '__main__':
    main()
