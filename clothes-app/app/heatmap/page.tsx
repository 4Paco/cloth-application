/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
    outer_radius: number
) {
    const radgrad = ctx.createRadialGradient(x, y, inner_radius, x, y, outer_radius);

    radgrad.addColorStop(0, '#ffffff');
    radgrad.addColorStop(inner_radius / outer_radius, '#7f7f7F');
    radgrad.addColorStop(1, '#000000');

    ctx.fillStyle = radgrad;
    ctx.fillRect(x - outer_radius, y - outer_radius, outer_radius * 2, outer_radius * 2);
}

const ThreeScene: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedSize, setSelectedSize] = useState(1);
    const selectedSizeRef = useRef(selectedSize);
    useEffect(() => {
        selectedSizeRef.current = selectedSize;
    }, [selectedSize]);

    useEffect(() => {
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
            ctx.globalCompositeOperation = 'lighten';

            // ctx.fillStyle = '#000000';
            ctx.clearRect(0, 0, cvs.width, cvs.height);

            const heatmap_texture = new THREE.CanvasTexture(cvs);
            heatmap_texture.wrapS = THREE.RepeatWrapping;
            heatmap_texture.wrapT = THREE.RepeatWrapping;
            heatmap_texture.repeat.set(scale.x, scale.y);

            const sphere_geometry = new THREE.SphereGeometry(0.7);
            // const material = new THREE.MeshStandardMaterial({
            //     map: heatmap_texture,
            // });
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTexture: { type: 't', value: heatmap_texture },
                },
                vertexShader: heat_vert,
                fragmentShader: heat_frag,
            });

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.mouseButtons = {
                LEFT: undefined,
                RIGHT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
            };

            const sphere = new THREE.Mesh(sphere_geometry, material);

            const light = new THREE.AmbientLight(0xffffff); // soft white light
            scene.add(light);

            scene.add(sphere);

            // Add raycaster and mouse logic here
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            function intersect(): THREE.Vector2 | undefined {
                const intersects = raycaster.intersectObject(sphere, true);
                if (intersects.length == 0) return undefined;
                const uv = intersects[0].uv as THREE.Vector2;
                return new THREE.Vector2(uv.x, 1 - uv.y);
            }

            function on_pointer_move(event: MouseEvent) {
                if (!renderer.domElement) return;
                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);

                if (painting) {
                    const uv_ts = intersect();
                    if (uv_ts == undefined) return;

                    let dist = distanceBetween(last_uv, uv_ts);
                    let angle = angleBetween(last_uv, uv_ts);
                    if (dist > 0.7) {
                        last_uv = uv_ts;
                        dist = distanceBetween(last_uv, uv_ts);
                        angle = angleBetween(last_uv, uv_ts);
                    }

                    for (let i = 0; i < dist; i += 1 / 1024) {
                        const x = Math.round((last_uv.x + Math.sin(angle) * i) * 1024);
                        const y = Math.round((last_uv.y + Math.cos(angle) * i) * 1024);
                        const baseInner = 2;
                        const baseOuter = 20;
                        const scale = selectedSizeRef.current;

                        const innerRadius = baseInner * scale;
                        const outerRadius = baseOuter * scale;
                        console.log(
                            x,
                            y,
                            2 * selectedSizeRef.current,
                            20 * selectedSizeRef.current
                        );
                        draw_dot(ctx, x, y, innerRadius, outerRadius);
                        if (x - outerRadius < 0) {
                            draw_dot(ctx, 1024 + x, y, innerRadius, outerRadius);
                        } else if (x + outerRadius > 1024) {
                            draw_dot(ctx, x - 1024, y, innerRadius, outerRadius);
                        }
                    }

                    // ctx.strokeStyle = '#ffffff';
                    // ctx.moveTo(last_uv.x * 1024, last_uv.y * 1024);
                    // ctx.lineTo(uv_ts.x * 1024, uv_ts.y * 1024);
                    // ctx.stroke();

                    last_uv = uv_ts;

                    if (material.uniforms.uTexture)
                        material.uniforms.uTexture.value.needsUpdate = true;
                }
            }

            function on_pointer_down(event: MouseEvent) {
                if (event.button == 0) {
                    painting = true;
                    const tmp_uv = intersect();
                    if (tmp_uv !== undefined) last_uv = tmp_uv;
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
    }, []);
    return (
        <div className="flex flex-col h-full w-full" style={{ height: '100dvh' }}>
            <div
                className="flex-1"
                ref={containerRef}
                style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxWidth: '100vw',
                    maxHeight: 'calc(100dvh - 80px)',
                    margin: '0 auto',
                }}
            ></div>
            <div
                className="w-full px-4 py-2 bg-white/80 backdrop-blur fixed bottom-0 left-0 flex flex-col items-center"
                style={{ zIndex: 10 }}
            >
                <label className="mb-1">Drawing size</label>
                <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.05}
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(parseFloat(e.target.value))}
                    style={{ width: '100%', maxWidth: 400 }}
                />
                <span>{selectedSize.toFixed(1)}</span>
            </div>
        </div>
    );
};

export default function Home() {
    return (
        <div className="h-dvh flex flex-col">
            <ThreeScene />
        </div>
    );
}
