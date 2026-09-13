"use client";

import { create } from "zustand";
import Decimal from "break_infinity.js";
import type {
  GameState,
  LogEntry,
  LogKind,
  OfflineInfo,
  SpecId,
  Toast,
  ToastKind,
  ViewId,
} from "./types";
import { createInitialState } from "./state";
import { loadGame, saveGame, clearGame } from "./save";
import {
  abandonChallenge,
  applyOfflineGain,
  applyProduction,
  build,
  buyBreakthrough,
  buyGenerator,
  buyModule,
  buyResearch,
  buyUpgrade,
  buyWorker,
  buySpec,
  computeOfflineGain,
  computeProduction,
  processAutoBuyers,
  processRefactor,
  processSolveChallenge,
  setAutoBuyer as engineSetAutoBuyer,
  startChallenge,
} from "./engine";
import {
  BREAKTHROUGH_BY_ID,
  CHALLENGE_BY_ID,
  GENERATOR_BY_ID,
  UPGRADE_BY_ID,
  MILESTONES,
  getScaleIndex,
} from "./economy";
import { formatClock, formatNumber, formatPercent } from "./numbers";

const TICK_MS = 100;
const SAVE_INTERVAL_MS = 30000;
const CATCHUP_CAP_SECONDS = 86400;

function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface StoreState extends GameState {
  booted: boolean;
  view: ViewId;
  logs: LogEntry[];
  toasts: Toast[];
  offlineInfo: OfflineInfo | null;
  lastTickAt: number;

  boot: () => void;
  tick: (now: number) => void;
  catchUp: (now: number) => void;
  dismissOffline: () => void;
  setView: (view: ViewId) => void;
  pushLog: (text: string, kind?: LogKind) => void;
  pushToast: (text: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
  toggleLogLevel: () => void;
  hardReset: () => void;
  actImportSave: (imported: GameState) => void;

  actBuyGenerator: (id: string) => void;
  actBuyModule: (id: string) => void;
  actBuyUpgrade: (id: string) => void;
  actBuyResearch: (id: string) => void;
  actBuyWorker: () => void;
  actBuyBreakthrough: (id: string) => void;
  actExecuteBuild: () => void;
  actRefactor: () => void;
  actBuySpec: (id: SpecId) => void;
  actStartChallenge: (id: string) => void;
  actSolveChallenge: () => void;
  actAbandonChallenge: () => void;
  actSetAutoBuyer: (
    genId: string,
    patch: Partial<{ enabled: boolean; interval: number; budget: number }>,
  ) => void;
}

function cloneGame(s: GameState): GameState {
  return {
    ...s,
    resources: { cycles: s.resources.cycles },
    totals: { ...s.totals },
    generators: { ...s.generators },
    upgrades: { ...s.upgrades },
    modules: { ...s.modules },
    research: { ...s.research },
    breakthroughs: { ...s.breakthroughs },
    autoBuyers: { ...s.autoBuyers },
    challenges: { ...s.challenges },
    prestige: { ...s.prestige, specs: { ...s.prestige.specs } },
    stats: { ...s.stats },
    settings: { ...s.settings },
  };
}

function greetingLogs(now: number): LogEntry[] {
  return [
    { id: uid(), time: now, text: "SYSTEM ONLINE — kernel booted", kind: "debug" },
    { id: uid(), time: now, text: "Running first build pipeline", kind: "info" },
    { id: uid(), time: now, text: "Tip: deploy Compile Cores to generate cycles.", kind: "info" },
  ];
}

const HEARTBEAT_POOLS: string[][] = [
  [
    "Build queue empty — waiting for jobs",
    "Context switch overhead: 0.4%",
    "Page cache warm, swap cold",
    "GC pause: 2ms",
  ],
  [
    "Cache hit ratio: 94.2%",
    "Replica lag: 3ms",
    "Hot path recompiled with fresh profiles",
    "Heap pressure nominal",
  ],
  [
    "Autoscaling check passed",
    "Node heartbeat OK",
    "Fabric saturation: 61%",
    "Quorum healthy (5/5)",
  ],
  [
    "Telemetry pipeline flushed",
    "Rebalance: 12 shards moved",
    "WAN latency to peers: 8ms",
    "Region failover drill complete",
  ],
  [
    "Global consensus round: 250ms",
    "Self-healing pass found 0 faults",
    "Predictive scheduler trimmed 9% idle",
    "Inference batch served at scale",
  ],
];

function pickHeartbeat(state: GameState): string {
  const idx = Math.min(4, Math.floor(getScaleIndex(computeProduction(state)) / 2));
  const pool = HEARTBEAT_POOLS[idx];
  return pool[Math.floor(Math.random() * pool.length)];
}

const announcedMilestones = new Set<string>();

export const useGame = create<StoreState>((set, get) => {
  function commit(game: GameState): void {
    const s = get();
    set({ ...s, ...game });
  }

  function schedule(): void {
    setInterval(() => get().tick(Date.now()), TICK_MS);
    setInterval(() => saveGame(get()), SAVE_INTERVAL_MS);
    const onHide = (): void => saveGame(get());
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        saveGame(get());
      } else {
        get().catchUp(Date.now());
      }
    });
  }

  return {
    ...createInitialState(),
    booted: false,
    view: "overview",
    logs: [],
    toasts: [],
    offlineInfo: null,
    lastTickAt: 0,

    boot: () => {
      if (get().booted) return;
      const now = Date.now();
      const loaded = loadGame();
      const savedLastSave = loaded.lastSave;
      loaded.lastSave = now;
      const elapsed = Math.max(0, (now - savedLastSave) / 1000);

      let offlineInfo: OfflineInfo | null = null;
      if (elapsed > 60) {
        const { gained, efficiency } = computeOfflineGain(loaded, elapsed);
        applyOfflineGain(loaded, gained);
        offlineInfo = { seconds: elapsed, gained, efficiency };
      }

      for (const m of MILESTONES) {
        if (m.check(loaded)) announcedMilestones.add(m.id);
      }

      set({
        ...loaded,
        booted: true,
        lastTickAt: now,
        offlineInfo,
        logs: greetingLogs(now),
      });
      schedule();
    },

    tick: (now) => {
      const s = get();
      const dt = Math.max(0, Math.min((now - s.lastTickAt) / 1000, 900));
      if (dt <= 0) return;
      const game = cloneGame(s);
      applyProduction(game, dt);
      const autoPurchases = processAutoBuyers(game, dt * 1000);
      game.stats.runtimeSeconds = (game.stats.runtimeSeconds ?? 0) + dt;
      game.lastSave = now;
      const prod = computeProduction(game);
      if (prod.gt(game.stats.peakProduction)) game.stats.peakProduction = prod;

      const newMilestones: LogEntry[] = [];
      let newToasts: Toast[] = [];
      for (const m of MILESTONES) {
        if (!announcedMilestones.has(m.id) && m.check(game)) {
          announcedMilestones.add(m.id);
          newMilestones.push({ id: uid(), time: now, text: `[MILESTONE] ${m.label}`, kind: "success" });
        }
      }

      if (s.settings.logLevel === "detailed" || autoPurchases > 0 || newMilestones.length > 0) {
        const entries = [...s.logs];
        const prevBoundary = Math.floor((game.stats.runtimeSeconds - dt) / 90);
        const curBoundary = Math.floor(game.stats.runtimeSeconds / 90);
        if (curBoundary > prevBoundary) {
          entries.push({ id: uid(), time: now, text: pickHeartbeat(game), kind: "debug" });
        }
        if (autoPurchases > 0) {
          entries.push({
            id: uid(),
            time: now,
            text: `Autoscaling: allocated ${autoPurchases} new instance${autoPurchases > 1 ? "s" : ""}`,
            kind: "info",
          });
        }
        for (const entry of newMilestones) {
          entries.push(entry);
        }
        if (newMilestones.length > 0) {
          const baseToasts = [...s.toasts.slice(-2)];
          newToasts = newMilestones.map((m) => ({
            id: uid(),
            text: `Milestone: ${m.text.replace("[MILESTONE] ", "")}`,
            kind: "success",
          }));
          newToasts = [...baseToasts.slice(-(2 - newMilestones.length)), ...newToasts];
        }
        set({
          ...s,
          ...game,
          logs: entries.slice(-200),
          toasts: newMilestones.length > 0 ? newToasts : s.toasts,
          lastTickAt: now,
        });
      } else {
        set({ ...s, ...game, lastTickAt: now });
      }
    },

    catchUp: (now) => {
      const s = get();
      const elapsed = Math.max(0, Math.min((now - s.lastTickAt) / 1000, CATCHUP_CAP_SECONDS));
      if (elapsed <= 0) return;
      const game = cloneGame(s);
      applyProduction(game, elapsed);
      processAutoBuyers(game, elapsed * 1000);
      game.stats.runtimeSeconds = (game.stats.runtimeSeconds ?? 0) + elapsed;
      game.lastSave = now;
      const prod = computeProduction(game);
      if (prod.gt(game.stats.peakProduction)) game.stats.peakProduction = prod;

      const milestoneEntries: LogEntry[] = [];
      for (const m of MILESTONES) {
        if (!announcedMilestones.has(m.id) && m.check(game)) {
          announcedMilestones.add(m.id);
          milestoneEntries.push({
            id: uid(),
            time: now,
            text: `[MILESTONE] ${m.label}`,
            kind: "success",
          });
        }
      }
      if (milestoneEntries.length > 0) {
        const entries = [...s.logs];
        for (const entry of milestoneEntries) entries.push(entry);
        const baseToasts = [...s.toasts.slice(-2)];
        const newToasts = [
          ...baseToasts,
          ...milestoneEntries.map((m) => ({
            id: uid(),
            text: `Milestone: ${m.text.replace("[MILESTONE] ", "")}`,
            kind: "success" as const,
          })),
        ].slice(-3);
        set({ ...s, ...game, logs: entries.slice(-200), toasts: newToasts, lastTickAt: now });
      } else {
        set({ ...s, ...game, lastTickAt: now });
      }
      saveGame(game);
    },

    dismissOffline: () => {
      const info = get().offlineInfo;
      if (info && info.gained.gt(0)) {
        get().pushLog(
          `Offline restore complete: +${formatNumber(info.gained)} cycles`,
          "success",
        );
      }
      set({ offlineInfo: null });
    },

    setView: (view) => set({ view }),

    pushLog: (text, kind = "info") =>
      set((s) => ({
        logs: [...s.logs.slice(-199), { id: uid(), time: Date.now(), text, kind }],
      })),

    pushToast: (text, kind = "info") =>
      set((s) => ({
        toasts: [...s.toasts.slice(-2), { id: uid(), text, kind }],
      })),

    dismissToast: (id) =>
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    toggleLogLevel: () =>
      set((s) => ({
        settings: {
          ...s.settings,
          logLevel: s.settings.logLevel === "normal" ? "detailed" : "normal",
        },
      })),

    hardReset: () => {
      clearGame();
      announcedMilestones.clear();
      const fresh = createInitialState();
      set({
        ...fresh,
        booted: true,
        view: "overview",
        logs: greetingLogs(Date.now()),
        toasts: [],
        offlineInfo: null,
        lastTickAt: Date.now(),
      });
      saveGame(get());
    },

    actImportSave: (imported) => {
      announcedMilestones.clear();
      for (const m of MILESTONES) {
        if (m.check(imported)) announcedMilestones.add(m.id);
      }
      set({
        ...imported,
        booted: true,
        lastTickAt: Date.now(),
        offlineInfo: null,
        toasts: [],
        logs: greetingLogs(Date.now()),
      });
      saveGame(get());
    },

    actBuyGenerator: (id) => {
      const game = cloneGame(get());
      const result = buyGenerator(game, id);
      commit(game);
      if (result === "locked") {
        get().pushToast("Generator not unlocked yet", "info");
      } else if (result === "ok") {
        const def = GENERATOR_BY_ID[id];
        const count = game.generators[id] ?? 0;
        if (count === 1 || count % 10 === 0) {
          get().pushLog(
            `Deployed ${def?.name ?? id} #${count}`,
            count >= 10 ? "info" : "success",
          );
        }
      }
    },

    actBuyModule: (id) => {
      const game = cloneGame(get());
      const result = buyModule(game, id);
      commit(game);
      if (result === "ok") {
        const def = GENERATOR_BY_ID[id];
        get().pushToast("Overclock module upgraded", "success");
        get().pushLog(
          `Overclocked ${def?.name ?? id} to module level ${game.modules[id] ?? 0}`,
          "info",
        );
      }
    },

    actBuyUpgrade: (id) => {
      const game = cloneGame(get());
      const result = buyUpgrade(game, id);
      commit(game);
      if (result === "ok") {
        const def = UPGRADE_BY_ID[id];
        const level = game.upgrades[id] ?? 0;
        get().pushToast("Optimization deployed", "success");
        if (level % 5 === 0) {
          get().pushLog(`${def?.name ?? id} reached level ${level}`, "success");
        }
      }
    },

    actBuyResearch: (id) => {
      const game = cloneGame(get());
      const result = buyResearch(game, id);
      commit(game);
      if (result === "ok") {
        get().pushToast(`Research complete: ${id}`, "success");
        get().pushLog(`Research completed: ${id}`, "success");
      }
    },

    actBuyWorker: () => {
      const game = cloneGame(get());
      const result = buyWorker(game);
      commit(game);
      if (result === "ok") {
        get().pushToast(`Execution worker #${game.workers} online`, "success");
        get().pushLog(`Execution worker #${game.workers} joined the pool`, "success");
      }
    },

    actBuyBreakthrough: (id) => {
      const game = cloneGame(get());
      const result = buyBreakthrough(game, id);
      commit(game);
      if (result === "ok") {
        const def = BREAKTHROUGH_BY_ID[id];
        get().pushToast("Breakthrough applied", "success");
        get().pushLog(`Breakthrough adopted: ${def?.name ?? id}`, "success");
      }
    },

    actExecuteBuild: () => {
      const game = cloneGame(get());
      const gain = build(game);
      commit(game);
      if (gain.gt(0)) {
        get().pushToast(`Build finished: +${gain.toFixed(0)} cycles`, "success");
        get().pushLog(`Manual build produced ${gain.toFixed(0)} cycles`, "info");
      }
    },

    actRefactor: () => {
      const game = cloneGame(get());
      const gained = processRefactor(game);
      commit(game);
      const ap = gained.toNumber();
      get().pushToast(`Architecture reset complete: +${ap} AP`, "success");
      get().pushLog(
        `[REFACTOR] System rewired. +${ap} architecture points. ${formatClock()}`,
        "warn",
      );
    },

    actBuySpec: (id) => {
      const game = cloneGame(get());
      const ok = buySpec(game, id);
      commit(game);
      if (ok) get().pushToast("Specialization upgraded", "success");
    },

    actStartChallenge: (id) => {
      const game = cloneGame(get());
      const result = startChallenge(game, id);
      commit(game);
      if (result === "ok") {
        const def = CHALLENGE_BY_ID[id];
        const name = def?.name ?? id;
        get().pushToast(`Challenge entered: ${name}`, "info");
        get().pushLog(`[CHALLENGE] ${name} engaged — ${def?.flaw ?? "modifiers applied"}`, "warn");
      } else if (result === "locked") {
        get().pushToast("Challenge locked or already running", "info");
      }
    },

    actSolveChallenge: () => {
      const game = cloneGame(get());
      const reward = processSolveChallenge(game);
      commit(game);
      if (reward >= 0) {
        const pct = formatPercent(reward, 0);
        get().pushToast(`Challenge solved: +${pct} permanent production`, "success");
        get().pushLog(
          `[CHALLENGE] Solved. +${pct} permanent production banked.`,
          "success",
        );
      }
    },

    actAbandonChallenge: () => {
      const game = cloneGame(get());
      const ok = abandonChallenge(game);
      commit(game);
      if (ok) get().pushToast("Challenge abandoned — run cleared", "info");
    },

    actSetAutoBuyer: (genId, patch) => {
      const game = cloneGame(get());
      engineSetAutoBuyer(game, genId, patch);
      commit(game);
      if (patch.enabled === true) get().pushToast("Autopilot engaged", "success");
    },
  };
});

export { Decimal };