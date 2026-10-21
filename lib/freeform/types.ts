export type AttachMode = "body" | "world";

export type PartType =
  | "block"
  | "sphere"
  | "rod"
  | "disk"
  | "ring"
  | "cylinder"
  | "hanger"
  | "track"
  | "incline"
  | "pulley"
  | "spring"
  | "string"
  | "launcher"
  | "stand"
  | "meterstick"
  | "balance"
  | "stopwatch"
  | "protractor"
  | "motion-sensor"
  | "photogate"
  | "force-sensor"
  | "spring-scale"
  | "custom-force"
  | "gravity"
  | "bottle"
  | "syringe"
  | "thermo-bar"
  | "thermometer"
  | "pressure-sensor"
  | "battery"
  | "supply"
  | "wire"
  | "switch"
  | "bulb"
  | "resistor"
  | "capacitor"
  | "magnet"
  | "compass"
  | "coil"
  | "solenoid"
  | "electroscope"
  | "plate"
  | "multimeter"
  | "capacitance-meter"
  | "magnetometer"
  | "lens-convex"
  | "lens-concave"
  | "screen"
  | "lamp"
  | "laser"
  | "grating"
  | "led";

export type Part = {
  id: string;
  type: PartType;
  enabled: boolean;
  x: number;
  y: number;
  z: number;
  mass: number;
  charge: number;
  g: number;
  magnitude: number;
  thetaDeg: number;
  phiDeg: number;
  mu: number;
  angleDeg: number;
  stiffness: number;
  length: number;
  voltage: number;
  resistance: number;
  capacitance: number;
  current: number;
  turns: number;
  field: number;
  focal: number;
  closed: boolean;
  attach: AttachMode;
  anchorId: string;
};

export type SceneDocument = {
  slug: string;
  parts: Part[];
};

export const DYNAMIC_TYPES = new Set<PartType>([
  "block",
  "sphere",
  "rod",
  "disk",
  "ring",
  "cylinder",
  "hanger",
]);
