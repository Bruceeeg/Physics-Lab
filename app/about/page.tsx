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
  { unit: "Unit 6", have: "无滑滚动、角动量守恒；I = ∫ r² dm", gap: "暂无完整过山车/圆环" },
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
  { unit: "Unit 1", have: "与 Physics 1 共用匀变速与抛体", gap: "" },
  { unit: "Unit 2", have: "摩擦、圆周运动、阿特伍德滑轮惯量 I = ½MR²", gap: "" },
  { unit: "Unit 3", have: "机械能守恒，弹簧做功 W = ∫ kx dx = ½kA²", gap: "" },
  { unit: "Unit 4", have: "碰撞冲量，以及弹道摆", gap: "暂无二维碰撞" },
  { unit: "Unit 5", have: "力矩平衡、转动惯量测定、τ = Iα", gap: "" },
  { unit: "Unit 6", have: "滚动与角动量；I = ∫ r² dm", gap: "暂无完整过山车" },
  { unit: "Unit 7", have: "单摆、弹簧振子与复摆", gap: "" },
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
    <table className="mt-5 w-full border-collapse text-left text-sm">
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
        <h1 className="text-3xl font-medium tracking-tight">关于</h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          Physics Lab 是面向 AP 物理课堂的可交互实验台。首页按 AP Physics 1、Physics 2、C 力学和 C 电磁列出实验。C 力学与 C 电磁中与 1、2 重合的实验共用同一张实验台；考纲要求而代数课程没有的内容（滑轮惯量、高斯定理、电容、螺线管、RL 等）补在对应实验台或独立条目里。
        </p>

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
