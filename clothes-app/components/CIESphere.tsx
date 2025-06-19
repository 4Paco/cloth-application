'use client';

import { Line, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { ColorEntry } from './color_handling';
import { ColorButton } from './ExcelButton';
import { ColorTranslator } from 'colortranslator';

import { cn } from '@/lib/utils';

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
    const [selectedSize, setSelectedSize] = useState(0.085);
    const [selectedPosition, setSelectedPosition] = useState<THREE.Vector3 | null>(null);
    const [colorValidated, setColorValidated] = useState(false);
    const [tolerance, setTolerance] = useState(0.1);
    const [tableau_test, setParsedData] = useState<ColorEntry[] | null>(null);
    const [selectedColorants, setSelectedColorants] = useState<ColorEntry[]>([]);

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

    //const tableau_test: ColorEntry[] = [
    //    { id: 1, hours: 0, L: 50, a: -40, b: 45, E: 2.5 },
    //    { id: 1, hours: 10, L: 53.23, a: 80.11, b: 67.22, E: 2.5 },
    //    { id: 1, hours: 20, L: 43, a: 50, b: 60, E: 2.5 },
    //    { id: 1, hours: 30, L: 33, a: 20, b: 55, E: 2.5 },
    //    { id: 1, hours: 40, L: 23, a: -10, b: 50, E: 2.5 },
    //    { id: 2, hours: 20, L: 60, a: 10, b: -15, E: 3.1 },
    //    { id: 3, hours: 15, L: 45, a: 25, b: -10, E: 1.8 },
    //    { id: 4, hours: 30, L: 70, a: -5, b: 20, E: 2.9 },
    //    { id: 5, hours: 25, L: 55, a: 15, b: -25, E: 3.4 },
    //];

    const getColorantsToPlot = () => {
        if (!selectedPosition) return [];

        const colorants_tolerated = tableau_test.filter((colorant) => {
            if (colorant.hours != 0) return false;

            const position = [colorant.a / 100, colorant.b / 100, (colorant.L - 50) / 100];
            const distance = new THREE.Vector3(...position).distanceTo(
                new THREE.Vector3(...selectedPosition)
            );
            return distance <= tolerance;
            //return true;
        });

        var to_plot = [];
        colorants_tolerated.forEach((node_0) => {
            const id = node_0.id;
            const family = tableau_test.filter((col) => {
                return col.id == id;
            });

            var positions_family = [];
            var colors_family = [];
            family.forEach((node) => {
                const position = [node.a / 100, node.b / 100, (node.L - 50) / 100];
                const color_node = labToRgb(node.L, node.a, node.b);
                const color_rgb = [color_node.r, color_node.g, color_node.b];
                positions_family.push(position);
                colors_family.push(color_rgb);
            });
            to_plot.push([id, positions_family, colors_family]);
        });
        return to_plot;
    };

    const colorantsFamiliesToPlot = getColorantsToPlot();

    const getPointsWithinTolerance = () => {
        if (!selectedPosition) return [];
        return points.filter((point) => {
            const distance = new THREE.Vector3(...point.position).distanceTo(
                new THREE.Vector3(...selectedPosition)
            );
            return distance <= tolerance;
        });
    };

    const pointsWithinTolerance = getPointsWithinTolerance();

    const suggestedColors = [
        points[1147].color,
        points[242].color,
        points[40].color,
        points[198].color,
        points[960].color,
        points[209].color,
    ];

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    height: '100vh',
                    color: 'white',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ width: '200px', background: '#111', padding: '1rem' }}>
                    <h3 className="font-bold">Open your CSV file containing colors</h3>
                    <div>
                        <ColorButton setParsedData={setParsedData} />
                    </div>
                    <h3>Suggested Colors</h3>
                    {suggestedColors.map((hex, i) => (
                        <div
                            key={String(i) + '_' + String(i) + '_' + String(i)}
                            onClick={() => {
                                if (!colorValidated) {
                                    setSelectedColor(hex);
                                    points.forEach((point) => {
                                        if (selectedColor === point.color) {
                                            console.log(point.color);
                                            setSelectedPosition(
                                                new THREE.Vector3(...point.position)
                                            );
                                        }
                                    });
                                }
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
                                style={{
                                    background: `#${selectedColor.getHexString()}`,
                                    height: 30,
                                }}
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
                    {selectedColor && (
                        <>
                            <label>Selection Tolerance</label>
                            <input
                                type="range"
                                min={0.01}
                                max={0.3}
                                step={0.005}
                                value={tolerance}
                                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </>
                    )}
                    {selectedColor && !colorValidated && (
                        <>
                            <input
                                type="Button"
                                //title="Validate selection"
                                defaultValue="Validate selection"
                                onClick={(e) => {
                                    setColorValidated(true), console.log(colorValidated);
                                }}
                                style={{ width: '100%', background: 'dimgrey' }}
                            />
                        </>
                    )}
                    {colorValidated && (
                        <>
                            <br />
                            <br />
                            <input
                                type="Button"
                                //title="Change selection"
                                defaultValue="Change selection"
                                onClick={(e) => {
                                    setColorValidated(false), console.log(colorValidated);
                                }}
                                style={{ width: '100%', background: 'dimgrey' }}
                            />
                        </>
                    )}
                </div>

                <Canvas
                    id="canvas"
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
                                if (!colorValidated) {
                                    setSelectedColor(point.color);
                                    setSelectedPosition(new THREE.Vector3(...point.position));
                                }
                            }}
                        >
                            <sphereGeometry
                                args={[
                                    selectedColor === point.color
                                        ? selectedSize
                                        : pointsWithinTolerance.includes(point)
                                        ? selectedSize * 0.7
                                        : colorValidated
                                        ? 0
                                        : 0.015,
                                    6,
                                    6,
                                ]}
                            />
                            <meshStandardMaterial color={point.color} />

                            {/* Add translucent sphere if the color matches selectedColor */}
                            {selectedColor === point.color && (
                                <mesh>
                                    <sphereGeometry args={[tolerance, 16, 16]} />
                                    <meshStandardMaterial
                                        color={point.color}
                                        transparent={true}
                                        opacity={0.4}
                                    />
                                </mesh>
                            )}
                        </mesh>
                    ))}
                    {colorantsFamiliesToPlot.map((array, idx) => {
                        const startPoint = new THREE.Vector3(...array[1][array[1].length - 2]); // First point of the line
                        const endPoint = new THREE.Vector3(...array[1][array[1].length - 1]); // Last point of the line
                        const direction = new THREE.Vector3()
                            .subVectors(endPoint, startPoint)
                            .normalize();
                        const arrowLength = 0.05;
                        const arrowColor = 'red';
                        const arrowHeadLength = arrowLength / 2;

                        return (
                            <mesh key={String(idx) + '_' + String(idx)}>
                                <Line
                                    points={array[1]}
                                    color="white"
                                    vertexColors={array[2]}
                                    lineWidth={10}
                                    onClick={() => {
                                        setSelectedColorants((prev) => {
                                            if (!prev.includes(array[0])) {
                                                return [...prev, array[0]];
                                            }
                                            return prev;
                                        });
                                    }}
                                />
                                {/* Add ArrowHelper */}
                                <primitive
                                    object={
                                        new THREE.ArrowHelper(
                                            direction,
                                            endPoint,
                                            arrowLength,
                                            arrowColor,
                                            arrowHeadLength
                                        )
                                    }
                                />
                            </mesh>
                        );
                    })}
                </Canvas>
                {selectedColorants.map((id_select, i) => (
                    <div className="flex place-items-center">
                        {tableau_test
                            .filter((d2) => d2.id == id_select)
                            .map((d2, i2) => {
                                const col = new ColorTranslator({
                                    L: d2.L,
                                    a: d2.a,
                                    b: d2.b,
                                });
                                const idx = (i - 4 * id_select) % 4;
                                return (
                                    idx == 0 && (
                                        <div
                                            key={i2}
                                            className={cn(
                                                'flex-1 h-[2rem]',
                                                i2 == 0 && ' rounded-l-md',
                                                i2 == 3 && ' rounded-r-md'
                                                // idx == i2 &&
                                                //     'h-[2.6rem] w-[2.4rem] rounded-t-sm rounded-b-sm'
                                            )}
                                            style={{
                                                backgroundColor: col.RGB,
                                            }}
                                        ></div>
                                    )
                                );
                            })}
                    </div>
                ))}
            </div>
        </>
    );
};

export default CIESphere;
