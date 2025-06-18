// utils/createPBRTexture.ts
import * as THREE from 'three';

export async function createPBRTexture(imageSrc: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(10, 10); // tissage serré
      resolve(texture);
      console.log("Texture générée:", texture);
    };
    
  });
}
