import { GAS_R } from "../models/boyles-law.ts";
import { COULOMB_K, EPS_0 } from "../models/electric-field.ts";
import { ELEM_CHARGE, PLANCK_H, SPEED_OF_LIGHT } from "../models/particle-model-of-light.ts";
import { MU_0 } from "../models/magnetism.ts";
import type { Givens, Kind, Problem } from "./types.ts";

const GRAV = 6.6743e-11;

function num(given: Givens, key: string, fallback = 0) {
  const value = given[key];
  return value === undefined ? fallback : value;
}

function kappa(code: number) {
  if (code === 1) return 1;
  if (code === 2) return 0.4;
  if (code === 3) return 2 / 3;
  return 0.5;
}

function rad(deg: number) {
  return (deg * Math.PI) / 180;
}

function centeredSlope(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((sum, value) => sum + value, 0) / n;
  const my = ys.reduce((sum, value) => sum + value, 0) / n;
  let nume = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = (xs[i] ?? 0) - mx;
    nume += dx * ((ys[i] ?? 0) - my);
    den += dx * dx;
  }
  const slope = nume / den;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

export function oracle(problem: Problem): number[] {
  return expectKind(problem.kind, problem.givens);
}

export function expectKind(kind: Kind, given: Givens): number[] {
  const g = num(given, "g", 9.8);
  if (kind === "atwood") {
    const m1 = num(given, "m1", 1);
    const m2 = num(given, "m2", 2);
    const sum = m1 + m2;
    return [(g * (m2 - m1)) / sum, (2 * m1 * m2 * g) / sum];
  }
  if (kind === "atwood-incline") {
    const m1 = num(given, "m1", 2);
    const m2 = num(given, "m2", 3);
    const theta = rad(num(given, "theta", 30));
    return [(m2 * g - m1 * g * Math.sin(theta)) / (m1 + m2)];
  }
  if (kind === "atwood-table") {
    const m1 = num(given, "m1", 2);
    const m2 = num(given, "m2", 1);
    const mu = num(given, "mu", 0.2);
    const drive = m2 * g;
    const friction = mu * m1 * g;
    return [drive <= friction ? 0 : (drive - friction) / (m1 + m2)];
  }
  if (kind === "atwood-pulley") {
    const m1 = num(given, "m1", 1);
    const m2 = num(given, "m2", 1.4);
    const Mp = num(given, "Mp", 0.4);
    const Rp = num(given, "Rp", 0.12);
    const inertia = 0.5 * Mp * Rp * Rp;
    return [(g * (m2 - m1)) / (m1 + m2 + inertia / (Rp * Rp))];
  }
  if (kind === "three-mass") {
    const m = num(given, "m", 1);
    const M = num(given, "M", 2);
    const along = 3 * m * g * Math.sin(rad(num(given, "theta", 30)));
    return [(M * g - along) / (M + 3 * m)];
  }
  if (kind === "spring-speed") {
    return [num(given, "A", 0.1) * Math.sqrt(num(given, "k", 200) / num(given, "m", 0.5))];
  }
  if (kind === "spring-stick") {
    const m1 = num(given, "m1", 1);
    const m2 = num(given, "m2", 3);
    const launched = num(given, "A", 0.2) * Math.sqrt(num(given, "k", 100) / m1);
    const left = launched * launched - 2 * num(given, "mu", 0) * g * num(given, "D", 0);
    const after = Math.sqrt(Math.max(0, left));
    return [after, (m1 * after) / (m1 + m2)];
  }
  if (kind === "spring-k") {
    const x = num(given, "x", 0.05);
    const m = num(given, "m", 0.2);
    return [(m * g) / x, 2 * Math.PI * Math.sqrt(x / g)];
  }
  if (kind === "spring-work") {
    const M = num(given, "M", 0.2);
    const v0 = num(given, "v0", 3);
    const B = num(given, "B", 80);
    const v = (3 * M * v0) / (5 * M);
    const ke = 0.5 * 5 * M * v * v;
    return [v, (4 * ke / B) ** 0.25];
  }
  if (kind === "projectile") {
    const v0 = num(given, "v0", 12);
    const theta = rad(num(given, "theta", 30));
    const h = num(given, "h", 0);
    const vx = v0 * Math.cos(theta);
    const vy = v0 * Math.sin(theta);
    const t = (vy + Math.sqrt(vy * vy + 2 * g * h)) / g;
    return [vx * t, vy > 0 ? h + (vy * vy) / (2 * g) : h];
  }
  if (kind === "table-launch") {
    const h = num(given, "h", 0.8);
    const t = Math.sqrt((2 * h) / g);
    return [t, num(given, "v0", 3) * t];
  }
  if (kind === "kinematic") {
    const t = num(given, "t", 2);
    const v0 = num(given, "v0");
    const a = num(given, "a");
    return [num(given, "x0") + v0 * t + 0.5 * a * t * t, v0 + a * t];
  }
  if (kind === "incline") {
    const theta = rad(num(given, "theta", 30));
    const muS = num(given, "muS", 0.1);
    const muK = Math.min(muS, num(given, "muK", 0.1));
    if (Math.tan(theta) <= muS) {
      return [0, 0];
    }
    const a = g * (Math.sin(theta) - muK * Math.cos(theta));
    const L = num(given, "L", 1);
    return [a, Math.sqrt(Math.max(0, 2 * a * L))];
  }
  if (kind === "mu-angle") {
    return [Math.tan(rad(num(given, "theta", 25)))];
  }
  if (kind === "pull") {
    const theta = rad(num(given, "theta"));
    const F = num(given, "F");
    const m = num(given, "m", 1);
    const Fx = F * Math.cos(theta);
    const Fy = F * Math.sin(theta);
    const N = m * g - Fy;
    if (N <= 0) {
      return [Fx / m, 0];
    }
    const muS = num(given, "muS", num(given, "mu"));
    const muK = Math.min(muS, num(given, "muK", num(given, "mu")));
    if (Math.abs(Fx) <= muS * N) {
      return [0, N];
    }
    return [(Fx - muK * N * Math.sign(Fx || 1)) / m, N];
  }
  if (kind === "friction-stop") {
    const mu = num(given, "muK", num(given, "mu"));
    const v0 = num(given, "v0", 4);
    const D = num(given, "D", 1);
    return [-mu * g, Math.sqrt(Math.max(0, v0 * v0 - 2 * mu * g * D))];
  }
  if (kind === "loop") {
    const R = num(given, "R", 0.4);
    const h = num(given, "h", 1.2);
    const factor = num(given, "roll", 0) === 1 ? 1 + kappa(num(given, "shape", 0)) : 1;
    const hMin = 2 * R + 0.5 * R * factor;
    const drop = h - 2 * R;
    return [hMin, drop > 0 ? Math.sqrt((2 * g * drop) / factor) : 0];
  }
  if (kind === "spring-t") {
    return [2 * Math.PI * Math.sqrt(num(given, "m", 0.3) / num(given, "k", 40))];
  }
  if (kind === "pendulum-t") {
    return [2 * Math.PI * Math.sqrt(num(given, "L", 1) / g)];
  }
  if (kind === "physical-t") {
    const L = num(given, "L", 1);
    const m = num(given, "m", 0.3);
    const pivot = Math.min(0.45, Math.max(0, num(given, "pivot", 0)));
    const d = Math.abs(L / 2 - pivot * L);
    const I = (m * L * L) / 12 + m * d * d;
    return [2 * Math.PI * Math.sqrt(I / (m * g * d))];
  }
  if (kind === "torsion-t") {
    const n = Math.max(1, num(given, "n", 3));
    const m = num(given, "m", 0.3);
    const L = num(given, "L", 1);
    const I = n * 0.5 * m * L * L;
    return [2 * Math.PI * Math.sqrt(I / num(given, "kappa", 0.45))];
  }
  if (kind === "parallel-t") {
    const n = Math.max(1, num(given, "n", 3));
    return [2 * Math.PI * Math.sqrt(num(given, "m", 0.3) / (n * num(given, "k", 40)))];
  }
  if (kind === "freq-ratio") {
    const L1 = num(given, "L1", num(given, "L", 1));
    const L2 = num(given, "L2", 2 * num(given, "L", 1));
    return [Math.sqrt(L1 / L2)];
  }
  if (kind === "conical") {
    const L = num(given, "L", 1);
    const theta = rad(num(given, "theta", 30));
    const m = num(given, "m", 0.4);
    return [2 * Math.PI * Math.sqrt((L * Math.cos(theta)) / g), (m * g) / Math.cos(theta)];
  }
  if (kind === "horizontal-circle") {
    const m = num(given, "m", 0.4);
    const v = num(given, "v0", 2);
    const r = num(given, "r", 0.5);
    return [(m * v * v) / r];
  }
  if (kind === "vertical-circle") {
    return [Math.sqrt(5 * g * num(given, "r", 0.5))];
  }
  if (kind === "elastic") {
    const m1 = num(given, "m1", 6);
    const m2 = num(given, "m2", 2);
    const u1 = num(given, "v1", 4);
    const u2 = num(given, "v2", 0);
    const sum = m1 + m2;
    return [((m1 - m2) * u1 + 2 * m2 * u2) / sum, (2 * m1 * u1 + (m2 - m1) * u2) / sum];
  }
  if (kind === "stick") {
    const m1 = num(given, "m1", 6);
    const m2 = num(given, "m2", 2);
    return [(m1 * num(given, "v1", 4) + m2 * num(given, "v2", 0)) / (m1 + m2)];
  }
  if (kind === "ballistic") {
    const m = num(given, "m1", 0.02);
    const M = num(given, "m2", 0.5);
    const V = (m * num(given, "v1", 8)) / (m + M);
    const L = num(given, "L", 0.8);
    const cos = 1 - (V * V) / (2 * g * L);
    return [V, (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI];
  }
  if (kind === "roll") {
    const m = num(given, "m", 0.5);
    const h = num(given, "h", 0.5);
    const r = num(given, "r", 0.1);
    const H = num(given, "H", 0.75);
    const k = kappa(num(given, "shape", 0));
    const v = Math.sqrt((2 * g * h) / (1 + k));
    return [m * g * h, v, v / r, v * Math.sqrt((2 * H) / g)];
  }
  if (kind === "rocket") {
    const m = num(given, "m", 0.5);
    const K = num(given, "K", 9);
    const L = num(given, "L", 0.25);
    const burn = num(given, "tBurn", 6);
    const t = num(given, "t", burn);
    const vBurn = K * burn - (L * burn * burn * burn) / 3;
    const yBurn = (K * burn * burn) / 2 - (L * burn ** 4) / 12;
    const v = t <= burn ? K * t - (L * t * t * t) / 3 : vBurn - g * (t - burn);
    const y = t <= burn ? (K * t * t) / 2 - (L * t ** 4) / 12 : yBurn + vBurn * (t - burn) - 0.5 * g * (t - burn) ** 2;
    return [m * v, v, 0.5 * m * v * v, y];
  }
  if (kind === "drag") {
    const m = num(given, "m", 0.12);
    const b = num(given, "b", 0.35);
    return [num(given, "quad", 0) === 1 ? Math.sqrt((m * g) / b) : (m * g) / b];
  }
  if (kind === "rod") {
    const M = num(given, "M", 1.2);
    const L = num(given, "L", 0.8);
    if (num(given, "quad", 0) === 1) {
      return [(3 / 4) * L, (3 / 5) * M * L * L];
    }
    return [(2 / 3) * L, 0.5 * M * L * L];
  }
  if (kind === "turbine") {
    const M = num(given, "M", 1);
    const L = num(given, "L", 0.9);
    const n = num(given, "n", 3);
    const Icm = (M * L * L) / 18;
    const d = L / 3;
    return [d, n * (Icm + M * d * d)];
  }
  if (kind === "ang-drop") {
    const I1 = 0.5 * num(given, "M", 2) * num(given, "R", 0.35) ** 2;
    const I2 = I1 + num(given, "m", 0.4) * num(given, "r", 0.22) ** 2;
    return [(I1 * num(given, "w0", 6)) / I2];
  }
  if (kind === "rod-hit") {
    const M = num(given, "M", 1);
    const R = num(given, "R", 0.8);
    const m = num(given, "m", 0.2);
    const omega = Math.sqrt((3 * g) / R);
    return [omega, (M * R * omega) / (3 * m)];
  }
  if (kind === "torque") {
    const L = num(given, "L", 1);
    const M = num(given, "M", 0.2);
    const f = num(given, "f", 0.5);
    const m = num(given, "m", 0.16);
    const x = num(given, "x", 0.9);
    const dStick = L / 2 - f;
    const dHang = x - f;
    const tau = -M * g * dStick - m * g * dHang;
    const I = (M * L * L) / 12 + M * dStick * dStick + m * dHang * dHang;
    return [tau, tau / I];
  }
  if (kind === "fluid") {
    const H = num(given, "H", 0.8);
    const y = num(given, "y", 0.25);
    const v = Math.sqrt(2 * g * Math.max(0, H - y));
    const t = y > 0 ? Math.sqrt((2 * y) / g) : 0;
    return [v, v * t];
  }
  if (kind === "buoyancy") {
    const rho = num(given, "rho", 800);
    const rhoF = num(given, "rhoF", 1000);
    const side = num(given, "side", 0.1);
    const V = side * side * side;
    return [rhoF * V * g, g * (rhoF / rho - 1)];
  }
  if (kind === "boyle") {
    const V = num(given, "Vf", 50) * 1e-6;
    return [(num(given, "n", 0.004) * GAS_R * num(given, "T", 293)) / V];
  }
  if (kind === "thermal") {
    const area = num(given, "A", 4) * 1e-4;
    const length = num(given, "L", 20) / 100;
    return [(num(given, "k", 400) * area * (num(given, "Th", 373) - num(given, "Tc", 273))) / length];
  }
  if (kind === "coulomb") {
    const r = num(given, "r", 12) / 100;
    const Q = num(given, "Q", 2) * 1e-6;
    const q = num(given, "q", 1.5) * 1e-9;
    const E = (COULOMB_K * Math.abs(Q)) / (r * r);
    return [E, q * E * Math.sign(Q || 1)];
  }
  if (kind === "gauss") {
    const r = num(given, "r", 20) / 100;
    const R = num(given, "R", 10) / 100;
    const Q = num(given, "Q", 2) * 1e-6;
    const outside = r >= R;
    return [outside ? (COULOMB_K * Math.abs(Q)) / (r * r) : 0, outside ? Q / EPS_0 : 0];
  }
  if (kind === "gauss-slab") {
    return [(num(given, "rho", 1e-6) * num(given, "z", 0.01)) / EPS_0];
  }
  if (kind === "capacitor") {
    const A = num(given, "A", 200) * 1e-4;
    const d = num(given, "d", 2) * 1e-3;
    const kappa = num(given, "kappa", 1);
    const V = num(given, "V", 12);
    const C = (kappa * EPS_0 * A) / d;
    return [C, 0.5 * C * V * V];
  }
  if (kind === "coaxial") {
    const R1 = num(given, "R1", 0.01);
    const R2 = num(given, "R2", 0.03);
    const L = num(given, "L", 0.2);
    return [(2 * Math.PI * EPS_0 * L) / Math.log(R2 / R1)];
  }
  if (kind === "rc") {
    const R = num(given, "R", 2000);
    const C = num(given, "C", 100) * 1e-6;
    const emf = num(given, "emf", 10);
    const tau = R * C;
    return [tau, C * emf * (1 - Math.exp(-1))];
  }
  if (kind === "series") {
    const R1 = num(given, "R1", 10);
    const R2 = num(given, "R2", 20);
    const R3 = num(given, "R3", 30);
    const Req = R1 + R2 + R3;
    return [Req, num(given, "emf", 12) / Req];
  }
  if (kind === "parallel") {
    const R1 = num(given, "R1", 10);
    const R2 = num(given, "R2", 20);
    const R3 = num(given, "R3", 30);
    const Req = 1 / (1 / R1 + 1 / R2 + 1 / R3);
    return [Req, num(given, "emf", 12) / Req];
  }
  if (kind === "rl") {
    const R = num(given, "R", 12);
    const L = num(given, "L", 80) * 1e-3;
    const tau = L / R;
    return [tau, (num(given, "emf", 8) / R) * (1 - Math.exp(-1))];
  }
  if (kind === "solenoid") {
    const n = num(given, "N", 200) / (num(given, "L", 25) / 100);
    return [MU_0 * n * num(given, "I", 2)];
  }
  if (kind === "wire") {
    const r = num(given, "r", 5) / 100;
    return [(MU_0 * num(given, "I", 5)) / (2 * Math.PI * r)];
  }
  if (kind === "wire-pair") {
    const r = num(given, "r", 4) / 100;
    const B = (MU_0 * num(given, "I", 3)) / (2 * Math.PI * r);
    return [B * (1 + num(given, "align", 1))];
  }
  if (kind === "induction") {
    const emf = num(given, "B", 0.4) * num(given, "ell", 0.2) * num(given, "v", 2);
    return [emf, emf / num(given, "R", 0.5)];
  }
  if (kind === "emf-spin") {
    return [num(given, "B", 0.2) * num(given, "A", 0.05) * num(given, "w", 12)];
  }
  if (kind === "lens") {
    const f = num(given, "f", 0.2) * (num(given, "concave", 0) === 1 ? -1 : 1);
    const s = num(given, "s", 0.5);
    return [(s * f) / (s - f)];
  }
  if (kind === "slit") {
    const lambda = num(given, "lambda", 600) * 1e-9;
    const d = num(given, "d", 0.25) * 1e-3;
    return [(lambda * num(given, "screen", 1.2)) / d];
  }
  if (kind === "standing") {
    const v = Math.sqrt(num(given, "T", 40) / num(given, "mu", 0.01));
    const lambda = (2 * num(given, "L", 0.8)) / num(given, "n", 2);
    return [v, v / lambda];
  }
  if (kind === "tube") {
    return [num(given, "v", 340) / (2 * num(given, "f", 512))];
  }
  if (kind === "photon") {
    const f = SPEED_OF_LIGHT / (num(given, "lambda", 400) * 1e-9);
    const K = PLANCK_H * f - num(given, "phi", 2) * ELEM_CHARGE;
    return [Math.max(0, K), Math.max(0, K) / ELEM_CHARGE];
  }
  if (kind === "orbit") {
    const M = num(given, "M", 5.97e24);
    const m = num(given, "m", 500);
    const r = num(given, "r", 6.8e6);
    const v = Math.sqrt((GRAV * M) / r);
    return [(m * v * v) / r, v];
  }
  if (kind === "resistivity") {
    return [(num(given, "R", 12) * num(given, "A", 2e-6)) / num(given, "L", 0.4)];
  }
  if (kind === "power") {
    return [num(given, "m", 2) * (g * (num(given, "h", 1.5) / num(given, "t", 4)))];
  }
  if (kind === "cart-fit") {
    const xs = [1, 2, 3, 4, 5].map((i) => num(given, `f${i}`));
    const ys = [1, 2, 3, 4, 5].map((i) => num(given, `a${i}`));
    const fit = centeredSlope(xs, ys);
    const m = 1 / fit.slope;
    const friction = -fit.intercept * m;
    const a = fit.slope * num(given, "F", 0.45) + fit.intercept;
    const t = num(given, "t", 2);
    return [m, friction, a, (a * t) / (friction / m)];
  }
  if (kind === "impulse") {
    const F = num(given, "F", 8);
    const t = num(given, "t", 0.4);
    const m = num(given, "m", 1);
    return [F * t, (F / m) * t];
  }
  if (kind === "rot-spring") {
    return [Math.sqrt((num(given, "k", 40) * num(given, "dx", 0.05)) / (num(given, "m", 0.3) * num(given, "r", 0.4)))];
  }
  if (kind === "snell") {
    const n1 = num(given, "n1", 1);
    const n2 = num(given, "n2", 1.33);
    const sine = (n1 / n2) * Math.sin(rad(num(given, "theta", 40)));
    return [(Math.asin(sine) * 180) / Math.PI];
  }
  if (kind === "lorentz") {
    return [Math.abs(num(given, "q", 1e-6) * num(given, "v", 20) * num(given, "B", 0.4))];
  }
  if (kind === "boat") {
    return [num(given, "rho", 1000) * num(given, "V", 4) - num(given, "m", 800)];
  }
  if (kind === "gas-energy") {
    const n = num(given, "n", 2);
    const T = num(given, "T", 300);
    const V = num(given, "V", 0.02);
    return [(n * GAS_R * T) / V, 1.5 * n * GAS_R * num(given, "dT", 100)];
  }
  throw new Error(`missing independent expression for ${kind}`);
}
