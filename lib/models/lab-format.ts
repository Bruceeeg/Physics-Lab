export const DISPLAY_EPS = 0.005;

export type FrictionKind = "static" | "kinetic" | "none";

export function formatLabNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const normalized = Math.abs(value) < DISPLAY_EPS ? 0 : value;
  return normalized.toFixed(2);
}

export function formatLabSci(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.01 || abs >= 10000)) {
    const [mantissa, exponent] = value.toExponential(2).split("e");
    return `${mantissa}×10^${Number(exponent)}`;
  }
  return formatLabNumber(value);
}

export function formatLabSigned(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const normalized = Math.abs(value) < DISPLAY_EPS ? 0 : value;
  if (normalized === 0) {
    return "0.00";
  }
  return `${normalized > 0 ? "+" : "-"}${Math.abs(normalized).toFixed(2)}`;
}

export function frictionForceLabel(kind: FrictionKind) {
  if (kind === "static") {
    return "fs";
  }
  if (kind === "kinetic") {
    return "fk";
  }
  return "f";
}

export function frictionForceTitle(kind: FrictionKind) {
  if (kind === "static") {
    return "静摩擦力 fs";
  }
  if (kind === "kinetic") {
    return "滑动摩擦力 fk";
  }
  return "摩擦力 f";
}
