#!/usr/bin/env python3
"""
generate_bh_anticipated_objects.py

Generates "ANTICIPATED" object populations for the 9 catalog black holes in
src/data/black-holes.ts — field stars, cluster members, or nuclear-cusp stars
that real astrophysics says must be nearby, but that are not individually
observed/cataloged the way the black hole, its companion, or (for Omega Cen)
its 7 hypervelocity tracer stars are.

This is a *labeled estimate*, not a discovery, and every object this script
emits carries "category": "anticipated" plus the methodology that produced it,
so the frontend can never present it as confirmed data. See the companion
post (blog-anticipated-objects-methodology.md) for the full reasoning.

Three physically-motivated density models are used, chosen by each object's
real environment (see METHODOLOGY below for citations):

  1. galactic-field-star-density  — the 7 Milky Way x-ray binaries. Exponential
     thin-disk model (Jurić et al. 2008-style), sampled in a small sphere
     around the system's real galactic position.
  2. king-profile-cluster          — Omega Centauri IMBH. King (1962) profile
     with Omega Cen's own published core/tidal radii.
  3. nuclear-cusp                  — M87* and NGC 4258. Bahcall & Wolf (1976)
     relaxed stellar-cusp power law, normalized for visual plausibility
     against Sgr A*'s own (comparatively well-constrained) nuclear cluster —
     flagged explicitly as a cross-calibration, not a per-galaxy literature fit.

Output: public/black-holes/anticipated/<bh-id>.json — one file per object,
schema documented inline in each `generate_*` function's docstring.

Requirements: none (stdlib only).

Usage:
    python generate_bh_anticipated_objects.py --all
    python generate_bh_anticipated_objects.py --bh Cygnus-X-1
    python generate_bh_anticipated_objects.py --dry-run
"""

import argparse
import json
import math
from pathlib import Path

ROOT       = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / 'public' / 'black-holes' / 'anticipated'

# ── Seeded RNG — Mulberry32, matches every seeded RNG already used across the
# TS frontend and the other datagathering/*.py scripts, so results here are
# reproducible and consistent with the rest of the codebase's conventions. ──

class Mulberry32:
    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def __call__(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((self.state ^ (self.state >> 15)) * (1 | self.state)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t))) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return t / 4_294_967_296


def seed_from_id(bh_id: str) -> int:
    """Matches hostnameToSeed() in src/lib/three-utils.ts (imul-based string hash)."""
    h = 7
    for c in bh_id:
        h = ((h * 31) & 0xFFFFFFFF) + ord(c)
        h &= 0xFFFFFFFF
    return h


# ── Catalog — kept in sync by hand with src/data/black-holes.ts. Only the
# fields this generator actually needs are duplicated here. ───────────────────

CATALOG = [
    # X-ray binaries — galactic-field-star-density model
    {'id': 'Gaia-BH1',      'sceneType': 'x-ray-binary', 'ra_deg': 262.17,          'dec_deg': -0.58,     'dist_pc': 480},
    {'id': 'Gaia-BH2',      'sceneType': 'x-ray-binary', 'ra_deg': 207.57,          'dec_deg': -59.24,    'dist_pc': 1160},
    {'id': 'Gaia-BH3',      'sceneType': 'x-ray-binary', 'ra_deg': 294.8278502411,  'dec_deg': 14.9309190720, 'dist_pc': 590},
    {'id': 'Cygnus-X-1',    'sceneType': 'x-ray-binary', 'ra_deg': 299.590325,      'dec_deg': 35.201599, 'dist_pc': 2200},
    {'id': 'V404-Cygni',    'sceneType': 'x-ray-binary', 'ra_deg': 306.016,         'dec_deg': 33.867,    'dist_pc': 2390},
    {'id': 'GRO-J1655-40',  'sceneType': 'x-ray-binary', 'ra_deg': 253.5,           'dec_deg': -39.845,   'dist_pc': 3200},
    {'id': 'A0620-00',      'sceneType': 'x-ray-binary', 'ra_deg': 95.686,          'dec_deg': -0.346,    'dist_pc': 1060},
    # Globular cluster IMBH — King-profile model
    {'id': 'Omega-Cen-IMBH', 'sceneType': 'globular-imbh', 'ra_deg': 201.696958, 'dec_deg': -47.479581, 'dist_pc': 5240},
    # Extragalactic nuclei — nuclear-cusp model
    {'id': 'M87-star', 'sceneType': 'agn-jet',        'ra_deg': 187.705971, 'dec_deg': 12.391123, 'dist_pc': 16.8e6 / 3.2616, 'mass_msun': 6.5e9},
    {'id': 'NGC-4258', 'sceneType': 'megamaser-disk', 'ra_deg': 184.739789, 'dec_deg': 47.303719, 'dist_pc': 7.6e6 / 3.2616, 'mass_msun': 3.9e7},
]

SGR_A_MASS_MSUN = 4.154e6   # for cusp-count mass scaling below

# ── Spectral-type mix — approximate local IMF/luminosity-function fractions
# by number of main-sequence stars (RECONS-style local census; M dwarfs
# overwhelmingly dominate real star counts, O/B stars are vanishingly rare) ──

SPECTRAL_MIX = [
    # (spectral, cumulative fraction, representative Teff_K)
    ('M', 0.760, 3500),
    ('K', 0.880, 4500),
    ('G', 0.955, 5800),
    ('F', 0.985, 6800),
    ('A', 0.995, 9000),
    ('B', 1.000, 15000),
]


def pick_spectral(rng: Mulberry32) -> tuple:
    x = rng()
    for spectral, cum, teff in SPECTRAL_MIX:
        if x <= cum:
            return spectral, teff
    return SPECTRAL_MIX[-1][0], SPECTRAL_MIX[-1][2]


# ── Model 1: galactic-field-star-density ───────────────────────────────────────
#
# Exponential thin-disk density n(R,z) = n0 * exp(-(R-R0)/L) * exp(-|z|/H),
# parameters from Jurić et al. 2008 (ApJ 673, 864) thin-disk fit:
#   R0 = 8300 pc (Sun's galactocentric radius)
#   L  = 2600 pc (radial scale length)
#   H  = 300 pc  (vertical scale height)
#   n0 = 0.14 stars/pc^3 (local total main-sequence number density,
#        consistent with RECONS 25-pc-sample-derived local luminosity function)
#
# Equatorial → galactic coordinate transform uses the standard J2000 IAU pole:
#   RA_NGP = 192.85948 deg, Dec_NGP = 27.12825 deg, L_NCP = 122.93192 deg

R0_PC, L_PC, H_PC, N0_PER_PC3 = 8300.0, 2600.0, 300.0, 0.14
RA_NGP, DEC_NGP, L_NCP = math.radians(192.85948), math.radians(27.12825), math.radians(122.93192)
SEARCH_RADIUS_PC = 3.0   # ~1.6x the mean nearest-neighbor spacing at n0 — a modest, non-empty neighborhood


def equatorial_to_galactic_xyz(ra_deg: float, dec_deg: float, dist_pc: float) -> tuple:
    ra, dec = math.radians(ra_deg), math.radians(dec_deg)
    sin_b = math.sin(dec) * math.sin(DEC_NGP) + math.cos(dec) * math.cos(DEC_NGP) * math.cos(ra - RA_NGP)
    b = math.asin(max(-1.0, min(1.0, sin_b)))
    y_num = math.cos(dec) * math.sin(ra - RA_NGP)
    x_num = math.cos(DEC_NGP) * math.sin(dec) - math.sin(DEC_NGP) * math.cos(dec) * math.cos(ra - RA_NGP)
    l = L_NCP - math.atan2(y_num, x_num)
    x = dist_pc * math.cos(b) * math.cos(l)   # toward galactic center direction component
    y = dist_pc * math.cos(b) * math.sin(l)
    z = dist_pc * math.sin(b)
    return x, y, z


def field_star_density(ra_deg: float, dec_deg: float, dist_pc: float) -> float:
    x, y, z = equatorial_to_galactic_xyz(ra_deg, dec_deg, dist_pc)
    R = math.sqrt((R0_PC - x) ** 2 + y ** 2)
    return N0_PER_PC3 * math.exp(-(R - R0_PC) / L_PC) * math.exp(-abs(z) / H_PC)


def generate_field_stars(bh: dict) -> dict:
    """
    Milky Way field stars in the immediate neighborhood of an x-ray binary —
    not physically associated with the system, just the ordinary background
    population any real observer would see at that galactic position.

    Object schema:
      { id, type: 'field_star', spectral, teff_K, offset_pc: [x,y,z] }
    offset_pc is relative to the black hole, in a local frame (not galactic
    orientation) — arbitrary orientation is fine since these stars carry no
    directional physical meaning relative to the system itself.
    """
    rng = Mulberry32(seed_from_id(bh['id']))
    density = field_star_density(bh['ra_deg'], bh['dec_deg'], bh['dist_pc'])
    volume = (4 / 3) * math.pi * SEARCH_RADIUS_PC ** 3
    expected_count = density * volume
    count = max(0, round(expected_count + (rng() - 0.5) * math.sqrt(max(expected_count, 1))))

    objects = []
    for i in range(count):
        # Uniform-in-sphere sampling via cube-root radius
        r = SEARCH_RADIUS_PC * (rng() ** (1 / 3))
        theta = rng() * math.tau
        phi = math.acos(2 * rng() - 1)
        offset = [
            round(r * math.sin(phi) * math.cos(theta), 4),
            round(r * math.sin(phi) * math.sin(theta), 4),
            round(r * math.cos(phi), 4),
        ]
        spectral, teff = pick_spectral(rng)
        objects.append({
            'id': f'field-{i:03d}', 'type': 'field_star',
            'spectral': spectral, 'teff_K': teff, 'offset_pc': offset,
        })

    return {
        'bh_id': bh['id'], 'category': 'anticipated',
        'methodology': 'galactic-field-star-density',
        'methodology_note': (
            'Exponential thin-disk model (Juric et al. 2008 ApJ 673,864 fit '
            'parameters). These stars are ordinary Milky Way field population — '
            'not physically bound to the black hole system, and not individually '
            'observed. Positions and spectral types are statistically sampled, not '
            'measured.'
        ),
        'methodology_params': {
            'R0_pc': R0_PC, 'L_pc': L_PC, 'H_pc': H_PC, 'n0_per_pc3': N0_PER_PC3,
            'search_radius_pc': SEARCH_RADIUS_PC, 'local_density_per_pc3': round(density, 5),
        },
        'object_count': count,
        'objects': objects,
    }


# ── Model 2: king-profile-cluster (Omega Centauri) ─────────────────────────────
#
# King (1962) profile, simplified isothermal-sphere approximation:
#   n(r) = n0 / (1 + (r/rc)^2)^1.5,  truncated at the tidal radius r_t.
# Omega Centauri parameters (widely-cited literature values):
#   rc = 2.4 pc (core radius), r_t = 55 pc (tidal radius),
#   n0 ~ 5000 stars/pc^3 (illustrative central density — real central surface
#   brightness implies a very dense core; this is a round, visually-plausible
#   value, not a specific paper's number-density fit)

OMEGA_CEN_RC_PC, OMEGA_CEN_RT_PC, OMEGA_CEN_N0 = 2.4, 55.0, 5000.0
OMEGA_CEN_SAMPLE_RADIUS_PC = 6.0   # inner region only — the full tidal radius would be thousands of stars


def generate_king_cluster(bh: dict) -> dict:
    """
    Object schema:
      { id, type: 'cluster_star', spectral, teff_K, offset_pc: [x,y,z] }
    """
    rng = Mulberry32(seed_from_id(bh['id']))

    def king_density(r):
        return OMEGA_CEN_N0 / (1 + (r / OMEGA_CEN_RC_PC) ** 2) ** 1.5

    # Numerically integrate expected count within OMEGA_CEN_SAMPLE_RADIUS_PC
    # via thin shells (stdlib only — no scipy).
    steps, count_f = 400, 0.0
    dr = OMEGA_CEN_SAMPLE_RADIUS_PC / steps
    for i in range(steps):
        r = (i + 0.5) * dr
        count_f += king_density(r) * 4 * math.pi * r * r * dr
    count = min(3000, round(count_f))   # cap — this is an illustrative field, not a full census

    objects = []
    for i in range(count):
        # Rejection-sample r from the King profile within the search radius
        for _ in range(30):
            r_try = rng() * OMEGA_CEN_SAMPLE_RADIUS_PC
            if rng() < king_density(r_try) / OMEGA_CEN_N0:
                r = r_try
                break
        else:
            r = OMEGA_CEN_SAMPLE_RADIUS_PC * 0.3
        theta = rng() * math.tau
        phi = math.acos(2 * rng() - 1)
        offset = [
            round(r * math.sin(phi) * math.cos(theta), 4),
            round(r * math.sin(phi) * math.sin(theta), 4),
            round(r * math.cos(phi), 4),
        ]
        spectral, teff = pick_spectral(rng)
        objects.append({
            'id': f'cluster-{i:04d}', 'type': 'cluster_star',
            'spectral': spectral, 'teff_K': teff, 'offset_pc': offset,
        })

    return {
        'bh_id': bh['id'], 'category': 'anticipated',
        'methodology': 'king-profile-cluster',
        'methodology_note': (
            'King (1962) density profile using Omega Centauri\'s published core '
            'radius (2.4 pc); central density is a round illustrative value, not '
            'a specific paper\'s number-density fit. This models the general '
            'cluster-core population — the 7 real hypervelocity tracer stars '
            '(Haberle et al. 2024) are the actual dynamical evidence and are '
            'tracked separately, not part of this generated field.'
        ),
        'methodology_params': {
            'core_radius_pc': OMEGA_CEN_RC_PC, 'tidal_radius_pc': OMEGA_CEN_RT_PC,
            'central_density_per_pc3': OMEGA_CEN_N0, 'sample_radius_pc': OMEGA_CEN_SAMPLE_RADIUS_PC,
        },
        'object_count': count,
        'objects': objects,
    }


# ── Model 3: nuclear-cusp (M87*, NGC 4258) ──────────────────────────────────────
#
# Bahcall & Wolf (1976, ApJ 209, 214) relaxed stellar-cusp power law:
#   n(r) ∝ r^-gamma, gamma = 1.75
# Normalization: cross-calibrated against this same site's own Sgr A* nuclear
# star cluster generator (buildNuclearStarCluster() in GalacticCenterPage.vue),
# scaled by each black hole's much larger sphere-of-influence radius relative
# to Sgr A*'s. This is an honest visual cross-calibration, not a literature
# fit to either galaxy's actual nuclear photometry — those galaxies' nuclei
# are far beyond individual-star resolution from Earth at their real distance.

GAMMA_CUSP = 1.75
SGR_A_REFERENCE_N0 = 3000    # matches the point count buildNuclearStarCluster() uses for Sgr A*
NUCLEAR_SAMPLE_RADIUS_PC = 2.0


def generate_nuclear_cusp(bh: dict) -> dict:
    """
    Object schema:
      { id, type: 'nuclear_star', spectral, teff_K, offset_pc: [x,y,z] }
    """
    rng = Mulberry32(seed_from_id(bh['id']))
    # Scale count relative to Sgr A*'s reference field by mass^(1/3) — a rough
    # proxy for how sphere-of-influence radius grows with mass (r_SOI ~ GM/sigma^2,
    # and sigma itself grows slowly with mass via the M-sigma relation, so mass^(1/3)
    # is a deliberately conservative stand-in rather than a precise derivation).
    mass_ratio = bh['mass_msun'] / SGR_A_MASS_MSUN
    count = min(4000, max(400, round(SGR_A_REFERENCE_N0 * (mass_ratio ** (1 / 3)))))

    objects = []
    for i in range(count):
        u = rng()
        # Inverse-CDF sample for n(r) ∝ r^(2-gamma) dr (spherical shell weighting)
        exponent = 3 - GAMMA_CUSP
        r = NUCLEAR_SAMPLE_RADIUS_PC * (u ** (1 / exponent))
        theta = rng() * math.tau
        phi = math.acos(2 * rng() - 1) * 0.6   # flattened toward a nuclear disk plane
        offset = [
            round(r * math.sin(phi) * math.cos(theta), 5),
            round(r * math.cos(phi) * 0.4, 5),
            round(r * math.sin(phi) * math.sin(theta), 5),
        ]
        spectral, teff = pick_spectral(rng)
        objects.append({
            'id': f'nuclear-{i:04d}', 'type': 'nuclear_star',
            'spectral': spectral, 'teff_K': teff, 'offset_pc': offset,
        })

    return {
        'bh_id': bh['id'], 'category': 'anticipated',
        'methodology': 'nuclear-cusp',
        'methodology_note': (
            'Bahcall & Wolf (1976) relaxed stellar-cusp power law (gamma=1.75), '
            'normalized by cross-calibration against this site\'s own Sgr A* '
            'nuclear star cluster field, not a per-galaxy literature photometric '
            'fit — individual nuclear stars in M87 or NGC 4258 are far beyond '
            'resolution from Earth at their real distance. Illustrative density '
            'only; do not cite as a per-galaxy stellar count.'
        ),
        'methodology_params': {
            'gamma': GAMMA_CUSP, 'sample_radius_pc': NUCLEAR_SAMPLE_RADIUS_PC,
            'reference': 'Sgr A* nuclear cluster generator (GalacticCenterPage.vue)',
        },
        'object_count': count,
        'objects': objects,
    }


# ── Dispatch ────────────────────────────────────────────────────────────────────

def generate_for(bh: dict) -> dict:
    if bh['sceneType'] == 'x-ray-binary':
        return generate_field_stars(bh)
    if bh['sceneType'] == 'globular-imbh':
        return generate_king_cluster(bh)
    return generate_nuclear_cusp(bh)   # agn-jet, megamaser-disk


def write_output(data: dict, dry_run: bool) -> None:
    path = OUTPUT_DIR / f"{data['bh_id']}.json"
    if dry_run:
        print(f"  [dry-run] {path.name}  ({data['object_count']} objects, {data['methodology']})")
        return
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        json.dump(data, f, separators=(',', ':'))
    print(f"  wrote {path.name}  ({data['object_count']} objects, {data['methodology']})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--bh', type=str, default=None)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    targets = CATALOG
    if args.bh:
        targets = [b for b in CATALOG if b['id'] == args.bh]
        if not targets:
            print(f"Unknown bh id: {args.bh}")
            return
    elif not args.all:
        print("Nothing to do — pass --all or --bh <id> (--dry-run supported with either)")
        return

    for bh in targets:
        data = generate_for(bh)
        write_output(data, args.dry_run)


if __name__ == '__main__':
    main()
