import { forceDiagram2D } from "@/lib/models/force-diagram-2d";
import type { PullDerived } from "@/lib/models/pull-friction";

function arrowHead(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size = 5,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const baseX = x2 - ux * size;
  const baseY = y2 - uy * size;
  const spread = size * 0.42;
  return `${x2},${y2} ${baseX + px * spread},${baseY + py * spread} ${baseX - px * spread},${baseY - py * spread}`;
}

function labelPoint(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: x2 + (dx / length) * 6,
    y: y2 + (dy / length) * 6,
  };
}

export function PullFrictionDiagram2D({
  derived,
  z,
}: {
  derived: PullDerived;
  z: number;
}) {
  const diagram = forceDiagram2D(derived, z);

  return (
    <aside
      className="scene-pip"
      aria-label="侧视受力图"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <p className="scene-pip__title">侧视 2D</p>
      <svg
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        className="block h-auto w-full"
        aria-hidden="true"
      >
        <rect
          x="0"
          y={diagram.groundY}
          width={diagram.width}
          height={diagram.groundFill}
          fill="#e2e8f0"
        />
        <line
          x1={diagram.groundX1}
          y1={diagram.groundY}
          x2={diagram.groundX2}
          y2={diagram.groundY}
          stroke="#1e3a5f"
          strokeWidth="1.25"
        />
        <rect
          x={diagram.block.x}
          y={diagram.block.y}
          width={diagram.block.width}
          height={diagram.block.height}
          fill="#3d5a80"
          fillOpacity="0.38"
          stroke="#0f172a"
          strokeWidth="1.2"
        />
        {diagram.arrows.map((item) => {
          const label = labelPoint(item.x1, item.y1, item.x2, item.y2);
          return (
            <g key={item.name}>
              <line
                x1={item.x1}
                y1={item.y1}
                x2={item.x2}
                y2={item.y2}
                stroke={item.color}
                strokeWidth={item.dashed ? 1.1 : 1.6}
                strokeDasharray={item.dashed ? "4 3" : undefined}
                strokeLinecap="round"
              />
              <polygon points={arrowHead(item.x1, item.y1, item.x2, item.y2)} fill={item.color} />
              <text
                x={label.x}
                y={label.y}
                fill={item.color}
                fontSize="8"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-plex-mono), ui-monospace, monospace"
              >
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>
    </aside>
  );
}
