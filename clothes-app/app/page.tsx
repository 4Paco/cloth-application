'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Color } from 'three';
import { ColorEntry } from '@/components/color_handling';
import { useRouter } from 'next/navigation';

const tableau_test: ColorEntry[] = [
    { id: 1, hours: 10, L: 60, a: -10, b: 40, E: 2.5 },
    { id: 1, hours: 20, L: 55, a: 0, b: 20, E: 3.0 },
    { id: 1, hours: 30, L: 45, a: 10, b: 5, E: 4.2 },
    { id: 1, hours: 40, L: 35, a: 20, b: -10, E: 5.1 },
];

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
    return new Color(
        Math.min(Math.max(r, 0), 1),
        Math.min(Math.max(g, 0), 1),
        Math.min(Math.max(bVal, 0), 1)
    );
}

export default function HomePage() {

  const [demoIndex, setDemoIndex] = useState(0);
  const demoEntry = tableau_test[demoIndex];
  const demoColor = labToRgb(demoEntry.L, demoEntry.a, demoEntry.b);
  const router = useRouter();
  const handleStartNow = () => {
    router.push('/login'); // Redirect to login page
  };
  const handleExploreTool = () => {
    router.push('/pattern'); // Redirect to palettes page
  };
  return (
    <main className="min-h-screen bg-neutral-950 text-white font-sans">
      {/* Hero Section */}
      <section
        className="flex flex-col items-center justify-center text-center py-32 px-6 bg-gradient-to-b from-neutral-900 to-black relative overflow-hidden"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 max-w-4xl">
            Visualize the evolution of your textile materials
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-2xl">
            An interactive tool for fashion designers concerned with sustainability
          </p>
          <div className="flex gap-4">
            <Link href="/pattern" className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-neutral-300 transition">
              Try the tool
            </Link>
            <Link href="#demo" className="border border-white px-6 py-3 rounded-xl font-medium hover:bg-white hover:text-black transition">
              See a demo
            </Link>
          </div>
        </div>
      </section>

            {/* Why Section */}
            <section className="px-6 py-20 bg-neutral-900 text-center">
                <h2 className="text-3xl font-semibold mb-4">Why this tool?</h2>
                <p className="text-neutral-400 max-w-3xl mx-auto">
                    Fast fashion depletes our resources. Yet, the way materials degrade remains
                    invisible at the design stage. This visualizer helps you integrate the time
                    dimension from the very beginning.
                </p>
            </section>

            {/* Features */}
            <section className="px-6 py-20 bg-black">
                <h2 className="text-3xl font-semibold text-center mb-12">Key features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    <div className="p-6 bg-neutral-800 rounded-2xl">
                        <h3 className="text-xl font-semibold mb-2">📂 Import your patterns</h3>
                        <p className="text-neutral-400">
                            Upload your own patterns or use our built-in library.
                        </p>
                    </div>
                    <div className="p-6 bg-neutral-800 rounded-2xl">
                        <h3 className="text-xl font-semibold mb-2">🎨 Visual evolution</h3>
                        <p className="text-neutral-400">
                            Simulate aging over time based on material data.
                        </p>
                    </div>
                    <div className="p-6 bg-neutral-800 rounded-2xl">
                        <h3 className="text-xl font-semibold mb-2">🧪 Test your dyes</h3>
                        <p className="text-neutral-400">
                            Import a CSV with aging data and visualize them.
                        </p>
                    </div>
                    <div className="p-6 bg-neutral-800 rounded-2xl">
                        <h3 className="text-xl font-semibold mb-2">👗 Choose your 3D model</h3>
                        <p className="text-neutral-400">
                            Choose a model that you want to visualize with your pattern
                        </p>
                    </div>
                </div>
            </section>

            {/* Interactive Demo */}
            <section id="demo" className="px-6 py-20 bg-neutral-950 text-center">
                <h2 className="text-3xl font-semibold mb-8">Try a demo</h2>
                <div className="max-w-xl mx-auto bg-neutral-800 p-6 rounded-2xl">
                    <p className="text-neutral-400 mb-4">
                        Move the slider to visualize fabric wear over time:
                    </p>
                    <input
                        type="range"
                        min={0}
                        max={tableau_test.length - 1}
                        value={demoIndex}
                        onChange={(e) => setDemoIndex(Number(e.target.value))}
                        className="w-full"
                    />
                    <div
                        className="mt-4 h-40 rounded-xl flex items-center justify-center"
                        style={{
                            background: demoColor.getStyle(),
                            transition: 'background 0.3s',
                        }}
                    >
                        <span className="text-lg font-semibold bg-black/40 px-4 py-2 rounded">
                            {`t = ${demoEntry.hours}h | L: ${demoEntry.L} a: ${demoEntry.a} b: ${demoEntry.b}`}
                        </span>
                    </div>
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
