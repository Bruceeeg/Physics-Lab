"use client";

import { PREDICTION_G, type PredictionState } from "@/lib/models/projectile-prediction";

function formatNumber(value: number) {
  return value.toFixed(2);
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}`;
}

// What a real bench gives the student: heights, angles, and where the ball
// landed. No live charts here; they would expose v0 before the check.
export function ProjectileMeasurementBoard({ state }: { state: PredictionState }) {
  const rows: [string, string, string][] = [
    ["h", "发射高度", `${formatNumber(state.h)} m`],
    ["θ", "发射角", `${state.thetaDeg.toFixed(0)} °`],
    ["g", "重力加速度", `${formatNumber(PREDICTION_G)} m/s²`],
    ["R", "落点", state.lastLandingX !== null ? `${formatNumber(state.lastLandingX)} m` : "—"],
  ];
  if (state.phase !== "measure") {
    rows.push([
      "x̂",
      "预测落点",
      state.xPredicted !== null ? `${formatNumber(state.xPredicted)} m` : "—",
    ]);
    rows.push(["x", "实际落点", state.outcome ? `${formatNumber(state.outcome.landingX)} m` : "—"]);
    rows.push(["Δx", "偏差", state.outcome ? `${formatSigned(state.outcome.deltaX)} m` : "—"]);
  }

  return (
    <section className="flex h-full flex-col border border-line bg-surface">
      <div className="flex h-8 items-center justify-between border-b border-line px-2.5">
        <h2 className="text-xs font-medium text-ink">测量板</h2>
        <p className="font-mono text-[10px] text-quiet">真实实验只能量到这些</p>
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
      <p className="mt-auto border-t border-line px-2.5 py-2 text-[11px] leading-4 text-quiet">
        落地判定后，这里换成 x、y、vₓ、vᵧ 四张运动学图。
      </p>
    </section>
  );
}
