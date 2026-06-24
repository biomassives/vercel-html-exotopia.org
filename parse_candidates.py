#!/usr/bin/env python3
"""
NASA ExoFOP / Exoplanet Archive candidate downloader → Exotopia app JSON

Downloads unconfirmed planet candidates from two public catalogs:
  - TESS TOIs (TESS Objects of Interest) from ExoFOP
  - Kepler KOIs (Kepler Objects of Interest) from NASA Exoplanet Archive

Outputs:
    public/candidate-exoplanets.json   slim records for Three.js render

Cache:
    datagathering/tess_toi.csv
    datagathering/kepler_koi.csv

Run:
    python3 parse_candidates.py

Network is optional — falls back to synthetic stub data if downloads fail.
"""

import csv
import json
import math
import random
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OUTPUT_DIR = Path('public')
CACHE_DIR  = Path('datagathering')

TESS_URL = (
    'https://exofop.ipac.caltech.edu/tess/download_toi.php?sort=toi&output=csv'
)
KOI_URL = (
    'https://exoplanetarchive.ipac.caltech.edu/TAP/sync'
    '?query=select+*+from+cumulative+where+koi_disposition=%27CANDIDATE%27'
    '&format=csv'
)

TESS_CACHE = CACHE_DIR / 'tess_toi.csv'
KOI_CACHE  = CACHE_DIR / 'kepler_koi.csv'

# Candidate cap from spec
CANDIDATE_CAP = 13_000

# Cross-match radius in degrees
CROSSMATCH_DEG = 0.02

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fetch_or_cache(url: str, local_path: Path, description: str) -> Path | None:
    """Return path to a local CSV, downloading it first if absent."""
    if local_path.exists():
        print(f'  Using cached {description}: {local_path}')
        return local_path
    print(f'  Downloading {description} ...')
    try:
        urllib.request.urlretrieve(url, local_path)
        print(f'  Saved to {local_path}')
        return local_path
    except Exception as e:
        print(f'  Download failed: {e}')
        return None


def parse_csv_skip_comments(path: Path) -> list[dict]:
    """Read CSV skipping lines that start with '#'. Returns list of raw dicts."""
    lines = []
    skipped = 0
    with open(path, newline='', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#'):
                skipped += 1
            else:
                lines.append(line)
    if skipped:
        print(f'    Skipped {skipped} comment line(s).')
    reader = csv.DictReader(lines)
    # Strip whitespace from column names
    fieldnames = [c.strip() for c in (reader.fieldnames or [])]
    reader.fieldnames = fieldnames
    return [
        {k.strip(): v.strip() for k, v in row.items() if k}
        for row in reader
    ]


def to_float(val) -> float | None:
    """Coerce a value to float, return None on failure."""
    if val is None:
        return None
    s = str(val).strip()
    if s in ('', 'N/A', 'nan', 'NaN', 'None', '--'):
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def sexagesimal_to_deg(val: str, is_ra: bool = False) -> float | None:
    """
    Convert a sexagesimal string (HH:MM:SS.ss or DD:MM:SS.ss) to decimal degrees.
    For RA (is_ra=True) the result is multiplied by 15 (hours → degrees).
    Returns None on parse failure.
    """
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    # If it's already a plain decimal number, just parse it
    try:
        return float(s)
    except ValueError:
        pass
    # Sexagesimal: support ':' or ' ' as separator, leading '-'
    negative = s.startswith('-')
    s = s.lstrip('+-')
    parts = s.replace(' ', ':').split(':')
    if len(parts) < 2:
        return None
    try:
        d = float(parts[0])
        m = float(parts[1]) if len(parts) > 1 else 0.0
        sec = float(parts[2]) if len(parts) > 2 else 0.0
        decimal = d + m / 60.0 + sec / 3600.0
        if is_ra:
            decimal *= 15.0          # hours → degrees
        return -decimal if negative else decimal
    except (ValueError, IndexError):
        return None


def to_int(val) -> int | None:
    """Coerce a value to int via float, return None on failure."""
    f = to_float(val)
    if f is None:
        return None
    return int(f)


def teff_to_spectype(teff) -> str | None:
    """Derive approximate spectral class letter from effective temperature."""
    t = to_float(teff)
    if t is None:
        return None
    if t >= 7500:
        return 'A'
    if t >= 6000:
        return 'F'
    if t >= 5200:
        return 'G'
    if t >= 3700:
        return 'K'
    return 'M'


def estimate_eqt(teff, period_days, star_mass_solar=1.0) -> float | None:
    """
    Estimate equilibrium temperature (K) from stellar Teff and orbital period.
    Uses Stefan-Boltzmann + semi-major axis from Kepler's third law.
    """
    t   = to_float(teff)
    per = to_float(period_days)
    m   = to_float(star_mass_solar) or 1.0
    if t is None or per is None or per <= 0:
        return None
    au  = (per / 365.25) ** (2.0 / 3.0) * m ** (1.0 / 3.0)
    lum = (t / 5778.0) ** 4
    return round(278.5 * (lum ** 0.25) / (au ** 0.5), 1)


def period_to_au(period_days, star_mass_solar=1.0) -> float | None:
    """Convert orbital period to semi-major axis in AU via Kepler's third law."""
    per = to_float(period_days)
    m   = to_float(star_mass_solar) or 1.0
    if per is None or per <= 0:
        return None
    return round((per / 365.25) ** (2.0 / 3.0) * m ** (1.0 / 3.0), 5)


def ra_dec_to_gal(ra_deg: float, dec_deg: float) -> tuple[float, float] | tuple[None, None]:
    """
    Convert equatorial (J2000) to galactic coordinates using the IAU 1958
    transformation constants.  Returns (glon, glat) in degrees.
    Falls back to (None, None) if astropy is unavailable and coords are invalid.
    """
    try:
        from astropy.coordinates import SkyCoord
        import astropy.units as u
        c = SkyCoord(ra=ra_deg * u.deg, dec=dec_deg * u.deg, frame='icrs')
        g = c.galactic
        return round(float(g.l.deg), 5), round(float(g.b.deg), 5)
    except ImportError:
        pass
    # Fallback: IAU 1958 approximate rotation
    ra  = math.radians(ra_deg)
    dec = math.radians(dec_deg)
    # NGP: RA=192.85948°, Dec=27.12825°; l_NCP=122.93192°
    ra_ngp  = math.radians(192.85948)
    dec_ngp = math.radians(27.12825)
    l_ncp   = math.radians(122.93192)

    sin_b = (math.sin(dec) * math.sin(dec_ngp)
             + math.cos(dec) * math.cos(dec_ngp) * math.cos(ra - ra_ngp))
    b = math.asin(max(-1.0, min(1.0, sin_b)))

    y = math.cos(dec) * math.sin(ra - ra_ngp)
    x = (math.sin(dec) * math.cos(dec_ngp)
         - math.cos(dec) * math.sin(dec_ngp) * math.cos(ra - ra_ngp))
    l = l_ncp - math.atan2(y, x)
    l = math.degrees(l) % 360
    return round(l, 5), round(math.degrees(b), 5)


def haversine_deg(ra1, dec1, ra2, dec2) -> float:
    """Angular separation in degrees between two equatorial positions."""
    d_ra  = math.radians(ra2 - ra1)
    d_dec = math.radians(dec2 - dec1)
    a = (math.sin(d_dec / 2) ** 2
         + math.cos(math.radians(dec1))
         * math.cos(math.radians(dec2))
         * math.sin(d_ra / 2) ** 2)
    return math.degrees(2 * math.asin(math.sqrt(min(1.0, a))))


def toi_suffix_to_letter(toi_str: str) -> str:
    """
    TOI numbers look like 1234.01, 1234.02 etc.
    .01 → b, .02 → c, .03 → d, ... (0-indexed from 'b' = ord 98)
    """
    try:
        # fractional part after decimal
        decimal = toi_str.split('.')[1] if '.' in toi_str else '01'
        idx = int(decimal) - 1          # 0-based
        return chr(ord('b') + max(0, idx))
    except (IndexError, ValueError):
        return 'b'


def koi_suffix_to_letter(koi_suffix: str) -> str:
    """KOI suffixes are stored as the integer part: 1 → b, 2 → c, ..."""
    try:
        idx = int(koi_suffix) - 1
        return chr(ord('b') + max(0, idx))
    except (ValueError, TypeError):
        return 'b'


# ---------------------------------------------------------------------------
# Confirmed archive cross-match
# ---------------------------------------------------------------------------

def load_confirmed_positions(viz_path: Path) -> list[tuple[float, float]]:
    """Return list of (ra, dec) for all confirmed planets in the viz file."""
    if not viz_path.exists():
        print(f'  WARNING: {viz_path} not found — skipping cross-match.')
        return []
    with open(viz_path, encoding='utf-8') as f:
        data = json.load(f)
    positions = []
    for r in data:
        ra  = to_float(r.get('ra'))
        dec = to_float(r.get('dec'))
        if ra is not None and dec is not None:
            positions.append((ra, dec))
    return positions


def build_confirmed_grid(positions: list[tuple[float, float]]) -> dict:
    """
    Bucket confirmed positions into a coarse 1°×1° grid for fast lookup.
    Returns dict keyed by (int(ra), int(dec+90)).
    """
    grid: dict[tuple[int, int], list[tuple[float, float]]] = {}
    for ra, dec in positions:
        key = (int(ra), int(dec + 90))
        grid.setdefault(key, []).append((ra, dec))
    return grid


def is_already_confirmed(ra: float, dec: float,
                          grid: dict,
                          threshold_deg: float = CROSSMATCH_DEG) -> bool:
    """Check against the coarse grid ± 1 cell to find a match within threshold."""
    ra_cell  = int(ra)
    dec_cell = int(dec + 90)
    for dra in (-1, 0, 1):
        for dd in (-1, 0, 1):
            for cra, cdec in grid.get((ra_cell + dra, dec_cell + dd), []):
                if haversine_deg(ra, dec, cra, cdec) < threshold_deg:
                    return True
    return False


# ---------------------------------------------------------------------------
# TESS TOI parsing
# ---------------------------------------------------------------------------

def parse_tess_tois(path: Path) -> list[dict]:
    """
    Load TESS TOI CSV, filter to PC/APC dispositions, and return normalised
    candidate records.
    """
    raw = parse_csv_skip_comments(path)
    print(f'    Raw TESS rows: {len(raw)}')

    records = []
    for row in raw:
        disp = row.get('TFOPWG Disposition', '').strip()
        if disp not in ('PC', 'APC'):
            continue

        toi_str = row.get('TOI', '').strip()
        if not toi_str:
            continue

        # RA/Dec may be sexagesimal (HH:MM:SS.ss / DD:MM:SS.ss) or decimal
        ra  = sexagesimal_to_deg(row.get('RA'),  is_ra=True)
        dec = sexagesimal_to_deg(row.get('Dec'), is_ra=False)
        if ra is None or dec is None:
            continue

        # Hostname: strip decimal → "TOI-1234"
        try:
            host_num = int(float(toi_str))
        except ValueError:
            continue
        hostname   = f'TOI-{host_num}'
        letter     = toi_suffix_to_letter(toi_str)
        pl_name    = f'TOI {toi_str}'

        # Column names as actually present in the ExoFOP download
        period     = to_float(row.get('Period (days)') or row.get('Orbital Period (days)'))
        pl_rade    = to_float(row.get('Planet Radius (R_Earth)'))
        eqt_direct = to_float(row.get('Planet Equil Temp (K)'))
        st_teff    = to_float(row.get('Stellar Eff Temp (K)'))
        st_rad     = to_float(row.get('Stellar Radius (R_Sun)'))
        st_mass    = to_float(row.get('Stellar Mass (M_Sun)'))
        dist_pc    = to_float(row.get('Stellar Distance (pc)'))
        depth_ppm  = to_float(row.get('Depth (ppm)'))

        au         = period_to_au(period, st_mass)
        eqt        = eqt_direct if eqt_direct else estimate_eqt(st_teff, period, st_mass or 1.0)
        glon, glat = ra_dec_to_gal(ra, dec)
        spectype   = teff_to_spectype(st_teff)

        records.append({
            'pl_name':           pl_name,
            'hostname':          hostname,
            'ra':                round(ra, 5),
            'dec':               round(dec, 5),
            'sy_dist':           dist_pc,
            'glon':              glon,
            'glat':              glat,
            'pl_orbsmax':        au,
            'pl_orbper':         period,
            'pl_eqt':            eqt,
            'pl_rade':           pl_rade,
            'pl_bmasse':         None,
            'st_teff':           st_teff,
            'st_spectype':       spectype,
            'sy_snum':           1,
            'sy_pnum':           None,
            'sy_mnum':           0,
            'discoverymethod':   'Transit',
            'disc_facility':     'TESS',
            'cb_flag':           0,
            'pl_controv_flag':   0,
            'tier':              'candidate',
            'tier_index':        1,
            'source_catalog':    'toi',
            'source_id':         toi_str,
            'pl_eqt_sigma':      round(eqt * 0.12, 1) if eqt else None,
            'pl_rade_sigma':     round(pl_rade * 0.08, 3) if pl_rade else None,
            'prediction_method': 'transit_signal',
            'mission_zone':      None,
            'nft_eligible':      True,
            'nft_address':       f'exo-candidate-v1:toi:{toi_str}:{letter}',
            'cb_predicted':      False,
            # internal bookkeeping, removed before output
            '_source':           'tess',
            '_disp':             disp,
        })

    return records


# ---------------------------------------------------------------------------
# Kepler KOI parsing
# ---------------------------------------------------------------------------

def parse_kepler_kois(path: Path) -> list[dict]:
    """
    Load Kepler KOI cumulative table, filter to CANDIDATE / koi_fp_flag==0,
    return normalised candidate records.
    """
    raw = parse_csv_skip_comments(path)
    print(f'    Raw Kepler rows: {len(raw)}')

    records = []
    for row in raw:
        disp = row.get('koi_disposition', '').strip()
        if disp != 'CANDIDATE':
            continue

        fp_flag = to_int(row.get('koi_fpflag_co') or row.get('koi_fp_flag', '0'))
        # koi_fp_flag may not be present as a single column in TAP output;
        # the TAP cumulative table uses individual false-positive flags.
        # Accept any row that survived the CANDIDATE filter.

        kepid = row.get('kepid', '').strip()
        if not kepid:
            continue

        ra  = to_float(row.get('ra'))
        dec = to_float(row.get('dec'))
        if ra is None or dec is None:
            continue

        # KOI number (e.g. "12.01") comes from kepoi_name like "K00012.01"
        kepoi_name = row.get('kepoi_name', '').strip()
        koi_suffix = '01'
        if '.' in kepoi_name:
            koi_suffix = kepoi_name.split('.')[1]

        hostname  = f'KIC {kepid}'
        letter    = koi_suffix_to_letter(koi_suffix)
        pl_name   = kepoi_name if kepoi_name else f'KOI-{kepid}.{koi_suffix}'

        period    = to_float(row.get('koi_period'))
        pl_rade   = to_float(row.get('koi_prad'))
        st_teff   = to_float(row.get('koi_steff'))
        st_rad    = to_float(row.get('koi_srad'))
        st_mass   = to_float(row.get('koi_smass'))
        eqt_raw   = to_float(row.get('koi_teq'))
        dist_pc   = None   # KOI table does not include stellar distance

        au        = period_to_au(period, st_mass)
        eqt       = eqt_raw if eqt_raw else estimate_eqt(st_teff, period, st_mass or 1.0)
        glon, glat = ra_dec_to_gal(ra, dec)
        spectype  = teff_to_spectype(st_teff)
        source_id = f'{kepid}.{koi_suffix}'

        records.append({
            'pl_name':           pl_name,
            'hostname':          hostname,
            'ra':                ra,
            'dec':               dec,
            'sy_dist':           dist_pc,
            'glon':              glon,
            'glat':              glat,
            'pl_orbsmax':        au,
            'pl_orbper':         period,
            'pl_eqt':            eqt,
            'pl_rade':           pl_rade,
            'pl_bmasse':         None,
            'st_teff':           st_teff,
            'st_spectype':       spectype,
            'sy_snum':           1,
            'sy_pnum':           None,
            'sy_mnum':           0,
            'discoverymethod':   'Transit',
            'disc_facility':     'Kepler',
            'cb_flag':           0,
            'pl_controv_flag':   0,
            'tier':              'candidate',
            'tier_index':        1,
            'source_catalog':    'koi',
            'source_id':         source_id,
            'pl_eqt_sigma':      round(eqt * 0.12, 1) if eqt else None,
            'pl_rade_sigma':     round(pl_rade * 0.08, 3) if pl_rade else None,
            'prediction_method': 'transit_signal',
            'mission_zone':      None,
            'nft_eligible':      True,
            'nft_address':       f'exo-candidate-v1:koi:{source_id}:{letter}',
            'cb_predicted':      False,
            '_source':           'koi',
            '_disp':             disp,
        })

    return records


# ---------------------------------------------------------------------------
# Synthetic stub fallback
# ---------------------------------------------------------------------------

def make_synthetic_records(n: int = 100) -> list[dict]:
    """
    Generate n synthetic candidate records distributed across sparse sky zones
    (southern sky, galactic caps, Coma gap) for offline development use.
    """
    rng = random.Random(42)

    # Sparse zones: (ra_center, dec_center, ra_spread, dec_spread)
    zones = [
        (60.0,  -70.0, 30.0, 15.0),   # Southern sky / Eridanus
        (180.0,  80.0, 40.0, 10.0),   # North galactic cap / Coma
        (270.0, -60.0, 30.0, 15.0),   # Southern galactic cap
        (120.0,   5.0, 20.0, 10.0),   # Galactic anti-center gap
        (300.0,  20.0, 25.0, 12.0),   # Cygnus sparse lane
    ]

    records = []
    per_zone = max(1, n // len(zones))
    idx = 0
    for ra_c, dec_c, ra_s, dec_s in zones:
        for _ in range(per_zone):
            ra  = (ra_c + rng.gauss(0, ra_s)) % 360
            dec = max(-90.0, min(90.0, dec_c + rng.gauss(0, dec_s)))
            period   = rng.uniform(1.0, 400.0)
            pl_rade  = rng.uniform(0.5, 14.0)
            st_teff  = rng.uniform(3500, 7000)
            st_mass  = rng.uniform(0.5, 1.5)
            eqt      = estimate_eqt(st_teff, period, st_mass)
            au       = period_to_au(period, st_mass)
            glon, glat = ra_dec_to_gal(ra, dec)
            spectype = teff_to_spectype(st_teff)
            toi_str  = f'9{9000 + idx}.01'
            hostname = f'TOI-{99000 + idx}'
            letter   = 'b'
            records.append({
                'pl_name':           f'TOI {toi_str}',
                'hostname':          hostname,
                'ra':                round(ra, 5),
                'dec':               round(dec, 5),
                'sy_dist':           round(rng.uniform(50, 500), 1),
                'glon':              glon,
                'glat':              glat,
                'pl_orbsmax':        au,
                'pl_orbper':         round(period, 3),
                'pl_eqt':            eqt,
                'pl_rade':           round(pl_rade, 2),
                'pl_bmasse':         None,
                'st_teff':           round(st_teff, 0),
                'st_spectype':       spectype,
                'sy_snum':           1,
                'sy_pnum':           None,
                'sy_mnum':           0,
                'discoverymethod':   'Transit',
                'disc_facility':     'TESS',
                'cb_flag':           0,
                'pl_controv_flag':   0,
                'tier':              'candidate',
                'tier_index':        1,
                'source_catalog':    'toi',
                'source_id':         toi_str,
                'pl_eqt_sigma':      round(eqt * 0.12, 1) if eqt else None,
                'pl_rade_sigma':     round(pl_rade * 0.08, 3),
                'prediction_method': 'transit_signal',
                'mission_zone':      None,
                'nft_eligible':      True,
                'nft_address':       f'exo-candidate-v1:toi:{toi_str}:{letter}',
                'cb_predicted':      False,
                '_source':           'synthetic',
                '_disp':             'PC',
            })
            idx += 1

    return records[:n]


# ---------------------------------------------------------------------------
# Post-processing helpers
# ---------------------------------------------------------------------------

def compute_sy_pnum(records: list[dict]) -> list[dict]:
    """
    Fill sy_pnum by counting how many candidates share the same hostname.
    Does not count across sources — a real system may have extra confirmed
    planets, so this is a lower bound.
    """
    counts: dict[str, int] = {}
    for r in records:
        h = r['hostname']
        counts[h] = counts.get(h, 0) + 1
    for r in records:
        r['sy_pnum'] = counts[r['hostname']]
    return records


def strip_internal_fields(records: list[dict]) -> list[dict]:
    """Remove bookkeeping fields that start with '_'."""
    return [{k: v for k, v in r.items() if not k.startswith('_')} for r in records]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    CACHE_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)

    # ── Download / cache ────────────────────────────────────────────────────
    print('Fetching TESS TOI catalog ...')
    tess_path = fetch_or_cache(TESS_URL, TESS_CACHE, 'TESS TOIs')

    print('Fetching Kepler KOI catalog ...')
    koi_path = fetch_or_cache(KOI_URL, KOI_CACHE, 'Kepler KOIs')

    # ── Load confirmed planet positions for cross-match ──────────────────────
    print('\nLoading confirmed planet positions for cross-match ...')
    confirmed_pos = load_confirmed_positions(OUTPUT_DIR / 'exoplanets-viz.json')
    print(f'  {len(confirmed_pos)} confirmed planet positions loaded.')
    confirmed_grid = build_confirmed_grid(confirmed_pos)

    # ── Parse TESS TOIs ──────────────────────────────────────────────────────
    tess_raw_count  = 0
    tess_pc_count   = 0
    tess_final      = []
    tess_used_stub  = False

    if tess_path:
        print('\nParsing TESS TOIs ...')
        tess_records = parse_tess_tois(tess_path)
        tess_raw_count = sum(1 for _ in open(tess_path, encoding='utf-8')
                             if not _.startswith('#')) - 1   # subtract header
        tess_pc_count = len(tess_records)
        print(f'  After PC/APC filter: {tess_pc_count}')

        for r in tess_records:
            ra  = r.get('ra')
            dec = r.get('dec')
            if ra is not None and dec is not None:
                if not is_already_confirmed(ra, dec, confirmed_grid):
                    tess_final.append(r)
        print(f'  After confirmed cross-match: {len(tess_final)}')
    else:
        print('\nWARNING: TESS download failed — generating synthetic stub (50 records).')
        tess_final = make_synthetic_records(50)
        tess_used_stub = True

    # ── Parse Kepler KOIs ────────────────────────────────────────────────────
    koi_raw_count   = 0
    koi_cand_count  = 0
    koi_final       = []
    koi_used_stub   = False

    if koi_path:
        print('\nParsing Kepler KOIs ...')
        koi_records = parse_kepler_kois(koi_path)
        koi_raw_count = sum(1 for _ in open(koi_path, encoding='utf-8')
                            if not _.startswith('#')) - 1
        koi_cand_count = len(koi_records)
        print(f'  After CANDIDATE filter: {koi_cand_count}')

        for r in koi_records:
            ra  = r.get('ra')
            dec = r.get('dec')
            if ra is not None and dec is not None:
                if not is_already_confirmed(ra, dec, confirmed_grid):
                    koi_final.append(r)
        print(f'  After confirmed cross-match: {len(koi_final)}')
    else:
        print('\nWARNING: Kepler download failed — generating synthetic stub (50 records).')
        koi_final = make_synthetic_records(50)
        koi_used_stub = True

    if tess_used_stub and koi_used_stub:
        print(
            '\nWARNING: Using synthetic stub data — '
            'run with network access to get real candidates.'
        )

    # ── Combine, deduplicate, sort, cap ─────────────────────────────────────
    combined = tess_final + koi_final

    # Deduplicate by nft_address (keep first occurrence)
    seen_addr: set[str] = set()
    deduped = []
    for r in combined:
        addr = r.get('nft_address', '')
        if addr not in seen_addr:
            seen_addr.add(addr)
            deduped.append(r)

    deduped_count = len(deduped)

    # Sort by RA then Dec
    deduped.sort(key=lambda r: (r.get('ra') or 0.0, r.get('dec') or 0.0))

    # Cap
    capped = deduped[:CANDIDATE_CAP]
    cap_count = len(capped)

    # Fill sy_pnum
    capped = compute_sy_pnum(capped)

    # ── Write output ─────────────────────────────────────────────────────────
    output = strip_internal_fields(capped)
    out_path = OUTPUT_DIR / 'candidate-exoplanets.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, separators=(',', ':'))
    size_mb = out_path.stat().st_size / (1024 * 1024)

    # ── Summary ──────────────────────────────────────────────────────────────
    tess_in_output   = sum(1 for r in capped if r.get('_source') == 'tess'
                           or r.get('disc_facility') == 'TESS')
    kepler_in_output = sum(1 for r in capped if r.get('_source') == 'koi'
                           or r.get('disc_facility') == 'Kepler')
    with_eqt         = sum(1 for r in capped if r.get('pl_eqt') is not None)
    without_eqt      = cap_count - with_eqt
    hz_count         = sum(
        1 for r in capped
        if r.get('pl_eqt') is not None and 200 <= r['pl_eqt'] <= 380
    )

    print()
    print(f'TESS TOIs downloaded:        {tess_raw_count:>7,}')
    print(f'  After disposition filter:  {tess_pc_count:>7,} (PC/APC)')
    print(f'  After confirmed cross-match: {len(tess_final):>5,}')
    print(f'Kepler KOIs:                 {koi_raw_count:>7,}')
    print(f'  After CANDIDATE filter:    {koi_cand_count:>7,}')
    print(f'  After confirmed cross-match: {len(koi_final):>5,}')
    print(f'Combined (deduped):          {deduped_count:>7,}')
    print(f'After {CANDIDATE_CAP:,} cap:          {cap_count:>7,}')
    print(f'  By facility: TESS {tess_in_output:,} / Kepler {kepler_in_output:,}')
    print(f'  With pl_eqt: {with_eqt:,} / without: {without_eqt:,}')
    print(f'  HZ candidates (200-380 K): {hz_count:,}')
    print(f'Written {out_path}  ({size_mb:.2f} MB)')


if __name__ == '__main__':
    main()
