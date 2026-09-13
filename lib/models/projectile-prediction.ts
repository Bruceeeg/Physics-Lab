import type { ProjectileParams } from "./projectile.ts";
import { range } from "./projectile.ts";

export const LANDING_REL_TOL = 0.01;
export const TARGET_HALF_WIDTH = 0.1;
export const PREDICTION_G = 9.81;
export const PREDICTION_H_MIN = 0.2;
export const PREDICTION_H_MAX = 3;
export const PREDICTION_THETA_MIN = 0;
export const PREDICTION_THETA_MAX = 80;
export const PREDICTION_V0_MIN = 0.5;
export const PREDICTION_V0_MAX = 12;
export const DEFAULT_PREDICTION_H = 1;
export const DEFAULT_PREDICTION_V0 = 5;
export const DEFAULT_PREDICTION_THETA = 30;

const EPS = 1e-9;

export type PredictionOutcome = {
  hit: boolean;
  deltaX: number;
  landingX: number;
  relativeError: number;
};

export type PredictionState = {
  v0: number;
  h: number;
  thetaDeg: number;
  xPredicted: number | null;
  lastLandingX: number | null;
  outcome: PredictionOutcome | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createPrediction(
  v0 = DEFAULT_PREDICTION_V0,
  h = DEFAULT_PREDICTION_H,
  thetaDeg = DEFAULT_PREDICTION_THETA,
): PredictionState {
  return {
    v0: Number.isFinite(v0) ? v0 : DEFAULT_PREDICTION_V0,
    h: Number.isFinite(h) && h >= 0 ? h : DEFAULT_PREDICTION_H,
    thetaDeg: Number.isFinite(thetaDeg) ? thetaDeg : DEFAULT_PREDICTION_THETA,
    xPredicted: null,
    lastLandingX: null,
    outcome: null,
  };
}

export function predictionParams(state: PredictionState): ProjectileParams {
  return { v0: state.v0, thetaDeg: state.thetaDeg, h: state.h, g: PREDICTION_G };
}

export function canLaunch(state: PredictionState) {
  return state.xPredicted !== null && Number.isFinite(state.xPredicted);
}

export function theoreticalRange(state: PredictionState) {
  return range(predictionParams(state));
}

export function setHeight(state: PredictionState, h: number): PredictionState {
  if (!Number.isFinite(h) || h === state.h) {
    return state;
  }
  return { ...state, h, lastLandingX: null, outcome: null };
}

export function setTheta(state: PredictionState, thetaDeg: number): PredictionState {
  if (!Number.isFinite(thetaDeg) || thetaDeg === state.thetaDeg) {
    return state;
  }
  return { ...state, thetaDeg, lastLandingX: null, outcome: null };
}

export function setV0(state: PredictionState, v0: number): PredictionState {
  if (!Number.isFinite(v0) || v0 === state.v0) {
    return state;
  }
  return { ...state, v0: Math.max(0.05, v0), lastLandingX: null, outcome: null };
}

export function placeTarget(state: PredictionState, x: number): PredictionState {
  if (!Number.isFinite(x) || x < 0) {
    return state;
  }
  return { ...state, xPredicted: x, lastLandingX: null, outcome: null };
}

export function relativeLandingError(predicted: number, landingX: number) {
  const scale = Math.max(Math.abs(predicted), EPS);
  return Math.abs(landingX - predicted) / scale;
}

export function recordLanding(state: PredictionState, landingX: number): PredictionState {
  if (state.xPredicted === null) {
    return { ...state, lastLandingX: landingX, outcome: null };
  }
  const deltaX = landingX - state.xPredicted;
  const relativeError = relativeLandingError(state.xPredicted, landingX);
  return {
    ...state,
    lastLandingX: landingX,
    outcome: {
      hit: relativeError <= LANDING_REL_TOL + EPS,
      deltaX,
      landingX,
      relativeError,
    },
  };
}

export function retryPrediction(state: PredictionState): PredictionState {
  return {
    ...state,
    lastLandingX: null,
    outcome: null,
  };
}

export function newDataset(state: PredictionState): PredictionState {
  return createPrediction(state.v0, state.h, state.thetaDeg);
}

export function clampPredictionV0(value: number) {
  return clamp(value, PREDICTION_V0_MIN, PREDICTION_V0_MAX);
}
