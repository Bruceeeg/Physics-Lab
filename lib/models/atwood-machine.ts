import type { FrictionKind } from "./lab-format.ts";

export type AtwoodMode = "classic" | "modified" | "pulley";

export type AtwoodParams = {
  m1: number;
  m2: number;
  g: number;
  travel: number;
  mu?: number;
  muS?: number;
  Mp?: number;
  Rp?: number;
};

export type AtwoodSample = {
  t: number;
  s: number;
  y1: number;
  y2: number;
  v1: number;
  v2: number;
  a: number;
  T: number;
  T1: number;
  I: number;
  N: number;
  f: number;
  frictionKind: FrictionKind;
};

export const DEFAULT_ATWOOD: AtwoodParams = {
  m1: 1.0,
  m2: 1.2,
  g: 9.81,
  travel: 0.55,
  mu: 0,
  Mp: 0.4,
  Rp: 0.12,
};

export function pulleyInertia(params: AtwoodParams) {
  const Mp = params.Mp ?? 0.4;
  const Rp = params.Rp ?? 0.12;
  return 0.5 * Mp * Rp * Rp;
}

function frictionMuS(params: AtwoodParams) {
  return params.muS ?? params.mu ?? 0;
}

function frictionMuK(params: AtwoodParams) {
  return Math.min(params.mu ?? 0, frictionMuS(params));
}

export function acceleration(params: AtwoodParams, mode: AtwoodMode = "classic") {
  const sum = params.m1 + params.m2;
  if (sum <= 1e-12) {
    return 0;
  }
  if (mode === "pulley") {
    const Rp = params.Rp ?? 0.12;
    const denom = sum + pulleyInertia(params) / (Rp * Rp);
    return denom > 1e-12 ? (params.g * (params.m2 - params.m1)) / denom : 0;
  }
  if (mode === "modified") {
    const N = params.m1 * params.g;
    const drive = params.m2 * params.g;
    if (drive <= frictionMuS(params) * N + 1e-12) {
      return 0;
    }
    const kinetic = drive - frictionMuK(params) * N;
    return kinetic > 0 ? kinetic / sum : 0;
  }
  return (params.g * (params.m2 - params.m1)) / sum;
}

export function tension(params: AtwoodParams, mode: AtwoodMode = "classic") {
  const a = acceleration(params, mode);
  if (mode === "pulley") {
    return params.m2 * (params.g - a);
  }
  if (mode === "modified") {
    return params.m2 * (params.g - a);
  }
  return (2 * params.m1 * params.m2 * params.g) / (params.m1 + params.m2);
}

export function lightTension(params: AtwoodParams, mode: AtwoodMode = "classic") {
  const a = acceleration(params, mode);
  if (mode === "pulley") {
    return params.m1 * (params.g + a);
  }
  return tension(params, mode);
}

export function contactForces(params: AtwoodParams, mode: AtwoodMode = "classic") {
  if (mode !== "modified") {
    return { N: 0, f: 0, frictionKind: "none" as const };
  }
  const N = params.m1 * params.g;
  const a = acceleration(params, mode);
  if (Math.abs(a) < 1e-9) {
    const staticF = params.m2 * params.g;
    return {
      N,
      f: staticF,
      frictionKind: frictionMuS(params) > 1e-12 ? ("static" as const) : ("none" as const),
    };
  }
  const muK = frictionMuK(params);
  return {
    N,
    f: muK * N,
    frictionKind: muK > 1e-12 ? ("kinetic" as const) : ("none" as const),
  };
}

export function timeToStop(params: AtwoodParams, mode: AtwoodMode = "classic") {
  const a = Math.abs(acceleration(params, mode));
  if (a <= 1e-12) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.sqrt((2 * params.travel) / a);
}

export function lightMass(params: AtwoodParams): "A" | "B" {
  return params.m1 <= params.m2 ? "A" : "B";
}

export function atwoodGeometry(params: AtwoodParams, mode: AtwoodMode = "classic") {
  const pulleyR = params.Rp ?? 0.12;
  const travel = Math.max(0.05, params.travel);
  if (mode === "modified") {
    const hang0 = 0.28;
    const tableY = travel + hang0 + 0.2;
    const cart0 = -(travel + 0.4);
    return { pulleyY: tableY, pulleyR, hang0, tableY, cart0 };
  }
  const hang0 = travel + 0.38;
  const pulleyY = hang0 + travel + 0.34;
  return { pulleyY, pulleyR, hang0, tableY: 0, cart0: 0 };
}

export function hangingPositions(
  params: AtwoodParams,
  sample: AtwoodSample,
  mode: AtwoodMode = "classic",
) {
  const geo = atwoodGeometry(params, mode);
  if (mode === "modified") {
    const cartX = geo.cart0 + sample.s;
    return {
      ...geo,
      A: [cartX, geo.tableY + 0.06, 0] as [number, number, number],
      B: [geo.pulleyR, geo.pulleyY - geo.hang0 + sample.y2, 0] as [number, number, number],
    };
  }
  return {
    ...geo,
    A: [-geo.pulleyR, geo.pulleyY - geo.hang0 + sample.y1, 0] as [number, number, number],
    B: [geo.pulleyR, geo.pulleyY - geo.hang0 + sample.y2, 0] as [number, number, number],
  };
}

export function lightKinematics(params: AtwoodParams, sample: AtwoodSample) {
  const id = lightMass(params);
  if (id === "A") {
    return {
      id,
      s: sample.y1,
      v: -sample.v1,
      a: sample.a,
      T: sample.T1,
      m: params.m1,
      mg: params.m1 * params.g,
    };
  }
  return {
    id,
    s: sample.y2,
    v: -sample.v2,
    a: -sample.a,
    T: sample.T,
    m: params.m2,
    mg: params.m2 * params.g,
  };
}
export function sampleAt(params: AtwoodParams, t: number, mode: AtwoodMode = "classic"): AtwoodSample {
  const tEnd = timeToStop(params, mode);
  const tc = Number.isFinite(tEnd) ? Math.min(Math.max(0, t), tEnd) : Math.max(0, t);
  const a = acceleration(params, mode);
  const s = 0.5 * a * tc * tc;
  const v = a * tc;
  const contact = contactForces(params, mode);
  return {
    t: tc,
    s,
    y1: s,
    y2: -s,
    v1: mode === "modified" ? v : -v,
    v2: v,
    a,
    T: tension(params, mode),
    T1: lightTension(params, mode),
    I: mode === "pulley" ? pulleyInertia(params) : 0,
    N: contact.N,
    f: contact.f,
    frictionKind: contact.frictionKind,
  };
}
