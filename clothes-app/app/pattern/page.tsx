'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDesign } from '@/components/DesignContextProvider';

export default function PatternPage() {
    const { selectedPattern, setSelectedPattern, requiredColorCount, setRequiredColorCount } = useDesign();
    const [patternUrl, setPatternUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (selectedPattern) {
            const url = URL.createObjectURL(selectedPattern);
            setPatternUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPatternUrl(null);
        }
    }, [selectedPattern]);

    function handlePatternChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setSelectedPattern(e.target.files[0]);
            setRequiredColorCount(0); // reset color count when new pattern is chosen
        }
    }

    async function analyzePatternAndSetColorCount(file: File) {
        setLoading(true);
        try {
            // Read the file as an image
            const img = new window.Image();
            const url = URL.createObjectURL(file);

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = url;
            });

            // Draw image to canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            ctx.drawImage(img, 0, 0);

            // Get pixel data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Count unique colors (using RGB, ignoring alpha)
            const colorSet = new Set<string>();
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Quantize to reduce noise (group similar colors)
                const key = `${Math.round(r/16)*16},${Math.round(g/16)*16},${Math.round(b/16)*16}`;
                colorSet.add(key);
            }

            // Estimate number of dominant colors (simple heuristic)
            const colorCount = Math.min(colorSet.size, 10); // cap at 10 for safety
            setRequiredColorCount(colorCount);
        } catch (err) {
            setRequiredColorCount(0);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (selectedPattern) {
            analyzePatternAndSetColorCount(selectedPattern);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPattern]);

    function goToCIE() {
        router.push('/CIE');
    }

    return (
        <div>
            <h1>Pattern Preview</h1>
            <input type="file" accept="image/*" onChange={handlePatternChange} />
            {patternUrl && (
                <div style={{ marginTop: 20 }}>
                    <img
                        src={patternUrl}
                        alt="Pattern preview"
                        style={{ maxWidth: 500, maxHeight: 500, borderRadius: 8 }}
                    />
                </div>
            )}
            {selectedPattern && (
                <div style={{ marginTop: 20 }}>
                    {loading ? (
                        <span>Analyzing pattern...</span>
                    ) : (
                        <button
                            onClick={goToCIE}
                            disabled={!requiredColorCount}
                            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                            Configure {requiredColorCount > 0 ? requiredColorCount : '?'} color{requiredColorCount === 1 ? '' : 's'} in CIE
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}