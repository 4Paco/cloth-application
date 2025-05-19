'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ThreeScene: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
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

            const geometry = new THREE.BoxGeometry();
            const sphere_geometry = new THREE.SphereGeometry(0.7);
            const material = new THREE.MeshPhysicalMaterial({ color: 0x00ff00 });
            const sphere_material = new THREE.MeshPhysicalMaterial({ color: 0x0000ff });
            const cube = new THREE.Mesh(geometry, material);
            const sphere = new THREE.Mesh(sphere_geometry, sphere_material);
            const light = new THREE.AmbientLight(0x404040);
            const pointlight = new THREE.PointLight(0xffffff);
            pointlight.position.y = 3;
            sphere.position.x = 1;
            scene.add(sphere);
            scene.add(cube);
            scene.add(light);
            scene.add(pointlight);

            const controls = new OrbitControls(camera, renderer.domElement);

            // Render the scene and camera
            renderer.render(scene, camera);

            // Add this function inside the useEffect hook
            const renderScene = () => {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                controls.update();
                renderer.render(scene, camera);
                requestAnimationFrame(renderScene);
            };

            // Call the renderScene function to start the animation loop
            renderScene();

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
