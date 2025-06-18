"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { createWovenHeightMap } from "@/lib/generateWovenHeightMap";
import { generateNormalMapFromHeight } from "@/lib/generateNormalMap";

export default function WovenTextureViewer({ imageSrc }: { imageSrc: string }) {
  const [textures, setTextures] = useState<{
    displacement?: THREE.CanvasTexture;
    normal?: THREE.CanvasTexture;
    diffuse?: THREE.Texture;
  }>({});

  useEffect(() => {
    async function loadTextures() {
      const heightMapCanvas = await createWovenHeightMap(imageSrc);
      const normalCanvas = generateNormalMapFromHeight(heightMapCanvas);

      const disp = new THREE.CanvasTexture(heightMapCanvas);
      const normal = new THREE.CanvasTexture(normalCanvas);
      const diffuse = new THREE.TextureLoader().load(imageSrc);

      [disp, normal, diffuse].forEach((t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(4, 4);
      });

      setTextures({ displacement: disp, normal: normal, diffuse });
    }

    loadTextures();
  }, [imageSrc]);

  if (!textures.displacement || !textures.normal || !textures.diffuse) return <p>Chargement…</p>;

  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} />
      <Suspense fallback={null}>
        <mesh scale={[2, 2, 1]}>
          <planeGeometry args={[1, 1, 256, 256]} />
          <meshStandardMaterial
            map={textures.diffuse}
            displacementMap={textures.displacement}
            displacementScale={0.1}
            normalMap={textures.normal}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
}
