/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { load_image } from '@/actions/image';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { ColorTranslator } from 'colortranslator';
import { add, cos, mrt, mul, normalView, output, pass, sin, texture, vec3, vec4 } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';

let cvs;
let ctx: CanvasRenderingContext2D;
let painting = false;
let last_uv: THREE.Vector2 = new THREE.Vector2();

function distanceBetween(point1: THREE.Vector2, point2: THREE.Vector2): number {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}
function angleBetween(point1: THREE.Vector2, point2: THREE.Vector2): number {
    return Math.atan2(point2.x - point1.x, point2.y - point1.y);
}

function draw_dot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    inner_radius: number,
    outer_radius: number,
    tool: string,
    value: number
) {
    const radgrad = ctx.createRadialGradient(x, y, inner_radius, x, y, outer_radius);

    const ct = new ColorTranslator({ H: 0, S: 0, L: value * 255 });
    const ct_mid = new ColorTranslator({ H: 0, S: 0, L: value * 127 });

    switch (tool) {
        case 'add':
            radgrad.addColorStop(0, ct.RGB);
            radgrad.addColorStop(inner_radius / outer_radius, ct_mid.RGB);
            radgrad.addColorStop(1, '#000000');
            break;
        case 'subtract':
        case 'remove':
            radgrad.addColorStop(0, '#000000');
            radgrad.addColorStop(inner_radius / outer_radius, ct_mid.RGB);
            radgrad.addColorStop(1, ct.RGB);
            break;

        default:
            break;
    }

    ctx.fillStyle = radgrad;
    ctx.fillRect(x - outer_radius, y - outer_radius, outer_radius * 2, outer_radius * 2);
}

let renderer: THREE.WebGPURenderer;
let postProcessing: THREE.PostProcessing;
let controls: OrbitControls;
let camera: THREE.PerspectiveCamera;
let overlay_camera: THREE.PerspectiveCamera;

function ThreeScene({
    brushSizeRef,
    brushValueRef,
    selectedToolRef,
}: {
    brushSizeRef: React.RefObject<number>;
    brushValueRef: React.RefObject<number>;
    selectedToolRef: React.RefObject<Tool>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function init() {
            if (typeof window !== 'undefined') {
                const scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(
                    75,
                    window.innerWidth / window.innerHeight,
                    0.001,
                    1000
                );
                overlay_camera = new THREE.PerspectiveCamera(
                    75,
                    window.innerWidth / window.innerHeight,
                    0.001,
                    1000
                );
                camera.attach(overlay_camera);
                renderer = new THREE.WebGPURenderer({ alpha: true });
                scene.backgroundIntensity = 1;

                renderer.setSize(
                    containerRef.current?.clientWidth ?? 0,
                    containerRef.current?.clientHeight ?? 0
                );
                renderer.setAnimationLoop(animate);

                containerRef.current?.appendChild(renderer.domElement);
                camera.position.z = 5;

                const scale = { x: 1, y: 1 };

                cvs = document.createElement('canvas');
                cvs.width = 1024;
                cvs.height = 1024;
                ctx = cvs.getContext('2d') as CanvasRenderingContext2D;

                ctx.lineJoin = ctx.lineCap = 'round';

                ctx.fillStyle = '#000000';
                // /!\ We can't use clearRect because of darken globalCompositeOperation
                ctx.fillRect(0, 0, cvs.width, cvs.height);

                const heatmap_texture = new THREE.CanvasTexture(cvs);
                heatmap_texture.wrapS = THREE.RepeatWrapping;
                heatmap_texture.wrapT = THREE.RepeatWrapping;
                heatmap_texture.repeat.set(scale.x, scale.y);

                const material = new THREE.MeshBasicNodeMaterial({});
                const level = mul(texture(heatmap_texture).r, 3.14159265 / 2);
                material.colorNode = vec4(vec3(sin(level), sin(mul(level, 2)), cos(level)), 1);

                const loader = new OBJLoader();
                const mesh = await loader.loadAsync('tshirt2.obj');
                mesh.traverse(function (child) {
                    const child_mesh = child as THREE.Mesh;
                    if (child_mesh.isMesh) {
                        child_mesh.material = material;
                    }
                });

                const boundaries_map = await load_image('./tshirt_boudaries_map.png');
                const boundaries_map_cvs = document.createElement('canvas');
                boundaries_map_cvs.width = boundaries_map.width;
                boundaries_map_cvs.height = boundaries_map.height;
                const boundaries_map_ctx = boundaries_map_cvs.getContext(
                    '2d'
                ) as CanvasRenderingContext2D;
                boundaries_map_ctx.imageSmoothingEnabled = false;
                boundaries_map_ctx.drawImage(boundaries_map, 0, 0);
                const boundaries_map_image_data = boundaries_map_ctx.getImageData(
                    0,
                    0,
                    boundaries_map.width,
                    boundaries_map.height
                );

                controls = new OrbitControls(camera, renderer.domElement);
                controls.mouseButtons = {
                    LEFT: undefined,
                    RIGHT: THREE.MOUSE.ROTATE,
                    MIDDLE: THREE.MOUSE.DOLLY,
                };

                const brush_helper_geometry = new THREE.PlaneGeometry(0.1, 0.1);
                const brush_helper_alpha = new THREE.TextureLoader().load(
                    './brush_helper_alpha.png'
                );

                const brush_helper_mesh = new THREE.Mesh(
                    brush_helper_geometry,
                    new THREE.MeshBasicMaterial({
                        color: new THREE.Color(1, 0, 0),
                        alphaMap: brush_helper_alpha,
                        depthWrite: false,
                        transparent: true,
                        depthTest: false,
                    })
                );
                brush_helper_mesh.renderOrder = 999;
                brush_helper_mesh.visible = false;
                brush_helper_mesh.layers.set(1);

                const light = new THREE.AmbientLight(0xffffff); // soft white light
                scene.add(light);

                scene.add(mesh);
                scene.add(brush_helper_mesh);

                const raycaster = new THREE.Raycaster();
                raycaster.layers.set(0);
                const mouse = new THREE.Vector2();

                postProcessing = new THREE.PostProcessing(renderer);

                const scenePass = pass(scene, camera);
                scenePass.camera.layers.set(0);
                scenePass.setMRT(
                    mrt({
                        output: output,
                        normal: normalView,
                    })
                );

                const scenePassColor = scenePass.getTextureNode('output');
                const scenePassNormal = scenePass.getTextureNode('normal');
                const scenePassDepth = scenePass.getTextureNode('depth');

                // ao

                const aoPass = ao(scenePassDepth, scenePassNormal, camera);
                aoPass.resolutionScale = 0.5;
                const blendPassAO = aoPass.getTextureNode().mul(scenePassColor);

                const overlay = pass(scene, overlay_camera);
                overlay.camera.layers.set(1);

                postProcessing.outputNode = add(blendPassAO, overlay.getTextureNode());

                function intersect(): THREE.Intersection | undefined {
                    const intersects = raycaster.intersectObject(mesh, true);
                    if (intersects.length == 0) return undefined;
                    return intersects[0];
                }

                function update_brush_helper(intersect: THREE.Intersection) {
                    if (intersect.normal) {
                        const defaultNormal = new THREE.Vector3(0, 0, 1);
                        const quaternion = new THREE.Quaternion().setFromUnitVectors(
                            defaultNormal,
                            intersect.normal
                        );

                        brush_helper_mesh.setRotationFromQuaternion(quaternion);

                        brush_helper_mesh.position.copy(intersect.point);
                    }
                }

                function on_pointer_move(event: MouseEvent) {
                    if (!renderer.domElement) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                    raycaster.setFromCamera(mouse, camera);

                    if (!painting) {
                        const intersects = raycaster.intersectObject(mesh, true);
                        if (intersects.length != 0) {
                            const intersect = intersects[0];
                            brush_helper_mesh.visible = true;
                            update_brush_helper(intersect);
                        } else {
                            brush_helper_mesh.visible = false;
                        }
                    } else {
                        const intersection = intersect();
                        if (intersection == undefined) return;
                        const uv = intersection.uv as THREE.Vector2;
                        const uv_ts = new THREE.Vector2(uv.x, 1 - uv.y);
                        update_brush_helper(intersection);

                        let dist = distanceBetween(last_uv, uv_ts);
                        let angle = angleBetween(last_uv, uv_ts);
                        if (dist > 0.7) {
                            last_uv = uv_ts;
                            dist = distanceBetween(last_uv, uv_ts);
                            angle = angleBetween(last_uv, uv_ts);
                        }

                        const get_index = (
                            x: number,
                            y: number,
                            w: number = 1024,
                            bpp: number = 4
                        ): number => {
                            const red = (y * w + x) * bpp;
                            return red;
                        };

                        let goes_outside = false;

                        for (let i = 0; i < dist; i += 1 / 1024) {
                            const x = Math.round(
                                (last_uv.x + Math.sin(angle) * i) * boundaries_map.width
                            );
                            const y = Math.round(
                                (last_uv.y + Math.cos(angle) * i) * boundaries_map.height
                            );
                            const d =
                                boundaries_map_image_data.data[
                                    get_index(
                                        x,
                                        y,
                                        boundaries_map.width,
                                        boundaries_map_image_data.data.length /
                                            (boundaries_map_image_data.width *
                                                boundaries_map_image_data.height)
                                    )
                                ];

                            if (d < 128) {
                                goes_outside = true;
                                break;
                            }
                        }
                        for (let i = 0; i < dist; i += 1 / 1024) {
                            const x = Math.round(
                                (last_uv.x + Math.sin(angle) * i) * boundaries_map.width
                            );
                            const y = Math.round(
                                (last_uv.y + Math.cos(angle) * i) * boundaries_map.height
                            );

                            const baseInner = 2;
                            const baseOuter = 20;
                            const scale = brushSizeRef.current;

                            const innerRadius = baseInner * scale;
                            const outerRadius = baseOuter * scale;

                            switch (selectedToolRef.current.value) {
                                case 'add':
                                    ctx.globalCompositeOperation = 'lighten';
                                    break;
                                case 'subtract':
                                    ctx.globalCompositeOperation = 'darken';
                                    break;
                                case 'remove':
                                    ctx.globalCompositeOperation = 'multiply';
                                    break;

                                default:
                                    break;
                            }

                            const max_value = brushValueRef.current;

                            draw_dot(
                                ctx,
                                x,
                                y,
                                innerRadius,
                                outerRadius,
                                selectedToolRef.current.value,
                                max_value
                            );
                            if (x - outerRadius < 0) {
                                draw_dot(
                                    ctx,
                                    1024 + x,
                                    y,
                                    innerRadius,
                                    outerRadius,
                                    selectedToolRef.current.value,
                                    max_value
                                );
                            } else if (x + outerRadius > 1024) {
                                draw_dot(
                                    ctx,
                                    x - 1024,
                                    y,
                                    innerRadius,
                                    outerRadius,
                                    selectedToolRef.current.value,
                                    max_value
                                );
                            }

                            if (goes_outside) break;
                        }
                        last_uv = uv_ts;

                        heatmap_texture.needsUpdate = true;
                    }
                }

                function on_pointer_down(event: MouseEvent) {
                    if (event.button == 0) {
                        painting = true;
                        const tmp_uv = intersect();
                        if (tmp_uv !== undefined && tmp_uv.uv !== undefined) last_uv = tmp_uv.uv;
                    }
                }

                function on_pointer_up(event: MouseEvent) {
                    if (painting) {
                        const x = Math.round(last_uv.x * boundaries_map.width);
                        const y = Math.round(last_uv.y * boundaries_map.height);

                        const baseInner = 2;
                        const baseOuter = 20;
                        const scale = brushSizeRef.current;

                        const innerRadius = baseInner * scale;
                        const outerRadius = baseOuter * scale;

                        switch (selectedToolRef.current.value) {
                            case 'add':
                                ctx.globalCompositeOperation = 'lighten';
                                break;
                            case 'subtract':
                                ctx.globalCompositeOperation = 'darken';
                                break;
                            case 'remove':
                                ctx.globalCompositeOperation = 'multiply';
                                break;

                            default:
                                break;
                        }

                        const max_value = brushValueRef.current;

                        draw_dot(
                            ctx,
                            x,
                            y,
                            innerRadius,
                            outerRadius,
                            selectedToolRef.current.value,
                            max_value
                        );

                        heatmap_texture.needsUpdate = true;
                    }
                    painting = false;
                }
                // Render the scene and camera
                // renderer.render(scene, camera);
                // postProcessing.render();

                // Call the renderScene function to start the animation loop
                // renderScene(0);

                const handleResize = () => {
                    const width = window.innerWidth;
                    const height = window.innerHeight;

                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();

                    renderer.setSize(width, height);
                };

                window.addEventListener('resize', handleResize);
                renderer.domElement.addEventListener('pointermove', on_pointer_move);
                renderer.domElement.addEventListener('pointerdown', on_pointer_down);
                renderer.domElement.addEventListener('pointerup', on_pointer_up);

                // Clean up the event listener when the component is unmounted
                return () => {
                    window.removeEventListener('resize', handleResize);
                    renderer.domElement.removeEventListener('pointermove', on_pointer_move);
                    renderer.domElement.removeEventListener('pointerdown', on_pointer_down);
                    renderer.domElement.removeEventListener('pointerup', on_pointer_up);
                };
            }
        }

        function animate(t: number) {
            if (controls !== undefined) controls.update();
            // overlay_camera.position.copy(camera.localToWorld(new THREE.Vector3(0, 0, 0)));
            // overlay_camera.quaternion.copy(camera.quaternion);
            if (postProcessing !== undefined) postProcessing.render();
        }

        init();
    }, []);
    return (
        <div className="flex flex-col h-dvh w-full">
            <div className="flex-1 w-full h-full" ref={containerRef}></div>
        </div>
    );
}

export function ToolSelector({
    tools,
    selectedTool,
    setSelectedTool,
}: {
    tools: Tool[];
    selectedTool: Tool;
    setSelectedTool: React.Dispatch<React.SetStateAction<Tool>>;
}) {
    return (
        <div className="flex gap-4">
            {tools.map((tool) => (
                <Button
                    key={tool.value}
                    variant={selectedTool.value == tool.value ? 'default' : 'secondary'}
                    onClick={() => setSelectedTool(tool)}
                    className="flex flex-col space-y-2 w-20 h-20"
                >
                    <span className="text-3xl mb-2">{tool.icon}</span>
                    <span className="text-sm font-medium">{tool.label}</span>
                </Button>
                // <button
                //     key={tool.value}
                //     onClick={() => setSelectedTool(tool)}
                //     className={cn(
                //         'flex flex-col items-center justify-center rounded-2xl p-6 border transition-all cursor-pointer w-20 h-20 shadow-sm',
                //         selectedTool === tool
                //             ? 'bg-primary text-white border-primary'
                //             : 'bg-muted text-muted-foreground hover:border-primary'
                //     )}
                // >
                //     <span className="text-3xl mb-2">{tool.icon}</span>
                //     <span className="text-sm font-medium">{tool.label}</span>
                // </button>
            ))}
        </div>
    );
}

function ToolsPanel({
    tools,
    selectedTool,
    setSelectedTool,
}: {
    tools: Tool[];
    selectedTool: Tool;
    setSelectedTool: React.Dispatch<React.SetStateAction<Tool>>;
}) {
    return (
        <ToolSelector tools={tools} selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
    );
}

function PropertiesPanels({
    brushSize,
    setBrushSize,
    brushValue,
    setBrushValue,
}: {
    brushSize: number;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    brushValue: number;
    setBrushValue: React.Dispatch<React.SetStateAction<number>>;
}) {
    return (
        <div className="flex flex-col w-full">
            <div className="w-full">
                <label className="mb-1">Brush size</label>
                <Slider
                    min={0.1}
                    max={4}
                    step={0.05}
                    value={[brushSize]}
                    onValueChange={(v) => {
                        setBrushSize(v[0]);
                    }}
                    className="w-full max-w-[400px]"
                />
                <span>{brushSize.toFixed(1)}</span>
            </div>
            <div className="w-full">
                <label className="mb-1">Brush strength</label>
                <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[brushValue]}
                    onValueChange={(v) => {
                        setBrushValue(v[0]);
                    }}
                    className="w-full max-w-[400px]"
                />
                <span>{brushValue.toFixed(1)}</span>
            </div>
        </div>
    );
}

type Tool = {
    value: string;
    label: string;
    icon: string;
};

export default function Heatmap() {
    const tools: Tool[] = [
        { value: 'add', label: 'Add', icon: '+' },
        { value: 'subtract', label: 'Subtract', icon: '-' },
        { value: 'remove', label: 'Remove', icon: 'x' },
        { value: 'fill', label: 'Fill', icon: 'x' },
    ];

    const [selectedTool, setSelectedTool] = useState<Tool>(tools[0]);
    const [brushSize, setBrushSize] = useState<number>(0.5);
    const [brushValue, setBrushValue] = useState<number>(1);

    const brushSizeRef = useRef(brushSize);
    const brushValueRef = useRef(brushValue);
    const selectedToolRef = useRef(selectedTool);

    useEffect(() => {
        brushSizeRef.current = brushSize;
        brushValueRef.current = brushValue;
        selectedToolRef.current = selectedTool;
    }, [brushSize, brushValue, selectedTool]);

    return (
        <div>
            <div className="h-dvh flex flex-col">
                <ThreeScene
                    brushSizeRef={brushSizeRef}
                    selectedToolRef={selectedToolRef}
                    brushValueRef={brushValueRef}
                />
            </div>
            <ResizablePanelGroup
                direction="horizontal"
                className="fixed bottom-2 left-2 right-2 top-2 w-auto! h-auto! pointer-events-none"
            >
                <ResizablePanel
                    defaultSize={85}
                    className="flex flex-col place-items-center justify-end"
                >
                    {/* <div className="px-2 py-2 rounded-xl bg-neutral-200/80 backdrop-blur flex flex-col items-center z-10"> */}
                    <div className="px-2 py-2 rounded-xl bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto">
                        <ToolsPanel
                            tools={tools}
                            selectedTool={selectedTool}
                            setSelectedTool={setSelectedTool}
                        />
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel
                    defaultSize={15}
                    className="rounded-xl px-8 py-4 bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto"
                >
                    {/* <div className="fixed rounded-xl right-2 top-2 bottom-2 px-8 py-4 bg-neutral-200/80 backdrop-blur flex flex-col items-center z-10"> */}
                    <PropertiesPanels
                        brushSize={brushSize}
                        setBrushSize={setBrushSize}
                        brushValue={brushValue}
                        setBrushValue={setBrushValue}
                    />
                    {/* </div> */}
                </ResizablePanel>
            </ResizablePanelGroup>
            {/* <div className="fixed bottom-2 left-0 right-0 flex flex-col place-items-center"></div> */}
        </div>
    );
}
