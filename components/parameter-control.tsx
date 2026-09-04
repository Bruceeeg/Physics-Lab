"use client";

import { useEffect, useRef, useState } from "react";

function precisionFor(step: number) {
  const text = String(step);
  return text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
}

function normalize(value: number, min: number, max: number, step: number) {
  const clamped = Math.min(max, Math.max(min, value));
  const stepped = min + Math.round((clamped - min) / step) * step;
  return Number(stepped.toFixed(precisionFor(step)));
}

function displayValue(value: number, step: number) {
  return value.toFixed(Math.max(precisionFor(step), 1));
}

export function ParameterControl({
  id,
  label,
  symbol,
  unit,
  value,
  min,
  max,
  step,
  invalid = false,
  onChange,
}: {
  id: string;
  label: string;
  symbol: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  invalid?: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(() => displayValue(value, step));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDraft(displayValue(value, step));
    }
  }, [step, value]);

  const commit = () => {
    focused.current = false;
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(displayValue(value, step));
      return;
    }
    const next = normalize(parsed, min, max, step);
    setDraft(displayValue(next, step));
    onChange(next);
  };

  return (
    <div className={invalid ? "bg-red-50 px-1 py-0.5" : "px-1 py-0.5"}>
      <div className="grid grid-cols-[minmax(0,1fr)_82px_42px] items-center gap-1.5">
        <label htmlFor={`${id}-number`} className="min-w-0 truncate text-[13px] text-quiet">
          <span className="font-mono text-ink">{symbol}</span>
          <span className="ml-1.5">{label}</span>
        </label>
        <input
          id={`${id}-number`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={draft}
          aria-invalid={invalid}
          onFocus={() => {
            focused.current = true;
          }}
          onChange={(event) => {
            const nextDraft = event.target.value;
            setDraft(nextDraft);
            if (nextDraft.trim() === "" || nextDraft === "-") {
              return;
            }
            const parsed = Number(nextDraft);
            if (Number.isFinite(parsed)) {
              onChange(normalize(parsed, min, max, step));
            }
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              focused.current = false;
              setDraft(displayValue(value, step));
              event.currentTarget.blur();
            }
          }}
          className="h-8 min-w-0 border border-line bg-surface px-2 text-right font-mono text-[13px] tabular-nums text-ink outline-none focus:border-navy focus:ring-1 focus:ring-navy aria-[invalid=true]:border-red-600 aria-[invalid=true]:ring-red-600"
        />
        <span className="truncate font-mono text-[11px] text-quiet">{unit}</span>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`${label}滑条`}
        aria-invalid={invalid}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 block w-full"
      />
    </div>
  );
}
