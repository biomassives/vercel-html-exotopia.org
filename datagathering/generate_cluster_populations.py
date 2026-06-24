#!/usr/bin/env python3
"""
generate_cluster_populations.py

Generate navigable galaxy-member catalogs using scientifically motivated
population profiles — expected morphological fractions sourced from real
cluster surveys (Dressler 1980; Whitmore et al. 1993; Postman & Geller 1984).

Unlike generate_cluster_subobjects.py (generic tapKev model), this script
uses per-cluster profiles that match observed galaxy-type distributions,
plus extended navigation metadata:
  - Object tags: agn, starburst, ram_pressure_stripped, merger, bcg, dwarf
  - star_system_count: estimated navigable depth per galaxy
  - nav_stub: true for dwarfs (render at simpler LOD)

Navigable hierarchy:
  Cluster → Galaxy members (this script) → Star systems → Planets

Usage:
    python generate_cluster_populations.py --list-profiles
    python generate_cluster_populations.py --inventory
    python generate_cluster_populations.py --cluster norma
    python generate_cluster_populations.py --cluster norma --count 400
    python generate_cluster_populations.py --all-named
    python generate_cluster_populations.py --all-xray
    python generate_cluster_populations.py --dry-run --cluster coma
    python generate_cluster_populations.py --show-fractions --cluster perseus

Morphology codes:
    cD   Brightest Cluster Galaxy (1 per cluster, always at centre)
    E    Giant elliptical
    S0   Lenticular
    Sa   Early-type spiral (tightly wound, red)
    Sb   Late-type spiral (open arms, bluer)
    Irr  Irregular / tidally disturbed
    dE   Dwarf elliptical (fainter, nav_stub)
    dIrr Dwarf irregular (nav_stub)
"""

import argparse
import json
import math
import re
import sys
from pathlib import Path
from typing import Optional

ROOT       = Path(__file__).parent.parent
XRAY_PATH  = ROOT / 'public' / 'clusters-xray.json'
OUTPUT_DIR = ROOT / 'public' / 'clusters'

MPC_SCALE = 1 / 15   # 1 Mpc → scene units (matches cosmic-structures.ts)

# ── Named cluster profiles ─────────────────────────────────────────────────────
# Morphology fractions sourced from:
#   Dressler (1980) ApJ 236:351     — original morphology-density relation
#   Whitmore et al. (1993) ApJ 118  — updated fractions vs cluster radius
#   Postman & Geller (1984) ApJ 281 — field vs cluster comparison
#   Thomas et al. (2017) MNRAS      — low-z cluster census
#
# fracs must sum to ≤ 1.0; remainder drawn as extra Irr to absorb rounding.
# cD is always exactly 1 galaxy (not included in fracs).

CLUSTER_PROFILES: dict[str, dict] = {
    'norma': {
        'display_name': 'Norma Cluster',
        'abell': 'Abell 3627',
        'center_ra': 243.3,
        'center_dec': -60.9,
        'dist_mpc': 65.0,
        'tx_kev': 6.7,
        'rvir_mpc': 1.2,
        'sigma_v_kms': 900,
        'M200_1e14': 12.0,
        'richness': 9,
        'default_count': 250,
        'notes': (
            'Great Attractor core (Woudt+2004); ~700 confirmed members. '
            'Heavily obscured by MW dust (A_V > 1.5 mag) — biases catalog toward E/S0. '
            'ESO137-001: spectacular 80 kpc ram-pressure stripped X-ray + Hα tail. '
            'ESO137-006: BCG with radio+X-ray AGN.'
        ),
        # Morphology fractions (excluding the 1 cD BCG)
        'fracs': {
            'E':    0.40,
            'S0':   0.28,
            'Sa':   0.10,
            'Sb':   0.08,
            'Irr':  0.05,
            'dE':   0.07,
            'dIrr': 0.02,
        },
        'agn_frac':      0.06,   # fraction of giant galaxies with AGN tag
        'rps_frac':      0.08,   # ram-pressure-stripped flag
        'merger_frac':   0.04,
        'starburst_frac': 0.03,
        'dust_obscured': True,   # adds scatter to bt_mag
    },
    'perseus': {
        'display_name': 'Perseus Cluster',
        'abell': 'Abell 426',
        'center_ra': 49.95,
        'center_dec': 41.52,
        'dist_mpc': 73.6,
        'tx_kev': 6.0,
        'rvir_mpc': 1.3,
        'sigma_v_kms': 1040,
        'M200_1e14': 13.0,
        'richness': 9,
        'default_count': 280,
        'notes': (
            'Famous cool-core cluster (Fabian+2003); NGC1275 (Perseus A) BCG with '
            'Hα filaments and X-ray cavities from AGN jet heating. '
            'ICM sound-wave ripples detected by Chandra. '
            '500+ members confirmed in NED/SDSS; strong ongoing merger with NGC1272 group.'
        ),
        'fracs': {
            'E':    0.33,
            'S0':   0.32,
            'Sa':   0.12,
            'Sb':   0.09,
            'Irr':  0.06,
            'dE':   0.07,
            'dIrr': 0.01,
        },
        'agn_frac':      0.08,
        'rps_frac':      0.05,
        'merger_frac':   0.06,
        'starburst_frac': 0.04,
        'dust_obscured': False,
    },
    'coma': {
        'display_name': 'Coma Cluster',
        'abell': 'Abell 1656',
        'center_ra': 194.9,
        'center_dec': 27.98,
        'dist_mpc': 100.0,
        'tx_kev': 8.2,
        'rvir_mpc': 1.5,
        'sigma_v_kms': 1082,
        'M200_1e14': 18.0,
        'richness': 10,
        'default_count': 320,
        'notes': (
            'Prototype rich cluster (Zwicky 1933 dark matter discovery); ~1000 confirmed members. '
            'Bimodal: NGC4889 + NGC4874 as co-BCGs. Hot, well-relaxed ICM. '
            'Virgo infall filament extends ~30 Mpc. NGC4839 infalling group in SW substructure.'
        ),
        'fracs': {
            'E':    0.37,
            'S0':   0.38,
            'Sa':   0.10,
            'Sb':   0.06,
            'Irr':  0.03,
            'dE':   0.05,
            'dIrr': 0.01,
        },
        'agn_frac':      0.04,
        'rps_frac':      0.06,
        'merger_frac':   0.03,
        'starburst_frac': 0.02,
        'dual_bcg':      True,   # two co-BCGs instead of one cD
        'dust_obscured': False,
    },
    'virgo': {
        'display_name': 'Virgo Cluster',
        'center_ra': 186.75,
        'center_dec': 12.72,
        'dist_mpc': 16.5,
        'tx_kev': 2.5,
        'rvir_mpc': 1.1,
        'sigma_v_kms': 760,
        'M200_1e14': 8.0,
        'richness': 7,
        'default_count': 250,
        'notes': (
            'Nearest rich cluster; three sub-clusters A (M87), B (M49), C (NGC4261). '
            'Many HI-deficient, ram-pressure stripped spirals in the infalling zone. '
            'M87 jet drives ICM heating via AGN feedback. '
            '2096 confirmed VCC members (Binggeli+1985).'
        ),
        'fracs': {
            'E':    0.22,
            'S0':   0.28,
            'Sa':   0.16,
            'Sb':   0.14,
            'Irr':  0.09,
            'dE':   0.09,
            'dIrr': 0.02,
        },
        'agn_frac':      0.07,
        'rps_frac':      0.12,
        'merger_frac':   0.04,
        'starburst_frac': 0.05,
        'tri_bcg':       True,   # three sub-cluster BCGs
        'dust_obscured': False,
    },
    'fornax': {
        'display_name': 'Fornax Cluster',
        'abell': 'Abell S0373',
        'center_ra': 54.62,
        'center_dec': -35.45,
        'dist_mpc': 19.0,
        'tx_kev': 1.5,
        'rvir_mpc': 0.7,
        'sigma_v_kms': 374,
        'M200_1e14': 3.5,
        'richness': 6,
        'default_count': 180,
        'notes': (
            'Compact nearby cluster (Ferguson 1989); NGC1399 BCG. '
            'Rich in dE and dSph galaxies (Fornax Cluster Catalog: 340 members to B~19). '
            'Many infalling dwarfs; S0-dominated core; '
            'NGC1316 (Fornax A): powerful radio galaxy from recent major merger.'
        ),
        'fracs': {
            'E':    0.28,
            'S0':   0.34,
            'Sa':   0.12,
            'Sb':   0.08,
            'Irr':  0.06,
            'dE':   0.10,
            'dIrr': 0.02,
        },
        'agn_frac':      0.05,
        'rps_frac':      0.06,
        'merger_frac':   0.05,
        'starburst_frac': 0.03,
        'dust_obscured': False,
    },
    'centaurus': {
        'display_name': 'Centaurus Cluster',
        'abell': 'Abell 3526',
        'center_ra': 192.2,
        'center_dec': -41.31,
        'dist_mpc': 47.0,
        'tx_kev': 3.7,
        'rvir_mpc': 1.0,
        'sigma_v_kms': 827,
        'M200_1e14': 9.0,
        'richness': 8,
        'default_count': 200,
        'notes': (
            'NGC4696 BCG with famous dust lanes and Hα filaments. '
            'Two sub-clusters: Cen 30 (main) and Cen 45 (background, Δv~4500 km/s). '
            'Strong cool core; spectacular ICM sloshing cold fronts (Markevitch+2001).'
        ),
        'fracs': {
            'E':    0.34,
            'S0':   0.32,
            'Sa':   0.13,
            'Sb':   0.09,
            'Irr':  0.05,
            'dE':   0.06,
            'dIrr': 0.01,
        },
        'agn_frac':      0.06,
        'rps_frac':      0.07,
        'merger_frac':   0.04,
        'starburst_frac': 0.03,
        'dust_obscured': False,
    },
    'ophiuchus': {
        'display_name': 'Ophiuchus Cluster',
        'center_ra': 258.11,
        'center_dec': -23.37,
        'dist_mpc': 120.0,
        'tx_kev': 9.0,
        'rvir_mpc': 1.5,
        'sigma_v_kms': 1050,
        'M200_1e14': 20.0,
        'richness': 10,
        'default_count': 280,
        'notes': (
            'One of the hottest nearby clusters (Werner+2016); heavily obscured by MW dust. '
            'MCG-2-34-4 BCG with massive cool core. '
            'Largest known AGN outburst cavity detected by Chandra (2020): '
            '~15 Mpc³ evacuated cavity heated by ~10⁵⁵ erg jet event.'
        ),
        'fracs': {
            'E':    0.42,
            'S0':   0.30,
            'Sa':   0.10,
            'Sb':   0.07,
            'Irr':  0.04,
            'dE':   0.06,
            'dIrr': 0.01,
        },
        'agn_frac':      0.07,
        'rps_frac':      0.05,
        'merger_frac':   0.03,
        'starburst_frac': 0.02,
        'dust_obscured': True,
    },
    'shapley': {
        'display_name': 'Shapley Supercluster Core',
        'abell': 'Abell 3558',
        'center_ra': 201.99,
        'center_dec': -31.49,
        'dist_mpc': 198.0,
        'tx_kev': 5.5,
        'rvir_mpc': 1.2,
        'sigma_v_kms': 1020,
        'M200_1e14': 11.0,
        'richness': 9,
        'default_count': 240,
        'notes': (
            'Core of the Shapley Supercluster — richest mass concentration within z<0.1 '
            '(Shapley 1930; Raychaudhury 1989). Abell 3558 + 3556 + 3554 chain in active merger. '
            'Strong diffuse radio emission; merger-induced AGN triggering and starburst activity.'
        ),
        'fracs': {
            'E':    0.36,
            'S0':   0.30,
            'Sa':   0.13,
            'Sb':   0.09,
            'Irr':  0.06,
            'dE':   0.05,
            'dIrr': 0.01,
        },
        'agn_frac':      0.06,
        'rps_frac':      0.09,
        'merger_frac':   0.08,
        'starburst_frac': 0.05,
        'dust_obscured': False,
    },
    'hydra-a': {
        'display_name': 'Hydra-A Cluster',
        'abell': 'Abell 780',
        'center_ra': 139.52,
        'center_dec': -12.10,
        'dist_mpc': 237.0,
        'tx_kev': 3.8,
        'rvir_mpc': 0.9,
        'sigma_v_kms': 680,
        'M200_1e14': 7.0,
        'richness': 7,
        'default_count': 160,
        'notes': (
            'Famous for Hydra-A radio source (McNamara+2000): '
            'BCG drives one of the most powerful AGN outbursts known, '
            'creating giant X-ray cavities. Cool core cluster with strong '
            'ICM feedback; ~100 kpc ICM uplift of cool gas.'
        ),
        'fracs': {
            'E':    0.32,
            'S0':   0.30,
            'Sa':   0.14,
            'Sb':   0.10,
            'Irr':  0.06,
            'dE':   0.07,
            'dIrr': 0.01,
        },
        'agn_frac':      0.09,
        'rps_frac':      0.06,
        'merger_frac':   0.04,
        'starburst_frac': 0.04,
        'dust_obscured': False,
    },
    'bullet': {
        'display_name': 'Bullet Cluster',
        'abell': '1E 0657-56',
        'center_ra': 104.62,
        'center_dec': -55.95,
        'dist_mpc': 1140.0,
        'tx_kev': 14.5,
        'rvir_mpc': 1.6,
        'sigma_v_kms': 1400,
        'M200_1e14': 25.0,
        'richness': 10,
        'default_count': 200,
        'notes': (
            'Direct evidence for dark matter (Clowe+2006): gravitational lensing offset from '
            'X-ray gas in high-speed merger (v~3500 km/s). One of the hottest known clusters. '
            'Powerful merger shocks; disturbed galaxy populations with high starburst + merger rates.'
        ),
        'fracs': {
            'E':    0.38,
            'S0':   0.28,
            'Sa':   0.12,
            'Sb':   0.10,
            'Irr':  0.07,
            'dE':   0.04,
            'dIrr': 0.01,
        },
        'agn_frac':      0.05,
        'rps_frac':      0.15,   # very high — extreme merger
        'merger_frac':   0.12,
        'starburst_frac': 0.08,
        'dust_obscured': False,
    },
}

# Generic fallback profiles by temperature band (for --all-xray mode)
GENERIC_PROFILES = [
    (7.5, {  # Coma-class
        'fracs': {'E': 0.37, 'S0': 0.37, 'Sa': 0.10, 'Sb': 0.06, 'Irr': 0.04, 'dE': 0.05, 'dIrr': 0.01},
        'agn_frac': 0.04, 'rps_frac': 0.05, 'merger_frac': 0.03, 'starburst_frac': 0.02,
    }),
    (5.0, {  # Perseus-class
        'fracs': {'E': 0.33, 'S0': 0.32, 'Sa': 0.13, 'Sb': 0.09, 'Irr': 0.06, 'dE': 0.06, 'dIrr': 0.01},
        'agn_frac': 0.06, 'rps_frac': 0.06, 'merger_frac': 0.04, 'starburst_frac': 0.03,
    }),
    (3.0, {  # Virgo-class
        'fracs': {'E': 0.26, 'S0': 0.30, 'Sa': 0.16, 'Sb': 0.12, 'Irr': 0.08, 'dE': 0.07, 'dIrr': 0.01},
        'agn_frac': 0.07, 'rps_frac': 0.09, 'merger_frac': 0.05, 'starburst_frac': 0.04,
    }),
    (1.5, {  # Group-like
        'fracs': {'E': 0.22, 'S0': 0.26, 'Sa': 0.20, 'Sb': 0.14, 'Irr': 0.09, 'dE': 0.08, 'dIrr': 0.01},
        'agn_frac': 0.06, 'rps_frac': 0.05, 'merger_frac': 0.04, 'starburst_frac': 0.03,
    }),
    (0.0, {  # Compact group
        'fracs': {'E': 0.18, 'S0': 0.22, 'Sa': 0.22, 'Sb': 0.17, 'Irr': 0.11, 'dE': 0.08, 'dIrr': 0.02},
        'agn_frac': 0.05, 'rps_frac': 0.03, 'merger_frac': 0.03, 'starburst_frac': 0.02,
    }),
]

# Star system count range per galaxy type (for navigation depth)
# These are order-of-magnitude nav stubs, not physical counts
STAR_SYSTEM_RANGE: dict[str, tuple[int, int]] = {
    'cD':   (80, 200),
    'E':    (40, 120),
    'S0':   (20, 80),
    'Sa':   (30, 100),
    'Sb':   (40, 120),
    'Irr':  (10, 50),
    'dE':   (2, 12),
    'dIrr': (1, 8),
}

DWARF_TYPES = {'dE', 'dIrr'}


# ── Seeded PRNG ─────────────────────────────────────────────────────────────────

class Mulberry32:
    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def __call__(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((self.state ^ (self.state >> 15)) * (1 | self.state)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t))) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return t / 4_294_967_296

    def randint(self, lo: int, hi: int) -> int:
        return lo + int(self() * (hi - lo + 1))

    def choice(self, seq: list) -> object:
        return seq[int(self() * len(seq))]


# ── Population builder ──────────────────────────────────────────────────────────

def build_type_sequence(fracs: dict[str, float], count: int, rng: Mulberry32) -> list[str]:
    """
    Build an ordered list of `count` galaxy types drawn from `fracs`.
    Exact counts are rounded deterministically; remainder fills with most
    common type to hit exactly `count`.
    """
    types: list[str] = []
    allocated = 0
    type_counts: dict[str, int] = {}

    for morph, frac in sorted(fracs.items(), key=lambda kv: -kv[1]):
        n = round(frac * count)
        type_counts[morph] = n
        allocated += n

    # Fix rounding drift
    diff = count - allocated
    if diff != 0:
        # Add/subtract from most common type
        dominant = max(type_counts, key=type_counts.get)
        type_counts[dominant] = max(0, type_counts[dominant] + diff)

    for morph, n in type_counts.items():
        types.extend([morph] * n)

    # Shuffle with our seeded RNG (Fisher-Yates)
    for i in range(len(types) - 1, 0, -1):
        j = int(rng() * (i + 1))
        types[i], types[j] = types[j], types[i]

    return types


# ── Schechter luminosity function ───────────────────────────────────────────────

M_STAR  = -22.2
M_FAINT = -14.5
ALPHA   = -1.1

MORPH_MAG_OFFSET = {'cD': -1.2, 'E': -0.2, 'S0': 0.0, 'Sa': 0.2, 'Sb': 0.3,
                    'Irr': 0.6, 'dE': 2.8, 'dIrr': 3.4}


def schechter_bt_mag(rng: Mulberry32, morph: str, dist_mpc: float,
                     dust_obscured: bool = False) -> float:
    if morph == 'cD':
        abs_mag = M_STAR - 0.8 - rng() * 0.4
    elif morph in DWARF_TYPES:
        abs_mag = -18.0 + rng() * 3.5   # dwarfs: -18 to -14.5
    else:
        for _ in range(40):
            u1 = max(1e-6, rng())
            u2 = rng()
            abs_mag = M_STAR - 2.5 * math.log10(-math.log(u1) * (u2 ** 0.45))
            if abs_mag > M_FAINT:
                break
        else:
            abs_mag = M_FAINT + rng() * 2

    abs_mag += MORPH_MAG_OFFSET.get(morph, 0.0)

    if dist_mpc > 0:
        dist_mod = 5 * math.log10(dist_mpc * 1e6 / 10)
        apparent = abs_mag + dist_mod
    else:
        apparent = abs_mag + 30

    scatter = 0.8 if dust_obscured else 0.5
    apparent += (rng() - 0.5) * scatter
    return round(apparent, 1)


# ── King profile radius ─────────────────────────────────────────────────────────

def king_r_frac(rng: Mulberry32) -> float:
    u = rng()
    r = math.sqrt(u) * (0.20 + rng() * 0.80)
    return min(1.0, r)


# ── 3D offset from cluster centre ──────────────────────────────────────────────

def make_offset(rng: Mulberry32, r_frac: float, rvir_mpc: float) -> list[float]:
    r_mpc = r_frac * rvir_mpc
    theta = rng() * math.tau
    phi   = math.acos(2 * rng() - 1) * (1 - r_frac * 0.4)

    x = r_mpc * math.sin(phi) * math.cos(theta)
    y = r_mpc * math.sin(phi) * math.sin(theta) * 0.60
    z = r_mpc * math.cos(phi)

    SU = MPC_SCALE / 7.0   # scene-units; renderer multiplies by VSPREAD=7
    return [round(x * SU, 6), round(y * SU, 6), round(z * SU, 6)]


# ── LOD3 renderer parameters ────────────────────────────────────────────────────

def make_lod3_params(rng: Mulberry32, morph: str, rvir_mpc: float) -> dict:
    if morph in DWARF_TYPES:
        scene_su = round(max(0.002, min(0.006, rvir_mpc * MPC_SCALE * 0.008)), 5)
    else:
        scene_su = rvir_mpc * MPC_SCALE * (0.02 + rng() * 0.025)
        scene_su = round(max(0.006, min(0.04, scene_su)), 5)

    if morph in ('E', 'cD', 'S0', 'dE'):
        return {'scene_su': scene_su, 'axis_ratio': round(0.40 + rng() * 0.55, 3),
                'pitch_deg': 0, 'n_arms': 0, 'pa_deg': round(rng() * 180, 1)}

    n_arms = 0 if morph == 'Irr' else 2
    return {'scene_su': scene_su, 'axis_ratio': round(0.30 + rng() * 0.65, 3),
            'pitch_deg': 8 if morph in ('Sa', 'Sb') else 0,
            'n_arms': n_arms, 'pa_deg': round(rng() * 180, 1)}


# ── Tag assignment ──────────────────────────────────────────────────────────────

def assign_tags(rng: Mulberry32, morph: str, r_frac: float,
                profile: dict, is_bcg: bool = False) -> list[str]:
    tags: list[str] = []
    if is_bcg:
        tags.append('bcg')
        if rng() < 0.7:
            tags.append('agn')   # BCGs are almost always AGN hosts
        return tags

    if morph in DWARF_TYPES:
        tags.append('dwarf')
        return tags

    if rng() < profile.get('agn_frac', 0):
        tags.append('agn')
    if rng() < profile.get('rps_frac', 0) * (1.2 - r_frac):   # more RPS near centre
        tags.append('ram_pressure_stripped')
    if rng() < profile.get('merger_frac', 0):
        tags.append('merger')
    if rng() < profile.get('starburst_frac', 0):
        tags.append('starburst')

    return tags


# ── Star system stub count ──────────────────────────────────────────────────────

def nav_star_system_count(rng: Mulberry32, morph: str) -> int:
    lo, hi = STAR_SYSTEM_RANGE.get(morph, (5, 30))
    return lo + int(rng() * (hi - lo + 1))


# ── Slug ────────────────────────────────────────────────────────────────────────

def cluster_slug(name: str) -> str:
    s = name.lower()
    s = re.sub(r'\s+(cluster|supercluster|concentration|core)\b', '', s, flags=re.IGNORECASE)
    s = s.strip()
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'[^a-z0-9-]', '', s)
    return s


# ── Main generator ──────────────────────────────────────────────────────────────

def generate_members(profile: dict, slug: str, count_override: Optional[int] = None) -> dict:
    name     = profile['display_name']
    ra       = profile['center_ra']
    dec      = profile['center_dec']
    dist_mpc = profile['dist_mpc']
    tx_kev   = profile['tx_kev']
    rvir     = profile['rvir_mpc']
    richness = profile.get('richness', round(min(10, max(1, tx_kev * 1.3))))
    count    = count_override or profile.get('default_count', 150)
    fracs    = profile['fracs']
    dusty    = profile.get('dust_obscured', False)
    dual_bcg = profile.get('dual_bcg', False)

    seed = sum(ord(c) * (i + 1) for i, c in enumerate(name)) & 0xFFFFFFFF
    rng  = Mulberry32(seed)

    # Sub-cluster offset direction (used probabilistically for sub-structure)
    sub_angle = rng() * math.tau
    sub_frac  = 0.30
    sub_x_dir = math.cos(sub_angle)
    sub_z_dir = math.sin(sub_angle)

    # Determine non-BCG count then build type sequence
    bcg_count = 2 if dual_bcg else 1
    giant_count = count - bcg_count
    types = build_type_sequence(fracs, giant_count, rng)

    members: list[dict] = []

    # BCG(s) first
    for bi in range(bcg_count):
        morph  = 'cD' if not dual_bcg else 'E'   # co-BCGs are giant Es
        r_frac = 0.02 + bi * 0.04
        offset = make_offset(rng, r_frac, rvir)
        if bi == 1:   # second co-BCG offset toward sub-cluster dir
            SU = MPC_SCALE / 7.0
            offset[0] += round(sub_x_dir * sub_frac * rvir * SU, 6)
            offset[2] += round(sub_z_dir * sub_frac * rvir * SU, 6)

        lod3  = make_lod3_params(rng, morph, rvir)
        lod3['scene_su'] = max(lod3['scene_su'], 0.015)   # BCG always large
        tags  = assign_tags(rng, morph, r_frac, profile, is_bcg=True)

        member: dict = {
            'id':      f'bcg-{bi:02d}' if dual_bcg else 'bcg-00',
            'ra':      round(ra + (rng() - 0.5) * 0.02, 5),
            'dec':     round(dec + (rng() - 0.5) * 0.02, 5),
            'hubble':  morph,
            'bt_mag':  schechter_bt_mag(rng, morph, dist_mpc, dusty),
            'offset':  offset,
            'lod3_params': lod3,
            'tags':    tags,
            'star_system_count': nav_star_system_count(rng, morph),
        }
        members.append(member)

    # Galaxy population
    for i, morph in enumerate(types):
        r_frac = 0.02 if morph == 'cD' else king_r_frac(rng)
        offset = make_offset(rng, r_frac, rvir)

        # Add sub-cluster scatter to ~25% of outer members
        if richness >= 8 and r_frac > 0.4 and rng() < 0.25:
            SU = MPC_SCALE / 7.0
            offset[0] += round(sub_x_dir * sub_frac * rvir * SU * 0.5, 6)
            offset[2] += round(sub_z_dir * sub_frac * rvir * SU * 0.5, 6)

        lod3  = make_lod3_params(rng, morph, rvir)
        bt    = schechter_bt_mag(rng, morph, dist_mpc, dusty)
        tags  = assign_tags(rng, morph, r_frac, profile)

        member = {
            'id':      f'proc-{i:04d}',
            'ra':      round(ra + (rng() - 0.5) * rvir / 57.3, 5),
            'dec':     round(dec + (rng() - 0.5) * rvir / 57.3, 5),
            'hubble':  morph,
            'bt_mag':  bt,
            'offset':  offset,
            'lod3_params': lod3,
            'tags':    tags,
            'star_system_count': nav_star_system_count(rng, morph),
        }
        if morph in DWARF_TYPES:
            member['nav_stub'] = True

        members.append(member)

    return {
        'cluster':      name,
        'slug':         slug,
        'center_ra':    ra,
        'center_dec':   dec,
        'dist_mpc':     dist_mpc,
        'rvir_mpc':     round(rvir, 2),
        'richness':     richness,
        'sigma_v_kms':  profile.get('sigma_v_kms', 0),
        'tx_kev':       tx_kev,
        'M200_1e14':    profile.get('M200_1e14', 0.0),
        'notes':        profile.get('notes', ''),
        'population_profile': {
            'source': 'generate_cluster_populations.py',
            'fracs':  fracs,
        },
        'member_count': len(members),
        'members':      members,
    }


def profile_from_xray(cluster: dict) -> dict:
    """Build a generic profile dict from an xray catalog entry."""
    tap = cluster['tap_kev']
    for thresh, base in GENERIC_PROFILES:
        if tap >= thresh:
            generic = dict(base)
            break
    else:
        generic = dict(GENERIC_PROFILES[-1][1])

    base_count, rvir_mpc = ((250, 1.20) if tap >= 8.0 else
                             (180, 1.00) if tap >= 5.0 else
                             (120, 0.80) if tap >= 3.0 else
                             (80,  0.60) if tap >= 1.5 else
                             (50,  0.45))

    return {
        'display_name': cluster['name'],
        'center_ra':    cluster['ra_deg'],
        'center_dec':   cluster['dec_deg'],
        'dist_mpc':     cluster['dist_mpc'],
        'tx_kev':       tap,
        'rvir_mpc':     rvir_mpc,
        'richness':     min(10, max(1, round(tap * 1.35))),
        'default_count': base_count,
        'dust_obscured': False,
        **generic,
    }


# ── Reporting ───────────────────────────────────────────────────────────────────

def get_existing_slugs() -> set[str]:
    return {p.stem.replace('-members', '') for p in OUTPUT_DIR.glob('*-members.json')}


def show_fractions(slug: str, profile: dict) -> None:
    fracs = profile['fracs']
    count = profile.get('default_count', 150)
    bcg_count = 2 if profile.get('dual_bcg') else 1
    giant_count = count - bcg_count

    print(f"\n  {profile['display_name']} — population fractions (n={count})")
    print(f"  {'─'*52}")
    print(f"  {'Type':<10} {'Fraction':>9}  {'~Count':>7}  Notes")
    print(f"  {'─'*52}")

    cD_label = 'cD (co-BCG ×2)' if profile.get('dual_bcg') else 'cD (BCG)'
    print(f"  {'cD':<10} {'—':>9}  {bcg_count:>7}  {cD_label}")

    for morph, frac in sorted(fracs.items(), key=lambda kv: -kv[1]):
        n = round(frac * giant_count)
        note = '(dwarf, nav_stub)' if morph in DWARF_TYPES else ''
        print(f"  {morph:<10} {frac:>9.1%}  {n:>7}  {note}")

    total_frac = sum(fracs.values())
    print(f"  {'─'*52}")
    print(f"  {'Total':<10} {total_frac:>9.1%}  {count:>7}")
    print(f"\n  Special tags (fraction of giants):")
    for key in ('agn_frac', 'rps_frac', 'merger_frac', 'starburst_frac'):
        val = profile.get(key, 0)
        label = key.replace('_frac', '').replace('rps', 'ram_pressure_stripped')
        print(f"    {label:<26} {val:.0%}")
    print()


def inventory() -> None:
    existing = get_existing_slugs()
    print(f"\n{'─'*64}")
    print(f"  Named profiles available: {len(CLUSTER_PROFILES)}")
    print(f"  Existing member files:    {len(existing)}")
    print(f"{'─'*64}")
    print(f"  {'Slug':<22} {'Type':<10} {'kT':>6}  {'Count':>6}  Status")
    print(f"  {'─'*62}")

    for slug, profile in CLUSTER_PROFILES.items():
        status = 'exists' if slug in existing else 'MISSING'
        count  = profile.get('default_count', '—')
        tx     = profile.get('tx_kev', 0)
        print(f"  {slug:<22} {'named':<10} {tx:>5.1f}  {count:>6}  {status}")

    if XRAY_PATH.exists():
        with open(XRAY_PATH) as f:
            xray = json.load(f)
        missing_xray = sum(1 for c in xray if cluster_slug(c['name']) not in existing)
        print(f"\n  XMM Takey2013 xray catalog: {len(xray)} clusters, "
              f"{missing_xray} without member files")
        print(f"  Use --all-xray to generate generic profiles for all {missing_xray} missing.")

    print(f"{'─'*64}\n")


# ── Write ───────────────────────────────────────────────────────────────────────

def write_catalog(catalog: dict, dry_run: bool = False) -> None:
    path = OUTPUT_DIR / f"{catalog['slug']}-members.json"
    if dry_run:
        counts = {}
        for m in catalog['members']:
            counts[m['hubble']] = counts.get(m['hubble'], 0) + 1
        dist_str = ', '.join(f"{t}:{n}" for t, n in sorted(counts.items()))
        print(f"  [dry-run] {path.name}  ({catalog['member_count']} members: {dist_str})")
        return
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        json.dump(catalog, f, separators=(',', ':'))
    counts = {}
    for m in catalog['members']:
        counts[m['hubble']] = counts.get(m['hubble'], 0) + 1
    dist_str = ', '.join(f"{t}:{n}" for t, n in sorted(counts.items()))
    print(f"  ✓ {path.name}  ({catalog['member_count']} members: {dist_str})")


# ── CLI ──────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description='Generate navigable galaxy-member catalogs with population profiles')
    parser.add_argument('--list-profiles',  action='store_true',
                        help='List all named cluster profiles and their morphology fracs')
    parser.add_argument('--inventory',      action='store_true',
                        help='Show which clusters have / are missing member files')
    parser.add_argument('--show-fractions', action='store_true',
                        help='Print expected type fractions for the chosen cluster')
    parser.add_argument('--cluster',        metavar='SLUG',
                        help='Generate (or preview) one named cluster by slug')
    parser.add_argument('--all-named',      action='store_true',
                        help='Generate all named-profile clusters')
    parser.add_argument('--all-xray',       action='store_true',
                        help='Generate generic-profile catalogs for all xray clusters')
    parser.add_argument('--count',          type=int, default=None, metavar='N',
                        help='Override member count (default: per-profile)')
    parser.add_argument('--dry-run',        action='store_true',
                        help='Print what would be written without writing files')
    parser.add_argument('--overwrite',      action='store_true',
                        help='Overwrite existing member files (default: skip)')
    args = parser.parse_args()

    if args.list_profiles:
        for slug, profile in CLUSTER_PROFILES.items():
            show_fractions(slug, profile)
        return

    if args.inventory or not any([args.cluster, args.all_named, args.all_xray]):
        inventory()
        if not any([args.cluster, args.all_named, args.all_xray]):
            return

    existing = get_existing_slugs()

    if args.cluster:
        slug = args.cluster.lower().strip()
        if slug not in CLUSTER_PROFILES:
            # Try partial match
            matches = [k for k in CLUSTER_PROFILES if slug in k]
            if len(matches) == 1:
                slug = matches[0]
            elif len(matches) > 1:
                print(f"Ambiguous slug '{slug}' matches: {matches}", file=sys.stderr)
                sys.exit(1)
            else:
                print(f"Unknown cluster slug '{slug}'. Use --list-profiles.", file=sys.stderr)
                sys.exit(1)

        profile = CLUSTER_PROFILES[slug]

        if args.show_fractions:
            show_fractions(slug, profile)

        if slug in existing and not args.overwrite and not args.dry_run:
            print(f"  Skipping {slug} — already exists (use --overwrite)")
            return

        catalog = generate_members(profile, slug, args.count)
        write_catalog(catalog, dry_run=args.dry_run)
        return

    if args.all_named:
        targets = [(slug, p) for slug, p in CLUSTER_PROFILES.items()
                   if args.overwrite or slug not in existing]
        print(f"\nGenerating {len(targets)} named-profile catalogs…\n")
        for slug, profile in targets:
            catalog = generate_members(profile, slug, args.count)
            write_catalog(catalog, dry_run=args.dry_run)
        print(f"\nDone.")
        return

    if args.all_xray:
        if not XRAY_PATH.exists():
            print(f"ERROR: {XRAY_PATH} not found", file=sys.stderr)
            sys.exit(1)
        with open(XRAY_PATH) as f:
            xray_clusters = json.load(f)
        targets = [c for c in xray_clusters
                   if args.overwrite or cluster_slug(c['name']) not in existing]
        print(f"\nGenerating {len(targets)} xray cluster catalogs…\n")
        for i, c in enumerate(targets, 1):
            slug    = cluster_slug(c['name'])
            profile = profile_from_xray(c)
            catalog = generate_members(profile, slug, args.count)
            write_catalog(catalog, dry_run=args.dry_run)
            if i % 50 == 0:
                print(f"  … {i}/{len(targets)} done")
        print(f"\nDone. {len(targets)} catalogs {'previewed' if args.dry_run else 'written'}.")


if __name__ == '__main__':
    main()
