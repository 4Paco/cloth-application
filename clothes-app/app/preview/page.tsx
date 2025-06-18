'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TessellateModifier } from 'three/examples/jsm/Addons.js';

let isLightSelected = false;

const ThreeScene: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
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
            // renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setSize(
                containerRef.current?.clientWidth ?? 0,
                containerRef.current?.clientHeight ?? 0
            );

            containerRef.current?.appendChild(renderer.domElement);
            camera.position.z = 5;

            const scale = {x: 20, y: 20};

            const albedo = new THREE.TextureLoader().load( "./blanc_BaseColor.png" );
            albedo.wrapS = THREE.RepeatWrapping;
            albedo.wrapT = THREE.RepeatWrapping;
            albedo.repeat.set( scale.x, scale.y );

            const normal = new THREE.TextureLoader().load( "./blanc_Normal.png" );
            normal.wrapS = THREE.RepeatWrapping;
            normal.wrapT = THREE.RepeatWrapping;
            normal.repeat.set( scale.x, scale.y );
            
            const height = new THREE.TextureLoader().load( "./blanc_Height.png" );
            height.wrapS = THREE.RepeatWrapping;
            height.wrapT = THREE.RepeatWrapping;
            height.repeat.set( scale.x, scale.y );

            let geometry = new THREE.PlaneGeometry();
            const tessellateModifier = new TessellateModifier(8, 2);
            geometry = tessellateModifier.modify(geometry);

            const sphere_geometry = new THREE.SphereGeometry(0.7);
            const material = new THREE.MeshStandardMaterial({ map: albedo, normalMap: normal, bumpMap: height });
            const sphere_material = new THREE.MeshPhysicalMaterial({ color: 0x0000ff });
            const cube = new THREE.Mesh(geometry, material);
            const sphere = new THREE.Mesh(sphere_geometry, sphere_material);
            const light = new THREE.AmbientLight(0x404040);
            // const pointlight = new THREE.PointLight(0xffffff, 20);
            // pointlight.position.y = 3;
            const pointlight = new THREE.PointLight(0xffffff);
            const helper = new THREE.PointLightHelper(pointlight, 1);
            pointlight.position.x = -3;
            pointlight.position.z = 1;
            sphere.position.x = 1;
            // scene.add(sphere);
            scene.add(cube);
            scene.add(light);
            // scene.add(helper);
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
                pointlight.position.x = Math.cos(0.0015*t);
                pointlight.position.y = Math.cos(0.001*t);
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
    }, []);
    return <div className="flex-1" ref={containerRef} />;
};

export default function Home() {
    return (
        <div className="h-dvh flex flex-col">
            <div>Hello, world!</div>
            <ThreeScene />
        </div>
    );
}
