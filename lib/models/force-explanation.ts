import type { PullDerived, PullParams } from "./pull-friction";

export type ExplainedForceName = "F" | "Fx" | "Fz" | "G" | "N" | "f";

export type ForceExplanation = {
  title: string;
  formula: string;
  substitution: string;
  result: string;
  detail: string;
};

function fixed(value: number) {
  const normalized = Math.abs(value) < 0.005 ? 0 : value;
  return normalized.toFixed(2);
}

function result(value: number) {
  return `${fixed(value)} N`;
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
        formula: "|F| = √(Fₓ² + Fᶻ²)",
        substitution: `√(${fixed(Fx)}² + ${fixed(Fz)}²)`,
        result: result(pull),
        detail: `方向角 θ = ${fixed(params.thetaDeg)}°，拉力大小由参数直接设定。`,
      };
    case "Fx":
      return {
        title: "水平分力 Fₓ",
        formula: "Fₓ = |F| × cosθ",
        substitution: `${fixed(Math.abs(params.F))} × cos(${fixed(params.thetaDeg)}°)`,
        result: result(Fx),
        detail: "正负号表示分力沿 x 轴的方向。",
      };
    case "Fz":
      return {
        title: "竖直分力 Fᶻ",
        formula: "Fᶻ = |F| × sinθ",
        substitution: `${fixed(Math.abs(params.F))} × sin(${fixed(params.thetaDeg)}°)`,
        result: result(Fz),
        detail: "该分力向上时会减小物体受到的支持力。",
      };
    case "G":
      return {
        title: "重力 G",
        formula: "G = m × g",
        substitution: `${fixed(params.m)} × ${fixed(params.g)}`,
        result: result(G),
        detail: "方向始终竖直向下。",
      };
    case "N":
      return {
        title: "支持力 N",
        formula: "N = G - Fᶻ",
        substitution: `${fixed(G)} - ${fixed(Fz)}`,
        result: result(N),
        detail: "接触地面且竖直方向平衡时，支持力抵消剩余的向下作用。",
      };
    case "f": {
      if (derived.mode === "static") {
        return {
          title: "静摩擦力 f",
          formula: "f = -Fₓ",
          substitution: `-(${fixed(Fx)})`,
          result: result(f),
          detail: `静摩擦力会自行调整；最大静摩擦力 μₛN = ${fixed(params.muS * N)} N。`,
        };
      }

      const motionSign = f === 0 ? 0 : -Math.sign(f);
      return {
        title: "滑动摩擦力 f",
        formula: "f = -μₖN × sgn(vₓ)",
        substitution: `-${fixed(params.muK)} × ${fixed(N)} × ${motionSign}`,
        result: result(f),
        detail: "滑动摩擦力大小为 μₖN，方向与运动方向相反。",
      };
    }
  }
}
