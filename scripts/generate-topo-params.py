#!/usr/bin/env python3
"""
generate-topo-params.py

Derives synthetic topographic parameters for every exoplanet (and a
proxy entry for each confirmed moon system) from the NASA Exoplanet
Archive snapshot in public/exoplanets-viz.json.

Output: public/topo-params.json  — a dict keyed by pl_name.

The renderer (SurfaceViewPage + buildTerrainGeometry) reads this file
to create unique, physically motivated terrain for each world instead
of the current temperature-only roughness lookup.

Scientific derivation
──────────────────────
  bulk_density   = pl_dens (archive) OR (pl_bmasse / pl_rade³) × ρ⊕   (g/cm³)
  surface_grav   = (pl_bmasse / pl_rade²) × g⊕                         (m/s²)
  luminosity     = 10^st_lum × L☉ (if archive) ELSE st_rad² × (st_teff/T☉)⁴
  insolation     = luminosity / pl_orbsmax²                             (S⊕)
  tidal_heat     ∝ ecc² / (orbsmax^6 × pl_rade³)
  age_factor     = st_age (Gyr) — older star → preserved craters, stable surface
  metallicity    = st_met ([Fe/H]) — iron-rich star → denser/rockier planets

Confirmed atmospheric overrides
────────────────────────────────
  Hardcoded JWST + HST detection records for ~25 planets override the
  inferred composition string. Sources: NASA Exoplanet Archive Atmospheric
  Spectroscopy Table, JWST ERS/Cycle1/Cycle2 papers (2022–2026).

New 2026 surface types (from direct JWST surface spectroscopy)
───────────────────────────────────────────────────────────────
  basalt       — dark iron-Mg volcanic rock, no/thin atmosphere (LHS 3844 b)
  magma_ocean  — liquid silicate surface + volatile CO/CO2 atmosphere (55 Cnc e)
  hycean       — deep H2O ocean under H2-rich envelope (K2-18 b)
"""

import json
import math
import hashlib
import sys
from pathlib import Path

# ── Physical constants / reference values ─────────────────────────────────────
EARTH_DENSITY_G_CM3  = 5.514
EARTH_GRAV_M_S2      = 9.807
EARTH_RADIUS_M       = 6.371e6
EARTH_MASS_KG        = 5.972e24
G                    = 6.674e-11

SUN_TEFF             = 5778.0   # K
SUN_RAD              = 1.0      # R☉
EARTH_INSOL          = 1.0      # S⊕ reference

TIDALLY_LOCKED_DAY   = 10.0     # days ≤ this → likely locked
TIDAL_HEAT_ECC_THRESH = 0.05
HOT_WORLD_EQT        = 600      # K
LAVA_WORLD_EQT       = 1400     # K
FROZEN_EQT           = 180      # K

# ── Confirmed atmospheric detections (JWST / HST, 2022–2026) ─────────────────
# Overrides inferred atmosphere.composition for known characterised planets.
# Sources:
#   WASP-39b  — JWST ERS (Alderson+2023, Rustamkulov+2023, Taylor+2023)
#   WASP-80b  — Bell+2023 (JWST NIRCam), CH4 + H2O
#   WASP-107b — Dyrek+2024 (JWST MIRI): SO2, H2O, CO2, CO, CH4
#   HD189733b — Fu+2024 (JWST): H2O, CO2, CO, H2S
#   HAT-P-12b — A&A 2025: CO2, CO, H2O
#   K2-18b    — Madhusudhan+2023 (JWST): CO2, CH4; possible DMS (tentative)
#   VHS1256b  — Miles+2023 (JWST): CO2, CH4, H2O, silicates, 13CO
#   55Cnce    — Hu+2024 (JWST MIRI): CO/CO2 volatile atmosphere + magma ocean
#   LHS3844b  — Zieba+2026 (JWST MIRI): basalt surface, NO atmosphere
#   TOI-561b  — JWST 2025: volcanic/magma outgassing tentative
#   TRAPPIST-1c — Zieba+2023: NO thick CO2
#   TRAPPIST-1e — Lim+2025: NO/thin atmosphere
#   HATS-75b  — Apr 2026 arXiv: CH4 tentative (M-dwarf host)
CONFIRMED_ATMOSPHERES: dict[str, dict] = {
    "WASP-39 b": {
        "composition": "CO2/SO2/H2O/CO/H2S",
        "factor": 0.95, "greenhouse": 0.80, "escape_rate": 0.02,
        "detected_molecules": ["CO2", "SO2", "H2O", "CO", "H2S"],
        "source": "JWST ERS 2022-23",
    },
    "WASP-80 b": {
        "composition": "CH4/H2O",
        "factor": 0.90, "greenhouse": 0.65, "escape_rate": 0.03,
        "detected_molecules": ["CH4", "H2O"],
        "source": "JWST NIRCam Bell+2023",
    },
    "WASP-107 b": {
        "composition": "SO2/CH4/H2O/CO2/CO",
        "factor": 0.88, "greenhouse": 0.70, "escape_rate": 0.04,
        "detected_molecules": ["SO2", "CH4", "H2O", "CO2", "CO"],
        "source": "JWST MIRI Dyrek+2024",
    },
    "HD 189733 b": {
        "composition": "H2O/CO2/CO/H2S",
        "factor": 0.92, "greenhouse": 0.75, "escape_rate": 0.03,
        "detected_molecules": ["H2O", "CO2", "CO", "H2S"],
        "source": "JWST Fu+2024",
    },
    "HAT-P-12 b": {
        "composition": "CO2/CO/H2O",
        "factor": 0.85, "greenhouse": 0.68, "escape_rate": 0.05,
        "detected_molecules": ["CO2", "CO", "H2O"],
        "source": "A&A 2025",
    },
    "K2-18 b": {
        "composition": "CO2/CH4/H2O(ocean)",
        "factor": 0.80, "greenhouse": 0.55, "escape_rate": 0.06,
        "detected_molecules": ["CO2", "CH4"],
        "tentative": ["DMS"],
        "source": "JWST Madhusudhan+2023",
    },
    "VHS 1256 b": {
        "composition": "CO2/CH4/H2O/silicates",
        "factor": 0.95, "greenhouse": 0.72, "escape_rate": 0.01,
        "detected_molecules": ["CO2", "CH4", "H2O"],
        "source": "JWST Miles+2023",
    },
    "55 Cnc e": {
        "composition": "CO/CO2(magma-volcanic)",
        "factor": 0.45, "greenhouse": 0.50, "escape_rate": 0.30,
        "detected_molecules": ["CO", "CO2"],
        "source": "JWST MIRI Hu+2024",
    },
    "LHS 3844 b": {
        "composition": "none(bare-basalt)",
        "factor": 0.00, "greenhouse": 0.00, "escape_rate": 0.99,
        "detected_molecules": [],
        "source": "JWST MIRI Zieba+2026 — basalt surface confirmed",
    },
    "TOI-561 b": {
        "composition": "CO/CO2(volcanic-tentative)",
        "factor": 0.25, "greenhouse": 0.30, "escape_rate": 0.55,
        "detected_molecules": ["CO", "CO2"],
        "source": "JWST 2025 tentative",
    },
    "TRAPPIST-1 c": {
        "composition": "none(thin-rocky)",
        "factor": 0.04, "greenhouse": 0.02, "escape_rate": 0.92,
        "detected_molecules": [],
        "source": "JWST MIRI Zieba+2023 — no thick CO2",
    },
    "TRAPPIST-1 e": {
        "composition": "none(thin-or-absent)",
        "factor": 0.05, "greenhouse": 0.02, "escape_rate": 0.90,
        "detected_molecules": [],
        "source": "JWST Lim+2025",
    },
    "HATS-75 b": {
        "composition": "CH4/H2(tentative)",
        "factor": 0.88, "greenhouse": 0.55, "escape_rate": 0.04,
        "detected_molecules": ["CH4"],
        "tentative": ["H2"],
        "source": "JWST Apr 2026 arXiv",
    },
    "HD 209458 b": {
        "composition": "H2O/Na/K/He",
        "factor": 0.95, "greenhouse": 0.78, "escape_rate": 0.04,
        "detected_molecules": ["H2O", "Na", "K", "He"],
        "source": "HST/HST STIS historic + Hubble WFC3",
    },
    "WASP-121 b": {
        "composition": "H2O/Fe/Ti/V",
        "factor": 0.98, "greenhouse": 0.82, "escape_rate": 0.06,
        "detected_molecules": ["H2O", "Fe", "Ti", "V"],
        "source": "HST Mikal-Evans+2022 + ground-based",
    },
    "GJ 1214 b": {
        "composition": "H2O/haze(thick)",
        "factor": 0.75, "greenhouse": 0.60, "escape_rate": 0.12,
        "detected_molecules": ["H2O"],
        "source": "Hubble WFC3 Kreidberg+2014 — flat spectrum/thick haze",
    },
    "GJ 3470 b": {
        "composition": "H2/He/H2O",
        "factor": 0.70, "greenhouse": 0.50, "escape_rate": 0.14,
        "detected_molecules": ["H2O"],
        "source": "HST+Spitzer",
    },
}

# Known special surface types from direct detection (overrides classifier)
CONFIRMED_SURFACES: dict[str, str] = {
    "LHS 3844 b":   "basalt",      # JWST MIRI direct surface spectroscopy 2026
    "55 Cnc e":     "magma_ocean", # JWST MIRI volatile atmosphere + magma ocean 2024
    "K2-18 b":      "hycean",      # Madhusudhan+2023 Hycean world candidate
    "TOI-561 b":    "lava",        # hot rocky lava world w/ outgassing
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def deterministic_seed(name: str) -> int:
    h = hashlib.sha256(name.encode()).digest()
    return int.from_bytes(h[:4], "big")

def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))

def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * clamp(t, 0, 1)

def hex_color(r: int, g: int, b: int) -> str:
    return "#{:02x}{:02x}{:02x}".format(
        clamp(int(r), 0, 255), clamp(int(g), 0, 255), clamp(int(b), 0, 255)
    )

def blend_hex(c1: tuple, c2: tuple, t: float) -> str:
    return hex_color(
        lerp(c1[0], c2[0], t),
        lerp(c1[1], c2[1], t),
        lerp(c1[2], c2[2], t),
    )

# ── Surface type classification ───────────────────────────────────────────────

def classify_surface(
    density: float,
    rade: float,
    bmasse: float,
    eqt: float | None,
    insol: float | None,
    orbsmax: float | None,
    st_met: float | None,   # [Fe/H] metallicity
) -> str:
    """
    Returns one of:
      gas_giant | hot_gas_giant | sub_neptune | hycean | super_earth |
      rocky | iron_rocky | basalt | magma_ocean | lava | ocean |
      frozen_rocky | desert | icy | unknown
    """
    r  = max(rade,   0.01)
    m  = max(bmasse, 0.01)
    d  = max(density, 0.001)
    t  = eqt or 400.0
    fe = st_met or 0.0   # [Fe/H]; 0 = solar

    # Gas giant: very large OR extremely low density
    if r > 5.0 or d < 0.8:
        return "hot_gas_giant" if t > HOT_WORLD_EQT else "gas_giant"

    # Sub-Neptune / mini-Neptune
    if r > 1.7 and d < 3.5:
        # Hycean candidate: temperate + low-density sub-Neptune
        if 250 < t < 450 and insol and 0.3 < insol < 3.0:
            return "hycean"
        return "sub_neptune"

    # Super-Earth range
    if r > 1.3 and d >= 3.5:
        if t > LAVA_WORLD_EQT:
            return "lava"
        if t < FROZEN_EQT:
            return "icy"
        return "super_earth"

    # Earth-radius rocky
    if d >= 6.0 or (d >= 5.0 and fe > 0.2):
        # Iron-enriched: high density or metal-rich host
        if t > LAVA_WORLD_EQT:
            return "magma_ocean"
        if t > HOT_WORLD_EQT:
            return "lava"
        return "iron_rocky"

    if d >= 3.5:
        if t > LAVA_WORLD_EQT:
            return "lava"
        if t < FROZEN_EQT:
            return "frozen_rocky"
        if insol and 0.85 <= insol <= 1.8:
            return "ocean"
        if t > HOT_WORLD_EQT:
            return "desert"
        return "rocky"

    # Low-density small world
    if d < 3.5 and d >= 1.5:
        return "icy" if t < 273 else "ocean"

    # Fallback
    if t > LAVA_WORLD_EQT:
        return "lava"
    if t < FROZEN_EQT:
        return "icy"
    return "unknown"

# ── Atmosphere ────────────────────────────────────────────────────────────────

def derive_atmosphere(
    name: str,
    surface_type: str,
    rade: float,
    bmasse: float,
    eqt: float | None,
    st_teff: float | None,
    orbsmax: float | None,
    insol: float | None,
    st_age: float | None,
) -> dict:
    # Use confirmed detection if available
    if name in CONFIRMED_ATMOSPHERES:
        conf = CONFIRMED_ATMOSPHERES[name].copy()
        # Carry over the detected_molecules / tentative / source fields as metadata
        return conf

    grav   = (bmasse / rade**2) if rade > 0 else 1.0
    age_gy = st_age or 4.5   # default to ~solar-age

    if surface_type in ("gas_giant", "hot_gas_giant"):
        return {"composition": "H2/He",     "factor": 1.0,  "greenhouse": 0.85, "escape_rate": 0.02}
    if surface_type == "sub_neptune":
        return {"composition": "H2/He/H2O", "factor": 0.90, "greenhouse": 0.70, "escape_rate": 0.08}
    if surface_type == "hycean":
        return {"composition": "H2/H2O",    "factor": 0.80, "greenhouse": 0.55, "escape_rate": 0.06}
    if surface_type == "magma_ocean":
        return {"composition": "CO/CO2(magma)", "factor": 0.45, "greenhouse": 0.50, "escape_rate": 0.30}
    if surface_type == "basalt":
        return {"composition": "none",       "factor": 0.00, "greenhouse": 0.00, "escape_rate": 0.99}

    # Stellar UV proxy (XUV flux ∝ T☉^4, elevated for young stars)
    uv_base  = ((st_teff or SUN_TEFF) / SUN_TEFF) ** 4
    # Young stars (<1 Gyr) emit 10–100× more XUV
    age_uv   = max(1.0, 8.0 - age_gy) / 1.0   # scales from 8 at 0 Gyr → 1 at 7 Gyr
    uv_proxy = uv_base * age_uv

    v_esc_rel    = math.sqrt(max(bmasse / rade, 0.01))
    escape_rate  = clamp(uv_proxy * 0.20 / max(v_esc_rel, 0.1), 0.0, 0.95)
    if insol and insol > 100:
        escape_rate = clamp(escape_rate + (insol - 100) / 2000, 0.0, 0.97)

    base_factor = clamp(v_esc_rel * 0.5 - escape_rate * 0.3, 0.0, 1.0)

    if surface_type == "lava":
        return {"composition": "SiO/SO2/CO",  "factor": 0.55, "greenhouse": 0.50, "escape_rate": escape_rate}
    if surface_type in ("icy", "frozen_rocky"):
        return {"composition": "CO2/N2",       "factor": max(0.05, base_factor * 0.3), "greenhouse": 0.10, "escape_rate": clamp(escape_rate * 0.7, 0, 0.9)}
    if surface_type == "ocean":
        return {"composition": "N2/O2/H2O",   "factor": clamp(base_factor, 0.3, 0.9), "greenhouse": 0.35, "escape_rate": escape_rate}

    t = eqt or 400.0
    if t > 400:  comp, gh = "CO2/SO2", 0.45
    elif t > 250: comp, gh = "CO2/N2",  0.30
    else:         comp, gh = "N2/CO2",  0.15

    return {"composition": comp, "factor": clamp(base_factor, 0.0, 0.85), "greenhouse": gh, "escape_rate": escape_rate}

# ── Tidal locking / heating ───────────────────────────────────────────────────

def tidal_factors(orbper, orbeccen, orbsmax, rade, sy_snum):
    locked    = orbper is not None and orbper < TIDALLY_LOCKED_DAY
    ecc       = orbeccen or 0.0
    a_au      = orbsmax  or 0.1
    if ecc > TIDAL_HEAT_ECC_THRESH and a_au < 1.0:
        heat = clamp((ecc**2 / (a_au**5 * max(rade, 0.5))) * 3.0, 0.0, 1.0)
    else:
        heat = 0.0
    binary = clamp((sy_snum - 1) * 0.25, 0.0, 0.7) if sy_snum > 1 else 0.0
    return locked, heat, binary

# ── Age-adjusted cratering ────────────────────────────────────────────────────

def age_crater_factor(st_age: float | None) -> float:
    """
    Older systems have had more time to accumulate impacts.
    But beyond ~8 Gyr, surface recycling may have erased them.
    Peak preservation: 2–6 Gyr.
    """
    age = st_age or 4.5
    if age < 0.5:  return 0.25   # very young — few accumulated impacts yet
    if age < 2.0:  return 0.60
    if age < 6.0:  return 1.00   # peak crater preservation
    if age < 9.0:  return 0.85   # slightly reduced (ongoing geological reset)
    return 0.70

# ── Metallicity → composition shift ──────────────────────────────────────────

def metallicity_density_shift(st_met: float | None, surface_type: str) -> float:
    """
    High [Fe/H] stars form iron-richer rocky planets.
    Returns a density adjustment fraction (additive) for classification tuning.
    Positive = denser, negative = lighter.
    """
    if surface_type in ("gas_giant", "hot_gas_giant", "sub_neptune", "hycean"):
        return 0.0
    met = st_met or 0.0
    # Each 0.1 dex of [Fe/H] above solar ~ +0.15 g/cm³ for rocky planets
    return clamp(met * 1.5, -2.0, 3.0)

# ── Volcanism ─────────────────────────────────────────────────────────────────

def volcanism_index(surface_type, tidal_heat, binary_stress, density, disc_year, eqt, st_age):
    if surface_type in ("gas_giant", "hot_gas_giant", "sub_neptune", "hycean"):
        return 0.05
    if surface_type in ("basalt",):
        # LHS 3844 b type: geologically dead OR recently resurfaced (ambiguous)
        return 0.10

    base = 0.10 + tidal_heat * 0.60 + binary_stress * 0.15

    d = density or EARTH_DENSITY_G_CM3
    if d > 5.0:  base += 0.10   # iron-rich → internal heat

    if surface_type in ("lava", "magma_ocean"):
        base = clamp(base + 0.45, 0.0, 1.0)

    # Young star → more residual heat, more volcanism
    age = st_age or 4.5
    if age < 1.0:  base += 0.25
    elif age < 3.0: base += 0.12

    return clamp(base, 0.0, 1.0)

# ── Impact cratering ──────────────────────────────────────────────────────────

def cratering_index(surface_type, atm_factor, volcanism, grav_rel, sy_pnum, orbsmax, st_age):
    if surface_type in ("gas_giant", "hot_gas_giant", "sub_neptune", "hycean", "magma_ocean"):
        return 0.02

    a    = orbsmax or 1.0
    base = clamp(0.60 / (a**0.5 + 0.2), 0.0, 0.80)
    base += clamp((sy_pnum - 1) * 0.04, 0.0, 0.20)
    base *= (1.0 - atm_factor * 0.55)
    base *= (1.0 - volcanism * 0.65)
    base *= clamp(grav_rel**0.25, 0.3, 1.5)
    base *= age_crater_factor(st_age)

    # Bare-rock worlds accumulate surface craters unimpeded
    if surface_type == "basalt":
        base = clamp(base + 0.20, 0.0, 1.0)

    return clamp(base, 0.0, 1.0)

# ── Tectonics ─────────────────────────────────────────────────────────────────

def tectonics_index(surface_type, density, grav_rel, tidal_heat, binary_stress, volcanism, st_met):
    if surface_type in ("gas_giant", "hot_gas_giant", "sub_neptune", "hycean"):
        return 0.0
    if surface_type == "basalt":
        return 0.05   # geologically quiet

    if surface_type in ("icy", "frozen_rocky"):
        return clamp(0.25 + tidal_heat * 0.40, 0.0, 0.85)

    d    = density or EARTH_DENSITY_G_CM3
    met  = st_met  or 0.0
    base = clamp(0.35 - (d - 4.0) * 0.05, 0.05, 0.60)
    base += tidal_heat * 0.20 + binary_stress * 0.10
    base += volcanism * 0.15
    # High-metallicity → silicate-rich mantle → more tectonic activity
    base += clamp(met * 0.08, 0.0, 0.15)
    base /= clamp(grav_rel ** 0.3 + 0.1, 0.3, 1.5)
    return clamp(base, 0.0, 1.0)

# ── Wind erosion ─────────────────────────────────────────────────────────────

def wind_erosion_index(atm_factor, insol, is_locked, eqt):
    if atm_factor < 0.05:
        return 0.0
    base = atm_factor * 0.50
    if insol:
        base += clamp(math.log10(max(insol, 0.01) + 1) * 0.12, 0.0, 0.35)
    if is_locked:
        base += 0.30   # terminator jet streams
    t = eqt or 400.0
    if t > 500:
        base += clamp((t - 500) / 3000, 0.0, 0.25)
    return clamp(base, 0.0, 1.0)

# ── Ice / dune / lava coverage ────────────────────────────────────────────────

def ice_coverage(surface_type, eqt, is_locked, atm_factor):
    if surface_type in ("gas_giant", "hot_gas_giant", "lava", "magma_ocean", "basalt", "desert"):
        return 0.0
    t = eqt or 300.0
    if surface_type in ("icy", "frozen_rocky"):
        return clamp(0.70 + (273 - t) / 500, 0.40, 1.0)
    if t < FROZEN_EQT:
        return clamp((FROZEN_EQT - t) / 200, 0.0, 0.90)
    if is_locked:
        return clamp((300 - t) / 300, 0.0, 0.30)
    return 0.0

def dune_coverage(surface_type, atm_factor, wind_erosion, eqt, cratering):
    if surface_type in ("gas_giant", "hot_gas_giant", "ocean", "icy", "hycean", "magma_ocean"):
        return 0.0
    t = eqt or 400.0
    if atm_factor < 0.05 or atm_factor > 0.85:
        return 0.0
    base = cratering * 0.3 + wind_erosion * 0.35
    if surface_type in ("desert", "basalt") or (350 < t < 900):
        base += 0.20
    return clamp(base, 0.0, 0.80)

def lava_coverage(surface_type, volcanism, eqt):
    if surface_type in ("lava", "magma_ocean"):
        t = eqt or 1500.0
        return clamp(volcanism * 0.70 + (t - 1000) / 4000, 0.20, 1.0)
    if volcanism > 0.60:
        return clamp((volcanism - 0.60) * 0.50, 0.0, 0.40)
    return 0.0

# ── Roughness ─────────────────────────────────────────────────────────────────

def terrain_roughness(surface_type, tectonics, volcanism, wind_erosion, cratering, eqt, grav_rel):
    t = eqt or 400.0
    type_base = {
        "gas_giant":    0.40, "hot_gas_giant": 0.35, "sub_neptune": 0.50,
        "hycean":       0.30, "lava":          1.65, "magma_ocean": 1.80,
        "basalt":       0.75, "icy":           0.65, "frozen_rocky": 0.90,
        "iron_rocky":   1.25, "rocky":         1.00, "super_earth":  1.10,
        "ocean":        0.30, "desert":        0.95, "unknown":      0.85,
    }.get(surface_type, 0.80)

    base  = type_base
    base += tectonics  * 0.55
    base += volcanism  * 0.45
    base -= wind_erosion * 0.30
    base += cratering  * 0.25
    base /= clamp(grav_rel ** 0.35, 0.4, 2.0)
    if t > LAVA_WORLD_EQT:
        base += 0.40

    return clamp(base, 0.30, 2.50)

# ── Canyon depth ─────────────────────────────────────────────────────────────

def canyon_depth_index(tectonics, wind_erosion, surface_type, eqt):
    if surface_type in ("gas_giant", "hot_gas_giant", "ocean", "hycean", "magma_ocean"):
        return 0.0
    base = tectonics * 0.55 + wind_erosion * 0.30
    t = eqt or 400.0
    if t > 800 or t < 100:
        base += 0.15
    return clamp(base, 0.0, 1.0)

# ── Space weathering (bare-rock worlds) ──────────────────────────────────────

def space_weathering(surface_type, atm_factor, st_age, orbsmax):
    """
    No atmosphere + old system + close-in orbit → heavy ion/UV darkening.
    Returns 0–1 where 1 = extreme space-weathered (very dark surface).
    Relevant for basalt, bare rocky worlds like LHS 3844 b.
    """
    if atm_factor > 0.10:
        return 0.0   # atmosphere protects surface
    age_gy  = st_age or 4.5
    dist_au = orbsmax or 0.5
    # Closer orbit + older system → more weathering
    return clamp((age_gy / 8.0) * (1.0 / max(dist_au, 0.01)) * 0.3, 0.0, 1.0)

# ── Color palette ─────────────────────────────────────────────────────────────

# (r, g, b) tuples
PALETTES = {
    "gas_giant":    { "terrain": (160, 130, 90),  "rock": (200, 160, 110), "special": (210, 180, 140), "emissive": None },
    "hot_gas_giant":{ "terrain": (140, 80,  20),  "rock": (180, 100, 30),  "special": (220, 130, 40),  "emissive": None },
    "sub_neptune":  { "terrain": (70,  100, 140),  "rock": (90,  130, 170), "special": (110, 160, 200), "emissive": None },
    "hycean":       { "terrain": (20,  80,  120),  "rock": (30,  110, 160), "special": (40,  150, 200), "emissive": None },
    "lava":         { "terrain": (100, 25,  8),   "rock": (180, 50,  10),  "special": (255, 80,  0),   "emissive": (180, 40,  0) },
    "magma_ocean":  { "terrain": (80,  15,  5),   "rock": (160, 40,  8),   "special": (255, 60,  0),   "emissive": (200, 50,  0) },
    "basalt":       { "terrain": (42,  38,  36),  "rock": (58,  52,  48),  "special": (30,  28,  26),  "emissive": None },
    "icy":          { "terrain": (140, 165, 200),  "rock": (160, 185, 220), "special": (200, 220, 245), "emissive": None },
    "frozen_rocky": { "terrain": (100, 120, 145),  "rock": (130, 150, 175), "special": (180, 195, 210), "emissive": None },
    "iron_rocky":   { "terrain": (110, 55,  30),  "rock": (150, 75,  40),  "special": (90,  40,  20),  "emissive": None },
    "rocky":        { "terrain": (105, 90,  70),  "rock": (140, 115, 90),  "special": (160, 130, 100), "emissive": None },
    "super_earth":  { "terrain": (90,  105, 70),  "rock": (120, 135, 95),  "special": (70,  110, 80),  "emissive": None },
    "ocean":        { "terrain": (30,  70,  110),  "rock": (60,  100, 140), "special": (20,  50,  90),  "emissive": None },
    "desert":       { "terrain": (140, 105, 55),  "rock": (165, 125, 70),  "special": (180, 145, 90),  "emissive": None },
    "unknown":      { "terrain": (85,  95,  110),  "rock": (110, 120, 135), "special": (70,  80,  95),  "emissive": None },
}

def fog_for_type(surface_type, atm_factor, eqt, terrain_rgb):
    t = eqt or 300.0
    if surface_type in ("gas_giant", "hot_gas_giant"):
        return ("#2e1a08", 0.00020) if t > HOT_WORLD_EQT else ("#0a1428", 0.00018)
    if surface_type == "sub_neptune":
        return ("#0c1830", 0.00022)
    if surface_type == "hycean":
        return ("#061220", 0.00014)
    if surface_type == "lava":
        return ("#4d1800", 0.00038)
    if surface_type == "magma_ocean":
        return ("#5a1000", 0.00045)
    if surface_type == "basalt":
        return ("#080808", 0.00020)   # near-vacuum, very faint scattering
    if surface_type in ("icy", "frozen_rocky"):
        return ("#101828", 0.00012)
    if surface_type in ("ocean", "hycean"):
        return ("#0a1520", 0.00015)
    if surface_type == "desert":
        r, g, b = terrain_rgb
        return (hex_color(r//3, g//4, b//5), clamp(atm_factor * 0.00030, 0.00010, 0.00025))
    fog_r = int(terrain_rgb[0] * 0.2)
    fog_g = int(terrain_rgb[1] * 0.15)
    fog_b = int(terrain_rgb[2] * 0.12)
    return (hex_color(fog_r, fog_g, fog_b), clamp(atm_factor * 0.00030, 0.00010, 0.00030))

def build_colors(surface_type, volcanism, ice_cov, lava_cov, space_weather, atm, eqt):
    t    = eqt or 300.0
    base = PALETTES.get(surface_type, PALETTES["unknown"])
    terrain = base["terrain"]
    rock    = base["rock"]
    special = base["special"]

    # Blend toward volcanic / lava colors
    if volcanism > 0.5 and surface_type not in ("gas_giant", "hot_gas_giant", "basalt"):
        lp = PALETTES["lava"]
        f  = (volcanism - 0.5) * 1.2
        terrain = tuple(int(lerp(terrain[i], lp["terrain"][i], f)) for i in range(3))
        rock    = tuple(int(lerp(rock[i],    lp["rock"][i],    f)) for i in range(3))
        special = tuple(int(lerp(special[i], lp["special"][i], f)) for i in range(3))

    # Blend toward ice
    if ice_cov > 0.3:
        ip = PALETTES["icy"]
        f  = (ice_cov - 0.3) / 0.7
        terrain = tuple(int(lerp(terrain[i], ip["terrain"][i], f * 0.6)) for i in range(3))

    # Space weathering darkens basalt / bare-rock surfaces
    if space_weather > 0.0:
        f = space_weather * 0.7
        terrain = tuple(int(lerp(terrain[i], max(terrain[i]-30, 10), f)) for i in range(3))
        rock    = tuple(int(lerp(rock[i],    max(rock[i]-30, 10),    f)) for i in range(3))

    fog_hex, fog_density = fog_for_type(surface_type, atm["factor"], t, terrain)

    emissive = None
    if base.get("emissive") and (volcanism > 0.3 or lava_cov > 0.1):
        emissive = hex_color(*base["emissive"])

    return {
        "terrain":     hex_color(*terrain),
        "rock":        hex_color(*rock),
        "special":     hex_color(*special),
        "fog":         fog_hex,
        "fog_density": round(fog_density, 6),
        "emissive":    emissive,
    }

# ── Noise parameters ──────────────────────────────────────────────────────────

def noise_params(seed, roughness, cratering, tectonics, volcanism, lava_cov,
                 is_locked, surface_type, eqt):
    t = eqt or 300.0

    low_amp  = clamp(roughness * 0.55 + tectonics * 0.30, 0.10, 1.80)
    low_freq = 0.010 + (1.0 - tectonics) * 0.005
    mid_amp  = clamp(roughness * 0.35 + volcanism * 0.20, 0.08, 1.20)
    mid_freq = 0.030 + volcanism * 0.015
    hi_amp   = clamp(roughness * 0.18 + cratering * 0.12, 0.03, 0.60)
    hi_freq  = 0.075 + cratering * 0.025

    crater_count = int(clamp(cratering * 48, 0, 50))
    crater_min   = clamp(3.0 + (1.0 - cratering) * 12.0, 2.0, 20.0)
    crater_max   = clamp(crater_min + roughness * 40 + 10, crater_min + 5, 120.0)
    crater_depth = clamp(0.4 + roughness * 0.3, 0.2, 0.95)

    # Basalt worlds can have very large ancient impact basins
    if surface_type == "basalt":
        crater_max = clamp(crater_max * 1.6, crater_min + 10, 200.0)

    ridge_count = int(clamp(tectonics * 8, 0, 10))
    ridge_sharp = clamp(0.4 + tectonics * 0.5, 0.1, 1.0)
    ridge_angle = 0.0 if is_locked else (seed % 360)

    vent_count   = int(clamp(volcanism * 14, 0, 16))
    lava_streams = int(clamp(lava_cov * 10, 0, 12))

    return {
        "seed":          seed,
        "low_freq_amp":  round(low_amp,  3), "low_freq":   round(low_freq, 4),
        "mid_freq_amp":  round(mid_amp,  3), "mid_freq":   round(mid_freq, 4),
        "hi_freq_amp":   round(hi_amp,   3), "hi_freq":    round(hi_freq,  4),
        "crater_count":  crater_count,
        "crater_size_min": round(crater_min, 1),
        "crater_size_max": round(crater_max, 1),
        "crater_depth":  round(crater_depth, 3),
        "ridge_count":   ridge_count,
        "ridge_sharpness": round(ridge_sharp, 3),
        "ridge_angle_deg": ridge_angle,
        "vent_count":    vent_count,
        "lava_stream_count": lava_streams,
    }

# ── Master derivation per planet ─────────────────────────────────────────────

def derive_topo(planet: dict) -> dict:
    name     = planet["pl_name"]
    rade     = planet.get("pl_rade")    or 1.0
    bmasse   = planet.get("pl_bmasse")  or rade ** 2.06
    eqt      = planet.get("pl_eqt")
    insol    = planet.get("pl_insol")
    orbper   = planet.get("pl_orbper")
    orbeccen = planet.get("pl_orbeccen")
    orbsmax  = planet.get("pl_orbsmax")
    st_teff  = planet.get("st_teff")
    st_rad   = planet.get("st_rad")
    st_age   = planet.get("st_age")     # Gyr — new field
    st_met   = planet.get("st_met")     # [Fe/H] — new field
    st_lum   = planet.get("st_lum")     # log(L/L☉) — new field
    pl_dens  = planet.get("pl_dens")    # g/cm³ — new field (archive-computed)
    sy_snum  = int(planet.get("sy_snum") or 1)
    sy_pnum  = int(planet.get("sy_pnum") or 1)
    disc_year = planet.get("disc_year")

    # Luminosity: archive value preferred over inference
    if st_lum is not None:
        luminosity = 10 ** st_lum                   # L☉ (st_lum is log10)
    elif st_rad and st_teff:
        luminosity = st_rad**2 * (st_teff / SUN_TEFF) ** 4
    else:
        luminosity = None

    if insol is None and luminosity and orbsmax and orbsmax > 0:
        insol = luminosity / orbsmax**2

    # Density: archive value preferred (more accurate)
    if pl_dens is not None:
        density = pl_dens
    else:
        vol_rel = rade ** 3
        density = (bmasse / max(vol_rel, 1e-6)) * EARTH_DENSITY_G_CM3

    grav_rel = bmasse / max(rade ** 2, 1e-4)

    # Metallicity-adjusted density for classification
    met_shift = metallicity_density_shift(st_met, "rocky")   # rough pre-classification
    adj_density = density + met_shift

    # Confirmed surface override
    if name in CONFIRMED_SURFACES:
        surface_type = CONFIRMED_SURFACES[name]
    else:
        surface_type = classify_surface(adj_density, rade, bmasse, eqt, insol, orbsmax, st_met)

    is_locked, tidal_heat, binary_stress = tidal_factors(orbper, orbeccen, orbsmax, rade, sy_snum)

    atm   = derive_atmosphere(name, surface_type, rade, bmasse, eqt, st_teff, orbsmax, insol, st_age)
    volc  = volcanism_index(surface_type, tidal_heat, binary_stress, density, disc_year, eqt, st_age)
    crat  = cratering_index(surface_type, atm["factor"], volc, grav_rel, sy_pnum, orbsmax, st_age)
    tect  = tectonics_index(surface_type, density, grav_rel, tidal_heat, binary_stress, volc, st_met)
    wind  = wind_erosion_index(atm["factor"], insol, is_locked, eqt)
    ice   = ice_coverage(surface_type, eqt, is_locked, atm["factor"])
    dune  = dune_coverage(surface_type, atm["factor"], wind, eqt, crat)
    lava  = lava_coverage(surface_type, volc, eqt)
    rough = terrain_roughness(surface_type, tect, volc, wind, crat, eqt, grav_rel)
    canyon = canyon_depth_index(tect, wind, surface_type, eqt)
    sw    = space_weathering(surface_type, atm["factor"], st_age, orbsmax)

    colors = build_colors(surface_type, volc, ice, lava, sw, atm, eqt)

    seed  = deterministic_seed(name)
    noise = noise_params(seed, rough, crat, tect, volc, lava, is_locked, surface_type, eqt)

    # Clean atmosphere dict for output (remove source/molecules from output if too large)
    atm_out = {k: (round(v, 3) if isinstance(v, float) else v)
               for k, v in atm.items()
               if k in ("composition", "factor", "greenhouse", "escape_rate")}

    return {
        "surface_type":     surface_type,
        "roughness":        round(rough,  3),
        "volcanism":        round(volc,   3),
        "cratering":        round(crat,   3),
        "tectonics":        round(tect,   3),
        "wind_erosion":     round(wind,   3),
        "ice_coverage":     round(ice,    3),
        "dune_coverage":    round(dune,   3),
        "lava_coverage":    round(lava,   3),
        "canyon_depth":     round(canyon, 3),
        "space_weathering": round(sw,     3),
        "tidal_locked":     is_locked,
        "tidal_heating":    round(tidal_heat,    3),
        "binary_stress":    round(binary_stress, 3),
        "surface_gravity":  round(grav_rel * EARTH_GRAV_M_S2, 2),
        "bulk_density":     round(density, 3),
        "insolation":       round(insol, 3) if insol else None,
        "stellar_age_gyr":  round(st_age, 2) if st_age else None,
        "stellar_met_feh":  round(st_met, 3) if st_met else None,
        "atm_confirmed":    name in CONFIRMED_ATMOSPHERES,
        "surface_confirmed": name in CONFIRMED_SURFACES,
        "atmosphere":       atm_out,
        "detected_molecules": CONFIRMED_ATMOSPHERES.get(name, {}).get("detected_molecules", None),
        "colors":           colors,
        "noise":            noise,
        "meta": {
            "pl_eqt":      eqt,
            "pl_rade":     rade,
            "pl_bmasse":   round(bmasse, 3),
            "pl_orbper":   orbper,
            "pl_orbeccen": orbeccen,
            "st_teff":     st_teff,
            "st_age":      st_age,
            "st_met":      st_met,
            "disc_year":   disc_year,
            "disc_method": planet.get("discoverymethod"),
        },
    }

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    repo_root = Path(__file__).parent.parent
    src_path  = repo_root / "public" / "exoplanets-viz.json"
    out_path  = repo_root / "public" / "topo-params.json"

    print(f"Loading {src_path} …")
    with src_path.open() as f:
        planets = json.load(f)

    print(f"Processing {len(planets)} planet records …")
    results: dict[str, dict] = {}
    type_counts: dict[str, int] = {}
    confirmed_atm  = 0
    confirmed_surf = 0
    errors = 0

    for p in planets:
        name = p.get("pl_name", "?")
        try:
            profile = derive_topo(p)
            results[name] = profile
            st = profile["surface_type"]
            type_counts[st] = type_counts.get(st, 0) + 1
            if profile["atm_confirmed"]:  confirmed_atm  += 1
            if profile["surface_confirmed"]: confirmed_surf += 1
        except Exception as ex:
            errors += 1
            if errors <= 10:
                print(f"  WARN {name}: {ex}")

    print(f"\nSurface type distribution:")
    for st, n in sorted(type_counts.items(), key=lambda x: -x[1]):
        bar = "█" * (n // 50)
        print(f"  {st:18s}  {n:5d}  {bar}")

    print(f"\nConfirmed atmospheric detections embedded : {confirmed_atm}")
    print(f"Confirmed surface types embedded          : {confirmed_surf}")
    print(f"Processing errors                         : {errors}")

    print(f"\nWriting {out_path} ({len(results)} entries) …")
    with out_path.open("w") as f:
        json.dump(results, f, separators=(",", ":"))

    size_kb = out_path.stat().st_size // 1024
    print(f"Done — {size_kb} KB")

    # Print a few sample profiles
    for sample in ["LHS 3844 b", "55 Cnc e", "K2-18 b", "WASP-39 b", "WASP-20 b"]:
        if sample in results:
            import pprint
            print(f"\n── {sample} ──────────────────────────────")
            r = results[sample]
            print(f"  surface_type      : {r['surface_type']}")
            print(f"  roughness         : {r['roughness']}")
            print(f"  volcanism         : {r['volcanism']}")
            print(f"  cratering         : {r['cratering']}")
            print(f"  atmosphere        : {r['atmosphere']['composition']}  (confirmed={r['atm_confirmed']})")
            print(f"  detected_molecules: {r['detected_molecules']}")
            print(f"  colors.terrain    : {r['colors']['terrain']}")
            print(f"  colors.fog        : {r['colors']['fog']}")
            print(f"  tidal_locked      : {r['tidal_locked']}")
            print(f"  stellar_age_gyr   : {r['stellar_age_gyr']}")

if __name__ == "__main__":
    main()
