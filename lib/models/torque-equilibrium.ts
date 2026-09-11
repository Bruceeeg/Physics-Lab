export type TorqueParams = {
  L: number;
  M: number;
  f: number;
  m: number;
  x: number;
  g: number;
};

export type TorqueSample = {
  t: number;
  theta: number;
  omega: number;
  alpha: number;
  tau: number;
  I: number;
  tauStick: number;
  tauHang: number;
  balanced: boolean;
  tipped: boolean;
};

export const THETA_MAX = 0.35;

export const DEFAULT_TORQUE: TorqueParams = {
  L: 1,
  M: 0.2,
  f: 0.7,
  m: 0.16,
  x: 0.95,
  g: 9.81,
};

export function leverStick(params: TorqueParams) {
  return params.L / 2 - params.f;
}

export function leverHang(params: TorqueParams) {
  return params.x - params.f;
}

export function stickTorque(params: TorqueParams) {
  return -params.M * params.g * leverStick(params);
}

export function hangTorque(params: TorqueParams) {
  return -params.m * params.g * leverHang(params);
}

export function netTorque(params: TorqueParams) {
  return stickTorque(params) + hangTorque(params);
}

export function inertiaAboutFulcrum(params: TorqueParams) {
  const dStick = leverStick(params);
  const dHang = leverHang(params);
  return (
    (params.M * params.L * params.L) / 12 +
    params.M * dStick * dStick +
    params.m * dHang * dHang
  );
}

export function angularAccel(params: TorqueParams) {
  const I = inertiaAboutFulcrum(params);
  if (I <= 1e-12) {
    return 0;
  }
  return netTorque(params) / I;
}

export function timeToTip(params: TorqueParams) {
  const alpha = angularAccel(params);
  if (Math.abs(alpha) < 1e-9) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.sqrt((2 * THETA_MAX) / Math.abs(alpha));
}

export function sampleAt(params: TorqueParams, t: number): TorqueSample {
  const tau = netTorque(params);
  const I = inertiaAboutFulcrum(params);
  const alpha = angularAccel(params);
  const balanced = Math.abs(tau) < 1e-6;
  if (balanced) {
    return {
      t: Math.max(0, t),
      theta: 0,
      omega: 0,
      alpha: 0,
      tau,
      I,
      tauStick: stickTorque(params),
      tauHang: hangTorque(params),
      balanced: true,
      tipped: false,
    };
  }
  const limit = timeToTip(params);
  const tc = Math.min(Math.max(0, t), limit);
  const theta = 0.5 * alpha * tc * tc;
  const omega = alpha * tc;
  const tipped = tc >= limit - 1e-9;
  return {
    t: Math.max(0, t),
    theta,
    omega: tipped ? 0 : omega,
    alpha,
    tau,
    I,
    tauStick: stickTorque(params),
    tauHang: hangTorque(params),
    balanced: false,
    tipped,
  };
}
