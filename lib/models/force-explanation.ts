import { formatLabNumber, frictionForceTitle } from "./lab-format.ts";
import type { PullDerived, PullParams } from "./pull-friction";

export type ExplainedForceName = "F" | "Fx" | "Fz" | "G" | "N" | "f";

export type ForceExplanation = {
  title: string;
  formula: string;
  substitution: string;
  result: string;
  detail: string;
};

function result(value: number) {
  return `${formatLabNumber(value)} N`;
}

export function forceExplanation(
  name: ExplainedForceName,
  params: PullParams,
  derived: PullDerived,
): ForceExplanation {
  const { Fx, Fz, G, N, f } = derived.forces;
  const pull = Math.hypot(Fx, Fz);

  switch (name) {
    case "F":
      return {
        title: "拉力 F",
        formula: "|F| = √(Fₓ² + Fᵧ²)",
        substitution: `√(${formatLabNumber(Fx)}² + ${formatLabNumber(Fz)}²)`,
        result: result(pull),
        detail: `方向角 θ = ${formatLabNumber(params.thetaDeg)}°，拉力大小由参数直接设定。`,
      };
    case "Fx":
      return {
        title: "水平分力 Fₓ",
        formula: "Fₓ = |F| × cosθ",
        substitution: `${formatLabNumber(Math.abs(params.F))} × cos(${formatLabNumber(params.thetaDeg)}°)`,
        result: result(Fx),
        detail: "正负号表示分力沿 x 轴的方向。",
      };
    case "Fz":
      return {
        title: "竖直分力 Fᵧ",
        formula: "Fᵧ = |F| × sinθ",
        substitution: `${formatLabNumber(Math.abs(params.F))} × sin(${formatLabNumber(params.thetaDeg)}°)`,
        result: result(Fz),
        detail: "该分力向上时会减小物体受到的支持力。",
      };
    case "G":
      return {
        title: "重力 G",
        formula: "G = m × g",
        substitution: `${formatLabNumber(params.m)} × ${formatLabNumber(params.g)}`,
        result: result(G),
        detail: "方向始终竖直向下。",
      };
    case "N":
      return {
        title: "支持力 N",
        formula: "N = G - Fᵧ",
        substitution: `${formatLabNumber(G)} - ${formatLabNumber(Fz)}`,
        result: result(N),
        detail: "接触地面且竖直方向平衡时，支持力抵消剩余的向下作用。",
      };
    case "f": {
      if (derived.mode === "static") {
        return {
          title: frictionForceTitle("static"),
          formula: "fs = -Fₓ",
          substitution: `-(${formatLabNumber(Fx)})`,
          result: result(f),
          detail: `静摩擦力会自行调整；最大静摩擦力 μₛN = ${formatLabNumber(params.muS * N)} N。`,
        };
      }

      const motionSign = f === 0 ? 0 : -Math.sign(f);
      return {
        title: frictionForceTitle("kinetic"),
        formula: "fk = -μₖN × sgn(vₓ)",
        substitution: `-${formatLabNumber(params.muK)} × ${formatLabNumber(N)} × ${motionSign}`,
        result: result(f),
        detail: "滑动摩擦力大小为 μₖN，方向与运动方向相反。",
      };
    }
  }
}
