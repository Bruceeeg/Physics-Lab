export type ReadySlug =
  | "linear-motion"
  | "projectile-motion"
  | "pull-friction"
  | "incline-friction"
  | "atwood-machine"
  | "circular-motion"
  | "conservation-of-energy"
  | "impulse-momentum"
  | "torque-equilibrium"
  | "rotational-motion"
  | "angular-momentum"
  | "harmonic-motion"
  | "fluid-dynamics"
  | "archimedes"
  | "boyles-law"
  | "thermal-conductivity"
  | "electric-field"
  | "resistor-circuits"
  | "rc-circuits"
  | "magnetism"
  | "electromagnetic-induction"
  | "geometric-optics"
  | "waves-optics"
  | "particle-model-of-light"
  | "rotational-inertia"
  | "rotation-n2"
  | "ballistic-pendulum"
  | "physical-pendulum"
  | "equipotential"
  | "coulombs-law"
  | "capacitance"
  | "rl-circuits"
  | "solenoid";

export type ExperimentSlug = ReadySlug | string;

export type CourseId = "p1" | "p2" | "c-mech" | "c-em";

export type CourseFilter = "all" | CourseId;

export type ExperimentStatus = "ready" | "pending";

export type PreviewKind =
  | "pull-friction"
  | "linear-motion"
  | "circular"
  | "energy"
  | "momentum"
  | "shm"
  | "rotation"
  | "fluids"
  | "incline"
  | "torque"
  | "atwood"
  | "projectile"
  | "angmom"
  | "archimedes"
  | "boyle"
  | "resistor"
  | "rc"
  | "magnetism"
  | "induction"
  | "optics"
  | "photon"
  | "coulomb"
  | "waves"
  | "thermal"
  | "inertia"
  | "n2rot"
  | "ballistic"
  | "physical-pendulum"
  | "equipotential"
  | "capacitance"
  | "ohm"
  | "rl"
  | "solenoid";

export type ExperimentEntry = {
  slug: string;
  title: string;
  formula: string;
  course: CourseId;
  courses?: readonly CourseId[];
  unit: string;
  unitByCourse?: Partial<Record<CourseId, string>>;
  preview: PreviewKind;
  status: ExperimentStatus;
  summary: string;
};

export type CourseSection = {
  id: CourseId;
  title: string;
};

export const COURSE_SECTIONS: readonly CourseSection[] = [
  { id: "p1", title: "AP Physics 1" },
  { id: "p2", title: "AP Physics 2" },
  { id: "c-mech", title: "AP Physics C 力学" },
  { id: "c-em", title: "AP Physics C 电磁" },
];

export const P1_CED_UNITS = [
  { id: "1", title: "Unit 1 运动学", weighting: "10%-15%", english: "Kinematics" },
  { id: "2", title: "Unit 2 力与平动动力学", weighting: "18%-23%", english: "Force and Translational Dynamics" },
  { id: "3", title: "Unit 3 功、能量与功率", weighting: "18%-23%", english: "Work, Energy, and Power" },
  { id: "4", title: "Unit 4 线动量", weighting: "10%-15%", english: "Linear Momentum" },
  { id: "5", title: "Unit 5 力矩与转动动力学", weighting: "10%-15%", english: "Torque and Rotational Dynamics" },
  { id: "6", title: "Unit 6 转动系统的能量与动量", weighting: "5%-8%", english: "Energy and Momentum of Rotating Systems" },
  { id: "7", title: "Unit 7 振动", weighting: "5%-8%", english: "Oscillations" },
  { id: "8", title: "Unit 8 流体", weighting: "10%-15%", english: "Fluids" },
] as const;

export type P1CedUnit = (typeof P1_CED_UNITS)[number];

export const P2_CED_UNITS = [
  { id: "9", title: "Unit 9 热力学", weighting: "10%-15%", english: "Thermodynamics" },
  { id: "10", title: "Unit 10 电场与电势", weighting: "15%-25%", english: "Electric Force, Field, and Potential" },
  { id: "11", title: "Unit 11 电路", weighting: "15%-25%", english: "Electric Circuits" },
  { id: "12", title: "Unit 12 磁与电磁", weighting: "10%-20%", english: "Magnetism and Electromagnetism" },
  { id: "13", title: "Unit 13 几何光学", weighting: "10%-15%", english: "Geometric Optics" },
  { id: "14", title: "Unit 14 波与物理光学", weighting: "10%-15%", english: "Waves and Physical Optics" },
  { id: "15", title: "Unit 15 近代物理", weighting: "10%-15%", english: "Modern Physics" },
] as const;

export type P2CedUnit = (typeof P2_CED_UNITS)[number];

export const C_MECH_CED_UNITS = [
  { id: "1", title: "Unit 1 运动学", weighting: "10%-15%", english: "Kinematics" },
  { id: "2", title: "Unit 2 力与平动动力学", weighting: "20%-25%", english: "Force and Translational Dynamics" },
  { id: "3", title: "Unit 3 功、能量与功率", weighting: "15%-25%", english: "Work, Energy, and Power" },
  { id: "4", title: "Unit 4 线动量", weighting: "10%-20%", english: "Linear Momentum" },
  { id: "5", title: "Unit 5 力矩与转动动力学", weighting: "10%-15%", english: "Torque and Rotational Dynamics" },
  { id: "6", title: "Unit 6 转动系统的能量与动量", weighting: "10%-15%", english: "Energy and Momentum of Rotating Systems" },
  { id: "7", title: "Unit 7 振动", weighting: "10%-15%", english: "Oscillations" },
] as const;

export type CMechCedUnit = (typeof C_MECH_CED_UNITS)[number];

export const C_EM_CED_UNITS = [
  { id: "8", title: "Unit 8 电荷、电场与高斯定理", weighting: "15%-25%", english: "Electric Charges, Fields, and Gauss's Law" },
  { id: "9", title: "Unit 9 电势", weighting: "10%-20%", english: "Electric Potential" },
  { id: "10", title: "Unit 10 导体与电容", weighting: "10%-15%", english: "Conductors and Capacitors" },
  { id: "11", title: "Unit 11 电路", weighting: "15%-25%", english: "Electric Circuits" },
  { id: "12", title: "Unit 12 磁场与电磁", weighting: "10%-20%", english: "Magnetic Fields and Electromagnetism" },
  { id: "13", title: "Unit 13 电磁感应", weighting: "10%-20%", english: "Electromagnetic Induction" },
] as const;

export type CEmCedUnit = (typeof C_EM_CED_UNITS)[number];

const P1_AND_C = ["p1", "c-mech"] as const;
const P2_AND_C = ["p2", "c-em"] as const;

export const EXPERIMENTS: readonly ExperimentEntry[] = [
  {
    slug: "linear-motion",
    title: "匀变速直线运动",
    formula: "x = x₀ + v₀t + ½at²",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 1 运动学",
    preview: "linear-motion",
    status: "ready",
    summary: "单段匀变速，或先加速再匀速/再加速的两段运动，对应 x-t、v-t 图。",
  },
  {
    slug: "projectile-motion",
    title: "抛体落点",
    formula: "x = (v₀ cosθ) t",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 1 运动学",
    preview: "projectile",
    status: "ready",
    summary: "平抛或斜抛：参数实验直接调 v₀、θ、h；预测模式先测初速度再预测落点。",
  },
  {
    slug: "pull-friction",
    title: "斜向拉力实验台",
    formula: "N = mg − |F|sinθ",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 2 力与平动动力学",
    preview: "pull-friction",
    status: "ready",
    summary: "水平面上斜向拉力与摩擦：可配置 F、θ、m、μs、μk、g。",
  },
  {
    slug: "incline-friction",
    title: "斜面摩擦",
    formula: "a = g(sinθ − μk cosθ)",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 2 力与平动动力学",
    preview: "incline",
    status: "ready",
    summary: "斜面下滑后进入可调长度的平面摩擦段。斜面 a = g(sinθ − μk cosθ)，平面 a = −μk g。",
  },
  {
    slug: "atwood-machine",
    title: "阿特伍德机",
    formula: "a = gΔm / (m₁ + m₂)",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 2 力与平动动力学",
    preview: "atwood",
    status: "ready",
    summary: "经典双吊、桌上滑车，或计入滑轮转动惯量 I = ½MR²。",
  },
  {
    slug: "circular-motion",
    title: "圆周运动",
    formula: "T = 2π√(L cosθ / g)",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 2 力与平动动力学",
    preview: "circular",
    status: "ready",
    summary: "圆锥摆、水平圆周或竖直圆周：比较周期、绳力和过顶条件。",
  },
  {
    slug: "conservation-of-energy",
    title: "机械能守恒",
    formula: "½kx² + mgy + ½mv² = E",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 3 功、能量与功率",
    preview: "energy",
    status: "ready",
    summary: "弹射上坡或弹簧始终连接。弹簧做功写成 W = ∫ kx dx = ½kA²。",
  },
  {
    slug: "impulse-momentum",
    title: "冲量与动量",
    formula: "J = Δp = FΔt",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 4 线动量",
    preview: "momentum",
    status: "ready",
    summary: "对心碰撞、爆炸分离，或弹道摆：由上升高度反推弹丸速度。",
  },
  {
    slug: "torque-equilibrium",
    title: "力矩平衡",
    formula: "Στ = 0",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 5 力矩与转动动力学",
    preview: "torque",
    status: "ready",
    summary: "均匀米尺支点与悬挂质量：调节支点和砝码位置，使净力矩为零。",
  },
  {
    slug: "rotational-motion",
    title: "滚动与转动",
    formula: "v = √(2mgh / (m + I/r²))",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 6 转动系统的能量与动量",
    preview: "rotation",
    status: "ready",
    summary: "无滑滚动或无摩擦滑动。I = ∫ r² dm = κmr²，比较底端速率。",
  },
  {
    slug: "angular-momentum",
    title: "角动量守恒",
    formula: "I₁ω₁ = I₂ω₂",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 6 转动系统的能量与动量",
    preview: "angmom",
    status: "ready",
    summary: "落物粘盘或收臂加速。圆盘 I = ∫ r² dm = ½MR²，检验 Iω 守恒。",
  },
  {
    slug: "harmonic-motion",
    title: "简谐运动",
    formula: "T = 2π√(L/g) 或 2π√(m/k)",
    course: "p1",
    courses: P1_AND_C,
    unit: "Unit 7 振动",
    preview: "shm",
    status: "ready",
    summary: "单摆、水平弹簧振子，或复摆 T = 2π√(I/mgd)。",
  },
  {
    slug: "fluid-dynamics",
    title: "流体孔流",
    formula: "v = √(2gh)",
    course: "p1",
    unit: "Unit 8 流体",
    preview: "fluids",
    status: "ready",
    summary: "托里拆利单孔，或三孔罐比较射程与孔高。R = 2√(h · y孔)。",
  },
  {
    slug: "archimedes",
    title: "阿基米德原理",
    formula: "F_b = ρVg",
    course: "p1",
    unit: "Unit 8 流体",
    preview: "archimedes",
    status: "ready",
    summary: "用浮力测定液体密度。",
  },
  {
    slug: "boyles-law",
    title: "玻意耳定律",
    formula: "P V = 常数",
    course: "p2",
    unit: "Unit 9 热力学",
    preview: "boyle",
    status: "ready",
    summary: "等温压缩注射器：P-V 为双曲线，图线下面积即气体做功。",
  },
  {
    slug: "thermal-conductivity",
    title: "热导率",
    formula: "H = kA ΔT / L",
    course: "p2",
    unit: "Unit 9 热力学",
    preview: "thermal",
    status: "ready",
    summary: "单棒测热流，或对照两种材料的热导率。H = kA ΔT / L。",
  },
  {
    slug: "electric-field",
    title: "电场与电势",
    formula: "E = kq / r²",
    course: "p2",
    courses: P2_AND_C,
    unit: "Unit 10 电场与电势",
    unitByCourse: { "c-em": "Unit 8 电荷、电场与高斯定理" },
    preview: "coulomb",
    status: "ready",
    summary: "点电荷、电偶极、高斯球面或悬挂库仑：E = kQ/r²，∮E·dA = Q/ε₀。",
  },
  {
    slug: "resistor-circuits",
    title: "电阻电路",
    formula: "ΣV = 0, ΣI = 0",
    course: "p2",
    courses: P2_AND_C,
    unit: "Unit 11 电路",
    preview: "resistor",
    status: "ready",
    summary: "串并联电路中的基尔霍夫结点与回路规则。",
  },
  {
    slug: "rc-circuits",
    title: "RC 电路",
    formula: "τ = RC",
    course: "p2",
    courses: P2_AND_C,
    unit: "Unit 11 电路",
    preview: "rc",
    status: "ready",
    summary: "电容充放电。微分方程 dQ/dt + Q/RC = ε/R，开始近似短路，稳态近似断路。",
  },
  {
    slug: "magnetism",
    title: "磁场",
    formula: "B = μ₀I / 2πr",
    course: "p2",
    courses: P2_AND_C,
    unit: "Unit 12 磁与电磁",
    unitByCourse: { "c-em": "Unit 12 磁场与电磁" },
    preview: "magnetism",
    status: "ready",
    summary: "长直导线、条形磁铁，或螺线管 B = μ₀ n I，由 B-nI 斜率测 μ₀。",
  },
  {
    slug: "electromagnetic-induction",
    title: "电磁感应",
    formula: "ε = −N dΦ_B/dt",
    course: "p2",
    courses: P2_AND_C,
    unit: "Unit 12 磁与电磁",
    unitByCourse: { "c-em": "Unit 13 电磁感应" },
    preview: "induction",
    status: "ready",
    summary: "磁铁穿线圈，或导轨滑动杆：ε = −N dΦ/dt 与 ε = Bℓv。",
  },
  {
    slug: "geometric-optics",
    title: "薄透镜焦距",
    formula: "1/f = 1/s + 1/s′",
    course: "p2",
    unit: "Unit 13 几何光学",
    preview: "optics",
    status: "ready",
    summary: "凸透镜或凹透镜：测物距、像距，用透镜方程求焦距。",
  },
  {
    slug: "waves-optics",
    title: "波与物理光学",
    formula: "v = fλ",
    course: "p2",
    unit: "Unit 14 波与物理光学",
    preview: "waves",
    status: "ready",
    summary: "弦驻波 λ = 2L/n，或双缝亮纹间距 Δy = λL/d。",
  },
  {
    slug: "particle-model-of-light",
    title: "光的粒子模型",
    formula: "E = hf",
    course: "p2",
    unit: "Unit 15 近代物理",
    preview: "photon",
    status: "ready",
    summary: "LED 阈值 eV = hf，或光电效应 K_max = hf − φ。",
  },
  {
    slug: "rotational-inertia",
    title: "转动惯量测定",
    formula: "I = ∫ r² dm",
    course: "c-mech",
    unit: "Unit 5 力矩与转动动力学",
    preview: "inertia",
    status: "ready",
    summary: "悬挂砝码带动盘、环或杆。比较 I = ∫ r² dm 与 I = τ/α。",
  },
  {
    slug: "rotation-n2",
    title: "转动的牛顿第二定律",
    formula: "τ = Iα",
    course: "c-mech",
    unit: "Unit 5 力矩与转动动力学",
    preview: "n2rot",
    status: "ready",
    summary: "已知力矩作用在转轴上，测角加速度，检验 τ = Iα。",
  },
  {
    slug: "ballistic-pendulum",
    title: "弹道摆",
    formula: "mv = (M+m)V",
    course: "c-mech",
    unit: "Unit 4 线动量",
    preview: "ballistic",
    status: "ready",
    summary: "非弹性碰撞后摆上升。由高度反推弹丸速度。",
  },
  {
    slug: "physical-pendulum",
    title: "复摆",
    formula: "T = 2π√(I / mgd)",
    course: "c-mech",
    unit: "Unit 7 振动",
    preview: "physical-pendulum",
    status: "ready",
    summary: "均匀米尺绕可移支点摆动。I = I_cm + md²。",
  },
  {
    slug: "equipotential",
    title: "等势线与电场",
    formula: "E = −∇V",
    course: "c-em",
    unit: "Unit 9 电势",
    preview: "equipotential",
    status: "ready",
    summary: "测绘等势线。电场垂直于等势线，E = −dV/dr。",
  },
  {
    slug: "coulombs-law",
    title: "库仑定律",
    formula: "F = kq₁q₂ / r²",
    course: "c-em",
    unit: "Unit 8 电荷、电场与高斯定理",
    preview: "coulomb",
    status: "ready",
    summary: "两带电小球悬挂，由张角求电荷量。",
  },
  {
    slug: "capacitance",
    title: "电容与电介质",
    formula: "C = κε₀A / d",
    course: "c-em",
    unit: "Unit 10 导体与电容",
    preview: "capacitance",
    status: "ready",
    summary: "平行板电容随间距、面积和电介质变化。U = ½CV²。",
  },
  {
    slug: "rl-circuits",
    title: "RL / LC 电路",
    formula: "τ = L/R",
    course: "c-em",
    unit: "Unit 13 电磁感应",
    preview: "rl",
    status: "ready",
    summary: "电感电流按 τ = L/R 增长，LC 对照简谐运动 ω = 1/√(LC)。",
  },
  {
    slug: "solenoid",
    title: "螺线管测定 μ₀",
    formula: "B = μ₀ n I",
    course: "c-em",
    unit: "Unit 12 磁场与电磁",
    preview: "solenoid",
    status: "ready",
    summary: "测 B 与 nI，由斜率得到真空磁导率。",
  },
];

export function experimentCourses(item: ExperimentEntry): CourseId[] {
  return item.courses ? [...item.courses] : [item.course];
}

export function experimentUnit(item: ExperimentEntry, course: CourseId) {
  return item.unitByCourse?.[course] ?? item.unit;
}

export function parseCourseFilter(value: string | undefined): CourseFilter {
  if (
    value === "p1" ||
    value === "p2" ||
    value === "c-mech" ||
    value === "c-em"
  ) {
    return value;
  }
  return "all";
}

export function listExperiments(filter: CourseFilter = "all"): ExperimentEntry[] {
  if (filter === "all") {
    return [...EXPERIMENTS];
  }
  return EXPERIMENTS.filter((item) => experimentCourses(item).includes(filter)).map(
    (item) => ({ ...item, unit: experimentUnit(item, filter) }),
  );
}

export function listCatalogGroups(filter: CourseFilter = "all"): {
  course: CourseId;
  title: string;
  experiments: ExperimentEntry[];
}[] {
  const sections =
    filter === "all"
      ? COURSE_SECTIONS
      : COURSE_SECTIONS.filter((section) => section.id === filter);
  return sections.map((section) => ({
    course: section.id,
    title: section.title,
    experiments: EXPERIMENTS.filter((item) => experimentCourses(item).includes(section.id)).map(
      (item) => ({ ...item, unit: experimentUnit(item, section.id) }),
    ),
  }));
}

export function clusterByP1Unit(experiments: readonly ExperimentEntry[]) {
  return P1_CED_UNITS.map((unit) => ({
    unit,
    experiments: experiments.filter((item) => item.unit === unit.title),
  })).filter((group) => group.experiments.length > 0);
}

export function clusterByP2Unit(experiments: readonly ExperimentEntry[]) {
  return P2_CED_UNITS.map((unit) => ({
    unit,
    experiments: experiments.filter((item) => item.unit === unit.title),
  })).filter((group) => group.experiments.length > 0);
}

export function clusterByCMechUnit(experiments: readonly ExperimentEntry[]) {
  return C_MECH_CED_UNITS.map((unit) => ({
    unit,
    experiments: experiments.filter((item) => item.unit === unit.title),
  })).filter((group) => group.experiments.length > 0);
}

export function clusterByCEmUnit(experiments: readonly ExperimentEntry[]) {
  return C_EM_CED_UNITS.map((unit) => ({
    unit,
    experiments: experiments.filter((item) => item.unit === unit.title),
  })).filter((group) => group.experiments.length > 0);
}

export function getExperiment(slug: string): ExperimentEntry | undefined {
  return EXPERIMENTS.find((item) => item.slug === slug);
}

export function isReadyExperiment(
  experiment: ExperimentEntry,
): experiment is ExperimentEntry & { slug: ReadySlug; status: "ready" } {
  return experiment.status === "ready";
}

export function experimentHref(slug: ReadySlug): string {
  return `/labs/${slug}`;
}

export function listExperimentSlugs(): ReadySlug[] {
  return EXPERIMENTS.filter(isReadyExperiment).map(
    (item) => item.slug as ReadySlug,
  );
}
