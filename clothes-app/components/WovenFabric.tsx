// components/WovenFabric.tsx
import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

export function WovenFabric({ texture }: { texture: THREE.Texture }) {
  const ref = useRef<THREE.Mesh>(null);

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
