#!/usr/bin/env python3
"""
NASA Exoplanet Archive PS table → Exotopia app JSON files

Usage:
    python3 parse_exoplanet_export.py [input.csv]

Input:
    ps_export.csv (default) — CSV downloaded from the PS table view.
    The archive may prepend comment lines starting with '#'; they are skipped.
    Filter default_flag=1 at the archive before downloading, OR this script
    will filter it automatically if the column is present.

Outputs:
    public/exoplanets-viz.json     slim subset for Three.js initial render
    public/exoplanets-detail.json  full record for NFT metadata / infobox
    public/exoplanets-stats.json   coverage report for QA

Column set (confirmed present in export):
    pl_name, hostname, default_flag, sy_snum, sy_pnum, sy_mnum, cb_flag,
    discoverymethod, disc_year, disc_facility, pl_controv_flag, pl_refname,
    pl_orbper, pl_orbsmax, pl_rade, pl_radj, pl_masse, pl_massj,
    pl_orbeccen, pl_orbeccenerr1, pl_orbeccenerr2, pl_orbeccenlim,
    pl_insol,  pl_insolerr1,  pl_insolerr2,  pl_insollim,
    pl_eqt,    pl_eqterr1,    pl_eqterr2,    pl_eqtlim,
    st_refname, st_spectype, st_teff, st_rad, st_mass, st_age,
    rastr, ra, decstr, dec, glat, glon, sy_dist

Reference fields (pl_refname, st_refname) contain HTML anchor tags from the
archive in the form:
    <a refstr=KEY href=ADS_URL target=ref>Author et al. YEAR</a>
These are parsed into {'refstr', 'text', 'url'} objects automatically.
"""

import csv
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

INPUT_FILE  = sys.argv[1] if len(sys.argv) > 1 else 'ps_export.csv'
OUTPUT_DIR  = Path('public')

# Columns to coerce to float (empty string / 'N/A' → None)
FLOAT_FIELDS = {
    'ra', 'dec', 'sy_dist', 'glon', 'glat',
    'pl_orbper', 'pl_orbsmax',
    'pl_masse', 'pl_massj', 'pl_rade', 'pl_radj',
    'pl_orbeccen', 'pl_orbeccenerr1', 'pl_orbeccenerr2',
    'pl_insol',  'pl_insolerr1',  'pl_insolerr2',
    'pl_eqt',    'pl_eqterr1',    'pl_eqterr2',
    'st_teff', 'st_rad', 'st_mass', 'st_age',
}

# Columns to coerce to int
INT_FIELDS = {
    'sy_snum', 'sy_pnum', 'sy_mnum',
    'disc_year',
    'default_flag', 'cb_flag', 'pl_controv_flag',
    'pl_orbeccenlim', 'pl_insollim', 'pl_eqtlim',
}

# Reference columns that contain HTML anchor tags — parsed into dicts
REF_HTML_FIELDS = {'pl_refname', 'st_refname'}

# Slim field set for the 3D visualization (fast initial load)
# Excludes uncertainty columns and reference strings
VIZ_FIELDS = [
    'pl_name', 'hostname',
    'ra', 'dec', 'sy_dist', 'glon', 'glat',
    'pl_rade',
    'pl_eqt', 'pl_masse', 'pl_insol',
    'pl_orbsmax', 'pl_orbper',
    'discoverymethod', 'disc_facility', 'disc_year',
    'pl_controv_flag', 'cb_flag',
    'sy_snum', 'sy_pnum', 'sy_mnum',
    'st_spectype', 'st_teff',
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_ref_html(val: str) -> dict | None:
    """
    Parse a NASA archive HTML reference anchor tag into a structured dict.

    Input:
        '<a refstr=TENG_ET_AL__2023
             href=https://ui.adsabs.harvard.edu/abs/2023arXiv230805343T/abstract
             target=ref>Teng et al. 2023</a>'
    Output:
        {
            'refstr': 'TENG_ET_AL__2023',
            'text':   'Teng et al. 2023',
            'url':    'https://ui.adsabs.harvard.edu/abs/2023arXiv230805343T/abstract'
        }

    Falls back to {'text': val} if the value is not an anchor tag.
    Returns None for empty values.
    """
    if not val:
        return None
    val = val.strip()
    if not val:
        return None

    if not val.startswith('<a '):
        # Plain text reference (not HTML) — store as-is
        return {'refstr': None, 'text': val, 'url': None}

    refstr_m = re.search(r'refstr=([^\s>]+)', val)
    href_m   = re.search(r'href=([^\s>]+)',   val)
    text_m   = re.search(r'>([^<]+)</a>',     val)

    return {
        'refstr': refstr_m.group(1)        if refstr_m else None,
        'text':   text_m.group(1).strip()  if text_m   else None,
        'url':    href_m.group(1)          if href_m   else None,
    }


def coerce(col: str, val: str):
    """Convert a CSV string value to the appropriate Python type."""
    val = val.strip()

    # HTML reference fields — parse before the empty check so we don't
    # accidentally discard a tag that evaluates to a non-empty string
    if col in REF_HTML_FIELDS:
        return parse_ref_html(val)

    if val == '' or val.lower() in ('n/a', 'nan', 'none'):
        return None
    if col in FLOAT_FIELDS:
        try:
            return float(val)
        except ValueError:
            return None
    if col in INT_FIELDS:
        try:
            return int(float(val))
        except ValueError:
            return None
    return val


def parse_csv(path: str) -> list[dict]:
    """
    Read the archive CSV, skip comment lines, coerce types, and return rows.
    Filters to default_flag=1 if the column is present and not already filtered.
    """
    rows = []
    skipped_comments = 0

    with open(path, newline='', encoding='utf-8') as f:
        # Skip lines that start with '#' (archive metadata / column headers prefixed)
        lines = []
        for line in f:
            if line.startswith('#'):
                skipped_comments += 1
            else:
                lines.append(line)

    if skipped_comments:
        print(f'  Skipped {skipped_comments} comment line(s) at top of file.')

    reader = csv.DictReader(lines)

    # Normalise column names (strip whitespace the archive sometimes adds)
    fieldnames = [c.strip() for c in (reader.fieldnames or [])]
    reader.fieldnames = fieldnames

    has_default_flag = 'default_flag' in fieldnames
    if not has_default_flag:
        print('  WARNING: default_flag column not found — cannot deduplicate.')
        print('           Apply default_flag=1 filter on the archive before export.')

    for raw in reader:
        row = {col.strip(): coerce(col.strip(), val) for col, val in raw.items()}

        # Keep only default parameter set rows (one row per planet)
        if has_default_flag and row.get('default_flag') != 1:
            continue

        rows.append(row)

    return rows, fieldnames


def coverage_stats(rows: list[dict], fields: list[str]) -> dict:
    """Return {field: {count, total, pct}} for key fields."""
    total = len(rows)
    stats = {}
    for field in fields:
        count = sum(1 for r in rows if r.get(field) is not None)
        stats[field] = {
            'populated': count,
            'total': total,
            'pct': round(100 * count / total, 1) if total else 0,
        }
    return stats


def sky_distribution(rows: list[dict]) -> dict:
    """RA distribution bucketed into 12 × 30° sectors with constellation labels."""
    labels = [
        'Psc/And (0-30)',  'Ari/Per (30-60)',  'Ori/Tau (60-90)',
        'CMa/Gem (90-120)','Cnc/Hya (120-150)','Leo/Vir (150-180)',
        'Vir/Boo (180-210)','Sco/Oph (210-240)','Oph/Sgr (240-270)',
        'Cyg/Lyr (270-300)','Cyg/Cep (300-330)','Peg/Aqr (330-360)',
    ]
    buckets = [0] * 12
    for r in rows:
        ra = r.get('ra')
        if ra is not None:
            buckets[int(ra / 30) % 12] += 1
    total = sum(buckets)
    return {
        labels[i]: {
            'count': buckets[i],
            'pct': round(100 * buckets[i] / total, 1) if total else 0,
        }
        for i in range(12)
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f'Reading {INPUT_FILE} ...')
    rows, fieldnames = parse_csv(INPUT_FILE)
    print(f'  {len(rows)} planets after default_flag filter.\n')

    # Check for recommended columns
    recommended = {
        'pl_rade': 'Planet Radius [Earth Radius] — viz sphere sizing',
        'pl_radj': 'Planet Radius [Jupiter Radius] — NFT attribute',
        'st_age':  'Stellar Age [Gyr] — NFT attribute / habitability',
    }
    missing = [c for c in recommended if c not in fieldnames]
    present = [c for c in recommended if c in fieldnames]
    if present:
        print(f'  Recommended columns confirmed: {", ".join(present)}')
    if missing:
        print('  NOTICE: Recommended columns absent (add in archive selector):')
        for c in missing:
            print(f'    {c:12s}  {recommended[c]}')
    print()

    # ── Detail file (all columns) ───────────────────────────────────────────
    OUTPUT_DIR.mkdir(exist_ok=True)
    detail_path = OUTPUT_DIR / 'exoplanets-detail.json'
    with open(detail_path, 'w', encoding='utf-8') as f:
        json.dump(rows, f, separators=(',', ':'))
    print(f'Written {detail_path}  ({detail_path.stat().st_size // 1024} KB)')

    # ── Viz file (slim subset) ──────────────────────────────────────────────
    present_viz_fields = [c for c in VIZ_FIELDS if c in fieldnames]
    slim = [{c: r.get(c) for c in present_viz_fields} for r in rows]
    viz_path = OUTPUT_DIR / 'exoplanets-viz.json'
    with open(viz_path, 'w', encoding='utf-8') as f:
        json.dump(slim, f, separators=(',', ':'))
    print(f'Written {viz_path}    ({viz_path.stat().st_size // 1024} KB)\n')

    # ── Stats / QA file ────────────────────────────────────────────────────
    key_fields = [
        'sy_dist', 'pl_rade', 'pl_eqt', 'pl_masse', 'pl_insol',
        'pl_orbsmax', 'pl_orbper', 'st_spectype', 'st_teff', 'st_age',
        'glon', 'glat',
    ]
    cov = coverage_stats(rows, key_fields)
    sky = sky_distribution(rows)

    discovery_methods = {}
    facilities = {}
    for r in rows:
        dm = r.get('discoverymethod') or 'Unknown'
        discovery_methods[dm] = discovery_methods.get(dm, 0) + 1
        df = r.get('disc_facility') or 'Unknown'
        facilities[df] = facilities.get(df, 0) + 1

    circumbinary  = sum(1 for r in rows if r.get('cb_flag') == 1)
    controversial = sum(1 for r in rows if r.get('pl_controv_flag') == 1)

    # Reference URL coverage (how many planets have ADS citation links)
    has_pl_ref  = sum(1 for r in rows if r.get('pl_refname') and r['pl_refname'].get('url'))
    has_st_ref  = sum(1 for r in rows if r.get('st_refname') and r['st_refname'].get('url'))

    stats = {
        'total_planets': len(rows),
        'circumbinary_planets': circumbinary,
        'controversial_planets': controversial,
        'planets_with_pl_ref_url': has_pl_ref,
        'planets_with_st_ref_url': has_st_ref,
        'field_coverage': cov,
        'sky_distribution_ra': sky,
        'discovery_methods': dict(sorted(discovery_methods.items(), key=lambda x: -x[1])),
        'top_facilities': dict(
            sorted(facilities.items(), key=lambda x: -x[1])[:15]
        ),
    }

    stats_path = OUTPUT_DIR / 'exoplanets-stats.json'
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    print(f'Written {stats_path}\n')

    # ── Console summary ────────────────────────────────────────────────────
    print('Field coverage (populated / total):')
    for field, s in cov.items():
        bar = '█' * int(s['pct'] // 5) + '░' * (20 - int(s['pct'] // 5))
        print(f'  {field:14s} {bar} {s["pct"]:5.1f}%  ({s["populated"]:5d}/{s["total"]})')

    print('\nSky distribution (RA sectors):')
    for label, s in sky.items():
        bar = '█' * int(s['pct'] // 2)
        print(f'  {label:25s} {s["pct"]:5.1f}%  {bar}')

    print(f'\nCircumbinary planets : {circumbinary}')
    print(f'Controversial planets: {controversial}')
    print(f'Planets with ADS planet ref URL : {has_pl_ref}/{len(rows)}')
    print(f'Planets with ADS stellar ref URL: {has_st_ref}/{len(rows)}')


if __name__ == '__main__':
    main()
