import pandas as pd
import matplotlib.pyplot as plt
from skimage import color
import numpy as np
import scipy

df = pd.read_csv("../clothes-app/public/dataset/data_dyes.csv")

# Interpolation
extended_data = []
new_hours = np.arange(0, 1001, 30)

for material_id in df['id'].unique():
    subset = df[df['id'] == material_id]
    for column in ['L', 'a', 'b', 'E']:
        f = scipy.interpolate.interp1d(subset['hours'], subset[column], kind='linear', fill_value='extrapolate')
        interpolated = f(new_hours)
        if column == 'L':
            temp_df = pd.DataFrame({'id': material_id, 'hours': new_hours, column: interpolated})
        else:
            temp_df[column] = interpolated
    extended_data.append(temp_df)

# Combine all extended data
extended_df = pd.concat(extended_data, ignore_index=True)
extended_df = extended_df.round(2)

extended_df.to_csv("tmp.csv")
