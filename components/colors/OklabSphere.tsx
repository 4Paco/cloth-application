'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import Color from 'colorjs.io';
import { Slider } from '../ui/slider';

const tempObject = new THREE.Object3D();

function Spheres({
    points,
}: {
    points: {
        position: THREE.Vector3;
        color: THREE.Color;
    }[];
}) {
    const colorArray = useMemo(
        () => Float32Array.from(points.flatMap((point) => point.color.toArray())),
        [points]
    );
    const meshRef = useRef<THREE.InstancedMesh>(undefined);

    // We have to use useFrame because react is dumb :/
    useFrame(() => {
        if (!meshRef.current) return;
        points.forEach((point, id) => {
            if (meshRef === undefined || meshRef.current === undefined) return;
            // const selected = selectedColors.includes(id);
            point.color.toArray(colorArray, id * 3);
            meshRef.current.geometry.attributes.color.needsUpdate = true;

            tempObject.position.copy(point.position);
            // tempObject.scale.setScalar(selected ? 1.5 : 1);
            tempObject.updateMatrix();

            meshRef.current.setMatrixAt(id, tempObject.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, points.length]}
            onPointerDown={(e) => {
                if (e.button == 0) {
                    e.stopPropagation();
                }
            }}
            frustumCulled={false}
        >
            <sphereGeometry args={[1, 4, 4]}>
                <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
            </sphereGeometry>
            <meshBasicMaterial toneMapped={false} vertexColors transparent={true} />
        </instancedMesh>
    );
}

type ColoredPoint = { position: THREE.Vector3; color: THREE.Color };
export type Colorant = { id: number; points: ColoredPoint[] };

function smoothstep(x: number) {
    return x < 0.5 ? 2.0 * x * x : 2.0 * x * (2.0 - x) - 1.0;
}

function inv_smoothstep(x: number) {
    return x < 0.5 ? Math.sqrt(0.5 * x) : 1.0 - Math.sqrt(0.5 - 0.5 * x);
}

export default function OklabSphere() {
    const [min, setMin] = useState<number>(0);
    const [max, setMax] = useState<number>(1);
    const [power, setPower] = useState<number>(1);
    const [radius, setRadius] = useState<number>(1);

    const points = useMemo(() => {
        const spheres: ColoredPoint[] = [];
        const step = 0.05;

        const scale = 200;

        const extentMin = min;
        const extentMax = max;

        const cubeOffset = new THREE.Vector3(-40, 0, -150);
        const cubeSize = new THREE.Vector3(30, 30, 30);

        const map_component = (v: number, min: number, max: number, p: number) => {
            const v_norm = (v - min) / (max - min);
            return min + Math.pow(v_norm, p) * (max - min);
        };

        const map_components = (r: number, g: number, b: number, radius: number) => {
            return [r, g, b];
            const d = Math.sqrt(r * r + g * g + b * b) / radius;
            return [r / d, g / d, b / d];
        };

        for (let r = extentMin; r <= extentMax; r += step) {
            for (let g = extentMin; g <= extentMax; g += step) {
                for (const b of [extentMax]) {
                    const r_mapped_int = map_component(r, extentMin, extentMax, power);
                    const g_mapped_int = map_component(g, extentMin, extentMax, power);
                    const b_mapped_int = map_component(b, extentMin, extentMax, power);
                    const [r_mapped, g_mapped, b_mapped] = map_components(
                        r_mapped_int,
                        g_mapped_int,
                        b_mapped_int,
                        radius
                    );
                    const color = new Color('srgb', [r_mapped, g_mapped, b_mapped]);
                    const colorOKLCH = color.toGamut('oklch');

                    spheres.push({
                        position: new THREE.Vector3(
                            scale * (colorOKLCH.oklch.l - 0.4),
                            scale * (colorOKLCH.oklch.c - 0.2),
                            scale * (colorOKLCH.oklch.h / 360 - 0.5)
                        ),
                        color: new THREE.Color(color.srgb.r, color.srgb.g, color.srgb.b),
                    });

                    spheres.push({
                        position: new THREE.Vector3(
                            cubeOffset.x + cubeSize.x * r_mapped,
                            cubeOffset.y + cubeSize.y * g_mapped,
                            cubeOffset.z + cubeSize.z * b_mapped
                        ),
                        color: new THREE.Color(color.srgb.r, color.srgb.g, color.srgb.b),
                    });
                }
            }
        }
        for (let r = extentMin; r <= extentMax; r += step) {
            for (const g of [extentMax]) {
                for (let b = extentMin; b <= extentMax; b += step) {
                    const r_mapped_int = map_component(r, extentMin, extentMax, power);
                    const g_mapped_int = map_component(g, extentMin, extentMax, power);
                    const b_mapped_int = map_component(b, extentMin, extentMax, power);
                    const [r_mapped, g_mapped, b_mapped] = map_components(
                        r_mapped_int,
                        g_mapped_int,
                        b_mapped_int,
                        radius
                    );
                    const color = new Color('srgb', [r_mapped, g_mapped, b_mapped]);
                    const colorOKLCH = color.toGamut('oklch');

                    spheres.push({
                        position: new THREE.Vector3(
                            scale * (colorOKLCH.oklch.l - 0.4),
                            scale * (colorOKLCH.oklch.c - 0.2),
                            scale * (colorOKLCH.oklch.h / 360 - 0.5)
                        ),
                        color: new THREE.Color(color.srgb.r, color.srgb.g, color.srgb.b),
                    });

                    spheres.push({
                        position: new THREE.Vector3(
                            cubeOffset.x + cubeSize.x * r_mapped,
                            cubeOffset.y + cubeSize.y * g_mapped,
                            cubeOffset.z + cubeSize.z * b_mapped
                        ),
                        color: new THREE.Color(color.srgb.r, color.srgb.g, color.srgb.b),
                    });
                }
            }
        }
        for (const r of [extentMax]) {
            for (let g = extentMin; g <= extentMax; g += step) {
                for (let b = extentMin; b <= extentMax; b += step) {
                    const r_mapped_int = map_component(r, extentMin, extentMax, power);
                    const g_mapped_int = map_component(g, extentMin, extentMax, power);
                    const b_mapped_int = map_component(b, extentMin, extentMax, power);
                    const [r_mapped, g_mapped, b_mapped] = map_components(
                        r_mapped_int,
                        g_mapped_int,
                        b_mapped_int,
                        radius
                    );
                    const color = new Color('srgb', [r_mapped, g_mapped, b_mapped]);
                    const colorOKLCH = color.toGamut('oklch');

                    spheres.push({
                        position: new THREE.Vector3(
                            scale * (colorOKLCH.oklch.l - 0.4),
                            scale * (colorOKLCH.oklch.c - 0.2),
                            scale * (colorOKLCH.oklch.h / 360 - 0.5)
                        ),
                        color: new THREE.Color(color.srgb.r, color.srgb.g, color.srgb.b),
                    });

                    spheres.push({
                        position: new THREE.Vector3(
                            cubeOffset.x + cubeSize.x * r_mapped,
                            cubeOffset.y + cubeSize.y * g_mapped,
                            cubeOffset.z + cubeSize.z * b_mapped
                        ),
                        color: new THREE.Color(color.srgb.r, color.srgb.g, color.srgb.b),
                    });
                }
            }
        }
        // for (let L = -1; L <= 1; L += step) {
        //     for (let c = -1; c <= 1; c += step / 0.8) {
        //         for (let h = -1; h <= 1; h += step / 0.8) {
        //             // const color = new Color('oklab', [L, a, b]);
        //             const color = new Color('oklch', [(L + 1) / 2, (c + 1) / 2, (h + 1) * 180]);
        //             if (!color.inGamut('srgb')) continue;
        //             const colorSRGB = color.toGamut('srgb');

        //             spheres.push({
        //                 hours: 0,
        //                 position: new THREE.Vector3(100 * L, 100 * c, h * 100),
        //                 color: new THREE.Color(
        //                     colorSRGB.srgb.r,
        //                     colorSRGB.srgb.g,
        //                     colorSRGB.srgb.b
        //                 ),
        //             });
        //         }
        //     }
        // }
        // for (let L = 0; L <= 1; L += step) {
        //     for (let a = -0.4; a <= 0.4; a += step / 0.8) {
        //         for (let b = -0.4; b <= 0.4; b += step / 0.8) {
        //             // const color = new Color('oklab', [L, a, b]);
        //             const color = new Color('oklch', [L, a, (360 * (b + 0.4)) / 0.8]);
        //             if (!color.inGamut('srgb')) continue;
        //             const colorSRGB = color.toGamut('srgb');

        //             spheres.push({
        //                 hours: 0,
        //                 position: new THREE.Vector3(100 * a, 100 * b, (L - 0.5) * 100),
        //                 color: new THREE.Color(
        //                     colorSRGB.srgb.r,
        //                     colorSRGB.srgb.g,
        //                     colorSRGB.srgb.b
        //                 ),
        //             });
        //         }
        //     }
        // }
        return spheres;
    }, [max, min, power, radius]);

    return (
        <>
            <div className="flex h-dvh font-sans">
                {points.length > 0 && (
                    <Canvas
                        id="canvas"
                        camera={{ position: [0, 0, 250], fov: 75, near: 10, far: 1000 }}
                        frameloop="demand"
                    >
                        <ambientLight intensity={1.2} />
                        <OrbitControls
                            mouseButtons={{
                                LEFT: undefined,
                                RIGHT: THREE.MOUSE.ROTATE,
                                MIDDLE: THREE.MOUSE.DOLLY,
                            }}
                        />

                        <Spheres points={points} />
                    </Canvas>
                )}
                <div className="absolute w-[500px] top-10 left-10 flex flex-col gap-4">
                    <Slider value={[min]} onValueChange={(v) => setMin(v[0])} max={1} step={0.01} />
                    <Slider value={[max]} onValueChange={(v) => setMax(v[0])} max={1} step={0.01} />
                    <div className="flex gap-2">
                        <Slider
                            value={[power]}
                            onValueChange={(v) => setPower(v[0])}
                            min={0}
                            max={5}
                            step={0.01}
                        />
                        <div>{power}</div>
                    </div>
                    <div className="flex gap-2">
                        <Slider
                            value={[radius]}
                            onValueChange={(v) => setRadius(v[0])}
                            min={0}
                            max={5}
                            step={0.01}
                        />
                        <div>{radius}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
