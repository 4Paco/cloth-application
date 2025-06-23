import React, { useEffect, useRef } from 'react';

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
};

export default function PatternPreview({
    patternFile,
    colorants,
    baseColors,
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
                                    background: colorants[i],
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    border: '2px solid #444',
                                    display: 'inline-block',
                                }}
                            />
                            <span className="ml-2 text-neutral-400 text-sm">
                                replaces color {i + 1}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}