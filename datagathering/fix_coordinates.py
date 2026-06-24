#!/usr/bin/env python3
"""
fix_coordinates.py
Parse RA/Dec from J-designation names in clusters_import.json and write them
into ra_deg / dec_deg fields (currently all 0.0).

J-name format:  JHHMMSS.s+DDMMSS  or  JHHMMSS.s-DDMMSS
"""

import json
import re
from pathlib import Path

HERE = Path(__file__).parent
SRC  = HERE / "clusters_import.json"
DST  = HERE / "clusters_import.json"   # overwrite in place


def parse_j_name(name: str) -> tuple[float, float]:
    m = re.match(
        r"J(\d{2})(\d{2})(\d{2}\.\d+)([+-])(\d{2})(\d{2})(\d{2})", name
    )
    if not m:
        return 0.0, 0.0
    h, mi, s, sign, dd, dm, ds = m.groups()
    ra  = int(h) * 15 + int(mi) * 15 / 60 + float(s) * 15 / 3600
    dec = (int(dd) + int(dm) / 60 + int(ds) / 3600) * (1 if sign == "+" else -1)
    return round(ra, 4), round(dec, 4)


data = json.loads(SRC.read_text())

fixed = 0
for rec in data:
    if rec.get("ra_deg", 0.0) == 0.0 and rec.get("dec_deg", 0.0) == 0.0:
        ra, dec = parse_j_name(rec["name"])
        rec["ra_deg"]  = ra
        rec["dec_deg"] = dec
        fixed += 1

DST.write_text(json.dumps(data, indent=2))
print(f"Fixed {fixed} / {len(data)} records → {DST}")
