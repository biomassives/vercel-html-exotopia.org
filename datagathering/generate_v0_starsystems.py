#!/usr/bin/env python3
"""
generate_v0_starsystems.py

v0 named-anchor star system generator for extragalactic cluster galaxies.

Covers three clusters (Andromeda Group, Virgo, Perseus) with hand-designed
star systems for each named anchor galaxy. Systems are environment-aware:
  - AGN proximity  → radiation-stressed, rocky/barren world bias
  - Cooling flow   → metal-rich stars, rocky planet abundance
  - Ram-pressure   → normal host stars, outer orbits may be disrupted
  - Old elliptical → K/M host stars, high metallicity, no young spirals

Schema per file:
  galaxy_id, galaxy_name, cluster, cluster_slug, cluster_dist_mpc,
  galaxy_hubble, environment{}, placement_notes{}, generation, star_systems[]

Each star system has:
  id, label, spectral_type, mass_sol, feh (metallicity), age_gyr,
  luminosity_sol, coord_system, settlement_tier, environment_note,
  planets[]

Each planet has:
  id, label, type, radius_earth, mass_earth, period_days,
  semi_major_au, eq_temp_k, atmosphere, settlement_tier, notes?

Output: public/star-systems/{cluster_slug}/{galaxy_id}.json
        public/star-systems/index.json  (lightweight manifest)

Usage:
    python generate_v0_starsystems.py               # write all v0 files
    python generate_v0_starsystems.py --cluster virgo
    python generate_v0_starsystems.py --galaxy NGC4486
    python generate_v0_starsystems.py --dry-run
    python generate_v0_starsystems.py --list
"""

import argparse
import json
import sys
from pathlib import Path

ROOT       = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / 'public' / 'star-systems'

# ── v0 star system data ────────────────────────────────────────────────────────
# Hand-designed; environment-aware. Each galaxy entry documents its context so
# future iterations can compare "initial understanding" vs revised placement.

V0_STARSYSTEMS: list[dict] = [

  # ════════════════════════════════════════════════════════════════════════════
  # ANDROMEDA GROUP (0.77 Mpc — Local Group)
  # Normal field environment: no hot ICM, no AGN, low metallicity at outer MW
  # Spiral-rich poor group — most planet-hospitable zone in our data set
  # ════════════════════════════════════════════════════════════════════════════

  {
    'galaxy_id':       'NGC0224',
    'galaxy_name':     'M31 — Andromeda Galaxy',
    'galaxy_hubble':   'Sb',
    'cluster':         'Andromeda Group',
    'cluster_slug':    'andromeda-group',
    'cluster_dist_mpc': 0.77,
    'environment': {
      'description':       'Giant barred spiral; Local Group dominant; minimal ICM; normal stellar field environment',
      'radiation_factor':  1.0,
      'metallicity_feh':   0.10,
      'agn':               False,
      'cooling_flow':      False,
      'ram_pressure':      False,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Four systems placed across M31 stellar disk. Inner disk (r < 8 kpc): '
        'old metal-rich bulge population; rocky worlds dominate. Mid-disk: Solar '
        'analogues host temperate planets. Outer disk spiral arm: younger G-F stars '
        'with gas giant + rocky moon systems. One system in outer halo for contrast.'
      ),
      'open_questions': [
        'M31 has elevated star formation in ring at ~10 kpc — should that zone get G/F bias?',
        'Andromeda–Milky Way merger in ~4.5 Gyr — mark outer halo system as "disruption-risk"?',
      ],
      'nft_zones': [
        'inner-bulge-zone (high metallicity, rocky worlds)',
        'mid-disk-temperate-band (Solar analogue systems)',
        'outer-spiral-arm (young star, gas giant systems)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'm31-s001', 'label': 'Andromeda Bulge Station Alpha',
        'spectral_type': 'K2V', 'mass_sol': 0.82, 'feh': 0.22, 'age_gyr': 10.5,
        'luminosity_sol': 0.45, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'frontier',
        'environment_note': 'Metal-rich old bulge star; no gas giant companions expected',
        'planets': [
          { 'id': 'm31-s001-b', 'label': 'Andromeda Bulge I',
            'type': 'lava_world', 'radius_earth': 1.3, 'mass_earth': 2.8,
            'period_days': 9.2, 'semi_major_au': 0.072, 'eq_temp_k': 2100,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
          { 'id': 'm31-s001-c', 'label': 'Andromeda Bulge II',
            'type': 'rocky_barren', 'radius_earth': 0.85, 'mass_earth': 0.65,
            'period_days': 58.4, 'semi_major_au': 0.30, 'eq_temp_k': 610,
            'atmosphere': 'thin_co2', 'settlement_tier': 'frontier' },
          { 'id': 'm31-s001-d', 'label': 'Andromeda Bulge III',
            'type': 'super_earth', 'radius_earth': 1.6, 'mass_earth': 5.2,
            'period_days': 210, 'semi_major_au': 0.74, 'eq_temp_k': 325,
            'atmosphere': 'thick_n2_co2', 'settlement_tier': 'candidate',
            'notes': 'Temperate — in conservative HZ; high surface gravity; candidate for atmospheric study' },
        ],
      },
      {
        'id': 'm31-s002', 'label': 'Andromeda Mid-Disk Station Beta',
        'spectral_type': 'G4V', 'mass_sol': 0.96, 'feh': 0.08, 'age_gyr': 7.2,
        'luminosity_sol': 0.88, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'candidate',
        'environment_note': 'Near-Solar analogue in mid-disk; prime candidate for temperate worlds',
        'planets': [
          { 'id': 'm31-s002-b', 'label': 'Andromeda Station Beta I',
            'type': 'rocky_barren', 'radius_earth': 0.72, 'mass_earth': 0.43,
            'period_days': 42.1, 'semi_major_au': 0.24, 'eq_temp_k': 730,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
          { 'id': 'm31-s002-c', 'label': 'Andromeda Station Beta II',
            'type': 'super_earth', 'radius_earth': 1.4, 'mass_earth': 3.6,
            'period_days': 298, 'semi_major_au': 0.94, 'eq_temp_k': 278,
            'atmosphere': 'n2_o2', 'settlement_tier': 'candidate',
            'notes': 'Temperate super-earth with oxygen-bearing atmosphere; highest priority candidate in Andromeda' },
          { 'id': 'm31-s002-d', 'label': 'Andromeda Station Beta III',
            'type': 'mini_neptune', 'radius_earth': 2.9, 'mass_earth': 11.0,
            'period_days': 680, 'semi_major_au': 1.72, 'eq_temp_k': 185,
            'atmosphere': 'h2_he', 'settlement_tier': 'frontier' },
          { 'id': 'm31-s002-e', 'label': 'Andromeda Station Beta IV',
            'type': 'gas_giant', 'radius_earth': 9.8, 'mass_earth': 285,
            'period_days': 4200, 'semi_major_au': 5.80, 'eq_temp_k': 78,
            'atmosphere': 'h2_he_ch4', 'settlement_tier': 'frontier',
            'notes': 'Cold gas giant; potential moon settlement zone' },
        ],
      },
      {
        'id': 'm31-s003', 'label': 'Andromeda Spiral Arm Station Gamma',
        'spectral_type': 'F8V', 'mass_sol': 1.12, 'feh': 0.02, 'age_gyr': 3.8,
        'luminosity_sol': 1.58, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'frontier',
        'environment_note': 'Younger F-star in active spiral arm; active star formation nearby',
        'planets': [
          { 'id': 'm31-s003-b', 'label': 'Andromeda Arm I',
            'type': 'rocky_barren', 'radius_earth': 1.1, 'mass_earth': 1.5,
            'period_days': 52.3, 'semi_major_au': 0.36, 'eq_temp_k': 890,
            'atmosphere': 'thin_so2', 'settlement_tier': 'theoretical' },
          { 'id': 'm31-s003-c', 'label': 'Andromeda Arm II',
            'type': 'ocean_world', 'radius_earth': 1.2, 'mass_earth': 2.0,
            'period_days': 380, 'semi_major_au': 1.32, 'eq_temp_k': 242,
            'atmosphere': 'n2_co2', 'settlement_tier': 'frontier',
            'notes': 'Global ice-capped ocean world; F-star irradiance at outer HZ edge' },
          { 'id': 'm31-s003-d', 'label': 'Andromeda Arm III',
            'type': 'gas_giant', 'radius_earth': 11.2, 'mass_earth': 340,
            'period_days': 2800, 'semi_major_au': 4.40, 'eq_temp_k': 95,
            'atmosphere': 'h2_he', 'settlement_tier': 'frontier' },
        ],
      },
      {
        'id': 'm31-s004', 'label': 'Andromeda Outer Halo Station Delta',
        'spectral_type': 'M1V', 'mass_sol': 0.52, 'feh': -0.18, 'age_gyr': 12.0,
        'luminosity_sol': 0.06, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Old metal-poor M-dwarf in outer stellar halo; low-mass rocky worlds',
        'planets': [
          { 'id': 'm31-s004-b', 'label': 'Andromeda Halo I',
            'type': 'rocky_barren', 'radius_earth': 0.82, 'mass_earth': 0.55,
            'period_days': 14.6, 'semi_major_au': 0.063, 'eq_temp_k': 292,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical',
            'notes': 'Temperate rocky in M-dwarf HZ; tidally locked; terminator zone habitable band' },
          { 'id': 'm31-s004-c', 'label': 'Andromeda Halo II',
            'type': 'ice_world', 'radius_earth': 0.65, 'mass_earth': 0.28,
            'period_days': 42.0, 'semi_major_au': 0.13, 'eq_temp_k': 128,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
        ],
      },
    ],
  },

  {
    'galaxy_id':       'NGC0598',
    'galaxy_name':     'M33 — Triangulum Galaxy',
    'galaxy_hubble':   'Sa',
    'cluster':         'Andromeda Group',
    'cluster_slug':    'andromeda-group',
    'cluster_dist_mpc': 0.77,
    'environment': {
      'description':       'Face-on spiral; lower metallicity than M31; active star formation; no bulge-driven effects',
      'radiation_factor':  1.0,
      'metallicity_feh':   -0.08,
      'agn':               False,
      'cooling_flow':      False,
      'ram_pressure':      False,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Three systems in active spiral arm region. M33 has lower metallicity than '
        'M31 and is highly star-forming — G and F hosts with diverse planet types. '
        'One system near central bar region (metal-enriched); one in outer low-density disk.'
      ),
      'open_questions': [
        'M33 has a very faint nucleus — is AGN activity truly absent?',
        'High SFR environment — should some systems be flagged as "forming" rather than stable?',
      ],
      'nft_zones': [
        'inner-bar-zone (higher metallicity)',
        'mid-arm-zone (active star formation)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'm33-s001', 'label': 'Triangulum Station Alpha',
        'spectral_type': 'G8V', 'mass_sol': 0.92, 'feh': -0.05, 'age_gyr': 5.4,
        'luminosity_sol': 0.72, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'frontier',
        'environment_note': 'Mid-disk Solar-type star; active HII region proximity',
        'planets': [
          { 'id': 'm33-s001-b', 'label': 'Triangulum I',
            'type': 'rocky_barren', 'radius_earth': 0.90, 'mass_earth': 0.78,
            'period_days': 72, 'semi_major_au': 0.33, 'eq_temp_k': 580,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical' },
          { 'id': 'm33-s001-c', 'label': 'Triangulum II',
            'type': 'super_earth', 'radius_earth': 1.5, 'mass_earth': 4.4,
            'period_days': 320, 'semi_major_au': 1.01, 'eq_temp_k': 264,
            'atmosphere': 'n2_co2', 'settlement_tier': 'candidate',
            'notes': 'Cool temperate super-earth; near outer HZ edge; may support liquid water' },
          { 'id': 'm33-s001-d', 'label': 'Triangulum III',
            'type': 'mini_neptune', 'radius_earth': 3.1, 'mass_earth': 13.5,
            'period_days': 920, 'semi_major_au': 2.25, 'eq_temp_k': 148,
            'atmosphere': 'h2_he', 'settlement_tier': 'frontier' },
        ],
      },
      {
        'id': 'm33-s002', 'label': 'Triangulum Station Beta',
        'spectral_type': 'K5V', 'mass_sol': 0.70, 'feh': -0.12, 'age_gyr': 8.0,
        'luminosity_sol': 0.22, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'frontier',
        'environment_note': 'Older K-dwarf; outer spiral arm; lower metallicity system',
        'planets': [
          { 'id': 'm33-s002-b', 'label': 'Triangulum Outer I',
            'type': 'rocky_barren', 'radius_earth': 0.78, 'mass_earth': 0.50,
            'period_days': 22, 'semi_major_au': 0.11, 'eq_temp_k': 445,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
          { 'id': 'm33-s002-c', 'label': 'Triangulum Outer II',
            'type': 'ocean_world', 'radius_earth': 1.1, 'mass_earth': 1.4,
            'period_days': 142, 'semi_major_au': 0.48, 'eq_temp_k': 268,
            'atmosphere': 'n2_h2o', 'settlement_tier': 'candidate',
            'notes': 'Shallow ocean world in K-dwarf HZ; may have active tectonics' },
        ],
      },
      {
        'id': 'm33-s003', 'label': 'Triangulum Central Bar Station',
        'spectral_type': 'G2V', 'mass_sol': 0.99, 'feh': 0.05, 'age_gyr': 6.1,
        'luminosity_sol': 0.98, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'candidate',
        'environment_note': 'Near-Solar twin in inner bar region; slightly elevated metallicity',
        'planets': [
          { 'id': 'm33-s003-b', 'label': 'Triangulum Bar I',
            'type': 'rocky_barren', 'radius_earth': 1.0, 'mass_earth': 1.0,
            'period_days': 88, 'semi_major_au': 0.41, 'eq_temp_k': 550,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical' },
          { 'id': 'm33-s003-c', 'label': 'Triangulum Bar II — Triam',
            'type': 'super_earth', 'radius_earth': 1.35, 'mass_earth': 3.1,
            'period_days': 365, 'semi_major_au': 1.00, 'eq_temp_k': 285,
            'atmosphere': 'n2_o2', 'settlement_tier': 'candidate',
            'notes': 'Named Triam — near-Earth analogue; Solar-twin host; highest habitability score in M33' },
          { 'id': 'm33-s003-d', 'label': 'Triangulum Bar III',
            'type': 'gas_giant', 'radius_earth': 10.5, 'mass_earth': 310,
            'period_days': 3800, 'semi_major_au': 5.20, 'eq_temp_k': 82,
            'atmosphere': 'h2_he', 'settlement_tier': 'frontier' },
        ],
      },
    ],
  },

  {
    'galaxy_id':       'NGC0221',
    'galaxy_name':     'M32 — NGC 221',
    'galaxy_hubble':   'E',
    'cluster':         'Andromeda Group',
    'cluster_slug':    'andromeda-group',
    'cluster_dist_mpc': 0.77,
    'environment': {
      'description':       'Compact elliptical satellite of M31; tidal stripping has removed outer regions; old metal-rich stellar population',
      'radiation_factor':  1.1,
      'metallicity_feh':   0.20,
      'agn':               False,
      'cooling_flow':      False,
      'ram_pressure':      False,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Two systems in M32 stellar body. Compact elliptical — tidal stripping '
        'means no outer stellar disk. Old metal-rich K/M star population: rocky '
        'worlds expected, no gas giants (old stars, migration complete). M31 '
        'tidal field may have stripped or perturbed outer planetary orbits.'
      ),
      'open_questions': [
        'M32 tidal radius < 1 kpc — outer planetary orbits beyond 10 AU may be unstable',
        'Does M32 harbor a black hole? If so, inner system radiation environment?',
      ],
      'nft_zones': [
        'core-zone (most metal-rich, compact settlement)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'm32-s001', 'label': 'M32 Station Alpha',
        'spectral_type': 'K1V', 'mass_sol': 0.84, 'feh': 0.18, 'age_gyr': 11.0,
        'luminosity_sol': 0.48, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Old metal-rich K-star; tidal environment; compact rocky system',
        'planets': [
          { 'id': 'm32-s001-b', 'label': 'M32 Alpha I',
            'type': 'lava_world', 'radius_earth': 1.2, 'mass_earth': 2.0,
            'period_days': 7.5, 'semi_major_au': 0.055, 'eq_temp_k': 1820,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
          { 'id': 'm32-s001-c', 'label': 'M32 Alpha II',
            'type': 'rocky_barren', 'radius_earth': 0.88, 'mass_earth': 0.72,
            'period_days': 112, 'semi_major_au': 0.47, 'eq_temp_k': 318,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical',
            'notes': 'Marginally temperate; tidal perturbations from M31 may affect orbit stability' },
        ],
      },
      {
        'id': 'm32-s002', 'label': 'M32 Station Beta',
        'spectral_type': 'M2V', 'mass_sol': 0.48, 'feh': 0.14, 'age_gyr': 10.5,
        'luminosity_sol': 0.05, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Old metal-rich M-dwarf; compact system; tidally locked inner planet',
        'planets': [
          { 'id': 'm32-s002-b', 'label': 'M32 Beta I',
            'type': 'rocky_barren', 'radius_earth': 0.95, 'mass_earth': 0.88,
            'period_days': 18.3, 'semi_major_au': 0.072, 'eq_temp_k': 258,
            'atmosphere': 'thin_n2', 'settlement_tier': 'theoretical',
            'notes': 'Tidally locked; terminator-zone temperate band; old metal-rich rocky' },
          { 'id': 'm32-s002-c', 'label': 'M32 Beta II',
            'type': 'ice_world', 'radius_earth': 0.60, 'mass_earth': 0.22,
            'period_days': 72, 'semi_major_au': 0.19, 'eq_temp_k': 98,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
        ],
      },
    ],
  },

  # ════════════════════════════════════════════════════════════════════════════
  # VIRGO CLUSTER (16.5 Mpc)
  # Hot ICM (T_x = 2.5 keV); M87 AGN; three subclusters; ram-pressure active
  # ════════════════════════════════════════════════════════════════════════════

  {
    'galaxy_id':       'NGC4486',
    'galaxy_name':     'M87 — NGC 4486',
    'galaxy_hubble':   'cD',
    'cluster':         'Virgo Cluster',
    'cluster_slug':    'virgo',
    'cluster_dist_mpc': 16.5,
    'environment': {
      'description':       'cD BCG of Virgo A subcluster; 6.5 billion solar mass black hole; relativistic jet; strong X-ray/radio radiation field',
      'radiation_factor':  4.2,
      'metallicity_feh':   0.28,
      'agn':               True,
      'cooling_flow':      False,
      'ram_pressure':      False,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Three systems placed at large stellocentric radii (> 20 kpc analog equivalent) '
        'in M87 outer stellar halo, beyond the direct influence radius of the jet. '
        'All systems are metal-rich (BCG stellar population), old, K/M host stars. '
        'AGN radiation factor elevated — inner planets barren/lava; outer planets may '
        'retain thin atmospheres. No water-bearing worlds expected inside this galaxy.'
      ),
      'open_questions': [
        'Does the M87 jet precess? If so, jet-irradiated zones shift over Myr timescales',
        'Stellar halo age ~13 Gyr — are there surviving planetary systems from pre-AGN epoch?',
        'X-ray cavities around M87 at 1-3 kpc — what is radiation environment at r > 20 kpc?',
      ],
      'nft_zones': [
        'outer-halo-perpendicular-to-jet (lowest radiation zone)',
        'intermediate-halo-south (moderate radiation)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'm87-s001', 'label': 'Virgo Station Alpha — M87 Outer Halo',
        'spectral_type': 'K3V', 'mass_sol': 0.78, 'feh': 0.24, 'age_gyr': 12.5,
        'luminosity_sol': 0.35, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Outer halo perpendicular to jet; reduced AGN irradiance; old metal-rich K-dwarf',
        'planets': [
          { 'id': 'm87-s001-b', 'label': 'Virgo Alpha I',
            'type': 'lava_world', 'radius_earth': 1.4, 'mass_earth': 3.5,
            'period_days': 11.2, 'semi_major_au': 0.066, 'eq_temp_k': 2200,
            'atmosphere': 'none',
            'settlement_tier': 'theoretical',
            'notes': 'Inner orbit — stripped by AGN UV flux; surface lava ocean' },
          { 'id': 'm87-s001-c', 'label': 'Virgo Alpha II',
            'type': 'rocky_barren', 'radius_earth': 1.0, 'mass_earth': 1.1,
            'period_days': 82, 'semi_major_au': 0.36, 'eq_temp_k': 530,
            'atmosphere': 'trace',
            'settlement_tier': 'theoretical',
            'notes': 'Elevated surface X-ray flux from BCG halo; atmospheric stripping ongoing' },
          { 'id': 'm87-s001-d', 'label': 'Virgo Alpha III',
            'type': 'mini_neptune', 'radius_earth': 2.8, 'mass_earth': 10.5,
            'period_days': 620, 'semi_major_au': 1.52, 'eq_temp_k': 190,
            'atmosphere': 'h2_he',
            'settlement_tier': 'theoretical',
            'notes': 'H/He atmosphere partially shielded by own magnetosphere; outer HZ access possible on moons' },
        ],
      },
      {
        'id': 'm87-s002', 'label': 'Virgo Station Beta — M87 South Halo',
        'spectral_type': 'M1V', 'mass_sol': 0.54, 'feh': 0.20, 'age_gyr': 13.0,
        'luminosity_sol': 0.07, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Old metal-rich M-dwarf; south of jet axis; reduced radiation cone',
        'planets': [
          { 'id': 'm87-s002-b', 'label': 'Virgo Beta I',
            'type': 'rocky_barren', 'radius_earth': 0.92, 'mass_earth': 0.82,
            'period_days': 21, 'semi_major_au': 0.082, 'eq_temp_k': 298,
            'atmosphere': 'thin_co2',
            'settlement_tier': 'theoretical',
            'notes': 'Tidally locked; terminator band marginally habitable; AGN flux elevated vs normal M-dwarf HZ' },
          { 'id': 'm87-s002-c', 'label': 'Virgo Beta II',
            'type': 'ice_world', 'radius_earth': 0.68, 'mass_earth': 0.30,
            'period_days': 95, 'semi_major_au': 0.24, 'eq_temp_k': 102,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
        ],
      },
      {
        'id': 'm87-s003', 'label': 'Virgo Station Gamma — M87 Halo North',
        'spectral_type': 'K5V', 'mass_sol': 0.71, 'feh': 0.30, 'age_gyr': 12.8,
        'luminosity_sol': 0.21, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'High-metallicity K-dwarf; north of jet; AGN radiation exposure moderate',
        'planets': [
          { 'id': 'm87-s003-b', 'label': 'Virgo Gamma I',
            'type': 'rocky_barren', 'radius_earth': 1.1, 'mass_earth': 1.6,
            'period_days': 38, 'semi_major_au': 0.18, 'eq_temp_k': 340,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
          { 'id': 'm87-s003-c', 'label': 'Virgo Gamma II',
            'type': 'super_earth', 'radius_earth': 1.7, 'mass_earth': 6.2,
            'period_days': 290, 'semi_major_au': 0.88, 'eq_temp_k': 188,
            'atmosphere': 'thick_co2',
            'settlement_tier': 'theoretical',
            'notes': 'Thick CO2 greenhouse; very old; high metallicity may support mineralogical complexity' },
        ],
      },
    ],
  },

  {
    'galaxy_id':       'NGC4406',
    'galaxy_name':     'M86 — NGC 4406',
    'galaxy_hubble':   'E',
    'cluster':         'Virgo Cluster',
    'cluster_slug':    'virgo',
    'cluster_dist_mpc': 16.5,
    'environment': {
      'description':       'Giant elliptical; uniquely approaching us at -244 km/s (blueshifted); falling into Virgo from far side; normal ICM environment',
      'radiation_factor':  1.4,
      'metallicity_feh':   0.22,
      'agn':               False,
      'cooling_flow':      False,
      'ram_pressure':      True,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Two systems in M86 outer stellar body. M86 is notably APPROACHING us '
        '(blueshifted by -244 km/s) — infalling from the far side of the Virgo '
        'cluster. Ram pressure from ICM wind acts on interstellar gas. '
        'Old metal-rich elliptical stars: rocky world bias, K hosts dominant. '
        'ICM ram-pressure wind may strip any residual interstellar material from young-star zones.'
      ),
      'open_questions': [
        'M86 approaches us faster than expected — will it pass through the cluster core?',
        'X-ray plume detected behind M86 from ram-pressure — does this affect very outer planetary orbits?',
      ],
      'nft_zones': [
        'stellar-core-zone (sheltered from ram pressure)',
        'outer-zone-windward (ICM ram-pressure interface)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'm86-s001', 'label': 'Virgo Blueshift Station Alpha',
        'spectral_type': 'K2V', 'mass_sol': 0.81, 'feh': 0.20, 'age_gyr': 11.5,
        'luminosity_sol': 0.43, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'frontier',
        'environment_note': 'Core elliptical K-dwarf; sheltered from ICM ram-pressure wind',
        'planets': [
          { 'id': 'm86-s001-b', 'label': 'Blueshift Station I',
            'type': 'rocky_barren', 'radius_earth': 0.88, 'mass_earth': 0.72,
            'period_days': 65, 'semi_major_au': 0.28, 'eq_temp_k': 545,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical' },
          { 'id': 'm86-s001-c', 'label': 'Blueshift Station II',
            'type': 'super_earth', 'radius_earth': 1.45, 'mass_earth': 3.8,
            'period_days': 340, 'semi_major_au': 0.97, 'eq_temp_k': 265,
            'atmosphere': 'n2_co2', 'settlement_tier': 'frontier',
            'notes': 'Cool temperate super-earth in K-dwarf HZ; M86 approach motion gives time-variable Doppler shift' },
          { 'id': 'm86-s001-d', 'label': 'Blueshift Station III',
            'type': 'mini_neptune', 'radius_earth': 3.0, 'mass_earth': 12.4,
            'period_days': 880, 'semi_major_au': 2.10, 'eq_temp_k': 165,
            'atmosphere': 'h2_he', 'settlement_tier': 'theoretical' },
        ],
      },
      {
        'id': 'm86-s002', 'label': 'Virgo Blueshift Station Beta',
        'spectral_type': 'M3V', 'mass_sol': 0.42, 'feh': 0.18, 'age_gyr': 12.0,
        'luminosity_sol': 0.03, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Outer halo M-dwarf; windward side faces ICM ram-pressure flow',
        'planets': [
          { 'id': 'm86-s002-b', 'label': 'Blueshift Station Beta I',
            'type': 'rocky_barren', 'radius_earth': 0.78, 'mass_earth': 0.50,
            'period_days': 26, 'semi_major_au': 0.095, 'eq_temp_k': 210,
            'atmosphere': 'trace', 'settlement_tier': 'theoretical',
            'notes': 'Tidally locked; minimal atmosphere due to M-dwarf flaring + ICM proximity' },
        ],
      },
    ],
  },

  {
    'galaxy_id':       'NGC4472',
    'galaxy_name':     'M49 — NGC 4472',
    'galaxy_hubble':   'E',
    'cluster':         'Virgo Cluster',
    'cluster_slug':    'virgo',
    'cluster_dist_mpc': 16.5,
    'environment': {
      'description':       'BCG of Virgo B subcluster; brightest galaxy in Virgo; south of main cluster; relatively quiescent environment',
      'radiation_factor':  1.6,
      'metallicity_feh':   0.25,
      'agn':               False,
      'cooling_flow':      False,
      'ram_pressure':      False,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Three systems in M49 stellar body. BCG of B-subcluster — somewhat '
        'isolated from M87 AGN. Quiescent environment relative to M87 zone. '
        'Old metal-rich elliptical population; K/M dominant host stars; '
        'rocky worlds expected throughout. Best "habitable candidate" of '
        'the Virgo BCG set due to low AGN exposure.'
      ),
      'open_questions': [
        'M49 hosts a UCD (ultra-compact dwarf) system — do they affect local environment?',
        'Is there any residual AGN activity in M49 nucleus?',
      ],
      'nft_zones': [
        'inner-stellar-body (metal-rich rocky worlds)',
        'outer-halo-south (lower cluster radiation)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'm49-s001', 'label': 'Virgo-B Station Alpha',
        'spectral_type': 'K4V', 'mass_sol': 0.76, 'feh': 0.22, 'age_gyr': 11.8,
        'luminosity_sol': 0.28, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'frontier',
        'environment_note': 'Inner stellar body K-dwarf; moderate cluster X-ray background',
        'planets': [
          { 'id': 'm49-s001-b', 'label': 'Virgo-B Station I',
            'type': 'rocky_barren', 'radius_earth': 1.05, 'mass_earth': 1.2,
            'period_days': 42, 'semi_major_au': 0.19, 'eq_temp_k': 450,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical' },
          { 'id': 'm49-s001-c', 'label': 'Virgo-B Station II',
            'type': 'super_earth', 'radius_earth': 1.55, 'mass_earth': 4.8,
            'period_days': 385, 'semi_major_au': 1.08, 'eq_temp_k': 238,
            'atmosphere': 'n2_co2', 'settlement_tier': 'frontier',
            'notes': 'Best habitability candidate in Virgo BCG set; low AGN exposure; temperate K-dwarf HZ' },
          { 'id': 'm49-s001-d', 'label': 'Virgo-B Station III',
            'type': 'mini_neptune', 'radius_earth': 2.6, 'mass_earth': 9.8,
            'period_days': 1100, 'semi_major_au': 2.45, 'eq_temp_k': 140,
            'atmosphere': 'h2_he', 'settlement_tier': 'theoretical' },
        ],
      },
      {
        'id': 'm49-s002', 'label': 'Virgo-B Station Beta',
        'spectral_type': 'K1V', 'mass_sol': 0.86, 'feh': 0.26, 'age_gyr': 12.2,
        'luminosity_sol': 0.52, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'High-metallicity K-star; outer B-subcluster halo',
        'planets': [
          { 'id': 'm49-s002-b', 'label': 'Virgo-B Beta I',
            'type': 'lava_world', 'radius_earth': 1.2, 'mass_earth': 2.1,
            'period_days': 8.8, 'semi_major_au': 0.063, 'eq_temp_k': 1960,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
          { 'id': 'm49-s002-c', 'label': 'Virgo-B Beta II',
            'type': 'rocky_barren', 'radius_earth': 0.95, 'mass_earth': 0.92,
            'period_days': 180, 'semi_major_au': 0.72, 'eq_temp_k': 302,
            'atmosphere': 'thin_co2', 'settlement_tier': 'frontier' },
        ],
      },
    ],
  },

  # ════════════════════════════════════════════════════════════════════════════
  # PERSEUS CLUSTER (73 Mpc)
  # Hottest X-ray cluster in sky; NGC1275 Seyfert AGN + cooling flow;
  # head-tail radio galaxy NGC1265 (strong ram-pressure); AGN sound waves
  # ════════════════════════════════════════════════════════════════════════════

  {
    'galaxy_id':       'NGC1275',
    'galaxy_name':     'NGC 1275 — Perseus A',
    'galaxy_hubble':   'cD',
    'cluster':         'Perseus Cluster',
    'cluster_slug':    'perseus',
    'cluster_dist_mpc': 73.0,
    'environment': {
      'description':       'Seyfert 2 BCG; 350 million solar mass BH; AGN sound waves in ICM; Hα filaments extend 100 kpc; cooling flow deposits',
      'radiation_factor':  5.8,
      'metallicity_feh':   0.35,
      'agn':               True,
      'cooling_flow':      True,
      'ram_pressure':      False,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Three systems placed at large stellocentric offsets from NGC1275 nucleus. '
        'Seyfert 2 AGN — elevated UV/X-ray. Cooling flow deposits metal-enriched gas, '
        'boosting stellar metallicity. Hα filaments at 100 kpc suggest warm gas '
        'threads that may host star formation — unusual for BCG environment. '
        'All v0 systems flagged theoretical due to AGN and sound-wave ICM environment. '
        'Inner system placed in a cooling flow "finger" where star formation is observed.'
      ),
      'open_questions': [
        'Do the Hα filaments at 100 kpc host in-situ star formation? If yes, F/G stars possible there',
        'Sound waves in ICM (Fabian+2011): period 10 Myr — do they perturb planetary orbits?',
        'Cooling flow metallicity: does it enrich the outer stellar population differently than core?',
      ],
      'nft_zones': [
        'outer-halo-low-agn (perpendicular to AGN axis)',
        'cooling-flow-finger (Hα filament zone — unusual star formation)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'ngc1275-s001', 'label': 'Perseus Station Alpha — Cooling Flow Finger',
        'spectral_type': 'K2V', 'mass_sol': 0.83, 'feh': 0.32, 'age_gyr': 9.0,
        'luminosity_sol': 0.46, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Embedded in Hα cooling flow filament zone; metal-enriched; unusual star formation region',
        'planets': [
          { 'id': 'ngc1275-s001-b', 'label': 'Perseus Alpha I',
            'type': 'lava_world', 'radius_earth': 1.5, 'mass_earth': 4.2,
            'period_days': 6.8, 'semi_major_au': 0.052, 'eq_temp_k': 2450,
            'atmosphere': 'none', 'settlement_tier': 'theoretical',
            'notes': 'AGN-irradiated inner orbit; surface temperature dominated by AGN UV flux not stellar insolation' },
          { 'id': 'ngc1275-s001-c', 'label': 'Perseus Alpha II',
            'type': 'rocky_barren', 'radius_earth': 1.1, 'mass_earth': 1.5,
            'period_days': 98, 'semi_major_au': 0.43, 'eq_temp_k': 490,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical' },
          { 'id': 'ngc1275-s001-d', 'label': 'Perseus Alpha III',
            'type': 'super_earth', 'radius_earth': 1.8, 'mass_earth': 6.8,
            'period_days': 540, 'semi_major_au': 1.42, 'eq_temp_k': 198,
            'atmosphere': 'thick_co2', 'settlement_tier': 'theoretical',
            'notes': 'Metal-rich thick-atmosphere world; cooling flow metallicity boost; may have complex mineralogy' },
        ],
      },
      {
        'id': 'ngc1275-s002', 'label': 'Perseus Station Beta — Outer Halo',
        'spectral_type': 'M1V', 'mass_sol': 0.56, 'feh': 0.28, 'age_gyr': 13.0,
        'luminosity_sol': 0.08, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Very old metal-rich M-dwarf; outer halo perpendicular to AGN axis',
        'planets': [
          { 'id': 'ngc1275-s002-b', 'label': 'Perseus Beta I',
            'type': 'rocky_barren', 'radius_earth': 0.90, 'mass_earth': 0.80,
            'period_days': 24, 'semi_major_au': 0.090, 'eq_temp_k': 275,
            'atmosphere': 'thin_n2', 'settlement_tier': 'theoretical',
            'notes': 'Tidally locked; least AGN-exposed system in NGC1275; marginal habitability on terminator' },
          { 'id': 'ngc1275-s002-c', 'label': 'Perseus Beta II',
            'type': 'ice_world', 'radius_earth': 0.72, 'mass_earth': 0.38,
            'period_days': 108, 'semi_major_au': 0.27, 'eq_temp_k': 95,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
        ],
      },
      {
        'id': 'ngc1275-s003', 'label': 'Perseus Station Gamma — AGN Axis Flank',
        'spectral_type': 'K5V', 'mass_sol': 0.72, 'feh': 0.30, 'age_gyr': 11.5,
        'luminosity_sol': 0.22, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Flanking AGN cone; slightly elevated irradiance; high metallicity K-dwarf',
        'planets': [
          { 'id': 'ngc1275-s003-b', 'label': 'Perseus Gamma I',
            'type': 'rocky_barren', 'radius_earth': 1.0, 'mass_earth': 1.05,
            'period_days': 52, 'semi_major_au': 0.22, 'eq_temp_k': 380,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
          { 'id': 'ngc1275-s003-c', 'label': 'Perseus Gamma II',
            'type': 'mini_neptune', 'radius_earth': 2.4, 'mass_earth': 8.5,
            'period_days': 610, 'semi_major_au': 1.48, 'eq_temp_k': 152,
            'atmosphere': 'h2_he', 'settlement_tier': 'theoretical' },
        ],
      },
    ],
  },

  {
    'galaxy_id':       'NGC1272',
    'galaxy_name':     'NGC 1272',
    'galaxy_hubble':   'E',
    'cluster':         'Perseus Cluster',
    'cluster_slug':    'perseus',
    'cluster_dist_mpc': 73.0,
    'environment': {
      'description':       'Giant elliptical in Perseus core; second brightest galaxy; hot ICM environment; no AGN; old metal-rich population',
      'radiation_factor':  2.2,
      'metallicity_feh':   0.24,
      'agn':               False,
      'cooling_flow':      False,
      'ram_pressure':      False,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Two systems in NGC1272 stellar body. Quiescent giant elliptical — no AGN. '
        'Hot Perseus ICM provides elevated background X-ray irradiance (radiation_factor 2.2). '
        'Old metal-rich K/M host stars; rocky worlds expected. '
        'Best non-AGN system in Perseus core for frontier settlement tier.'
      ),
      'open_questions': [
        'NGC1272 may host a dwarf satellite — does it perturb outer orbits?',
      ],
      'nft_zones': [
        'core-elliptical-zone (best frontier candidate in Perseus)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'ngc1272-s001', 'label': 'Perseus NGC1272 Station Alpha',
        'spectral_type': 'K2V', 'mass_sol': 0.82, 'feh': 0.22, 'age_gyr': 12.0,
        'luminosity_sol': 0.44, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'frontier',
        'environment_note': 'Old metal-rich K-dwarf; no AGN; elevated ICM background radiation',
        'planets': [
          { 'id': 'ngc1272-s001-b', 'label': 'NGC1272 Alpha I',
            'type': 'rocky_barren', 'radius_earth': 0.92, 'mass_earth': 0.82,
            'period_days': 58, 'semi_major_au': 0.25, 'eq_temp_k': 520,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical' },
          { 'id': 'ngc1272-s001-c', 'label': 'NGC1272 Alpha II',
            'type': 'super_earth', 'radius_earth': 1.5, 'mass_earth': 4.5,
            'period_days': 360, 'semi_major_au': 0.98, 'eq_temp_k': 248,
            'atmosphere': 'n2_co2', 'settlement_tier': 'frontier',
            'notes': 'Best frontier candidate in Perseus core; quiescent K-dwarf host; elevated but survivable ICM flux' },
          { 'id': 'ngc1272-s001-d', 'label': 'NGC1272 Alpha III',
            'type': 'mini_neptune', 'radius_earth': 2.7, 'mass_earth': 10.2,
            'period_days': 950, 'semi_major_au': 2.20, 'eq_temp_k': 148,
            'atmosphere': 'h2_he', 'settlement_tier': 'theoretical' },
        ],
      },
      {
        'id': 'ngc1272-s002', 'label': 'Perseus NGC1272 Station Beta',
        'spectral_type': 'M2V', 'mass_sol': 0.48, 'feh': 0.18, 'age_gyr': 11.5,
        'luminosity_sol': 0.05, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Old metal-rich M-dwarf; compact HZ system; ICM radiation elevated',
        'planets': [
          { 'id': 'ngc1272-s002-b', 'label': 'NGC1272 Beta I',
            'type': 'rocky_barren', 'radius_earth': 0.85, 'mass_earth': 0.65,
            'period_days': 20, 'semi_major_au': 0.079, 'eq_temp_k': 265,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical',
            'notes': 'Tidally locked; terminator band temp 250-280 K; ICM X-ray flux elevated vs Solar neighbourhood' },
          { 'id': 'ngc1272-s002-c', 'label': 'NGC1272 Beta II',
            'type': 'ice_world', 'radius_earth': 0.62, 'mass_earth': 0.25,
            'period_days': 78, 'semi_major_au': 0.20, 'eq_temp_k': 108,
            'atmosphere': 'none', 'settlement_tier': 'theoretical' },
        ],
      },
    ],
  },

  {
    'galaxy_id':       'NGC1265',
    'galaxy_name':     'NGC 1265',
    'galaxy_hubble':   'S0',
    'cluster':         'Perseus Cluster',
    'cluster_slug':    'perseus',
    'cluster_dist_mpc': 73.0,
    'environment': {
      'description':       'Head-tail radio galaxy; moving at ~1800 km/s through ICM; bent radio jets indicate strong ram-pressure; active interstellar gas stripping',
      'radiation_factor':  2.8,
      'metallicity_feh':   0.15,
      'agn':               False,
      'cooling_flow':      False,
      'ram_pressure':      True,
      'merger':            False,
    },
    'placement_notes': {
      'v0': (
        'Two systems in NGC1265 stellar body — the head-tail radio galaxy. '
        'Moving at ~1800 km/s through Perseus ICM — ram pressure strips all '
        'interstellar gas behind the galaxy (the "tail"). Stellar body (the "head") '
        'is compact and shielded, but outer planetary orbits are at risk of disruption. '
        'Systems placed in inner stellar body only; outer zone flagged as disrupted. '
        'Elevated ICM radiation from high-speed passage through hot gas.'
      ),
      'open_questions': [
        'At 1800 km/s does the ICM ram-pressure wind perturb outer planetary orbits directly?',
        'The bent jets indicate AGN — is the AGN active enough to add radiation loading?',
        'Post-stripping: will NGC1265 retain any interstellar dust/gas for next star formation?',
      ],
      'nft_zones': [
        'inner-head-zone (shielded compact stellar body)',
        'tail-zone-theoretical (stripped region — disrupted orbits, no settlement)',
      ],
    },
    'generation': 'v0-hand',
    'star_systems': [
      {
        'id': 'ngc1265-s001', 'label': 'Perseus Head-Tail Station Alpha',
        'spectral_type': 'K3V', 'mass_sol': 0.79, 'feh': 0.14, 'age_gyr': 10.8,
        'luminosity_sol': 0.38, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'Inner head zone; shielded by stellar body from ICM wind; moderate ICM X-ray',
        'planets': [
          { 'id': 'ngc1265-s001-b', 'label': 'Head-Tail Station I',
            'type': 'rocky_barren', 'radius_earth': 0.95, 'mass_earth': 0.90,
            'period_days': 48, 'semi_major_au': 0.22, 'eq_temp_k': 500,
            'atmosphere': 'thin_co2', 'settlement_tier': 'theoretical' },
          { 'id': 'ngc1265-s001-c', 'label': 'Head-Tail Station II',
            'type': 'super_earth', 'radius_earth': 1.42, 'mass_earth': 3.8,
            'period_days': 295, 'semi_major_au': 0.85, 'eq_temp_k': 268,
            'atmosphere': 'n2_co2', 'settlement_tier': 'theoretical',
            'notes': 'Inner head zone — protected from ICM wind; most promising world in this head-tail galaxy; '
                     'outer orbit stability uncertain given 1800 km/s motion through cluster' },
        ],
      },
      {
        'id': 'ngc1265-s002', 'label': 'Perseus Head-Tail Station Beta',
        'spectral_type': 'M1V', 'mass_sol': 0.55, 'feh': 0.10, 'age_gyr': 10.0,
        'luminosity_sol': 0.07, 'coord_system': 'exo-surface-v1',
        'settlement_tier': 'theoretical',
        'environment_note': 'M-dwarf in compact inner head; ICM ram-pressure wind strips outer zone',
        'planets': [
          { 'id': 'ngc1265-s002-b', 'label': 'Head-Tail Beta I',
            'type': 'rocky_barren', 'radius_earth': 0.80, 'mass_earth': 0.55,
            'period_days': 22, 'semi_major_au': 0.085, 'eq_temp_k': 258,
            'atmosphere': 'trace', 'settlement_tier': 'theoretical',
            'notes': 'ICM ram-pressure may be gradually stripping even this inner atmosphere; '
                     'orbit marked as ram-pressure-disrupted at > 5 AU' },
        ],
      },
    ],
  },
]


# ── Write helpers ──────────────────────────────────────────────────────────────

def write_galaxy(entry: dict, dry_run: bool = False) -> dict:
    slug    = entry['cluster_slug']
    gal_id  = entry['galaxy_id']
    out_dir = OUTPUT_DIR / slug
    path    = out_dir / f'{gal_id}.json'
    n_sys   = len(entry['star_systems'])
    n_pl    = sum(len(s['planets']) for s in entry['star_systems'])

    if dry_run:
        print(f'  [dry-run] {slug}/{gal_id}.json  '
              f'({n_sys} systems, {n_pl} planets, env={entry["environment"]["description"][:50]}…)')
        return {'slug': slug, 'galaxy_id': gal_id, 'systems': n_sys, 'planets': n_pl, 'path': str(path)}

    out_dir.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(entry, indent=2, ensure_ascii=False))
    print(f'  ✓ {slug}/{gal_id}.json  ({n_sys} systems, {n_pl} planets)')
    return {'slug': slug, 'galaxy_id': gal_id, 'galaxy_name': entry['galaxy_name'],
            'systems': n_sys, 'planets': n_pl, 'path': str(path)}


def write_index(index_entries: list[dict], dry_run: bool = False) -> None:
    # Group by cluster
    by_cluster: dict[str, list] = {}
    for e in index_entries:
        by_cluster.setdefault(e['slug'], []).append({
            'galaxy_id':   e['galaxy_id'],
            'galaxy_name': e.get('galaxy_name', ''),
            'systems':     e['systems'],
            'planets':     e['planets'],
        })
    index = {
        'version':    'v0',
        'generated':  'hand-designed v0 anchor systems',
        'clusters':   by_cluster,
    }
    path = OUTPUT_DIR / 'index.json'
    if dry_run:
        print(f'  [dry-run] index.json  ({len(index_entries)} galaxies across {len(by_cluster)} clusters)')
        return
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(index, indent=2, ensure_ascii=False))
    print(f'  ✓ index.json  ({len(index_entries)} galaxies across {len(by_cluster)} clusters)')


# ── CLI ────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description='Generate v0 named-anchor star systems for extragalactic cluster galaxies')
    parser.add_argument('--cluster',  metavar='SLUG', help='Filter by cluster slug (partial match)')
    parser.add_argument('--galaxy',   metavar='ID',   help='Filter by galaxy ID (partial match)')
    parser.add_argument('--list',     action='store_true', help='List all v0 entries without writing')
    parser.add_argument('--dry-run',  action='store_true', help='Preview output without writing files')
    args = parser.parse_args()

    entries = list(V0_STARSYSTEMS)

    if args.cluster:
        q = args.cluster.lower()
        entries = [e for e in entries if q in e['cluster_slug']]
    if args.galaxy:
        q = args.galaxy.lower()
        entries = [e for e in entries if q in e['galaxy_id'].lower() or q in e['galaxy_name'].lower()]

    if args.list:
        print(f'\nv0 star system entries ({len(entries)} galaxies):')
        for e in entries:
            n_sys = len(e['star_systems'])
            n_pl  = sum(len(s['planets']) for s in e['star_systems'])
            flags = []
            env = e['environment']
            if env.get('agn'):          flags.append('AGN')
            if env.get('cooling_flow'): flags.append('CF')
            if env.get('ram_pressure'): flags.append('RP')
            flagstr = f"  [{', '.join(flags)}]" if flags else ''
            print(f'  {e["cluster_slug"]:<20} {e["galaxy_id"]:<12} {e["galaxy_name"]:<30} '
                  f'{n_sys} sys / {n_pl} pl{flagstr}')
        print()
        return

    print(f'\nGenerating v0 star systems ({len(entries)} galaxies)…\n')
    results = [write_galaxy(e, dry_run=args.dry_run) for e in entries]
    print()
    write_index(results, dry_run=args.dry_run)
    print(f'\nDone. {sum(r["systems"] for r in results)} systems, '
          f'{sum(r["planets"] for r in results)} planets written.')


if __name__ == '__main__':
    main()
