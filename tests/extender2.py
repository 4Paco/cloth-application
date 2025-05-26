import pandas as pd
import numpy as np
from scipy.interpolate import interp1d

def extrapolate_lab(csv_path, new_hours, kind='linear'):
    """
    Reads a CSV with columns: id, hours, L, a, b, E
    and extrapolates L, a, b values for each id at new_hours.
    
    Parameters:
    - csv_path: str, path to the CSV file.
    - new_hours: array-like, new hour values to extrapolate at.
    - kind: str, interpolation kind ('linear', 'quadratic', 'cubic', etc.).
    
    Returns:
    - DataFrame with columns: id, hours, L, a, b
      containing extrapolated color values.
    """
    df = pd.read_csv(csv_path)
    results = []

    for sample_id, group in df.groupby('id'):
        t = group['hours'].values
        L = group['L'].values
        a = group['a'].values
        b = group['b'].values
        
        # Create interpolators with extrapolation
        interp_L = interp1d(t, L, kind=kind, fill_value='extrapolate')
        interp_a = interp1d(t, a, kind=kind, fill_value='extrapolate')
        interp_b = interp1d(t, b, kind=kind, fill_value='extrapolate')
        
        # Evaluate at new hours
        L_new = interp_L(new_hours)
        a_new = interp_a(new_hours)
        b_new = interp_b(new_hours)
        
        # Collect results
        for h, Lval, aval, bval in zip(new_hours, L_new, a_new, b_new):
            results.append({
                'id': sample_id,
                'hours': h,
                'L': Lval,
                'a': aval,
                'b': bval
            })
    
    return pd.DataFrame(results)

# Example usage:
# Suppose 'colors.csv' contains the provided data,
# and you want to extrapolate to hours = [-30, 90].
new_hours = [30*i for i in range(20)]
extrapolated_df = extrapolate_lab("../clothes-app/public/dataset/data_dyes.csv", new_hours, kind='linear')
# extrapolated_df.head()
extrapolated_df.to_csv("tmp.csv")
