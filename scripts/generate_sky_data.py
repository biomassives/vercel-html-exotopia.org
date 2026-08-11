#!/usr/bin/env python3
"""
generate_sky_data.py

Real, parallax-accurate night-sky data per exoplanet — SPEC.md §14. Computes
where every bright Hipparcos star actually appears from an exoplanet's own
position in the galaxy (not from Earth), following §14.1's formulas exactly.

Output: public/sky/[hostname-slug].json (one file per target hostname) +
public/sky/index.json.

Scope of this pass (see SPEC.md §14, "Explicitly deferred" in the plan this
came out of):
  - Single-star host systems only (binary/trinary component lookup via WDS
    cross-match is not implemented here — sy_snum > 1 targets are skipped
    with a warning, not silently mis-rendered as single).
  - `constellations: { earth: [], exotopia: [] }` are left EMPTY. SPEC.md
    §14.2.3 names a constellation stick-figure source
    (stellarium/skycultures/western/constellationship.fab) that no longer
    exists at that path — confirmed via a direct request (404) before writing
    this script. Guessing at a replacement URL here would silently bake a
    wrong assumption into every sky file. That's a separate follow-up spike,
    not a `# TODO` some fetch quietly wraps around.
  - Target list defaults to the nearest-N confirmed-distance exoplanet
    hostnames (SPEC.md §14.8's second priority criterion). Its first
    criterion — "systems with confirmed settlements in ot6.json" — doesn't
    hold in this repo: datagathering/ot6.json is unrelated placeholder eco-ops
    sample data (all `exolocation: null`), not a settlement→hostname mapping.
    Pass --hostnames explicitly once real settlement data exists to target it.

Usage:
    python3 scripts/generate_sky_data.py --hostnames "Proxima Cen"   # single test run
    python3 scripts/generate_sky_data.py --nearest 10                # first-run batch
    python3 scripts/generate_sky_data.py --nearest 10 --limit-stars 500  # smaller files
"""

import argparse
import json
import math
import re
import sys
from pathlib import Path

import numpy as np

# astropy/astroquery are only needed for the Hipparcos download step, which is
# skipped entirely when a valid local cache already exists.
try:
    from astroquery.vizier import Vizier
except ImportError:  # pragma: no cover
    Vizier = None

HIPPARCOS_CATALOG = "I/239/hip_main"
HIP_COLUMNS = ["HIP", "RAICRS", "DEICRS", "Plx", "e_Plx", "Vmag", "B-V", "SpType", "pmRA", "pmDE"]

SUN_TEFF = 5778.0

# ── B-V → effective temperature (rough main-sequence calibration) ─────────────
# Ballesteros (2012) approximation — good enough for sky-render color/tint
# purposes; this is not a stellar-physics research tool.
def teff_from_bv(bv: float) -> float:
    bv = max(-0.4, min(2.0, bv))
    return 4600.0 * (1.0 / (0.92 * bv + 1.7) + 1.0 / (0.92 * bv + 0.62))


def color_hex_from_teff(teff: float) -> str:
    # Same bucketing spirit as src/lib/three-utils.ts::starColorFromTeff, kept
    # independent here since this is a one-shot data-generation script, not
    # runtime code that should import from the frontend build.
    if teff >= 30000: return "#9bb0ff"
    if teff >= 10000: return "#aabfff"
    if teff >= 7500:  return "#cad7ff"
    if teff >= 6000:  return "#f8f7ff"
    if teff >= 5200:  return "#ffe4aa"
    if teff >= 3700:  return "#ffbe6e"
    return "#ff8250"


def slugify(hostname: str) -> str:
    s = hostname.strip().lower()
    s = s.replace("*", "").replace("+", "")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def spherical_to_cartesian(ra_deg: float, dec_deg: float, dist_pc: float) -> np.ndarray:
    ra, dec = math.radians(ra_deg), math.radians(dec_deg)
    return np.array([
        dist_pc * math.cos(dec) * math.cos(ra),
        dist_pc * math.cos(dec) * math.sin(ra),
        dist_pc * math.sin(dec),
    ])


def angular_separation_deg(ra1, dec1, ra2, dec2) -> float:
    ra1, dec1, ra2, dec2 = map(math.radians, [ra1, dec1, ra2, dec2])
    cos_sep = (math.sin(dec1) * math.sin(dec2)
               + math.cos(dec1) * math.cos(dec2) * math.cos(ra1 - ra2))
    return math.degrees(math.acos(max(-1.0, min(1.0, cos_sep))))


# ── Hipparcos catalog — download once, cache locally ──────────────────────────

def load_hipparcos(repo_root: Path) -> "np.lib.recfunctions" or dict:
    cache_path = repo_root / "data" / "hipparcos.csv"
    if cache_path.exists():
        print(f"Loading cached Hipparcos catalog: {cache_path}")
        return _read_hip_csv(cache_path)

    if Vizier is None:
        sys.exit("astroquery is required for a first-time Hipparcos download (pip install astroquery)")

    print("Downloading Hipparcos main catalog via VizieR (I/239/hip_main) — one-time, ~20MB…")
    v = Vizier(columns=HIP_COLUMNS, row_limit=-1)
    result = v.get_catalogs(HIPPARCOS_CATALOG)
    table = result[0]

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with cache_path.open("w") as f:
        f.write(",".join(HIP_COLUMNS) + "\n")
        for row in table:
            vals = []
            for col in HIP_COLUMNS:
                v_ = row[col]
                vals.append("" if (v_ is None or (hasattr(v_, "mask") and v_.mask)) else str(v_))
            f.write(",".join(vals) + "\n")
    print(f"Cached {len(table)} stars → {cache_path}")
    return _read_hip_csv(cache_path)


def _read_hip_csv(path: Path) -> list:
    import csv
    stars = []
    with path.open() as f:
        for row in csv.DictReader(f):
            try:
                plx = float(row["Plx"]) if row["Plx"] else None
                vmag = float(row["Vmag"]) if row["Vmag"] else None
                if plx is None or vmag is None or plx <= 1.0:
                    continue  # unreliable/no parallax — SPEC.md §14.2.2
                stars.append({
                    "hip": int(row["HIP"]),
                    "ra": float(row["RAICRS"]),
                    "dec": float(row["DEICRS"]),
                    "plx": plx,
                    "e_plx": float(row["e_Plx"]) if row["e_Plx"] else None,
                    "vmag": vmag,
                    "bv": float(row["B-V"]) if row["B-V"] else 0.65,  # ~Sun-like default
                    "sptype": row["SpType"] or None,
                })
            except (ValueError, KeyError):
                continue
    return stars


# ── Per-exoplanet sky generation ───────────────────────────────────────────────

MAG_CUTOFF = 9.0
MAG_CUTOFF_NEAR = 6.5   # SPEC.md §14.5.3: "For exoplanets < 50 pc, use a tighter cutoff"
NEAR_DIST_PC = 50.0


def generate_sky_for_planet(planet: dict, hip_stars: list, limit_stars: int | None) -> dict | None:
    hostname = planet["hostname"]
    ra, dec, dist = planet.get("ra"), planet.get("dec"), planet.get("sy_dist")
    if ra is None or dec is None or dist is None:
        print(f"  SKIP {hostname}: missing ra/dec/sy_dist")
        return None

    sy_snum = planet.get("sy_snum") or 1
    if sy_snum > 1:
        print(f"  SKIP {hostname}: sy_snum={sy_snum} (binary/trinary component lookup not implemented this pass)")
        return None

    planet_xyz = spherical_to_cartesian(ra, dec, dist)
    mag_cutoff = MAG_CUTOFF_NEAR if dist < NEAR_DIST_PC else MAG_CUTOFF

    out_stars = []
    for s in hip_stars:
        dist_earth_pc = 1000.0 / s["plx"]
        star_xyz = spherical_to_cartesian(s["ra"], s["dec"], dist_earth_pc)
        rel = star_xyz - planet_xyz
        d_from_planet = float(np.linalg.norm(rel))
        if d_from_planet < 1e-6:
            continue

        dec_app = math.degrees(math.asin(max(-1.0, min(1.0, rel[2] / d_from_planet))))
        ra_app = math.degrees(math.atan2(rel[1], rel[0])) % 360.0

        app_mag = s["vmag"] + 5 * math.log10(d_from_planet / dist_earth_pc)
        if app_mag > mag_cutoff:
            continue

        teff = teff_from_bv(s["bv"])
        parallax_uncertain = bool(s["e_plx"] and s["plx"] > 0 and (s["e_plx"] / s["plx"]) > 0.3)
        pos_shift = angular_separation_deg(s["ra"], s["dec"], ra_app, dec_app)

        out_stars.append({
            "hip": s["hip"],
            "name": None,
            "bayer": None,
            "app_ra": round(ra_app, 4),
            "app_dec": round(dec_app, 4),
            "app_mag": round(app_mag, 3),
            "abs_mag": round(s["vmag"] - 5 * math.log10(dist_earth_pc / 10), 3),
            "spectral": s["sptype"],
            "teff": round(teff),
            "color_hex": color_hex_from_teff(teff),
            "dist_from_planet_pc": round(d_from_planet, 3),
            "dist_from_earth_pc": round(dist_earth_pc, 3),
            "earth_ra": round(s["ra"], 4),
            "earth_dec": round(s["dec"], 4),
            "pos_shift_deg": round(pos_shift, 4),
            "earth_constellation": None,  # needs IAU boundary data — not sourced this pass
            "parallax_uncertain": parallax_uncertain,
        })

    out_stars.sort(key=lambda s: s["app_mag"])
    if limit_stars:
        out_stars = out_stars[:limit_stars]

    nearby_alerts = [
        {
            "hip": s["hip"], "name": s["name"],
            "dist_from_planet_pc": s["dist_from_planet_pc"],
            "app_mag": s["app_mag"], "pos_shift_deg": s["pos_shift_deg"],
            "note": "Extremely close — appears dramatically brighter/shifted vs. its Earth position",
        }
        for s in out_stars if s["dist_from_planet_pc"] < 5.0
    ]

    host_teff = planet.get("st_teff") or SUN_TEFF
    host_color = color_hex_from_teff(host_teff)
    # Apparent magnitude of the host star as seen from its own planet (a few
    # AU away) — same inverse-square-law shortcut SPEC.md §14.1 notes the AU
    # offset is negligible for background-star parallax; here it matters
    # since we want *this* star's own brightness, not a background star's.
    orbsmax_au = planet.get("pl_orbsmax") or 1.0
    app_mag_host = -26.7 + 5 * math.log10(max(orbsmax_au, 0.01) / 1.0) if host_teff else None

    return {
        "meta": {
            "hostname": hostname,
            "pl_name": planet.get("pl_name"),
            "generated": None,  # filled in by main() with a real timestamp
            "generator_version": "1.0.0",
            "catalog": "HIP",
            "coord_epoch": "J2000.0",
            "star_count": len(out_stars),
            "cutoff_app_mag": mag_cutoff,
            "host_dist_pc": dist,
            "sky_complete": True,
        },
        "host_system": {
            "type": "single",
            "stars": [{
                "id": hostname,
                "spectral_type": planet.get("st_spectype"),
                "teff": host_teff,
                "st_rad": planet.get("st_rad"),
                "app_mag_from_planet": round(app_mag_host, 2) if app_mag_host is not None else None,
                "color_hex": host_color,
                "note": "Primary host star — rendered as moving sun in sky",
            }],
        },
        "stars": out_stars,
        "constellations": {"earth": [], "exotopia": []},
        "nearby_alerts": nearby_alerts,
    }


def pick_nearest_hostnames(planets: list, n: int) -> list:
    seen, ordered = set(), []
    for p in sorted((p for p in planets if p.get("sy_dist")), key=lambda p: p["sy_dist"]):
        if p["hostname"] not in seen:
            seen.add(p["hostname"])
            ordered.append(p["hostname"])
        if len(ordered) >= n:
            break
    return ordered


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--hostnames", type=str, default=None,
                    help="Comma-separated exact hostnames to target (overrides --nearest)")
    ap.add_argument("--nearest", type=int, default=10,
                    help="Fallback target list: N nearest-by-distance hostnames (default 10)")
    ap.add_argument("--limit-stars", type=int, default=None,
                    help="Cap output star count per file (smaller files for quick testing)")
    args = ap.parse_args()

    repo_root = Path(__file__).parent.parent
    src_path = repo_root / "public" / "exoplanets-viz.json"
    out_dir = repo_root / "public" / "sky"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading {src_path} …")
    with src_path.open() as f:
        planets = json.load(f)
    by_hostname = {}
    for p in planets:
        by_hostname.setdefault(p["hostname"], p)  # first pl_name per host is fine for host-star fields

    if args.hostnames:
        targets = [h.strip() for h in args.hostnames.split(",") if h.strip()]
    else:
        targets = pick_nearest_hostnames(planets, args.nearest)
    print(f"Target hostnames ({len(targets)}): {targets}")

    hip_stars = load_hipparcos(repo_root)
    print(f"Hipparcos stars with usable parallax: {len(hip_stars)}")

    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    index = {}
    for hostname in targets:
        planet = by_hostname.get(hostname)
        if not planet:
            print(f"  SKIP {hostname}: not found in exoplanets-viz.json")
            continue
        print(f"Generating sky for {hostname} …")
        sky = generate_sky_for_planet(planet, hip_stars, args.limit_stars)
        if sky is None:
            continue
        sky["meta"]["generated"] = now_iso

        slug = slugify(hostname)
        out_path = out_dir / f"{slug}.json"
        with out_path.open("w") as f:
            json.dump(sky, f, separators=(",", ":"))
        size_kb = out_path.stat().st_size // 1024
        print(f"  → {out_path} ({sky['meta']['star_count']} stars, {size_kb} KB)")

        index[slug] = {
            "hostname": hostname,
            "pl_name": planet.get("pl_name"),
            "star_count": sky["meta"]["star_count"],
        }

    index_path = out_dir / "index.json"
    with index_path.open("w") as f:
        json.dump(index, f, indent=2)
    print(f"\nWrote {index_path} ({len(index)} sky files indexed)")


if __name__ == "__main__":
    main()
