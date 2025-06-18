// components/WovenFabric.tsx
import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

type WovenFabricProps = {
  texture: THREE.Texture;
  hours: number;
};


export function WovenFabric({ texture, hours }: WovenFabricProps) {
  const ref = useRef<THREE.Mesh>(null);
  const fadeFactor = Math.min(hours / 570, 1); // Normalize from 0 to 1


  return (
    <mesh ref={ref} rotation={[0, 0, 0]} position={[0, 0, 0]}>
  <planeGeometry args={[5, 5, 100, 100]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.8}
        metalness={0.1}
        normalMap={texture}
      />
      
    </mesh>
  );
}
