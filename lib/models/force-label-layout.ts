export type ForceLabelVec3 = [number, number, number];

export function placeForceLabel(
  vector: ForceLabelVec3,
  tipDistance: number,
  offset: ForceLabelVec3 = [0, 0, 0],
  gap = 0.14,
): { tip: ForceLabelVec3; label: ForceLabelVec3 } | null {
  const magnitude = Math.hypot(vector[0], vector[1], vector[2]);
  if (magnitude < 1e-9) {
    return null;
  }
  const direction: ForceLabelVec3 = [
    vector[0] / magnitude,
    vector[1] / magnitude,
    vector[2] / magnitude,
  ];
  const tip: ForceLabelVec3 = [
    direction[0] * tipDistance,
    direction[1] * tipDistance,
    direction[2] * tipDistance,
  ];
  const labelDistance = tipDistance + gap;
  const label: ForceLabelVec3 = [
    direction[0] * labelDistance + offset[0],
    direction[1] * labelDistance + offset[1],
    direction[2] * labelDistance + offset[2],
  ];
  return { tip, label };
}
