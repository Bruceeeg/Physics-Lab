export const PLANCK_H = 6.62607015e-34;
export const ELEM_CHARGE = 1.602176634e-19;
export const SPEED_OF_LIGHT = 2.99792458e8;
export const PHOTON_DURATION = 5;
export const LED_RESISTANCE = 80;

export type PhotonMode = "led" | "photoelectric";

export type PhotonParams = {
  lambda_nm: number;
  V: number;
  phi_eV: number;
  Vstop: number;
};

export type PhotonSample = {
  t: number;
  f: number;
  Vth: number;
  lit: boolean;
  I: number;
  Kmax: number;
  emits: boolean;
  VstopPred: number;
  hMeas: number;
};

export const DEFAULT_PHOTON: PhotonParams = {
  lambda_nm: 620,
  V: 3.2,
  phi_eV: 2.3,
  Vstop: 0,
};

export function frequencyOf(lambda_nm: number) {
  return SPEED_OF_LIGHT / (lambda_nm * 1e-9);
}

export function thresholdVoltage(lambda_nm: number) {
  return (PLANCK_H * frequencyOf(lambda_nm)) / ELEM_CHARGE;
}

export function sampleAt(
  params: PhotonParams,
  t: number,
  mode: PhotonMode = "led",
): PhotonSample {
  const time = Math.max(0, t);
  const f = frequencyOf(params.lambda_nm);
  const Vth = thresholdVoltage(params.lambda_nm);
  if (mode === "photoelectric") {
    const rawK = PLANCK_H * f - params.phi_eV * ELEM_CHARGE;
    const emits = rawK > 0;
    const Kmax = emits ? rawK : 0;
    const VstopPred = Kmax / ELEM_CHARGE;
    const reaches = emits && params.Vstop <= VstopPred + 1e-12;
    return {
      t: time,
      f,
      Vth,
      lit: false,
      I: reaches ? 1.2e-6 : 0,
      Kmax,
      emits,
      VstopPred,
      hMeas: PLANCK_H,
    };
  }
  const lit = params.V + 1e-12 >= Vth;
  const I = lit ? (params.V - Vth) / LED_RESISTANCE : 0;
  return {
    t: time,
    f,
    Vth,
    lit,
    I,
    Kmax: 0,
    emits: false,
    VstopPred: 0,
    hMeas: (ELEM_CHARGE * Vth) / f,
  };
}
