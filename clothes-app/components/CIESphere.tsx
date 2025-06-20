'use client';

import { Line, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { ColorEntry } from './color_handling';
import { ColorButton } from './ExcelButton';
import { ColorTranslator } from 'colortranslator';

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

interface CIESphereProps {
    current_selectedColors: ColorEntry[];
    setCurrentSelectedColors: (colors: ColorEntry[]) => void;
    maxColors: number;
}

const CIESphere = ({ current_selectedColors, setCurrentSelectedColors, maxColors }: CIESphereProps) => {
    const [selectedColor, setSelectedColor] = useState<THREE.Color | null>(null);
    const [selectedSize, setSelectedSize] = useState(0.085);
    const [selectedPosition, setSelectedPosition] = useState<THREE.Vector3 | null>(null);
    const [colorValidated, setColorValidated] = useState(false);
    const [seeAllColorants, setSeeAllColorants] = useState(false);
    const [tolerance, setTolerance] = useState(0.1);
    const [tableau_test, setParsedData] = useState<ColorEntry[] | null>(null);

    const points = useMemo(() => {
        const spheres: { position: [number, number, number]; color: THREE.Color }[] = [];
        const step = 10;

        for (let L = 0; L <= 100; L += step) {
            for (let a = -120; a <= 120; a += step) {
                for (let b = -120; b <= 120; b += step) {
                    const color = labToRgb(L, a, b);
                    spheres.push({
                        position: [a / 100, b / 100, (L - 50) / 100],
                        color,
                    });
                }
            }
        }
        return spheres;
    }, []);

    const getColorantsToPlot = () => {
        if (!tableau_test) return [];
        let colorants_tolerated: ColorEntry[] = [];
        if (seeAllColorants) {
            colorants_tolerated = tableau_test.filter((colorant) => colorant.hours === 0);
        } else {
            if (!selectedPosition) return [];
            colorants_tolerated = tableau_test.filter((colorant) => {
                if (colorant.hours !== 0) return false;
                const position: [number, number, number] = [
                    colorant.a / 100,
                    colorant.b / 100,
                    (colorant.L - 50) / 100,
                ];
                const distance = new THREE.Vector3(...position).distanceTo(
                    new THREE.Vector3(...selectedPosition)
                );
                return distance <= tolerance;
            });
        }

        type ToPlotType = [number, [number, number, number][], [number, number, number][]];
        const to_plot: ToPlotType[] = [];
        colorants_tolerated.forEach((node_0) => {
            const id = node_0.id;
            const family = tableau_test.filter((col) => col.id === id);

            const positions_family: [number, number, number][] = [];
            const colors_family: [number, number, number][] = [];
            family.forEach((node) => {
                const position: [number, number, number] = [
                    node.a / 100,
                    node.b / 100,
                    (node.L - 50) / 100,
                ];
                const color_node = labToRgb(node.L, node.a, node.b);
                const color_rgb: [number, number, number] = [color_node.r, color_node.g, color_node.b];
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

    // Handler to add/remove colorant
    function handleSelectColorant(colorant: ColorEntry) {
        const alreadySelected = current_selectedColors.some(c => c.id === colorant.id);
        if (alreadySelected) {
            setCurrentSelectedColors(current_selectedColors.filter(c => c.id !== colorant.id));
        } else if (current_selectedColors.length < maxColors) {
            setCurrentSelectedColors([...current_selectedColors, colorant]);
        }
    }

    // Handler to remove colorant by id
    function handleRemoveColorant(id: number) {
        setCurrentSelectedColors(current_selectedColors.filter(c => c.id !== id));
    }

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
                    <h3 className="font-bold">Open your CSV file containing colorants</h3>
                    <br />
                    <ColorButton setParsedData={setParsedData} setSeeAll={setSeeAllColorants} />
                    {tableau_test && (
                        <input
                            type="checkbox"
                            className="ml-2"
                            aria-label=".5a"
                            checked={seeAllColorants}
                            onChange={() => setSeeAllColorants((prev) => !prev)}
                        />
                    )}
                    <br />
                    <br />
                    <h3>Suggested Colors</h3>
                    {suggestedColors.map((hex, i) => (
                        <div
                            key={String(i) + '_' + String(i) + '_' + String(i)}
                            onClick={() => {
                                if (!colorValidated) {
                                    setSelectedColor(hex);
                                    points.forEach((point) => {
                                        if (selectedColor === point.color) {
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
                                min={0.0}
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
                                max={0.5}
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
                                type="button"
                                defaultValue="Validate selection"
                                onClick={() => setColorValidated(true)}
                                style={{ width: '100%', background: 'dimgrey' }}
                            />
                        </>
                    )}
                    {colorValidated && (
                        <>
                            <br />
                            <br />
                            <input
                                type="button"
                                defaultValue="Change selection"
                                onClick={() => setColorValidated(false)}
                                style={{ width: '100%', background: 'dimgrey' }}
                            />
                        </>
                    )}
                </div>
                {tableau_test && (
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
                            const startPoint = new THREE.Vector3(...array[1][array[1].length - 2]);
                            const endPoint = new THREE.Vector3(...array[1][array[1].length - 1]);
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
                                            // Only allow up to maxColors
                                            const alreadySelected = current_selectedColors.some(c => c.id === array[0]);
                                            if (!alreadySelected && current_selectedColors.length < maxColors) {
                                                const colorantObj = tableau_test?.find(c => c.id === array[0] && c.hours === 0);
                                                if (colorantObj) {
                                                    setCurrentSelectedColors([...current_selectedColors, colorantObj]);
                                                }
                                            }
                                        }}
                                    />
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
                )}
                {current_selectedColors.length > 0 && (
                    <div className="flex flex-col place-content-start">
                        <h4>Ongoing selection of colorants</h4>
                        {current_selectedColors.map((id_select, i) => {
                            const colorantData = tableau_test?.filter((d2) => d2.id === id_select.id) || [];
                            const maxHours = colorantData.length > 0 ? Math.max(...colorantData.map((d2) => d2.hours)) : 1;
                            const gradientStops = colorantData.map((d2) => {
                                const col = new ColorTranslator({
                                    L: d2.L,
                                    a: d2.a,
                                    b: d2.b,
                                });
                                return `${col.RGB}`;
                            });
                            return (
                                <div key={i + '_container'}>
                                    <button
                                        onClick={() => handleRemoveColorant(id_select.id)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="red"
                                            className="bi bi-trash-fill"
                                            viewBox="0 0 16 16"
                                        >
                                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                                        </svg>
                                    </button>
                                    <div
                                        key={String(i) + '_gradient'}
                                        className="rounded-md"
                                        style={{
                                            background: `linear-gradient(to right, ${gradientStops.join(
                                                ', '
                                            )})`,
                                            width: `${maxHours * 0.1}px`,
                                        }}
                                    ></div>
                                    <br />
                                    <br />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
export default CIESphere;