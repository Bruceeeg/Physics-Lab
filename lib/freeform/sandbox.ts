import { forceComponents, torqueFromOffset } from "./forces.ts";
import { DYNAMIC_TYPES, type Part, type SceneDocument } from "./types.ts";

const COULOMB = 8.9875517923e9;
const MIN_SEPARATION = 0.001;
const SUBSTEP = 0.002;

export type BodyState = {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
};

export type SandboxState = {
  t: number;
  bodies: BodyState[];
  capacitorCharge: number;
  finite: boolean;
};

export type SandboxSample = {
  t: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  ax: number;
  ay: number;
  az: number;
  fx: number;
  fy: number;
  fz: number;
  torque: number;
  current: number;
  imageDistance: number | null;
  notice: string;
};

export type Capture = {
  t: number;
  point: [number, number, number] | null;
  velocity: { vx: number; vy: number; vz: number } | null;
};

export function createSandbox(scene: SceneDocument, capture?: Capture): SandboxState {
  const dynamics = dynamicParts(scene);
  return {
    t: capture?.t ?? 0,
    capacitorCharge: 0,
    finite: true,
    bodies: dynamics.map((part, index) => ({
      id: part.id,
      x: index === 0 && capture?.point ? capture.point[0] : part.x,
      y: index === 0 && capture?.point ? capture.point[1] : part.y,
      z: index === 0 && capture?.point ? capture.point[2] : part.z,
      vx: index === 0 && capture?.velocity ? capture.velocity.vx : 0,
      vy: index === 0 && capture?.velocity ? capture.velocity.vy : 0,
      vz: index === 0 && capture?.velocity ? capture.velocity.vz : 0,
    })),
  };
}

export function syncSandbox(scene: SceneDocument, state: SandboxState): SandboxState {
  const dynamics = dynamicParts(scene);
  const previous = new Map(state.bodies.map((body) => [body.id, body]));
  return {
    ...state,
    finite: state.finite,
    bodies: dynamics.map((part) => previous.get(part.id) ?? {
      id: part.id,
      x: part.x,
      y: part.y,
      z: part.z,
      vx: 0,
      vy: 0,
      vz: 0,
    }),
  };
}

export function evaluate(scene: SceneDocument, state: SandboxState): SandboxSample {
  const notices: string[] = [];
  const parts = scene.parts.filter((part) => part.enabled);
  const bodies = state.bodies;
  if (!state.finite) {
    return emptySample(state, "数值发散，已暂停。重置时间或重置实验台可以继续。");
  }
  if (bodies.length === 0) {
    return emptySample(state, parts.length === 0 ? "场景是空的。" : "场景里没有可运动的物体。");
  }

  const force = new Map<string, { x: number; y: number; z: number }>();
  for (const body of bodies) {
    force.set(body.id, { x: 0, y: 0, z: 0 });
  }
  const partById = new Map(parts.map((part) => [part.id, part]));
  const gravity = parts.find((part) => part.type === "gravity");
  const g = gravity?.g ?? 0;

  for (const body of bodies) {
    const mass = massOf(partById.get(body.id), 1);
    if (gravity) {
      add(force, body.id, 0, -mass * g, 0);
    }
  }

  let looseForce = false;
  let torquePeak = 0;
  for (const part of parts) {
    if (part.type !== "custom-force") {
      continue;
    }
    const components = forceComponents(part.magnitude, part.thetaDeg, part.phiDeg);
    const target = resolveForceTarget(part, bodies);
    if (!target) {
      looseForce = true;
      continue;
    }
    add(force, target.id, components.x, components.y, components.z);
    if (part.attach === "body") {
      const tau = torqueFromOffset(part, components);
      torquePeak = Math.max(torquePeak, Math.hypot(tau.x, tau.y, tau.z));
    }
  }

  let coulombCapped = false;
  const charged = bodies.flatMap((body) => {
    const charge = partById.get(body.id)?.charge ?? 0;
    return charge === 0 ? [] : [{ body, charge }];
  });
  for (let i = 0; i < charged.length; i += 1) {
    for (let j = i + 1; j < charged.length; j += 1) {
      const a = charged[i];
      const b = charged[j];
      if (!a || !b) {
        continue;
      }
      const rx = b.body.x - a.body.x;
      const ry = b.body.y - a.body.y;
      const rz = b.body.z - a.body.z;
      const separation = Math.hypot(rx, ry, rz);
      const radius = Math.max(separation, MIN_SEPARATION);
      if (separation < MIN_SEPARATION) {
        coulombCapped = true;
      }
      const magnitude = (COULOMB * a.charge * b.charge) / (radius * radius);
      const scale = magnitude / radius;
      add(force, a.body.id, -scale * rx, -scale * ry, -scale * rz);
      add(force, b.body.id, scale * rx, scale * ry, scale * rz);
    }
  }

  for (const magnet of parts) {
    if (magnet.type !== "magnet" && magnet.type !== "solenoid") {
      continue;
    }
    const field = magnet.type === "solenoid"
      ? 4 * Math.PI * 1e-7 * Math.max(0, magnet.turns) * magnet.current
      : magnet.field;
    for (const body of bodies) {
      const charge = partById.get(body.id)?.charge ?? 0;
      if (charge === 0 || Math.hypot(body.x - magnet.x, body.y - magnet.y, body.z - magnet.z) > 0.45) {
        continue;
      }
      add(force, body.id, charge * body.vy * field, -charge * body.vx * field, 0);
    }
  }

  const springs = parts.filter((part) => part.type === "spring");
  for (const spring of springs) {
    const ends = bodies.slice(0, 2);
    const target = ends[1] ?? ends[0];
    const origin = ends[1] ? ends[0] : null;
    if (!target) {
      continue;
    }
    const ox = origin ? origin.x : spring.x;
    const oy = origin ? origin.y : spring.y;
    const oz = origin ? origin.z : spring.z;
    const rx = target.x - ox;
    const ry = target.y - oy;
    const rz = target.z - oz;
    const distance = Math.hypot(rx, ry, rz) || MIN_SEPARATION;
    const stretch = distance - Math.max(0.05, spring.length);
    const magnitude = spring.stiffness * stretch;
    add(force, target.id, (-magnitude * rx) / distance, (-magnitude * ry) / distance, (-magnitude * rz) / distance);
    if (origin) {
      add(force, origin.id, (magnitude * rx) / distance, (magnitude * ry) / distance, (magnitude * rz) / distance);
    }
  }

  const track = parts.find((part) => part.type === "track");
  const incline = parts.find((part) => part.type === "incline");
  for (const body of bodies) {
    const support = supportOf(body, track, incline);
    if (!support) {
      continue;
    }
    const current = force.get(body.id) ?? { x: 0, y: 0, z: 0 };
    const intoFloor = support.normalY * current.y + support.normalX * current.x;
    if (body.vy <= 0.02 && intoFloor < 0) {
      const normal = -intoFloor;
      current.x -= support.normalX * intoFloor;
      current.y -= support.normalY * intoFloor;
      const tangentX = -support.normalY;
      const tangentY = support.normalX;
      const tangentForce = current.x * tangentX + current.y * tangentY;
      const speed = body.vx * tangentX + body.vy * tangentY;
      const mu = support.mu;
      if (Math.abs(speed) < 0.02 && Math.abs(tangentForce) <= mu * normal) {
        current.x -= tangentForce * tangentX;
        current.y -= tangentForce * tangentY;
      } else {
        const sign = Math.abs(speed) > 1e-4 ? Math.sign(speed) : Math.sign(tangentForce || 1);
        const friction = mu * normal * sign;
        current.x -= friction * tangentX;
        current.y -= friction * tangentY;
      }
      force.set(body.id, current);
    }
  }

  const primary = bodies[0];
  if (!primary) {
    return emptySample(state, "场景里没有可运动的物体。");
  }
  const net = force.get(primary.id) ?? { x: 0, y: 0, z: 0 };
  const mass = massOf(partById.get(primary.id), 1);
  const current = circuitCurrent(parts, state.capacitorCharge);
  const imageDistance = lensImage(parts);
  if (looseForce) {
    notices.push("有力没有作用在物体上。");
  }
  if (coulombCapped) {
    notices.push("距离过近，库仑力已限制。");
  }
  if (notices.length === 0) {
    notices.push("自由搭建。");
  }
  return {
    t: state.t,
    x: primary.x,
    y: primary.y,
    z: primary.z,
    vx: primary.vx,
    vy: primary.vy,
    vz: primary.vz,
    speed: Math.hypot(primary.vx, primary.vy, primary.vz),
    ax: net.x / mass,
    ay: net.y / mass,
    az: net.z / mass,
    fx: net.x,
    fy: net.y,
    fz: net.z,
    torque: torquePeak,
    current: current.current,
    imageDistance,
    notice: notices.join(""),
  };
}

export function advanceSandbox(scene: SceneDocument, state: SandboxState, dt: number): SandboxState {
  if (!state.finite || dt <= 0) {
    return state;
  }
  const steps = Math.min(200, Math.max(1, Math.round(dt / SUBSTEP)));
  const h = dt / steps;
  let next: SandboxState = {
    ...state,
    bodies: state.bodies.map((body) => ({ ...body })),
  };
  for (let index = 0; index < steps; index += 1) {
    const sample = evaluate(scene, next);
    if (!Number.isFinite(sample.ax) || !Number.isFinite(sample.ay) || !Number.isFinite(sample.az)) {
      return { ...state, finite: false };
    }
    const parts = scene.parts.filter((part) => part.enabled);
    const partById = new Map(parts.map((part) => [part.id, part]));
    const evaluated = forcesForAll(scene, next);
    let exploded = false;
    const bodies = next.bodies.map((body) => {
      const net = evaluated.get(body.id) ?? { x: 0, y: 0, z: 0 };
      const mass = massOf(partById.get(body.id), 1);
      const vx = body.vx + (net.x / mass) * h;
      const vy = body.vy + (net.y / mass) * h;
      const vz = body.vz + (net.z / mass) * h;
      const moved = {
        ...body,
        vx,
        vy,
        vz,
        x: body.x + vx * h,
        y: body.y + vy * h,
        z: body.z + vz * h,
      };
      if (![moved.x, moved.y, moved.z, vx, vy, vz].every(Number.isFinite)) {
        exploded = true;
      }
      return moved;
    });
    if (exploded) {
      return { ...state, finite: false };
    }
    next = {
      ...next,
      t: next.t + h,
      capacitorCharge: next.capacitorCharge + circuitCurrent(parts, next.capacitorCharge).current * h,
      bodies,
    };
  }
  return next;
}

function forcesForAll(scene: SceneDocument, state: SandboxState) {
  const snapshot = evaluate(scene, state);
  const map = new Map<string, { x: number; y: number; z: number }>();
  if (state.bodies[0]) {
    map.set(state.bodies[0].id, { x: snapshot.fx, y: snapshot.fy, z: snapshot.fz });
  }
  if (state.bodies.length <= 1) {
    return map;
  }
  for (const body of state.bodies) {
    const solo: SandboxState = { ...state, bodies: [body, ...state.bodies.filter((item) => item.id !== body.id)] };
    const sample = evaluate(scene, solo);
    map.set(body.id, { x: sample.fx, y: sample.fy, z: sample.fz });
  }
  return map;
}

function dynamicParts(scene: SceneDocument) {
  return scene.parts.filter((part) => part.enabled && DYNAMIC_TYPES.has(part.type));
}

function massOf(part: Part | undefined, fallback: number) {
  const mass = part?.mass ?? fallback;
  return mass > 0 ? mass : fallback;
}

function add(force: Map<string, { x: number; y: number; z: number }>, id: string, x: number, y: number, z: number) {
  const current = force.get(id);
  if (!current) {
    return;
  }
  current.x += x;
  current.y += y;
  current.z += z;
}

function resolveForceTarget(part: Part, bodies: BodyState[]) {
  if (part.attach === "body") {
    return bodies.find((body) => body.id === part.anchorId) ?? bodies[0] ?? null;
  }
  let closest: BodyState | null = null;
  let distance = 0.12;
  for (const body of bodies) {
    const gap = Math.hypot(body.x - part.x, body.y - part.y, body.z - part.z);
    if (gap <= distance) {
      closest = body;
      distance = gap;
    }
  }
  return closest;
}

function supportOf(body: BodyState, track: Part | undefined, incline: Part | undefined) {
  if (incline && body.x >= -0.05 && body.x <= Math.max(0.4, incline.length)) {
    const angle = (incline.angleDeg * Math.PI) / 180;
    const floor = Math.tan(angle) * Math.max(0, body.x);
    if (body.y <= floor + 0.08) {
      return { floor, normalX: -Math.sin(angle), normalY: Math.cos(angle), mu: incline.mu };
    }
  }
  if (track && body.y <= track.y + 0.06) {
    return { floor: track.y, normalX: 0, normalY: 1, mu: track.mu };
  }
  return null;
}

function circuitCurrent(parts: Part[], charge: number) {
  const source = parts.find((part) => part.type === "battery" || part.type === "supply");
  const open = parts.some((part) => part.type === "switch" && !part.closed);
  const resistance = parts
    .filter((part) => part.type === "resistor" || part.type === "bulb" || part.type === "coil")
    .reduce((sum, part) => sum + Math.max(0.1, part.resistance), 0);
  const capacitor = parts.find((part) => part.type === "capacitor");
  if (!source || open || resistance <= 0) {
    return { current: 0 };
  }
  const voltage = capacitor ? source.voltage - charge / Math.max(capacitor.capacitance, 1e-9) : source.voltage;
  return { current: voltage / resistance };
}

function lensImage(parts: Part[]) {
  const lens = parts.find((part) => part.type === "lens-convex" || part.type === "lens-concave");
  const source = parts.find((part) => part.type === "lamp" || part.type === "laser" || part.type === "block" || part.type === "sphere");
  if (!lens || !source || Math.abs(lens.focal) < 1e-6) {
    return null;
  }
  const objectDistance = Math.hypot(source.x - lens.x, source.y - lens.y, source.z - lens.z);
  if (objectDistance < 1e-4) {
    return null;
  }
  const inverse = 1 / lens.focal - 1 / objectDistance;
  if (Math.abs(inverse) < 1e-8) {
    return null;
  }
  return 1 / inverse;
}

function emptySample(state: SandboxState, notice: string): SandboxSample {
  return {
    t: state.t,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    speed: 0,
    ax: 0,
    ay: 0,
    az: 0,
    fx: 0,
    fy: 0,
    fz: 0,
    torque: 0,
    current: 0,
    imageDistance: null,
    notice,
  };
}
