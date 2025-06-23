import React, { useEffect, useRef, useState } from 'react';

// Helper to convert hex to rgb
function hexToRgb(hex: string) {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return res
    ? {
        r: parseInt(res[1], 16),
        g: parseInt(res[2], 16),
        b: parseInt(res[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

type PatternPreviewProps = {
  patternFile: File;
  colorants: string[]; // hex codes, e.g. ['#ff0000', '#00ff00']
  baseColors: [number, number, number][]; // e.g. [[255,0,0],[0,255,0]]
  colormapping : number[]; // e.g. [0, 1, 2] for mapping base colors to colorants
};

function colorDistanceRGB(rgb1: [number, number, number], rgb2: [number, number, number]): number {
    return Math.sqrt(
        Math.pow(rgb1[0] - rgb2[0], 2) +
        Math.pow(rgb1[1] - rgb2[1], 2) +
        Math.pow(rgb1[2] - rgb2[2], 2)
    );
}



function createColorMap(
  baseColors: [number, number, number][],
  colorants: string[]
): number[] {
  // Initialize map with -1 (unassigned)
  const colorMap: number[] = Array(baseColors.length).fill(-1);

  // List of all [baseIndex, colorantIndex, distance]
  const candidates: { baseIndex: number; colorantIndex: number; distance: number }[] = [];

  baseColors.forEach((base, baseIndex) => {
    colorants.forEach((colorant, colorantIndex) => {
      const rgb = hexToRgb(colorant);
      const distance = colorDistanceRGB(base, [rgb.r, rgb.g, rgb.b]);
      candidates.push({ baseIndex, colorantIndex, distance });
    });
  });

  // Sort all pairs by distance (closest first)
  candidates.sort((a, b) => a.distance - b.distance);

  const usedBase = new Set<number>();
  const usedColorants = new Set<number>();

  for (const { baseIndex, colorantIndex } of candidates) {
    if (!usedBase.has(baseIndex) && !usedColorants.has(colorantIndex)) {
      colorMap[baseIndex] = colorantIndex;
      usedBase.add(baseIndex);
      usedColorants.add(colorantIndex);
    }
  }

  return colorMap;
}


export default function PatternPreview({
    patternFile,
    colorants,
    baseColors,
    colormapping,
}: PatternPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!patternFile || colorants.length === 0 || baseColors.length === 0) {
            return;
        }
        const img = new window.Image();
        img.src = URL.createObjectURL(patternFile);
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                for (let j = 0; j < baseColors.length; j++) {
                    const [r, g, b] = baseColors[j].map(c => Math.round(c));
                    if (
                        imageData.data[i] === r &&
                        imageData.data[i + 1] === g &&
                        imageData.data[i + 2] === b
                    ) {
                        const rgb = hexToRgb(colorants[j]);
                        imageData.data[i] = rgb.r;
                        imageData.data[i + 1] = rgb.g;
                        imageData.data[i + 2] = rgb.b;
                        break;
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
        };
        return () => URL.revokeObjectURL(img.src);
    }, [patternFile, colorants, baseColors]);
    const [colorMapping, setColormapping] = useState<number[]>(() => {
        // Initialize mapping, for example all assigned initially:
        return baseColors.map((_, i) => i < colorants.length ? i : -1);
    });
    colormapping = [...colorMapping];

    function handleRemove(index: number) {
        setColormapping(prev => {
            const newMapping = [...prev];
            newMapping[index] = -1; // Mark as unassigned
            colormapping[index] = -1;
            return newMapping;
        });
        }
    function handleColorChange(index: number, color_index: number) {
        setColormapping(prev => {
            const newMapping = [...prev];
            newMapping[index] = color_index; // Mark as unassigned
            colormapping[index] = color_index;
            return newMapping;
        });
        }

    const [pickerIndex, setPickerIndex] = useState(null);
    const inputRef = useRef(null);
    return (
        <section className="p-6 bg-gray-800 text-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center">Pattern Preview</h2>
            <div className="flex flex-col items-center">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    style={{ width:'400px', height:'400px', borderRadius: 12, border: '1px solid #333', background: '#222' }}
                    className="mb-6"
                />
                <div className="w-full mt-4 flex flex-col gap-3">
                    <h3 className="text-lg font-medium mb-2">Color Mapping</h3>
                    {baseColors.map((base, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span
                                style={{
                                    background: `rgb(${base[0]},${base[1]},${base[2]})`,
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    border: '2px solid #444',
                                    display: 'inline-block',
                                }}
                            />
                            <span className="text-xl">→</span>
                            <span
                                style={{
                                    background: colormapping[i] !== -1 ? colorants[colorMapping[i]] : 'transparent',
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    border: '2px solid #444',
                                    display: 'inline-block',
                                }}
                            />
                            <button
                                style={{
                                    padding: '2px 6px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleRemove(i)}
                                >
                                ❌ Remove assigned color
                            </button>
                            <div className="flex items-center gap-2">
                            <select
                                value={colorMapping[i]}
                                onChange={(e) => handleColorChange(i, parseInt(e.target.value))}
                                className="bg-gray-700 text-white px-2 py-1 rounded"
                            >
                                <option value={-1}>None</option>
                                {colorants.map((color, idx) => (
                                    <option key={idx} value={idx}>
                                        {color}
                                    </option>
                                ))}
                            </select>
                            {colorMapping[i] !== -1 && (
                                <div
                                    style={{
                                        backgroundColor: colorants[colorMapping[i]],
                                        width: 20,
                                        height: 20,
                                        borderRadius: 4,
                                        border: '1px solid #555',
                                    }}
                                />
                            )}
                        </div>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}