'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDesign } from '@/components/DesignContextProvider';
import { Button } from '@/components/ui/button';

export default function PatternPage() {
    const { selectedPattern, setSelectedPattern, requiredColorCount, setRequiredColorCount } =
        useDesign();
    const [patternUrl, setPatternUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const preview_canvas = useRef<HTMLCanvasElement>(null);

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
            setRequiredColorCount(0);
        }
    }

    async function analyzePatternAndSetColorCount(file: File) {
        setLoading(true);
        try {
            const img = new window.Image();
            const url = URL.createObjectURL(file);

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = url;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx_import = canvas.getContext('2d');
            if (!ctx_import) throw new Error('Could not get canvas context');
            ctx_import.drawImage(img, 0, 0);

            const preview_cvs = preview_canvas.current as HTMLCanvasElement;

            const ctx = preview_cvs.getContext('2d') as CanvasRenderingContext2D;
            preview_cvs.width = 10 * img.width;
            preview_cvs.height = 10 * img.height;

            const imageData = ctx_import.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Chatgpt is your friend
            const niceColors = [
                '#FF6B6B', // Coral
                '#6BCB77', // Mint Green
                '#4D96FF', // Blue
                '#FFD93D', // Yellow
                '#FF9F1C', // Orange
                '#2EC4B6', // Teal
                '#E71D36', // Red
                '#011627', // Navy
                '#FFB5E8', // Pink
                '#8338EC', // Violet
                '#3A86FF', // Royal Blue
                '#FFBE0B', // Gold
                '#FB5607', // Dark Orange
                '#FF006E', // Magenta
                '#9B5DE5', // Purple
                '#00BBF9', // Sky Blue
                '#06D6A0', // Green
                '#EF476F', // Rose
                '#118AB2', // Tealish
                '#073B4C', // Dark Blue
            ];

            for (let x = 0; x < canvas.width; x += 1) {
                for (let y = 0; y < canvas.height; y += 1) {
                    const i = 4 * (x + y * canvas.width);
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    const index = r + g * 256 + b * 256 * 256;

                    console.log(r, g, b);

                    ctx.fillStyle = niceColors[index];
                    ctx.fillRect(10 * x, 10 * y, 10, 10);
                }
            }

            const colorSet = new Set<string>();
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // const key = `${Math.round(r/16)*16},${Math.round(g/16)*16},${Math.round(b/16)*16}`;
                const key = `${r},${g},${b}`;
                colorSet.add(key);
            }

            const colorCount = Math.min(colorSet.size, 10);
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
        <main className="min-h-dvh bg-neutral-950 text-white font-sans flex flex-col">
            <section
                className="flex flex-col flex-1 items-center justify-center text-center py-24 px-6 bg-gradient-to-b from-neutral-900 to-black relative overflow-hidden"
                style={{
                    backgroundImage: "url('/background.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl">
                        Import your pattern
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-xl">
                        Upload your textile pattern to analyze its color palette and start
                        visualizing its evolution.
                    </p>
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-neutral-800 text-white rounded-lg shadow-md tracking-wide uppercase border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition mb-6 max-w-xs">
                        <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                            />
                        </svg>
                        <span className="mt-2 text-base leading-normal">
                            Select a pattern image
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePatternChange}
                        />
                    </label>
                    {patternUrl && (
                        <div className="mt-4 flex flex-col justify-center space-y-2">
                            <canvas ref={preview_canvas}></canvas>
                            <div className="italic font-bold">
                                Colors are only for previsualization purposes
                            </div>
                        </div>
                    )}
                    {selectedPattern && (
                        <div className="mt-8 w-full flex flex-col items-center">
                            {loading ? (
                                <span className="text-indigo-400 font-medium">
                                    Analyzing pattern...
                                </span>
                            ) : (
                                <Button
                                    onClick={goToCIE}
                                    disabled={!requiredColorCount}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Configure {requiredColorCount > 0 ? requiredColorCount : '?'}{' '}
                                    color{requiredColorCount === 1 ? '' : 's'} in CIE
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </section>
            <section className="px-6 py-16 bg-neutral-900 text-center">
                <h2 className="text-2xl font-semibold mb-4">Why import a pattern?</h2>
                <p className="text-neutral-400 max-w-2xl mx-auto">
                    By uploading your own pattern, you can simulate how its colors will evolve over
                    time and make more sustainable design decisions.
                </p>
            </section>
            <footer className="px-6 py-10 bg-black text-center text-neutral-500 text-sm">
                <p>ENS Project – Supervised by Panos Mavros and Clarisse Barbot</p>
                <p className="mt-2">Developed as part of the IGR workshop – 2025</p>
            </footer>
        </main>
    );
}
