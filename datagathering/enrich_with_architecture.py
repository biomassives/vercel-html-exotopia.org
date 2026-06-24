#!/usr/bin/env python3
"""
enrich_with_architecture.py

Enriches every public/clusters/*-members.json with a `system_architecture`
block per member galaxy, derived from multi-wavelength observational anchors:

  Chandra  — ICM X-ray temperature (tx_kev) drives core stripping / ram pressure
  JWST     — Infrared dust / star-forming infall zones → rich proto-planetary disks
  Hubble   — Stellar population morphology (E/S0 = old pop; Sa/Sb/Irr = young)
  HST ATLAS— Outskirts metal enrichment and quiet-environment old rocky worlds

Calibration model:
  • cluster_zone   derived from member radial fraction (offset_mpc / rvir_mpc)
  • metallicity    decreases with dist_mpc (lookback time proxy) + zone gradient
  • planet_bias    categorical: rocky_short_period | ancient_cold_rocky |
                               jovian_wide | mixed | chaotic_infall
  • icm_stress     0–1 factor from tx_kev × zone weight
  • estimated_planets  Poisson-like count capped by icm_stress + architecture bias
  • requires_surface_render  True for rocky / mixed systems above metallicity floor

Also writes datagathering/generation_inventory.json — a queue of surface-
render-worthy systems with their full observatory context.

Usage:
    python enrich_with_architecture.py                   # enrich all clusters
    python enrich_with_architecture.py hydra             # one cluster
    python enrich_with_architecture.py --list            # preview without changes
    python enrich_with_architecture.py --dry-run         # stats only, no writes
    python enrich_with_architecture.py --overwrite       # re-enrich already-done files
    python enrich_with_architecture.py --no-inventory    # skip generation_inventory.json

Requirements: stdlib only (Python ≥ 3.9)
"""

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ── Paths ──────────────────────────────────────────────────────────────────────

ROOT           = Path(__file__).parent.parent
CLUSTER_DIR    = ROOT / 'public' / 'clusters'
INVENTORY_PATH = Path(__file__).parent / 'generation_inventory.json'

# ── Physical constants ─────────────────────────────────────────────────────────

MPC_SCALE = 1 / 15    # 1 Mpc → 0.0667 scene units  (matches cosmic-structures.ts)
VSPREAD   = 7.0       # renderer multiplies catalog offsets by this

ARCH_VERSION = '1.0'  # bump when calibration model changes

# ── Seeded RNG (Mulberry32 — matches JS implementation) ───────────────────────

class Mulberry32:
    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def __call__(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((self.state ^ (self.state >> 15)) * (1 | self.state)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t))) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return t / 4_294_967_296

    def uniform(self, lo: float, hi: float) -> float:
        return lo + self() * (hi - lo)

    def randint(self, lo: int, hi: int) -> int:
        return lo + int(self() * (hi - lo + 1))


def member_seed(cluster_slug: str, member_id: str) -> int:
    raw = cluster_slug + ':' + member_id
    h = 0
    for c in raw:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return h


# ── Zone classification ────────────────────────────────────────────────────────

def compute_zone(offset_catalog: list, rvir_mpc: float, hubble: str,
                 is_named: bool) -> str:
    """
    Translate catalog offset → physical Mpc → radial fraction of virial radius.

    catalog_offset × VSPREAD = scene_offset [scene_units]
    scene_offset / MPC_SCALE  = physical_offset [Mpc]
    → scale = VSPREAD / MPC_SCALE = 7.0 * 15 = 105
    """
    if hubble == 'cD':
        return 'core'                 # BCG always at cluster core

    if rvir_mpc <= 0:
        return 'core'

    scale    = VSPREAD / MPC_SCALE    # 105  Mpc per catalog unit
    ox, oy, oz = offset_catalog
    dist_mpc = math.sqrt(ox**2 + oy**2 + oz**2) * scale
    frac     = dist_mpc / rvir_mpc

    if frac < 0.25:  return 'core'
    if frac < 0.55:  return 'inner'
    if frac < 1.00:  return 'outskirts'
    return 'infall'


# ── ICM stress factor ──────────────────────────────────────────────────────────
# Derived from X-ray temperature (Chandra proxy).
# tx_kev  0 keV  → stress 0.0  (poor group, no stripping)
# tx_kev 14 keV  → stress 1.0  (Bullet Cluster extreme)

ZONE_STRESS_WEIGHT = {'core': 1.00, 'inner': 0.70, 'outskirts': 0.30, 'infall': 0.10}

def icm_stress(tx_kev: float, zone: str) -> float:
    base = min(1.0, tx_kev / 14.0)
    return round(base * ZONE_STRESS_WEIGHT.get(zone, 0.5), 3)


# ── Metallicity model ──────────────────────────────────────────────────────────
# Lookback-time proxy: nearby clusters are metal-enriched; distant ones less so.
# Zone gradient: core accumulates metals via AGN + ICM sloshing.
# Old populations (E/S0/cD) skew higher due to evolutionary maturity.

ZONE_METALLICITY_BOOST = {'core': +0.06, 'inner': +0.02, 'outskirts': -0.01, 'infall': -0.04}
OLD_POP_HUBBLE = {'E', 'S0', 'cD'}

def metallicity_fe_h(dist_mpc: float, zone: str, hubble: str) -> float:
    # Base gradient from distance (lookback time)
    # Virgo  ~16 Mpc  → +0.17
    # Hydra  ~59 Mpc  → +0.08
    # Coma   ~100 Mpc → +0.00
    # Shapley ~200 Mpc → -0.10
    if dist_mpc <= 100:
        base = 0.20 - 0.002 * dist_mpc
    else:
        base = 0.00 - 0.001 * (dist_mpc - 100)

    fe_h = base + ZONE_METALLICITY_BOOST.get(zone, 0.0)
    if hubble in OLD_POP_HUBBLE:
        fe_h += 0.06                  # evolved stellar populations self-enrich

    return round(max(-0.55, min(0.45, fe_h)), 3)


# ── Anchor telescope selection ─────────────────────────────────────────────────

def anchor_telescope(zone: str, hubble: str, tx_kev: float) -> str:
    if zone == 'core' and tx_kev >= 4.0:
        return 'Chandra'              # X-ray bright ICM dominates physics
    if hubble in ('Sa', 'Sb', 'Irr') and zone in ('infall', 'outskirts'):
        return 'JWST'                 # Infrared dust → star-forming infall disk
    if hubble in OLD_POP_HUBBLE and zone in ('outskirts', 'infall'):
        return 'HST/ATLAS'            # Stellar population profiles in quiet outskirts
    if tx_kev > 0 and zone in ('core', 'inner'):
        return 'Chandra/Hubble'
    return 'Hubble'


# ── Planetary architecture ─────────────────────────────────────────────────────

def planet_bias(zone: str, hubble: str, stress: float) -> str:
    if stress > 0.75:
        return 'chaotic_infall'       # Severe stripping, no stable wide orbits
    if zone == 'core':
        if hubble in OLD_POP_HUBBLE:
            return 'ancient_cold_rocky'
        return 'rocky_short_period'
    if zone == 'infall' and hubble in ('Sa', 'Sb', 'Irr'):
        return 'jovian_wide'
    if hubble in OLD_POP_HUBBLE:
        return 'ancient_cold_rocky'
    return 'mixed'


def max_orbit_au(zone: str, stress: float, rng: Mulberry32) -> float:
    if zone == 'core' or stress > 0.70:
        val = rng.uniform(1.8, 8.0)
    elif zone == 'inner':
        val = rng.uniform(8.0, 32.0)
    elif zone == 'outskirts':
        val = rng.uniform(20.0, 65.0)
    else:                             # infall
        val = rng.uniform(35.0, 130.0)
    # ICM stress truncates outer orbits even in moderate zones
    val *= max(0.30, 1.0 - stress * 0.55)
    return round(val, 1)


def gas_giant_prob(zone: str, hubble: str, stress: float, fe_h: float) -> float:
    # Core + high stress → few gas giants (stripped)
    if zone == 'core' or stress > 0.65:
        base = 0.10
    elif zone == 'infall' and hubble in ('Sa', 'Sb', 'Irr'):
        base = 0.65                   # Rich proto-planetary disks
    elif hubble in OLD_POP_HUBBLE:
        base = 0.22                   # Old systems — mostly rocky survivors
    else:
        base = 0.40                   # Mixed environments

    # Low metallicity → more gas giants (less rocky material)
    base += max(0.0, -fe_h) * 0.18
    return round(min(0.85, max(0.05, base)), 3)


def exomoon_factor(zone: str, stress: float) -> float:
    if zone == 'core' or stress > 0.65:
        return 0.12                   # Gravitational perturbations strip moons
    if zone == 'inner':
        return 0.55
    if zone == 'outskirts':
        return 1.10
    return 1.60                       # Infall: undisturbed wide systems retain moons


def star_teff_k(zone: str, hubble: str, fe_h: float, rng: Mulberry32) -> int:
    """Representative host star effective temperature (K)."""
    if hubble in ('E', 'cD'):
        # Old stellar population: M and K dwarfs dominate
        lo = 3200 if zone == 'core' else 3500
        hi = 4500 if zone == 'core' else 5000
    elif hubble == 'S0':
        lo, hi = 3800, 5400
    elif hubble in ('Sa', 'Sb'):
        lo, hi = 4500, 6800
    else:                             # Irr — mixed young populations
        lo, hi = 5000, 15000
    # Metal-rich environments bias toward hotter, longer-lived stars surviving
    if fe_h > 0.15:
        hi = min(hi + 800, 25000)
    return int(rng.uniform(lo, hi))


def estimated_planet_count(zone: str, stress: float, ggp: float,
                            rng: Mulberry32) -> int:
    """Integer planet count shaped by environment."""
    if zone == 'core' or stress > 0.70:
        lo, hi = 1, 4
    elif zone == 'infall' and ggp > 0.55:
        lo, hi = 4, 11
    elif zone == 'outskirts':
        lo, hi = 2, 8
    else:
        lo, hi = 2, 7
    # High stress clips the upper end
    hi = max(lo, hi - int(stress * 4))
    return rng.randint(lo, hi)


def requires_surface_render(bias: str, fe_h: float, stress: float,
                             n_planets: int) -> bool:
    """
    Surface render pipeline is worth running when the system likely has
    solid-surface worlds with some chemical complexity.
    """
    if stress > 0.80:
        return False                  # ICM stripping leaves barren husks
    if fe_h < -0.20:
        return False                  # Too metal-poor for interesting geochemistry
    if n_planets < 1:
        return False
    if bias in ('rocky_short_period', 'ancient_cold_rocky', 'mixed'):
        return True
    if bias == 'jovian_wide':
        # Large Jovians often have moon systems worth rendering
        return fe_h > 0.0
    return False                      # chaotic_infall


# ── Master architecture builder ────────────────────────────────────────────────

def build_architecture(member: dict, cluster_meta: dict) -> dict:
    slug     = cluster_meta.get('slug', '')
    dist_mpc = cluster_meta.get('dist_mpc', 50.0)
    rvir_mpc = cluster_meta.get('rvir_mpc', 1.0)
    tx_kev   = cluster_meta.get('tx_kev', 0.0) or 0.0
    hubble   = member.get('hubble', 'E')
    is_named = member.get('is_named', False)
    offset   = member.get('offset', [0.0, 0.0, 0.0])

    rng = Mulberry32(member_seed(slug, member['id']))

    zone   = compute_zone(offset, rvir_mpc, hubble, is_named)
    stress = icm_stress(tx_kev, zone)
    fe_h   = metallicity_fe_h(dist_mpc, zone, hubble)
    tscope = anchor_telescope(zone, hubble, tx_kev)
    bias   = planet_bias(zone, hubble, stress)
    ggp    = gas_giant_prob(zone, hubble, stress, fe_h)
    emf    = exomoon_factor(zone, stress)
    max_au = max_orbit_au(zone, stress, rng)
    teff   = star_teff_k(zone, hubble, fe_h, rng)
    n_pl   = estimated_planet_count(zone, stress, ggp, rng)
    render = requires_surface_render(bias, fe_h, stress, n_pl)

    return {
        'cluster_zone':          zone,
        'anchor_telescope':      tscope,
        'metallicity_fe_h':      fe_h,
        'icm_stress':            stress,
        'star_teff_k':           teff,
        'max_orbit_au':          max_au,
        'gas_giant_prob':        ggp,
        'exomoon_factor':        emf,
        'planet_bias':           bias,
        'estimated_planets':     n_pl,
        'requires_surface_render': render,
    }


# ── Per-cluster enrichment ─────────────────────────────────────────────────────

def enrich_cluster(path: Path, overwrite: bool = False) -> Optional[dict]:
    """
    Load, enrich, return enriched doc.  Returns None if already done and not overwriting.
    """
    with open(path) as f:
        doc = json.load(f)

    members = doc.get('members', [])
    if not members:
        return None

    # Check if already enriched
    already_done = 'system_architecture' in (members[0] if members else {})
    if already_done and not overwrite:
        return None

    cluster_meta = {
        'slug':     doc.get('slug', path.stem.replace('-members', '')),
        'dist_mpc': doc.get('dist_mpc', 50.0),
        'rvir_mpc': doc.get('rvir_mpc', 1.0),
        'tx_kev':   doc.get('tx_kev', 0.0) or 0.0,
    }

    enriched_members = []
    for m in members:
        arch = build_architecture(m, cluster_meta)
        enriched = dict(m)
        enriched['system_architecture'] = arch
        enriched_members.append(enriched)

    doc['members']              = enriched_members
    doc['architecture_version'] = ARCH_VERSION
    doc['enriched_at']          = datetime.now(timezone.utc).isoformat(timespec='seconds')
    return doc


# ── Inventory builder ──────────────────────────────────────────────────────────

def build_inventory(all_docs: list[tuple[str, dict]]) -> dict:
    """
    Generate generation_inventory.json from all enriched cluster docs.
    Includes every member where requires_surface_render == True.
    """
    entries: dict = {}
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')

    for slug, doc in all_docs:
        cluster_name = doc.get('cluster', slug)
        dist_mpc     = doc.get('dist_mpc', 0)
        tx_kev       = doc.get('tx_kev', 0.0) or 0.0

        for m in doc.get('members', []):
            arch = m.get('system_architecture', {})
            if not arch.get('requires_surface_render'):
                continue

            # Derive a stable inventory key: CLUSTER-MEMBERID format
            cluster_tag = slug.upper().replace('-', '_')[:16]
            member_tag  = m['id'].replace(' ', '_')[:14]
            key         = f'{cluster_tag}_{member_tag}'

            tscope = arch.get('anchor_telescope', 'Hubble')

            entries[key] = {
                'hostname':     key,
                'requestedAt':  now,
                'status':       'pending',
                'observatory_context': {
                    'anchor_telescope':         tscope,
                    'cluster_id':               f'{cluster_name} — {arch["cluster_zone"].title()}',
                    'cluster_dist_mpc':         dist_mpc,
                    'estimated_metallicity_fe_h': arch.get('metallicity_fe_h'),
                    'local_stellar_density':    (
                        'high'    if arch['cluster_zone'] == 'core'      else
                        'nominal' if arch['cluster_zone'] == 'inner'     else
                        'low'     if arch['cluster_zone'] == 'outskirts' else
                        'field'
                    ),
                    'icm_stress': arch.get('icm_stress'),
                    'tx_kev':     tx_kev,
                },
                'parameters': {
                    'host_galaxy':           m['id'],
                    'hubble_type':           m.get('hubble', '?'),
                    'star_teff_k':           arch.get('star_teff_k'),
                    'estimated_planets':     arch.get('estimated_planets'),
                    'gas_giant_prob':        arch.get('gas_giant_prob'),
                    'exomoon_factor':        arch.get('exomoon_factor'),
                    'max_orbit_au':          arch.get('max_orbit_au'),
                    'planet_bias':           arch.get('planet_bias'),
                    'requires_surface_render': True,
                },
            }

    return {
        'generated_at': now,
        'architecture_version': ARCH_VERSION,
        'total_systems': len(entries),
        'systems': entries,
    }


# ── Statistics display ─────────────────────────────────────────────────────────

ZONE_ORDER  = ['core', 'inner', 'outskirts', 'infall']
BIAS_LABELS = {
    'rocky_short_period': 'Rocky (tight)',
    'ancient_cold_rocky': 'Ancient rocky',
    'jovian_wide':        'Jovian wide',
    'mixed':              'Mixed',
    'chaotic_infall':     'Chaotic infall',
}

def print_stats(slug: str, doc: dict) -> None:
    members = doc.get('members', [])
    n       = len(members)
    if not n:
        return

    zone_counts  = {z: 0 for z in ZONE_ORDER}
    bias_counts: dict = {}
    render_n    = 0
    fe_h_vals   = []
    teff_vals   = []

    for m in members:
        arch = m.get('system_architecture', {})
        z    = arch.get('cluster_zone', 'inner')
        b    = arch.get('planet_bias', 'mixed')
        zone_counts[z] = zone_counts.get(z, 0) + 1
        bias_counts[b] = bias_counts.get(b, 0) + 1
        if arch.get('requires_surface_render'):
            render_n += 1
        if 'metallicity_fe_h' in arch:
            fe_h_vals.append(arch['metallicity_fe_h'])
        if 'star_teff_k' in arch:
            teff_vals.append(arch['star_teff_k'])

    avg_fe_h = sum(fe_h_vals) / len(fe_h_vals) if fe_h_vals else 0
    avg_teff = int(sum(teff_vals) / len(teff_vals)) if teff_vals else 0

    print(f'\n  {doc.get("cluster", slug):28s}  '
          f'dist={doc.get("dist_mpc","?"):5} Mpc  '
          f'tx={doc.get("tx_kev","?"):4} keV  '
          f'{n} members')
    zone_str = '  '.join(f'{z[:4]}:{zone_counts.get(z,0)}' for z in ZONE_ORDER)
    print(f'    Zones:  {zone_str}')
    bias_str = '  '.join(f'{BIAS_LABELS.get(b, b)[:10]}:{c}'
                         for b, c in sorted(bias_counts.items(), key=lambda x: -x[1]))
    print(f'    Bias:   {bias_str}')
    print(f'    Fe/H:  {avg_fe_h:+.3f} avg    '
          f'Teff: {avg_teff} K avg    '
          f'Surface-render queue: {render_n}')


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description='Enrich cluster member catalogs with system_architecture blocks',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__.split('Usage:')[1].split('Requirements:')[0].strip()
    )
    parser.add_argument('cluster', nargs='?', metavar='NAME',
                        help='Partial cluster name/slug (omit for all)')
    parser.add_argument('--list',         action='store_true',
                        help='Show cluster list and enrichment status')
    parser.add_argument('--dry-run',      action='store_true',
                        help='Compute and show stats; do not write files')
    parser.add_argument('--overwrite',    action='store_true',
                        help='Re-enrich files that already have system_architecture')
    parser.add_argument('--no-inventory', action='store_true',
                        help='Skip generation_inventory.json output')
    args = parser.parse_args()

    # Gather candidate files
    all_paths = sorted(CLUSTER_DIR.glob('*-members.json'))
    if not all_paths:
        print(f'No *-members.json files found in {CLUSTER_DIR}', file=sys.stderr)
        sys.exit(1)

    # Filter by name if requested
    if args.cluster:
        q = args.cluster.lower()
        all_paths = [p for p in all_paths if q in p.stem]
        if not all_paths:
            print(f"No cluster file matching '{args.cluster}'.", file=sys.stderr)
            sys.exit(1)

    # --list mode
    if args.list:
        print('\nCluster member files:\n')
        for p in all_paths:
            with open(p) as f:
                doc = json.load(f)
            members  = doc.get('members', [])
            enriched = 'system_architecture' in (members[0] if members else {})
            ver      = doc.get('architecture_version', '—')
            status   = f'✓ v{ver}' if enriched else '  not enriched'
            print(f'  {status}  {p.name:42s} ({len(members)} members)')
        print()
        return

    # ── Enrich loop ────────────────────────────────────────────────────────────
    enriched_docs: list[tuple[str, dict]] = []
    skipped = 0
    written = 0

    print(f'\nEnriching {len(all_paths)} cluster file(s)…\n')

    for p in all_paths:
        slug = p.stem.replace('-members', '')
        doc  = enrich_cluster(p, overwrite=args.overwrite)

        if doc is None:
            with open(p) as f:
                existing = json.load(f)
            print(f'  — {p.name:42s} (already enriched; use --overwrite)')
            enriched_docs.append((slug, existing))
            skipped += 1
            continue

        print_stats(slug, doc)
        enriched_docs.append((slug, doc))

        if not args.dry_run:
            with open(p, 'w') as f:
                json.dump(doc, f, separators=(',', ':'))
            written += 1

    # ── Inventory output ───────────────────────────────────────────────────────
    if not args.no_inventory:
        inventory = build_inventory(enriched_docs)
        total     = inventory['total_systems']

        if args.dry_run:
            print(f'\n  [dry-run] generation_inventory.json  → {total} surface-render systems')
        else:
            with open(INVENTORY_PATH, 'w') as f:
                json.dump(inventory, f, indent=2)
            print(f'\n  ✓ generation_inventory.json  ({total} surface-render systems)')

    # ── Summary ────────────────────────────────────────────────────────────────
    print()
    if args.dry_run:
        print(f'Dry-run complete. {len(all_paths)} cluster(s) analysed, 0 written.')
    else:
        print(f'Done. {written} file(s) enriched, {skipped} skipped.')
    print()


if __name__ == '__main__':
    main()
