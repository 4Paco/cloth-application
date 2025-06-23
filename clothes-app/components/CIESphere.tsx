'use client';

import { Line, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ColorEntry } from './color_handling';
import { ColorTranslator } from 'colortranslator';
import { useDesign } from './DesignContextProvider';
import { toast } from 'sonner';

interface CIESphereProps {
    colorantsDatabase: ColorEntry[];
    tolerance: number;
    seeAllColorants: boolean;
    maxColors: number;
}

const tempObject = new THREE.Object3D();

function Spheres({
    points,
    selectedColors,
    clickCallback,
}: {
    points: {
        position: THREE.Vector3;
        color: THREE.Color;
    }[];
    selectedColors: number[];
    clickCallback: (id: number) => void;
}) {
    const colorArray = useMemo(
        () => Float32Array.from(points.flatMap((point) => point.color.toArray())),
        [points]
    );
    const meshRef = useRef<THREE.InstancedMesh>(undefined);

    let opacity = selectedColors.length > 0 ? 0.4 : 1.0;

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
                    clickCallback(e.instanceId as number);
                }
            }}
            frustumCulled={false}
        >
            <sphereGeometry args={[1.5, 16, 16]}>
                <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
            </sphereGeometry>
            <meshBasicMaterial
                toneMapped={false}
                vertexColors
                transparent={true}
                opacity={opacity} //selectedColors.includes(e.instanceId) ? 0.4 : 1.0}
            />
        </instancedMesh>
    );
}

type ColoredPoint = { hours: number; position: THREE.Vector3; color: THREE.Color };
export type Colorant = { id: number; points: ColoredPoint[] };

const CIESphere = ({
    colorantsDatabase,
    tolerance,
    seeAllColorants,
    maxColors,
}: CIESphereProps) => {
    const { designColorants, setDesignColorants } = useDesign();
    const [selectedColors, setSelectedColors] = useState<number[]>([]);
    const [colorantsFamiliesToPlot, setColorantsFamiliesToPlot] = useState<Colorant[]>([]);

    const points = useMemo(() => {
        const spheres: ColoredPoint[] = [];
        const step = 8;

        for (let L = 0; L <= 100; L += step) {
            for (let a = -125; a <= 125; a += step) {
                for (let b = -125; b <= 125; b += step) {
                    const color = new ColorTranslator({ L: L, a: a, b: b });
                    // const color = labToRgb(L, a, b);
                    spheres.push({
                        hours: 0,
                        position: new THREE.Vector3(a, b, L - 50),
                        color: new THREE.Color(color.R / 255, color.G / 255, color.B / 255),
                    });
                }
            }
        }
        return spheres;
    }, []);

    useEffect(() => {
        const getColorantsToPlot = () => {
            if (!colorantsDatabase) return [];
            let colorants_tolerated: ColorEntry[] = [];
            if (seeAllColorants) {
                colorants_tolerated = colorantsDatabase.filter((colorant) => colorant.hours === 0);
            } else {
                // if (!selectedPosition) return [];
                colorants_tolerated = colorantsDatabase.filter((colorant) => {
                    if (colorant.hours !== 0) return false;
                    const position = new THREE.Vector3(colorant.L, colorant.b, colorant.L - 50);
                    const distance = Math.min(
                        ...selectedColors.map((id) =>
                            new THREE.Vector3(...position).distanceTo(points[id].position)
                        )
                    );
                    return distance <= tolerance;
                });
            }

            const to_plot: Colorant[] = [];
            colorants_tolerated.forEach((node_0) => {
                const id = node_0.id;
                const family = colorantsDatabase.filter((col) => col.id === id);

                const points: ColoredPoint[] = [];
                family.forEach((node) => {
                    const position: THREE.Vector3 = new THREE.Vector3(node.a, node.b, node.L - 50);
                    // const color_node = labToRgb(node.L, node.a, node.b);
                    const color_node = new ColorTranslator({ L: node.L, a: node.a, b: node.b });

                    const color = new THREE.Color(
                        color_node.R / 255,
                        color_node.G / 255,
                        color_node.B / 255
                    );
                    points.push({
                        hours: node.hours,
                        position,
                        color,
                    });
                });
                to_plot.push({ id, points });
            });
            return to_plot;
        };

        setColorantsFamiliesToPlot(getColorantsToPlot());
    }, [colorantsDatabase, points, seeAllColorants, selectedColors, tolerance]);

    // const getPointsWithinTolerance = () => {
    //     if (!selectedPosition) return [];
    //     return points.filter((point) => {
    //         const distance = new THREE.Vector3(...point.position).distanceTo(
    //             new THREE.Vector3(...selectedPosition)
    //         );
    //         return distance <= tolerance;
    //     });
    // };

    // const pointsWithinTolerance = getPointsWithinTolerance();

    const clickCallback = (instanceId: number) => {
        if (selectedColors.length==0) {
            setSelectedColors([instanceId]);
        }
        // setSelectedColors((prev) => {
        //     if (prev.includes(instanceId)) {
        //         return prev.filter((id) => id !== instanceId);
        //     } else {
        //         //return [...prev, instanceId];
        //         return [instanceId];
        //     }
        // });
    };

    return (
        <>
            <div className="flex h-dvh text-white font-sans">
                {points.length > 0 && (
                    <Canvas
                        id="canvas"
                        camera={{ position: [0, 0, 250], fov: 75 }}
                        onPointerMissed={(e) => {
                            if (e.button == 0) {
                                setSelectedColors([]);
                            }
                        }}
                    >
                        <ambientLight intensity={1.2} />
                        <OrbitControls
                            mouseButtons={{
                                LEFT: undefined,
                                RIGHT: THREE.MOUSE.ROTATE,
                                MIDDLE: THREE.MOUSE.DOLLY,
                            }}
                        />

                        <Spheres
                            clickCallback={clickCallback}
                            selectedColors={selectedColors}
                            points={points}
                        />
                        {/* {points.map((point, idx) => (
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
                        ))} */}
                        {selectedColors.map((id) => {
                            return (
                                <mesh key={id} position={points[id].position}>
                                    <sphereGeometry args={[tolerance, 16, 16]}></sphereGeometry>
                                    <meshBasicMaterial
                                        toneMapped={false}
                                        // vertexColors
                                        color={points[id].color}
                                        transparent={true}
                                        opacity={0.4}
                                    />
                                </mesh>
                            );
                        })}
                        {colorantsFamiliesToPlot.map((family, idx) => {
                            const points_positions = family.points.map(({ position }) => position);
                            const points_colors = family.points.map(({ color }) => color);

                            const startPoint = family.points[family.points.length - 2].position;
                            const endPoint = family.points[family.points.length - 1].position;
                            const direction = new THREE.Vector3()
                                .subVectors(endPoint, startPoint)
                                .normalize();
                            const arrowLength = 5;
                            const arrowColor = 'red';
                            const arrowHeadLength = arrowLength / 3;

                            return (
                                <mesh key={String(idx) + '_' + String(idx)}>
                                    <Line
                                        points={points_positions}
                                        vertexColors={points_colors}
                                        lineWidth={20}
                                        onClick={() => {
                                            // Only allow up to maxColors
                                            const alreadySelected = designColorants.some(
                                                (c) => c.id === family.id
                                            );
                                            if (
                                                !alreadySelected &&
                                                designColorants.length < maxColors
                                            ) {
                                                setDesignColorants((prev) => {
                                                    return [...prev, family];
                                                });
                                                // const colorantObj = colorantsDatabase?.find(
                                                //     (c) => c.id === family.id && c.hours === 0
                                                // );
                                                // if (colorantObj) {
                                                //     setCurrentSelectedColors([
                                                //         ...current_selectedColors,
                                                //         colorantObj,
                                                //     ]);
                                                // }
                                            } else {
                                                toast('Warning', {
                                                    description:
                                                        'You reached the maximum amount of colorants, please remove one before adding another',
                                                });
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
                                                arrowHeadLength,
                                                2
                                            )
                                        }
                                    />
                                </mesh>
                            );
                        })}
                    </Canvas>
                )}
            </div>
        </>
    );
};
export default CIESphere;
