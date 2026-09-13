"use client";

import { formatLabNumber, formatLabSigned } from "@/lib/models/lab-format";
import { PREDICTION_G, type PredictionState } from "@/lib/models/projectile-prediction";
import { sampleAt, type ProjectileSample } from "@/lib/models/projectile";

function formatNumber(value: number) {
  return formatLabNumber(value);
}

function formatSigned(value: number) {
  return formatLabSigned(value);
}

export function ProjectileMeasurementBoard({
  state,
  sample,
}: {
  state: PredictionState;
  sample: ProjectileSample;
}) {
  const rows: [string, string, string][] = [
    ["h", "发射高度", `${formatNumber(state.h)} m`],
    ["θ", "发射角", `${formatNumber(state.thetaDeg)} °`],
    ["v₀", "初速度", `${formatNumber(state.v0)} m/s`],
    ["g", "重力加速度", `${formatNumber(PREDICTION_G)} m/s²`],
    ["x̂", "预估落点", state.xPredicted !== null ? `${formatNumber(state.xPredicted)} m` : "—"],
    ["R", "测量落点", state.lastLandingX !== null ? `${formatNumber(state.lastLandingX)} m` : "—"],
    ["K", "动能", `${formatNumber(sample.K)} J`],
    ["U", "重力势能", `${formatNumber(sample.U)} J`],
    ["E", "机械能", `${formatNumber(sample.E)} J`],
  ];
  if (state.outcome) {
    rows.push(["Δx", "偏差", `${formatSigned(state.outcome.deltaX)} m`]);
  }

  return (
    <section className="flex h-full flex-col border border-line bg-surface">
      <div className="flex h-8 items-center justify-between border-b border-line px-2.5">
        <h2 className="text-xs font-medium text-ink">测量板</h2>
        <p className="font-mono text-[10px] text-quiet">对照预估落点，误差 ≤ 1%</p>
      </div>
      <dl className="divide-y divide-line font-mono text-[12px] tabular-nums">
        {rows.map(([symbol, label, value]) => (
          <div key={symbol} className="flex items-center justify-between px-2.5 py-2">
            <dt className="text-quiet">
              <span className="text-ink">{symbol}</span>
              <span className="ml-2">{label}</span>
            </dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <p
        role="status"
        className={`mt-auto border-t border-line px-2.5 py-3 text-[16px] font-medium ${
          state.outcome
            ? state.outcome.hit
              ? "text-emerald-700"
              : "text-red-700"
            : "text-quiet"
        }`}
      >
        {state.outcome
          ? state.outcome.hit
            ? "正确"
            : "失败"
          : state.lastLandingX !== null
            ? "已落地，等待对照"
            : "发射后在此读出落点，并与预估值对照"}
      </p>
    </section>
  );
}
