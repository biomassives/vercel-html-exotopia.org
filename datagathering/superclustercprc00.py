import json
import math

def z_to_dist_mpc(z):
    """
    Calculates comoving distance for H0=70, Om=0.3, Ol=0.7.
    Approximate integration for the Exotopia scene scale.
    """
    if z <= 0: return 0
    c_over_H0 = 4285.7  # Mpc
    steps = 500
    dz = z / steps
    dist = 0.0
    for i in range(steps):
        zi = (i + 0.5) * dz
        Ez = math.sqrt(0.3 * (1 + zi)**3 + 0.7)
        dist += (c_over_H0 * dz) / Ez
    return round(dist, 2)

def temp_to_hex(kev):
    """Maps X-ray temperature to visual hex colors."""
    if kev is None or kev <= 0: return "#88aacc"
    if kev < 2.0: return "#ffcc88"  # Warm orange
    if kev < 3.5: return "#ffeecc"  # Yellow-white
    if kev < 5.0: return "#eef4ff"  # Near white
    if kev < 7.0: return "#cce0ff"  # Blue-white
    return "#aaccff"               # Ice blue

def parse_fixed_width(line, layout):
    """Extracts data from a line based on a byte-range dictionary."""
    record = {}
    for key, (start, end, dtype) in layout.items():
        try:
            # Strings are 1-indexed in your description, Python is 0-indexed
            val = line[start-1:end].strip()
            if not val or val == "---":
                record[key] = None
            else:
                record[key] = dtype(val)
        except (ValueError, IndexError):
            record[key] = None
    return record

# Define layouts for Table 1 and Table 2 based on your documentation
t1_layout = {
    "name": (14, 29, str),
    "ra_deg": (31, 39, float),
    "dec_deg": (41, 49, float),
    "z": (62, 67, float),
    "r500_kpc": (81, 87, float),
    "tap_kev": (89, 92, float),
    "l500": (140, 146, float),
    "m500": (155, 159, float),
    "bcg_ra": (194, 202, float),
    "bcg_dec": (204, 212, float),
    "z_type": (231, 237, str),
    "n_spec_gal": (228, 229, int),
    "offset_kpc": (239, 244, float),
    "ned_name": (246, 274, str)
}

# Table 2 is similar but fields shift slightly (e.g., T500 vs Tap)
t2_layout = t1_layout.copy()
t2_layout["tap_kev"] = (134, 137, float) # Using T500 as Tap for consistency

def process_catalog(file_path, layout, table_id):
    results = []
    with open(file_path, 'r') as f:
        for line in f:
            if len(line) < 100: continue # Skip headers/empty
            data = parse_fixed_width(line, layout)
            
            # Enrich with Exotopia specific computed fields
            if data['z'] is not None:
                data['dist_mpc'] = z_to_dist_mpc(data['z'])
                data['color_hex'] = temp_to_hex(data.get('tap_kev'))
                data['source_table'] = table_id
                results.append(data)
    return results

# Implementation logic
# table1_data = process_catalog('table1.dat', t1_layout, 1)
# table2_data = process_catalog('table2.dat', t2_layout, 2)
# combined = table1_data + table2_data

# with open('exotopia_clusters.json', 'w') as f:
#     json.dump(combined, f, indent=2)
