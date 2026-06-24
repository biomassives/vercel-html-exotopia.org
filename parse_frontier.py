#!/usr/bin/env python3
"""
Hipparcos-based frontier exoplanet predictor → Exotopia app JSON

Usage:
    python3 parse_frontier.py [hipparcos_file]

Input:
    datagathering/hip_main.dat  (auto-downloaded if absent)
    public/exoplanets-viz.json  (existing confirmed planets for cross-match)

Output:
    public/frontier-exoplanets.json   predicted planets at unsurveyed nearby stars

The script draws predicted planet populations at Hipparcos stars that lack
confirmed exoplanets, using stellar-type-specific occurrence rates from
Fressin 2013 and Petigura 2018.  The RNG is seeded per HIP number so
all outputs are deterministic.
"""

import gzip
import json
import math
import os
import random
import sys
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OUTPUT_DIR     = Path('public')
CACHE_DIR      = Path('datagathering')
OUTPUT_FILE    = OUTPUT_DIR / 'frontier-exoplanets.json'
VIZ_FILE       = OUTPUT_DIR / 'exoplanets-viz.json'

HIP_LOCAL_NAMES = ['hip_main.dat', 'hipparcos.dat']
HIP_URL         = 'https://cdsarc.cds.unistra.fr/ftp/I/239/hip_main.dat.gz'

NFT_CAP         = 30_000   # hard frontier cap from spec (full detail file)
VIZ_RENDER_CAP  =  5_000   # slim viz file — nearest stars only, ~2 MB, opt-in loaded

# Occurrence rates (mean planets per star) — Fressin 2013 + Petigura 2018
MEAN_PLANETS = {'A': 0.6, 'F': 0.9, 'G': 1.1, 'K': 1.3, 'M': 1.8}

# Mission zone bounding boxes: (id, ra_min, ra_max, dec_min, dec_max)
MISSION_ZONES = [
    ('roman-zone',  260, 273, -32, -26),
    ('plato-1',     243, 264,  54,  66),
    ('plato-2',      83, 104, -36, -24),
]

# ---------------------------------------------------------------------------
# Stellar physics helpers
# ---------------------------------------------------------------------------

def bv_to_teff(bv: float) -> int:
    """Approximate Teff from B-V (Sekiguchi & Fukugita 2000, simplified)."""
    if bv < 0.3:  return 9000   # A
    if bv < 0.58: return 6500   # F
    if bv < 0.74: return 5800   # G  (Sun ≈ 0.65 → 5778 K)
    if bv < 1.15: return 4500   # K
    return 3500                  # M


def teff_to_spectype(teff: int) -> str:
    """Spectral type letter from effective temperature."""
    if teff >= 7500: return 'A'
    if teff >= 6000: return 'F'
    if teff >= 5200: return 'G'
    if teff >= 3700: return 'K'
    return 'M'


def teff_to_mass(teff: int) -> float:
    """Solar-mass estimate (main-sequence approximation)."""
    return (teff / 5778) ** 2.5


def teff_to_lum(teff: int) -> float:
    """Bolometric luminosity in solar units."""
    return (teff / 5778) ** 4


# ---------------------------------------------------------------------------
# Coordinate helpers
# ---------------------------------------------------------------------------

def eq_to_gal(ra_deg: float, dec_deg: float):
    """
    Convert equatorial (J2000) to galactic coordinates.
    Uses the IAU 1958 rotation constants.
    Returns (glon, glat) in degrees.
    """
    ra      = math.radians(ra_deg)
    dec     = math.radians(dec_deg)
    ra_ngp  = math.radians(192.859508)
    dec_ngp = math.radians(27.128336)
    l_ncp   = math.radians(122.932)

    sinb = (math.sin(dec) * math.sin(dec_ngp)
            + math.cos(dec) * math.cos(dec_ngp) * math.cos(ra - ra_ngp))
    b    = math.degrees(math.asin(max(-1.0, min(1.0, sinb))))

    cosb = math.cos(math.radians(b))
    cosl = (math.sin(dec) - math.sin(dec_ngp) * sinb) / (math.cos(dec_ngp) * cosb + 1e-12)
    sinl = math.cos(dec) * math.sin(ra - ra_ngp) / (cosb + 1e-12)
    l    = math.degrees(math.atan2(sinl, cosl))
    l    = (math.degrees(l_ncp) - l) % 360

    return round(l, 4), round(b, 4)


def angular_sep(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """Haversine angular separation in degrees."""
    dra  = math.radians(ra2 - ra1)
    ddec = math.radians(dec2 - dec1)
    a    = (math.sin(ddec / 2) ** 2
            + math.cos(math.radians(dec1)) * math.cos(math.radians(dec2)) * math.sin(dra / 2) ** 2)
    return math.degrees(2 * math.asin(math.sqrt(min(1.0, a))))


# ---------------------------------------------------------------------------
# Step 1: Load existing confirmed planet positions
# ---------------------------------------------------------------------------

def load_confirmed_positions(viz_path: Path):
    """
    Return a list of (ra, dec) for confirmed planet hosts and a set of
    rounded (ra, dec) tuples for fast proximity rejection.
    """
    print(f'Loading confirmed planets from {viz_path} ...')
    with open(viz_path, encoding='utf-8') as f:
        records = json.load(f)

    positions = []
    for r in records:
        ra  = r.get('ra')
        dec = r.get('dec')
        if ra is not None and dec is not None:
            positions.append((float(ra), float(dec)))

    print(f'  {len(positions)} confirmed planet host positions loaded.')
    return positions


def is_known(ra: float, dec: float, known_positions: list, threshold: float = 0.05) -> bool:
    """Return True if (ra, dec) is within threshold° of any known planet host."""
    for kra, kdec in known_positions:
        if abs(dec - kdec) > threshold + 1:
            continue
        if angular_sep(ra, dec, kra, kdec) < threshold:
            return True
    return False


# ---------------------------------------------------------------------------
# Step 2: Load Hipparcos catalog
# ---------------------------------------------------------------------------

def parse_hip_fixed_width(lines) -> list[dict]:
    """
    Parse the Hipparcos main catalog fixed-width format.

    Key column byte ranges (1-based, inclusive → Python 0-based slices):
      HIP:      9-14   → [8:14]
      Vmag:    42-46   → [41:46]
      RA deg:  52-63   → [51:63]
      Dec deg: 65-76   → [64:76]
      Parallax:80-86   → [79:86]
      B-V:    246-251  → [245:251]
    """
    stars = []
    for raw in lines:
        line = raw if isinstance(raw, str) else raw.decode('latin-1')
        if len(line) < 252:
            continue

        try:
            hip   = int(line[8:14].strip())
            ra    = float(line[51:63].strip())
            dec   = float(line[64:76].strip())
            plx   = float(line[79:86].strip())
        except (ValueError, IndexError):
            continue

        vmag_s = line[41:46].strip()
        bv_s   = line[245:251].strip()

        vmag = float(vmag_s) if vmag_s else None
        bv   = float(bv_s)   if bv_s   else None

        stars.append({'hip': hip, 'ra': ra, 'dec': dec, 'plx': plx, 'vmag': vmag, 'bv': bv})

    return stars


def load_hipparcos(hip_arg: str | None) -> list[dict]:
    """
    Load Hipparcos catalog from (in order of preference):
      1. Explicit path from command-line argument
      2. Local cache files in datagathering/
      3. astroquery VizieR download
      4. Direct URL download (cached locally)
      5. Synthetic 500-star stub for testing
    """
    CACHE_DIR.mkdir(exist_ok=True)

    # ── 1. Explicit argument ────────────────────────────────────────────────
    if hip_arg:
        path = Path(hip_arg)
        if path.exists():
            print(f'Using Hipparcos file from argument: {path}')
            with open(path, 'r', encoding='latin-1') as f:
                return parse_hip_fixed_width(f.readlines())
        else:
            print(f'  WARNING: specified path {path} not found — trying other sources.')

    # ── 2. Local cache ──────────────────────────────────────────────────────
    for name in HIP_LOCAL_NAMES:
        path = CACHE_DIR / name
        if path.exists():
            print(f'Using cached Hipparcos file: {path}')
            with open(path, 'r', encoding='latin-1') as f:
                stars = parse_hip_fixed_width(f.readlines())
            print(f'  Parsed {len(stars)} Hipparcos entries.')
            return stars

    # ── 3. astroquery ───────────────────────────────────────────────────────
    try:
        from astroquery.vizier import Vizier
        print('Downloading Hipparcos catalog via astroquery ...')
        Vizier.ROW_LIMIT = -1
        tables = Vizier.get_catalogs('I/239/hip_main')
        tbl    = tables[0]
        stars  = []

        # VizieR I/239/hip_main column names (confirmed 2024)
        ra_col  = next((c for c in ('RAICRS', 'RAdeg', 'RArad') if c in tbl.colnames), None)
        dec_col = next((c for c in ('DEICRS', 'DEdeg', 'DErad') if c in tbl.colnames), None)
        if not ra_col or not dec_col:
            raise ValueError(f'RA/Dec columns not found; got: {tbl.colnames[:10]}')

        for row in tbl:
            try:
                hip  = int(row['HIP'])
                ra   = float(row[ra_col])
                dec  = float(row[dec_col])
                plx  = float(row['Plx'])
                vmag = float(row['Vmag']) if row['Vmag'] is not None else None
                bv   = float(row['B-V'])  if row['B-V']  is not None else None
            except (KeyError, TypeError, ValueError):
                continue

            if ra_col == 'RArad':
                ra  = math.degrees(ra)
                dec = math.degrees(dec)

            stars.append({'hip': hip, 'ra': ra, 'dec': dec, 'plx': plx, 'vmag': vmag, 'bv': bv})

        print(f'  astroquery returned {len(stars)} entries.')
        return stars

    except ImportError:
        print('  astroquery not available — skipping VizieR download.')
    except Exception as exc:
        print(f'  astroquery failed ({exc}) — falling back to direct download.')

    # ── 4. Direct URL download ──────────────────────────────────────────────
    gz_path  = CACHE_DIR / 'hip_main.dat.gz'
    dat_path = CACHE_DIR / 'hip_main.dat'
    try:
        print(f'Downloading Hipparcos from {HIP_URL} ...')
        print('  (This is ~14 MB compressed — please wait.)')
        urllib.request.urlretrieve(HIP_URL, gz_path)
        print(f'  Downloaded to {gz_path}')

        with gzip.open(gz_path, 'rb') as gf, open(dat_path, 'wb') as out:
            out.write(gf.read())
        gz_path.unlink()

        with open(dat_path, 'r', encoding='latin-1') as f:
            stars = parse_hip_fixed_width(f.readlines())
        print(f'  Parsed {len(stars)} Hipparcos entries — cached at {dat_path}')
        return stars

    except Exception as exc:
        print(f'  Direct download failed ({exc}) — using synthetic stub.')

    # ── 5. Synthetic fallback stub ──────────────────────────────────────────
    print('Generating synthetic 500-star Hipparcos stub (test mode).')
    rng_stub = random.Random(42)
    stars    = []
    # Populate sparse sky zones with random stars
    zones = [
        (0, 60, -90, -30), (180, 240, -90, -30),
        (0, 360, 60, 90),  (120, 180, -60, 60),
        (300, 360, -60, 60),
    ]
    for i in range(500):
        zone = zones[i % len(zones)]
        ra   = rng_stub.uniform(zone[0], zone[1])
        dec  = rng_stub.uniform(zone[2], zone[3])
        plx  = rng_stub.uniform(5, 200)    # 5–200 mas → 5–200 pc
        vmag = rng_stub.uniform(3, 9)
        bv   = rng_stub.uniform(0.3, 1.8)
        stars.append({'hip': 900000 + i, 'ra': ra, 'dec': dec,
                      'plx': plx, 'vmag': vmag, 'bv': bv})
    return stars


# ---------------------------------------------------------------------------
# Step 3: Filter stars
# ---------------------------------------------------------------------------

def filter_stars(stars: list[dict], known_positions: list) -> list[dict]:
    """
    Apply distance, colour, absolute-magnitude, and cross-match filters.
    Returns the surviving candidate list with derived properties attached.
    """
    n_total       = len(stars)
    n_dist        = 0
    n_crossmatch  = 0
    n_spectral    = 0
    surviving     = []

    for s in stars:
        plx  = s['plx']
        ra   = s['ra']
        dec  = s['dec']
        vmag = s['vmag']
        bv   = s['bv']

        # ── Distance filter ─────────────────────────────────────────────────
        if plx is None or plx <= 0:
            continue
        dist_pc = 1000.0 / plx
        if dist_pc > 300:
            continue
        n_dist += 1

        # ── Cross-match against confirmed planets ────────────────────────────
        if is_known(ra, dec, known_positions):
            n_crossmatch += 1
            continue

        # ── Spectral / quality filters ───────────────────────────────────────
        if bv is None or bv < 0.3 or bv > 2.0:
            continue
        # Absolute V magnitude check (skip very faint dwarfs)
        if vmag is not None:
            m_abs = vmag + 5 * math.log10(plx / 100.0)
            if m_abs > 12:
                continue
        n_spectral += 1

        # Attach derived properties for later use
        teff     = bv_to_teff(bv)
        spectype = teff_to_spectype(teff)
        s['dist_pc']  = round(dist_pc, 2)
        s['teff']     = teff
        s['spectype'] = spectype
        surviving.append(s)

    print(f'Stars processed:          {n_total:>8,}')
    print(f'  After distance filter:  {n_dist:>8,}')
    print(f'  After cross-match:      {n_dist - n_crossmatch:>8,}')
    print(f'  After spectral filter:  {n_spectral:>8,}')
    return surviving


# ---------------------------------------------------------------------------
# Step 4 & 5: Planet generation helpers
# ---------------------------------------------------------------------------

PLANET_LETTERS = list('bcdefghijklmnopqrstuvwxyz')


def poisson_draw(rng: random.Random, lam: float) -> int:
    """
    Approximate Poisson draw using the stdlib random module.
    Uses the Knuth algorithm (exact for small lambda values).
    """
    if lam <= 0:
        return 0
    L   = math.exp(-lam)
    k   = 0
    p   = 1.0
    while p > L:
        k += 1
        p *= rng.random()
    return k - 1


def generate_planets(star: dict) -> list[dict]:
    """
    Generate predicted planets for a single Hipparcos star.
    The RNG is seeded with the HIP number for determinism.
    """
    hip      = star['hip']
    ra       = star['ra']
    dec      = star['dec']
    dist_pc  = star['dist_pc']
    teff     = star['teff']
    spectype = star['spectype']

    rng = random.Random(hip)

    mean_n  = MEAN_PLANETS[spectype]
    count   = min(5, poisson_draw(rng, mean_n))
    if count == 0:
        return []

    star_mass = teff_to_mass(teff)
    lum       = teff_to_lum(teff)
    glon, glat = eq_to_gal(ra, dec)

    # Generate orbital periods and sort ascending (innermost → outermost)
    periods = sorted(
        10 ** rng.uniform(math.log10(2), math.log10(600))
        for _ in range(count)
    )

    records = []
    for i, period in enumerate(periods):
        letter = PLANET_LETTERS[i] if i < len(PLANET_LETTERS) else str(i + 1)

        # Semi-major axis via Kepler's 3rd law
        au = (period / 365.25) ** (2.0 / 3.0) * star_mass ** (1.0 / 3.0)

        # Equilibrium temperature
        eqt       = 278.5 * (lum ** 0.25) / (au ** 0.5)
        eqt_sigma = eqt * 0.15
        hz_flag   = 200 <= eqt <= 380

        # Planet radius from Kepler occurrence distribution
        r_roll = rng.random()
        if   r_roll < 0.30: pl_rade = rng.uniform(0.8,  1.7)
        elif r_roll < 0.70: pl_rade = rng.uniform(1.7,  4.0)
        elif r_roll < 0.90: pl_rade = rng.uniform(4.0,  8.0)
        else:                pl_rade = rng.uniform(8.0, 15.0)
        pl_rade_sigma = pl_rade * 0.20

        # Mission zone check
        mission_zone = None
        for zone_id, ra_min, ra_max, dec_min, dec_max in MISSION_ZONES:
            if ra_min <= ra < ra_max and dec_min <= dec < dec_max:
                mission_zone = zone_id
                break

        record = {
            # Standard viz fields (matching exoplanets-viz.json schema)
            'pl_name':          f'HIP-{hip} {letter}',
            'hostname':         f'HIP-{hip}',
            'ra':               round(ra,      4),
            'dec':              round(dec,     4),
            'sy_dist':          round(dist_pc, 2),
            'glon':             glon,
            'glat':             glat,
            'pl_orbsmax':       round(au,      4),
            'pl_orbper':        round(period,  2),
            'pl_eqt':           round(eqt,     1),
            'pl_rade':          round(pl_rade, 2),
            'pl_bmasse':        None,
            'pl_masse':         None,
            'pl_insol':         None,
            'st_teff':          teff,
            'st_spectype':      spectype,
            'sy_snum':          1,
            'sy_pnum':          count,
            'sy_mnum':          0,
            'disc_year':        None,
            'disc_facility':    None,
            'pl_controv_flag':  0,
            'discoverymethod':  None,
            # Frontier-specific fields
            'tier':             'frontier',
            'tier_index':       2,
            'source_catalog':   'hipparcos',
            'source_id':        str(hip),
            'pl_eqt_sigma':     round(eqt_sigma,    1),
            'pl_rade_sigma':    round(pl_rade_sigma, 2),
            'prediction_method': 'occurrence_rate_hip',
            'hz_flag':          hz_flag,
            'mission_zone':     mission_zone,
            'nft_eligible':     True,
            'nft_address':      f'exo-frontier-v1:hip:{hip}:{letter}',
            'cb_flag':          0,
            'cb_predicted':     False,
        }
        records.append(record)

    return records


# ---------------------------------------------------------------------------
# Step 6–8: Assemble, cap, and write output
# ---------------------------------------------------------------------------

def print_stats(n_stars_raw: int, surviving: list[dict],
                all_records: list[dict], capped: list[dict]) -> None:
    """Print a formatted stats summary to stdout."""
    hz_count = sum(1 for r in capped if r.get('hz_flag'))
    zone_counts: dict[str, int] = {}
    for r in capped:
        mz = r.get('mission_zone')
        if mz:
            zone_counts[mz] = zone_counts.get(mz, 0) + 1

    print(f'\nStars processed:          {n_stars_raw:>8,}')
    print(f'  After spectral filter:  {len(surviving):>8,}')
    print(f'Predicted planets:        {len(all_records):>8,}')
    print(f'After NFT cap ({NFT_CAP:,}): {len(capped):>8,}')
    print(f'HZ candidates:            {hz_count:>8,}')

    if zone_counts:
        print('Mission zone breakdown:')
        for zone_id, cnt in sorted(zone_counts.items()):
            print(f'  {zone_id:<14s}: {cnt:>6,}')


def main():
    hip_arg = sys.argv[1] if len(sys.argv) > 1 else None

    OUTPUT_DIR.mkdir(exist_ok=True)
    CACHE_DIR.mkdir(exist_ok=True)

    # ── Step 1: Load confirmed planets ─────────────────────────────────────
    print()
    known_positions = load_confirmed_positions(VIZ_FILE)
    print()

    # ── Step 2: Load Hipparcos catalog ──────────────────────────────────────
    print('Loading Hipparcos catalog ...')
    hip_stars = load_hipparcos(hip_arg)
    n_stars_raw = len(hip_stars)
    print(f'  {n_stars_raw:,} raw entries loaded.\n')

    # ── Step 3: Filter stars ────────────────────────────────────────────────
    print('Filtering stars ...')
    surviving = filter_stars(hip_stars, known_positions)
    print()

    # ── Steps 4 & 5: Generate predicted planets ─────────────────────────────
    print('Generating predicted planets ...')
    all_records: list[dict] = []
    for star in surviving:
        all_records.extend(generate_planets(star))
    print(f'  {len(all_records):,} planets generated across {len(surviving):,} stars.')
    print()

    # ── Step 8: Cap and sort ─────────────────────────────────────────────────
    # Sort by distance ascending so nearest stars get priority under the cap
    all_records.sort(key=lambda r: r['sy_dist'])
    capped = all_records[:NFT_CAP]

    # Final sort by RA for spatial locality in the app
    capped.sort(key=lambda r: r['ra'])

    # ── Write outputs ─────────────────────────────────────────────────────────
    # Slim viz file — only fields the Three.js renderer and DefenderNav need
    VIZ_KEYS = [
        'pl_name', 'hostname', 'ra', 'dec', 'sy_dist', 'glon', 'glat',
        'pl_orbsmax', 'pl_orbper', 'pl_eqt', 'pl_rade',
        'st_teff', 'st_spectype', 'sy_snum', 'sy_pnum', 'sy_mnum',
        'tier', 'tier_index', 'source_catalog', 'source_id',
        'nft_address', 'nft_eligible', 'mission_zone',
        'pl_eqt_sigma', 'pl_rade_sigma', 'hz_flag',
    ]
    render_records = capped[:VIZ_RENDER_CAP]   # nearest VIZ_RENDER_CAP for lightweight viz
    slim = [{k: r.get(k) for k in VIZ_KEYS} for r in render_records]
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(slim, f, separators=(',', ':'))

    # Full detail file alongside (for NFT metadata, smaller audience)
    detail_path = OUTPUT_DIR / 'frontier-exoplanets-detail.json'
    with open(detail_path, 'w', encoding='utf-8') as f:
        json.dump(capped, f, separators=(',', ':'))

    file_size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)
    print_stats(n_stars_raw, surviving, all_records, capped)
    print()
    print(f'Written {OUTPUT_FILE}  ({file_size_mb:.2f} MB)  [viz — slim]')
    print(f'Written {detail_path}  ({detail_path.stat().st_size / (1024*1024):.2f} MB)  [detail — full]')


if __name__ == '__main__':
    main()
