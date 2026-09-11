"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export { formatLabNumber, formatLabSci, formatLabSigned } from "@/lib/models/lab-format";

export function LabStat({
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

export function LabFrame({
  title,
  subtitle,
  stats,
  status,
  statusError = false,
  isPlaying,
  time,
  startDisabled = false,
  startLabel,
  onStart,
  onPause,
  onReset,
  parameters,
  formula,
  sceneTitle,
  sceneCaption,
  scene,
  readouts,
  charts,
  modes,
}: {
  title: string;
  subtitle: string;
  stats: { label: string; value: string; unit: string }[];
  status: string;
  statusError?: boolean;
  isPlaying: boolean;
  time: number;
  startDisabled?: boolean;
  startLabel?: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  parameters: ReactNode;
  formula: ReactNode;
  sceneTitle: string;
  sceneCaption: string;
  scene: ReactNode;
  readouts: { label: string; value: string; unit: string }[];
  charts: ReactNode;
  modes?: ReactNode;
}) {
  const cols = readouts.length <= 4 ? "grid-cols-4" : "grid-cols-5";

  return (
    <div className="lab-shell bg-paper text-ink">
      <header
        className={`lab-commandbar border-b border-line bg-surface${modes ? " lab-commandbar--modes" : ""}`}
      >
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-ink">
            <Link
              href="/"
              className="mr-2 text-[11px] font-normal text-quiet hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              目录
            </Link>
            {title}
          </p>
          <p className="font-mono text-[10px] text-quiet">{subtitle}</p>
        </div>
        {modes}
        <div className="grid min-w-0 grid-cols-3">
          {stats.map((item) => (
            <LabStat key={item.label} label={item.label} value={item.value} unit={item.unit} />
          ))}
        </div>
        <p
          role="status"
          className={`min-w-0 truncate text-xs ${statusError ? "text-red-700" : "text-quiet"}`}
          title={status}
        >
          {status}
        </p>
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={onStart}
            disabled={isPlaying || startDisabled}
            className="h-8 min-w-16 cursor-pointer bg-navy px-3 text-[13px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {startLabel ?? (time > 0 ? "继续" : "开始")}
          </button>
          <button
            type="button"
            onClick={onPause}
            disabled={!isPlaying}
            className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            暂停
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink"
          >
            重置
          </button>
        </div>
      </header>

      <main className="lab-workspace">
        <aside className="lab-parameters min-h-0 overflow-y-auto border border-line bg-surface">
          <div className="border-b border-line px-2.5 py-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">参数设置</h2>
              <span className="font-mono text-[10px] text-quiet">SI</span>
            </div>
            <p className="mt-0.5 text-[11px] text-quiet">
              改任一参数即回到 t = 0。数字输入按 Enter 确认，滑条立即生效。
            </p>
          </div>
          <div className="space-y-1 px-1.5 py-1.5">{parameters}</div>
          <section className="mx-2 mt-2 border-t border-line pt-2 pb-3">
            <h2 className="text-[13px] font-medium text-ink">公式与当前数值</h2>
            <div className="mt-1 space-y-1 font-mono text-[11px] leading-5">{formula}</div>
          </section>
        </aside>

        <section className="lab-scene min-h-0 border border-line bg-surface">
          <div className="flex h-8 items-center justify-between border-b border-line px-2.5">
            <h2 className="text-xs font-medium text-ink">{sceneTitle}</h2>
            <p className="font-mono text-[10px] text-quiet">{sceneCaption}</p>
          </div>
          <div className="relative min-h-[280px] flex-1">
            <div className="absolute inset-0 h-full w-full">{scene}</div>
          </div>
          <dl className={`grid h-12 ${cols} border-t border-line font-mono text-[11px] tabular-nums`}>
            {readouts.map((item) => (
              <div key={item.label} className="border-r border-line px-2 py-1 last:border-r-0">
                <dt className="text-quiet">{item.label}</dt>
                <dd className="truncate text-ink">
                  {item.value} {item.unit}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="lab-charts min-h-0">{charts}</aside>
      </main>
    </div>
  );
}

export function ModeSwitch<T extends string>({
  label = "实验模式",
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="mode-switch" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="px-1 py-1">
      <p className="mb-1 text-[13px] text-quiet">{label}</p>
      <div className="grid grid-cols-2 gap-1" role="group" aria-label={label}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`h-8 cursor-pointer border px-2 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                selected
                  ? "border-navy bg-navy text-white"
                  : "border-line bg-surface text-ink hover:border-navy"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
