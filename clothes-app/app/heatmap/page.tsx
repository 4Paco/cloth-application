/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { load_image } from '@/actions/image';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let cvs;
let ctx: CanvasRenderingContext2D;
let painting = false;
let last_uv: THREE.Vector2 = new THREE.Vector2();
const heat_vert = `
varying vec2 vUv;

void main() {
    vUv = uv;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
}
`;

const heat_frag = `
uniform sampler2D uTexture;
varying vec2 vUv;

vec3 heatmap(float x) {
    float level = x*3.14159265/2.;
   
    vec3 col;
    col.r = sin(level);
    col.g = sin(level*2.);
    col.b = cos(level);
    return col;
}

void main() {
    gl_FragColor = vec4(heatmap(texture2D(uTexture, vUv).r), 1.0);
}`;

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
    tool: string
) {
    const radgrad = ctx.createRadialGradient(x, y, inner_radius, x, y, outer_radius);

    switch (tool) {
        case 'add':
            radgrad.addColorStop(0, '#ffffff');
            radgrad.addColorStop(inner_radius / outer_radius, '#7f7f7F');
            radgrad.addColorStop(1, '#000000');
            break;
        case 'subtract':
        case 'remove':
            radgrad.addColorStop(0, '#000000');
            radgrad.addColorStop(inner_radius / outer_radius, '#7f7f7F');
            radgrad.addColorStop(1, '#ffffff');
            break;

        default:
            break;
    }

    ctx.fillStyle = radgrad;
    ctx.fillRect(x - outer_radius, y - outer_radius, outer_radius * 2, outer_radius * 2);
}

function ThreeScene({
    selectedSizeRef,
    selectedToolRef,
}: {
    selectedSizeRef: React.RefObject<number>;
    selectedToolRef: React.RefObject<Tool>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function run() {
            if (typeof window !== 'undefined') {
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(
                    75,
                    window.innerWidth / window.innerHeight,
                    0.001,
                    1000
                );
                const renderer = new THREE.WebGLRenderer({ alpha: true });
                scene.backgroundIntensity = 1;

                renderer.setSize(
                    containerRef.current?.clientWidth ?? 0,
                    containerRef.current?.clientHeight ?? 0
                );

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

                // const mesh_geometry = new THREE.SphereGeometry(0.7);
                // const mesh = new THREE.Mesh(mesh_geometry, material);

                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        uTexture: { type: 't', value: heatmap_texture },
                    },
                    vertexShader: heat_vert,
                    fragmentShader: heat_frag,
                });

                const loader = new OBJLoader();
                const mesh = await loader.loadAsync('tshirt2.obj');
                mesh.traverse(function (child) {
                    if (child.isMesh) {
                        child.material = material;
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

                // loader.load(
                //     'tshirt.obj',
                //     function (object) {
                //         mesh_geometry = object;
                //     },

                //     function (xhr) {
                //         console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
                //     },

                //     function (error) {
                //         console.log('An error happened');
                //     }
                // );

                const controls = new OrbitControls(camera, renderer.domElement);
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
                        color: new THREE.Color(1, 1, 1),
                        alphaMap: brush_helper_alpha,
                        transparent: true,
                        depthTest: false,
                    })
                );
                brush_helper_mesh.renderOrder = 999;
                brush_helper_mesh.visible = false;

                const light = new THREE.AmbientLight(0xffffff); // soft white light
                scene.add(light);

                scene.add(mesh);
                scene.add(brush_helper_mesh);

                // Add raycaster and mouse logic here
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2();

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
                            const scale = selectedSizeRef.current;

                            const innerRadius = baseInner * scale;
                            const outerRadius = baseOuter * scale;

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

                            switch (selectedToolRef.current.value) {
                                case 'add':
                                    ctx.globalCompositeOperation = 'lighten';
                                    break;
                                case 'subtract':
                                    ctx.globalCompositeOperation = 'darken';
                                    break;
                                case 'remove':
                                    console.log("setting remove");
                                    ctx.globalCompositeOperation = 'multiply';
                                    break;

                                default:
                                    break;
                            }

                            draw_dot(
                                ctx,
                                x,
                                y,
                                innerRadius,
                                outerRadius,
                                selectedToolRef.current.value
                            );
                            if (x - outerRadius < 0) {
                                draw_dot(
                                    ctx,
                                    1024 + x,
                                    y,
                                    innerRadius,
                                    outerRadius,
                                    selectedToolRef.current.value
                                );
                            } else if (x + outerRadius > 1024) {
                                draw_dot(
                                    ctx,
                                    x - 1024,
                                    y,
                                    innerRadius,
                                    outerRadius,
                                    selectedToolRef.current.value
                                );
                            }

                            if (goes_outside) break;
                        }
                        last_uv = uv_ts;

                        if (material.uniforms.uTexture)
                            material.uniforms.uTexture.value.needsUpdate = true;
                    }
                }

                function on_pointer_down(event: MouseEvent) {
                    if (event.button == 0) {
                        painting = true;
                        const tmp_uv = intersect();
                        if (tmp_uv !== undefined && tmp_uv.uv) last_uv = tmp_uv.uv;
                    }
                }

                function on_pointer_up(_event: MouseEvent) {
                    painting = false;
                }
                // Render the scene and camera
                renderer.render(scene, camera);

                // Add this function inside the useEffect hook
                const renderScene = (t: number) => {
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
        run();
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
    selectedSize,
    setSelectedSize,
}: {
    selectedSize: number;
    setSelectedSize: React.Dispatch<React.SetStateAction<number>>;
}) {
    return (
        <>
            <label className="mb-1">Drawing size</label>
            <Slider
                min={1}
                max={10}
                step={0.05}
                value={[selectedSize]}
                onValueChange={(v) => {
                    setSelectedSize(v[0]);
                }}
                className="w-full max-w-[400px]"
            />
            <span>{selectedSize.toFixed(1)}</span>
        </>
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
    ];

    const [selectedTool, setSelectedTool] = useState<Tool>(tools[0]);
    const [selectedSize, setSelectedSize] = useState<number>(1);

    const selectedSizeRef = useRef(selectedSize);
    const selectedToolRef = useRef(selectedTool);

    useEffect(() => {
        selectedSizeRef.current = selectedSize;
        selectedToolRef.current = selectedTool;
    }, [selectedSize, selectedTool]);

    return (
        <div>
            <div className="h-dvh flex flex-col">
                <ThreeScene selectedSizeRef={selectedSizeRef} selectedToolRef={selectedToolRef} />
            </div>
            <ResizablePanelGroup
                direction="horizontal"
                className="fixed bottom-2 left-2 right-2 top-2 w-auto! h-auto! pointer-events-none"
            >
                <ResizablePanel
                    defaultSize={80}
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
                    defaultSize={10}
                    className="rounded-xl px-8 py-4 bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto"
                >
                    {/* <div className="fixed rounded-xl right-2 top-2 bottom-2 px-8 py-4 bg-neutral-200/80 backdrop-blur flex flex-col items-center z-10"> */}
                    <PropertiesPanels
                        selectedSize={selectedSize}
                        setSelectedSize={setSelectedSize}
                    />
                    {/* </div> */}
                </ResizablePanel>
            </ResizablePanelGroup>
            {/* <div className="fixed bottom-2 left-0 right-0 flex flex-col place-items-center"></div> */}
        </div>
    );
}
