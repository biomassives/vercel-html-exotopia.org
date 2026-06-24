#!/usr/bin/env python3
"""
generate_cluster_subobjects.py

Generates synthetic galaxy-member catalogs for X-ray clusters that don't yet
have a hand-curated member file in public/clusters/.

The generator uses physically motivated models:
  - King profile for projected radial distribution
  - Morphology-density relation (Dressler 1980): E/S0 dominated in dense cores
  - Schechter luminosity function (α ≈ −1.1, M* ≈ −22.2) for B-band magnitudes
  - Hot-cluster bias: tapKev > 2.5 keV → more early-type galaxies
  - Redshift dimming for clusters beyond 300 Mpc
  - Sub-cluster structure for richness ≥ 8

Output format matches public/clusters/virgo-members.json exactly, so the
CosmicPage LOD renderer can load them without any code changes.

Usage:
    python generate_cluster_subobjects.py --inventory     # list missing clusters
    python generate_cluster_subobjects.py --all           # generate all missing
    python generate_cluster_subobjects.py --cluster NAME  # one cluster by name
    python generate_cluster_subobjects.py --count 150     # set member count (default: auto)
    python generate_cluster_subobjects.py --dry-run       # show what would be written

Requirements: none (stdlib only)
"""

import argparse
import json
import math
import os
import random
import sys
from pathlib import Path
from typing import Optional

# ── Paths ──────────────────────────────────────────────────────────────────────

ROOT       = Path(__file__).parent.parent
XRAY_PATH  = ROOT / 'public' / 'clusters-xray.json'
OUTPUT_DIR = ROOT / 'public' / 'clusters'

MPC_SCALE = 1 / 15   # matches cosmic-structures.ts: 1 Mpc → 0.0667 scene units

# ── Constants ──────────────────────────────────────────────────────────────────

HUBBLE_TYPES = ['cD', 'E', 'S0', 'Sa', 'Sb', 'Irr']

# (tapKev threshold, base membership count, virial radius in Mpc)
# Roughly: kT ∝ M^(2/3), virial radius ∝ M^(1/3)
CLUSTER_TIERS = [
    (8.0, 250, 1.20),   # very hot / Coma-class
    (5.0, 180, 1.00),   # hot / Perseus-class
    (3.0, 120, 0.80),   # moderate / Virgo-class
    (1.5,  80, 0.60),   # cool / group-like
    (0.0,  50, 0.45),   # low-T / compact group
]


def get_tier(tap_kev: float) -> tuple[int, float]:
    """Return (member_count, virial_radius_mpc) for a given tapKev."""
    for thresh, count, rvir in CLUSTER_TIERS:
        if tap_kev >= thresh:
            return count, rvir
    return 50, 0.45


def richness_from_tapkev(tap_kev: float) -> int:
    """Map X-ray temperature to 0-10 richness scale (matches tapKevToRichness in TS)."""
    return min(10, max(1, round(tap_kev * 1.35)))


# ── Seeded RNG (Mulberry32 in Python) ─────────────────────────────────────────

class Mulberry32:
    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def __call__(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((self.state ^ (self.state >> 15)) * (1 | self.state)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t))) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return t / 4_294_967_296


# ── Morphology-density relation (Dressler 1980) ────────────────────────────────

def pick_morphology(rng: Mulberry32, r_frac: float, is_bcg: bool, hot_boost: float) -> str:
    """
    r_frac:    0 (BCG at centre) → 1 (cluster virial radius)
    hot_boost: 0-1, how much to shift morphology toward E/cD (higher T clusters)
    """
    if is_bcg:
        return 'cD'
    x = rng()
    # Shift effective radius toward core for hot clusters — biases toward early-type
    eff_frac = max(0.0, r_frac - hot_boost * 0.22)

    if eff_frac < 0.30:
        return 'E'  if x < 0.65 else 'S0' if x < 0.90 else 'Sa'
    if eff_frac < 0.65:
        return 'E'  if x < 0.48 else 'S0' if x < 0.78 else 'Sa' if x < 0.92 else 'Irr'
    return 'E' if x < 0.30 else 'S0' if x < 0.55 else 'Sa' if x < 0.80 else 'Sb' if x < 0.92 else 'Irr'


# ── Schechter luminosity function ──────────────────────────────────────────────

M_STAR  = -22.2   # characteristic B-band magnitude
M_FAINT = -14.5   # faint-end cutoff
ALPHA   = -1.1    # faint-end slope


def schechter_bt_mag(rng: Mulberry32, is_bcg: bool, morph: str, dist_mpc: float) -> float:
    """
    Generate B-band apparent magnitude using Schechter LF + distance modulus.
    Returns apparent B-band mag (bt_mag in the catalog).
    """
    if is_bcg:
        abs_mag = M_STAR - 0.8 - rng() * 0.4   # BCG: ~1 mag brighter than M*
    else:
        # Rejection sampling for Schechter LF: n(L) ∝ (L/L*)^α exp(−L/L*)
        for _ in range(40):
            u1 = max(1e-6, rng())
            u2 = rng()
            abs_mag = M_STAR - 2.5 * math.log10(-math.log(u1) * (u2 ** 0.45))
            if abs_mag > M_FAINT:
                break
        else:
            abs_mag = M_FAINT + rng() * 2

    # Morphology brightness offset: E/cD slightly brighter, Irr slightly fainter
    morph_offset = {'cD': -0.4, 'E': -0.2, 'S0': 0.0, 'Sa': 0.2, 'Sb': 0.3, 'Irr': 0.6}
    abs_mag += morph_offset.get(morph, 0.0)

    # Distance modulus: m = M + 5 log10(d / 10 pc)
    if dist_mpc > 0:
        dist_pc    = dist_mpc * 1e6
        dist_mod   = 5 * math.log10(dist_pc / 10)
        apparent   = abs_mag + dist_mod
    else:
        apparent = abs_mag + 30

    # Scatter ±0.3 mag
    apparent += (rng() - 0.5) * 0.6
    return round(apparent, 1)


# ── King profile projected radius ──────────────────────────────────────────────

def king_profile_r(rng: Mulberry32, r_core_frac: float = 0.12) -> float:
    """
    Sample a projected radial fraction (0-1) from a King-like profile.
    r_core_frac: core radius as fraction of virial radius (typical: 0.10-0.15).
    Returns r_frac ∈ [0, 1].
    """
    # CDF inversion for King-profile approximation:
    # p(r) ∝ r / (1 + (r/rc)^2)  — cusped toward centre
    u = rng()
    # Solve numerically: sample r from Beta-like distribution, then cusp-transform
    r_frac = math.sqrt(u) * (0.20 + rng() * 0.80)
    return min(1.0, r_frac)


# ── Galaxy member scene offset ─────────────────────────────────────────────────

def make_offset(rng: Mulberry32, r_frac: float, rvir_mpc: float, dist_mpc: float) -> list[float]:
    """
    Compute [x, y, z] scene-unit offset from cluster centre.
    Offsets are in Mpc / MPC_SCALE (scene units) divided by VSPREAD=7.0 in the renderer.
    So we output in Mpc and let the renderer handle the conversion.
    """
    r_mpc  = r_frac * rvir_mpc
    theta  = rng() * math.tau
    phi    = math.acos(2 * rng() - 1) * (1 - r_frac * 0.4)   # flatten toward disk plane

    x = r_mpc * math.sin(phi) * math.cos(theta)
    y = r_mpc * math.sin(phi) * math.sin(theta) * 0.60   # flatten y (line-of-sight)
    z = r_mpc * math.cos(phi)

    # Convert to scene units, then divide by VSPREAD (renderer multiplies by 7)
    SU = MPC_SCALE / 7.0
    return [round(x * SU, 6), round(y * SU, 6), round(z * SU, 6)]


# ── LOD3 params ────────────────────────────────────────────────────────────────

def make_lod3_params(rng: Mulberry32, morph: str, rvir_mpc: float) -> dict:
    """Generate lod3_params matching the renderer's CatalogMember interface."""
    scene_su = rvir_mpc * MPC_SCALE * (0.02 + rng() * 0.025)   # galaxy size ~ cluster scale
    scene_su = round(max(0.006, min(0.04, scene_su)), 5)

    if morph in ('E', 'cD', 'S0'):
        axis_ratio = round(0.40 + rng() * 0.55, 3)
        pitch_deg  = 0
        n_arms     = 0
    else:   # Sa, Sb, Irr
        axis_ratio = round(0.30 + rng() * 0.65, 3)
        pitch_deg  = 8 if morph in ('Sa', 'Sb') else 0
        n_arms     = 2 if morph in ('Sa', 'Sb') else 0

    pa_deg = round(rng() * 180, 1)
    return {
        'scene_su':   scene_su,
        'axis_ratio': axis_ratio,
        'pitch_deg':  pitch_deg,
        'n_arms':     n_arms,
        'pa_deg':     pa_deg,
    }


# ── Slug generation (matches clusterSlug() in CosmicPage.vue) ─────────────────

def cluster_slug(name: str) -> str:
    import re
    s = name.lower()
    s = re.sub(r'\s+cluster', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\s+concentration', '', s, flags=re.IGNORECASE)
    s = s.strip()
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'[^a-z0-9-]', '', s)
    return s


# ── Main generator ─────────────────────────────────────────────────────────────

def generate_members(cluster: dict, count_override: Optional[int] = None) -> dict:
    """
    Generate a synthetic galaxy-member catalog for an X-ray cluster.
    Returns a dict matching the virgo-members.json schema.
    """
    name     = cluster['name']
    ra_deg   = cluster['ra_deg']
    dec_deg  = cluster['dec_deg']
    dist_mpc = cluster['dist_mpc']
    tap_kev  = cluster['tap_kev']
    richness = richness_from_tapkev(tap_kev)
    slug     = cluster_slug(name)

    base_count, rvir_mpc = get_tier(tap_kev)
    count    = count_override or base_count

    # Hot-cluster bias [0, 1]: at tapKev ≥ 7.5 keV ≈ 1.0
    hot_boost = min(1.0, max(0.0, (tap_kev - 2.5) / 5.0))

    # Redshift dimming: dim members of very distant clusters
    z_dim = max(0.38, 1.0 - (dist_mpc - 300) / 2200) if dist_mpc > 300 else 1.0

    # Seeded RNG — deterministic per cluster name
    seed = sum(ord(c) * i for i, c in enumerate(name, 1)) & 0xFFFFFFFF
    rng  = Mulberry32(seed)

    # Sub-cluster structure for rich clusters
    has_sub = richness >= 8
    sub_angle = rng() * math.tau
    sub_frac  = 0.30   # secondary core at 30% of virial radius
    sub_x = sub_frac * math.cos(sub_angle)
    sub_z = sub_frac * math.sin(sub_angle)

    members = []
    for i in range(count):
        is_bcg = (i == 0)
        in_sub = has_sub and not is_bcg and rng() < 0.28

        r_frac = 0.02 if is_bcg else king_profile_r(rng)
        morph  = pick_morphology(rng, r_frac, is_bcg, hot_boost)
        bt_mag = schechter_bt_mag(rng, is_bcg, morph, dist_mpc)
        offset = make_offset(rng, r_frac, rvir_mpc, dist_mpc)

        # Sub-cluster shift
        if in_sub:
            SU = MPC_SCALE / 7.0
            offset[0] += round(sub_x * rvir_mpc * SU, 6)
            offset[2] += round(sub_z * rvir_mpc * SU, 6)

        lod3 = make_lod3_params(rng, morph, rvir_mpc)

        member: dict = {
            'id':         f'proc-{i:04d}',
            'ra':         round(ra_deg + (rng() - 0.5) * rvir_mpc / 57.3, 5),
            'dec':        round(dec_deg + (rng() - 0.5) * rvir_mpc / 57.3, 5),
            'hubble':     morph,
            'bt_mag':     round(bt_mag * z_dim + (1 - z_dim) * (bt_mag + 2), 1),
            'offset':     offset,
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
        'notes':        f'Synthetic catalog — generated from XMM Takey2013 entry. tapKev={tap_kev}',
        'member_count': count,
        'members':      members,
    }


# ── Inventory ──────────────────────────────────────────────────────────────────

def load_xray_clusters() -> list[dict]:
    with open(XRAY_PATH) as f:
        return json.load(f)


def get_existing_slugs() -> set[str]:
    return {p.stem.replace('-members', '') for p in OUTPUT_DIR.glob('*-members.json')}


def inventory(clusters: list[dict]) -> None:
    existing = get_existing_slugs()
    missing  = [c for c in clusters if cluster_slug(c['name']) not in existing]
    print(f"\n{'─'*60}")
    print(f"  X-ray catalog:  {len(clusters)} clusters  ({XRAY_PATH.name})")
    print(f"  Existing files: {len(existing)} cluster member files")
    print(f"  Missing:        {len(missing)} clusters without member data")
    print(f"{'─'*60}")

    by_kev = sorted(missing, key=lambda c: c['tap_kev'], reverse=True)
    print("\nTop 20 missing by X-ray temperature (tapKev):")
    for c in by_kev[:20]:
        slug = cluster_slug(c['name'])
        base_count, _ = get_tier(c['tap_kev'])
        print(f"  {c['name']:<32}  {c['tap_kev']:>5.2f} keV  ~{base_count} members  → {slug}-members.json")

    print(f"\n{'─'*60}")
    print(f"  Run with --all to generate all {len(missing)} missing catalogs")
    print(f"  Run with --cluster NAME to generate one specific cluster")
    print()


# ── Write ──────────────────────────────────────────────────────────────────────

def write_catalog(catalog: dict, dry_run: bool = False) -> None:
    slug = catalog['slug']
    path = OUTPUT_DIR / f'{slug}-members.json'
    if dry_run:
        print(f"  [dry-run] Would write {path.name}  ({catalog['member_count']} members)")
        return
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        json.dump(catalog, f, separators=(',', ':'))
    print(f"  ✓ {path.name}  ({catalog['member_count']} members)")


# ── CLI ────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description='Generate synthetic galaxy-member catalogs for X-ray clusters')
    parser.add_argument('--inventory', action='store_true',
                        help='Show which clusters are missing member catalogs')
    parser.add_argument('--all',       action='store_true',
                        help='Generate catalogs for all missing clusters')
    parser.add_argument('--cluster',   metavar='NAME',
                        help='Generate catalog for a specific cluster by name')
    parser.add_argument('--count',     type=int, default=None, metavar='N',
                        help='Override member count (default: auto from tapKev)')
    parser.add_argument('--dry-run',   action='store_true',
                        help='Show what would be written without writing files')
    parser.add_argument('--overwrite', action='store_true',
                        help='Overwrite existing files (default: skip)')
    args = parser.parse_args()

    if not XRAY_PATH.exists():
        print(f"ERROR: {XRAY_PATH} not found", file=sys.stderr)
        sys.exit(1)

    clusters = load_xray_clusters()
    existing = get_existing_slugs()

    if args.inventory or (not args.all and not args.cluster):
        inventory(clusters)
        if not args.all and not args.cluster:
            return

    if args.cluster:
        # Find by name (case-insensitive partial match)
        query = args.cluster.lower()
        matches = [c for c in clusters if query in c['name'].lower()]
        if not matches:
            print(f"No cluster matching '{args.cluster}' found.", file=sys.stderr)
            sys.exit(1)
        if len(matches) > 1:
            print(f"Ambiguous: matched {len(matches)} clusters:")
            for m in matches[:10]:
                print(f"  {m['name']}")
            sys.exit(1)
        c = matches[0]
        slug = cluster_slug(c['name'])
        if slug in existing and not args.overwrite:
            print(f"  Skipping {c['name']} — {slug}-members.json already exists (use --overwrite)")
            return
        catalog = generate_members(c, args.count)
        write_catalog(catalog, dry_run=args.dry_run)
        return

    if args.all:
        targets = clusters if args.overwrite else [c for c in clusters if cluster_slug(c['name']) not in existing]
        print(f"\nGenerating {len(targets)} cluster catalogs…\n")
        for i, c in enumerate(targets, 1):
            catalog = generate_members(c, args.count)
            write_catalog(catalog, dry_run=args.dry_run)
            if i % 50 == 0:
                print(f"  … {i}/{len(targets)} done")
        print(f"\nDone. {len(targets)} catalogs {'would be ' if args.dry_run else ''}written.")


if __name__ == '__main__':
    main()
