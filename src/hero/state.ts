/* Mutable runtime state shared between the engine draw loop, the ?tune panel,
   and the 2D fallback. Kept in one object so the modules can mutate the same
   cycle/visibility flags by reference (mirrors the original closure vars). */

export interface Pulse {
  t0: number;
  amp: number;
}

export interface HeroState {
  // exhibit cycle
  mi: number; // current model index into SEQ
  mT0: number; // timestamp the current model started
  mPulsed: boolean; // has the pre-swap corruption burst fired this cycle
  yaw0: number; // yaw offset so each model enters at a fresh angle
  tuneFreeze: boolean; // ?tune panel holding the cycle on one model
  // runtime
  running: boolean;
  visible: boolean;
  pulses: Pulse[]; // active corruption bursts
}

export function createHeroState(): HeroState {
  return {
    mi: 0,
    mT0: 0,
    mPulsed: false,
    yaw0: 0,
    tuneFreeze: false,
    running: false,
    visible: true,
    pulses: [],
  };
}
