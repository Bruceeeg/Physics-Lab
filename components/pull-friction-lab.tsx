"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { ParameterControl } from "@/components/parameter-control";
import { PullFrictionDiagram2D } from "@/components/pull-friction-diagram-2d";
import type { TrailPoint } from "@/components/pull-friction-scene";
import {
  appendKinematicSample,
  clampMuK,
  derive,
  initialState,
  kinematicSample,
  step,
  validatePullParams,
  type KinematicSample,
  type PullParams,
  type PullState,
} from "@/lib/models/pull-friction";

const SceneCanvas = dynamic(() => import("@/components/pull-friction-canvas"), {
  ssr: false,
});

const DEFAULT_PARAMS: PullParams = {
  F: 20,
  thetaDeg: 30,
  m: 2,
  muS: 0.4,
  muK: 0.3,
  g: 9.81,
};

const PARAMETER_DEFINITIONS: {
  key: keyof PullParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "F", label: "拉力", symbol: "F", unit: "N", min: -50, max: 50, step: 0.5 },
  {
    key: "thetaDeg",
    label: "方向角",
    symbol: "θ",
    unit: "°",
    min: 0,
    max: 180,
    step: 1,
  },
  { key: "m", label: "质量", symbol: "m", unit: "kg", min: 0.5, max: 10, step: 0.1 },
  {
    key: "muS",
    label: "静摩擦",
    symbol: "μs",
    unit: "",
    min: 0,
    max: 1.2,
    step: 0.01,
  },
  {
    key: "muK",
    label: "动摩擦",
    symbol: "μk",
    unit: "",
    min: 0,
    max: 1.2,
    step: 0.01,
  },
  {
    key: "g",
    label: "重力加速度",
    symbol: "g",
    unit: "m/s²",
    min: 1,
    max: 20,
    step: 0.01,
  },
];

function formatNumber(value: number) {
  return value.toFixed(2);
}

function alertCopy(alert: ReturnType<typeof derive>["alert"]) {
  switch (alert) {
    case "stuck":
      return "水平分力未超过最大静摩擦，滑块静止。";
    case "moving-plus":
      return "滑块沿 +x 方向运动。";
    case "moving-minus":
      return "滑块沿 -x 方向运动。";
    case "will-lift":
      return "竖直分力不小于重力，滑块将离地。";
    case "airborne":
      return "滑块已离地，当前无摩擦和支持力。";
  }
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="min-w-0 border-l border-line pl-3">
      <p className="text-[10px] text-quiet">{label}</p>
      <p className="truncate font-mono text-base tabular-nums text-ink">
        {value} <span className="text-[10px] text-quiet">{unit}</span>
      </p>
    </div>
  );
}

export function PullFrictionLab() {
  const [params, setParams] = useState<PullParams>(DEFAULT_PARAMS);
  const [state, setState] = useState<PullState>(initialState);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [series, setSeries] = useState<KinematicSample[]>([]);

  const paramsRef = useRef(params);
  const stateRef = useRef(state);
  const playingRef = useRef(false);
  const frameRef = useRef(0);
  const lastStampRef = useRef(0);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const muKUsed = clampMuK(params.muS, params.muK);
  const effectiveParams = useMemo(
    () => ({ ...params, muK: muKUsed }),
    [muKUsed, params],
  );
  const derived = useMemo(
    () => derive(effectiveParams, state),
    [effectiveParams, state],
  );
  const issue = validatePullParams(params);
  const speed = Math.hypot(state.vx, state.vz);
  const displacement = state.x;
  const fxNet = derived.forces.Fx + derived.forces.f;
  const currentSample = kinematicSample(derived, state);
  const chartSeries =
    series.length > 0 &&
    Math.abs(series[series.length - 1].t - currentSample.t) < 1e-4
      ? series
      : [...series, currentSample];

  const stopLoop = () => {
    playingRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  };

  const pause = () => {
    stopLoop();
    setIsPlaying(false);
  };

  const startLoop = () => {
    if (playingRef.current || validatePullParams(paramsRef.current)) {
      return;
    }

    playingRef.current = true;
    setIsPlaying(true);
    lastStampRef.current = performance.now();

    if (series.length === 0) {
      const seedDerived = derive(paramsRef.current, stateRef.current);
      setSeries([kinematicSample(seedDerived, stateRef.current)]);
    }

    const tick = (now: number) => {
      if (!playingRef.current) {
        frameRef.current = 0;
        return;
      }

      const elapsed = Math.min(
        0.05,
        Math.max(0, (now - lastStampRef.current) / 1000),
      );
      lastStampRef.current = now;
      const p = {
        ...paramsRef.current,
        muK: clampMuK(paramsRef.current.muS, paramsRef.current.muK),
      };
      let remaining = elapsed;
      let next = stateRef.current;

      while (remaining > 1e-8) {
        const dt = Math.min(1 / 240, remaining);
        next = step(p, next, dt);
        remaining -= dt;
      }

      const nextDerived = derive(p, next);
      stateRef.current = next;
      setState(next);
      setSeries((current) =>
        appendKinematicSample(
          current,
          kinematicSample(nextDerived, next),
        ),
      );
      setTrail((current) => {
        const last = current[current.length - 1];
        if (last && Math.hypot(last.x - next.x, last.z - next.z) < 0.02) {
          return current;
        }
        const appended = [...current, { x: next.x, z: next.z }];
        return appended.length > 400 ? appended.slice(-400) : appended;
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    pause();
    const rest = initialState();
    stateRef.current = rest;
    setState(rest);
    setTrail([]);
    setSeries([]);
  };

  const updateParam = (key: keyof PullParams, value: number) => {
    const next = { ...paramsRef.current, [key]: value };
    if (key === "muS" && next.muK > next.muS) {
      next.muK = next.muS;
    }
    if (key === "muK" && next.muK > next.muS) {
      next.muK = next.muS;
    }

    paramsRef.current = next;
    setParams(next);
    if (validatePullParams(next)) {
      pause();
    }
  };

  const thetaRad = (params.thetaDeg * Math.PI) / 180;
  const contactExpression =
    params.m * params.g - Math.abs(params.F) * Math.sin(thetaRad);
  const formulaId =
    derived.mode === "static"
      ? "static"
      : derived.mode === "sliding"
        ? "slide"
        : "air";
  const status = issue
    ? issue.message
    : isPlaying
      ? alertCopy(derived.alert)
      : state.t > 0
        ? `已暂停，${alertCopy(derived.alert)}`
        : alertCopy(derived.alert);

  return (
    <div className="lab-shell bg-paper text-ink">
      <header className="lab-commandbar border-b border-line bg-surface">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-ink">
            <Link
              href="/"
              className="mr-2 text-[11px] font-normal text-quiet hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              目录
            </Link>
            斜向拉力实验台
          </p>
          <p className="font-mono text-[10px] text-quiet">Physics Lab / 牛顿第二定律</p>
        </div>
        <div className="grid min-w-0 grid-cols-3">
          <Stat label="时间 t" value={formatNumber(state.t)} unit="s" />
          <Stat label="速度 |v|" value={formatNumber(speed)} unit="m/s" />
          <Stat label="位移 Δx" value={formatNumber(displacement)} unit="m" />
        </div>
        <p
          role="status"
          className={`min-w-0 truncate text-xs ${
            issue ? "text-red-700" : "text-quiet"
          }`}
          title={status}
        >
          {status}
        </p>
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={startLoop}
            disabled={isPlaying || Boolean(issue)}
            className="h-8 min-w-16 cursor-pointer bg-navy px-3 text-[13px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {state.t > 0 ? "继续" : "开始"}
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!isPlaying}
            className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            暂停
          </button>
          <button
            type="button"
            onClick={reset}
            className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink"
          >
            重置
          </button>
        </div>
      </header>

      <main className="lab-workspace">
        <aside className="lab-parameters min-h-0 border border-line bg-surface">
          <div className="border-b border-line px-2.5 py-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">参数设置</h2>
              <span className="font-mono text-[10px] text-quiet">SI</span>
            </div>
            <p className="mt-0.5 text-[11px] text-quiet">
              数字输入可按 Enter 确认，滑条立即生效。
            </p>
          </div>

          <div className="space-y-1 px-1.5 py-1.5">
            {PARAMETER_DEFINITIONS.map((item) => (
              <ParameterControl
                key={item.key}
                id={item.key}
                label={item.label}
                symbol={item.symbol}
                unit={item.unit}
                value={item.key === "muK" ? muKUsed : params[item.key]}
                min={item.min}
                max={item.key === "muK" ? params.muS : item.max}
                step={item.step}
                invalid={Boolean(issue?.fields.includes(item.key as "F" | "thetaDeg"))}
                onChange={(value) => updateParam(item.key, value)}
              />
            ))}
          </div>

          <div
            className={`mx-2 min-h-8 border px-2 py-1.5 text-[11px] leading-4 ${
              issue
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-line bg-paper text-quiet"
            }`}
          >
            {issue
              ? issue.message
              : "F > 0 对应 θ=0°-90°；F < 0 对应 θ=90°-180°。"}
          </div>

          <section className="mx-2 mt-2 border-t border-line pt-2">
            <h2 className="text-[13px] font-medium text-ink">公式与当前分支</h2>
            <div className="mt-1 space-y-1 font-mono text-[11px] leading-5">
              <p>N = mg - |F|sinθ = {formatNumber(contactExpression)} N</p>
              <p className={formulaId === "static" ? "bg-muted text-navy" : "text-quiet"}>
                |Fx| ≤ μsN → static
              </p>
              <p className={formulaId === "slide" ? "bg-muted text-navy" : "text-quiet"}>
                Fx + f = maₓ → sliding
              </p>
              <p className={formulaId === "air" ? "bg-muted text-navy" : "text-quiet"}>
                N = 0 → airborne
              </p>
            </div>
          </section>
        </aside>

        <section className="lab-scene min-h-0 border border-line bg-surface">
          <div className="flex h-8 items-center justify-between border-b border-line px-2.5">
            <h2 className="text-xs font-medium text-ink">三维受力与运动</h2>
            <p className="font-mono text-[10px] text-quiet">
              实线 F/G/N/f　虚线 Fx/Fz　拖动旋转
            </p>
          </div>
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0 z-0">
              <SceneCanvas
                state={state}
                derived={derived}
                trail={trail}
                params={effectiveParams}
              />
            </div>
            <PullFrictionDiagram2D derived={derived} z={state.z} />
          </div>
          <dl className="grid h-12 grid-cols-5 border-t border-line font-mono text-[11px] tabular-nums">
            {[
              ["N", derived.forces.N, "N"],
              ["f", derived.forces.f, "N"],
              ["aₓ", derived.ax, "m/s²"],
              ["aᶻ", derived.az, "m/s²"],
              ["ΣFₓ", fxNet, "N"],
            ].map(([label, value, unit]) => (
              <div key={String(label)} className="border-r border-line px-2 py-1 last:border-r-0">
                <dt className="text-quiet">{label}</dt>
                <dd className="truncate text-ink">
                  {formatNumber(Number(value))} {unit}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="lab-charts min-h-0">
          <TimeSeriesChart
            title="速度-时间"
            quantity="vₓ"
            unit="m/s"
            strokeColor="#1E3A5F"
            valueKey="vx"
            points={chartSeries}
            currentTime={state.t}
            currentValue={state.vx}
          />
          <TimeSeriesChart
            title="加速度-时间"
            quantity="aₓ"
            unit="m/s²"
            strokeColor="#A16207"
            valueKey="ax"
            points={chartSeries}
            currentTime={state.t}
            currentValue={derived.ax}
          />
          <TimeSeriesChart
            title="水平合力-时间"
            quantity="ΣFₓ"
            unit="N"
            strokeColor="#2563EB"
            valueKey="fxNet"
            points={chartSeries}
            currentTime={state.t}
            currentValue={fxNet}
          />
          <TimeSeriesChart
            title="位移-时间"
            quantity="Δx"
            unit="m"
            strokeColor="#6D28D9"
            valueKey="dx"
            points={chartSeries}
            currentTime={state.t}
            currentValue={displacement}
          />
        </aside>
      </main>
    </div>
  );
}
