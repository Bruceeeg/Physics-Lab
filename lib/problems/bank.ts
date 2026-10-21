import type { CourseId, Givens, Kind, Problem } from "./types.ts";

const PROBLEMS: Problem[] = [];

function add(
  course: CourseId,
  year: number,
  set: 0 | 1 | 2,
  number: number,
  slug: string,
  title: string,
  ask: string,
  kind: Kind,
  givens: Givens,
) {
  PROBLEMS.push({
    id: set ? `${course}-${year}-s${set}-q${number}` : `${course}-${year}-q${number}`,
    course,
    year,
    set: set === 0 ? undefined : set,
    number,
    slug,
    title,
    ask,
    kind,
    givens,
  });
}

const g98 = { g: 9.8 };

add("p1", 2015, 0, 1, "atwood-machine", "Atwood machine", "Calculate the acceleration of the system and the tension in the string.", "atwood", { m1: 1, m2: 2, ...g98 });
add("p1", 2015, 0, 2, "resistor-circuits", "Resistors in series", "Calculate the equivalent resistance and the current in the circuit.", "series", { emf: 12, R1: 10, R2: 20, R3: 30 });
add("p1", 2015, 0, 3, "conservation-of-energy", "Block launched by a spring", "Calculate the speed of the block when the spring returns to its equilibrium length.", "spring-speed", { k: 180, A: 0.12, m: 0.45, ...g98 });
add("p1", 2015, 0, 4, "projectile-motion", "Object launched horizontally", "Calculate the time of flight and the horizontal distance traveled before the object reaches the ground.", "table-launch", { v0: 4, h: 1.25, ...g98 });
add("p1", 2015, 0, 5, "waves-optics", "Standing wave on a string", "Calculate the wave speed and the frequency of the standing wave.", "standing", { L: 1.2, n: 2, T: 48, mu: 0.012 });

add("p1", 2016, 0, 1, "rotational-motion", "Object rolling without slipping", "Calculate the speed at the bottom of the incline and the horizontal distance traveled after the object leaves the table.", "roll", { m: 1.2, r: 0.15, h: 0.8, theta: 20, H: 0.9, shape: 1, ...g98 });
add("p1", 2016, 0, 2, "impulse-momentum", "Elastic collision", "Calculate the velocities of the two objects immediately after the elastic collision.", "elastic", { m1: 0.2, v1: 3, m2: 0.8, v2: -1 });
add("p1", 2016, 0, 3, "incline-friction", "Block on an inclined plane", "Calculate the acceleration of the block along the incline and its speed at the bottom.", "incline", { m: 0.5, theta: 18, muS: 0.05, muK: 0.04, L: 2, ...g98 });
add("p1", 2016, 0, 4, "resistor-circuits", "Identical resistors in parallel", "Calculate the current in the circuit when the resistors are connected in parallel.", "parallel", { emf: 9, R1: 40, R2: 40, R3: 40 });
add("p1", 2016, 0, 5, "waves-optics", "Fundamental standing wave", "Calculate the wave speed and the fundamental frequency of the string.", "standing", { L: 0.9, n: 1, T: 25, mu: 0.01 });

add("p1", 2017, 0, 1, "resistor-circuits", "Bulbs in parallel", "Calculate the total current when the bulbs are connected in parallel.", "parallel", { emf: 6, R1: 12, R2: 12, R3: 12 });
add("p1", 2017, 0, 2, "incline-friction", "Block at the angle of repose", "Determine the coefficient of static friction when the block is on the verge of sliding.", "mu-angle", { theta: 28, ...g98 });
add("p1", 2017, 0, 3, "angular-momentum", "Rod struck by a sphere", "Calculate the angular speed of the rod at the bottom and the speed of the sphere after the collision.", "rod-hit", { M: 0.6, R: 0.5, m: 0.15, ...g98 });
add("p1", 2017, 0, 4, "projectile-motion", "Horizontal launch from a table", "Calculate the time of flight and the horizontal distance traveled.", "table-launch", { v0: 2.4, h: 0.95, ...g98 });
add("p1", 2017, 0, 5, "waves-optics", "Second harmonic on a string", "Calculate the wave speed and the frequency of the second harmonic.", "standing", { L: 1, n: 2, T: 36, mu: 0.009 });

add("p1", 2018, 0, 1, "horizontal-circular", "Satellite in a circular orbit", "Calculate the gravitational force on the satellite and its orbital speed.", "orbit", { M: 5.97e24, m: 800, r: 6.8e6, ...g98 });
add("p1", 2018, 0, 2, "resistor-circuits", "Resistivity of a cylinder", "Calculate the resistivity of the cylindrical sample.", "resistivity", { R: 18, A: 3e-4, L: 0.12 });
add("p1", 2018, 0, 3, "rotational-motion", "Disk rolling down an incline", "Calculate the speed and angular speed of the disk after it descends through the given vertical height.", "roll", { m: 0.8, r: 0.12, h: 0.4, theta: 25, H: 0, shape: 0, ...g98 });
add("p1", 2018, 0, 4, "waves-optics", "Transverse wave on a string", "Calculate the wave speed and the frequency of the given harmonic.", "standing", { L: 1.5, n: 3, T: 60, mu: 0.015 });
add("p1", 2018, 0, 5, "harmonic-motion", "Spring-block oscillator", "Calculate the period of oscillation of the block.", "spring-t", { m: 0.25, k: 100, ...g98 });

add("p1", 2019, 0, 1, "pull-friction", "Block crossing a rough patch", "Calculate the acceleration on the rough patch and the speed at the end of the patch.", "friction-stop", { m: 0.4, mu: 0.25, v0: 3.2, D: 0.8, ...g98 });
add("p1", 2019, 0, 2, "atwood-machine", "Modified Atwood machine", "Calculate the acceleration of the system when the hanging block pulls the block on the table.", "atwood-table", { m1: 1.5, m2: 0.8, mu: 0.2, ...g98 });
add("p1", 2019, 0, 3, "projectile-motion", "Ball launched horizontally", "Calculate the time of flight and the horizontal distance traveled by the ball.", "table-launch", { v0: 5, h: 1.1, ...g98 });
add("p1", 2019, 0, 4, "conservation-of-energy", "Object lifted at constant speed", "Calculate the average power required to lift the object through the given height.", "power", { m: 3, h: 1.2, t: 5, ...g98 });
add("p1", 2019, 0, 5, "waves-optics", "Open tube at resonance", "Calculate the length of the air column that resonates at the fundamental frequency.", "tube", { v: 340, f: 512 });

add("p1", 2021, 0, 1, "projectile-motion", "Projectile launched at an angle", "Calculate the horizontal range and the maximum height of the projectile.", "projectile", { v0: 11, theta: 25, h: 1.4, ...g98 });
add("p1", 2021, 0, 2, "pull-friction", "Force applied at an angle", "Calculate the horizontal acceleration and the normal force while the object remains on the surface.", "pull", { F: 16, theta: 25, m: 2, mu: 0.3, muS: 0.35, muK: 0.3, ...g98 });
add("p1", 2021, 0, 3, "impulse-momentum", "Constant force on a disk", "Calculate the impulse delivered to the disk and its final velocity.", "impulse", { F: 12, t: 0.35, m: 0.8, ...g98 });
add("p1", 2021, 0, 4, "rotational-motion", "Cylinder rolling without slipping", "Calculate the speed of the cylinder at the bottom of the incline.", "roll", { m: 0.7, r: 0.08, h: 0.55, theta: 30, H: 0, shape: 0, ...g98 });
add("p1", 2021, 0, 5, "rotation-n2", "Atwood machine with a massive pulley", "Calculate the linear acceleration of the system, including the rotational inertia of the pulley.", "atwood-pulley", { m1: 0.4, m2: 0.7, Mp: 0.3, Rp: 0.08, ...g98 });

add("p1", 2022, 0, 1, "harmonic-motion", "Spring constant from equilibrium stretch", "Determine the spring constant from the equilibrium stretch, and calculate the period of oscillation.", "spring-k", { m: 0.35, x: 0.07, ...g98 });
add("p1", 2022, 0, 2, "horizontal-circular", "Satellites in circular orbits", "Calculate the orbital speed of a satellite in a circular orbit about the planet.", "orbit", { M: 1.9e27, m: 7e22, r: 4.2e8, ...g98 });
add("p1", 2022, 0, 3, "rotation-n2", "Mass hanging from a pulley", "Calculate the acceleration of the hanging block, including the rotational inertia of the pulley.", "atwood-pulley", { m1: 0.2, m2: 0.55, Mp: 0.5, Rp: 0.1, ...g98 });
add("p1", 2022, 0, 4, "impulse-momentum", "Perfectly inelastic collision", "Calculate the common velocity of the objects immediately after the perfectly inelastic collision.", "stick", { m1: 0.15, v1: 4, m2: 0.5, v2: 0 });
add("p1", 2022, 0, 5, "harmonic-motion", "Unknown spring constant", "Determine the spring constant from the equilibrium stretch, and calculate the period.", "spring-k", { m: 0.2, x: 0.04, ...g98 });

add("p1", 2023, 0, 1, "harmonic-motion", "Horizontal spring-block oscillator", "Calculate the period of the spring-block oscillator.", "spring-t", { m: 0.45, k: 36, ...g98 });
add("p1", 2023, 0, 2, "incline-friction", "Cart released on a frictionless incline", "Calculate the acceleration of the cart along the incline and its speed at the bottom.", "incline", { m: 0.6, theta: 22, muS: 0, muK: 0, L: 1.4, ...g98 });
add("p1", 2023, 0, 3, "horizontal-circular", "Spring providing the centripetal force", "Calculate the angular speed when the spring force provides the centripetal force.", "rot-spring", { k: 25, dx: 0.08, m: 0.2, r: 0.3 });
add("p1", 2023, 0, 4, "rotation-n2", "String wrapped around a disk", "Calculate the acceleration of the hanging object, including the rotational inertia of the disk.", "atwood-pulley", { m1: 0.3, m2: 0.9, Mp: 0.6, Rp: 0.12, ...g98 });
add("p1", 2023, 0, 5, "physical-pendulum", "Physical pendulum", "Calculate the period of the physical pendulum for small-amplitude oscillations.", "physical-t", { L: 0.8, m: 0.4, pivot: 0.1, ...g98 });

add("p1", 2024, 0, 1, "loop-track", "Block on a vertical loop", "Calculate the minimum release height at which the block remains on the track, and the speed at the top.", "loop", { m: 0.3, R: 0.4, h: 1, roll: 0, ...g98 });
add("p1", 2024, 0, 2, "harmonic-motion", "Vertical spring and hanging mass", "Determine the spring constant from the equilibrium stretch, and calculate the period.", "spring-k", { m: 0.15, x: 0.03, ...g98 });
add("p1", 2024, 0, 3, "torque-equilibrium", "Hinged beam", "Calculate the net torque about the pivot and the angular acceleration of the beam.", "torque", { L: 1.2, M: 3, f: 0, m: 2, x: 1.2, ...g98 });
add("p1", 2024, 0, 4, "harmonic-motion", "Simple pendulum", "Calculate the period of the simple pendulum for small-amplitude oscillations.", "pendulum-t", { L: 0.75, m: 0.05, ...g98 });
add("p1", 2024, 0, 5, "impulse-momentum", "One-dimensional elastic collision", "Calculate the velocity of each block immediately after the elastic collision.", "elastic", { m1: 6, v1: 4, m2: 2, v2: 0 });

add("p1", 2025, 0, 1, "impulse-momentum", "Cart catching a block", "Calculate the common velocity after the block sticks to the cart.", "stick", { m1: 1, v1: 4, m2: 0.2, v2: 0 });
add("p1", 2025, 0, 2, "conservation-of-energy", "Block colliding with a spring", "Calculate the speed of the block when the spring returns to its equilibrium length.", "spring-speed", { k: 120, A: 0.08, m: 0.5, ...g98 });
add("p1", 2025, 0, 3, "torque-equilibrium", "Meter stick about its center", "Calculate the net torque on the meter stick about the pivot.", "torque", { L: 1, M: 0.12, f: 0.5, m: 0.2, x: 0.85, ...g98 });
add("p1", 2025, 0, 4, "archimedes", "Fully submerged block", "Calculate the buoyant force and the initial acceleration of the fully submerged block.", "buoyancy", { rho: 700, rhoF: 1000, side: 0.08, ...g98 });

add("p2", 2015, 0, 1, "geometric-optics", "Refraction from air into a liquid", "Calculate the angle of refraction as light passes from air into the liquid.", "snell", { n1: 1, n2: 1.33, theta: 35 });
add("p2", 2015, 0, 2, "resistor-circuits", "Bulbs in series", "Calculate the current when the three bulbs are connected in series.", "series", { emf: 12, R1: 8, R2: 8, R3: 8 });
add("p2", 2015, 0, 3, "boyles-law", "Isothermal compression", "Calculate the final pressure of the ideal gas after the isothermal compression.", "boyle", { n: 0.08, T: 270, V0: 2000, Vf: 1000 });
add("p2", 2015, 0, 4, "capacitance", "Parallel-plate capacitor", "Calculate the capacitance and the energy stored in the capacitor.", "capacitor", { A: 2500, d: 10, kappa: 1, V: 100 });

add("p2", 2016, 0, 1, "boyles-law", "Monatomic ideal gas", "Calculate the pressure of the gas and the change in its internal energy.", "gas-energy", { n: 2, T: 300, V: 0.01, dT: 150 });
add("p2", 2016, 0, 2, "geometric-optics", "Refraction into glass", "Calculate the angle of refraction as the ray enters the glass.", "snell", { n1: 1, n2: 1.52, theta: 42 });
add("p2", 2016, 0, 3, "electric-field", "Point charge", "Calculate the electric field and the electric force at the given distance from the point charge.", "coulomb", { Q: 3, q: 2, r: 15 });
add("p2", 2016, 0, 4, "rc-circuits", "Charging RC circuit", "Calculate the time constant and the charge on the capacitor at t = τ.", "rc", { R: 1500, C: 220, emf: 9 });

add("p2", 2017, 0, 1, "fluid-dynamics", "Fluid exiting a small opening", "Calculate the efflux speed and the horizontal range of the stream.", "fluid", { H: 1.1, y: 0.35, ...g98 });
add("p2", 2017, 0, 2, "resistor-circuits", "Resistivity from one measurement", "Calculate the resistivity from the measured resistance, cross-sectional area, and length.", "resistivity", { R: 4.5, A: 1.2e-5, L: 0.25 });
add("p2", 2017, 0, 3, "geometric-optics", "Converging lens", "Calculate the image distance for the given object distance and focal length.", "lens", { f: 0.2, s: 0.45, concave: 0 });
add("p2", 2017, 0, 4, "coulombs-law", "Test charge near a point charge", "Calculate the electric field and the electric force on the test charge.", "coulomb", { Q: 4, q: 1, r: 10 });

add("p2", 2018, 0, 1, "electromagnetic-induction", "Loop entering a uniform magnetic field", "Calculate the induced emf and the current in the loop.", "induction", { B: 0.3, ell: 0.12, v: 1.5, R: 2 });
add("p2", 2018, 0, 2, "resistor-circuits", "Resistors in series", "Calculate the equivalent resistance and the current.", "series", { emf: 18, R1: 6, R2: 12, R3: 18 });
add("p2", 2018, 0, 3, "particle-model-of-light", "Photoelectric effect", "Calculate the maximum kinetic energy of the photoelectrons and the stopping potential.", "photon", { lambda: 380, phi: 2.1 });
add("p2", 2018, 0, 4, "archimedes", "Floating object", "Calculate the maximum additional mass that can be loaded before the object is fully submerged.", "boat", { rho: 1000, V: 8, m: 2500 });

add("p2", 2019, 0, 1, "magnetism", "Long, straight wire", "Calculate the magnetic field at the given distance from the long, straight wire.", "wire", { I: 8, r: 6 });
add("p2", 2019, 0, 2, "resistor-circuits", "Resistors in parallel", "Calculate the equivalent resistance and the total current.", "parallel", { emf: 12, R1: 30, R2: 60, R3: 20 });
add("p2", 2019, 0, 3, "thermal-conductivity", "Conduction through a slab", "Calculate the rate of energy transfer through the slab.", "thermal", { k: 0.2, A: 80, L: 1.5, Th: 373, Tc: 293 });
add("p2", 2019, 0, 4, "geometric-optics", "Refraction from water into air", "Calculate the angle of refraction as light passes from water into air.", "snell", { n1: 1.33, n2: 1, theta: 30 });

add("p2", 2021, 0, 1, "boyles-law", "Ideal gas at constant volume", "Calculate the pressure of the gas and the change in internal energy.", "gas-energy", { n: 1, T: 280, V: 0.025, dT: 80 });
add("p2", 2021, 0, 2, "boyles-law", "Isothermal process", "Calculate the pressure after the isothermal compression.", "boyle", { n: 0.05, T: 300, V0: 4000, Vf: 1600 });
add("p2", 2021, 0, 3, "electromagnetic-induction", "Conducting loop moving in a magnetic field", "Calculate the induced emf in the moving loop.", "induction", { B: 0.15, ell: 0.08, v: 2.2, R: 1.2 });
add("p2", 2021, 0, 4, "particle-model-of-light", "Photoelectric effect", "Calculate the maximum kinetic energy of the emitted electrons.", "photon", { lambda: 450, phi: 1.8 });

add("p2", 2022, 0, 1, "waves-optics", "Double-slit interference", "Calculate the spacing between adjacent bright fringes on the screen.", "slit", { lambda: 632, d: 0.2, screen: 1.5 });
add("p2", 2022, 0, 2, "resistor-circuits", "Parallel combination", "Calculate the total current when the resistors are connected in parallel.", "parallel", { emf: 12, R1: 10, R2: 20, R3: 20 });
add("p2", 2022, 0, 3, "coulombs-law", "Proton and electron in hydrogen", "Calculate the electric force between a proton and an electron separated by the Bohr radius. The charges are the elementary charge.", "coulomb", { Q: 1.602176634e-13, q: 1.602176634e-10, r: 5.291772109e-9 });
add("p2", 2022, 0, 4, "magnetism", "Moving charge near a current", "Calculate the magnetic force on the moving charged particle.", "lorentz", { q: 2e-6, v: 30, B: 0.25 });

add("p2", 2023, 0, 1, "geometric-optics", "Refraction from air into water", "Calculate the angle of refraction.", "snell", { n1: 1, n2: 1.33, theta: 50 });
add("p2", 2023, 0, 2, "rc-circuits", "Resistor in series with a capacitor", "Calculate the time constant and the charge on the capacitor at t = τ.", "rc", { R: 500, C: 470, emf: 6 });
add("p2", 2023, 0, 3, "fluid-dynamics", "Horizontal stream from a tank", "Calculate the efflux speed and the range of the stream.", "fluid", { H: 0.9, y: 0.2, ...g98 });
add("p2", 2023, 0, 4, "electric-field", "Positive point charges", "Calculate the electric field at the given distance from the charge.", "coulomb", { Q: 5, q: 1, r: 12 });

add("p2", 2024, 0, 1, "particle-model-of-light", "Photoelectric effect for a metal", "Calculate the maximum kinetic energy of the photoelectrons.", "photon", { lambda: 360, phi: 2.4 });
add("p2", 2024, 0, 2, "boyles-law", "Heated monatomic ideal gas", "Calculate the pressure after heating and the change in internal energy.", "gas-energy", { n: 0.4, T: 290, V: 0.015, dT: 40 });
add("p2", 2024, 0, 3, "resistor-circuits", "Identical resistors in series", "Calculate the equivalent resistance and the current.", "series", { emf: 12, R1: 15, R2: 15, R3: 15 });
add("p2", 2024, 0, 4, "magnetism", "Charged particle in a magnetic field", "Calculate the magnetic force on the particle.", "lorentz", { q: 1.6e-6, v: 4e3, B: 0.05 });

add("p2", 2025, 0, 1, "magnetism", "Parallel wires with currents in the same direction", "Calculate the net magnetic field at the midpoint between the wires.", "wire-pair", { I: 6, r: 5, align: -1 });
add("p2", 2025, 0, 2, "boyles-law", "Gas sealed by a piston", "Calculate the pressure of the gas at the given volume.", "boyle", { n: 0.02, T: 295, V0: 800, Vf: 500 });
add("p2", 2025, 0, 3, "rc-circuits", "Unknown resistor and a capacitor", "Calculate the time constant of the series RC circuit.", "rc", { R: 2200, C: 150, emf: 12 });
add("p2", 2025, 0, 4, "waves-optics", "Double-slit pattern", "Calculate the distance between the centers of adjacent bright fringes.", "slit", { lambda: 532, d: 0.15, screen: 2 });

add("c-em", 2017, 0, 1, "electric-field", "Infinite charged slab", "Calculate the electric field inside the slab at the given distance from the midplane.", "gauss-slab", { rho: 2e-6, z: 0.008, A: 0.04 });
add("c-em", 2017, 0, 2, "rc-circuits", "Capacitor charged through a resistor", "Calculate the time constant and the charge on the capacitor at t = τ.", "rc", { R: 1000, C: 50, emf: 12 });
add("c-em", 2017, 0, 3, "solenoid", "Magnetic field of a solenoid", "Calculate the magnetic field inside the solenoid.", "solenoid", { I: 1.5, N: 400, L: 20 });

add("c-em", 2018, 0, 1, "electric-field", "Charge inside a conducting shell", "Calculate the electric field and the electric flux outside the shell.", "gauss", { Q: 4, R: 8, r: 16 });
add("c-em", 2018, 0, 2, "capacitance", "Dielectric between parallel plates", "Calculate the capacitance and the energy stored after the dielectric is inserted.", "capacitor", { A: 600, d: 2, kappa: 3.5, V: 12 });
add("c-em", 2018, 0, 3, "magnetism", "Parallel wires with currents in opposite directions", "Calculate the net magnetic field at the midpoint, where the two fields are in the same direction.", "wire-pair", { I: 4, r: 3, align: 1 });

add("c-em", 2019, 1, 1, "electric-field", "Charge outside a long cylinder", "Calculate the electric field outside the charged cylinder.", "gauss", { Q: 1.2, R: 5, r: 14 });
add("c-em", 2019, 1, 2, "resistor-circuits", "Batteries and resistors in series", "Calculate the equivalent resistance and the current in the circuit.", "series", { emf: 12, R1: 10, R2: 20, R3: 30 });
add("c-em", 2019, 1, 3, "solenoid", "Field inside a solenoid", "Calculate the magnetic field inside the solenoid from the number of turns, the length, and the current.", "solenoid", { I: 2.5, N: 500, L: 25 });

add("c-em", 2019, 2, 1, "rc-circuits", "Charging capacitor", "Calculate the charging time constant and the charge at t = τ.", "rc", { R: 800, C: 250, emf: 9 });
add("c-em", 2019, 2, 2, "electric-field", "Charge inside a hollow sphere", "Calculate the electric field and the electric flux outside the sphere.", "gauss", { Q: 2.5, R: 5, r: 8 });
add("c-em", 2019, 2, 3, "electromagnetic-induction", "Loop moving through a magnetic field", "Calculate the motional emf in the loop.", "induction", { B: 0.2, ell: 0.05, v: 3, R: 4 });

add("c-em", 2021, 0, 1, "rc-circuits", "Capacitors charged by a battery", "Calculate the time constant just after the switch is closed and the charge at t = τ.", "rc", { R: 500, C: 40, emf: 10 });
add("c-em", 2021, 0, 2, "coulombs-law", "Force between conducting spheres", "Calculate the electric force between the spheres at the given separation.", "coulomb", { Q: 2, q: 2, r: 8 });
add("c-em", 2021, 0, 3, "electromagnetic-induction", "Loop rotating in a uniform magnetic field", "Calculate the maximum induced emf in the rotating loop.", "emf-spin", { B: 0.15, A: 0.03, w: 20 });

add("c-em", 2022, 1, 1, "electric-field", "Charged sphere inside a conducting shell", "Calculate the electric field and the electric flux outside the shell.", "gauss", { Q: 6, R: 4, r: 16 });
add("c-em", 2022, 1, 2, "rc-circuits", "Capacitor discharging through a resistor", "Calculate the time constant of the RC circuit.", "rc", { R: 1200, C: 80, emf: 5 });
add("c-em", 2022, 1, 3, "electromagnetic-induction", "Side of a loop moving through a magnetic field", "Calculate the motional emf.", "induction", { B: 0.05, ell: 0.04, v: 1, R: 10 });

add("c-em", 2022, 2, 1, "electric-field", "Charged cylinder inside a conducting shell", "Calculate the electric field outside the shell.", "gauss", { Q: 3, R: 6, r: 12 });
add("c-em", 2022, 2, 2, "rc-circuits", "Capacitor with internal resistance", "Calculate the time constant, including the internal resistance.", "rc", { R: 40, C: 1000, emf: 8 });
add("c-em", 2022, 2, 3, "solenoid", "Single loop inside a solenoid", "Calculate the magnetic field inside the solenoid.", "solenoid", { I: 3, N: 500, L: 25 });

add("c-em", 2023, 1, 1, "coulombs-law", "Electric force between two spheres", "Calculate the electric force for the given charges and separation.", "coulomb", { Q: 1, q: 0.4, r: 6 });
add("c-em", 2023, 1, 2, "electromagnetic-induction", "Conducting bar on rails", "Calculate the motional emf when the bar moves at the given speed.", "induction", { B: 0.4, ell: 0.4, v: 2, R: 0.3 });
add("c-em", 2023, 1, 3, "rc-circuits", "Charging branch of an RC circuit", "Calculate the time constant of the charging branch.", "rc", { R: 100, C: 200, emf: 12 });

add("c-em", 2023, 2, 1, "coulombs-law", "Charged spheres on an insulating stand", "Calculate the electric force between the charges.", "coulomb", { Q: 1.5, q: 0.8, r: 9 });
add("c-em", 2023, 2, 2, "electromagnetic-induction", "Bar entering a magnetic field", "Calculate the motional emf after the bar enters the field.", "induction", { B: 0.35, ell: 0.3, v: 1.8, R: 0.2 });
add("c-em", 2023, 2, 3, "rc-circuits", "Switch closed to position A", "Calculate the time constant of that branch and the charge at t = τ.", "rc", { R: 250, C: 120, emf: 10 });

add("c-em", 2024, 1, 1, "equipotential", "Charged sphere and equipotential lines", "Calculate the electric field at a point outside the sphere.", "gauss", { Q: -0.002, R: 2, r: 8 });
add("c-em", 2024, 1, 2, "rl-circuits", "Inductor in series with parallel resistors", "Calculate the time constant for the increasing current and the current at t = τ.", "rl", { R: 20, L: 60, emf: 9 });
add("c-em", 2024, 1, 3, "electromagnetic-induction", "Rectangular loop entering a magnetic field", "Calculate the motional emf and the current.", "induction", { B: 0.25, ell: 0.1, v: 2.5, R: 1.5 });

add("c-em", 2024, 2, 1, "equipotential", "Positive sphere near a line charge", "Calculate the magnitude of the electric field outside the sphere.", "gauss", { Q: 0.001, R: 2, r: 10 });
add("c-em", 2024, 2, 2, "rl-circuits", "Inductor in series with resistors", "Calculate the time constant and the current at t = τ.", "rl", { R: 30, L: 90, emf: 12 });
add("c-em", 2024, 2, 3, "electromagnetic-induction", "Square loop entering a uniform field", "Calculate the motional emf.", "induction", { B: 0.18, ell: 0.08, v: 3, R: 2 });

add("c-em", 2025, 0, 1, "capacitance", "Coaxial cylindrical capacitor", "Calculate the capacitance from the inner radius, the outer radius, and the length.", "coaxial", { R1: 0.008, R2: 0.02, L: 0.25 });
add("c-em", 2025, 0, 2, "electromagnetic-induction", "Loop rotating at constant angular speed", "Calculate the maximum induced emf.", "emf-spin", { B: 0.12, A: 0.04, w: 15 });
add("c-em", 2025, 0, 3, "resistor-circuits", "Resistivity of a cylindrical sample", "Calculate the resistivity from the resistance, cross-sectional area, and length.", "resistivity", { R: 6, A: 8e-6, L: 0.3 });
add("c-em", 2025, 0, 4, "magnetism", "Parallel wires with opposite currents", "Calculate the net magnetic field at the midpoint.", "wire-pair", { I: 5, r: 4, align: 1 });

const cart = { f1: 0.32, a1: 0.12, f2: 0.38, a2: 0.22, f3: 0.44, a3: 0.33, f4: 0.5, a4: 0.5, f5: 0.6, a5: 0.7, F: 0.45, t: 2, ...g98 };

add("c-mech", 2016, 0, 1, "pull-friction", "Cart pulled by a force sensor", "Determine the mass of the cart and the frictional force from the best-fit line of F as a function of a. Then calculate the acceleration when F = 0.45 N and the time required to stop after the string breaks.", "cart-fit", cart);
add("c-mech", 2016, 0, 2, "variable-force", "Nonlinear spring and an inelastic collision", "Calculate the speed immediately after the perfectly inelastic collision and the maximum compression of the spring.", "spring-work", { M: 0.25, v0: 2.4, B: 120 });
add("c-mech", 2016, 0, 3, "angular-momentum", "Block on a rotating rod", "Calculate the angular speed when the spring force provides the centripetal force.", "rot-spring", { k: 50, dx: 0.06, m: 0.2, r: 0.24 });

add("c-mech", 2017, 0, 1, "atwood-machine", "Atwood machine", "Calculate the acceleration of the system and the tension in the string.", "atwood", { m1: 0.2, m2: 0.3, ...g98 });
add("c-mech", 2017, 0, 2, "incline-friction", "Block sliding down a frictionless incline", "Calculate the acceleration of the block along the incline and its speed at the bottom.", "incline", { m: 0.5, theta: 30, muS: 0, muK: 0, L: 1.2, ...g98 });
add("c-mech", 2017, 0, 3, "rotational-motion", "Solid cylinder rolling off a table", "The incline is 30° and has vertical height 0.50 m. The table height is 0.75 m. Calculate the total kinetic energy, the angular speed, and the horizontal distance to the landing point.", "roll", { m: 0.5, r: 0.1, h: 0.5, theta: 30, H: 0.75, shape: 0, ...g98 });

add("c-mech", 2018, 0, 1, "linear-motion", "Object released from rest", "Calculate the displacement and the final velocity for the measured constant acceleration.", "kinematic", { x0: 0, v0: 0, a: 9.8, t: 0.4 });
add("c-mech", 2018, 0, 2, "impulse-momentum", "Elastic collision of two carts", "Calculate the velocity of each cart immediately after the elastic collision.", "elastic", { m1: 0.5, v1: 3, m2: 0.5, v2: 0 });
add("c-mech", 2018, 0, 3, "nonuniform-rod", "Rod with linear density proportional to x", "Calculate the position of the center of mass and the rotational inertia about the end.", "rod", { M: 0.8, L: 0.6, quad: 0, ...g98 });

add("c-mech", 2019, 1, 1, "drag-force", "Object falling with linear drag", "Calculate the terminal speed for a resistive force proportional to speed.", "drag", { m: 0.012, b: 0.08, quad: 0, ...g98 });
add("c-mech", 2019, 1, 2, "ballistic-pendulum", "Ballistic pendulum", "Calculate the speed of the pendulum immediately after the perfectly inelastic collision and the maximum angle.", "ballistic", { m1: 0.05, v1: 6, m2: 0.4, L: 0.7, ...g98 });
add("c-mech", 2019, 1, 3, "angular-momentum", "Clay dropped onto a rotating disk", "Calculate the angular speed of the disk after the clay sticks to it.", "ang-drop", { M: 1.5, R: 0.3, w0: 8, m: 0.2, r: 0.3 });

add("c-mech", 2019, 2, 1, "atwood-machine", "Three connected objects", "Calculate the acceleration of the three-object system.", "three-mass", { m: 0.3, M: 1.2, theta: 30, ...g98 });
add("c-mech", 2019, 2, 2, "variable-force", "Rocket with a = 9.0 − 0.25 t²", "The engine burns for 6.0 s. Calculate the impulse, the speed, the kinetic energy, and the height at burnout.", "rocket", { m: 0.5, K: 9, L: 0.25, tBurn: 6, t: 6, ...g98 });
add("c-mech", 2019, 2, 3, "rotational-motion", "Solid sphere rolling without slipping", "Calculate the speed of the sphere at the bottom of the incline.", "roll", { m: 0.4, r: 0.05, h: 0.6, theta: 28, H: 0, shape: 2, ...g98 });

add("c-mech", 2021, 1, 1, "linear-motion", "Fan cart with constant acceleration", "Calculate the displacement and the velocity of the cart on the horizontal segment.", "kinematic", { x0: 0, v0: 0, a: 1.6, t: 1.2 });
add("c-mech", 2021, 1, 2, "loop-track", "Block that must complete a vertical loop", "Calculate the minimum release height required for the block to remain in contact through the loop.", "loop", { m: 0.25, R: 0.3, h: 0.9, roll: 0, ...g98 });
add("c-mech", 2021, 1, 3, "nonuniform-rod", "Rod with linear density proportional to x²", "Calculate the position of the center of mass and the rotational inertia about the left end.", "rod", { M: 1, L: 0.75, quad: 1, ...g98 });

add("c-mech", 2021, 2, 1, "atwood-machine", "Block on a rough table", "A 0.44 kg block is on the table and a 0.20 kg block hangs. The coefficient of friction used here is 0.12. Calculate the acceleration of the system.", "atwood-table", { m1: 0.44, m2: 0.2, mu: 0.12, ...g98 });
add("c-mech", 2021, 2, 2, "physical-pendulum", "Uniform rod pivoted at one end", "Calculate the period of small-amplitude oscillations of the rod as a physical pendulum.", "physical-t", { L: 0.9, m: 0.5, pivot: 0, ...g98 });
add("c-mech", 2021, 2, 3, "conservation-of-energy", "Spring launching a block onto a track", "Calculate the speed of the block as it leaves the spring.", "spring-speed", { k: 200, A: 0.1, m: 0.3, ...g98 });

add("c-mech", 2022, 1, 1, "atwood-machine", "Hanging block pulling a block on a rough table", "Calculate the acceleration when the hanging block descends.", "atwood-table", { m1: 1.2, m2: 0.8, mu: 0.25, ...g98 });
add("c-mech", 2022, 1, 2, "incline-friction", "Cart released on a frictionless incline", "Calculate the acceleration of the cart along the incline.", "incline", { m: 0.5, theta: 30, muS: 0, muK: 0, L: 1.2, ...g98 });
add("c-mech", 2022, 1, 3, "rotation-n2", "Disk pulley with a hanging mass", "Calculate the acceleration, including the rotational inertia of the disk.", "atwood-pulley", { m1: 0.25, m2: 0.6, Mp: 0.8, Rp: 0.15, ...g98 });

add("c-mech", 2022, 2, 1, "pull-friction", "Sled pulled by a horizontal tension", "Calculate the acceleration of the sled.", "pull", { F: 6, theta: 0, m: 1.5, mu: 0.2, muS: 0.3, muK: 0.2, ...g98 });
add("c-mech", 2022, 2, 2, "conservation-of-energy", "Spring launch followed by an inelastic collision", "Calculate the speed as the block leaves the spring and the common speed after the perfectly inelastic collision.", "spring-stick", { m1: 0.8, m2: 0.4, k: 160, A: 0.1, mu: 0, D: 0, ...g98 });
add("c-mech", 2022, 2, 3, "physical-pendulum", "Plate pivoted away from its center", "Calculate the period of small-amplitude oscillations of the physical pendulum.", "physical-t", { L: 1, m: 0.6, pivot: 0.25, ...g98 });

add("c-mech", 2023, 1, 1, "conservation-of-energy", "Spring launching a block up an incline", "Calculate the speed of the block as it leaves the spring.", "spring-speed", { k: 90, A: 0.15, m: 0.4, ...g98 });
add("c-mech", 2023, 1, 2, "torsional-pendulum", "Torsional oscillator", "Calculate the period of the torsional oscillator.", "torsion-t", { m: 0.5, L: 0.12, kappa: 0.3, n: 1, ...g98 });
add("c-mech", 2023, 1, 3, "angular-momentum", "Rod swinging into a sphere", "Calculate the angular speed of the rod at the bottom and the speed of the sphere after the collision.", "rod-hit", { M: 0.4, R: 0.6, m: 0.1, ...g98 });

add("c-mech", 2023, 2, 1, "impulse-momentum", "Perfectly inelastic collision of two carts", "Calculate the common velocity immediately after the perfectly inelastic collision.", "stick", { m1: 1000, v1: 8, m2: 2000, v2: -2 });
add("c-mech", 2023, 2, 2, "harmonic-motion", "Springs connected in parallel", "Calculate the period when three identical springs are connected in parallel.", "parallel-t", { m: 0.4, k: 30, n: 3, ...g98 });
add("c-mech", 2023, 2, 3, "nonuniform-rod", "Three blades about one end", "Calculate the rotational inertia of the three blades about the end.", "turbine", { M: 2, L: 1.2, n: 3, ...g98 });

add("c-mech", 2024, 1, 1, "conservation-of-energy", "Block sliding down a frictionless incline", "Calculate the speed of the block at the bottom of the incline.", "incline", { m: 0.5, theta: 30, muS: 0, muK: 0, L: 0.8, ...g98 });
add("c-mech", 2024, 1, 2, "drag-force", "Sphere falling with linear air resistance", "Calculate the terminal speed.", "drag", { m: 0.2, b: 0.15, quad: 0, ...g98 });
add("c-mech", 2024, 1, 3, "angular-momentum", "Clay sticking to the rim of a disk", "Calculate the angular speed after the clay sticks to the rim.", "ang-drop", { M: 1, R: 0.2, w0: 10, m: 0.1, r: 0.2 });

add("c-mech", 2024, 2, 1, "conservation-of-energy", "Spring launch, friction, then an inelastic collision", "Calculate the speed after the rough patch and the common speed after the blocks stick together.", "spring-stick", { m1: 0.5, m2: 1.5, k: 80, A: 0.2, mu: 0.1, D: 0.4, ...g98 });
add("c-mech", 2024, 2, 2, "drag-force", "Object with resistive force F = bv", "Calculate the terminal speed for a resistive force proportional to speed.", "drag", { m: 0.18, b: 0.22, quad: 0, ...g98 });
add("c-mech", 2024, 2, 3, "torque-equilibrium", "Rod held by a horizontal string", "Calculate the net torque about the pivot.", "torque", { L: 0.8, M: 0.3, f: 0, m: 0.9, x: 0.8, ...g98 });

add("c-mech", 2025, 0, 1, "impulse-momentum", "Blocks colliding and sticking", "A block of mass m has velocity 2v₀ and a block of mass 6m has velocity −v₀. Calculate the common velocity after they stick together.", "stick", { m1: 1, v1: 4, m2: 6, v2: -2 });
add("c-mech", 2025, 0, 2, "harmonic-motion", "Block between two springs", "Calculate the period when the two springs act in parallel.", "parallel-t", { m: 0.3, k: 20, n: 2, ...g98 });
add("c-mech", 2025, 0, 3, "conservation-of-energy", "Block dropped through a vertical height", "Calculate the acceleration and the final speed after the block falls through the given height.", "incline", { m: 0.3, theta: 90, muS: 0, muK: 0, L: 0.5, ...g98 });
add("c-mech", 2025, 0, 4, "rotational-motion", "Disk rolling without slipping", "Calculate the speed of the disk after it rolls without slipping through the given vertical height.", "roll", { m: 0.6, r: 0.1, h: 0.45, theta: 20, H: 0, shape: 0, ...g98 });

const FAMILIES: readonly (readonly string[])[] = [
  ["circular-motion", "conical-pendulum", "horizontal-circular", "vertical-circular"],
  ["rotation-n2", "rotational-inertia"],
  ["impulse-momentum", "ballistic-pendulum"],
  ["harmonic-motion", "physical-pendulum", "torsional-pendulum"],
  ["electric-field", "equipotential", "coulombs-law"],
  ["magnetism", "solenoid"],
];

export const AP_PROBLEMS: readonly Problem[] = PROBLEMS;

export function problemsFor(slug: string) {
  const family = FAMILIES.find((group) => group.includes(slug));
  const slugs = new Set(family ?? [slug]);
  return AP_PROBLEMS.filter((item) => slugs.has(item.slug));
}
