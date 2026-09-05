"use client";

import { useState } from "react";

import { ParameterControl } from "@/components/parameter-control";
import {
  PREDICTION_G,
  PREDICTION_H_MAX,
  PREDICTION_H_MIN,
  PREDICTION_THETA_MAX,
  PREDICTION_THETA_MIN,
  type PredictionPhase,
  type PredictionState,
} from "@/lib/models/projectile-prediction";

const STEPS: { phase: PredictionPhase; label: string }[] = [
  { phase: "measure", label: "1 测初速度" },
  { phase: "predict", label: "2 预测落点" },
  { phase: "result", label: "3 结果" },
];

function formatNumber(value: number) {
  return value.toFixed(2);
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}`;
}

function StepBar({ phase }: { phase: PredictionPhase }) {
  const current = STEPS.findIndex((step) => step.phase === phase);
  return (
    <ol className="grid grid-cols-3 border-b border-line text-[11px]" aria-label="预测步骤">
      {STEPS.map((step, index) => (
        <li
          key={step.phase}
          aria-current={index === current ? "step" : undefined}
          className={`px-2 py-1.5 text-center ${
            index === current
              ? "bg-navy font-medium text-white"
              : index < current
                ? "text-ink"
                : "text-quiet"
          }`}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}

function ReadOnlyRow({ symbol, label, value }: { symbol: string; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 px-1 py-0.5 text-[13px]">
      <p className="min-w-0 truncate text-quiet">
        <span className="font-mono text-ink">{symbol}</span>
        <span className="ml-1.5">{label}</span>
      </p>
      <p className="font-mono tabular-nums text-ink">{value}</p>
    </div>
  );
}

// Student inputs commit on Enter or the button, never on blur: a half-typed
// prediction must not place a target.
function NumberEntry({
  id,
  label,
  unit,
  buttonLabel,
  onSubmit,
}: {
  id: string;
  label: string;
  unit: string;
  buttonLabel: string;
  onSubmit: (value: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const parsed = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(parsed)) {
      return;
    }
    onSubmit(parsed);
  };
  return (
    <div className="px-1 py-1">
      <label htmlFor={id} className="block text-[12px] text-quiet">
        {label} <span className="font-mono">({unit})</span>
      </label>
      <div className="mt-1 flex gap-1.5">
        <input
          id={id}
          type="number"
          step={0.01}
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="h-8 min-w-0 flex-1 border border-line bg-surface px-2 font-mono text-[13px] tabular-nums text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
        />
        <button
          type="button"
          onClick={submit}
          className="h-8 cursor-pointer bg-navy px-3 text-[12px] font-medium text-white hover:opacity-90"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export function ProjectilePredictionPanel({
  state,
  onHeightChange,
  onThetaChange,
  onSubmitEstimate,
  onPlaceTarget,
  onRetry,
  onNewDataset,
}: {
  state: PredictionState;
  onHeightChange: (h: number) => void;
  onThetaChange: (thetaDeg: number) => void;
  onSubmitEstimate: (v0: number) => void;
  onPlaceTarget: (x: number) => void;
  onRetry: () => void;
  onNewDataset: () => void;
}) {
  const estimateRejected =
    state.phase === "measure" && state.v0Estimate !== null && !state.v0Accepted;

  return (
    <>
      <StepBar phase={state.phase} />

      <div className="space-y-1 px-1.5 py-1.5">
        {state.phase !== "result" ? (
          <ParameterControl
            id="prediction-h"
            label="发射高度"
            symbol="h"
            unit="m"
            value={state.h}
            min={PREDICTION_H_MIN}
            max={PREDICTION_H_MAX}
            step={0.05}
            onChange={onHeightChange}
          />
        ) : null}
        {state.phase === "predict" ? (
          <ParameterControl
            id="prediction-theta"
            label="发射角"
            symbol="θ"
            unit="°"
            value={state.thetaDeg}
            min={PREDICTION_THETA_MIN}
            max={PREDICTION_THETA_MAX}
            step={1}
            onChange={onThetaChange}
          />
        ) : null}
        {state.phase === "measure" ? (
          <>
            <ReadOnlyRow symbol="θ" label="发射角（锁定）" value="0 °" />
            <ReadOnlyRow symbol="g" label="重力加速度" value={`${formatNumber(PREDICTION_G)} m/s²`} />
            <ReadOnlyRow symbol="v₀" label="初速度" value="?" />
          </>
        ) : null}
        {state.phase === "predict" ? (
          <>
            <ReadOnlyRow symbol="g" label="重力加速度" value={`${formatNumber(PREDICTION_G)} m/s²`} />
            <ReadOnlyRow
              symbol="v₀"
              label="你的估算"
              value={`≈ ${formatNumber(state.v0Estimate ?? 0)} m/s`}
            />
          </>
        ) : null}
      </div>

      {state.phase === "measure" ? (
        <section className="mx-2 border-t border-line pt-2">
          <p className="px-1 font-mono text-[11px] text-ink">
            {state.lastLandingX !== null
              ? `落点 R = ${formatNumber(state.lastLandingX)} m`
              : "发射后在此读出落点 R"}
          </p>
          <NumberEntry
            id="prediction-v0"
            label="你的 v₀ 估算"
            unit="m/s"
            buttonLabel="核对"
            onSubmit={onSubmitEstimate}
          />
          <p
            role="status"
            className={`min-h-4 px-1 text-[11px] ${estimateRejected ? "text-red-700" : "text-quiet"}`}
          >
            {estimateRejected ? "偏差超过 5%，重新计算" : "与真值相差 5% 以内即通过"}
          </p>
        </section>
      ) : null}

      {state.phase === "predict" ? (
        <section className="mx-2 border-t border-line pt-2">
          <NumberEntry
            id="prediction-x"
            label="预测落点 x"
            unit="m"
            buttonLabel="放置标靶"
            onSubmit={onPlaceTarget}
          />
          <p role="status" className="min-h-4 px-1 text-[11px] text-quiet">
            {state.targetPlaced && state.xPredicted !== null
              ? `标靶已放在 x = ${formatNumber(state.xPredicted)} m，按发射`
              : "放置标靶后才能发射"}
          </p>
        </section>
      ) : null}

      {state.phase === "result" && state.outcome ? (
        <section className="mx-2 border-t border-line pt-2">
          <dl className="space-y-0.5 px-1 font-mono text-[12px] tabular-nums">
            {[
              ["真值 v₀", `${formatNumber(state.hiddenV0)} m/s`],
              ["你的估算", `${formatNumber(state.v0Estimate ?? 0)} m/s`],
              ["预测 x", `${formatNumber(state.xPredicted ?? 0)} m`],
              ["实际 x", `${formatNumber(state.outcome.landingX)} m`],
              ["Δx", `${formatSigned(state.outcome.deltaX)} m`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-quiet">{label}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p
            className={`mt-1.5 px-1 text-[13px] font-medium ${
              state.outcome.hit ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {state.outcome.hit ? "命中标靶" : "未命中"}
          </p>
          <div className="mt-2 flex gap-1.5 px-1">
            <button
              type="button"
              onClick={onRetry}
              className="h-8 flex-1 cursor-pointer bg-navy px-3 text-[12px] font-medium text-white hover:opacity-90"
            >
              再预测一次
            </button>
            <button
              type="button"
              onClick={onNewDataset}
              className="h-8 flex-1 cursor-pointer border border-line bg-surface px-3 text-[12px] font-medium text-ink"
            >
              换一组数据
            </button>
          </div>
        </section>
      ) : null}

      <section className="mx-2 mt-2 border-t border-line pt-2">
        <h2 className="text-[13px] font-medium text-ink">公式</h2>
        <div className="mt-1 space-y-1 font-mono text-[11px] leading-5 text-quiet">
          <p>v₀ = R·√(g / 2h)　（水平发射）</p>
          <p>t_L = (v₀sinθ + √(v₀²sin²θ + 2gh)) / g</p>
          <p>x = v₀cosθ·t_L</p>
        </div>
      </section>
    </>
  );
}
