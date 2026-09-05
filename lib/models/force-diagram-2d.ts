import { forceMarks } from "./force-display.ts";
import type { PullDerived } from "./pull-friction.ts";

export const DIAGRAM_WIDTH = 128;
export const DIAGRAM_HEIGHT = 78;

const BLOCK_WIDTH = 26;
const BLOCK_HEIGHT = 20;
const ORIGIN_X = DIAGRAM_WIDTH / 2;
const ORIGIN_Y = DIAGRAM_HEIGHT / 2;
const GROUND_FILL = 6;
const LIFT_SCALE = 14;
const MAX_LIFT = 16;
const OFFSET_SCALE = 420;
const EPS = 1e-6;

export type DiagramArrow = {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  dashed: boolean;
};

export type ForceDiagram2D = {
  width: number;
  height: number;
  groundY: number;
  groundFill: number;
  groundX1: number;
  groundX2: number;
  block: { x: number; y: number; width: number; height: number };
  origin: { x: number; y: number };
  arrows: DiagramArrow[];
};

function shaftLength(magnitude: number) {
  return Math.min(28, Math.max(12, Math.abs(magnitude) * 1.05));
}

export function forceDiagram2D(derived: PullDerived, z: number): ForceDiagram2D {
  const lift = Math.min(MAX_LIFT, Math.max(0, z) * LIFT_SCALE);
  const origin = {
    x: ORIGIN_X,
    y: ORIGIN_Y - lift,
  };
  const groundY = ORIGIN_Y + BLOCK_HEIGHT / 2;

  const arrows: DiagramArrow[] = forceMarks(derived).flatMap((mark) => {
    const length = Math.hypot(mark.vector[0], mark.vector[1], mark.vector[2]);
    if (length < EPS) {
      return [];
    }
    const ux = mark.vector[0] / length;
    const uz = mark.vector[1] / length;
    const reach = shaftLength(length);
    const x1 = origin.x + mark.offset[0] * OFFSET_SCALE;
    const y1 = origin.y - mark.offset[1] * OFFSET_SCALE;
    return [
      {
        name: mark.name,
        x1,
        y1,
        x2: x1 + ux * reach,
        y2: y1 - uz * reach,
        color: mark.color,
        dashed: mark.style === "dashed",
      },
    ];
  });

  return {
    width: DIAGRAM_WIDTH,
    height: DIAGRAM_HEIGHT,
    groundY,
    groundFill: GROUND_FILL,
    groundX1: 8,
    groundX2: DIAGRAM_WIDTH - 8,
    block: {
      x: ORIGIN_X - BLOCK_WIDTH / 2,
      y: origin.y - BLOCK_HEIGHT / 2,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
    },
    origin,
    arrows,
  };
}
