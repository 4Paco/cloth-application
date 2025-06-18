// app/page.tsx (ou pages/index.tsx si Next <13)
"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ImageUploader from "../../components/ImageUploader";
import { WovenFabric } from "../../components/WovenFabric";
import { createPBRTexture } from "./createPBRTexture";
import * as THREE from "three";

export default function Home() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const handleImage = async (img: string) => {
    console.log("Image chargée:", img);
    const tex = await createPBRTexture(img);
    setTexture(tex);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center my-4">Tissu tissé 3D</h1>
      <ImageUploader onImage={handleImage} />
      <div style={{ height: "500px" }}>
        <Canvas style={{ background: "#888" }}>
          <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
          <OrbitControls target={[0, 0, 0]}/>
          {texture && <WovenFabric texture={texture} />}
        </Canvas>
      </div>
    </div>
  );
}
