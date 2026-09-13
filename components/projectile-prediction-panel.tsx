"use client";

import { useState } from "react";

import { ParameterControl } from "@/components/parameter-control";
import { formatLabNumber, formatLabSigned } from "@/lib/models/lab-format";
import {
  PREDICTION_G,
  PREDICTION_H_MAX,
  PREDICTION_H_MIN,
  PREDICTION_THETA_MAX,
  PREDICTION_THETA_MIN,
  PREDICTION_V0_MAX,
  PREDICTION_V0_MIN,
  theoreticalRange,
  type PredictionState,
} from "@/lib/models/projectile-prediction";

function formatNumber(value: number) {
  return formatLabNumber(value);
}

function formatSigned(value: number) {
  return formatLabSigned(value);
}

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
  onV0Change,
  onPlaceTarget,
  onRetry,
}: {
  state: PredictionState;
  onHeightChange: (h: number) => void;
  onThetaChange: (thetaDeg: number) => void;
  onV0Change: (v0: number) => void;
  onPlaceTarget: (x: number) => void;
  onRetry: () => void;
}) {
  const R = theoreticalRange(state);

  return (
    <>
      <div className="border-b border-line px-2.5 py-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">参数与预估</h2>
          <span className="font-mono text-[10px] text-quiet">SI</span>
        </div>
        <p className="mt-0.5 text-[11px] text-quiet">
          设定 v₀、发射角和预估落点，发射后与测量板对照，误差不超过 1%。
        </p>
      </div>

      <div className="space-y-1 px-1.5 py-1.5">
        <ParameterControl
          id="prediction-v0"
          label="初速度"
          symbol="v₀"
          unit="m/s"
          value={state.v0}
          min={PREDICTION_V0_MIN}
          max={PREDICTION_V0_MAX}
          step={0.1}
          onChange={onV0Change}
        />
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
      </div>

      <section className="mx-2 border-t border-line pt-2">
        <p className="px-1 font-mono text-[11px] text-quiet">理论射程 R = {formatNumber(R)} m</p>
        <NumberEntry
          id="prediction-x"
          label="预估落点 x"
          unit="m"
          buttonLabel="确认预估"
          onSubmit={onPlaceTarget}
        />
        <p role="status" className="min-h-4 px-1 text-[11px] text-quiet">
          {state.xPredicted !== null
            ? `预估 x = ${formatNumber(state.xPredicted)} m，按开始发射`
            : "先填预估落点，再按开始"}
        </p>
      </section>

      {state.outcome ? (
        <section className="mx-2 mt-2 border-t border-line pt-2">
          <p
            className={`px-1 text-[13px] font-medium ${
              state.outcome.hit ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {state.outcome.hit ? "正确" : "失败"}
            <span className="ml-2 font-mono text-[11px]">
              相对误差 {formatNumber(state.outcome.relativeError * 100)}%
            </span>
          </p>
          <p className="mt-1 px-1 font-mono text-[11px] text-quiet">
            Δx = {formatSigned(state.outcome.deltaX)} m
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 h-8 w-full cursor-pointer border border-line bg-surface px-3 text-[12px] font-medium text-ink"
          >
            再测一次
          </button>
        </section>
      ) : null}

      <section className="mx-2 mt-2 border-t border-line pt-2 pb-3">
        <h2 className="text-[13px] font-medium text-ink">公式</h2>
        <div className="mt-1 space-y-1 font-mono text-[11px] leading-5 text-quiet">
          <p>t_L = (v₀sinθ + √(v₀²sin²θ + 2gh)) / g</p>
          <p>x = v₀cosθ·t_L</p>
          <p>g = {formatNumber(PREDICTION_G)} m/s²</p>
        </div>
      </section>
    </>
  );
}
