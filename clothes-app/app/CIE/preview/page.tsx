'use client';
import React from 'react';
import PatternPreview from '@/components/PatternPreview';
import { useDesign } from '@/components/DesignContextProvider';
import { ColorEntry } from '@/components/color_handling';
import { useRouter } from 'next/navigation';

// Helper: LAB to RGB (returns {r,g,b})
function labToRgb(L: number, a: number, b: number) {
    const y = (L + 16) / 116;
    const x = a / 500 + y;
    const z = y - b / 200;

    const [x3, y3, z3] = [x, y, z].map((v) => {
        const v3 = v ** 3;
        return v3 > 0.008856 ? v3 : (v - 16 / 116) / 7.787;
    });

    const refX = 95.047;
    const refY = 100.0;
    const refZ = 108.883;

    let X = x3 * refX;
    let Y = y3 * refY;
    let Z = z3 * refZ;

    X /= 100;
    Y /= 100;
    Z /= 100;

    let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
    let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
    let bVal = X * 0.0557 + Y * -0.204 + Z * 1.057;

    [r, g, bVal] = [r, g, bVal].map((c) =>
        c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c
    );
    return {
        r: Math.min(Math.max(r, 0), 1) * 255,
        g: Math.min(Math.max(g, 0), 1) * 255,
        b: Math.min(Math.max(bVal, 0), 1) * 255,
    };
}

// Helper: RGB to hex
function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
    return (
        '#' +
        [r, g, b]
            .map((x) => {
                const hex = Math.round(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            })
            .join('')
    );
}

async function extractMainColorsFromImage(
    file: File,
    colorCount = 3
): Promise<[number, number, number][]> {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve([]);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0);
            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Count color frequencies
            const colorMap: Record<string, number> = {};
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i],
                    g = data[i + 1],
                    b = data[i + 2];
                const key = `${r},${g},${b}`;
                colorMap[key] = (colorMap[key] || 0) + 1;
            }
            // Sort by frequency and take the top N
            const sorted = Object.entries(colorMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, colorCount)
                .map(([key]) => key.split(',').map(Number) as [number, number, number]);
            resolve(sorted);
        };
        img.onerror = () => resolve([]);
    });
}

export default function PreviewPage() {
    const { selectedPattern, designColorants, selectedDatabase } = useDesign();
    const [db, setDb] = React.useState<ColorEntry[]>([]);
    const [extractedBaseColors, setExtractedBaseColors] = React.useState<
        [number, number, number][]
    >([]);
    const router = useRouter();
    // Parse the database file on mount
    React.useEffect(() => {
        async function parseData() {
            if (selectedDatabase) {
                const txt = await selectedDatabase.text();
                setDb(txt ? parseCSVText(txt) : []);
            }
        }
        parseData();
    }, [selectedDatabase]);
    // Extract main colors from the pattern image
    React.useEffect(() => {
        if (selectedPattern) {
            extractMainColorsFromImage(selectedPattern, designColorants.length || 3).then(
                setExtractedBaseColors
            );
        }
    }, [selectedPattern, designColorants.length]);

    // For each selected colorant, find its initial color (hours === 0) in db
    const initialColorEntries = designColorants
        .map((id_select: any) => {
            const colorantData = db.filter((d2) => Number(d2.id) === Number(id_select.id));
            return colorantData.find((d2) => d2.hours === 0);
        })
        .filter((entry): entry is ColorEntry => entry !== undefined);

    const baseColors: [number, number, number][] = initialColorEntries.map((c) => {
        const rgb = labToRgb(c.L, c.a, c.b);
        return [rgb.r, rgb.g, rgb.b] as [number, number, number];
    });

    const colorants = initialColorEntries.map((c) => {
        const rgb = labToRgb(c.L, c.a, c.b);
        return rgbToHex(rgb);
    });

    if (!selectedPattern || colorants.length === 0 || baseColors.length === 0) {
        return (
            <div>
                Please select a pattern and colorants first.
                <br />
                Base colors length is {baseColors.length}
                <br />
                Colorants length is {colorants.length}
                <br />
                Selected pattern: {selectedPattern ? selectedPattern.name : 'None'}
                <br />
                DesignColorants is {designColorants.length}
                <br />
                Selected database: {selectedDatabase ? selectedDatabase.name : 'None'}
                <br />
                DB length: {db.length}
            </div>
        );
    }

    return (
        <main className="min-h-screen flex flex-col bg-neutral-950 text-white font-sans">
            {/* Preview Section */}
            <section
                className="flex flex-col flex-1 items-center justify-center text-center bg-gradient-to-b from-neutral-900 to-black relative overflow-hidden"
                style={{
                    backgroundImage: "url('/background.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="bg-neutral-800 rounded-xl p-8 shadow flex flex-col items-center w-full max-w-lg">
                    <PatternPreview
                        patternFile={selectedPattern}
                        colorants={colorants}
                        baseColors={extractedBaseColors}
                        colormapping={designColorants.map((_, i) => i)}
                    />

                    <div className="mt-8 w-full">
                        <h3 className="text-xl font-semibold mb-2">Selected Colorants</h3>
                        <div className="flex gap-4 flex-wrap justify-center">
                            {colorants.map((hex, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <div
                                        className="w-10 h-10 rounded-full border-2 border-white"
                                        style={{ background: hex }}
                                    />
                                    <span className="text-xs mt-1">{hex}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        onClick={() => router.push('/preview')}
                    >
                        Go to Preview
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-12 bg-black text-center text-neutral-500 text-sm">
                <p>ENS Project – Supervised by Panos Mavros and Clarisse Barbot</p>
                <p className="mt-2">Developed as part of the IGR workshop – 2025</p>
            </footer>
        </main>
    );
}
function parseCSVText(txt: string): ColorEntry[] {
    // Assumes CSV header: id,hours,L,a,b (order may vary)
    const lines = txt.trim().split('\n');
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        const entry: any = {};
        header.forEach((h, i) => {
            if (['L', 'a', 'b', 'hours'].includes(h)) {
                entry[h] = parseFloat(cols[i]);
            } else {
                entry[h] = cols[i];
            }
        });
        return entry as ColorEntry;
    });
}
