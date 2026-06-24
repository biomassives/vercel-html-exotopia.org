import pandas as pd
import requests
from io import StringIO

def fetch_nasa_cluster_data():
    # HEASARC TAP service URL
    url = "https://heasarc.gsfc.nasa.gov/xamin/vo/tap/sync"
    
    # ADQL Query to get exactly what Exotopia needs
    query = """
    SELECT 
        name, ra, dec, redshift as z, r500, kt as tap_kev, 
        lx_bol_500 as l500, mass_500 as m500, bcg_ra, bcg_dec, 
        redshift_type as z_type, alt_name as ned_name
    FROM twoxmmsdss
    WHERE redshift > 0
    """
    
    response = requests.post(url, data={'query': query, 'format': 'csv'})
    
    if response.status_code == 200:
        return pd.read_csv(StringIO(response.text))
    else:
        print("Error fetching NASA data")
        return None

# Load it into your converter
df = fetch_nasa_cluster_data()
