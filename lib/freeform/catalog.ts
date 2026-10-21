import type { Part, PartType } from "./types.ts";

export type CatalogEntry = {
  type: PartType;
  label: string;
  symbol: string;
  keywords: string[];
};

export const CATALOG: readonly CatalogEntry[] = [
  { type: "block", label: "滑块", symbol: "m", keywords: ["小车", "质量", "方块", "cart"] },
  { type: "sphere", label: "小球", symbol: "m", keywords: ["球", "钢球", "ball"] },
  { type: "rod", label: "杆", symbol: "L", keywords: ["米尺", "细杆", "rod"] },
  { type: "disk", label: "圆盘", symbol: "I", keywords: ["转盘", "disk"] },
  { type: "ring", label: "圆环", symbol: "R", keywords: ["环", "hoop"] },
  { type: "cylinder", label: "圆柱", symbol: "R", keywords: ["滚筒"] },
  { type: "hanger", label: "钩码", symbol: "m", keywords: ["砝码", "槽码", "mass"] },
  { type: "track", label: "轨道", symbol: "μ", keywords: ["水平面", "导轨", "track"] },
  { type: "incline", label: "斜面", symbol: "θ", keywords: ["坡道", "ramp"] },
  { type: "pulley", label: "滑轮", symbol: "R", keywords: ["pulley"] },
  { type: "spring", label: "弹簧", symbol: "k", keywords: ["劲度", "spring"] },
  { type: "string", label: "细绳", symbol: "L", keywords: ["绳子", "线", "string"] },
  { type: "launcher", label: "弹射器", symbol: "v", keywords: ["抛体", "发射器"] },
  { type: "stand", label: "支架", symbol: "", keywords: ["铁架台", "夹具", "clamp"] },
  { type: "meterstick", label: "米尺", symbol: "m", keywords: ["直尺", "刻度尺"] },
  { type: "balance", label: "天平", symbol: "m", keywords: ["秤", "质量"] },
  { type: "stopwatch", label: "秒表", symbol: "t", keywords: ["计时", "stopwatch"] },
  { type: "protractor", label: "量角器", symbol: "θ", keywords: ["角度"] },
  { type: "motion-sensor", label: "运动传感器", symbol: "x", keywords: ["位移传感器", "声纳"] },
  { type: "photogate", label: "光电门", symbol: "v", keywords: ["挡光", "photogate"] },
  { type: "force-sensor", label: "力传感器", symbol: "F", keywords: ["测力"] },
  { type: "spring-scale", label: "弹簧测力计", symbol: "F", keywords: ["弹簧秤", "拉力计"] },
  { type: "custom-force", label: "自定义力", symbol: "F", keywords: ["力", "拉力", "推力", "force"] },
  { type: "gravity", label: "重力", symbol: "g", keywords: ["重力场", "重力加速度"] },
  { type: "bottle", label: "带孔液瓶", symbol: "h", keywords: ["流体", "托里拆利", "水"] },
  { type: "syringe", label: "注射器", symbol: "V", keywords: ["玻意耳", "活塞", "气体"] },
  { type: "thermo-bar", label: "导热棒", symbol: "k", keywords: ["热导", "热传导"] },
  { type: "thermometer", label: "温度计", symbol: "T", keywords: ["温度"] },
  { type: "pressure-sensor", label: "气压传感器", symbol: "P", keywords: ["压强"] },
  { type: "battery", label: "电池", symbol: "ε", keywords: ["电源", "电池组"] },
  { type: "supply", label: "直流电源", symbol: "V", keywords: ["电源", "可调电源"] },
  { type: "wire", label: "导线", symbol: "", keywords: ["接线", "导线"] },
  { type: "switch", label: "开关", symbol: "", keywords: ["电键"] },
  { type: "bulb", label: "灯泡", symbol: "R", keywords: ["灯", "bulb"] },
  { type: "resistor", label: "电阻", symbol: "R", keywords: ["电阻器"] },
  { type: "capacitor", label: "电容", symbol: "C", keywords: ["电容器"] },
  { type: "magnet", label: "条形磁铁", symbol: "B", keywords: ["磁铁", "磁体"] },
  { type: "compass", label: "小磁针", symbol: "B", keywords: ["指南针", "罗盘"] },
  { type: "coil", label: "线圈", symbol: "N", keywords: ["螺线", "感应线圈"] },
  { type: "solenoid", label: "螺线管", symbol: "n", keywords: ["螺线管", "μ0"] },
  { type: "electroscope", label: "验电器", symbol: "q", keywords: ["箔片"] },
  { type: "plate", label: "金属板", symbol: "q", keywords: ["极板", "锌板"] },
  { type: "multimeter", label: "万用表", symbol: "V", keywords: ["电压表", "电流表", "欧姆表"] },
  { type: "capacitance-meter", label: "电容表", symbol: "C", keywords: ["测电容"] },
  { type: "magnetometer", label: "磁强计", symbol: "B", keywords: ["磁场传感器"] },
  { type: "lens-convex", label: "凸透镜", symbol: "f", keywords: ["透镜", "会聚", "凸"] },
  { type: "lens-concave", label: "凹透镜", symbol: "f", keywords: ["透镜", "发散", "凹"] },
  { type: "screen", label: "光屏", symbol: "s", keywords: ["屏幕", "像屏"] },
  { type: "lamp", label: "光源", symbol: "", keywords: ["灯", "蜡烛", "物体"] },
  { type: "laser", label: "激光笔", symbol: "λ", keywords: ["激光", "laser"] },
  { type: "grating", label: "衍射光栅", symbol: "d", keywords: ["双缝", "单缝", "光栅"] },
  { type: "led", label: "发光二极管", symbol: "hf", keywords: ["led", "光电", "光子"] },
];

const ENTRY = new Map(CATALOG.map((entry) => [entry.type, entry]));

const FORCE: PartType[] = ["block", "custom-force", "track", "spring-scale", "force-sensor", "motion-sensor", "photogate", "meterstick"];
const INCLINE: PartType[] = ["incline", "block", "custom-force", "protractor", "motion-sensor", "meterstick", "spring-scale", "stopwatch"];
const CIRCLE: PartType[] = ["sphere", "string", "stand", "stopwatch", "meterstick", "protractor", "custom-force", "photogate"];
const SPRING: PartType[] = ["spring", "block", "custom-force", "stopwatch", "meterstick", "motion-sensor", "force-sensor", "stand"];
const ROTATION: PartType[] = ["disk", "pulley", "string", "hanger", "rod", "photogate", "meterstick", "protractor"];
const CIRCUIT: PartType[] = ["battery", "resistor", "wire", "switch", "bulb", "multimeter", "supply", "capacitor"];
const FIELD: PartType[] = ["sphere", "electroscope", "plate", "meterstick", "balance", "string", "stand", "custom-force"];
const MAGNET: PartType[] = ["magnet", "compass", "solenoid", "magnetometer", "coil", "supply", "wire", "meterstick"];
const OPTICS: PartType[] = ["lens-convex", "lens-concave", "lamp", "screen", "meterstick", "laser", "grating", "stand"];

const PICKS: Record<string, readonly PartType[]> = {};

function assign(slugs: readonly string[], types: readonly PartType[]) {
  for (const slug of slugs) {
    PICKS[slug] = types;
  }
}

assign(["linear-motion", "variable-force", "drag-force"], FORCE);
assign(["projectile-motion"], ["launcher", "sphere", "custom-force", "meterstick", "photogate", "stopwatch", "motion-sensor", "protractor"]);
assign(["pull-friction"], ["track", "block", "custom-force", "spring-scale", "force-sensor", "protractor", "balance", "meterstick"]);
assign(["incline-friction", "loop-track", "conservation-of-energy", "rotational-motion"], INCLINE);
assign(["atwood-machine", "rotational-inertia", "rotation-n2"], ["pulley", "hanger", "string", "disk", "photogate", "meterstick", "stopwatch", "stand"]);
assign(["circular-motion", "conical-pendulum", "horizontal-circular", "vertical-circular"], CIRCLE);
assign(["impulse-momentum", "ballistic-pendulum"], ["block", "sphere", "track", "custom-force", "motion-sensor", "photogate", "balance", "meterstick"]);
assign(["torque-equilibrium", "physical-pendulum", "nonuniform-rod"], ["rod", "hanger", "stand", "protractor", "meterstick", "balance", "string", "spring-scale"]);
assign(["angular-momentum", "torsional-pendulum"], ROTATION);
assign(["harmonic-motion"], SPRING);
assign(["fluid-dynamics", "archimedes"], ["bottle", "sphere", "balance", "spring-scale", "meterstick", "stopwatch", "string", "stand"]);
assign(["boyles-law"], ["syringe", "pressure-sensor", "balance", "thermometer", "meterstick", "block", "stopwatch", "stand"]);
assign(["thermal-conductivity"], ["thermo-bar", "thermometer", "meterstick", "stopwatch", "stand", "balance", "rod", "multimeter"]);
assign(["electric-field", "equipotential", "coulombs-law"], FIELD);
assign(["resistor-circuits", "rc-circuits"], CIRCUIT);
assign(["capacitance"], ["capacitor", "capacitance-meter", "plate", "supply", "multimeter", "meterstick", "wire", "battery"]);
assign(["rl-circuits"], ["coil", "resistor", "battery", "switch", "multimeter", "supply", "wire", "magnetometer"]);
assign(["magnetism", "solenoid", "electromagnetic-induction"], MAGNET);
assign(["geometric-optics", "waves-optics"], OPTICS);
assign(["particle-model-of-light"], ["led", "battery", "multimeter", "electroscope", "plate", "lamp", "meterstick", "stopwatch"]);

export function catalogEntry(type: PartType) {
  const entry = ENTRY.get(type);
  if (!entry) {
    throw new Error(`未知零件 ${type}`);
  }
  return entry;
}

export function recommendParts(slug: string) {
  const types = PICKS[slug] ?? FORCE;
  return types.slice(0, 8).map((type) => catalogEntry(type));
}

export function searchParts(query: string, slug: string) {
  const text = query.trim().toLowerCase();
  if (!text) {
    return recommendParts(slug);
  }
  const theme = new Set(recommendParts(slug).map((entry) => entry.type));
  return CATALOG
    .map((entry) => ({ entry, score: scoreEntry(entry, text, theme.has(entry.type)) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label, "zh"))
    .map((item) => item.entry);
}

function scoreEntry(entry: CatalogEntry, query: string, themed: boolean) {
  const label = entry.label.toLowerCase();
  const symbol = entry.symbol.toLowerCase();
  let score = 0;
  if (label === query || symbol === query) {
    score = 100;
  } else if (label.startsWith(query) || symbol.startsWith(query)) {
    score = 80;
  } else if (label.includes(query)) {
    score = 60;
  } else if (entry.keywords.some((keyword) => keyword.toLowerCase().includes(query))) {
    score = 40;
  }
  if (score > 0 && themed) {
    score += 5;
  }
  return score;
}

export function createPart(type: PartType, id: string): Part {
  return {
    id,
    type,
    enabled: true,
    x: 0,
    y: type === "block" || type === "track" ? 0.08 : 0.3,
    z: 0,
    mass: type === "sphere" ? 0.2 : 1,
    charge: 0,
    g: 9.81,
    magnitude: type === "custom-force" ? 10 : 0,
    thetaDeg: 0,
    phiDeg: 0,
    mu: type === "track" || type === "incline" ? 0.2 : 0,
    angleDeg: type === "incline" ? 30 : 0,
    stiffness: type === "spring" ? 20 : 0,
    length: type === "string" ? 0.8 : type === "spring" ? 0.25 : 0.4,
    voltage: type === "battery" || type === "supply" ? 6 : 0,
    resistance: type === "resistor" || type === "bulb" ? 10 : 1,
    capacitance: type === "capacitor" ? 1e-4 : 0,
    current: type === "solenoid" ? 1 : 0,
    turns: type === "solenoid" ? 400 : type === "coil" ? 50 : 0,
    field: type === "magnet" ? 0.05 : 0,
    focal: type === "lens-convex" ? 0.2 : type === "lens-concave" ? -0.2 : 0,
    closed: true,
    attach: "body",
    anchorId: "",
  };
}
