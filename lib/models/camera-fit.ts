export function isUsableCanvasSize(width: number, height: number) {
  return Number.isFinite(width) && Number.isFinite(height) && width >= 8 && height >= 8;
}

export function fitViewDistance({
  extentX,
  extentY,
  width,
  height,
  fovDeg,
}: {
  extentX: number;
  extentY: number;
  width: number;
  height: number;
  fovDeg: number;
}) {
  if (!isUsableCanvasSize(width, height)) {
    return null;
  }
  const fov = (fovDeg * Math.PI) / 180;
  const aspect = width / height;
  const fitHeight = (extentY * 1.3) / 2 / Math.tan(fov / 2);
  const fitWidth = (extentX * 1.15) / 2 / (aspect * Math.tan(fov / 2));
  return Math.max(2, fitHeight, fitWidth);
}
