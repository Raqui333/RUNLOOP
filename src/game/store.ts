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
  processAutoBuyers,
  processRefactor,
  setAutoBuyer as engineSetAutoBuyer,
} from "./engine";
import { formatClock } from "./numbers";

const TICK_MS = 100;
const SAVE_INTERVAL_MS = 30000;
const CATCHUP_CAP_SECONDS = 86400;

interface StoreState extends GameState {
  booted: boolean;
  view: ViewId;
  logs: LogEntry[];
  toasts: Toast[];
  offlineInfo: OfflineInfo | null;
  lastTickAt: number;
  logSeq: number;
  toastSeq: number;

  boot: () => void;
  tick: (now: number) => void;
  catchUp: (now: number) => void;
  dismissOffline: () => void;
  setView: (view: ViewId) => void;
  pushLog: (text: string, kind?: LogKind) => void;
  pushToast: (text: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
  toggleLogLevel: () => void;
  hardReset: () => void;

  actBuyGenerator: (id: string) => void;
  actBuyModule: (id: string) => void;
  actBuyUpgrade: (id: string) => void;
  actBuyResearch: (id: string) => void;
  actBuyWorker: () => void;
  actBuyBreakthrough: (id: string) => void;
  actExecuteBuild: () => void;
  actRefactor: () => void;
  actBuySpec: (id: SpecId) => void;
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
    prestige: { ...s.prestige, specs: { ...s.prestige.specs } },
    stats: { ...s.stats },
    settings: { ...s.settings },
  };
}

function greetingLogs(now: number): LogEntry[] {
  return [
    { id: 1, time: now, text: "SYSTEM ONLINE — kernel booted", kind: "debug" },
    { id: 2, time: now, text: "Running first build pipeline", kind: "info" },
    { id: 3, time: now, text: "Tip: deploy Compile Cores to generate cycles.", kind: "info" },
  ];
}

const HEARTBEAT_LOG_POOL = [
  "Cache hit ratio: 94.2%",
  "Replica lag: 3ms",
  "Telemetry pipeline flushed",
  "Heap pressure nominal",
  "Autoscaling check passed",
  "Node heartbeat OK",
];

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
    logSeq: 3,
    toastSeq: 0,

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

      if (s.settings.logLevel === "detailed" || autoPurchases > 0) {
        const entries = [...s.logs];
        let nextId = s.logSeq;
        const prevBoundary = Math.floor((game.stats.runtimeSeconds - dt) / 90);
        const curBoundary = Math.floor(game.stats.runtimeSeconds / 90);
        if (curBoundary > prevBoundary) {
          const pool = HEARTBEAT_LOG_POOL;
          const text = pool[Math.floor(Math.random() * pool.length)];
          entries.push({ id: nextId++, time: now, text, kind: "debug" });
        }
        if (autoPurchases > 0) {
          entries.push({
            id: nextId++,
            time: now,
            text: `Autoscaling: allocated ${autoPurchases} new instance${autoPurchases > 1 ? "s" : ""}`,
            kind: "info",
          });
        }
        set({
          ...s,
          ...game,
          logs: entries.slice(-200),
          logSeq: nextId,
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
      set({ ...s, ...game, lastTickAt: now });
      saveGame(game);
    },

    dismissOffline: () => set({ offlineInfo: null }),

    setView: (view) => set({ view }),

    pushLog: (text, kind = "info") =>
      set((s) => ({
        logs: [...s.logs.slice(-199), { id: s.logSeq, time: Date.now(), text, kind }],
        logSeq: s.logSeq + 1,
      })),

    pushToast: (text, kind = "info") =>
      set((s) => ({
        toasts: [...s.toasts.slice(-2), { id: s.toastSeq, text, kind }],
        toastSeq: s.toastSeq + 1,
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

    actBuyGenerator: (id) => {
      const game = cloneGame(get());
      const result = buyGenerator(game, id);
      commit(game);
      if (result === "locked") {
        get().pushToast("Generator not unlocked yet", "info");
      }
    },

    actBuyModule: (id) => {
      const game = cloneGame(get());
      const result = buyModule(game, id);
      commit(game);
      if (result === "ok") {
        get().pushToast("Overclock module upgraded", "success");
      }
    },

    actBuyUpgrade: (id) => {
      const game = cloneGame(get());
      const result = buyUpgrade(game, id);
      commit(game);
      if (result === "ok") get().pushToast("Optimization deployed", "success");
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
      }
    },

    actBuyBreakthrough: (id) => {
      const game = cloneGame(get());
      const result = buyBreakthrough(game, id);
      commit(game);
      if (result === "ok") get().pushToast("Breakthrough applied", "success");
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

    actSetAutoBuyer: (genId, patch) => {
      const game = cloneGame(get());
      engineSetAutoBuyer(game, genId, patch);
      commit(game);
      if (patch.enabled === true) get().pushToast("Autopilot engaged", "success");
    },
  };
});

export { Decimal };