import type { GameState, PersistedGame } from "./types";
import { createInitialState, SAVE_VERSION } from "./state";
import { safeDecimal } from "./numbers";
import { CHALLENGE_BY_ID } from "./economy";

export const SAVE_KEY = "infra-exponent-save-v1";

function int(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

function recordOfNumbers(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!value || typeof value !== "object") return out;
  for (const [key, v] of Object.entries(value)) {
    if (key.startsWith("__")) continue;
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      out[key] = Math.floor(v);
    }
  }
  return out;
}

function recordOfBooleans(value: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!value || typeof value !== "object") return out;
  for (const [key, v] of Object.entries(value)) {
    if (key.startsWith("__")) continue;
    if (typeof v === "boolean") out[key] = v;
  }
  return out;
}

function sanitizeAutoBuyers(value: unknown): GameState["autoBuyers"] {
  const out: GameState["autoBuyers"] = {};
  if (!value || typeof value !== "object") return out;
  for (const [key, v] of Object.entries(value)) {
    if (!v || typeof v !== "object") continue;
    const b = v as Record<string, unknown>;
    const budget = typeof b.budget === "number" && b.budget > 0 && b.budget <= 100 ? b.budget : 50;
    const interval = typeof b.interval === "number" && b.interval >= 100 ? Math.floor(b.interval) : 1000;
    out[key] = {
      enabled: b.enabled === true,
      interval,
      budget,
    };
  }
  return out;
}

function sanitizeChallenges(value: unknown): GameState["challenges"] {
  const out: GameState["challenges"] = {};
  if (!value || typeof value !== "object") return out;
  for (const [key, v] of Object.entries(value)) {
    if (!CHALLENGE_BY_ID[key]) continue;
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      out[key] = Math.floor(v);
    }
  }
  return out;
}

export function sanitizePersisted(raw: unknown): GameState {
  const base = createInitialState();
  if (!raw || typeof raw !== "object") return base;

  const r = raw as Record<string, unknown>;
  const resources = (r.resources as Record<string, unknown>) ?? {};
  const totals = (r.totals as Record<string, unknown>) ?? {};
  const prestige = (r.prestige as Record<string, unknown>) ?? {};
  const specs = (prestige.specs as Record<string, number>) ?? {};
  const stats = (r.stats as Record<string, unknown>) ?? {};
  const settings = (r.settings as Record<string, unknown>) ?? {};

  const state: GameState = {
    saveVersion: SAVE_VERSION,
    lastSave:
      typeof r.lastSave === "number" && Number.isFinite(r.lastSave)
        ? r.lastSave
        : Date.now(),
    resources: {
      cycles: safeDecimal(resources.cycles, 0),
    },
    totals: {
      runCycles: safeDecimal(totals.runCycles, 0),
      lifetimeCycles: safeDecimal(totals.lifetimeCycles, 0),
      builds: int(totals.builds, 0),
    },
    generators: recordOfNumbers(r.generators),
    upgrades: recordOfNumbers(r.upgrades),
    modules: recordOfNumbers(r.modules),
    research: recordOfBooleans(r.research),
    breakthroughs: recordOfBooleans(r.breakthroughs),
    workers: int(r.workers, 0),
    autoBuyers: sanitizeAutoBuyers(r.autoBuyers),
    challenges: sanitizeChallenges(r.challenges),
    activeChallenge:
      typeof r.activeChallenge === "string" && CHALLENGE_BY_ID[r.activeChallenge]
        ? r.activeChallenge
        : null,
    prestige: {
      architecturePoints: int(prestige.architecturePoints, 0),
      refactors: int(prestige.refactors, 0),
      specs: {
        performance: int(specs.performance, 0),
        reliability: int(specs.reliability, 0),
        automation: int(specs.automation, 0),
      },
    },
    stats: {
      clicks: int(stats.clicks, 0),
      runtimeSeconds: int(stats.runtimeSeconds, 0),
      purchases: int(stats.purchases, 0),
      autoPurchases: int(stats.autoPurchases, 0),
      offlineCycles: safeDecimal(stats.offlineCycles, 0),
      peakProduction: safeDecimal(stats.peakProduction, 0),
      challengesCompleted: int(stats.challengesCompleted, 0),
    },
    settings: {
      logLevel: settings.logLevel === "detailed" ? "detailed" : "normal",
    },
  };

  return state;
}

export function serializePersisted(state: GameState): PersistedGame {
  return {
    saveVersion: SAVE_VERSION,
    lastSave: state.lastSave,
    resources: { cycles: state.resources.cycles.toString() },
    totals: {
      runCycles: state.totals.runCycles.toString(),
      lifetimeCycles: state.totals.lifetimeCycles.toString(),
      builds: state.totals.builds,
    },
    generators: { ...state.generators },
    upgrades: { ...state.upgrades },
    modules: { ...state.modules },
    research: { ...state.research },
    breakthroughs: { ...state.breakthroughs },
    workers: state.workers,
    autoBuyers: state.autoBuyers,
    challenges: { ...state.challenges },
    activeChallenge: state.activeChallenge,
    prestige: {
      architecturePoints: state.prestige.architecturePoints,
      refactors: state.prestige.refactors,
      specs: { ...state.prestige.specs },
    },
    stats: {
      clicks: state.stats.clicks,
      runtimeSeconds: state.stats.runtimeSeconds,
      purchases: state.stats.purchases,
      autoPurchases: state.stats.autoPurchases,
      offlineCycles: state.stats.offlineCycles.toString(),
      peakProduction: state.stats.peakProduction.toString(),
      challengesCompleted: state.stats.challengesCompleted,
    },
    settings: {
      logLevel: state.settings.logLevel,
    },
  };
}

export function saveGame(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const snapshot = { ...state, lastSave: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializePersisted(snapshot)));
  } catch {
    // storage unavailable
  }
}

export function loadGame(): GameState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as unknown;
    return sanitizePersisted(parsed);
  } catch {
    return createInitialState();
  }
}

export function clearGame(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

export function exportSave(state: GameState): string {
  return JSON.stringify(serializePersisted(state));
}

export function importSave(raw: string): GameState | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return sanitizePersisted(parsed);
  } catch {
    return null;
  }
}