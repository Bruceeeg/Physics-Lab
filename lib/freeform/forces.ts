export function forceComponents(magnitude: number, thetaDeg: number, phiDeg: number) {
  const theta = (thetaDeg * Math.PI) / 180;
  const phi = (phiDeg * Math.PI) / 180;
  const planar = magnitude * Math.cos(phi);
  return {
    x: planar * Math.cos(theta),
    y: planar * Math.sin(theta),
    z: magnitude * Math.sin(phi),
  };
}

export function torqueFromOffset(
  offset: { x: number; y: number; z: number },
  force: { x: number; y: number; z: number },
) {
  return {
    x: offset.y * force.z - offset.z * force.y,
    y: offset.z * force.x - offset.x * force.z,
    z: offset.x * force.y - offset.y * force.x,
  };
}
