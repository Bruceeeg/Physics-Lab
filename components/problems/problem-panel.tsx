"use client";

import { useMemo, useState } from "react";

import { problemsFor } from "@/lib/problems/bank";
import { grade } from "@/lib/problems/check";
import { formatLabNumber, formatLabSci } from "@/lib/models/lab-format";
import { useFreeform } from "@/components/freeform/freeform-context";

const COURSE: Record<string, string> = {
  p1: "AP Physics 1",
  p2: "AP Physics 2",
  "c-mech": "AP Physics C: Mechanics",
  "c-em": "AP Physics C: Electricity and Magnetism",
};

const COURSE_SHORT: Record<string, string> = {
  p1: "AP Physics 1",
  p2: "AP Physics 2",
  "c-mech": "AP Physics C: Mechanics",
  "c-em": "AP Physics C: E&M",
};

const SYMBOL: Record<string, string> = {
  m1: "m₁",
  m2: "m₂",
  v0: "v₀",
  v1: "v₁",
  v2: "v₂",
  x0: "x₀",
  w0: "ω₀",
  mu: "μ",
  muS: "μₛ",
  muK: "μₖ",
  theta: "θ",
  emf: "ε",
  kappa: "κ",
  lambda: "λ",
  phi: "φ",
  ell: "ℓ",
  rho: "ρ",
  rhoF: "ρf",
  w: "ω",
  tBurn: "tb",
  dT: "ΔT",
  Th: "TH",
  Tc: "TC",
  R1: "R₁",
  R2: "R₂",
  Rp: "Rp",
  Mp: "Mp",
  f1: "F₁",
  f2: "F₂",
  f3: "F₃",
  f4: "F₄",
  f5: "F₅",
  a1: "a₁",
  a2: "a₂",
  a3: "a₃",
  a4: "a₄",
  a5: "a₅",
  n1: "n₁",
  n2: "n₂",
  V0: "V₀",
  Vf: "Vf",
};

const SHAPE = ["solid cylinder", "thin hoop", "solid sphere", "thin spherical shell"];

function show(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.01 || abs >= 10000)) {
    return formatLabSci(value);
  }
  return formatLabNumber(value);
}

function givenText(key: string, value: number) {
  if (key === "shape") {
    return SHAPE[value] ?? show(value);
  }
  if (key === "roll") {
    return value ? "rolls without slipping" : "slides";
  }
  if (key === "quad") {
    return value ? "quadratic drag" : "linear drag";
  }
  if (key === "align") {
    return value > 0 ? "opposite currents" : "currents in the same direction";
  }
  if (key === "concave") {
    return value ? "concave" : "convex";
  }
  return show(value);
}

export function ProblemPanel() {
  const { slug } = useFreeform();
  const items = useMemo(() => problemsFor(slug), [slug]);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  if (!selected) {
    return <p className="px-2 py-3 text-[12px] text-quiet">This lab has no free-response item.</p>;
  }

  const result = grade(selected);
  const paper = selected.set ? `${selected.year} Set ${selected.set}` : `${selected.year}`;

  return (
    <div className="space-y-2 px-1.5 py-1">
      <p className="px-1 text-[11px] leading-4 text-quiet">
        {`${items.length} free-response ${items.length === 1 ? "item" : "items"}. Each value is calculated with this lab model and checked against an independent expression.`}
      </p>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const on = item.id === selected.id;
          const set = item.set ? ` Set ${item.set}` : "";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`block w-full cursor-pointer px-2 py-1 text-left text-[12px] ${on ? "bg-navy text-white" : "text-ink hover:bg-muted"}`}
            >
              {`${COURSE_SHORT[item.course]} ${item.year}${set} Q${item.number}`}
              <span className={`block truncate text-[10px] ${on ? "text-white/80" : "text-quiet"}`}>{item.title}</span>
            </button>
          );
        })}
      </div>
      <section className="border border-line px-2 py-2">
        <h3 className="text-[13px] font-medium text-ink">
          {COURSE[selected.course]} {paper} Question {selected.number}
        </h3>
        <p className="mt-1 text-[12px] leading-5 text-ink">{selected.title}</p>
        <p className="mt-1 text-[12px] leading-5 text-quiet">{selected.ask}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-2 font-mono text-[11px]">
          {Object.entries(selected.givens).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2 border-t border-line py-0.5">
              <dt className="text-quiet">{SYMBOL[key] ?? key}</dt>
              <dd className="text-right">{givenText(key, value)}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mt-2 text-[13px] font-medium text-ink">Calculated values</h3>
        <ul className="mt-1 space-y-1">
          {result.rows.map((row) => (
            <li key={row.label} className="flex items-baseline justify-between gap-2 font-mono text-[12px]">
              <span className="text-quiet">{row.label}</span>
              <span className="text-ink">
                {show(row.value)} {row.unit}
              </span>
            </li>
          ))}
        </ul>
        <p className={`mt-2 text-[12px] ${result.ok ? "text-emerald-700" : "text-red-700"}`}>
          {result.ok ? "Agrees with the independent expression." : "Does not agree with the independent expression."}
        </p>
      </section>
    </div>
  );
}
