// app/page.tsx (ou pages/index.tsx si Next <13)
'use client';
import { useMemo, useState, useEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Papa from "papaparse";

import ImageUploader from "../../components/ImageUploader";
import { createPBRTexture } from "./createPBRTexture";

async function loadFadingData() {
  const res = await fetch('/data/tmp.csv');
  const text = await res.text();
  return new Promise<any[]>((resolve) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
    });
  });
}

function TshirtModel({ texture, hours }: { texture: THREE.Texture; hours: number }) {
  const model = useGLTF('/models/tshirt.glb') as any;

  const [normalMap, roughnessMap, aoMap] = useLoader(THREE.TextureLoader, [
    '/textures/Tissage armure toile blanc_Normal.png',
    '/textures/Tissage armure toile blanc_Roughness.png',
    '/textures/Tissage armure toile blanc_AmbientOcclusion.png',
  ]);

  const [fadedTexture, setFadedTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!texture)  {
      setFadedTexture(null);  // no texture to fade
      return;
    }

    const applyFadeFromCSV = async () => {
      const data = await loadFadingData();
      console.log("CSV rows:", data);
      const matched = data.find((row) => Math.round(row.h) === hours);
      console.log("Matched row for", hours, ":", matched);
      const fadeY = matched ? matched.Y : 100; // Assume 100 (no fade) if not found
      const brightness = Math.round((fadeY / 100) * 255);

      const img = texture.image;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const dataArr = imageData.data;

      for (let i = 0; i < dataArr.length; i += 4) {
        dataArr[i] = dataArr[i] * (brightness / 255);     // R
        dataArr[i + 1] = dataArr[i + 1] * (brightness / 255); // G
        dataArr[i + 2] = dataArr[i + 2] * (brightness / 255); // B
      }

      ctx.putImageData(imageData, 0, 0);
      const fadedTex = new THREE.CanvasTexture(canvas);
      fadedTex.needsUpdate = true;
      setFadedTexture(fadedTex);
    };

    applyFadeFromCSV();
  }, [texture, hours]);

  useEffect(() => {
    if (model?.scene && fadedTexture) {
      model.scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if(fadedTexture){
          mat.map = fadedTexture;
          mat.normalMap = normalMap;
          mat.roughnessMap = roughnessMap;
          mat.aoMap = aoMap;
          }
          else{
            mat.map = null;
            mat.color = new THREE.Color(0xffffff); // white color
            mat.normalMap = null;
            mat.roughnessMap = null;
            mat.aoMap = null;

          }
          mat.needsUpdate = true;

          if (!child.geometry.attributes.uv2) {
            child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
          }
        }
      });
    }
  }, [model, fadedTexture, normalMap, roughnessMap, aoMap]);

  useMemo(() => {
    if (model?.scene) {
      const box = new THREE.Box3().setFromObject(model.scene);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.scene.position.sub(center); // Center the model
    }
  }, [model]);

  return <primitive object={model.scene} />;
}

export default function Home() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hours, setHours] = useState(0);

  const handleImage = async (img: string) => {
    const tex = await createPBRTexture(img);
    setTexture(tex);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center my-4">Tissu tissé 3D</h1>
      <ImageUploader onImage={handleImage} />
      <div className="my-4 px-4 max-w-xl mx-auto">
        <label className="block mb-2 text-sm font-medium">
          Heures d’exposition au soleil : {hours} h
        </label>
        <input
          type="range"
          min={0}
          max={570}
          value={hours}
          onChange={(e) => setHours(parseInt(e.target.value))}
          className="w-full accent-yellow-500"
        />
      </div>
      <div style={{ height: "500px" }}>
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} intensity={1.5} />
          <OrbitControls target={[0, 0, 0]} enablePan={false} />
          {<TshirtModel hours={hours} texture={texture} />}
        </Canvas>
      </div>
    </div>
  );
}
