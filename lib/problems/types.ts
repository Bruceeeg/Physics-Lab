export type CourseId = "p1" | "p2" | "c-mech" | "c-em";

export type Givens = Record<string, number>;

export type Kind =
  | "atwood"
  | "atwood-incline"
  | "atwood-table"
  | "atwood-pulley"
  | "three-mass"
  | "spring-speed"
  | "spring-stick"
  | "spring-k"
  | "spring-work"
  | "projectile"
  | "table-launch"
  | "kinematic"
  | "incline"
  | "mu-angle"
  | "pull"
  | "friction-stop"
  | "loop"
  | "spring-t"
  | "pendulum-t"
  | "physical-t"
  | "torsion-t"
  | "parallel-t"
  | "freq-ratio"
  | "conical"
  | "horizontal-circle"
  | "vertical-circle"
  | "elastic"
  | "stick"
  | "ballistic"
  | "roll"
  | "rocket"
  | "drag"
  | "rod"
  | "turbine"
  | "ang-drop"
  | "rod-hit"
  | "torque"
  | "fluid"
  | "buoyancy"
  | "boyle"
  | "thermal"
  | "coulomb"
  | "gauss"
  | "gauss-slab"
  | "capacitor"
  | "coaxial"
  | "rc"
  | "series"
  | "parallel"
  | "rl"
  | "solenoid"
  | "wire"
  | "wire-pair"
  | "induction"
  | "emf-spin"
  | "lens"
  | "slit"
  | "standing"
  | "tube"
  | "photon"
  | "orbit"
  | "resistivity"
  | "power"
  | "cart-fit"
  | "impulse"
  | "rot-spring"
  | "snell"
  | "lorentz"
  | "boat"
  | "gas-energy";

export type Problem = {
  id: string;
  course: CourseId;
  year: number;
  set?: 1 | 2;
  number: number;
  slug: string;
  title: string;
  ask: string;
  kind: Kind;
  givens: Givens;
};

export type Answer = {
  label: string;
  unit: string;
  value: number;
};
