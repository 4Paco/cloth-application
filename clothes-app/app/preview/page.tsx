'use client';

import { load_image } from '@/actions/image';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TessellateModifier } from 'three/examples/jsm/Addons.js';

let isLightSelected = false;
let cvs;
let ctx: CanvasRenderingContext2D;

const ThreeScene: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
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
                const renderer = new THREE.WebGLRenderer({ alpha: true });
                // renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setSize(
                    containerRef.current?.clientWidth ?? 0,
                    containerRef.current?.clientHeight ?? 0
                );

                containerRef.current?.appendChild(renderer.domElement);
                camera.position.z = 5;

                const scale = { x: 10, y: 10 };

                const normal = new THREE.TextureLoader().load('./default_cloth/normal.png');
                normal.wrapS = THREE.RepeatWrapping;
                normal.wrapT = THREE.RepeatWrapping;
                normal.minFilter = THREE.NearestFilter;
                normal.magFilter = THREE.NearestFilter;
                normal.flipY = false;
                normal.repeat.set(scale.x, scale.y);

                const height = new THREE.TextureLoader().load('./default_cloth/height.png');
                height.wrapS = THREE.RepeatWrapping;
                height.wrapT = THREE.RepeatWrapping;
                height.minFilter = THREE.NearestFilter;
                height.magFilter = THREE.NearestFilter;
                height.flipY = false;
                height.repeat.set(scale.x, scale.y);

                const alpha = new THREE.TextureLoader().load('./default_cloth/alpha.png');
                alpha.wrapS = THREE.RepeatWrapping;
                alpha.wrapT = THREE.RepeatWrapping;
                alpha.minFilter = THREE.NearestFilter;
                alpha.magFilter = THREE.NearestFilter;
                alpha.flipY = false;
                alpha.repeat.set(scale.x, scale.y);

                let geometry = new THREE.PlaneGeometry();
                const tessellateModifier = new TessellateModifier(8, 2);
                geometry = tessellateModifier.modify(geometry);

                cvs = document.createElement('canvas');
                cvs.width = 1024;
                cvs.height = 1024;
                ctx = cvs.getContext('2d') as CanvasRenderingContext2D;
                ctx.imageSmoothingEnabled = false;
                const ctx_image_data = ctx.createImageData(1024, 1024);

                const albedo = new THREE.CanvasTexture(cvs);
                albedo.wrapS = THREE.RepeatWrapping;
                albedo.wrapT = THREE.RepeatWrapping;
                albedo.minFilter = THREE.NearestFilter;
                albedo.magFilter = THREE.NearestFilter;
                albedo.flipY = false;
                albedo.repeat.set(scale.x, scale.y);

                const get_index = (x: number, y: number, w: number = 1024): number => {
                    const red = (y * w + x) * 4;
                    return red;
                };

                Promise.all([
                    load_image('./default_cloth/albedo.png'),
                    load_image('./pixels2.png'),
                    load_image('./default_cloth/ids.png'),
                    load_image('./default_cloth/height.png'),
                ]).then(([base_color, pixels, ids, ao]) => {
                    const base_color_cvs = document.createElement('canvas');
                    base_color_cvs.width = base_color.width;
                    base_color_cvs.height = base_color.height;
                    const base_color_ctx = base_color_cvs.getContext(
                        '2d'
                    ) as CanvasRenderingContext2D;
                    base_color_ctx.imageSmoothingEnabled = false;
                    base_color_ctx.drawImage(base_color, 0, 0);
                    const base_color_image_data = base_color_ctx.getImageData(
                        0,
                        0,
                        base_color.width,
                        base_color.height
                    );

                    const ao_cvs = document.createElement('canvas');
                    ao_cvs.width = ao.width;
                    ao_cvs.height = ao.height;
                    const ao_ctx = ao_cvs.getContext('2d') as CanvasRenderingContext2D;
                    ao_ctx.imageSmoothingEnabled = false;
                    ao_ctx.drawImage(ao, 0, 0);
                    const ao_image_data = ao_ctx.getImageData(0, 0, ao.width, ao.height);

                    const pixels_cvs = document.createElement('canvas');
                    pixels_cvs.width = pixels.width;
                    pixels_cvs.height = pixels.height;
                    const pixels_ctx = pixels_cvs.getContext('2d') as CanvasRenderingContext2D;
                    pixels_ctx.imageSmoothingEnabled = false;
                    pixels_ctx.drawImage(pixels, 0, 0);
                    const pixels_image_data = pixels_ctx.getImageData(
                        0,
                        0,
                        pixels.width,
                        pixels.height
                    );

                    const ids_cvs = document.createElement('canvas');
                    ids_cvs.width = ids.width;
                    ids_cvs.height = ids.height;
                    const ids_ctx = ids_cvs.getContext('2d') as CanvasRenderingContext2D;
                    ids_ctx.imageSmoothingEnabled = false;
                    ids_ctx.drawImage(ids, 0, 0);
                    const ids_image_data = ids_ctx.getImageData(0, 0, ids.width, ids.height);

                    // ctx.drawImage(pixels, 0, 0, 1024, 1024);
                    for (let x = 0; x < 1024; x += 1) {
                        for (let y = 0; y < 1024; y += 1) {
                            const idx = get_index(x, y, 1024);
                            const sample =
                                ids_image_data.data[idx + 0] +
                                ids_image_data.data[idx + 1] * 256 +
                                ids_image_data.data[idx + 2] * 256 * 256;

                            const indexed_x = sample % pixels_cvs.width;
                            const indexed_y = Math.floor(sample / pixels_cvs.width);

                            if (indexed_x > 48 || indexed_y > 48) console.log(indexed_x, indexed_y);

                            const pixel_index = get_index(indexed_x, indexed_y, pixels_cvs.width);
                            const base_color_index = get_index(x, y);

                            const r =
                                (pixels_image_data.data[pixel_index + 0] *
                                    base_color_image_data.data[base_color_index + 0] *
                                    ao_image_data.data[base_color_index + 0]) /
                                (255 * 255 * 255);
                            const g =
                                (pixels_image_data.data[pixel_index + 1] *
                                    base_color_image_data.data[base_color_index + 1] *
                                    ao_image_data.data[base_color_index + 1]) /
                                (255 * 255 * 255);
                            const b =
                                (pixels_image_data.data[pixel_index + 2] *
                                    base_color_image_data.data[base_color_index + 2] *
                                    ao_image_data.data[base_color_index + 2]) /
                                (255 * 255 * 255);

                            ctx_image_data.data[idx + 0] = r * 255;
                            ctx_image_data.data[idx + 1] = g * 255;
                            ctx_image_data.data[idx + 2] = b * 255;
                            ctx_image_data.data[idx + 3] = 255;
                        }
                    }

                    ctx.putImageData(ctx_image_data, 0, 0);
                    albedo.needsUpdate = true;
                });

                const sphere_geometry = new THREE.SphereGeometry(0.7);
                const material = new THREE.MeshStandardMaterial({
                    map: albedo,
                    alphaMap: alpha,
                    normalMap: normal,
                    bumpMap: height,
                    transparent: false,
                });
                const sphere_material = new THREE.MeshPhysicalMaterial({ color: 0x0000ff });
                const cube = new THREE.Mesh(geometry, material);
                const sphere = new THREE.Mesh(sphere_geometry, sphere_material);
                const light = new THREE.AmbientLight(0xaaaaaa);
                const pointlight = new THREE.PointLight(0xffffff);

                pointlight.position.x = -3;
                pointlight.position.z = 1;
                sphere.position.x = 1;
                // scene.add(sphere);
                scene.add(cube);
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
};

export default function Home() {
    return (
        <div className="h-dvh flex flex-col">
            <ThreeScene />
        </div>
    );
}
