'use client';

import React, { useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function TshirtModel() {
  const model = useGLTF('/models/tshirt.glb') as any;
  

  const [
    colorMap,
    normalMap,
    roughnessMap,
    heightMap,
    aoMap
  ] = useLoader(THREE.TextureLoader, [
    '/textures/Tissage armure toile blanc_BaseColor.png',
    '/textures/Tissage armure toile blanc_Normal.png',
    '/textures/Tissage armure toile blanc_Roughness.png',
    '/textures/Tissage armure toile blanc_Height.png',
    '/textures/Tissage armure toile blanc_AmbientOcclusion.png',
  ]);

  useEffect(() => {
    if (model && model.scene) {
      model.scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.map = colorMap;
          material.normalMap = normalMap;
          material.roughnessMap = roughnessMap;
          //material.displacementMap = heightMap;
          material.aoMap = aoMap;

          // Facultatif : displacement peut causer des pics si trop fort
        // Supprime-le ou baisse la valeur
        // material.displacementMap = heightMap;
         //material.displacementScale = 0.01;
          

          material.needsUpdate = true;

          // AO map requires second set of UVs
          if (!child.geometry.attributes.uv2) {
            child.geometry.setAttribute(
              'uv2',
              child.geometry.attributes.uv
            );
          }
        }
      });
    }
  }, [model, colorMap, normalMap, roughnessMap, heightMap, aoMap]);

  return <primitive object={model.scene} />;
}

export default function TshirtPage() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 2]} intensity={1.5} />
        <TshirtModel />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
