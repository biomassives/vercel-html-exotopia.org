import pandas as pd
import requests
import json
import math
from io import StringIO

# The corrected "Direct Access" URL for the NASA/Takey Table
CATALOG_URL = "https://vizier.u-strasbg.fr/viz-bin/asu-tsv?-source=J/A+A/558/A75/table1&-out.max=unlimited"

def z_to_dist_mpc(z):
    """Simple comoving distance approximation (H0=70)"""
    if not z or z <= 0: return 0
    return round((299792.458 * z) / 70, 2)

def temp_to_hex(kev):
    """Maps X-ray temperature to Exotopia visual hex colors"""
    if pd.isna(kev) or kev <= 0: return "#88aacc"
    if kev < 3.0: return "#ffcc88" 
    if kev < 6.0: return "#ffeecc"
    return "#aaccff"

def run_import():
    print(f"Sourcing NASA Specifier J/A+A/558/A75...")
    
    # 1. Fetch data
    try:
        response = requests.get(CATALOG_URL)
        response.raise_for_status()
    except Exception as e:
        print(f"Network error: {e}")
        return

    # 2. Parse TSV
    # VizieR TSV uses tabs and the data starts after the [DATA] marker or header lines
    # We skip the first 38 lines of metadata usually found in this specific export
    data_content = response.text
    if "2XMM" not in data_content:
        print("Data check failed: Table content not found in response.")
        return

    # Read, skipping the VizieR metadata header
    df = pd.read_csv(StringIO(data_content), sep='\t', comment='#', skipbatch=0, skiprows=36)

    # 3. Process into JSON
    exotopia_records = []
    
    for _, row in df.iterrows():
        # Using .get() because labels in TSV sometimes have leading/trailing spaces
        try:
            z_val = float(row.get('z', 0))
            t_val = float(row.get('Tap', 0)) if not pd.isna(row.get('Tap')) else 0
            
            record = {
                "name": str(row.get('_2XMM', 'Unknown')).strip(),
                "ra_deg": float(row.get('RAdeg', 0)),
                "dec_deg": float(row.get('DEdeg', 0)),
                "z": z_val,
                "dist_mpc": z_to_dist_mpc(z_val),
                "tap_kev": t_val,
                "color_hex": temp_to_hex(t_val),
                "source": "NASA/HEASARC/Takey2013"
            }
            exotopia_records.append(record)
        except:
            continue # Skip malformed rows (footer/header leftovers)

    # 4. Save result
    with open("clusters_import.json", "w") as f:
        json.dump(exotopia_records, f, indent=2)
    
    print(f"Success! Found {len(exotopia_records)} clusters.")

if __name__ == "__main__":
    run_import()
