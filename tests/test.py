import pandas as pd
import matplotlib.pyplot as plt
from skimage import color
import numpy as np

# Load data from CSV
csv_path = "../clothes-app/public/dataset/data_dyes.csv"  # Replace with your CSV file path
df = pd.read_csv(csv_path)

# Group by 'id'
samples = {}
for sample_id, group in df.groupby("id"):
    samples[f"Sample {sample_id}"] = list(zip(group["hours"], group["L"], group["a"], group["b"]))

def lab_to_rgb(lab):
    """Convert CIELAB to RGB (values in range [0, 1])"""
    lab = np.array(lab).reshape(1, 1, 3)
    rgb = color.lab2rgb(lab)
    return rgb[0, 0, :]

# Plotting
fig, axs = plt.subplots(len(samples), 1, figsize=(8, 2 * len(samples)))
if len(samples) == 1:
    axs = [axs]  # Make it iterable if only one sample

for ax, (sample_name, values) in zip(axs, samples.items()):
    times = [v[0] for v in values]
    lab_colors = [(v[1], v[2], v[3]) for v in values]
    rgb_colors = [lab_to_rgb(lab) for lab in lab_colors]

    # Plot as color swatches
    for i, (t, rgb) in enumerate(zip(times, rgb_colors)):
        ax.add_patch(plt.Rectangle((i, 0), 1, 1, color=rgb))
        ax.text(i + 0.5, -0.1, f"{t}h", ha='center', va='top', fontsize=8)

    ax.set_xlim(0, len(times))
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title(sample_name, fontsize=10)

plt.tight_layout()
plt.show()
