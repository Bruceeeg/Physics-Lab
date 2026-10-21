import { omegaAfter, rodImpactSpeed, sphereSpeedAfterRod } from "../models/angular-momentum.ts";
import { acceleration as atwoodA, tension as atwoodT } from "../models/atwood-machine.ts";
import { GAS_R, gasPressure, volumeSi } from "../models/boyles-law.ts";
import { capacitance } from "../models/capacitance.ts";
import {
  equilibriumPeriod,
  loopSpeed,
  tension as circleTension,
  type CircularParams,
} from "../models/circular-motion.ts";
import { launchSpeed } from "../models/conservation-of-energy.ts";
import { terminalSpeed } from "../models/drag-force.ts";
import { EPS_0, sampleAt as fieldAt } from "../models/electric-field.ts";
import { sampleAt as inductionAt } from "../models/electromagnetic-induction.ts";
import { exitSpeed, range as jetRange } from "../models/fluid-dynamics.ts";
import { imageDistance } from "../models/geometric-optics.ts";
import { period as shmPeriod, type HarmonicParams } from "../models/harmonic-motion.ts";
import { postVelocities, ballisticMaxAngle, ballisticVelocityAfter } from "../models/impulse-momentum.ts";
import { acceleration as inclineA, speedAtBottom as inclineV, stuck } from "../models/incline-friction.ts";
import { positionAt, velocityAt } from "../models/linear-motion.ts";
import { minLoopHeight, speedFromHeight } from "../models/loop-track.ts";
import { sampleAt as magnetAt } from "../models/magnetism.ts";
import { centerOfMass, endInertia } from "../models/nonuniform-rod.ts";
import { sampleAt as photonAt } from "../models/particle-model-of-light.ts";
import { apexHeight, flightTime, range as projectileRange } from "../models/projectile.ts";
import { derive, type PullParams, type PullState } from "../models/pull-friction.ts";
import { timeConstant, sampleAt as rcAt } from "../models/rc-circuits.ts";
import { sampleAt as resistorAt } from "../models/resistor-circuits.ts";
import { rlTau, sampleAt as rlAt } from "../models/rl-circuits.ts";
import { kappa, launchRange, speedAtBottom as rollV, type RollingShape } from "../models/rotational-motion.ts";
import { angularAccel, netTorque } from "../models/torque-equilibrium.ts";
import { heatCurrent } from "../models/thermal-conductivity.ts";
import { mass as archMass, volume as archVolume } from "../models/archimedes.ts";
import { rocketHeight, rocketVelocity, workFromA, DEFAULT_VARIABLE_FORCE } from "../models/variable-force.ts";
import { sampleAt as waveAt } from "../models/waves-optics.ts";
import type { Answer, Givens, Kind, Problem } from "./types.ts";

const GRAV = 6.6743e-11;

function num(given: Givens, key: string, fallback = 0) {
  const value = given[key];
  return value === undefined ? fallback : value;
}

function shapeOf(code: number): RollingShape {
  if (code === 1) return "hoop";
  if (code === 2) return "solid-sphere";
  if (code === 3) return "hollow-sphere";
  return "disk";
}

function harmonic(given: Givens): HarmonicParams {
  return {
    L: num(given, "L", 1),
    m: num(given, "m", 0.3),
    theta0Deg: num(given, "theta", 12),
    g: num(given, "g", 9.8),
    k: num(given, "k", 40),
    A: num(given, "A", 0.1),
    pivotFrac: num(given, "pivot", 0),
    kappaT: num(given, "kappa", 0.45),
    springCount: Math.max(1, num(given, "n", 3)),
  };
}

function circle(given: Givens): CircularParams {
  return {
    L: num(given, "L", 1),
    thetaDeg: num(given, "theta", 30),
    m: num(given, "m", 0.4),
    g: num(given, "g", 9.8),
    r: num(given, "r", 0.5),
    v0: num(given, "v0", 2),
  };
}

function restPull(vx = 0): PullState {
  return { t: 0, x: 0, z: 0, vx, vz: 0 };
}

function pull(given: Givens, vx = 0): PullParams {
  return {
    F: num(given, "F"),
    thetaDeg: num(given, "theta"),
    m: num(given, "m", 1),
    muS: num(given, "muS", num(given, "mu")),
    muK: num(given, "muK", num(given, "mu")),
    g: num(given, "g", 9.8),
  };
}

function regress(xs: number[], ys: number[]) {
  const n = xs.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i += 1) {
    const x = xs[i] ?? 0;
    const y = ys[i] ?? 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function bisect(lo: number, hi: number, below: (mid: number) => boolean) {
  let left = lo;
  let right = hi;
  for (let i = 0; i < 60; i += 1) {
    const mid = 0.5 * (left + right);
    if (below(mid)) {
      left = mid;
    } else {
      right = mid;
    }
  }
  return 0.5 * (left + right);
}

function answers(rows: Answer[]): Answer[] {
  return rows;
}

export function solve(problem: Problem): Answer[] {
  return solveKind(problem.kind, problem.givens);
}

export function solveKind(kind: Kind, given: Givens): Answer[] {
  const g = num(given, "g", 9.8);
  if (kind === "atwood") {
    const params = { m1: num(given, "m1", 1), m2: num(given, "m2", 2), g, travel: 1 };
    return answers([
      { label: "acceleration", unit: "m/s²", value: atwoodA(params) },
      { label: "tension", unit: "N", value: atwoodT(params) },
    ]);
  }
  if (kind === "atwood-incline") {
    const params = {
      m1: num(given, "m1", 2),
      m2: num(given, "m2", 3),
      g,
      travel: 1,
      thetaDeg: num(given, "theta", 30),
    };
    return answers([{ label: "acceleration", unit: "m/s²", value: atwoodA(params, "incline") }]);
  }
  if (kind === "atwood-table") {
    const params = {
      m1: num(given, "m1", 2),
      m2: num(given, "m2", 1),
      g,
      travel: 1,
      mu: num(given, "mu", 0.2),
      muS: num(given, "mu", 0.2),
    };
    return answers([{ label: "acceleration", unit: "m/s²", value: atwoodA(params, "modified") }]);
  }
  if (kind === "atwood-pulley") {
    const params = {
      m1: num(given, "m1", 1),
      m2: num(given, "m2", 1.4),
      g,
      travel: 1,
      Mp: num(given, "Mp", 0.4),
      Rp: num(given, "Rp", 0.12),
    };
    return answers([{ label: "acceleration", unit: "m/s²", value: atwoodA(params, "pulley") }]);
  }
  if (kind === "three-mass") {
    const m = num(given, "m", 1);
    const M = num(given, "M", 2);
    const theta = (num(given, "theta", 30) * Math.PI) / 180;
    const net = M * g - 3 * m * g * Math.sin(theta);
    return answers([{ label: "acceleration", unit: "m/s²", value: net / (M + 3 * m) }]);
  }
  if (kind === "spring-speed") {
    const params = { k: num(given, "k", 200), A: num(given, "A", 0.1), m: num(given, "m", 0.5), thetaDeg: 0, g };
    return answers([{ label: "speed", unit: "m/s", value: launchSpeed(params) }]);
  }
  if (kind === "spring-stick") {
    const m1 = num(given, "m1", 1);
    const m2 = num(given, "m2", 3);
    const launched = launchSpeed({ k: num(given, "k", 100), A: num(given, "A", 0.2), m: m1, thetaDeg: 0, g });
    const mu = num(given, "mu", 0);
    const D = num(given, "D", 0);
    const after = Math.sqrt(Math.max(0, launched * launched - 2 * mu * g * D));
    const stuckSpeed = postVelocities({ m1, v1: after, m2, v2: 0, e: 0 }).v1f;
    return answers([
      { label: "speed before collision", unit: "m/s", value: after },
      { label: "common speed", unit: "m/s", value: stuckSpeed },
    ]);
  }
  if (kind === "spring-k") {
    const m = num(given, "m", 0.2);
    const x = num(given, "x", 0.05);
    const k = (m * g) / x;
    const T = shmPeriod({ ...harmonic(given), m, k }, "spring");
    return answers([
      { label: "spring constant", unit: "N/m", value: k },
      { label: "period", unit: "s", value: T },
    ]);
  }
  if (kind === "spring-work") {
    const M = num(given, "M", 0.2);
    const v0 = num(given, "v0", 3);
    const B = num(given, "B", 80);
    const moving = 3 * M;
    const resting = 2 * M;
    const v = postVelocities({ m1: moving, v1: v0, m2: resting, v2: 0, e: 0 }).v1f;
    const ke = 0.5 * (moving + resting) * v * v;
    const D = bisect(1e-4, 5, (mid) => workFromA({ ...DEFAULT_VARIABLE_FORCE, c: B, n: 3, A: mid }, 0) < ke);
    return answers([
      { label: "speed after collision", unit: "m/s", value: v },
      { label: "maximum compression", unit: "m", value: D },
    ]);
  }
  if (kind === "projectile") {
    const params = {
      v0: num(given, "v0", 12),
      thetaDeg: num(given, "theta", 30),
      h: num(given, "h", 0),
      g,
    };
    return answers([
      { label: "range", unit: "m", value: projectileRange(params) },
      { label: "maximum height", unit: "m", value: apexHeight(params) },
    ]);
  }
  if (kind === "table-launch") {
    const params = { v0: num(given, "v0", 3), thetaDeg: 0, h: num(given, "h", 0.8), g };
    return answers([
      { label: "time of flight", unit: "s", value: flightTime(params) },
      { label: "horizontal distance", unit: "m", value: projectileRange(params) },
    ]);
  }
  if (kind === "kinematic") {
    const t = num(given, "t", 2);
    return answers([
      { label: "displacement", unit: "m", value: positionAt(num(given, "x0"), num(given, "v0"), num(given, "a"), t) },
      { label: "velocity", unit: "m/s", value: velocityAt(num(given, "v0"), num(given, "a"), t) },
    ]);
  }
  if (kind === "incline") {
    const params = {
      m: num(given, "m", 0.8),
      thetaDeg: num(given, "theta", 30),
      muS: num(given, "muS", 0.1),
      muK: num(given, "muK", 0.1),
      g,
      travel: num(given, "L", 1),
      plane: num(given, "plane", 2),
    };
    return answers([
      { label: "acceleration", unit: "m/s²", value: inclineA(params) },
      { label: "speed at the bottom", unit: "m/s", value: inclineV(params) },
    ]);
  }
  if (kind === "mu-angle") {
    const theta = num(given, "theta", 25);
    const mu = bisect(0, 8, (mid) => {
      return !stuck({
        m: 1,
        thetaDeg: theta,
        muS: mid,
        muK: mid,
        g,
        travel: 1,
        plane: 1,
      });
    });
    return answers([{ label: "coefficient of static friction", unit: "", value: mu }]);
  }
  if (kind === "pull") {
    const derived = derive(pull(given), restPull(0));
    return answers([
      { label: "horizontal acceleration", unit: "m/s²", value: derived.ax },
      { label: "normal force", unit: "N", value: derived.forces.N },
    ]);
  }
  if (kind === "friction-stop") {
    const v0 = num(given, "v0", 4);
    const D = num(given, "D", 1);
    const derived = derive(pull({ ...given, F: 0, theta: 0 }), restPull(v0));
    const v = Math.sqrt(Math.max(0, v0 * v0 + 2 * derived.ax * D));
    return answers([
      { label: "acceleration", unit: "m/s²", value: derived.ax },
      { label: "final speed", unit: "m/s", value: v },
    ]);
  }
  if (kind === "loop") {
    const roll = num(given, "roll", 0) === 1;
    const params = {
      m: num(given, "m", 0.4),
      R: num(given, "R", 0.4),
      h: num(given, "h", 1.2),
      g,
      shape: shapeOf(num(given, "shape", 0)),
    };
    const mode = roll ? "roll" : "slide";
    return answers([
      { label: "minimum release height", unit: "m", value: minLoopHeight(params, mode) },
      { label: "speed at the top", unit: "m/s", value: speedFromHeight(params, 2 * params.R, mode) },
    ]);
  }
  if (kind === "spring-t") {
    return answers([{ label: "period", unit: "s", value: shmPeriod(harmonic(given), "spring") }]);
  }
  if (kind === "pendulum-t") {
    return answers([{ label: "period", unit: "s", value: shmPeriod(harmonic(given), "pendulum") }]);
  }
  if (kind === "physical-t") {
    return answers([{ label: "period", unit: "s", value: shmPeriod(harmonic(given), "physical") }]);
  }
  if (kind === "torsion-t") {
    return answers([{ label: "period", unit: "s", value: shmPeriod(harmonic(given), "torsion") }]);
  }
  if (kind === "parallel-t") {
    return answers([{ label: "period", unit: "s", value: shmPeriod(harmonic(given), "parallel") }]);
  }
  if (kind === "freq-ratio") {
    const base = harmonic(given);
    const t1 = shmPeriod({ ...base, L: num(given, "L1", base.L) }, "pendulum");
    const t2 = shmPeriod({ ...base, L: num(given, "L2", 2 * base.L) }, "pendulum");
    return answers([{ label: "frequency ratio", unit: "", value: t1 / t2 }]);
  }
  if (kind === "conical") {
    const params = circle(given);
    return answers([
      { label: "period", unit: "s", value: equilibriumPeriod(params) },
      { label: "tension", unit: "N", value: circleTension(params, "conical") },
    ]);
  }
  if (kind === "horizontal-circle") {
    return answers([{ label: "tension", unit: "N", value: circleTension(circle(given), "horizontal") }]);
  }
  if (kind === "vertical-circle") {
    return answers([{ label: "minimum speed at the bottom", unit: "m/s", value: loopSpeed(circle(given)) }]);
  }
  if (kind === "elastic" || kind === "stick") {
    const params = {
      m1: num(given, "m1", 6),
      v1: num(given, "v1", 4),
      m2: num(given, "m2", 2),
      v2: num(given, "v2", 0),
      e: kind === "elastic" ? 1 : 0,
    };
    const speeds = postVelocities(params);
    if (kind === "stick") {
      return answers([{ label: "common velocity", unit: "m/s", value: speeds.v1f }]);
    }
    return answers([
      { label: "velocity of object 1", unit: "m/s", value: speeds.v1f },
      { label: "velocity of object 2", unit: "m/s", value: speeds.v2f },
    ]);
  }
  if (kind === "ballistic") {
    const params = {
      m1: num(given, "m1", 0.02),
      v1: num(given, "v1", 8),
      m2: num(given, "m2", 0.5),
      v2: 0,
      e: 0,
      L: num(given, "L", 0.8),
      g,
    };
    return answers([
      { label: "speed after collision", unit: "m/s", value: ballisticVelocityAfter(params) },
      { label: "maximum angle", unit: "°", value: (ballisticMaxAngle(params) * 180) / Math.PI },
    ]);
  }
  if (kind === "roll") {
    const shape = shapeOf(num(given, "shape", 0));
    const params = {
      shape,
      m: num(given, "m", 0.5),
      r: num(given, "r", 0.1),
      h: num(given, "h", 0.5),
      thetaDeg: num(given, "theta", 30),
      g,
      contact: "launch" as const,
      tableH: num(given, "H", 0.75),
    };
    const v = rollV(params);
    const k = kappa(shape);
    return answers([
      { label: "total kinetic energy", unit: "J", value: 0.5 * (1 + k) * params.m * v * v },
      { label: "speed", unit: "m/s", value: v },
      { label: "angular speed", unit: "rad/s", value: params.r > 0 ? v / params.r : 0 },
      { label: "horizontal distance", unit: "m", value: launchRange(params) },
    ]);
  }
  if (kind === "rocket") {
    const params = {
      ...DEFAULT_VARIABLE_FORCE,
      m: num(given, "m", 0.5),
      g,
      K: num(given, "K", 9),
      Lcoeff: num(given, "L", 0.25),
      tBurn: num(given, "tBurn", 6),
    };
    const t = num(given, "t", params.tBurn);
    const v = rocketVelocity(params, t);
    const y = rocketHeight(params, t);
    return answers([
      { label: "impulse", unit: "N·s", value: params.m * v },
      { label: "speed", unit: "m/s", value: v },
      { label: "kinetic energy", unit: "J", value: 0.5 * params.m * v * v },
      { label: "height", unit: "m", value: y },
    ]);
  }
  if (kind === "drag") {
    const params = { m: num(given, "m", 0.12), g, b: num(given, "b", 0.35) };
    const mode = num(given, "quad", 0) === 1 ? "quadratic" : "linear";
    return answers([{ label: "terminal speed", unit: "m/s", value: terminalSpeed(params, mode) }]);
  }
  if (kind === "rod") {
    const params = {
      M: num(given, "M", 1.2),
      L: num(given, "L", 0.8),
      g,
      theta0Deg: 10,
      bladeCount: 1,
    };
    const mode = num(given, "quad", 0) === 1 ? "quadratic" : "linear";
    return answers([
      { label: "center of mass", unit: "m", value: centerOfMass(params, mode) },
      { label: "rotational inertia about the end", unit: "kg·m²", value: endInertia(params, mode) },
    ]);
  }
  if (kind === "turbine") {
    const params = {
      M: num(given, "M", 1),
      L: num(given, "L", 0.9),
      g,
      theta0Deg: 10,
      bladeCount: num(given, "n", 3),
    };
    return answers([
      { label: "center of mass", unit: "m", value: centerOfMass(params, "turbine") },
      { label: "rotational inertia", unit: "kg·m²", value: endInertia(params, "turbine") },
    ]);
  }
  if (kind === "ang-drop") {
    const params = {
      M: num(given, "M", 2),
      R: num(given, "R", 0.35),
      omega0: num(given, "w0", 6),
      m: num(given, "m", 0.4),
      r: num(given, "r", 0.22),
      h: 0.4,
      g,
    };
    return answers([{ label: "angular speed after the collision", unit: "rad/s", value: omegaAfter(params) }]);
  }
  if (kind === "rod-hit") {
    const params = {
      M: num(given, "M", 1),
      R: num(given, "R", 0.8),
      omega0: 0,
      m: num(given, "m", 0.2),
      r: 0,
      h: 0,
      g,
    };
    return answers([
      { label: "angular speed of the rod", unit: "rad/s", value: rodImpactSpeed(params) },
      { label: "speed of the sphere", unit: "m/s", value: sphereSpeedAfterRod(params) },
    ]);
  }
  if (kind === "torque") {
    const params = {
      L: num(given, "L", 1),
      M: num(given, "M", 0.2),
      f: num(given, "f", 0.5),
      m: num(given, "m", 0.16),
      x: num(given, "x", 0.9),
      g,
    };
    return answers([
      { label: "net torque", unit: "N·m", value: netTorque(params) },
      { label: "angular acceleration", unit: "rad/s²", value: angularAccel(params) },
    ]);
  }
  if (kind === "fluid") {
    const params = { H: num(given, "H", 0.8), holeY: num(given, "y", 0.25), g };
    return answers([
      { label: "efflux speed", unit: "m/s", value: exitSpeed(params) },
      { label: "range", unit: "m", value: jetRange(params) },
    ]);
  }
  if (kind === "buoyancy") {
    const params = {
      rhoObj: num(given, "rho", 800),
      rhoFluid: num(given, "rhoF", 1000),
      side: num(given, "side", 0.1),
      g,
    };
    const V = archVolume(params);
    const m = archMass(params);
    const Fb = params.rhoFluid * V * g;
    return answers([
      { label: "buoyant force", unit: "N", value: Fb },
      { label: "initial acceleration", unit: "m/s²", value: m > 0 ? (Fb - m * g) / m : 0 },
    ]);
  }
  if (kind === "boyle") {
    const params = {
      n: num(given, "n", 0.004),
      T: num(given, "T", 293),
      V0_cm3: num(given, "V0", 100),
      Vf_cm3: num(given, "Vf", 50),
    };
    return answers([
      { label: "final pressure", unit: "Pa", value: gasPressure(params, volumeSi(params.Vf_cm3)) },
    ]);
  }
  if (kind === "thermal") {
    const params = {
      k: num(given, "k", 400),
      k2: 80,
      A_cm2: num(given, "A", 4),
      L_cm: num(given, "L", 20),
      Th: num(given, "Th", 373),
      Tc: num(given, "Tc", 273),
    };
    return answers([{ label: "rate of energy transfer", unit: "W", value: heatCurrent(params) }]);
  }
  if (kind === "coulomb") {
    const r = num(given, "r", 12);
    const sample = fieldAt(
      { Q_uC: num(given, "Q", 2), q_nC: num(given, "q", 1.5), r0_cm: r, r1_cm: r, d_cm: 8 },
      0,
      "point",
    );
    return answers([
      { label: "electric field", unit: "N/C", value: sample.E },
      { label: "electric force", unit: "N", value: sample.F },
    ]);
  }
  if (kind === "gauss") {
    const R = num(given, "R", 10);
    const r = num(given, "r", 20);
    const sample = fieldAt(
      { Q_uC: num(given, "Q", 2), q_nC: 1, r0_cm: r, r1_cm: r, d_cm: 8, R_cm: R },
      0,
      "gauss",
    );
    return answers([
      { label: "electric field", unit: "N/C", value: sample.E },
      { label: "electric flux", unit: "N·m²/C", value: sample.flux },
    ]);
  }
  if (kind === "gauss-slab") {
    const rho = num(given, "rho", 1e-6);
    const z = num(given, "z", 0.01);
    const area = num(given, "A", 0.02);
    const Qenc = rho * area * 2 * z;
    const flux = Qenc / EPS_0;
    return answers([{ label: "electric field", unit: "N/C", value: flux / (2 * area) }]);
  }
  if (kind === "capacitor") {
    const A = num(given, "A", 200) * 1e-4;
    const d = num(given, "d", 2) * 1e-3;
    const kappa = num(given, "kappa", 1);
    const V = num(given, "V", 12);
    const C = capacitance(A, d, kappa);
    return answers([
      { label: "capacitance", unit: "F", value: C },
      { label: "energy stored", unit: "J", value: 0.5 * C * V * V },
    ]);
  }
  if (kind === "coaxial") {
    const R1 = num(given, "R1", 0.01);
    const R2 = num(given, "R2", 0.03);
    const L = num(given, "L", 0.2);
    const steps = 4000;
    const dr = (R2 - R1) / steps;
    let integral = 0;
    for (let i = 0; i < steps; i += 1) {
      integral += dr / (R1 + (i + 0.5) * dr);
    }
    return answers([{ label: "capacitance", unit: "F", value: (2 * Math.PI * EPS_0 * L) / integral }]);
  }
  if (kind === "rc") {
    const params = { R: num(given, "R", 2000), C_uF: num(given, "C", 100), emf: num(given, "emf", 10) };
    const tau = timeConstant(params);
    const sample = rcAt(params, tau, "charge");
    return answers([
      { label: "time constant", unit: "s", value: tau },
      { label: "charge at t = τ", unit: "C", value: sample.Q },
    ]);
  }
  if (kind === "series" || kind === "parallel") {
    const params = {
      emf: num(given, "emf", 12),
      R1: num(given, "R1", 10),
      R2: num(given, "R2", 20),
      R3: num(given, "R3", 30),
    };
    const sample = resistorAt(params, 0, kind === "parallel" ? "parallel" : "series");
    return answers([
      { label: "equivalent resistance", unit: "Ω", value: sample.Req },
      { label: "current", unit: "A", value: sample.I },
    ]);
  }
  if (kind === "rl") {
    const params = {
      R: num(given, "R", 12),
      L_mH: num(given, "L", 80),
      C_uF: 100,
      emf: num(given, "emf", 8),
    };
    const tau = rlTau(params);
    return answers([
      { label: "time constant", unit: "s", value: tau },
      { label: "current at t = τ", unit: "A", value: rlAt(params, tau, "grow").I },
    ]);
  }
  if (kind === "solenoid") {
    const sample = magnetAt(
      {
        I: num(given, "I", 2),
        r0_cm: 3,
        r1_cm: 3,
        m: 1,
        turns: num(given, "N", 200),
        length_cm: num(given, "L", 25),
      },
      0,
      "solenoid",
    );
    return answers([{ label: "magnetic field", unit: "T", value: sample.B }]);
  }
  if (kind === "wire") {
    const r = num(given, "r", 5);
    const sample = magnetAt({ I: num(given, "I", 5), r0_cm: r, r1_cm: r, m: 1 }, 0, "wire");
    return answers([{ label: "magnetic field", unit: "T", value: sample.B }]);
  }
  if (kind === "wire-pair") {
    const r = num(given, "r", 4);
    const sample = magnetAt({ I: num(given, "I", 3), r0_cm: r, r1_cm: r, m: 1 }, 0, "wire");
    const align = num(given, "align", 1);
    return answers([{ label: "magnetic field at the midpoint", unit: "T", value: sample.B * (1 + align) }]);
  }
  if (kind === "induction") {
    const sample = inductionAt(
      {
        N: 1,
        A: 0.01,
        Bpeak: 0.1,
        w: 0.05,
        z0: 0.2,
        v: num(given, "v", 2),
        B: num(given, "B", 0.4),
        ell: num(given, "ell", 0.2),
        R: num(given, "R", 0.5),
      },
      0,
      "rail",
    );
    return answers([
      { label: "induced emf", unit: "V", value: sample.emf },
      { label: "current", unit: "A", value: sample.I },
    ]);
  }
  if (kind === "emf-spin") {
    const B = num(given, "B", 0.2);
    const A = num(given, "A", 0.05);
    const omega = num(given, "w", 12);
    const dt = 1e-5;
    const period = (2 * Math.PI) / omega;
    let peak = 0;
    for (let t = 0; t < period; t += dt) {
      const flux1 = B * A * Math.cos(omega * t);
      const flux2 = B * A * Math.cos(omega * (t + dt));
      peak = Math.max(peak, Math.abs((flux2 - flux1) / dt));
    }
    return answers([{ label: "maximum emf", unit: "V", value: peak }]);
  }
  if (kind === "lens") {
    const f = num(given, "f", 0.2) * (num(given, "concave", 0) === 1 ? -1 : 1);
    const s = num(given, "s", 0.5);
    return answers([{ label: "image distance", unit: "m", value: imageDistance(f, s) }]);
  }
  if (kind === "slit") {
    const sample = waveAt(
      {
        L: 1,
        n: 1,
        tension: 10,
        mu: 0.01,
        A: 0.01,
        lambda_nm: num(given, "lambda", 600),
        d_mm: num(given, "d", 0.25),
        screen_m: num(given, "screen", 1.2),
      },
      0,
      "doubleslit",
    );
    return answers([{ label: "fringe spacing", unit: "m", value: sample.deltaY }]);
  }
  if (kind === "standing") {
    const sample = waveAt(
      {
        L: num(given, "L", 0.8),
        n: num(given, "n", 2),
        tension: num(given, "T", 40),
        mu: num(given, "mu", 0.01),
        A: 0.02,
        lambda_nm: 600,
        d_mm: 0.25,
        screen_m: 1,
      },
      0,
      "standing",
    );
    return answers([
      { label: "wave speed", unit: "m/s", value: sample.v },
      { label: "frequency", unit: "Hz", value: sample.f },
    ]);
  }
  if (kind === "tube") {
    const v = num(given, "v", 340);
    const f = num(given, "f", 512);
    const L = bisect(0.05, 4, (mid) => {
      const sample = waveAt(
        {
          L: mid,
          n: 1,
          tension: v * v * 0.01,
          mu: 0.01,
          A: 0.01,
          lambda_nm: 600,
          d_mm: 0.2,
          screen_m: 1,
        },
        0,
        "standing",
      );
      return sample.f > f;
    });
    return answers([{ label: "length", unit: "m", value: L }]);
  }
  if (kind === "photon") {
    const sample = photonAt(
      {
        lambda_nm: num(given, "lambda", 400),
        V: 3,
        phi_eV: num(given, "phi", 2),
        Vstop: 0,
      },
      0,
      "photoelectric",
    );
    return answers([
      { label: "maximum kinetic energy", unit: "J", value: sample.Kmax },
      { label: "stopping potential", unit: "V", value: sample.VstopPred },
    ]);
  }
  if (kind === "orbit") {
    const M = num(given, "M", 5.97e24);
    const m = num(given, "m", 500);
    const r = num(given, "r", 6.8e6);
    const F = (GRAV * M * m) / (r * r);
    const v0 = Math.sqrt((F * r) / m);
    const labF = circleTension({ L: 1, thetaDeg: 20, m, g, r, v0 }, "horizontal");
    return answers([
      { label: "gravitational force", unit: "N", value: F },
      { label: "orbital speed", unit: "m/s", value: Math.sqrt((labF * r) / m) },
    ]);
  }
  if (kind === "resistivity") {
    const R = num(given, "R", 12);
    const A = num(given, "A", 2e-6);
    const L = num(given, "L", 0.4);
    return answers([{ label: "resistivity", unit: "Ω·m", value: (R * A) / L }]);
  }
  if (kind === "power") {
    const m = num(given, "m", 2);
    const h = num(given, "h", 1.5);
    const t = num(given, "t", 4);
    return answers([{ label: "average power", unit: "W", value: (m * g * h) / t }]);
  }
  if (kind === "cart-fit") {
    const xs = [1, 2, 3, 4, 5].map((i) => num(given, `f${i}`));
    const ys = [1, 2, 3, 4, 5].map((i) => num(given, `a${i}`));
    const fit = regress(xs, ys);
    const m = 1 / fit.slope;
    const friction = -fit.intercept * m;
    const F = num(given, "F", 0.45);
    const mu = friction / (m * g);
    const derived = derive({ F, thetaDeg: 0, m, muS: mu, muK: mu, g }, restPull(0));
    const speed = derived.ax * num(given, "t", 2);
    return answers([
      { label: "mass", unit: "kg", value: m },
      { label: "frictional force", unit: "N", value: friction },
      { label: "acceleration", unit: "m/s²", value: derived.ax },
      { label: "time to stop", unit: "s", value: speed / (friction / m) },
    ]);
  }
  if (kind === "impulse") {
    const derived = derive(pull({ ...given, theta: 0, mu: 0, muS: 0, muK: 0 }), restPull(0));
    const t = num(given, "t", 0.4);
    return answers([
      { label: "impulse", unit: "N·s", value: num(given, "F", 8) * t },
      { label: "final velocity", unit: "m/s", value: derived.ax * t },
    ]);
  }
  if (kind === "rot-spring") {
    const k = num(given, "k", 40);
    const dx = num(given, "dx", 0.05);
    const m = num(given, "m", 0.3);
    const r = num(given, "r", 0.4);
    const omega = bisect(0, 80, (mid) => m * mid * mid * r < k * dx);
    return answers([{ label: "angular speed", unit: "rad/s", value: omega }]);
  }
  if (kind === "snell") {
    const n1 = num(given, "n1", 1);
    const n2 = num(given, "n2", 1.33);
    const theta = (num(given, "theta", 40) * Math.PI) / 180;
    const target = n1 * Math.sin(theta);
    const theta2 = bisect(0, Math.PI / 2 - 1e-6, (mid) => n2 * Math.sin(mid) < target);
    return answers([{ label: "angle of refraction", unit: "°", value: (theta2 * 180) / Math.PI }]);
  }
  if (kind === "lorentz") {
    return answers([{ label: "magnetic force", unit: "N", value: Math.abs(num(given, "q", 1e-6) * num(given, "v", 20) * num(given, "B", 0.4)) }]);
  }
  if (kind === "boat") {
    const cargo = num(given, "rho", 1000) * num(given, "V", 4) - num(given, "m", 800);
    return answers([{ label: "maximum additional mass", unit: "kg", value: cargo }]);
  }
  if (kind === "gas-energy") {
    const n = num(given, "n", 2);
    const T = num(given, "T", 300);
    const V = num(given, "V", 0.02);
    const dT = num(given, "dT", 100);
    const P = gasPressure({ n, T, V0_cm3: V * 1e6, Vf_cm3: V * 1e6 }, V);
    return answers([
      { label: "pressure", unit: "Pa", value: P },
      { label: "change in internal energy", unit: "J", value: 1.5 * n * GAS_R * dT },
    ]);
  }
  return answers([{ label: "not implemented", unit: "", value: Number.NaN }]);
}
