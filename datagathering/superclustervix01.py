import pandas as pd
import requests
import json
import math
from io import StringIO

# Corrected Direct Access URL
CATALOG_URL = "https://vizier.u-strasbg.fr/viz-bin/asu-tsv?-source=J/A+A/558/A75/table1&-out.max=unlimited"

def z_to_dist_mpc(z):
    if not z or z <= 0: return 0
    return round((299792.458 * z) / 70, 2)

def temp_to_hex(kev):
    if pd.isna(kev) or kev <= 0: return "#88aacc"
    if kev < 3.0: return "#ffcc88" 
    if kev < 6.0: return "#ffeecc"
    return "#aaccff"

def run_import():
    print(f"Sourcing NASA Specifier J/A+A/558/A75...")
    
    try:
        response = requests.get(CATALOG_URL)
        response.raise_for_status()
    except Exception as e:
        print(f"Network error: {e}")
        return

    data_content = response.text

    # --- DYNAMIC DATA DISCOVERY ---
    # Instead of hardcoding skiprows, we find the line where the column names live.
    # In VizieR TSVs, the data table usually starts after a line of dashes or 
    # the first line that contains our expected columns.
    lines = data_content.splitlines()
    header_idx = 0
    for i, line in enumerate(lines):
        if "2XMM" in line and "RAdeg" in line:
            header_idx = i
            break
    
    # Reconstruct the string starting from the found header
    clean_data = "\n".join(lines[header_idx:])
    
    # Read the TSV
    # We use sep='\t' and no longer need skipbatch!
    df = pd.read_csv(StringIO(clean_data), sep='\t', comment='#')

    exotopia_records = []
    
    for _, row in df.iterrows():
        try:
            # Check for column names exactly as VizieR provides them
            # Sometimes they have leading underscores or specific casing
            name = row.get('_2XMM') or row.get('2XMM') or "Unknown"
            z_val = row.get('z', 0)
            t_val = row.get('Tap', 0)
            
            # Convert to floats safely
            z_f = float(z_val) if not pd.isna(z_val) else 0
            t_f = float(t_val) if not pd.isna(t_val) else 0
            
            record = {
                "name": str(name).strip(),
                "ra_deg": float(row.get('RAdeg', 0)),
                "dec_deg": float(row.get('DEdeg', 0)),
                "z": z_f,
                "dist_mpc": z_to_dist_mpc(z_f),
                "tap_kev": t_f,
                "color_hex": temp_to_hex(t_f),
                "source": "NASA/HEASARC/Takey2013"
            }
            exotopia_records.append(record)
        except Exception as e:
            continue 

    # 4. Save result
    output_file = "clusters_import.json"
    with open(output_file, "w") as f:
        json.dump(exotopia_records, f, indent=2)
    
    print(f"Success! Processed {len(exotopia_records)} clusters into {output_file}")

if __name__ == "__main__":
    run_import()
