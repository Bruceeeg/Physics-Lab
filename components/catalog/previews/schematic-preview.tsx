import type { ReactNode } from "react";

import type { PreviewKind } from "@/lib/experiments/catalog";

function PreviewFrame({
  running,
  children,
}: {
  running: boolean;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 160 100"
      className={`catalog-preview h-full w-full bg-muted text-navy ${
        running ? "" : "catalog-preview--paused"
      }`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function scene(kind: PreviewKind, running: boolean) {
  switch (kind) {
    case "circular":
      return (
        <PreviewFrame running={running}>
          <line x1="80" y1="18" x2="80" y2="42" stroke="currentColor" strokeWidth="1.2" className="catalog-preview__spin-origin" />
          <circle cx="80" cy="18" r="2.2" fill="currentColor" />
          <g className="catalog-preview__orbit" style={{ transformOrigin: "80px 18px" }}>
            <line x1="80" y1="18" x2="80" y2="68" stroke="currentColor" strokeWidth="1" />
            <circle cx="80" cy="68" r="5" fill="#1e3a5f" />
          </g>
        </PreviewFrame>
      );
    case "energy":
      return (
        <PreviewFrame running={running}>
          <path d="M16 80 L86 80 L142 36" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="14" y="56" width="6" height="26" fill="#475569" />
          <path d="M20 68 Q36 62 52 68 T84 68" fill="none" stroke="#A16207" strokeWidth="1.4" />
          <rect width="16" height="10" fill="#1e3a5f" className="catalog-preview__ramp-cart" />
        </PreviewFrame>
      );
    case "momentum":
      return (
        <PreviewFrame running={running}>
          <line x1="12" y1="62" x2="148" y2="62" stroke="#cbd5e1" />
          <rect x="0" y="50" width="14" height="12" fill="#1e3a5f" className="catalog-preview__cart-a" />
          <rect x="0" y="50" width="14" height="12" fill="#a16207" className="catalog-preview__cart-b" />
        </PreviewFrame>
      );
    case "shm":
    case "physical-pendulum":
      return (
        <PreviewFrame running={running}>
          <circle cx="80" cy="14" r="2" fill="currentColor" />
          <g className="catalog-preview__swing" style={{ transformOrigin: "80px 14px" }}>
            <line x1="80" y1="14" x2="80" y2="72" stroke="currentColor" strokeWidth="1.2" />
            {kind === "physical-pendulum" ? (
              <rect x="74" y="68" width="12" height="18" fill="#1e3a5f" />
            ) : (
              <circle cx="80" cy="76" r="6" fill="#1e3a5f" />
            )}
          </g>
        </PreviewFrame>
      );
    case "rotation":
    case "inertia":
      return (
        <PreviewFrame running={running}>
          <path d="M18 78 L118 78 L148 42" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          <g className="catalog-preview__roll">
            <circle cx="0" cy="0" r="9" fill="none" stroke="#1e3a5f" strokeWidth="2" />
            <line x1="-9" y1="0" x2="9" y2="0" stroke="#1e3a5f" strokeWidth="1.2" />
          </g>
        </PreviewFrame>
      );
    case "incline":
      return (
        <PreviewFrame running={running}>
          <path
            d="M22 30 L92 78 L148 78"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <rect
            width="16"
            height="10"
            fill="#1E3A5F"
            className="catalog-preview__incline-block"
          />
        </PreviewFrame>
      );
    case "torque":
      return (
        <PreviewFrame running={running}>
          <polygon points="80,58 72,72 88,72" fill="#64748b" />
          <g className="catalog-preview__seesaw" style={{ transformOrigin: "80px 58px" }}>
            <line x1="24" y1="58" x2="136" y2="58" stroke="#1e3a5f" strokeWidth="3" />
            <rect x="30" y="62" width="10" height="12" fill="#1e3a5f" />
            <rect x="116" y="62" width="12" height="16" fill="#a16207" />
          </g>
        </PreviewFrame>
      );
    case "fluids":
      return (
        <PreviewFrame running={running}>
          <rect x="28" y="18" width="70" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="29" y="36" width="68" height="45" fill="#94a3b8" opacity="0.45" />
          <path d="M98 70 C118 74 132 82 146 92" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeDasharray="6 5" className="catalog-preview__flow" />
        </PreviewFrame>
      );
    case "atwood":
      return (
        <PreviewFrame running={running}>
          <line x1="80" y1="10" x2="80" y2="22" stroke="currentColor" />
          <circle cx="80" cy="28" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <g className="catalog-preview__atwood">
            <line x1="72" y1="28" x2="72" y2="58" stroke="currentColor" />
            <rect x="66" y="58" width="12" height="14" fill="#1e3a5f" />
            <line x1="88" y1="28" x2="88" y2="42" stroke="currentColor" />
            <rect x="82" y="42" width="12" height="10" fill="#a16207" />
          </g>
        </PreviewFrame>
      );
    case "projectile":
      return (
        <PreviewFrame running={running}>
          <path d="M18 78 C58 18, 108 18, 148 78" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
          <circle r="5" fill="#1e3a5f" className="catalog-preview__projectile" />
        </PreviewFrame>
      );
    case "angmom":
      return (
        <PreviewFrame running={running}>
          <ellipse cx="80" cy="58" rx="36" ry="10" fill="none" stroke="#cbd5e1" />
          <g className="catalog-preview__spin" style={{ transformOrigin: "80px 58px" }}>
            <ellipse cx="80" cy="58" rx="32" ry="8" fill="#1e3a5f" opacity="0.85" />
            <rect x="78" y="24" width="4" height="34" fill="#a16207" />
          </g>
        </PreviewFrame>
      );
    case "archimedes":
      return (
        <PreviewFrame running={running}>
          <rect x="36" y="28" width="88" height="56" fill="none" stroke="currentColor" />
          <rect x="37" y="52" width="86" height="31" fill="#94a3b8" opacity="0.4" />
          <rect x="68" y="40" width="24" height="20" fill="#1e3a5f" className="catalog-preview__bob" />
        </PreviewFrame>
      );
    case "boyle":
      return (
        <PreviewFrame running={running}>
          <rect x="58" y="18" width="44" height="68" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="60" y="48" width="40" height="36" fill="#94a3b8" opacity="0.4" />
          <rect x="56" y="44" width="48" height="6" fill="#1e3a5f" className="catalog-preview__piston" />
        </PreviewFrame>
      );
    case "resistor":
    case "ohm":
      return (
        <PreviewFrame running={running}>
          <rect x="24" y="28" width="112" height="48" fill="none" stroke="currentColor" />
          <circle cx="44" cy="52" r="6" fill="#a16207" className="catalog-preview__pulse" />
          <rect x="70" y="46" width="28" height="12" fill="none" stroke="currentColor" />
          <circle cx="116" cy="52" r="4" fill="#1e3a5f" className="catalog-preview__pulse catalog-preview__delay" />
        </PreviewFrame>
      );
    case "rc":
    case "rl":
      return (
        <PreviewFrame running={running}>
          <rect x="22" y="30" width="116" height="44" fill="none" stroke="currentColor" />
          <rect x="48" y="46" width="22" height="12" fill="none" stroke="currentColor" />
          <rect x="92" y="40" width="8" height="24" fill="#1e3a5f" className="catalog-preview__charge" />
          <rect x="104" y="40" width="8" height="24" fill="#a16207" className="catalog-preview__charge catalog-preview__delay" />
        </PreviewFrame>
      );
    case "magnetism":
    case "solenoid":
      return (
        <PreviewFrame running={running}>
          <rect x="58" y="30" width="44" height="16" rx="2" fill="#1e3a5f" />
          <path d="M40 38 C28 22, 80 8, 120 22" fill="none" stroke="#a16207" strokeDasharray="5 4" className="catalog-preview__flow" />
          <path d="M40 38 C28 54, 80 86, 120 54" fill="none" stroke="#a16207" strokeDasharray="5 4" className="catalog-preview__flow" />
        </PreviewFrame>
      );
    case "induction":
      return (
        <PreviewFrame running={running}>
          <rect x="88" y="28" width="40" height="44" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="24" y="40" width="28" height="12" fill="#a16207" className="catalog-preview__magnet" />
        </PreviewFrame>
      );
    case "optics":
      return (
        <PreviewFrame running={running}>
          <ellipse cx="80" cy="50" rx="8" ry="28" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M18 28 L80 50 L142 36" fill="none" stroke="#a16207" className="catalog-preview__flow" strokeDasharray="5 4" />
          <path d="M18 72 L80 50 L142 64" fill="none" stroke="#a16207" className="catalog-preview__flow" strokeDasharray="5 4" />
        </PreviewFrame>
      );
    case "photon":
      return (
        <PreviewFrame running={running}>
          <rect x="28" y="38" width="36" height="24" fill="#1e3a5f" />
          <circle cx="92" cy="50" r="4" fill="#a16207" className="catalog-preview__photon" />
          <circle cx="92" cy="50" r="4" fill="#a16207" className="catalog-preview__photon catalog-preview__delay" />
        </PreviewFrame>
      );
    case "coulomb":
      return (
        <PreviewFrame running={running}>
          <circle cx="58" cy="50" r="8" fill="#1e3a5f" className="catalog-preview__repel-a" />
          <circle cx="102" cy="50" r="8" fill="#a16207" className="catalog-preview__repel-b" />
        </PreviewFrame>
      );
    case "waves":
      return (
        <PreviewFrame running={running}>
          <path
            d="M12 50 Q32 22 52 50 T92 50 T132 50 T152 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="catalog-preview__wave"
          />
        </PreviewFrame>
      );
    case "thermal":
      return (
        <PreviewFrame running={running}>
          <rect x="36" y="30" width="88" height="40" fill="none" stroke="currentColor" />
          <rect x="38" y="32" width="40" height="36" fill="#a16207" className="catalog-preview__heat" />
          <rect x="82" y="32" width="40" height="36" fill="#94a3b8" />
        </PreviewFrame>
      );
    case "n2rot":
      return (
        <PreviewFrame running={running}>
          <circle cx="80" cy="52" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
          <g className="catalog-preview__spin" style={{ transformOrigin: "80px 52px" }}>
            <line x1="80" y1="30" x2="80" y2="74" stroke="#1e3a5f" strokeWidth="3" />
            <circle cx="80" cy="28" r="4" fill="#a16207" />
          </g>
        </PreviewFrame>
      );
    case "ballistic":
      return (
        <PreviewFrame running={running}>
          <circle cx="80" cy="18" r="2" fill="currentColor" />
          <g className="catalog-preview__swing" style={{ transformOrigin: "80px 18px" }}>
            <line x1="80" y1="18" x2="80" y2="70" stroke="currentColor" />
            <rect x="72" y="68" width="16" height="12" fill="#1e3a5f" />
          </g>
          <circle r="4" fill="#a16207" className="catalog-preview__bullet" />
        </PreviewFrame>
      );
    case "equipotential":
      return (
        <PreviewFrame running={running}>
          <ellipse cx="80" cy="50" rx="18" ry="12" fill="none" stroke="currentColor" className="catalog-preview__pulse" />
          <ellipse cx="80" cy="50" rx="32" ry="22" fill="none" stroke="currentColor" className="catalog-preview__pulse catalog-preview__delay" />
          <ellipse cx="80" cy="50" rx="48" ry="34" fill="none" stroke="#cbd5e1" />
          <circle cx="80" cy="50" r="4" fill="#a16207" />
        </PreviewFrame>
      );
    case "capacitance":
      return (
        <PreviewFrame running={running}>
          <rect x="58" y="22" width="8" height="56" fill="#1e3a5f" />
          <rect x="94" y="22" width="8" height="56" fill="#1e3a5f" className="catalog-preview__plate" />
        </PreviewFrame>
      );
    default:
      return (
        <PreviewFrame running={running}>
          <rect x="24" y="28" width="112" height="44" fill="none" stroke="currentColor" />
        </PreviewFrame>
      );
  }
}

export function SchematicPreview({
  kind,
  running,
}: {
  kind: PreviewKind;
  running: boolean;
}) {
  return scene(kind, running);
}
