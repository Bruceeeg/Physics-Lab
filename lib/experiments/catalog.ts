export type ReadySlug = "pull-friction" | "linear-motion";

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
  unit: string;
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

export const EXPERIMENTS: readonly ExperimentEntry[] = [
  {
    slug: "pull-friction",
    title: "斜向拉力实验台",
    formula: "N = mg − |F|sinθ",
    course: "p1",
    unit: "Unit 2 力与平动",
    preview: "pull-friction",
    status: "ready",
    summary: "水平面上斜向拉力与摩擦：可配置 F、θ、m、μs、μk、g。",
  },
  {
    slug: "linear-motion",
    title: "匀变速直线运动",
    formula: "x = x₀ + v₀t + ½at²",
    course: "p1",
    unit: "Unit 1 运动学",
    preview: "linear-motion",
    status: "ready",
    summary: "调节初位置、初速度与加速度，观察匀变速直线运动。",
  },
  {
    slug: "circular-motion",
    title: "圆周运动",
    formula: "T = 2π√(r cosθ / g)",
    course: "p1",
    unit: "Unit 2 力与平动",
    preview: "circular",
    status: "pending",
    summary: "圆锥摆：用摆长和张角预测周期。",
  },
  {
    slug: "conservation-of-energy",
    title: "机械能守恒",
    formula: "½kx² = mgy",
    course: "p1",
    unit: "Unit 3 功、能、功率",
    preview: "energy",
    status: "pending",
    summary: "弹簧小车冲上斜面，比较弹性势能与重力势能。",
  },
  {
    slug: "impulse-momentum",
    title: "冲量与动量",
    formula: "J = Δp = FΔt",
    course: "p1",
    unit: "Unit 4 线动量",
    preview: "momentum",
    status: "pending",
    summary: "小车碰撞：由 F–t 图求冲量，检验动量守恒。",
  },
  {
    slug: "harmonic-motion",
    title: "简谐运动",
    formula: "T = 2π√(L/g)",
    course: "p1",
    unit: "Unit 7 振动",
    preview: "shm",
    status: "pending",
    summary: "单摆周期与长度、质量、振幅的关系。",
  },
  {
    slug: "rotational-motion",
    title: "滚动与转动",
    formula: "v = √(2mgh / (m + I/r²))",
    course: "p1",
    unit: "Unit 5 力矩与转动",
    preview: "rotation",
    status: "pending",
    summary: "不同形状沿斜面无滑滚动，比较底端平动速度。",
  },
  {
    slug: "fluid-dynamics",
    title: "流体孔流",
    formula: "v = √(2gh)",
    course: "p1",
    unit: "Unit 8 流体",
    preview: "fluids",
    status: "pending",
    summary: "液面深度与底部小孔出流速率。",
  },
  {
    slug: "atwood-machine",
    title: "阿特伍德机",
    formula: "a = gΔm / (m₁ + m₂)",
    course: "p1",
    unit: "Unit 2 力与平动",
    preview: "atwood",
    status: "pending",
    summary: "总质量、质量差与加速度的关系。",
  },
  {
    slug: "projectile-motion",
    title: "抛体落点",
    formula: "x = v₀t, y = ½gt²",
    course: "p1",
    unit: "Unit 1 运动学",
    preview: "projectile",
    status: "pending",
    summary: "平抛或斜抛，先测初速度再预测落点。",
  },
  {
    slug: "angular-momentum",
    title: "角动量守恒",
    formula: "I₁ω₁ = I₂ω₂",
    course: "p1",
    unit: "Unit 6 转动系统",
    preview: "angmom",
    status: "pending",
    summary: "落物到转盘后检验角动量是否守恒。",
  },
  {
    slug: "archimedes",
    title: "阿基米德原理",
    formula: "F_b = ρVg",
    course: "p1",
    unit: "Unit 8 流体",
    preview: "archimedes",
    status: "pending",
    summary: "用浮力测定液体密度。",
  },
  {
    slug: "boyles-law",
    title: "玻意耳定律",
    formula: "P V = 常数",
    course: "p2",
    unit: "Unit 9 热力学",
    preview: "boyle",
    status: "pending",
    summary: "封闭气体的 P–V 关系，图线下面积即气体做功。",
  },
  {
    slug: "resistor-circuits",
    title: "电阻电路",
    formula: "ΣV = 0, ΣI = 0",
    course: "p2",
    unit: "Unit 11 电路",
    preview: "resistor",
    status: "pending",
    summary: "串并联电路中的基尔霍夫结点与回路规则。",
  },
  {
    slug: "rc-circuits",
    title: "RC 电路",
    formula: "τ = RC",
    course: "p2",
    unit: "Unit 11 电路",
    preview: "rc",
    status: "pending",
    summary: "电容充放电：开始近似短路，稳态近似断路。",
  },
  {
    slug: "magnetism",
    title: "磁场",
    formula: "B = μ₀I / 2πr",
    course: "p2",
    unit: "Unit 12 磁与电磁",
    preview: "magnetism",
    status: "pending",
    summary: "条形磁铁、载流导线和地磁场的方向与大小。",
  },
  {
    slug: "electromagnetic-induction",
    title: "电磁感应",
    formula: "ε = −N dΦ_B/dt",
    course: "p2",
    unit: "Unit 12 磁与电磁",
    preview: "induction",
    status: "pending",
    summary: "磁铁与线圈相对运动时的感应电动势。",
  },
  {
    slug: "geometric-optics",
    title: "薄透镜焦距",
    formula: "1/f = 1/s + 1/s′",
    course: "p2",
    unit: "Unit 13 几何光学",
    preview: "optics",
    status: "pending",
    summary: "测物距、像距，用透镜方程求焦距。",
  },
  {
    slug: "particle-model-of-light",
    title: "光的粒子模型",
    formula: "E = hf",
    course: "p2",
    unit: "Unit 15 近代物理",
    preview: "photon",
    status: "pending",
    summary: "LED 阈值电压与频率，对应光电效应。",
  },
  {
    slug: "electric-field",
    title: "电场与电势",
    formula: "E = kq / r²",
    course: "p2",
    unit: "Unit 10 电场与电势",
    preview: "coulomb",
    status: "pending",
    summary: "点电荷的电场与等势线。",
  },
  {
    slug: "waves-optics",
    title: "波与物理光学",
    formula: "v = fλ",
    course: "p2",
    unit: "Unit 14 波与物理光学",
    preview: "waves",
    status: "pending",
    summary: "声速、驻波或双缝衍射。",
  },
  {
    slug: "thermal-conductivity",
    title: "热导率",
    formula: "H = kA ΔT / L",
    course: "p2",
    unit: "Unit 9 热力学",
    preview: "thermal",
    status: "pending",
    summary: "比较材料两端温差，测定或对照热导率。",
  },
  {
    slug: "c-atwood",
    title: "阿特伍德机",
    formula: "a = gΔm / (m₁ + m₂)",
    course: "c-mech",
    unit: "Unit 2 力与平动",
    preview: "atwood",
    status: "pending",
    summary: "用运动学求加速度，作图检验牛顿第二定律。",
  },
  {
    slug: "rotational-inertia",
    title: "转动惯量测定",
    formula: "I = ∫ r² dm",
    course: "c-mech",
    unit: "Unit 5 力矩与转动",
    preview: "inertia",
    status: "pending",
    summary: "预测并验证杆、盘、环的转动惯量。",
  },
  {
    slug: "rotation-n2",
    title: "转动的牛顿第二定律",
    formula: "τ = Iα",
    course: "c-mech",
    unit: "Unit 5 力矩与转动",
    preview: "n2rot",
    status: "pending",
    summary: "对转轴施加已知力矩，测角加速度。",
  },
  {
    slug: "ballistic-pendulum",
    title: "弹道摆",
    formula: "mv = (M+m)V",
    course: "c-mech",
    unit: "Unit 4 线动量",
    preview: "ballistic",
    status: "pending",
    summary: "由摆的上升高度反推弹丸发射速度。",
  },
  {
    slug: "c-angular-momentum",
    title: "角动量守恒",
    formula: "I₁ω₁ = I₂ω₂",
    course: "c-mech",
    unit: "Unit 6 转动系统",
    preview: "angmom",
    status: "pending",
    summary: "落物到转盘，写出 I 的积分表达式。",
  },
  {
    slug: "physical-pendulum",
    title: "复摆",
    formula: "T = 2π√(I / mgd)",
    course: "c-mech",
    unit: "Unit 7 振动",
    preview: "physical-pendulum",
    status: "pending",
    summary: "由配重米尺的周期求转动惯量。",
  },
  {
    slug: "equipotential",
    title: "等势线与电场",
    formula: "E = −∇V",
    course: "c-em",
    unit: "Unit 1 静电学",
    preview: "equipotential",
    status: "pending",
    summary: "导电纸测绘等势线，场垂直于等势线。",
  },
  {
    slug: "coulombs-law",
    title: "库仑定律",
    formula: "F = kq₁q₂ / r²",
    course: "c-em",
    unit: "Unit 1 静电学",
    preview: "coulomb",
    status: "pending",
    summary: "两带电小球悬挂，由张角求电荷量。",
  },
  {
    slug: "capacitance",
    title: "电容与电介质",
    formula: "C = κε₀A / d",
    course: "c-em",
    unit: "Unit 2 导体与电容",
    preview: "capacitance",
    status: "pending",
    summary: "极板间距、面积和电介质如何改变电容。",
  },
  {
    slug: "ohms-law",
    title: "欧姆定律与直流电路",
    formula: "V = IR",
    course: "c-em",
    unit: "Unit 3 电路",
    preview: "ohm",
    status: "pending",
    summary: "测 V–I 关系，分析串并联电流电压分配。",
  },
  {
    slug: "c-rc-circuits",
    title: "RC 时间常数",
    formula: "τ = RC",
    course: "c-em",
    unit: "Unit 3 电路",
    preview: "rc",
    status: "pending",
    summary: "用微分方程写充放电的 I(t)、V(t)。",
  },
  {
    slug: "rl-circuits",
    title: "RL / LC 电路",
    formula: "τ = L/R",
    course: "c-em",
    unit: "Unit 5 电磁感应",
    preview: "rl",
    status: "pending",
    summary: "电感电路的时间常数，LC 对照简谐运动。",
  },
  {
    slug: "solenoid",
    title: "螺线管测定 μ₀",
    formula: "B = μ₀ n I",
    course: "c-em",
    unit: "Unit 4 磁场",
    preview: "solenoid",
    status: "pending",
    summary: "测 B 与 nI，由斜率得到真空磁导率。",
  },
  {
    slug: "faraday-lenz",
    title: "法拉第定律与楞次定律",
    formula: "ε = −dΦ_B/dt",
    course: "c-em",
    unit: "Unit 5 电磁感应",
    preview: "induction",
    status: "pending",
    summary: "磁通量变化决定感应电动势的大小和方向。",
  },
];

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
  return EXPERIMENTS.filter((item) => item.course === filter);
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
    experiments: EXPERIMENTS.filter((item) => item.course === section.id),
  }));
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
