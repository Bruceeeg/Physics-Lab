export type PendulumParams = {
  L: number;
  thetaDeg: number;
  m: number;
  g: number;
  r: number;
  v0: number;
};

export type VerticalDetachment = {
  t: number;
  phi: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  tension: number;
};

export type VerticalRopeState = {
  phase: "constrained" | "projectile";
  phi: number;
  omega: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  tension: number;
  detachment: VerticalDetachment | null;
};

export type SphericalPendulumState = {
  theta: number;
  thetaVelocity: number;
  phi: number;
  phiVelocity: number;
};

type VerticalState = { phi: number; omega: number };

const STEP = 0.002;
const EVENT_ITERATIONS = 20;

function verticalAcceleration(phi: number, params: PendulumParams) {
  return -(params.g / Math.max(params.r, 1e-9)) * Math.sin(phi);
}

function stepVertical(
  state: VerticalState,
  dt: number,
  params: PendulumParams,
): VerticalState {
  const a1 = verticalAcceleration(state.phi, params);
  const phi2 = state.phi + state.omega * (dt / 2);
  const omega2 = state.omega + a1 * (dt / 2);
  const a2 = verticalAcceleration(phi2, params);
  const phi3 = state.phi + omega2 * (dt / 2);
  const omega3 = state.omega + a2 * (dt / 2);
  const a3 = verticalAcceleration(phi3, params);
  const phi4 = state.phi + omega3 * dt;
  const omega4 = state.omega + a3 * dt;
  const a4 = verticalAcceleration(phi4, params);
  return {
    phi: state.phi + (dt / 6) * (state.omega + 2 * omega2 + 2 * omega3 + omega4),
    omega: state.omega + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4),
  };
}

function verticalTension(state: VerticalState, params: PendulumParams) {
  const R = Math.max(params.r, 1e-9);
  return params.m * (state.omega * state.omega * R + params.g * Math.cos(state.phi));
}

function verticalKinematics(state: VerticalState, params: PendulumParams) {
  const R = params.r;
  const speed = Math.abs(state.omega) * R;
  return {
    x: R * Math.sin(state.phi),
    y: -R * Math.cos(state.phi),
    vx: R * state.omega * Math.cos(state.phi),
    vy: R * state.omega * Math.sin(state.phi),
    speed,
  };
}

function locateDetachment(
  state: VerticalState,
  dt: number,
  params: PendulumParams,
) {
  let low = 0;
  let high = dt;
  for (let index = 0; index < EVENT_ITERATIONS; index += 1) {
    const mid = (low + high) / 2;
    const candidate = stepVertical(state, mid, params);
    if (verticalTension(candidate, params) > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const elapsed = (low + high) / 2;
  return { elapsed, state: stepVertical(state, elapsed, params) };
}

function willDetach(params: PendulumParams) {
  const energySpeed = params.v0 * params.v0;
  const gR = params.g * params.r;
  return energySpeed > 2 * gR + 1e-9 && energySpeed < 5 * gR - 1e-9;
}

export function verticalRopeAt(params: PendulumParams, requestedTime: number): VerticalRopeState {
  const target = Math.max(0, requestedTime);
  let state: VerticalState = {
    phi: 0,
    omega: params.r > 1e-9 ? params.v0 / params.r : 0,
  };
  let targetState: VerticalState | null = target <= 1e-12 ? state : null;
  let time = 0;
  let detachment: VerticalDetachment | null = null;
  const searchForDetachment = willDetach(params);
  const integrationLimit = searchForDetachment
    ? Math.max(target, 2 * Math.PI * Math.sqrt(params.r / Math.max(params.g, 1e-9)))
    : target;

  while (time < integrationLimit - 1e-12) {
    const step = Math.min(STEP, integrationLimit - time);
    const next = stepVertical(state, step, params);
    if (
      searchForDetachment &&
      state.omega > 0 &&
      verticalTension(state, params) > 0 &&
      verticalTension(next, params) <= 0
    ) {
      const event = locateDetachment(state, step, params);
      const eventTime = time + event.elapsed;
      const kinematics = verticalKinematics(event.state, params);
      detachment = {
        t: eventTime,
        phi: event.state.phi,
        ...kinematics,
        tension: verticalTension(event.state, params),
      };
      if (targetState === null && target <= eventTime) {
        targetState =
          Math.abs(target - eventTime) <= 1e-10
            ? event.state
            : stepVertical(state, Math.max(0, target - time), params);
      }
      break;
    }
    if (targetState === null && target <= time + step + 1e-12) {
      targetState = stepVertical(state, Math.max(0, target - time), params);
    }
    state = next;
    time += step;
  }

  if (detachment && target > detachment.t + 1e-10) {
    const elapsed = target - detachment.t;
    const x = detachment.x + detachment.vx * elapsed;
    const y = detachment.y + detachment.vy * elapsed - 0.5 * params.g * elapsed * elapsed;
    const vx = detachment.vx;
    const vy = detachment.vy - params.g * elapsed;
    const radiusSquared = Math.max(x * x + y * y, 1e-12);
    return {
      phase: "projectile",
      phi: Math.atan2(x, -y),
      omega: (-y * vx + x * vy) / radiusSquared,
      x,
      y,
      vx,
      vy,
      speed: Math.hypot(vx, vy),
      tension: 0,
      detachment,
    };
  }

  const constrained = targetState ?? state;
  const kinematics = verticalKinematics(constrained, params);
  return {
    phase: "constrained",
    phi: constrained.phi,
    omega: constrained.omega,
    ...kinematics,
    tension: Math.max(0, verticalTension(constrained, params)),
    detachment,
  };
}

function sphericalDerivative(
  state: SphericalPendulumState,
  params: PendulumParams,
): SphericalPendulumState {
  const sinTheta = Math.sin(state.theta);
  const cosTheta = Math.cos(state.theta);
  const safeSin =
    Math.abs(sinTheta) < 1e-7 ? (sinTheta < 0 ? -1e-7 : 1e-7) : sinTheta;
  return {
    theta: state.thetaVelocity,
    thetaVelocity:
      sinTheta * cosTheta * state.phiVelocity * state.phiVelocity -
      (params.g / Math.max(params.L, 1e-9)) * sinTheta,
    phi: state.phiVelocity,
    phiVelocity:
      -2 * (cosTheta / safeSin) * state.thetaVelocity * state.phiVelocity,
  };
}

function combineSpherical(
  state: SphericalPendulumState,
  derivative: SphericalPendulumState,
  scale: number,
): SphericalPendulumState {
  return {
    theta: state.theta + derivative.theta * scale,
    thetaVelocity: state.thetaVelocity + derivative.thetaVelocity * scale,
    phi: state.phi + derivative.phi * scale,
    phiVelocity: state.phiVelocity + derivative.phiVelocity * scale,
  };
}

function stepSpherical(
  state: SphericalPendulumState,
  dt: number,
  params: PendulumParams,
): SphericalPendulumState {
  const k1 = sphericalDerivative(state, params);
  const k2 = sphericalDerivative(combineSpherical(state, k1, dt / 2), params);
  const k3 = sphericalDerivative(combineSpherical(state, k2, dt / 2), params);
  const k4 = sphericalDerivative(combineSpherical(state, k3, dt), params);
  return {
    theta: state.theta + (dt / 6) * (k1.theta + 2 * k2.theta + 2 * k3.theta + k4.theta),
    thetaVelocity:
      state.thetaVelocity +
      (dt / 6) *
        (k1.thetaVelocity +
          2 * k2.thetaVelocity +
          2 * k3.thetaVelocity +
          k4.thetaVelocity),
    phi: state.phi + (dt / 6) * (k1.phi + 2 * k2.phi + 2 * k3.phi + k4.phi),
    phiVelocity:
      state.phiVelocity +
      (dt / 6) *
        (k1.phiVelocity +
          2 * k2.phiVelocity +
          2 * k3.phiVelocity +
          k4.phiVelocity),
  };
}

export function sphericalPendulumAt(
  params: PendulumParams,
  requestedTime: number,
): SphericalPendulumState {
  const theta = (params.thetaDeg * Math.PI) / 180;
  const radius = params.L * Math.sin(theta);
  let state: SphericalPendulumState = {
    theta,
    thetaVelocity: 0,
    phi: 0,
    phiVelocity: radius > 1e-9 ? params.v0 / radius : 0,
  };
  let time = 0;
  const target = Math.max(0, requestedTime);
  while (time < target - 1e-12) {
    const step = Math.min(STEP, target - time);
    state = stepSpherical(state, step, params);
    time += step;
  }
  return state;
}
