export function generateNormalMapFromHeight(heightCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const width = heightCanvas.width;
  const height = heightCanvas.height;
  const ctx = heightCanvas.getContext("2d")!;
  const srcData = ctx.getImageData(0, 0, width, height).data;

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = width;
  normalCanvas.height = height;
  const normalCtx = normalCanvas.getContext("2d")!;
  const normalData = normalCtx.createImageData(width, height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;

      const getLum = (dx: number, dy: number) => {
        const idx = ((y + dy) * width + (x + dx)) * 4;
        return srcData[idx];
      };

      const dx = getLum(1, 0) - getLum(-1, 0);
      const dy = getLum(0, 1) - getLum(0, -1);
      const dz = 1.0;

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = dx / len;
      const ny = dy / len;
      const nz = dz / len;

      normalData.data[i] = (nx + 1) * 127.5;
      normalData.data[i + 1] = (ny + 1) * 127.5;
      normalData.data[i + 2] = (nz + 1) * 127.5;
      normalData.data[i + 3] = 255;
    }
  }

  normalCtx.putImageData(normalData, 0, 0);
  return normalCanvas;
}
