import type Decimal from "break_infinity.js";

export type ViewId =
  | "overview"
  | "compute"
  | "automation"
  | "research"
  | "upgrades"
  | "refactor";

export type SpecId = "performance" | "reliability" | "automation";

export type LogKind = "info" | "success" | "warn" | "debug";
export type ToastKind = "success" | "error" | "info";

export type ResearchEffect =
  | { type: "prodMul"; value: number }
  | { type: "workerEfficiency"; value: number }
  | { type: "offlineMul"; value: number }
  | { type: "clickMul"; value: number }
  | { type: "unlockGenerator"; generatorId: string }
  | { type: "unlockAutobuy" }
  | { type: "unlockReliability" };

export interface ResearchDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  tier: number;
  prereq: string | null;
  effect: ResearchEffect;
}

export interface GeneratorDef {
  id: string;
  name: string;
  badge: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  baseProduction: number;
  unlockCount: number;
  unlockGenerator: string | null;
  unlockResearch: string | null;
}

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  growth: number;
  perLevel: number;
  unlockResearch: string | null;
  badge: string;
}

export interface BreakthroughDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlockResearch: string | null;
  prodMul: number;
  badge: string;
}

export interface SpecDef {
  id: SpecId;
  name: string;
  description: string;
  effect: string;
}

export interface AutoBuyerState {
  enabled: boolean;
  interval: number;
  budget: number;
}

export type AutoBuyerMap = Record<string, AutoBuyerState>;

export interface LogEntry {
  id: number;
  time: number;
  text: string;
  kind: LogKind;
}

export interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

export interface OfflineInfo {
  seconds: number;
  gained: Decimal;
  efficiency: number;
}

export interface SpecLevels {
  performance: number;
  reliability: number;
  automation: number;
}

export interface PersistedGame {
  saveVersion: number;
  lastSave: number;
  resources: { cycles: string };
  totals: {
    runCycles: string;
    lifetimeCycles: string;
    builds: number;
  };
  generators: Record<string, number>;
  upgrades: Record<string, number>;
  modules: Record<string, number>;
  research: Record<string, boolean>;
  breakthroughs: Record<string, boolean>;
  workers: number;
  autoBuyers: AutoBuyerMap;
  prestige: {
    architecturePoints: number;
    refactors: number;
    specs: SpecLevels;
  };
  stats: {
    clicks: number;
    runtimeSeconds: number;
  };
  settings: {
    logLevel: "normal" | "detailed";
  };
}

export interface GameState {
  saveVersion: number;
  lastSave: number;
  resources: { cycles: Decimal };
  totals: {
    runCycles: Decimal;
    lifetimeCycles: Decimal;
    builds: number;
  };
  generators: Record<string, number>;
  upgrades: Record<string, number>;
  modules: Record<string, number>;
  research: Record<string, boolean>;
  breakthroughs: Record<string, boolean>;
  workers: number;
  autoBuyers: AutoBuyerMap;
  prestige: {
    architecturePoints: number;
    refactors: number;
    specs: SpecLevels;
  };
  stats: {
    clicks: number;
    runtimeSeconds: number;
  };
  settings: {
    logLevel: "normal" | "detailed";
  };
}

export interface MilestoneDef {
  id: string;
  label: string;
  description: string;
  check: (state: GameState) => boolean;
}

export interface ScaleTierDef {
  name: string;
  accent: string;
}