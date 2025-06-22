'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/Addons.js';
import {
    add,
    div,
    floor,
    mod,
    mul,
    texture,
    textureLoad,
    uint,
    uniform,
    uvec2,
    uvec3,
    vec2,
} from 'three/tsl';
import { Slider } from '@/components/ui/slider';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useDesign } from '@/components/DesignContextProvider';
import { ColorTranslator } from 'colortranslator';

let isLightSelected = false;
let cvs;
let ctx: CanvasRenderingContext2D;

function draw_gradient_line(
    ctx: CanvasRenderingContext2D,
    id: number,
    colorants: { time: number; color: THREE.Color }[],
    max_time: number,
    width: number = 100
) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);

    colorants.forEach((c) => {
        const trans = new ColorTranslator(c.color.getHexString());
        gradient.addColorStop(
            c.time / max_time,
            new THREE.Color(trans.R / 255, trans.G / 255, trans.B / 255).getHexString()
        );
    });
    // gradient.addColorStop(1, color_b);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, id, width, 1);
}

function ThreeScene({
    timeRef,
    maxTimeRef,
}: {
    timeRef: React.RefObject<number>;
    maxTimeRef: React.RefObject<number>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { designColorants } = useDesign();

    useEffect(() => {
        async function anonnymous() {
            if (typeof window !== 'undefined') {
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(
                    75,
                    window.innerWidth / window.innerHeight,
                    0.001,
                    1000
                );
                // const renderer = new THREE.WebGLRenderer({ alpha: true });
                const renderer = new THREE.WebGPURenderer({ alpha: true });
                // renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setSize(
                    containerRef.current?.clientWidth ?? 0,
                    containerRef.current?.clientHeight ?? 0
                );

                containerRef.current?.appendChild(renderer.domElement);
                camera.position.z = 5;

                const scale = { x: 100, y: 100 };

                const minFilter = THREE.LinearFilter;
                const magFilter = THREE.LinearFilter;

                const albedo = new THREE.TextureLoader().load('./default_cloth/albedo.png');
                albedo.wrapS = THREE.RepeatWrapping;
                albedo.wrapT = THREE.RepeatWrapping;
                albedo.minFilter = minFilter;
                albedo.magFilter = magFilter;
                albedo.flipY = false;
                albedo.repeat.set(scale.x, scale.y);

                const normal = new THREE.TextureLoader().load('./default_cloth/normal.png');
                normal.wrapS = THREE.RepeatWrapping;
                normal.wrapT = THREE.RepeatWrapping;
                normal.minFilter = minFilter;
                normal.magFilter = magFilter;
                normal.flipY = false;
                normal.repeat.set(scale.x, scale.y);

                const height = new THREE.TextureLoader().load('./default_cloth/height.png');
                height.wrapS = THREE.RepeatWrapping;
                height.wrapT = THREE.RepeatWrapping;
                height.minFilter = minFilter;
                height.magFilter = magFilter;
                height.flipY = false;
                height.repeat.set(scale.x, scale.y);

                const alpha = new THREE.TextureLoader().load('./default_cloth/alpha.png');
                alpha.wrapS = THREE.RepeatWrapping;
                alpha.wrapT = THREE.RepeatWrapping;
                alpha.minFilter = minFilter;
                alpha.magFilter = magFilter;
                alpha.flipY = false;
                alpha.repeat.set(scale.x, scale.y);

                const ao = new THREE.TextureLoader().load('./default_cloth/height.png');
                ao.wrapS = THREE.RepeatWrapping;
                ao.wrapT = THREE.RepeatWrapping;
                ao.minFilter = minFilter;
                ao.magFilter = magFilter;
                ao.flipY = false;
                ao.repeat.set(scale.x, scale.y);

                const ids = new THREE.TextureLoader().load('./default_cloth/ids.png');
                ids.wrapS = THREE.RepeatWrapping;
                ids.wrapT = THREE.RepeatWrapping;
                ids.minFilter = THREE.NearestFilter;
                ids.magFilter = THREE.NearestFilter;
                ids.flipY = false;
                ids.repeat.set(scale.x, scale.y);

                const pixels = new THREE.TextureLoader().load('./pixels3.png');
                pixels.wrapS = THREE.ClampToEdgeWrapping;
                pixels.wrapT = THREE.ClampToEdgeWrapping;
                pixels.minFilter = THREE.NearestFilter;
                pixels.magFilter = THREE.NearestFilter;
                pixels.flipY = false;
                pixels.generateMipmaps = false;

                cvs = document.createElement('canvas');
                ctx = cvs.getContext('2d') as CanvasRenderingContext2D;
                ctx.imageSmoothingEnabled = false;
                cvs.width = 100;

                cvs.height = 3;
                designColorants.forEach((c, i) => {
                    draw_gradient_line(
                        ctx,
                        i,
                        c.points.map((p) => {
                            return { time: p.hours, color: p.color };
                        }),
                        maxTimeRef.current
                    );
                });

                document.getElementById('properties_panel')?.appendChild(cvs);

                const color_evolution_lookup = new THREE.CanvasTexture(cvs);
                color_evolution_lookup.wrapS = THREE.ClampToEdgeWrapping;
                color_evolution_lookup.wrapT = THREE.ClampToEdgeWrapping;
                color_evolution_lookup.minFilter = THREE.NearestFilter;
                color_evolution_lookup.magFilter = THREE.NearestFilter;
                color_evolution_lookup.flipY = false;
                color_evolution_lookup.generateMipmaps = false;

                const preview_material = new THREE.MeshStandardNodeMaterial({
                    map: albedo,
                    alphaMap: alpha,
                    normalMap: normal,
                    bumpMap: height,
                    transparent: false,
                });

                const uTime = uniform(timeRef.current);
                const uTimeDiv = uniform(maxTimeRef.current);

                const id_packed = uvec3(mul(texture(ids).rgb, 255));
                const id = add(id_packed.x, mul(id_packed.y, 256), mul(id_packed.z, 256, 256));
                const pixels_value = textureLoad(pixels, vec2(mod(id, 24), div(id, 24)));
                const color_index = uint(mul(pixels_value.r, 128));
                const color_lookup_id = textureLoad(
                    color_evolution_lookup,
                    uvec2(floor(mul(div(uTime, uTimeDiv), 99)), color_index)
                );
                preview_material.colorNode = mul(color_lookup_id, texture(albedo), texture(ao));

                const light = new THREE.AmbientLight(0xaaaaaa);
                const pointlight = new THREE.PointLight(0xffffff);

                const loader = new OBJLoader();
                const preview_mesh = await loader.loadAsync('tshirt2.obj');
                preview_mesh.traverse(function (child) {
                    const child_mesh = child as THREE.Mesh;
                    if (child_mesh.isMesh) {
                        child_mesh.material = preview_material;
                    }
                });

                pointlight.position.x = -3;
                pointlight.position.z = 1;

                scene.add(preview_mesh);
                scene.add(light);
                scene.add(pointlight);
                const pointLightHelper = new THREE.PointLightHelper(pointlight, 0.2, 0xff0000); // red helper
                scene.add(pointLightHelper);

                // Add raycaster and mouse logic here
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2();

                function onClick(event: MouseEvent) {
                    if (!renderer.domElement) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                    raycaster.setFromCamera(mouse, camera);

                    if (!isLightSelected) {
                        // First click: check if the helper was clicked
                        const intersects = raycaster.intersectObject(pointLightHelper, true);
                        if (intersects.length > 0) {
                            isLightSelected = true;
                        }
                    } else {
                        // Second click: move the light to the clicked position on a plane (e.g., z=0)
                        // We'll use a plane at z=0 for demonstration
                        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                        const intersection = new THREE.Vector3();
                        raycaster.ray.intersectPlane(planeZ, intersection);
                        pointlight.position.copy(intersection);
                        pointLightHelper.update();
                        isLightSelected = false;
                    }
                }

                renderer.domElement.addEventListener('click', onClick);

                const controls = new OrbitControls(camera, renderer.domElement);

                // Render the scene and camera
                renderer.render(scene, camera);

                // Add this function inside the useEffect hook
                const renderScene = (t: number) => {
                    pointlight.position.x = Math.cos(0.0015 * t);
                    pointlight.position.y = Math.cos(0.001 * t);
                    uTime.value = timeRef.current;
                    controls.update();
                    renderer.render(scene, camera);
                    requestAnimationFrame(renderScene);
                };

                // Call the renderScene function to start the animation loop
                renderScene(0);

                const handleResize = () => {
                    const width = window.innerWidth;
                    const height = window.innerHeight;

                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();

                    renderer.setSize(width, height);
                };

                window.addEventListener('resize', handleResize);

                // Clean up the event listener when the component is unmounted
                return () => {
                    window.removeEventListener('resize', handleResize);
                };
            }
        }
        anonnymous();
    }, []);
    return <div className="flex-1" ref={containerRef} />;
}

function PropertiesPanels({
    time,
    setTime,
}: {
    time: number;
    setTime: React.Dispatch<React.SetStateAction<number>>;
}) {
    return (
        <>
            <label className="mb-1">Time</label>
            <Slider
                min={0}
                max={1}
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
    const [time, setTime] = useState(0);
    const [maxTime, setMaxTime] = useState(0);
    const timeRef = useRef(time);
    const maxTimeRef = useRef(maxTime);

    useEffect(() => {
        timeRef.current = time;
        maxTimeRef.current = maxTime;
    }, [time, maxTime]);

    const { designColorants } = useDesign();
    useEffect(() => {
        setMaxTime(Math.max(...designColorants.flatMap((c) => c.points.map((c2) => c2.hours))));
    }, [designColorants]);

    return (
        <div>
            <div className="h-dvh flex flex-col">
                <ThreeScene timeRef={timeRef} maxTimeRef={maxTimeRef} />
            </div>
            <ResizablePanelGroup
                direction="horizontal"
                className="fixed bottom-2 left-2 right-2 top-2 w-auto! h-auto! pointer-events-none"
            >
                <ResizablePanel
                    defaultSize={80}
                    className="flex flex-col place-items-center justify-end"
                >
                    <div className="px-2 py-2 rounded-xl bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto"></div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel
                    defaultSize={10}
                    className="rounded-xl px-8 py-4 bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto"
                    id="properties_panel"
                >
                    <PropertiesPanels time={time} setTime={setTime} />
                    {/* </div> */}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
