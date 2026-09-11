export type ResistorMode = "series" | "parallel";

export type ResistorParams = {
  emf: number;
  R1: number;
  R2: number;
  R3: number;
};

export type ResistorSample = {
  t: number;
  Req: number;
  I: number;
  I1: number;
  I2: number;
  I3: number;
  V1: number;
  V2: number;
  V3: number;
  P: number;
};

export const DEFAULT_RESISTOR: ResistorParams = {
  emf: 12,
  R1: 10,
  R2: 20,
  R3: 30,
};

export function sampleAt(
  params: ResistorParams,
  t: number,
  mode: ResistorMode = "series",
): ResistorSample {
  const time = Math.max(0, t);
  if (mode === "parallel") {
    const I1 = params.emf / params.R1;
    const I2 = params.emf / params.R2;
    const I3 = params.emf / params.R3;
    const I = I1 + I2 + I3;
    const Req = 1 / (1 / params.R1 + 1 / params.R2 + 1 / params.R3);
    return {
      t: time,
      Req,
      I,
      I1,
      I2,
      I3,
      V1: params.emf,
      V2: params.emf,
      V3: params.emf,
      P: params.emf * I,
    };
  }
  const Req = params.R1 + params.R2 + params.R3;
  const I = params.emf / Req;
  return {
    t: time,
    Req,
    I,
    I1: I,
    I2: I,
    I3: I,
    V1: I * params.R1,
    V2: I * params.R2,
    V3: I * params.R3,
    P: params.emf * I,
  };
}
