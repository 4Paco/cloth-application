'use client';

import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three/webgpu';
import { OBJLoader } from 'three/examples/jsm/Addons.js';
import { Slider } from '@/components/ui/slider';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useDesign } from '@/components/DesignContextProvider';
import { ColorTranslator } from 'colortranslator';
import { Canvas, invalidate, useLoader } from '@react-three/fiber';
import { WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js';
import Controls from '@/components/3d/Controls';
import { useHelper, useTexture } from '@react-three/drei';
import {
    add,
    div,
    floor,
    mod,
    mul,
    sub,
    texture,
    textureLoad,
    uint,
    uniform,
    uvec2,
    uvec3,
} from 'three/tsl';
import { Colorant } from '@/components/CIESphere';
import { Perf } from 'r3f-perf';

function draw_gradient_line(
    ctx: CanvasRenderingContext2D,
    id: number,
    colorants: { time: number; color: THREE.Color }[],
    max_time: number,
    width: number = 100
) {
    if (colorants.length == 1) {
        const color = colorants[0].color;
        const color_translated = new ColorTranslator({
            R: 255 * color.r,
            G: 255 * color.g,
            B: 255 * color.b,
        });
        ctx.fillStyle = color_translated.RGB;
        ctx.fillRect(0, id, width, 1);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, width, 0);

        colorants.forEach(({ time, color }) => {
            const color_translated = new ColorTranslator({
                R: 255 * color.r,
                G: 255 * color.g,
                B: 255 * color.b,
            });
            gradient.addColorStop(time / max_time, color_translated.RGB);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, id, width, 1);
    }
}

function ThreeScene({ currentTime, maxTime }: { currentTime: number; maxTime: number }) {
    const [uvScale] = useState<THREE.Vector2>(new THREE.Vector2(100, 100));
    const preview_object = useLoader(OBJLoader, 'sphere.obj');
    const textures = useTexture({
        albedo: 'default_cloth/albedo.png',
        normal: 'default_cloth/normal.png',
        height: 'default_cloth/height.png',
        alpha: 'default_cloth/alpha.png',
        ambient_occlusion: 'default_cloth/height.png',
        ids: 'default_cloth/ids.png',
        pixels: 'pixels3.png',
    });

    const [lookup_resolution] = useState(10);

    const { designColorants, heatmap } = useDesign();

    const uTime = useMemo(() => uniform(0), []);
    useEffect(() => {
        if (preview_material) {
            uTime.value = currentTime;
            invalidate();
        }
    }, [currentTime]);

    const color_evolution_lookup_canvas = useMemo(() => {
        const colorants: Colorant[] =
            designColorants.length > 0
                ? designColorants
                : [
                      {
                          id: 0,
                          points: [
                              {
                                  hours: 0,
                                  color: new THREE.Color(1, 0, 0),
                                  position: new THREE.Vector3(0, 0, 0),
                              },
                              {
                                  hours: 100,
                                  color: new THREE.Color(1, 1, 0),
                                  position: new THREE.Vector3(0, 0, 0),
                              },
                          ],
                      },
                      {
                          id: 1,
                          points: [
                              {
                                  hours: 0,
                                  color: new THREE.Color(0, 1, 0),
                                  position: new THREE.Vector3(0, 0, 0),
                              },
                              {
                                  hours: 100,
                                  color: new THREE.Color(0, 1, 0),
                                  position: new THREE.Vector3(0, 0, 0),
                              },
                          ],
                      },
                      {
                          id: 2,
                          points: [
                              {
                                  hours: 0,
                                  color: new THREE.Color(0, 0, 1),
                                  position: new THREE.Vector3(0, 0, 0),
                              },
                              {
                                  hours: 100,
                                  color: new THREE.Color(0, 0, 1),
                                  position: new THREE.Vector3(0, 0, 0),
                              },
                          ],
                      },
                  ];
        const cvs = document.createElement('canvas');
        cvs.width = lookup_resolution;
        cvs.height = colorants.length;
        const ctx = cvs.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;

        colorants.forEach((c, i) => {
            draw_gradient_line(
                ctx,
                i,
                c.points.map((p) => {
                    return { time: p.hours, color: p.color };
                }),
                maxTime,
                lookup_resolution
            );
        });

        return cvs;
    }, [designColorants, lookup_resolution, maxTime]);

    const color_evolution_lookup_texture = useMemo(() => {
        const texture = new THREE.CanvasTexture(color_evolution_lookup_canvas);
        texture.flipY = false;
        return texture;
    }, [color_evolution_lookup_canvas]);

    useEffect(() => {
        return () => {
            color_evolution_lookup_texture.dispose();
        };
    }, [color_evolution_lookup_texture]);

    useEffect(() => {
        color_evolution_lookup_texture.needsUpdate = true;
    }, [color_evolution_lookup_texture]);

    useMemo(() => {
        const minFilter = THREE.LinearFilter;
        const magFilter = THREE.LinearFilter;

        textures.albedo.wrapS = THREE.RepeatWrapping;
        textures.albedo.wrapT = THREE.RepeatWrapping;
        textures.albedo.minFilter = minFilter;
        textures.albedo.magFilter = magFilter;
        textures.albedo.flipY = true;
        textures.albedo.repeat.set(uvScale.x, uvScale.y);

        textures.normal.wrapS = THREE.RepeatWrapping;
        textures.normal.wrapT = THREE.RepeatWrapping;
        textures.normal.minFilter = minFilter;
        textures.normal.magFilter = magFilter;
        textures.normal.flipY = true;
        textures.normal.repeat.set(uvScale.x, uvScale.y);

        textures.height.wrapS = THREE.RepeatWrapping;
        textures.height.wrapT = THREE.RepeatWrapping;
        textures.height.minFilter = minFilter;
        textures.height.magFilter = magFilter;
        textures.height.flipY = true;
        textures.height.repeat.set(uvScale.x, uvScale.y);

        textures.alpha.wrapS = THREE.RepeatWrapping;
        textures.alpha.wrapT = THREE.RepeatWrapping;
        textures.alpha.minFilter = minFilter;
        textures.alpha.magFilter = magFilter;
        textures.alpha.flipY = true;
        textures.alpha.repeat.set(uvScale.x, uvScale.y);

        textures.ambient_occlusion.wrapS = THREE.RepeatWrapping;
        textures.ambient_occlusion.wrapT = THREE.RepeatWrapping;
        textures.ambient_occlusion.minFilter = minFilter;
        textures.ambient_occlusion.magFilter = magFilter;
        textures.ambient_occlusion.flipY = true;
        textures.ambient_occlusion.repeat.set(uvScale.x, uvScale.y);

        textures.ids.wrapS = THREE.RepeatWrapping;
        textures.ids.wrapT = THREE.RepeatWrapping;
        textures.ids.minFilter = THREE.NearestFilter;
        textures.ids.magFilter = THREE.NearestFilter;
        textures.ids.flipY = true;
        textures.ids.repeat.set(uvScale.x, uvScale.y);

        textures.pixels.wrapS = THREE.ClampToEdgeWrapping;
        textures.pixels.wrapT = THREE.ClampToEdgeWrapping;
        textures.pixels.minFilter = THREE.NearestFilter;
        textures.pixels.magFilter = THREE.NearestFilter;
        textures.pixels.flipY = true;
        textures.pixels.generateMipmaps = false;

        textures.albedo.needsUpdate = true;
        textures.normal.needsUpdate = true;
        textures.height.needsUpdate = true;
        textures.alpha.needsUpdate = true;
        textures.ambient_occlusion.needsUpdate = true;
        textures.ids.needsUpdate = true;
        textures.pixels.needsUpdate = true;
    }, [textures, uvScale.x, uvScale.y]);

    const preview_material = useMemo(() => {
        const preview_material = new THREE.MeshStandardNodeMaterial({
            alphaMap: textures.alpha,
            normalMap: textures.normal,
            bumpMap: textures.height,
            transparent: false,
        });

        console.log("Recreating material");

        const uTimeDiv = uniform(maxTime);

        const id_packed = uvec3(mul(texture(textures.ids).rgb, 255));
        const id = add(id_packed.x, mul(id_packed.y, 256), mul(id_packed.z, 256, 256));
        const color_index = uint(
            mul(128, textureLoad(textures.pixels, uvec2(mod(id, 24), div(id, 24))).r)
        );
        const time = mul(
            div(mul(texture(heatmap ?? undefined).r, uTime), uTimeDiv),
            sub(lookup_resolution, 1)
        );
        const color = textureLoad(color_evolution_lookup_texture, uvec2(floor(time), color_index));
        preview_material.colorNode = mul(
            color,
            texture(textures.albedo),
            texture(textures.ambient_occlusion)
        );

        return preview_material;
    }, [
        color_evolution_lookup_texture,
        heatmap,
        lookup_resolution,
        maxTime,
        textures.albedo,
        textures.alpha,
        textures.ambient_occlusion,
        textures.height,
        textures.ids,
        textures.normal,
        textures.pixels,
    ]);

    useMemo(() => {
        console.log("Recreating mesh");

        preview_object.traverse(function (child) {
            const child_mesh = child as THREE.Mesh;
            if (child_mesh.isMesh) {
                child_mesh.material = preview_material;
                child_mesh.material.needsUpdate = true;
            }
        });

        return preview_material;
    }, [preview_material, preview_object]);

    const directionalLightRef = useRef<THREE.DirectionalLight>(null);
    useHelper(
        directionalLightRef as React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>,
        THREE.DirectionalLightHelper,
        0.5,
        'red'
    );

    const [lightColor] = useState(new THREE.Color(1, 1, 1));
    const [lightPosition] = useState(new THREE.Vector3(1, 1, 1));

    return (
        <>
            <Perf />
            <Controls />
            <ambientLight color="white" intensity={0.05} />
            <directionalLight
                color={lightColor}
                position={lightPosition}
                intensity={1}
                ref={directionalLightRef}
            />
            <primitive object={preview_object} />
        </>
    );
}

function PropertiesPanels({
    time,
    setTime,
    maxTime,
}: {
    time: number;
    setTime: React.Dispatch<React.SetStateAction<number>>;
    maxTime: number;
}) {
    return (
        <>
            <label className="mb-1">Time</label>
            <Slider
                min={0}
                max={maxTime}
                step={0.01}
                value={[time]}
                onValueChange={(v) => {
                    setTime(v[0]);
                }}
                className="w-full max-w-[400px]"
            />
            <span>{time.toFixed(1)}</span>
        </>
    );
}

export default function Home() {
    const [currentTime, setCurrentTime] = useState(0);
    const [maxTime, setMaxTime] = useState(100);

    const { designColorants } = useDesign();
    useEffect(() => {
        if (designColorants.length > 0) {
            setMaxTime(Math.max(...designColorants.flatMap((c) => c.points.map((c2) => c2.hours))));
        }
    }, [designColorants]);

    return (
        <div>
            <div className="h-dvh">
                <Canvas
                    frameloop="demand"
                    gl={async (props) => {
                        const renderer = new THREE.WebGPURenderer({
                            antialias: true,
                            ...(props as WebGPURendererParameters | undefined),
                        });
                        await renderer.init();
                        return renderer;
                    }}
                    camera={{ near: 0.001, far: 1000, fov: 75 }}
                >
                    <Suspense fallback={null}>
                        <ThreeScene currentTime={currentTime} maxTime={maxTime} />
                    </Suspense>
                </Canvas>
            </div>
            <ResizablePanelGroup
                direction="horizontal"
                className="fixed bottom-2 left-2 right-2 top-2 w-auto! h-auto! pointer-events-none"
            >
                <ResizablePanel
                    defaultSize={85}
                    className="flex flex-col place-items-center justify-end"
                >
                    <div className="px-2 py-2 rounded-xl bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto"></div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel
                    defaultSize={15}
                    className="rounded-xl px-8 py-4 bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto"
                    id="properties_panel"
                >
                    <PropertiesPanels
                        time={currentTime}
                        setTime={setCurrentTime}
                        maxTime={maxTime}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
