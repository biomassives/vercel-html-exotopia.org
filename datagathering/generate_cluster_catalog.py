#!/usr/bin/env python3
"""
generate_cluster_catalog.py

Comprehensive generator for named galaxy cluster member catalogs.

Each cluster is defined by a CLUSTER_PROFILES entry containing:
  - Literature parameters (σ_v, T_x, M200, r_vir, member count)
  - Per-zone morphology weight tables (BCG core / inner / mid / outer)
  - Sub-cluster definitions for bimodal/merging clusters
  - Special feature flags (cooling_flow, ram_pressure, obscured, agn_bcg)

Named anchor galaxies are read from the existing *-members.json files
(is_named=True entries) and prepended before the procedural members.
Procedural members are generated using:
  - King profile for radial distribution (zone-aware sub-cluster mixing)
  - Zone-based morphology tables (Dressler-relation per subregion)
  - Schechter LF for B-band apparent magnitudes
  - Mulberry32 seeded RNG (deterministic per cluster name)

Catalog sources:
  Virgo:      VCC (Binggeli+1985), ~2000 confirmed members
  Fornax:     FCC (Ferguson+1989), ~340 members
  Centaurus:  Abell 3526 NED + XMM (Sanders+2016), ~300 members
  Hydra:      Abell 1060 (Christlein+2003), ~200 members
  Perseus:    Abell 426 (Brunzendorf+1999), ~500 members
  Coma:       Abell 1656 (Godwin+1983), ~1000 bright
  Norma:      Abell 3627 (Woudt+2004), ~700 members (many obscured)
  Shapley:    SCl28 multi-cluster (Quintana+2000), ~1000+
  Eridanus:   Willmer+1989, ~200 members
  Andromeda:  Local Group (Karachentsev+2004), ~80 members

Usage:
    python generate_cluster_catalog.py                     # generate all (skip existing)
    python generate_cluster_catalog.py --cluster virgo     # one cluster
    python generate_cluster_catalog.py --list              # list profiles
    python generate_cluster_catalog.py --inventory         # show file status
    python generate_cluster_catalog.py --dry-run           # preview without writing
    python generate_cluster_catalog.py --overwrite         # force regenerate

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
MPC_SCALE  = 1 / 15    # 1 Mpc → 0.0667 scene units (matches cosmic-structures.ts)
VSPREAD    = 7.0        # renderer multiplies catalog offsets by this

# ── Seeded RNG ─────────────────────────────────────────────────────────────────

class Mulberry32:
    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def __call__(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((self.state ^ (self.state >> 15)) * (1 | self.state)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t))) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return t / 4_294_967_296

    def seed_for(self, tag: str) -> 'Mulberry32':
        """Derive a fresh sub-RNG from a string tag (for reproducible sub-sequences)."""
        s = sum(ord(c) * (i + 1) for i, c in enumerate(tag)) & 0xFFFFFFFF
        return Mulberry32(s ^ self.state)


# ── Cluster profile data ───────────────────────────────────────────────────────
#
# zones: list of (r_frac_min, r_frac_max, morph_weights)
#   morph_weights keys: 'E', 'S0', 'Sa', 'Sb', 'Irr'   — must sum to 1.0
#   The generator also adds 'cD' for i==0 (BCG) regardless of zone.
#
# subclusters: secondary density peaks within the cluster
#   offset_rvir: [x,y,z] offset as fraction of rvir_mpc, in scene-unit space
#   fraction:    what fraction of procedural members populate this sub-peak
#
# special flags:
#   cooling_flow  → BCG core zone thickened; extra-concentrated radial CDF
#   ram_pressure  → some spirals get an elongated y-axis offset (infall tail)
#   obscured      → MW extinction bias: shifts morphology mix toward E/S0 in outer zones
#   agn_bcg       → BCG lod3 scene_su enlarged by 40%
#   bimodal       → two co-equal BCG cores (used with subclusters)

CLUSTER_PROFILES: dict = {

  # ──────────────────────────────────────────────────────────────────────────
  'andromeda-group': {
    'name':       'Andromeda Group',
    'ra_deg':     10.68,
    'dec_deg':    41.27,
    'dist_mpc':   0.77,
    'richness':   2,
    # Literature: Local Group, Karachentsev+2004; σ_v ~ 61 km/s
    'sigma_v_kms': 61,
    'tx_kev':      0.0,
    'M200_1e14':   0.02,
    'rvir_mpc':    0.50,
    'count':       80,    # ~80 confirmed LG members; render ~60 procedural
    'subclusters': [],
    'special': {
      'cooling_flow': False,
      'ram_pressure': False,
      'obscured':     False,
      'agn_bcg':      False,
      'bimodal':      False,
    },
    # Spiral-rich poor group — Local Group equivalent
    # BCG zone: M31 (Sb) acts as group dominant
    # Outer: dwarfs, Irr common (SMC/LMC analogues)
    'zones': [
      (0.00, 0.08, {'E': 0.25, 'S0': 0.15, 'Sa': 0.25, 'Sb': 0.30, 'Irr': 0.05}),
      (0.08, 0.30, {'E': 0.18, 'S0': 0.10, 'Sa': 0.28, 'Sb': 0.30, 'Irr': 0.14}),
      (0.30, 0.65, {'E': 0.10, 'S0': 0.08, 'Sa': 0.25, 'Sb': 0.35, 'Irr': 0.22}),
      (0.65, 1.00, {'E': 0.05, 'S0': 0.04, 'Sa': 0.18, 'Sb': 0.35, 'Irr': 0.38}),
    ],
    'notes': ('Local Group — Andromeda Group; ~80 confirmed members (Karachentsev+2004). '
              'Spiral-rich; outer zone dominated by Irr dwarfs (SMC/LMC analogues).'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'virgo': {
    'name':       'Virgo Cluster',
    'ra_deg':     186.75,
    'dec_deg':    12.72,
    'dist_mpc':   16.5,
    'richness':   7,
    # Binggeli+1985 VCC: 2096 members in 7.5°×7.5° survey
    # Three subclusters: A (M87), B (M49/NGC4472), C (NGC4261)
    'sigma_v_kms': 760,
    'tx_kev':      2.5,
    'M200_1e14':   8.0,
    'rvir_mpc':    1.10,
    'count':       250,    # render ~230; VCC lists 2096 total
    'subclusters': [
      # B-subcluster: NGC4472 (M49) dominant, offset south-west
      {'name': 'B subcluster (M49)', 'offset_rvir': [0.22, -0.09, 0.16], 'fraction': 0.20},
      # C-subcluster: NGC4261 dominant, offset north-west
      {'name': 'C subcluster (NGC4261)', 'offset_rvir': [-0.30, 0.12, -0.20], 'fraction': 0.12},
    ],
    'special': {
      'cooling_flow': False,   # Virgo A (M87) has some but not classical CF
      'ram_pressure': True,    # many infalling spirals are HI-stripped
      'obscured':     False,
      'agn_bcg':      True,    # M87 — 6.5 billion M☉ BH; prominent jet
      'bimodal':      False,
    },
    # Moderate-T cluster: E-rich core, spirals increase toward outskirts
    # Outer zone notable for infalling, partially stripped spirals
    'zones': [
      (0.00, 0.06, {'E': 0.72, 'S0': 0.22, 'Sa': 0.05, 'Sb': 0.01, 'Irr': 0.00}),
      (0.06, 0.28, {'E': 0.55, 'S0': 0.30, 'Sa': 0.12, 'Sb': 0.02, 'Irr': 0.01}),
      (0.28, 0.60, {'E': 0.36, 'S0': 0.32, 'Sa': 0.22, 'Sb': 0.07, 'Irr': 0.03}),
      (0.60, 1.00, {'E': 0.22, 'S0': 0.25, 'Sa': 0.30, 'Sb': 0.16, 'Irr': 0.07}),
    ],
    'notes': ('Abell 1689 / VCC (Binggeli+1985); 2096 confirmed members. '
              'Three subclusters: A (M87), B (M49), C (NGC4261). '
              'Many infalling HI-stripped spirals in outer zone (ram-pressure). '
              'M87 jet drives AGN heating of ICM.'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'fornax': {
    'name':       'Fornax Cluster',
    'ra_deg':     54.62,
    'dec_deg':    -35.45,
    'dist_mpc':   19.0,
    'richness':   5,
    # FCC (Ferguson+1989): 340 members; very compact, regular cluster
    'sigma_v_kms': 370,
    'tx_kev':      1.5,
    'M200_1e14':   0.70,
    'rvir_mpc':    0.70,
    'count':       110,    # render ~105; FCC lists ~340
    'subclusters': [],
    'special': {
      'cooling_flow': False,
      'ram_pressure': False,
      'obscured':     False,
      'agn_bcg':      False,
      'bimodal':      False,
    },
    # Cool-T, compact regular cluster: fairly E-dominated at all radii
    # NGC1316 (Fornax A) is a merger remnant — generates more Sa-Irr in outer zone
    'zones': [
      (0.00, 0.06, {'E': 0.68, 'S0': 0.24, 'Sa': 0.06, 'Sb': 0.02, 'Irr': 0.00}),
      (0.06, 0.30, {'E': 0.52, 'S0': 0.30, 'Sa': 0.14, 'Sb': 0.03, 'Irr': 0.01}),
      (0.30, 0.65, {'E': 0.35, 'S0': 0.33, 'Sa': 0.22, 'Sb': 0.07, 'Irr': 0.03}),
      (0.65, 1.00, {'E': 0.20, 'S0': 0.28, 'Sa': 0.28, 'Sb': 0.14, 'Irr': 0.10}),
    ],
    'notes': ('FCC (Ferguson+1989); 340 confirmed members. '
              'Very compact, near-spherical cluster. NGC1399 BCG (cD). '
              'NGC1316 (Fornax A): merger remnant — E+Irr mix in outer zone. '
              'NGC1365: rare infalling Seyfert barred spiral.'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'eridanus-supergroup': {
    'name':       'Eridanus Supergroup',
    'ra_deg':     51.0,
    'dec_deg':    -23.0,
    'dist_mpc':   23.0,
    'richness':   4,
    # Willmer+1989; three sub-groups (NGC1407, NGC1332, Eridanus proper)
    'sigma_v_kms': 250,
    'tx_kev':      0.8,
    'M200_1e14':   0.30,
    'rvir_mpc':    0.80,
    'count':       110,
    'subclusters': [
      {'name': 'NGC1332 sub-group', 'offset_rvir': [-0.28, -0.08, 0.22], 'fraction': 0.18},
      {'name': 'Eridanus sub-group', 'offset_rvir': [0.20, 0.12, -0.18], 'fraction': 0.15},
    ],
    'special': {
      'cooling_flow': False,
      'ram_pressure': False,
      'obscured':     False,
      'agn_bcg':      False,
      'bimodal':      False,
    },
    # Moderate group — between Local Group and rich cluster
    # S0/Sa dominate inner; Sb/Irr in outer (loose group)
    'zones': [
      (0.00, 0.07, {'E': 0.48, 'S0': 0.28, 'Sa': 0.14, 'Sb': 0.08, 'Irr': 0.02}),
      (0.07, 0.30, {'E': 0.32, 'S0': 0.28, 'Sa': 0.22, 'Sb': 0.12, 'Irr': 0.06}),
      (0.30, 0.65, {'E': 0.20, 'S0': 0.22, 'Sa': 0.28, 'Sb': 0.22, 'Irr': 0.08}),
      (0.65, 1.00, {'E': 0.10, 'S0': 0.14, 'Sa': 0.28, 'Sb': 0.30, 'Irr': 0.18}),
    ],
    'notes': ('Willmer+1989; three sub-groups centred on NGC1407, NGC1332, and '
              'Eridanus proper. Poor group / supergroup — significantly lower σ_v '
              'than rich clusters. Late-type galaxies dominate outer regions.'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'centaurus': {
    'name':       'Centaurus Cluster',
    'ra_deg':     192.2,
    'dec_deg':    -41.3,
    'dist_mpc':   46.0,
    'richness':   6,
    # Two sub-clusters: Cen30 (main, NGC4696 BCG) + Cen45 (+4500 km/s)
    # Sanders+2016 XMM; σ_v = 830 km/s for full cluster
    'sigma_v_kms': 830,
    'tx_kev':      3.7,
    'M200_1e14':   4.0,
    'rvir_mpc':    0.90,
    'count':       190,    # ~300 known members
    'subclusters': [
      # Cen45: infalling foreground group at +4500 km/s velocity offset
      {'name': 'Cen45 (NGC4709 group)', 'offset_rvir': [-0.24, 0.06, 0.20], 'fraction': 0.22},
    ],
    'special': {
      'cooling_flow': True,   # Most luminous cooling flow in any cluster
      'ram_pressure': False,
      'obscured':     False,
      'agn_bcg':      True,   # NGC4696 — X-ray cavities, jet activity
      'bimodal':      False,
    },
    # Cooling flow → extra-concentrated inner zone (E/S0 very dense within core)
    # Hot-boost moderate: T_x = 3.7 keV
    'zones': [
      (0.00, 0.05, {'E': 0.82, 'S0': 0.15, 'Sa': 0.03, 'Sb': 0.00, 'Irr': 0.00}),
      (0.05, 0.25, {'E': 0.65, 'S0': 0.28, 'Sa': 0.06, 'Sb': 0.01, 'Irr': 0.00}),
      (0.25, 0.60, {'E': 0.42, 'S0': 0.34, 'Sa': 0.18, 'Sb': 0.05, 'Irr': 0.01}),
      (0.60, 1.00, {'E': 0.24, 'S0': 0.32, 'Sa': 0.28, 'Sb': 0.12, 'Irr': 0.04}),
    ],
    'notes': ('Abell 3526 (Sanders+2016); ~300 members. '
              'Two sub-clusters: Cen30 main (NGC4696 BCG) and Cen45 infalling group (+4500 km/s). '
              'Most luminous classical cooling flow in any cluster; X-ray cavities around NGC4696. '
              'Cooling flow: inner zone extremely E-dominated.'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'hydra': {
    'name':       'Hydra Cluster',
    'ra_deg':     159.18,
    'dec_deg':    -27.53,
    'dist_mpc':   59.0,
    'richness':   5,
    # Abell 1060; Christlein+2003; twin BCGs NGC3309 + NGC3311
    'sigma_v_kms': 680,
    'tx_kev':      3.3,
    'M200_1e14':   3.0,
    'rvir_mpc':    0.90,
    'count':       160,    # ~200 known members
    'subclusters': [],
    'special': {
      'cooling_flow': False,
      'ram_pressure': False,
      'obscured':     False,
      'agn_bcg':      False,
      'bimodal':      True,  # twin co-BCGs NGC3309 + NGC3311 (no dominant single BCG)
    },
    # Moderate-T regular cluster; bimodal core (twin BCG) → two dense centers
    'zones': [
      (0.00, 0.06, {'E': 0.70, 'S0': 0.22, 'Sa': 0.06, 'Sb': 0.02, 'Irr': 0.00}),
      (0.06, 0.28, {'E': 0.52, 'S0': 0.30, 'Sa': 0.14, 'Sb': 0.03, 'Irr': 0.01}),
      (0.28, 0.62, {'E': 0.35, 'S0': 0.32, 'Sa': 0.22, 'Sb': 0.08, 'Irr': 0.03}),
      (0.62, 1.00, {'E': 0.20, 'S0': 0.28, 'Sa': 0.30, 'Sb': 0.15, 'Irr': 0.07}),
    ],
    'notes': ('Abell 1060 (Christlein+2003); ~200 members. '
              'Regular moderate-mass cluster; twin co-BCGs NGC3309+NGC3311. '
              'Bimodal flag drives two equal-weight central density peaks. '
              'Significant intracluster diffuse light (IFL) observed.'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'norma': {
    'name':       'Norma Cluster',
    'ra_deg':     243.3,
    'dec_deg':    -60.9,
    'dist_mpc':   65.0,
    'richness':   9,
    # Abell 3627 — Great Attractor dominant cluster; Woudt+2004
    # Highly obscured: A_V > 1.5–3 mag in survey region
    'sigma_v_kms': 900,
    'tx_kev':      6.7,
    'M200_1e14':   12.0,
    'rvir_mpc':    1.20,
    'count':       200,    # ~700 known; many missed due to MW extinction
    'subclusters': [
      # Western sub-cluster: 2nd density peak ~20% of rvir offset W
      {'name': 'Western sub-clump', 'offset_rvir': [-0.22, -0.06, 0.16], 'fraction': 0.18},
    ],
    'special': {
      'cooling_flow': False,
      'ram_pressure': True,  # ESO137-001 — spectacular X-ray/Hα stripping tail
      'obscured':     True,  # MW extinction A_V > 1.5 mag — biases catalog toward E/S0
      'agn_bcg':      True,  # ESO137-006 (BCG) — radio+X-ray AGN
      'bimodal':      False,
    },
    # Hot massive cluster: E-dominated at all radii
    # Obscured: outer zone S0 enhanced (spirals catalogued less frequently)
    # Ram-pressure: some spirals show elongated y-offset (infall tail signature)
    'zones': [
      (0.00, 0.05, {'E': 0.80, 'S0': 0.16, 'Sa': 0.04, 'Sb': 0.00, 'Irr': 0.00}),
      (0.05, 0.25, {'E': 0.68, 'S0': 0.24, 'Sa': 0.07, 'Sb': 0.01, 'Irr': 0.00}),
      (0.25, 0.58, {'E': 0.50, 'S0': 0.32, 'Sa': 0.13, 'Sb': 0.04, 'Irr': 0.01}),
      (0.58, 1.00, {'E': 0.35, 'S0': 0.38, 'Sa': 0.18, 'Sb': 0.07, 'Irr': 0.02}),
    ],
    'notes': ('Abell 3627 / Great Attractor core (Woudt+2004); ~700 members. '
              'Heavily obscured by MW dust (A_V > 1.5 mag) → biases catalog toward '
              'E/S0 (spirals under-represented). ESO137-001: spectacular ram-pressure '
              'stripped tail (X-ray + Hα). ESO137-006: BCG with radio+X-ray AGN.'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'perseus': {
    'name':       'Perseus Cluster',
    'ra_deg':     49.5,
    'dec_deg':    41.5,
    'dist_mpc':   73.0,
    'richness':   8,
    # Abell 426 (Brunzendorf+1999); most X-ray luminous cluster in sky
    # Perseus A (NGC1275) BCG: Seyfert, AGN sound waves in ICM
    # NGC1265: head-tail radio galaxy — strong ram-pressure indicator
    'sigma_v_kms': 1040,
    'tx_kev':      6.0,
    'M200_1e14':   12.0,
    'rvir_mpc':    1.30,
    'count':       310,    # ~500 known members
    'subclusters': [
      # Infalling group at +5500 km/s velocity offset; slight offset NE
      {'name': 'Perseus infalling group (+5500 km/s)', 'offset_rvir': [0.30, 0.08, -0.25], 'fraction': 0.14},
    ],
    'special': {
      'cooling_flow': True,  # Very strong cooling flow (Fabian+2011 sound waves)
      'ram_pressure': True,  # NGC1265 head-tail; many infalling spirals
      'obscured':     False,
      'agn_bcg':      True,  # NGC1275 Seyfert — AGN-driven ICM bubbles
      'bimodal':      False,
    },
    # Very hot, massive cluster: strongly E-dominated at core
    # Cooling flow tightens BCG zone; outer zone has more S0 (stripped spirals)
    'zones': [
      (0.00, 0.05, {'E': 0.85, 'S0': 0.13, 'Sa': 0.02, 'Sb': 0.00, 'Irr': 0.00}),
      (0.05, 0.22, {'E': 0.72, 'S0': 0.22, 'Sa': 0.05, 'Sb': 0.01, 'Irr': 0.00}),
      (0.22, 0.55, {'E': 0.52, 'S0': 0.34, 'Sa': 0.11, 'Sb': 0.02, 'Irr': 0.01}),
      (0.55, 1.00, {'E': 0.32, 'S0': 0.38, 'Sa': 0.22, 'Sb': 0.06, 'Irr': 0.02}),
    ],
    'notes': ('Abell 426 (Brunzendorf+1999); ~500 members. '
              'Most X-ray luminous cluster in sky outside Coma. '
              'NGC1275 (Perseus A): Seyfert BCG driving AGN sound waves in ICM (Fabian+2011). '
              'NGC1265: head-tail radio galaxy — strong ram-pressure indicator. '
              'Cooling flow: dense E-dominated core; strong S0 outer zone (stripped infallers).'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'coma': {
    'name':       'Coma Cluster',
    'ra_deg':     194.95,
    'dec_deg':    27.98,
    'dist_mpc':   99.0,
    'richness':   9,
    # Abell 1656 (Godwin+1983); ~1000 bright members; highest σ_v of any nearby cluster
    # Two co-BCGs: NGC4889 (ultra-massive 21 billion M☉ BH) + NGC4874
    'sigma_v_kms': 1082,
    'tx_kev':      8.25,
    'M200_1e14':   15.0,
    'rvir_mpc':    2.10,
    'count':       460,    # ~1000+ bright members; render ~455
    'subclusters': [
      # NGC4889-dominant northern subcluster (~45% of members)
      {'name': 'NGC4889 subcluster (N)', 'offset_rvir': [0.08, 0.11, -0.05], 'fraction': 0.45},
      # NGC4874-dominant southern subcluster (~45% of members)
      {'name': 'NGC4874 subcluster (S)', 'offset_rvir': [-0.11, 0.02, 0.14], 'fraction': 0.45},
    ],
    'special': {
      'cooling_flow': False,  # Coma is NOT a cooling flow cluster (sloshing)
      'ram_pressure': True,   # NGC4921 anemic spiral; many HI-stripped infallers
      'obscured':     False,
      'agn_bcg':      True,   # NGC4889 ultra-massive BH (~21 billion M☉)
      'bimodal':      True,   # strong bimodal NGC4889+NGC4874 structure
    },
    # Hottest nearby cluster: extreme E-domination at core
    # Outer zone still S0-rich (ram-pressure strips all spirals)
    'zones': [
      (0.00, 0.04, {'E': 0.88, 'S0': 0.10, 'Sa': 0.02, 'Sb': 0.00, 'Irr': 0.00}),
      (0.04, 0.20, {'E': 0.76, 'S0': 0.20, 'Sa': 0.03, 'Sb': 0.01, 'Irr': 0.00}),
      (0.20, 0.52, {'E': 0.55, 'S0': 0.34, 'Sa': 0.09, 'Sb': 0.02, 'Irr': 0.00}),
      (0.52, 1.00, {'E': 0.35, 'S0': 0.42, 'Sa': 0.18, 'Sb': 0.04, 'Irr': 0.01}),
    ],
    'notes': ('Abell 1656 (Godwin+1983); ~1000 bright members. '
              'Highest σ_v (1082 km/s) of any nearby cluster. '
              'Bimodal: NGC4889 (N) + NGC4874 (S) co-BCGs — no single dominant peak. '
              'NGC4889 ultra-massive BH ~21 billion M☉. '
              'NGC4921: anemic spiral — HI stripped, dramatically reduced star formation. '
              'Not a cooling flow cluster (ICM sloshing from recent merger).'),
  },

  # ──────────────────────────────────────────────────────────────────────────
  'shapley': {
    'name':       'Shapley Concentration',
    'ra_deg':     202.3,
    'dec_deg':    -31.5,
    'dist_mpc':   200.0,
    'richness':   10,
    # SCl28 multi-cluster superconcentration (Quintana+2000)
    # Core: A3558 (richest) + A3562 (merging) + A3556 (infalling group)
    # Also A3569, A3571, A3572 in outer region
    'sigma_v_kms': 940,
    'tx_kev':      8.0,
    'M200_1e14':   20.0,
    'rvir_mpc':    2.50,
    'count':       310,    # thousands in full superconcentration; render ~300
    'subclusters': [
      # A3562: merging with A3558 — X-ray bridge between them
      {'name': 'A3562 (merging)', 'offset_rvir': [-0.18, 0.05, 0.22], 'fraction': 0.22},
      # A3556: infalling group from NW
      {'name': 'A3556 (infalling group)', 'offset_rvir': [0.28, -0.12, -0.18], 'fraction': 0.14},
    ],
    'special': {
      'cooling_flow': False,
      'ram_pressure': False,  # distant; not individually resolved
      'obscured':     False,
      'agn_bcg':      False,
      'bimodal':      False,
    },
    # Very hot superconcentration: most extreme E-domination
    'zones': [
      (0.00, 0.04, {'E': 0.90, 'S0': 0.08, 'Sa': 0.02, 'Sb': 0.00, 'Irr': 0.00}),
      (0.04, 0.20, {'E': 0.78, 'S0': 0.18, 'Sa': 0.03, 'Sb': 0.01, 'Irr': 0.00}),
      (0.20, 0.55, {'E': 0.60, 'S0': 0.30, 'Sa': 0.08, 'Sb': 0.02, 'Irr': 0.00}),
      (0.55, 1.00, {'E': 0.42, 'S0': 0.38, 'Sa': 0.16, 'Sb': 0.03, 'Irr': 0.01}),
    ],
    'notes': ('SCl28 multi-cluster (Quintana+2000); thousands of members in full survey. '
              'Core: A3558 (richest) + A3562 (merging) + A3556 (infalling group). '
              'X-ray bridge between A3558 and A3562 indicates active merger. '
              'Outer region: A3569, A3571, A3572 contribute to superconcentration. '
              'Most massive nearby large-scale structure.'),
  },
}


# ── Physics helpers ────────────────────────────────────────────────────────────

M_STAR  = -22.2
M_FAINT = -14.5


def zone_weights(r_frac: float, zones: list) -> dict:
    """Return morphology weight dict for a given r_frac using zone table."""
    for rmin, rmax, weights in zones:
        if rmin <= r_frac < rmax:
            return weights
    # Fallback: last zone
    return zones[-1][2]


def pick_morphology(rng: Mulberry32, r_frac: float, zones: list, is_bcg: bool) -> str:
    if is_bcg:
        return 'cD'
    w = zone_weights(r_frac, zones)
    x = rng()
    cumulative = 0.0
    for morph in ('E', 'S0', 'Sa', 'Sb', 'Irr'):
        cumulative += w.get(morph, 0.0)
        if x < cumulative:
            return morph
    return 'E'   # shouldn't reach here if weights sum to 1.0


def schechter_bt_mag(rng: Mulberry32, morph: str, dist_mpc: float, is_bcg: bool) -> float:
    if is_bcg:
        abs_mag = M_STAR - 0.8 - rng() * 0.4
    else:
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

    dist_pc  = max(1.0, dist_mpc) * 1e6
    dist_mod = 5 * math.log10(dist_pc / 10)
    return round(abs_mag + dist_mod + (rng() - 0.5) * 0.6, 1)


def king_profile_r(rng: Mulberry32, cooling_flow: bool = False) -> float:
    """Sample r_frac from King-like profile. cooling_flow → tighter concentration."""
    u = rng()
    scale = 0.18 if cooling_flow else 0.22
    r_frac = math.sqrt(u) * (scale + rng() * (1.0 - scale))
    return min(1.0, r_frac)


def make_offset(rng: Mulberry32, r_frac: float, rvir_mpc: float,
                morph: str, ram_pressure: bool, subcl_offset: Optional[list] = None) -> list:
    """
    Generate [x,y,z] scene-unit offset (renderer × VSPREAD → scene position).
    ram_pressure: spirals get elongated y-axis offset (infall tail signature).
    subcl_offset: additional offset in rvir units (for sub-cluster members).
    """
    r_mpc  = r_frac * rvir_mpc
    theta  = rng() * math.tau
    phi    = math.acos(2 * rng() - 1) * (1 - r_frac * 0.35)

    x = r_mpc * math.sin(phi) * math.cos(theta)
    y = r_mpc * math.sin(phi) * math.sin(theta) * 0.58
    z = r_mpc * math.cos(phi)

    # Ram-pressure: Sa/Sb/Irr get a y-axis tail extension (infall direction)
    if ram_pressure and morph in ('Sa', 'Sb', 'Irr') and rng() < 0.30:
        tail_len = rvir_mpc * (0.08 + rng() * 0.12)
        y += tail_len * (1 if rng() < 0.5 else -1)

    # Sub-cluster offset (in Mpc, from rvir_mpc scale)
    if subcl_offset:
        x += subcl_offset[0] * rvir_mpc
        y += subcl_offset[1] * rvir_mpc * 0.58
        z += subcl_offset[2] * rvir_mpc

    SU = MPC_SCALE / VSPREAD
    return [round(x * SU, 6), round(y * SU, 6), round(z * SU, 6)]


def make_lod3_params(rng: Mulberry32, morph: str, rvir_mpc: float,
                     is_bcg: bool, agn_bcg: bool,
                     axis_ratio: Optional[float] = None,
                     pa_deg: Optional[float] = None) -> dict:
    scene_su = rvir_mpc * MPC_SCALE * (0.022 + rng() * 0.022)
    scene_su = round(max(0.006, min(0.04, scene_su)), 5)

    if is_bcg and agn_bcg:
        scene_su = round(scene_su * 1.45, 5)   # AGN BCG gets larger visual footprint

    if morph in ('E', 'cD', 'S0'):
        ar     = axis_ratio if axis_ratio is not None else round(0.42 + rng() * 0.52, 3)
        pitch  = 0
        n_arms = 0
    else:
        ar     = axis_ratio if axis_ratio is not None else round(0.30 + rng() * 0.65, 3)
        pitch  = 8 if morph in ('Sa', 'Sb') else 0
        n_arms = 2 if morph in ('Sa', 'Sb') else 0

    pa = pa_deg if pa_deg is not None else round(rng() * 180, 1)
    return {'scene_su': scene_su, 'axis_ratio': ar, 'pitch_deg': pitch,
            'n_arms': n_arms, 'pa_deg': pa}


# ── Named anchors from existing file ──────────────────────────────────────────

def load_named_anchors(slug: str) -> list[dict]:
    """Read is_named=True members from an existing *-members.json."""
    path = OUTPUT_DIR / f'{slug}-members.json'
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
        return [m for m in data.get('members', []) if m.get('is_named')]
    except (json.JSONDecodeError, KeyError):
        return []


# ── Sub-cluster sampling ───────────────────────────────────────────────────────

def subcluster_offsets(profile: dict, i: int, total: int, rng: Mulberry32) -> Optional[list]:
    """
    Decide if member i belongs to a sub-cluster, return its Mpc offset or None.
    Uses 'fraction' from each subcluster to probabilistically assign members.
    """
    subclusters = profile.get('subclusters', [])
    if not subclusters:
        return None
    x = rng()
    cumulative = 0.0
    for sc in subclusters:
        cumulative += sc['fraction']
        if x < cumulative:
            return sc['offset_rvir']
    return None


# ── Main generator ─────────────────────────────────────────────────────────────

def generate_cluster(slug: str) -> dict:
    if slug not in CLUSTER_PROFILES:
        raise ValueError(f"Unknown cluster slug: '{slug}'. Use --list to see options.")

    p   = CLUSTER_PROFILES[slug]
    sp  = p.get('special', {})

    seed = sum(ord(c) * (i + 1) for i, c in enumerate(p['name'], 0)) & 0xFFFFFFFF
    rng  = Mulberry32(seed)

    # Named anchors from hand-curated file (preserve them exactly)
    named_anchors = load_named_anchors(slug)

    # Procedural members
    n_proc    = p['count'] - len(named_anchors)
    cooling   = sp.get('cooling_flow', False)
    ram       = sp.get('ram_pressure', False)
    agn_bcg   = sp.get('agn_bcg', False)
    bimodal   = sp.get('bimodal', False)
    rvir      = p['rvir_mpc']
    dist      = p['dist_mpc']
    zones     = p['zones']
    subclusters = p.get('subclusters', [])

    # Bimodal: alternate BCG core membership between two density peaks
    bimodal_offsets = []
    if bimodal and subclusters:
        bimodal_offsets = [sc['offset_rvir'] for sc in subclusters[:2]]

    members: list[dict] = list(named_anchors)

    for i in range(n_proc):
        is_bcg = (i == 0 and not named_anchors)

        r_frac   = 0.02 if is_bcg else king_profile_r(rng, cooling)
        morph    = pick_morphology(rng, r_frac, zones, is_bcg)
        bt_mag   = schechter_bt_mag(rng, morph, dist, is_bcg)

        # Sub-cluster assignment
        sc_off: Optional[list] = None
        if bimodal and bimodal_offsets:
            sc_off = bimodal_offsets[i % len(bimodal_offsets)]
        elif subclusters:
            x = rng()
            cumulative = 0.0
            for sc in subclusters:
                cumulative += sc['fraction']
                if x < cumulative:
                    sc_off = sc['offset_rvir']
                    break

        offset  = make_offset(rng, r_frac, rvir, morph, ram, sc_off)
        lod3    = make_lod3_params(rng, morph, rvir, is_bcg, agn_bcg)

        member: dict = {
            'id':          f'proc-{i:04d}',
            'ra':          round(p['ra_deg']  + (rng() - 0.5) * rvir / 57.3, 5),
            'dec':         round(p['dec_deg'] + (rng() - 0.5) * rvir / 57.3, 5),
            'hubble':      morph,
            'bt_mag':      bt_mag,
            'offset':      offset,
            'lod3_params': lod3,
        }
        members.append(member)

    return {
        'cluster':      p['name'],
        'slug':         slug,
        'center_ra':    p['ra_deg'],
        'center_dec':   p['dec_deg'],
        'dist_mpc':     p['dist_mpc'],
        'rvir_mpc':     round(rvir, 2),
        'richness':     p['richness'],
        'sigma_v_kms':  p.get('sigma_v_kms'),
        'tx_kev':       p.get('tx_kev'),
        'M200_1e14':    p.get('M200_1e14'),
        'notes':        p['notes'],
        'member_count': len(members),
        'members':      members,
    }


# ── Write / dry-run ────────────────────────────────────────────────────────────

def write_catalog(catalog: dict, dry_run: bool = False) -> None:
    slug = catalog['slug']
    path = OUTPUT_DIR / f'{slug}-members.json'
    named = sum(1 for m in catalog['members'] if m.get('is_named'))
    if dry_run:
        print(f'  [dry-run] {path.name}  ({catalog["member_count"]} members, {named} named anchors)')
        return
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(catalog, separators=(',', ':')))
    print(f'  ✓ {path.name}  ({catalog["member_count"]} members, {named} named anchors)')


# ── CLI ────────────────────────────────────────────────────────────────────────

def cmd_list() -> None:
    print('\nDefined cluster profiles:')
    for slug, p in CLUSTER_PROFILES.items():
        path   = OUTPUT_DIR / f'{slug}-members.json'
        status = '✓' if path.exists() else '·'
        sc     = len(p.get('subclusters', []))
        flags  = [k for k, v in p.get('special', {}).items() if v]
        flagstr = f"  [{', '.join(flags)}]" if flags else ''
        print(f'  {status} {slug:<26} σ_v={p.get("sigma_v_kms","—"):>5} km/s  '
              f'T_x={p.get("tx_kev","—"):>4} keV  '
              f'count={p["count"]:>4}  sub={sc}{flagstr}')
    print()


def cmd_inventory() -> None:
    print('\nCluster inventory:')
    for slug in CLUSTER_PROFILES:
        path = OUTPUT_DIR / f'{slug}-members.json'
        if path.exists():
            try:
                d = json.loads(path.read_text())
                named = sum(1 for m in d.get('members', []) if m.get('is_named'))
                print(f'  ✓ {slug:<26}  members={d.get("member_count","?"):>4}  named={named}')
            except Exception:
                print(f'  ! {slug:<26}  [parse error]')
        else:
            print(f'  · {slug:<26}  [no file]')
    print()


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Generate named galaxy cluster member catalogs — per-cluster zone-weighted model',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument('cluster', nargs='?', metavar='SLUG',
                        help='Cluster slug or partial name (e.g. "coma", "virgo"). Omit for all.')
    parser.add_argument('--cluster', metavar='SLUG', dest='cluster_flag',
                        help='Alternative: --cluster NAME (same as positional)')
    parser.add_argument('--list',      action='store_true', help='List all profiles')
    parser.add_argument('--inventory', action='store_true', help='Show file status')
    parser.add_argument('--dry-run',   action='store_true', help='Preview without writing')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite existing files')
    args = parser.parse_args()

    if args.list:
        cmd_list()
        return
    if args.inventory:
        cmd_inventory()
        return

    # Resolve target(s) — positional or --cluster flag
    all_slugs   = list(CLUSTER_PROFILES.keys())
    query_name  = args.cluster_flag or args.cluster

    if query_name:
        q = query_name.lower()
        matches = [s for s in all_slugs if q in s]
        if not matches:
            print(f"No profile matching '{query_name}'. Use --list to see slugs.", file=sys.stderr)
            sys.exit(1)
        targets = matches
    else:
        targets = all_slugs

    print(f'\nGenerating {len(targets)} cluster catalog(s)…\n')
    for slug in targets:
        path = OUTPUT_DIR / f'{slug}-members.json'
        if path.exists() and not args.overwrite:
            print(f'  Skipping {slug}  (file exists — use --overwrite to regenerate)')
            continue
        try:
            catalog = generate_cluster(slug)
            write_catalog(catalog, dry_run=args.dry_run)
        except Exception as e:
            print(f'  ERROR generating {slug}: {e}', file=sys.stderr)
    print()


if __name__ == '__main__':
    main()
