import type { ProjectileParams } from "./projectile";

export const HIDDEN_V0_MIN = 2;
export const HIDDEN_V0_MAX = 8;
export const V0_TOLERANCE = 0.05;
export const TARGET_HALF_WIDTH = 0.1;
export const PREDICTION_G = 9.81;
export const PREDICTION_H_MIN = 0.2;
export const PREDICTION_H_MAX = 3;
export const PREDICTION_THETA_MIN = 0;
export const PREDICTION_THETA_MAX = 80;
export const DEFAULT_PREDICTION_H = 1;

const EPS = 1e-9;

export type PredictionPhase = "measure" | "predict" | "result";

export type RandomSource = () => number;

export type PredictionOutcome = { hit: boolean; deltaX: number; landingX: number };

export type PredictionState = {
  phase: PredictionPhase;
  hiddenV0: number;
  h: number;
  thetaDeg: number;
  v0Estimate: number | null;
  v0Accepted: boolean;
  xPredicted: number | null;
  targetPlaced: boolean;
  lastLandingX: number | null;
  outcome: PredictionOutcome | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function drawHiddenV0(random: RandomSource = Math.random): number {
  const raw = HIDDEN_V0_MIN + random() * (HIDDEN_V0_MAX - HIDDEN_V0_MIN);
  return clamp(Math.round(raw * 100) / 100, HIDDEN_V0_MIN, HIDDEN_V0_MAX);
}

export function createPrediction(
  random: RandomSource = Math.random,
  h = DEFAULT_PREDICTION_H,
): PredictionState {
  return {
    phase: "measure",
    hiddenV0: drawHiddenV0(random),
    h: clamp(h, PREDICTION_H_MIN, PREDICTION_H_MAX),
    thetaDeg: 0,
    v0Estimate: null,
    v0Accepted: false,
    xPredicted: null,
    targetPlaced: false,
    lastLandingX: null,
    outcome: null,
  };
}

export function predictionParams(state: PredictionState): ProjectileParams {
  return { v0: state.hiddenV0, thetaDeg: state.thetaDeg, h: state.h, g: PREDICTION_G };
}

export function isRevealed(state: PredictionState): boolean {
  return state.phase === "result";
}

export function canLaunch(state: PredictionState): boolean {
  if (state.phase === "measure") {
    return true;
  }
  return state.phase === "predict" && state.targetPlaced;
}

export function setHeight(state: PredictionState, h: number): PredictionState {
  if (state.phase === "result" || !Number.isFinite(h)) {
    return state;
  }
  const next = clamp(h, PREDICTION_H_MIN, PREDICTION_H_MAX);
  if (next === state.h) {
    return state;
  }
  return { ...state, h: next, lastLandingX: null, xPredicted: null, targetPlaced: false };
}

export function setTheta(state: PredictionState, thetaDeg: number): PredictionState {
  if (state.phase !== "predict" || !Number.isFinite(thetaDeg)) {
    return state;
  }
  const next = clamp(thetaDeg, PREDICTION_THETA_MIN, PREDICTION_THETA_MAX);
  if (next === state.thetaDeg) {
    return state;
  }
  return { ...state, thetaDeg: next, lastLandingX: null, xPredicted: null, targetPlaced: false };
}

export function submitV0Estimate(state: PredictionState, value: number): PredictionState {
  if (state.phase !== "measure" || !Number.isFinite(value) || value <= 0) {
    return state;
  }
  const relativeError = Math.abs(value - state.hiddenV0) / state.hiddenV0;
  const accepted = relativeError <= V0_TOLERANCE + EPS;
  return {
    ...state,
    v0Estimate: value,
    v0Accepted: accepted,
    phase: accepted ? "predict" : "measure",
    lastLandingX: accepted ? null : state.lastLandingX,
  };
}

export function placeTarget(state: PredictionState, x: number): PredictionState {
  if (state.phase !== "predict" || !Number.isFinite(x) || x < 0) {
    return state;
  }
  return { ...state, xPredicted: x, targetPlaced: true };
}

export function recordLanding(state: PredictionState, landingX: number): PredictionState {
  if (state.phase === "measure") {
    return { ...state, lastLandingX: landingX };
  }
  if (state.phase === "predict" && state.targetPlaced && state.xPredicted !== null) {
    const deltaX = landingX - state.xPredicted;
    return {
      ...state,
      phase: "result",
      lastLandingX: landingX,
      outcome: { hit: Math.abs(deltaX) <= TARGET_HALF_WIDTH + EPS, deltaX, landingX },
    };
  }
  return state;
}

export function retryPrediction(state: PredictionState): PredictionState {
  if (state.phase === "measure") {
    return state;
  }
  return {
    ...state,
    phase: "predict",
    xPredicted: null,
    targetPlaced: false,
    lastLandingX: null,
    outcome: null,
  };
}

export function newDataset(
  state: PredictionState,
  random: RandomSource = Math.random,
): PredictionState {
  return createPrediction(random, state.h);
}
