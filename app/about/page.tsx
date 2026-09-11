import { SiteHeader } from "@/components/catalog/site-header";
import { P1_CED_UNITS } from "@/lib/experiments/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
  description: "Physics Lab 按 AP Physics 1 考纲单元排列可交互实验台。",
};

const COVERAGE = [
  { unit: "Unit 1", have: "匀变速直线、平抛与斜抛", gap: "实验设计与误差分析仍靠课堂完成" },
  { unit: "Unit 2", have: "水平拉力摩擦、斜面摩擦、阿特伍德、圆周运动", gap: "暂无带质量滑轮" },
  { unit: "Unit 3", have: "弹簧弹射与机械能守恒", gap: "尚无单独的 W = Fd、P = Fv 实验台" },
  { unit: "Unit 4", have: "一维碰撞与爆炸分离", gap: "暂无二维碰撞" },
  { unit: "Unit 5", have: "米尺力矩平衡", gap: "τ = Iα 动力学台仍列在 C 力学等待开发" },
  { unit: "Unit 6", have: "无滑滚动、角动量守恒", gap: "暂无完整过山车/圆环" },
  { unit: "Unit 7", have: "单摆与水平弹簧振子", gap: "" },
  { unit: "Unit 8", have: "托里拆利单孔、三孔罐、阿基米德测密度", gap: "暂无管道连续方程装置" },
];

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[720px] px-5 py-16 md:px-10">
        <h1 className="text-3xl font-medium tracking-tight">关于</h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          Physics Lab 是面向 AP 力学课堂的可交互实验台。首页按 AP Physics 1、Physics 2、C 力学和 C 电磁列出实验。已完成的 Physics 1 实验可点进独立实验台改参数、看受力和运动；Physics 2 与 C 中尚未开发的条目用变暗预览标成等待开发。
        </p>

        <h2 className="mt-12 text-lg font-medium text-ink">AP Physics 1 考纲结构</h2>
        <p className="mt-3 text-sm leading-7 text-quiet">
          现行 Physics 1 有八个单元。选择题大致按下列比例出现。课程要求约四分之一课时用于探究实验。流体属于 Physics 1 第 8 单元；电路、波动和静电属于 Physics 2，不会出现在 Physics 1 实验台里。
        </p>
        <table className="mt-5 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-quiet">
              <th className="py-2 pr-3 font-medium">单元</th>
              <th className="py-2 pr-3 font-medium">英文名称</th>
              <th className="py-2 font-medium">选择题约</th>
            </tr>
          </thead>
          <tbody>
            {P1_CED_UNITS.map((unit) => (
              <tr key={unit.id} className="border-b border-line">
                <td className="py-2 pr-3 text-ink">{unit.title}</td>
                <td className="py-2 pr-3 text-quiet">{unit.english}</td>
                <td className="py-2 font-mono text-xs text-quiet">{unit.weighting}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-12 text-lg font-medium text-ink">本站覆盖与缺口</h2>
        <p className="mt-3 text-sm leading-7 text-quiet">
          下面对照的是实验台内容，不是官方题库。比例数字来自公开的课程框架摘要，页面文字未抄录考纲原文。
        </p>
        <ul className="mt-5 space-y-4 text-sm leading-6">
          {COVERAGE.map((row) => (
            <li key={row.unit}>
              <p className="font-medium text-ink">{row.unit}</p>
              <p className="text-quiet">已有：{row.have}。</p>
              {row.gap ? <p className="text-quiet">缺口：{row.gap}。</p> : null}
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-lg font-medium text-ink">尚未开发的课程</h2>
        <p className="mt-3 text-sm leading-7 text-quiet">
          Physics 2（热力学、电场、电路、磁与电磁、光学、近代物理）以及 Physics C 的微积分实验目前只在目录里占位。C 力学里的阿特伍德机与角动量条目与 Physics 1 已开放的实验分开，避免和代数课程混在同一张实验台里。
        </p>
      </main>
    </div>
  );
}
