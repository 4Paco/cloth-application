import * as THREE from "three";

export async function createWovenHeightMap(imageSrc: string): Promise<HTMLCanvasElement> {
  const img = await loadImage(imageSrc);
  const motifWidth = img.width;
  const motifHeight = img.height;

  const canvasSize = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = canvasSize;
  const ctx = canvas.getContext("2d")!;

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = motifWidth;
  tmpCanvas.height = motifHeight;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.drawImage(img, 0, 0);
  const imageData = tmpCtx.getImageData(0, 0, motifWidth, motifHeight).data;

  const stepX = canvasSize / motifWidth;
  const stepY = canvasSize / motifHeight;

  for (let y = 0; y < motifHeight; y++) {
    for (let x = 0; x < motifWidth; x++) {
      const i = (y * motifWidth + x) * 4;
      const lum = 0.3 * imageData[i] + 0.6 * imageData[i + 1] + 0.1 * imageData[i + 2];

      const wovenValue = (x + y) % 2 === 0 ? 1 : -1;
      const brightness = 128 + wovenValue * (lum - 128) * 0.8;

      drawThreadEllipse(ctx, x * stepX, y * stepY, stepX, stepY, brightness);
    }
  }

  return canvas;
}

function drawThreadEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  brightness: number
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) * 0.4;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const bright = Math.max(0, Math.min(255, brightness));
  grad.addColorStop(0, `rgb(${bright},${bright},${bright})`);
  grad.addColorStop(1, `rgb(128,128,128)`); // fond neutre

  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
  });
}
