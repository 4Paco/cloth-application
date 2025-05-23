import matplotlib.pyplot as plt
from skimage import color
import numpy as np

# Data dictionary: sample name → list of (time, L, a, b)
samples = {
    "Echantillon1_241022_L_2Cam": [
        (0, 15.65, 8.93, -10.85),
        (30, 19.00, 8.38, -7.56),
        (45, 20.28, 8.53, -7.24),
        (60, 18.53, 8.37, -7.61),
    ],
    "Echantillon2_241022_L_1Coc": [
        (0, 43.24, 36.40, 2.56),
        (30, 46.15, 30.89, 2.74),
        (45, 47.55, 28.79, 3.45),
        (60, 47.87, 27.91, 4.14),
    ],
    "Echantillon3_241022_L_5Chl": [
        (0, 35.53, -13.92, 11.03),
        (30, 36.84, -9.52, 11.32),
        (45, 37.52, -8.29, 11.97),
        (60, 37.62, -7.38, 11.35),
    ],
    "Echantillon4_241022_L_5Coc": [
        (0, 29.01, 35.48, 2.79),
        (30, 30.64, 32.85, 3.09),
        (45, 31.21, 32.15, 3.15),
        (60, 31.06, 31.41, 3.48),
    ],
    "Echantillon5_241022_L_5Coc+2Camp": [
        (0, 13.63, 9.07, -4.12),
        (30, 14.49, 9.61, -3.80),
        (45, 15.21, 10.30, -3.62),
        (60, 14.44, 9.97, -3.54),
    ],
    "Echantillon6_241022_L_5GarR": [
        (0, 38.02, 40.78, 22.67),
        (30, 40.51, 39.91, 22.26),
        (45, 41.31, 40.23, 22.36),
        (60, 41.12, 40.11, 22.24),
    ],
}

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
