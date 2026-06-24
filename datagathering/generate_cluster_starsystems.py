#!/usr/bin/env python3
"""
generate_cluster_starsystems.py

Procedural star-system + planet generator for enriched cluster member galaxies.
Reads public/clusters/*-members.json (system_architecture blocks required),
generates full star_systems arrays per galaxy, writes per-galaxy JSON to
public/star-systems/{cluster_slug}/{galaxy_id}.json, and updates the index.

Skips hand-designed v0 files unless --overwrite-v0 is given.

Algorithm chain:
  generate_cluster_populations.py  → member positions + Hubble types
  enrich_with_architecture.py      → system_architecture block per member
  generate_cluster_starsystems.py  → full star_systems + planets  (this script)

Physical model summary (see SPEC_STARSYSTEM_ALGORITHM.md for full derivation):
  Star type    : spectral table lookup on ICM-corrected Teff
  Luminosity   : mass-luminosity relation (Salaris 2005 approximation)
  Orbitals     : modified Titius-Bode spacing capped at max_orbit_au
  Planet types : equilibrium temperature + planet_bias weighting
  Settlement   : candidate (n2_o2, 200-320 K) | frontier (HZ-adjacent) | theoretical

Provenance:
  Each output file includes a 'provenance' block with algorithm version,
  input parameters, and a human-readable observatory_report string for
  in-app display. See also SPEC_STARSYSTEM_ALGORITHM.md §Provenance.

Usage:
    python generate_cluster_starsystems.py                # all clusters
    python generate_cluster_starsystems.py --cluster virgo
    python generate_cluster_starsystems.py --galaxy NGC4486
    python generate_cluster_starsystems.py --dry-run
    python generate_cluster_starsystems.py --list
    python generate_cluster_starsystems.py --overwrite         # re-gen procedural
    python generate_cluster_starsystems.py --overwrite-v0      # also overwrite hand files
    python generate_cluster_starsystems.py --surface-only      # only requires_surface_render
    python generate_cluster_starsystems.py --named-only        # only is_named members

Requirements: stdlib only (Python ≥ 3.9)
"""

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT           = Path(__file__).parent.parent
CLUSTER_DIR    = ROOT / 'public' / 'clusters'
OUTPUT_DIR     = ROOT / 'public' / 'star-systems'
INVENTORY_PATH = Path(__file__).parent / 'generation_inventory.json'
INDEX_PATH     = OUTPUT_DIR / 'index.json'

ALGORITHM_VERSION = '1.0'

# Galaxy IDs with hand-designed v0 files — preserved by default
V0_GALAXIES = {
    'NGC0224', 'NGC0598', 'NGC0221',   # Andromeda Group
    'NGC4486', 'NGC4406', 'NGC4472',   # Virgo
    'NGC1275', 'NGC1272', 'NGC1265',   # Perseus
}

# ── Mulberry32 seeded RNG ─────────────────────────────────────────────────────

def mulberry32(seed: int):
    seed = seed & 0xFFFFFFFF
    def rng():
        nonlocal seed
        seed = (seed + 0x6D2B79F5) & 0xFFFFFFFF
        z = seed
        z = ((z ^ (z >> 15)) * ((z | 1) & 0xFFFFFFFF)) & 0xFFFFFFFF
        z = ((z ^ (z >> 7))  * ((z | 61) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((z ^ (z >> 14)) & 0xFFFFFFFF) / 0xFFFFFFFF
    return rng

def str_seed(s: str) -> int:
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return h

# ── Star classification ───────────────────────────────────────────────────────
# (max_teff, spectral_type, base_mass_sol)
SPECTRAL_TABLE = [
    (3200, 'M8V', 0.12),
    (3400, 'M6V', 0.18),
    (3600, 'M4V', 0.28),
    (3800, 'M2V', 0.40),
    (4100, 'M0V', 0.52),
    (4500, 'K7V', 0.64),
    (4900, 'K5V', 0.74),
    (5200, 'K2V', 0.83),
    (5400, 'G9V', 0.89),
    (5600, 'G7V', 0.93),
    (5800, 'G5V', 0.97),
    (6000, 'G2V', 1.03),
    (6400, 'F9V', 1.14),
    (6900, 'F5V', 1.32),
    (7500, 'F2V', 1.50),
    (9999, 'A7V', 1.80),
]

def spectral_from_teff(teff_k: int, fe_h: float) -> tuple[str, float, float]:
    spec, mass = 'A7V', 1.80
    for max_t, s, m in SPECTRAL_TABLE:
        if teff_k <= max_t:
            spec, mass = s, m
            break
    mass = max(0.08, mass * (1.0 + fe_h * 0.04))
    # Salaris 2005 mass-luminosity approximation
    if mass < 0.43:
        lum = 0.23 * mass ** 2.3
    elif mass < 2.0:
        lum = mass ** 4.0
    else:
        lum = 1.4 * mass ** 3.5
    return spec, round(mass, 3), round(max(0.001, lum), 5)

# ── Planet physics ────────────────────────────────────────────────────────────

def eq_temp_k(luminosity_sol: float, semi_major_au: float, albedo: float = 0.30) -> int:
    if semi_major_au <= 0:
        return 9999
    t = 278.5 * (luminosity_sol ** 0.25) * ((1 - albedo) ** 0.25) / (semi_major_au ** 0.5)
    return int(t)

def period_days(semi_major_au: float, mass_sol: float) -> float:
    t_yr = (semi_major_au ** 1.5) / math.sqrt(max(0.01, mass_sol))
    return round(t_yr * 365.25, 1)

# ── Planet type logic ─────────────────────────────────────────────────────────

def planet_type(temp_k: int, is_gas: bool, bias: str, rng) -> str:
    if is_gas:
        return 'hot_jupiter' if temp_k > 800 else 'gas_giant'

    if temp_k > 1800: return 'lava_world'
    if temp_k > 800:  return 'rocky_barren'
    if temp_k > 500:  return 'hot_rocky' if rng() > 0.35 else 'rocky_barren'

    # Habitable zone: 200-300 K
    if temp_k > 200:
        if bias == 'chaotic_infall':                              return 'rocky_barren'
        if bias in ('ancient_cold_rocky', 'rocky_short_period'):
            return 'super_earth' if rng() > 0.45 else 'rocky_barren'
        if bias == 'mixed':
            r = rng()
            return 'terran' if r < 0.30 else ('ocean_world' if r < 0.50 else 'super_earth')
        if bias == 'jovian_wide':
            return 'terran' if rng() > 0.45 else 'super_earth'
        return 'super_earth'

    if temp_k > 130:
        return 'mini_neptune' if rng() < 0.28 else ('cold_rocky' if rng() < 0.6 else 'ice_world')
    return 'ice_world' if rng() > 0.3 else 'frozen_world'

ATMO_BY_TYPE: dict[str, list[str]] = {
    'lava_world':   ['none', 'thin_metal_vapour'],
    'hot_rocky':    ['none', 'thin_co2'],
    'rocky_barren': ['none', 'none', 'thin_co2'],
    'hot_jupiter':  ['h2_he_na_k'],
    'super_earth':  ['thick_n2_co2', 'n2_co2', 'thick_co2'],
    'terran':       ['n2_o2', 'n2_o2', 'n2_co2', 'n2_h2o'],
    'ocean_world':  ['n2_o2', 'n2_co2_h2o', 'n2_o2'],
    'mini_neptune': ['h2_he'],
    'gas_giant':    ['h2_he_ch4'],
    'cold_rocky':   ['none', 'n2', 'thin_co2'],
    'ice_world':    ['none', 'n2'],
    'frozen_world': ['none'],
}

RADIUS_MASS: dict[str, tuple[tuple, tuple]] = {
    'lava_world':   ((0.80, 1.80), (0.60, 6.0)),
    'hot_rocky':    ((0.60, 1.40), (0.20, 3.5)),
    'rocky_barren': ((0.50, 1.30), (0.10, 2.5)),
    'hot_jupiter':  ((9.00, 13.0), (200, 800)),
    'super_earth':  ((1.20, 2.20), (3.50, 12.0)),
    'terran':       ((0.75, 1.40), (0.60, 2.2)),
    'ocean_world':  ((1.10, 2.00), (1.50, 8.5)),
    'mini_neptune': ((2.00, 3.80), (8.00, 28.0)),
    'gas_giant':    ((8.00, 13.0), (120, 450)),
    'cold_rocky':   ((0.40, 1.20), (0.10, 2.0)),
    'ice_world':    ((0.50, 1.60), (0.10, 3.5)),
    'frozen_world': ((0.40, 1.00), (0.05, 1.2)),
}

def settlement_tier(ptype: str, atmo: str, temp_k: int, stress: float) -> str:
    if stress > 0.7:
        return 'theoretical'
    if ptype == 'terran' and 'o2' in atmo and 180 < temp_k < 320:
        return 'candidate'
    if ptype == 'ocean_world' and 150 < temp_k < 350:
        return 'frontier'
    if ptype in ('super_earth', 'terran') and 120 < temp_k < 380:
        return 'frontier'
    return 'theoretical'

def make_planet(gal_slug: str, sys_idx: int, planet_idx: int,
                semi_major_au: float, luminosity_sol: float, mass_sol: float,
                is_gas: bool, bias: str, fe_h: float, stress: float, rng) -> dict:
    temp_k = eq_temp_k(luminosity_sol, semi_major_au)
    ptype  = planet_type(temp_k, is_gas, bias, rng)

    r_range, m_range = RADIUS_MASS.get(ptype, ((0.8, 1.2), (0.5, 2.0)))
    radius = round(r_range[0] + rng() * (r_range[1] - r_range[0]), 2)
    mass   = round(m_range[0] + rng() * (m_range[1] - m_range[0]), 2)

    atmo_list = ATMO_BY_TYPE.get(ptype, ['none'])
    atmo      = atmo_list[int(rng() * len(atmo_list))]

    tier   = settlement_tier(ptype, atmo, temp_k, stress)
    letter = chr(ord('b') + planet_idx)
    pid    = f"{gal_slug}-s{sys_idx + 1:03d}-{letter}"
    label  = f"{gal_slug.upper()} {sys_idx + 1} {letter.upper()}"

    return {
        'id':             pid,
        'label':          label,
        'type':           ptype,
        'radius_earth':   radius,
        'mass_earth':     mass,
        'period_days':    period_days(semi_major_au, mass_sol),
        'semi_major_au':  semi_major_au,
        'eq_temp_k':      temp_k,
        'atmosphere':     atmo,
        'settlement_tier': tier,
    }

# ── Orbital spacing ───────────────────────────────────────────────────────────

def inner_orbit_au(luminosity_sol: float, bias: str) -> float:
    base = 0.04 + 0.06 * (luminosity_sol ** 0.5)
    if bias == 'rocky_short_period': base *= 0.55
    if bias == 'jovian_wide':        base *= 1.60
    return round(max(0.02, base), 3)

def spacing_factor(bias: str, stress: float) -> float:
    base = {'ancient_cold_rocky': 1.70, 'rocky_short_period': 1.40,
            'mixed': 1.85, 'jovian_wide': 2.20, 'chaotic_infall': 1.30}.get(bias, 1.80)
    return base * max(0.65, 1.0 - stress * 0.30)

def orbital_radii(n: int, inner_au: float, max_au: float,
                  spacing: float, rng) -> list[float]:
    radii, a = [], inner_au
    for _ in range(n):
        radii.append(round(a, 4))
        if a >= max_au:
            break
        a = min(a * spacing * (1.0 + (rng() - 0.5) * 0.25), max_au * 0.97)
    # If orbits ran out, pad inward (disrupted short-period cluster)
    while len(radii) < n:
        radii.append(round(min(radii[-1] * 1.05, max_au), 4))
    return radii[:n]

def gas_giant_indices(n: int, ggp: float, bias: str, rng) -> set[int]:
    if bias in ('chaotic_infall', 'rocky_short_period'):
        return set()
    if bias == 'ancient_cold_rocky':
        ggp *= 0.35
    indices = set()
    for i in range(n):
        outer_weight = 0.25 + 0.75 * (i / max(1, n - 1))
        if rng() < ggp * outer_weight:
            indices.add(i)
    return indices

# ── Galaxy → number of star systems ──────────────────────────────────────────

HUBBLE_SYS_RANGE: dict[str, tuple[int, int]] = {
    'cD': (3, 5), 'gE': (2, 4), 'E': (2, 3), 'S0': (2, 3), 'S0a': (2, 3),
    'Sa': (3, 4), 'Sab': (3, 4), 'Sb': (3, 5), 'Sbc': (3, 4),
    'Sc': (2, 4), 'Scd': (2, 3), 'Sd': (2, 3), 'Sm': (1, 3),
    'Irr': (1, 2), 'Im': (1, 2), 'dE': (1, 2), 'dS0': (1, 2),
}

def n_star_systems(hubble: str, stress: float, est_planets: int, rng) -> int:
    lo, hi = HUBBLE_SYS_RANGE.get(hubble, (1, 3))
    hi = max(lo, hi - int(stress * 2.5))
    n  = lo + int(rng() * (hi - lo + 1))
    if est_planets >= 8 and n < 3:
        n = 3
    return max(1, n)

def age_gyr(zone: str, fe_h: float, rng) -> float:
    base = {'core': 11.5, 'inner': 10.0, 'outskirts': 8.5, 'infall': 7.0}.get(zone, 9.0)
    return round(max(1.0, base + fe_h * 1.5 + (rng() - 0.5) * 2.0), 1)

# ── Human-readable observatory report ────────────────────────────────────────

ZONE_PROSE = {
    'core':      'the dense cluster core, subject to strong ICM ram pressure',
    'inner':     'the inner cluster region, within significant ICM influence',
    'outskirts': 'the cluster outskirts, where ICM stripping is moderate',
    'infall':    'the infall region at the cluster periphery, largely ICM-free',
}
BIAS_PROSE = {
    'ancient_cold_rocky':  'ancient cold rocky worlds — metal-rich, tidal-disrupted outer orbits',
    'rocky_short_period':  'rocky short-period planets — tightly-packed inner system, orbital compression from ICM drag',
    'mixed':               'mixed architecture — inner rocky worlds alongside outer ice giants or mini-Neptunes',
    'jovian_wide':         'wide-orbit gas giants with potential moon settlement zones',
    'chaotic_infall':      'chaotic infall architecture — disrupted barren worlds with ongoing orbital instability',
}

def observatory_report(member: dict, arch: dict, n_sys: int, n_planets: int) -> str:
    gal_id = member.get('id', '')
    hubble = member.get('hubble', '')
    zone   = arch['cluster_zone']
    bias   = arch['planet_bias']
    stress = arch['icm_stress']
    teff   = arch['star_teff_k']
    feh    = arch['metallicity_fe_h']
    tel    = arch['anchor_telescope']
    return (
        f"{gal_id} ({hubble}) situated in {ZONE_PROSE.get(zone, zone)}. "
        f"ICM stress {stress:.2f}; host population Teff ≈ {teff} K, Fe/H {feh:+.2f}. "
        f"Architecture favours {BIAS_PROSE.get(bias, bias)}. "
        f"{n_sys} star system(s), {n_planets} planet(s) generated. "
        f"Observational anchor: {tel}."
    )

# ── Core builder ──────────────────────────────────────────────────────────────

TIER_RANK = {'candidate': 3, 'frontier': 2, 'theoretical': 1}
SUFFIXES  = ['Prime', 'Beta', 'Gamma', 'Delta', 'Epsilon']

def build_star_systems(member: dict, arch: dict, rng) -> tuple[list, int, int]:
    hubble   = member.get('hubble', 'E')
    stress   = arch['icm_stress']
    bias     = arch['planet_bias']
    fe_h     = arch['metallicity_fe_h']
    teff_k   = arch['star_teff_k']
    max_au   = arch['max_orbit_au']
    ggp      = arch['gas_giant_prob']
    est_pl   = arch['estimated_planets']
    gal_id   = member.get('id', 'UNK')
    gal_name = member.get('name') or gal_id
    gal_slug = gal_id.lower().replace(' ', '_')

    n_sys     = n_star_systems(hubble, stress, est_pl, rng)
    pl_each   = max(1, est_pl // n_sys)
    remainder = max(0, est_pl - pl_each * n_sys)

    systems, total_pl = [], 0

    for si in range(n_sys):
        n_pl = min(6, max(1, pl_each + (1 if si < remainder else 0)))

        teff_var = int(teff_k + (rng() - 0.5) * 400)
        spec, mass_sol, lum = spectral_from_teff(teff_var, fe_h)
        star_age = age_gyr(arch['cluster_zone'], fe_h, rng)

        inner  = inner_orbit_au(lum, bias)
        space  = spacing_factor(bias, stress)
        radii  = orbital_radii(n_pl, inner, max_au, space, rng)
        gg_set = gas_giant_indices(n_pl, ggp, bias, rng)

        planets = [
            make_planet(gal_slug, si, pi, radii[pi], lum, mass_sol,
                        pi in gg_set, bias, fe_h, stress, rng)
            for pi in range(n_pl)
        ]
        total_pl += len(planets)

        best_tier = max((p['settlement_tier'] for p in planets),
                        key=lambda t: TIER_RANK.get(t, 0))

        sys_label = f"{gal_name} — {SUFFIXES[min(si, len(SUFFIXES)-1)]}"
        sys_id    = f"{gal_slug}-s{si + 1:03d}"

        feh_var = round(fe_h + (rng() - 0.5) * 0.05, 3)

        systems.append({
            'id':              sys_id,
            'label':           sys_label,
            'spectral_type':   spec,
            'mass_sol':        mass_sol,
            'feh':             feh_var,
            'age_gyr':         star_age,
            'luminosity_sol':  lum,
            'coord_system':    'cluster-relative-v1',
            'settlement_tier': best_tier,
            'environment_note': (
                f"{arch['cluster_zone'].capitalize()} zone; "
                f"ICM stress {stress:.2f}; bias: {bias}"
            ),
            'planets': planets,
        })

    return systems, n_sys, total_pl

def generate_galaxy_doc(member: dict, cluster_meta: dict) -> dict:
    arch      = member['system_architecture']
    gal_id    = member['id']
    rng       = mulberry32(str_seed(gal_id + cluster_meta.get('slug', '')))

    systems, n_sys, n_pl = build_star_systems(member, arch, rng)
    report = observatory_report(member, arch, n_sys, n_pl)

    return {
        'galaxy_id':          gal_id,
        'galaxy_name':        member.get('name') or gal_id,
        'galaxy_hubble':      member.get('hubble', ''),
        'cluster':            cluster_meta.get('cluster', ''),
        'cluster_slug':       cluster_meta.get('slug', ''),
        'cluster_dist_mpc':   cluster_meta.get('dist_mpc', 0),
        'environment': {
            'description':       report,
            'radiation_factor':  round(1.0 + arch['icm_stress'] * 3.0, 2),
            'metallicity_feh':   arch['metallicity_fe_h'],
            'agn':               arch['icm_stress'] > 0.8,
            'cooling_flow':      (arch['cluster_zone'] == 'core'
                                  and arch['metallicity_fe_h'] > 0.15),
            'ram_pressure':      arch['icm_stress'] > 0.30,
            'merger':            arch['planet_bias'] == 'chaotic_infall',
        },
        'placement_notes': {
            'v1': report,
            'open_questions': [],
            'nft_zones': [
                f"{arch['cluster_zone']}-zone-"
                f"{arch['anchor_telescope'].lower().replace('/', '-')}"
            ],
        },
        'generation': 'v1-procedural',
        'provenance': {
            'script':               'generate_cluster_starsystems.py',
            'algorithm_version':    ALGORITHM_VERSION,
            'architecture_version': '1.0',
            'seed_source':          gal_id,
            'generated_at':         datetime.now(timezone.utc).isoformat(),
            'inputs': {
                'cluster_zone':     arch['cluster_zone'],
                'icm_stress':       arch['icm_stress'],
                'metallicity_fe_h': arch['metallicity_fe_h'],
                'planet_bias':      arch['planet_bias'],
                'star_teff_k':      arch['star_teff_k'],
                'max_orbit_au':     arch['max_orbit_au'],
                'gas_giant_prob':   arch['gas_giant_prob'],
                'anchor_telescope': arch['anchor_telescope'],
                'estimated_planets': arch['estimated_planets'],
            },
            'observatory_report': report,
        },
        'star_systems': systems,
    }

# ── I/O helpers ───────────────────────────────────────────────────────────────

def load_cluster_files() -> list[dict]:
    """Return list of (path, doc) for all cluster member files."""
    return [(p, json.loads(p.read_text())) for p in sorted(CLUSTER_DIR.glob('*-members.json'))]

def load_index() -> dict:
    if INDEX_PATH.exists():
        return json.loads(INDEX_PATH.read_text())
    return {'version': 'v0', 'generated': '', 'clusters': {}}

def save_index(idx: dict):
    INDEX_PATH.write_text(json.dumps(idx, indent=2, ensure_ascii=False))

def mark_inventory_done(galaxy_ids: set[str]):
    if not INVENTORY_PATH.exists():
        return
    inv = json.loads(INVENTORY_PATH.read_text())
    changed = 0
    for key, entry in inv.get('systems', {}).items():
        for gid in galaxy_ids:
            if key.upper().endswith(gid.upper()) or gid in key:
                if entry.get('status') == 'pending':
                    entry['status'] = 'generated'
                    changed += 1
    if changed:
        INVENTORY_PATH.write_text(json.dumps(inv, indent=2, ensure_ascii=False))

# ── Main ──────────────────────────────────────────────────────────────────────

def run(args):
    cluster_files = load_cluster_files()
    idx = load_index()

    # Filter by cluster slug
    if args.cluster:
        target = args.cluster.lower().replace(' ', '-')
        cluster_files = [(p, d) for p, d in cluster_files if d.get('slug', '') == target]
        if not cluster_files:
            print(f"No cluster matching '{args.cluster}'", file=sys.stderr); sys.exit(1)

    n_written = n_skipped_v0 = n_skipped_exists = n_skipped_arch = 0
    generated_ids: set[str] = set()

    for path, cluster_doc in cluster_files:
        slug     = cluster_doc.get('slug', path.stem.replace('-members', ''))
        cname    = cluster_doc.get('cluster', slug)
        dist_mpc = cluster_doc.get('dist_mpc', 0)
        members  = cluster_doc.get('members', [])

        # Apply member filters
        if args.galaxy:
            members = [m for m in members if m['id'] == args.galaxy]
            if not members:
                print(f"  Galaxy '{args.galaxy}' not found in {slug}"); continue
        if args.surface_only:
            members = [m for m in members
                       if m.get('system_architecture', {}).get('requires_surface_render')]
        if args.named_only:
            members = [m for m in members if m.get('is_named')]

        cluster_meta = {**cluster_doc, 'name': cname, 'slug': slug}

        print(f"\n  {cname:30s}  {len(members)} members")

        out_dir = OUTPUT_DIR / slug
        if not args.dry_run:
            out_dir.mkdir(parents=True, exist_ok=True)

        idx.setdefault('clusters', {}).setdefault(slug, [])

        for m in members:
            gal_id = m['id']

            if gal_id in V0_GALAXIES and not args.overwrite_v0:
                n_skipped_v0 += 1
                continue

            if 'system_architecture' not in m:
                n_skipped_arch += 1
                print(f"    [skip] {gal_id}: no system_architecture — run enrich_with_architecture.py first")
                continue

            out_path = out_dir / f"{gal_id}.json"
            if out_path.exists() and not args.overwrite and not args.overwrite_v0:
                n_skipped_exists += 1
                continue

            doc = generate_galaxy_doc(m, cluster_meta)
            n_pl  = sum(len(s['planets']) for s in doc['star_systems'])
            n_sys = len(doc['star_systems'])
            name  = m.get('name') or gal_id
            tier_counts = {}
            for s in doc['star_systems']:
                for p in s['planets']:
                    t = p['settlement_tier']
                    tier_counts[t] = tier_counts.get(t, 0) + 1

            tier_str = '  '.join(f"{k}:{v}" for k, v in sorted(tier_counts.items()))
            print(f"    {gal_id:12s}  {name:20s}  {n_sys}sys {n_pl:2d}pl  [{tier_str}]")

            if not args.dry_run:
                out_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False))
                generated_ids.add(gal_id)
                n_written += 1

                # Update index entry
                idx_entry = {
                    'galaxy_id':   gal_id,
                    'galaxy_name': doc['galaxy_name'],
                    'systems':     n_sys,
                    'planets':     n_pl,
                    'generation':  'v1-procedural',
                }
                existing = idx['clusters'][slug]
                existing_ids = {e['galaxy_id'] for e in existing}
                if gal_id in existing_ids:
                    idx['clusters'][slug] = [
                        idx_entry if e['galaxy_id'] == gal_id else e
                        for e in existing
                    ]
                else:
                    existing.append(idx_entry)

    if not args.dry_run:
        idx['version']   = 'v1'
        idx['generated'] = (f"v0 hand-designed + v1 procedural — "
                            f"{datetime.now(timezone.utc).strftime('%Y-%m-%d')}")
        save_index(idx)
        if generated_ids:
            mark_inventory_done(generated_ids)

    print(f"\n  Done. written={n_written}  skipped_v0={n_skipped_v0}"
          f"  skipped_exists={n_skipped_exists}  skipped_no_arch={n_skipped_arch}")

def run_list():
    cluster_files = load_cluster_files()
    print("Cluster member files:\n")
    for path, doc in cluster_files:
        slug    = doc.get('slug', path.stem)
        members = doc.get('members', [])
        arch    = sum(1 for m in members if 'system_architecture' in m)
        v0_skip = sum(1 for m in members if m['id'] in V0_GALAXIES)
        out_dir = OUTPUT_DIR / slug
        done    = len(list(out_dir.glob('*.json'))) if out_dir.exists() else 0
        print(f"    {slug:40s}  {arch:3d} enriched  {done:3d} generated  {v0_skip} v0 skip")

def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[1].strip())
    p.add_argument('--cluster',      help='Limit to one cluster slug')
    p.add_argument('--galaxy',       help='Limit to one galaxy ID (e.g. NGC4889)')
    p.add_argument('--dry-run',      action='store_true', help='Print plan, write nothing')
    p.add_argument('--list',         action='store_true', help='Show file status and exit')
    p.add_argument('--overwrite',    action='store_true', help='Re-generate existing procedural files')
    p.add_argument('--overwrite-v0', action='store_true', help='Also overwrite v0 hand-designed files')
    p.add_argument('--surface-only', action='store_true', help='Only requires_surface_render members')
    p.add_argument('--named-only',   action='store_true', help='Only is_named members')
    args = p.parse_args()

    if args.list:
        run_list(); return

    run(args)

if __name__ == '__main__':
    main()
