"use client";

import { useEffect, useRef, useState } from "react";

import { partLabel, useFreeform, useFreeformOptional } from "@/components/freeform/freeform-context";
import { ParameterControl } from "@/components/parameter-control";
import { searchParts } from "@/lib/freeform/catalog";
import type { Part, PartType } from "@/lib/freeform/types";

const FIELDS: Partial<Record<PartType, Field[]>> = {
  "custom-force": [
    { key: "magnitude", label: "大小", symbol: "F", unit: "N", min: 0, max: 200, step: 0.1 },
    { key: "thetaDeg", label: "方向角", symbol: "θ", unit: "°", min: -180, max: 360, step: 1 },
    { key: "phiDeg", label: "离屏角", symbol: "φ", unit: "°", min: -90, max: 90, step: 1 },
    { key: "x", label: "x", symbol: "x", unit: "m", min: -2, max: 2, step: 0.01 },
    { key: "y", label: "y", symbol: "y", unit: "m", min: -1, max: 2, step: 0.01 },
    { key: "z", label: "z", symbol: "z", unit: "m", min: -2, max: 2, step: 0.01 },
  ],
  block: [
    { key: "mass", label: "质量", symbol: "m", unit: "kg", min: 0.05, max: 20, step: 0.05 },
    { key: "charge", label: "电荷", symbol: "q", unit: "C", min: -2e-6, max: 2e-6, step: 1e-8 },
  ],
  sphere: [
    { key: "mass", label: "质量", symbol: "m", unit: "kg", min: 0.05, max: 10, step: 0.05 },
    { key: "charge", label: "电荷", symbol: "q", unit: "C", min: -2e-6, max: 2e-6, step: 1e-8 },
  ],
  gravity: [{ key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 0, max: 20, step: 0.01 }],
  track: [{ key: "mu", label: "动摩擦", symbol: "μ", unit: "", min: 0, max: 1.2, step: 0.01 }],
  incline: [
    { key: "angleDeg", label: "倾角", symbol: "θ", unit: "°", min: 0, max: 60, step: 1 },
    { key: "mu", label: "动摩擦", symbol: "μ", unit: "", min: 0, max: 1.2, step: 0.01 },
  ],
  spring: [
    { key: "stiffness", label: "劲度", symbol: "k", unit: "N/m", min: 1, max: 200, step: 1 },
    { key: "length", label: "原长", symbol: "L", unit: "m", min: 0.05, max: 1.5, step: 0.01 },
  ],
  battery: [{ key: "voltage", label: "电动势", symbol: "ε", unit: "V", min: 0, max: 24, step: 0.1 }],
  supply: [{ key: "voltage", label: "电压", symbol: "V", unit: "V", min: 0, max: 24, step: 0.1 }],
  resistor: [{ key: "resistance", label: "电阻", symbol: "R", unit: "Ω", min: 0.1, max: 500, step: 0.1 }],
  bulb: [{ key: "resistance", label: "电阻", symbol: "R", unit: "Ω", min: 0.1, max: 500, step: 0.1 }],
  capacitor: [{ key: "capacitance", label: "电容", symbol: "C", unit: "F", min: 1e-6, max: 0.01, step: 1e-5 }],
  magnet: [{ key: "field", label: "磁场", symbol: "B", unit: "T", min: 0, max: 0.5, step: 0.01 }],
  solenoid: [
    { key: "turns", label: "匝数", symbol: "n", unit: "", min: 10, max: 2000, step: 10 },
    { key: "current", label: "电流", symbol: "I", unit: "A", min: 0, max: 5, step: 0.05 },
  ],
  "lens-convex": [{ key: "focal", label: "焦距", symbol: "f", unit: "m", min: 0.05, max: 1, step: 0.01 }],
  "lens-concave": [{ key: "focal", label: "焦距", symbol: "f", unit: "m", min: -1, max: -0.05, step: 0.01 }],
};

type Field = {
  key: keyof Part;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};

export function PartsPanel() {
  const freeform = useFreeform();
  const [query, setQuery] = useState("");
  const results = searchParts(query, freeform.slug);
  const selected = freeform.scene.parts.find((part) => part.id === freeform.selectedId) ?? null;

  return (
    <div className="px-1.5 py-1.5">
      <label className="block px-1 text-[11px] text-quiet" htmlFor="part-search">
        {query.trim() ? "全部器材" : "本主题推荐，搜索可找到全部器材"}
      </label>
      <input
        id="part-search"
        value={query}
        placeholder="搜索，例如力、透镜、电阻"
        onChange={(event) => setQuery(event.target.value)}
        className="mt-1 h-8 w-full border border-line bg-surface px-2 text-[13px] text-ink outline-none focus:border-navy"
      />
      <ul className="mt-1 max-h-28 overflow-y-auto border border-line">
        {results.length === 0 ? (
          <li className="px-2 py-1.5 text-[12px] text-quiet">没有这种零件</li>
        ) : (
          results.map((entry) => (
            <li key={entry.type}>
              <button
                type="button"
                onClick={() => freeform.add(entry.type)}
                className="flex h-7 w-full cursor-pointer items-center justify-between px-2 text-left text-[12px] hover:bg-muted"
              >
                <span>{entry.label}</span>
                <span className="font-mono text-[10px] text-quiet">{entry.symbol}</span>
              </button>
            </li>
          ))
        )}
      </ul>
      <ul className="mt-2 space-y-1">
        {freeform.scene.parts.map((part) => {
          const active = part.id === selected?.id;
          return (
            <li key={part.id} className={active ? "border border-navy" : "border border-line"}>
              <div className="flex items-center gap-1 px-1">
                <button
                  type="button"
                  onClick={() => freeform.select(part.id)}
                  className="h-7 min-w-0 flex-1 cursor-pointer truncate text-left text-[12px]"
                >
                  {partLabel(part.type)}
                </button>
                <button
                  type="button"
                  onClick={() => freeform.toggle(part.id)}
                  className="h-7 cursor-pointer px-1 text-[11px] text-quiet"
                >
                  {part.enabled ? "开" : "关"}
                </button>
                <button
                  type="button"
                  onClick={() => freeform.remove(part.id)}
                  className="h-7 cursor-pointer px-1 text-[11px] text-quiet"
                >
                  删除
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {selected ? <PartFields part={selected} /> : null}
    </div>
  );
}

function PartFields({ part }: { part: Part }) {
  const freeform = useFreeform();
  const fields = FIELDS[part.type] ?? [
    { key: "x" as const, label: "x", symbol: "x", unit: "m", min: -2, max: 2, step: 0.01 },
    { key: "y" as const, label: "y", symbol: "y", unit: "m", min: -1, max: 2, step: 0.01 },
    { key: "z" as const, label: "z", symbol: "z", unit: "m", min: -2, max: 2, step: 0.01 },
  ];
  return (
    <div className="mt-2 border-t border-line pt-2">
      <p className="px-1 text-[12px] text-ink">{partLabel(part.type)}</p>
      {part.type === "custom-force" ? (
        <button
          type="button"
          onClick={() => freeform.update(part.id, { attach: part.attach === "body" ? "world" : "body" })}
          className="mx-1 mt-1 h-7 cursor-pointer border border-line px-2 text-[12px]"
        >
          {part.attach === "body" ? "随物体" : "固定在空间"}
        </button>
      ) : null}
      {part.type === "switch" ? (
        <button
          type="button"
          onClick={() => freeform.update(part.id, { closed: !part.closed })}
          className="mx-1 mt-1 h-7 cursor-pointer border border-line px-2 text-[12px]"
        >
          {part.closed ? "开关闭合" : "开关断开"}
        </button>
      ) : null}
      {fields.map((field) => (
        <ParameterControl
          key={field.key}
          id={`${part.id}-${field.key}`}
          label={part.type === "custom-force" && part.attach === "body" && "xyz".includes(field.key) ? `偏移 ${field.label}` : field.label}
          symbol={field.symbol}
          unit={field.unit}
          value={Number(part[field.key])}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(value) => freeform.update(part.id, { [field.key]: value })}
        />
      ))}
    </div>
  );
}

export function ResetMenu() {
  const freeform = useFreeform();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink"
      >
        重置
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-32 border border-line bg-surface">
          <MenuItem label="重置时间" onClick={() => choose(freeform.resetTime)} />
          <MenuItem label="重置操作" onClick={() => choose(freeform.resetOperations)} />
          <MenuItem label="重置实验台" onClick={() => choose(freeform.resetBench)} />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="block h-8 w-full cursor-pointer px-2 text-left text-[12px] hover:bg-muted"
    >
      {label}
    </button>
  );
}

export function FreeformAside({ children }: { children: React.ReactNode }) {
  const freeform = useFreeform();
  return (
    <>
      <div className="flex border-b border-line" role="tablist" aria-label="参数、零件或 free response">
        <TabButton selected={freeform.tab === "params"} onClick={() => freeform.setTab("params")}>参数</TabButton>
        <TabButton selected={freeform.tab === "parts"} onClick={() => freeform.setTab("parts")}>零件</TabButton>
        <TabButton selected={freeform.tab === "problems"} onClick={() => freeform.setTab("problems")}>FRQ</TabButton>
      </div>
      {freeform.tab === "parts" ? <PartsPanel /> : freeform.tab === "problems" ? null : children}
    </>
  );
}

export function FreeformReset({ onReset }: { onReset?: () => void }) {
  const freeform = useFreeformOptional();
  if (!freeform) {
    return (
      <button
        type="button"
        onClick={onReset}
        className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink"
      >
        重置
      </button>
    );
  }
  return <ResetMenu />;
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`h-8 flex-1 cursor-pointer text-[13px] ${selected ? "bg-navy text-white" : "text-quiet"}`}
    >
      {children}
    </button>
  );
}
