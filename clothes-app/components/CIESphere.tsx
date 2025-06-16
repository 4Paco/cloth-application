'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import * as THREE from 'three';

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

    return new THREE.Color(
        Math.min(Math.max(r, 0), 1),
        Math.min(Math.max(g, 0), 1),
        Math.min(Math.max(bVal, 0), 1)
    );
}

const CIESphere = () => {
    const [selectedColor, setSelectedColor] = useState<THREE.Color | null>(null);
    const [selectedSize, setSelectedSize] = useState(0.035);

    const points = useMemo(() => {
        const spheres: { position: [number, number, number]; color: THREE.Color }[] = [];
        const step = 10;

        for (let L = 20; L <= 90; L += step) {
            for (let a = -80; a <= 80; a += step) {
                for (let b = -80; b <= 80; b += step) {
                    const radius = Math.sqrt(a * a + b * b + (L - 50) * (L - 50));
                    if (radius <= 90) {
                        const color = labToRgb(L, a, b);
                        spheres.push({
                            position: [a / 100, b / 100, (L - 50) / 100],
                            color,
                        });
                    }
                }
            }
        }
        return spheres;
    }, []);

    const suggestedColors = [
        points[1147].color,
        points[242].color,
        points[40].color,
        points[198].color,
        points[960].color,
        points[209].color,
    ];

    return (
        <div style={{ display: 'flex', height: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
            <div style={{ width: '200px', background: '#111', padding: '1rem' }}>
                <h3>Suggested Colors</h3>
                {suggestedColors.map((hex, i) => (
                    <div
                        key={i}
                        onClick={() => {
                            setSelectedColor(hex);
                            console.log(new THREE.Color(hex));
                        }}
                        style={{
                            background: hex.getStyle(),
                            height: '30px',
                            width: '100%',
                            marginBottom: '10px',
                            cursor: 'pointer',
                        }}
                    />
                ))}
                {selectedColor && (
                    <>
                        <h4>Selected Color</h4>
                        <div
                            style={{ background: `#${selectedColor.getHexString()}`, height: 30 }}
                        ></div>
                        <label>Bubble Size</label>
                        <input
                            type="range"
                            min={0.01}
                            max={0.15}
                            step={0.005}
                            value={selectedSize}
                            onChange={(e) => setSelectedSize(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </>
                )}
            </div>
            <Canvas
                style={{ background: 'black', flex: 1 }}
                camera={{ position: [0, 0, 3], fov: 75 }}
            >
                <ambientLight intensity={1.2} />
                <OrbitControls />
                {points.map((point, idx) => (
                    <mesh
                        key={idx}
                        position={point.position}
                        onPointerDown={() => {
                            setSelectedColor(point.color);
                            console.log('idx :', idx);
                        }}
                    >
                        <sphereGeometry
                            args={[selectedColor === point.color ? selectedSize : 0.015, 6, 6]}
                        />
                        <meshStandardMaterial color={point.color} />
                    </mesh>
                ))}
            </Canvas>
        </div>
    );
};

export default CIESphere;
