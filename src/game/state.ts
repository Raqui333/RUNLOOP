import Decimal from "break_infinity.js";
import type { GameState } from "./types";

export const SAVE_VERSION = 1;

export function createInitialState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    lastSave: Date.now(),
    resources: { cycles: new Decimal(15) },
    totals: {
      runCycles: new Decimal(0),
      lifetimeCycles: new Decimal(0),
      builds: 0,
    },
    generators: {},
    upgrades: {},
    modules: {},
    research: {},
    breakthroughs: {},
    workers: 0,
    autoBuyers: {},
    prestige: {
      architecturePoints: 0,
      refactors: 0,
      specs: {
        performance: 0,
        reliability: 0,
        automation: 0,
      },
    },
    stats: {
      clicks: 0,
      runtimeSeconds: 0,
    },
    settings: {
      logLevel: "normal",
    },
  };
}