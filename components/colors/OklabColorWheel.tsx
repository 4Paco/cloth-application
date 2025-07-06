'use client';

import React, { useRef, useEffect, useState } from 'react';
import Color from 'colorjs.io';
import { Slider } from '../ui/slider';

export default function OKLABColorWheel({ size = 150, l = 0.25 }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [lightness, setLightness] = useState(l);
    const [chroma, setChroma] = useState(0.12);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const radius = size / 2;
        ctx.lineWidth = 1;
        ctx.clearRect(0, 0, size, size);
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;

                const dx = x - radius;
                const dy = y - radius;
                const r = Math.sqrt(dx * dx + dy * dy);
                const theta = Math.atan2(dy, dx);

                if (r >= radius) continue;

                // const l = 0.75;
                const c = chroma * (r / radius);
                const h = (180 * theta) / Math.PI;

                let colorSRGB = new Color('oklch', [lightness, c, h]);

                if (!colorSRGB.inGamut('srgb')) {
                    data[i + 3] = 0; // Transparent pixel
                    continue;
                }

                colorSRGB = colorSRGB.toGamut({ space: 'srgb' });

                data[i] = Math.round(colorSRGB.srgb.r * 255);
                data[i + 1] = Math.round(colorSRGB.srgb.g * 255);
                data[i + 2] = Math.round(colorSRGB.srgb.b * 255);
                data[i + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }, [chroma, lightness, size]);

    return (
        <div className="flex p-4 gap-4">
            <div className="flex flex-col w-[500px]">
                <div className="flex gap-2">
                    <div>Chroma</div>
                    <Slider
                        value={[chroma]}
                        onValueChange={(v) => setChroma(v[0])}
                        min={0}
                        max={1}
                        step={0.001}
                    />
                    <div>{chroma}</div>
                </div>
                <div className="flex gap-2">
                    <div>Lightness</div>
                    <Slider
                        value={[lightness]}
                        onValueChange={(v) => setLightness(v[0])}
                        min={0}
                        max={1}
                        step={0.001}
                    />
                    <div>{lightness}</div>
                </div>
            </div>
            <canvas ref={canvasRef} width={size} height={size} />
        </div>
    );
}
