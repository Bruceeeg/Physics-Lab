import { createPart, recommendParts } from "./catalog.ts";
import { DYNAMIC_TYPES, type Part, type PartType, type SceneDocument } from "./types.ts";

const SENSOR_TYPES = new Set<PartType>([
  "meterstick",
  "balance",
  "stopwatch",
  "protractor",
  "motion-sensor",
  "photogate",
  "force-sensor",
  "spring-scale",
  "multimeter",
  "capacitance-meter",
  "magnetometer",
  "thermometer",
  "pressure-sensor",
  "compass",
]);

const MECHANICS = new Set([
  "linear-motion",
  "projectile-motion",
  "pull-friction",
  "incline-friction",
  "atwood-machine",
  "circular-motion",
  "conical-pendulum",
  "horizontal-circular",
  "vertical-circular",
  "conservation-of-energy",
  "impulse-momentum",
  "torque-equilibrium",
  "rotational-motion",
  "angular-momentum",
  "harmonic-motion",
  "fluid-dynamics",
  "archimedes",
  "rotational-inertia",
  "rotation-n2",
  "ballistic-pendulum",
  "physical-pendulum",
  "variable-force",
  "drag-force",
  "loop-track",
  "nonuniform-rod",
  "torsional-pendulum",
]);

export function cloneScene(scene: SceneDocument): SceneDocument {
  return structuredClone(scene);
}

export function presetFor(slug: string): SceneDocument {
  const recommended = recommendParts(slug).map((entry) => entry.type);
  const apparatus = recommended.filter((type) => !SENSOR_TYPES.has(type) && type !== "custom-force").slice(0, 3);
  const types: PartType[] = [...apparatus];
  if (MECHANICS.has(slug)) {
    types.unshift("gravity");
  }
  if (slug === "pull-friction" || slug === "variable-force") {
    types.push("custom-force");
  }
  const parts = types.map((type) => createPart(type, `preset-${type}`));
  const anchor = parts.find((part) => DYNAMIC_TYPES.has(part.type));
  for (const part of parts) {
    if (part.type === "custom-force" && anchor) {
      part.anchorId = anchor.id;
      part.attach = "body";
      part.magnitude = 20;
      part.thetaDeg = 30;
    }
    if (slug === "pull-friction" && part.type === "block") {
      part.mass = 2;
    }
    if (slug === "pull-friction" && part.type === "track") {
      part.mu = 0.3;
    }
  }
  return { slug, parts };
}

export function isCanonical(scene: SceneDocument, preset: SceneDocument) {
  return signature(scene) === signature(preset);
}

export function addPart(scene: SceneDocument, type: PartType): SceneDocument {
  const part = createPart(type, nextId(scene, type));
  if (type === "custom-force") {
    const anchor = scene.parts.find((item) => item.enabled && DYNAMIC_TYPES.has(item.type));
    if (anchor) {
      part.attach = "body";
      part.anchorId = anchor.id;
      part.x = 0;
      part.y = 0.15;
      part.z = 0;
    } else {
      part.attach = "world";
      part.x = 0.2;
      part.y = 0.4;
      part.z = 0;
    }
  }
  return { ...scene, parts: [...scene.parts, part] };
}

export function updatePart(scene: SceneDocument, id: string, patch: Partial<Part>): SceneDocument {
  return {
    ...scene,
    parts: scene.parts.map((part) => (part.id === id ? { ...part, ...patch, id: part.id, type: part.type } : part)),
  };
}

export function removePart(scene: SceneDocument, id: string): SceneDocument {
  return { ...scene, parts: scene.parts.filter((part) => part.id !== id) };
}

export function togglePart(scene: SceneDocument, id: string): SceneDocument {
  return updatePart(scene, id, {
    enabled: !(scene.parts.find((part) => part.id === id)?.enabled ?? true),
  });
}

function nextId(scene: SceneDocument, type: PartType) {
  let index = scene.parts.length + 1;
  let id = `user-${type}-${index}`;
  const used = new Set(scene.parts.map((part) => part.id));
  while (used.has(id)) {
    index += 1;
    id = `user-${type}-${index}`;
  }
  return id;
}

function signature(scene: SceneDocument) {
  return JSON.stringify(
    scene.parts
      .map((part) => ({
        id: part.id,
        type: part.type,
        enabled: part.enabled,
        x: round(part.x),
        y: round(part.y),
        z: round(part.z),
        mass: round(part.mass),
        charge: round(part.charge),
        g: round(part.g),
        magnitude: round(part.magnitude),
        thetaDeg: round(part.thetaDeg),
        phiDeg: round(part.phiDeg),
        mu: round(part.mu),
        angleDeg: round(part.angleDeg),
        stiffness: round(part.stiffness),
        length: round(part.length),
        voltage: round(part.voltage),
        resistance: round(part.resistance),
        capacitance: part.capacitance,
        current: round(part.current),
        turns: part.turns,
        field: part.field,
        focal: part.focal,
        closed: part.closed,
        attach: part.attach,
        anchorId: part.anchorId,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}
