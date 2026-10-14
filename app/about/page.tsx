import { SiteHeader } from "@/components/catalog/site-header";
import { C_EM_CED_UNITS, C_MECH_CED_UNITS, P1_CED_UNITS, P2_CED_UNITS } from "@/lib/experiments/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
  description: "Physics Lab 按 AP Physics 1、Physics 2、C 力学与 C 电磁考纲单元排列可交互实验台。",
};

const COVERAGE = [
  { unit: "Unit 1", have: "匀变速直线、平抛与斜抛", gap: "实验设计与误差分析仍靠课堂完成" },
  { unit: "Unit 2", have: "水平拉力摩擦、斜面摩擦、阿特伍德（含滑轮惯量）、圆周运动", gap: "" },
  { unit: "Unit 3", have: "弹簧弹射与机械能守恒；弹簧做功写成 W = ∫ kx dx", gap: "尚无单独的 W = Fd、P = Fv 实验台" },
  { unit: "Unit 4", have: "一维碰撞与爆炸分离", gap: "暂无二维碰撞" },
  { unit: "Unit 5", have: "米尺力矩平衡", gap: "τ = Iα 与转动惯量测定在 C 力学" },
  { unit: "Unit 6", have: "无滑滚动、角动量守恒；I = ∫ r² dm", gap: "完整圆环轨道在 C 力学" },
  { unit: "Unit 7", have: "单摆与水平弹簧振子", gap: "复摆在 C 力学" },
  { unit: "Unit 8", have: "托里拆利单孔、三孔罐、阿基米德测密度", gap: "暂无管道连续方程装置" },
];

const P2_COVERAGE = [
  { unit: "Unit 9", have: "玻意耳定律注射器、导热棒对照", gap: "" },
  { unit: "Unit 10", have: "点电荷、电偶极、高斯球面、悬挂库仑、等势线", gap: "" },
  { unit: "Unit 11", have: "串并联电阻、RC 充放电（含微分方程）", gap: "" },
  { unit: "Unit 12", have: "载流导线、条形磁铁、螺线管、磁铁穿线圈、滑动导轨", gap: "" },
  { unit: "Unit 13", have: "凸透镜与凹透镜光具座", gap: "" },
  { unit: "Unit 14", have: "弦驻波与双缝干涉", gap: "" },
  { unit: "Unit 15", have: "LED 阈值与光电效应", gap: "" },
];

const C_MECH_COVERAGE = [
  { unit: "Unit 1", have: "匀变速、抛体，以及火箭 a = K − Lt²", gap: "" },
  { unit: "Unit 2", have: "摩擦、圆周、阿特伍德（含斜面与滑轮惯量）、变力 F(x)/F(t)、线性/二次阻力", gap: "" },
  { unit: "Unit 3", have: "机械能守恒；变力做功 W = ∫ F dx", gap: "" },
  { unit: "Unit 4", have: "碰撞冲量、F(t)=αt²+βt、弹道摆", gap: "暂无二维碰撞" },
  { unit: "Unit 5", have: "力矩平衡、转动惯量测定、τ = Iα、非均匀杆 I = ∫ x² λ dx", gap: "" },
  { unit: "Unit 6", have: "滚动、滚出平抛、角动量、杆撞小球、圆环轨道 h_min", gap: "" },
  { unit: "Unit 7", have: "单摆、弹簧振子、复摆、扭摆、并联弹簧", gap: "" },
];

const C_EM_COVERAGE = [
  { unit: "Unit 8", have: "点电荷、高斯球面、悬挂库仑定律", gap: "" },
  { unit: "Unit 9", have: "等势线，E = −∇V", gap: "" },
  { unit: "Unit 10", have: "平行板电容与电介质，C = κε₀A/d", gap: "" },
  { unit: "Unit 11", have: "电阻电路、RC 微分方程 dQ/dt + Q/RC = ε/R", gap: "" },
  { unit: "Unit 12", have: "载流导线、条形磁铁、螺线管测定 μ₀", gap: "" },
  { unit: "Unit 13", have: "电磁感应、RL / LC 电路", gap: "" },
];

function UnitTable({
  units,
}: {
  units: readonly { title: string; english: string; weighting: string }[];
}) {
  return (
    <>
      <div className="mt-5 grid gap-2 sm:hidden">
        {units.map((unit) => (
          <div key={unit.title} className="rounded-[8px] border border-line bg-surface px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-ink">{unit.title}</p>
              <p className="shrink-0 font-mono text-xs text-quiet">{unit.weighting}</p>
            </div>
            <p className="mt-1 text-xs leading-5 text-quiet">{unit.english}</p>
          </div>
        ))}
      </div>
      <table className="mt-5 hidden w-full border-collapse text-left text-sm sm:table">
        <thead>
          <tr className="border-b border-line text-xs text-quiet">
            <th className="py-2 pr-3 font-medium">单元</th>
            <th className="py-2 pr-3 font-medium">英文名称</th>
            <th className="py-2 font-medium">选择题约</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.title} className="border-b border-line">
              <td className="py-2 pr-3 text-ink">{unit.title}</td>
              <td className="py-2 pr-3 text-quiet">{unit.english}</td>
              <td className="py-2 font-mono text-xs text-quiet">{unit.weighting}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function CoverageList({
  rows,
}: {
  rows: { unit: string; have: string; gap: string }[];
}) {
  return (
    <ul className="mt-5 space-y-4 text-sm leading-6">
      {rows.map((row) => (
        <li key={row.unit}>
          <p className="font-medium text-ink">{row.unit}</p>
          <p className="text-quiet">已有：{row.have}。</p>
          {row.gap ? <p className="text-quiet">缺口：{row.gap}。</p> : null}
        </li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[720px] px-5 py-16 md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">Project note · 2026</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">关于 Physics Lab</h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          Physics Lab 是一个面向 AP 物理学习的交互式可视化实验平台。项目把参数控制、物理公式、三维装置、受力标注、实时读数和时间图放进同一个实验台，让学生通过改变条件观察运动、电磁、流体、热学、波动、光学与近代物理模型的响应。
        </p>
        <p className="mt-3 text-sm leading-7 text-quiet">
          首页按 AP Physics 1、Physics 2、C 力学和 C 电磁列出 40 个独立实验条目。C 力学与 C 电磁中与 1、2 重合的实验共用同一张实验台；考纲要求而代数课程没有的内容（滑轮惯量、高斯定理、电容、螺线管、RL 等）补在对应实验台或独立条目里。
        </p>

        <section className="mt-10 border-y border-line py-7">
          <h2 className="text-lg font-medium text-ink">项目目标</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-quiet">
            <li>把课程单元转化为可浏览、可操作的实验目录。</li>
            <li>让场景、公式、页头读数和时间图描述同一个时刻。</li>
            <li>展示摩擦切换、绳松弛、脱轨等边界状态，而不只播放理想动画。</li>
            <li>同时支持桌面三栏实验台和窄屏场景优先布局。</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-ink">设计与架构</h2>
          <p className="mt-3 text-sm leading-7 text-quiet">
            系统使用 Next.js、React、TypeScript 与 Three.js。课程和路由层管理课程、单元与实验 slug；模型层提供闭式解、状态机和数值积分；实验台层组合参数、公式、读数与图表；场景层只消费模型输出的 sample，不维护另一套物理状态。
          </p>
          <p className="mt-3 text-sm leading-7 text-quiet">
            视觉采用海军蓝、金色与冷灰构成的仪器式界面。受力箭头、轨迹和引线负责解释关系，目录预览则主动减少标签，避免在小画布中堆积信息。模型内部保持浮点精度，学生可见数值统一为两位小数。
          </p>
        </section>

        <section className="mt-10 rounded-[10px] border border-line bg-surface p-5">
          <h2 className="text-lg font-medium text-ink">验证与项目资料</h2>
          <p className="mt-3 text-sm leading-7 text-quiet">
            项目通过模型单元测试、React/TypeScript lint、Next.js production build 和多尺寸浏览器检查验证。测试重点覆盖守恒关系、临界条件、数值积分、图表范围和目录数据。
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a
              className="font-medium text-blue transition-colors hover:text-ink"
              href="https://github.com/Bruceeeg/Physics-Lab/blob/main/docs/physics-lab-project-report.md"
              rel="noreferrer"
              target="_blank"
            >
              阅读完整项目报告 ↗
            </a>
            <a
              className="font-medium text-blue transition-colors hover:text-ink"
              href="https://github.com/Bruceeeg/Physics-Lab"
              rel="noreferrer"
              target="_blank"
            >
              查看源代码仓库 ↗
            </a>
          </div>
        </section>

        <h2 className="mt-12 text-lg font-medium text-ink">AP Physics 1 考纲结构</h2>
        <p className="mt-3 text-sm leading-7 text-quiet">
          现行 Physics 1 有八个单元。选择题大致按下列比例出现。课程要求约四分之一课时用于探究实验。流体属于 Physics 1 第 8 单元；电路、波动和静电属于 Physics 2，不会出现在 Physics 1 实验台里。
        </p>
        <UnitTable units={P1_CED_UNITS} />

        <h2 className="mt-12 text-lg font-medium text-ink">AP Physics 2 考纲结构</h2>
        <p className="mt-3 text-sm leading-7 text-quiet">
          现行 Physics 2 有七个单元（本站沿用与 Physics 1 衔接的 Unit 9-15 编号）。电路、电场、波动和近代物理在这里，不在 Physics 1。
        </p>
        <UnitTable units={P2_CED_UNITS} />

        <h2 className="mt-12 text-lg font-medium text-ink">AP Physics C 力学考纲结构</h2>
        <p className="mt-3 text-sm leading-7 text-quiet">
          C 力学七个单元与 Physics 1 的 1–7 对应，但不含流体。权重不同，例如力与平动动力学约占 20%–25%。实验台使用微积分写法，如 I = ∫ r² dm、W = ∫ kx dx。
        </p>
        <UnitTable units={C_MECH_CED_UNITS} />

        <h2 className="mt-12 text-lg font-medium text-ink">AP Physics C 电磁考纲结构</h2>
        <p className="mt-3 text-sm leading-7 text-quiet">
          C 电磁六个单元从电荷与高斯定理到电磁感应。光学与近代物理不属于本课程。
        </p>
        <UnitTable units={C_EM_CED_UNITS} />

        <h2 className="mt-12 text-lg font-medium text-ink">本站覆盖与缺口</h2>
        <p className="mt-3 text-sm leading-7 text-quiet">
          下面对照的是实验台内容，不是官方题库。比例数字来自公开的课程框架摘要，页面文字未抄录考纲原文。
        </p>
        <p className="mt-8 text-sm font-medium text-ink">Physics 1</p>
        <CoverageList rows={COVERAGE} />
        <p className="mt-8 text-sm font-medium text-ink">Physics 2</p>
        <CoverageList rows={P2_COVERAGE} />
        <p className="mt-8 text-sm font-medium text-ink">C 力学</p>
        <CoverageList rows={C_MECH_COVERAGE} />
        <p className="mt-8 text-sm font-medium text-ink">C 电磁</p>
        <CoverageList rows={C_EM_COVERAGE} />
      </main>
    </div>
  );
}
