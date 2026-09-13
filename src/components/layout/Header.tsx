"use client";

import { useGame } from "@/game/store";
import { computeProduction, getActiveChallenge, getRefactorGain } from "@/game/engine";
import { getScaleTier } from "@/game/economy";
import { formatNumber, formatRate } from "@/game/numbers";
import { cn } from "@/lib/cn";

export function Header() {
  const state = useGame();
  const production = computeProduction(state);
  const tier = getScaleTier(production);
  const balance = state.resources.cycles;
  const workers = state.workers ?? 0;
  const research = Object.values(state.research).filter(Boolean).length;
  const runtime = state.stats.runtimeSeconds ?? 0;
  const canRefactor = getRefactorGain(state).gt(0);
  const activeChallenge = getActiveChallenge(state);

  const hours = Math.floor(runtime / 3600);
  const minutes = Math.floor((runtime % 3600) / 60);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-panel px-4">
      <div className="flex items-baseline gap-1 font-mono text-sm tracking-tight">
        <span className="font-semibold text-ink">RUNLOOP</span>
        <span className="text-muted">://</span>
        <span className="text-term">SYS</span>
      </div>

      <div className="h-6 w-px bg-line2" />

      <div className="flex items-center gap-2 font-mono">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted">Phase</span>
        <span
          key={tier.name}
          className="anim-tier-pulse inline-block rounded-sm px-1 text-xs font-semibold tracking-wide"
          style={{ color: tier.accent }}
        >
          {tier.name}
        </span>
      </div>

      <div className="mx-2 hidden h-6 w-px bg-line2 md:block" />

      <dl className="hidden items-center gap-5 font-mono lg:flex">
        <div>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Production</dt>
          <dd className="text-xs text-term">{formatRate(production)}</dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Balance</dt>
          <dd className="text-xs text-ink">{formatNumber(balance)}</dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Workers</dt>
          <dd className="text-xs text-cyn">{workers}</dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Research</dt>
          <dd className="text-xs text-blu">{research}</dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Uptime</dt>
          <dd className="text-xs text-muted">
            {hours}h {minutes}m
          </dd>
        </div>
      </dl>

      <div className="flex-1" />

      {activeChallenge && (
        <button
          type="button"
          onClick={() => useGame.getState().setView("challenges")}
          className={cn(
            "inline-flex items-center gap-2 rounded-sm border border-err/50 bg-err/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-err transition-colors hover:bg-err/20",
          )}
        >
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-err" />
          {activeChallenge.name}
        </button>
      )}

      {canRefactor && (
        <button
          type="button"
          onClick={() => useGame.getState().setView("refactor")}
          className={cn(
            "inline-flex items-center gap-2 rounded-sm border border-amb/50 bg-amb/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-amb transition-colors hover:bg-amb/20",
          )}
        >
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-amb" />
          Refactor ready
        </button>
      )}

      <div
        className="h-8 w-1 rounded-sm"
        style={{ background: tier.accent, opacity: 0.9 }}
      />
    </header>
  );
}