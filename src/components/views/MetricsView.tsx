"use client";

import Decimal from "break_infinity.js";
import { useGame } from "@/game/store";
import { GENERATORS, MILESTONES, RESEARCH, REFACTOR_THRESHOLD } from "@/game/economy";
import {
  computeProduction,
  getMultiplierStack,
  getRefactorGain,
  productionPerGenerator,
} from "@/game/engine";
import { formatNumber, formatPercent, formatRate } from "@/game/numbers";
import { Bar, Section, Stat } from "@/components/ui";
import { cn } from "@/lib/cn";

export function MetricsView() {
  const state = useGame();
  const production = computeProduction(state);
  const peak = state.stats.peakProduction;
  const run = state.totals.runCycles;
  const stats = state.stats;

  const contributors = GENERATORS.map((g) => ({
    def: g,
    prod: productionPerGenerator(state, g),
  }))
    .filter((c) => c.prod.gt(0))
    .sort((a, b) => b.prod.minus(a.prod).toNumber());

  const genSum = contributors.reduce((acc, c) => acc.plus(c.prod), new Decimal(0));
  const combo = genSum.gt(0) ? production.div(genSum) : new Decimal(1);
  const stack = getMultiplierStack(state);
  const maxStack = stack.reduce(
    (acc, c) => (c.value.gt(acc) ? c.value : acc),
    new Decimal(1),
  );

  const projectionMultipliers = [1, 2, 5, 10, 25];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Section title="Throughput & totals" hint="lifetime telemetry">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Current" value={formatRate(production)} accent="var(--term)" />
          <Stat label="Peak" value={formatRate(peak)} accent="var(--cyn)" />
          <Stat label="Lifetime" value={formatNumber(state.totals.lifetimeCycles)} />
          <Stat label="This run" value={formatNumber(run)} accent="var(--blu)" />
          <Stat
            label="Offline earned"
            value={formatNumber(stats.offlineCycles)}
            accent="var(--cyn)"
          />
          <Stat label="Deploys" value={stats.purchases?.toLocaleString() ?? 0} />
          <Stat label="Auto deploys" value={stats.autoPurchases?.toLocaleString() ?? 0} />
          <Stat label="Manual builds" value={stats.clicks?.toLocaleString() ?? 0} />
          <Stat
            label="Challenges cleared"
            value={stats.challengesCompleted?.toLocaleString() ?? 0}
            accent="var(--err)"
          />
        </div>
      </Section>

      <Section
        title="Production composition"
        hint={contributors.length === 0 ? "no systems deployed" : "share of throughput"}
      >
        {contributors.length === 0 ? (
          <div className="rounded-md border border-line bg-inset px-3 py-6 text-center text-[11px] text-muted">
            Deploy generators to start producing cycles.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {contributors.map(({ def, prod }) => {
              const share = production.gt(0) ? prod.div(production).toNumber() : 0;
              return (
                <div key={def.id} className="rounded-md border border-line bg-panel px-3 py-2">
                  <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                    <span className="truncate text-ink">
                      {def.name}
                      <span className="ml-2 text-muted">x{state.generators[def.id] ?? 0}</span>
                    </span>
                    <span className="shrink-0 text-term">{formatRate(prod)}</span>
                    <span className="w-12 shrink-0 text-right text-cyn">
                      {formatPercent(share, 1)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={share} color="var(--cyn)" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Multiplier stack" hint={`combo ×${formatNumber(combo, 2)}`}>
        <div className="flex flex-col gap-2">
          {stack.length === 0 ? (
            <div className="text-[11px] text-muted">No multipliers active yet.</div>
          ) : (
            stack.map((entry) => (
              <div key={entry.label} className="rounded-md border border-line bg-panel px-3 py-2">
                <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                  <span className="text-ink">
                    {entry.label}
                    <span className="ml-2 text-[10px] text-muted">{entry.detail}</span>
                  </span>
                  <span className="shrink-0 text-term">×{formatNumber(entry.value, 2)}</span>
                </div>
                <div className="mt-1.5">
                  <Bar value={entry.value.div(maxStack).toNumber()} color="var(--term)" />
                </div>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section
        title="Refactor projection"
        hint={`threshold ${formatNumber(REFACTOR_THRESHOLD)} run cycles`}
      >
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {projectionMultipliers.map((m) => {
              const proj = {
                ...state,
                totals: { ...state.totals, runCycles: run.times(m) },
              };
              const ap = getRefactorGain(proj);
              const enabled = m === 1 && ap.gt(0);
              return (
                <div
                  key={m}
                  className={cn(
                    "rounded-md border px-3 py-2",
                    enabled ? "border-amb/50 bg-inset" : "border-line bg-panel",
                  )}
                >
                  <div className="text-[9px] uppercase tracking-widest text-muted">
                    {m === 1 ? "current" : `${m}× gain`}
                  </div>
                  <div className={cn("mt-1 font-mono text-sm", enabled ? "text-amb" : "text-ink")}>
                    +{ap.toFixed(0)} AP
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted">
            Architecture Points earned on refactor scale sub-linearly with run cycles, so the jump
            from {formatNumber(run)} is shown above.
          </p>
        </div>
      </Section>

      <Section title="Research coverage" hint={`by tier`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from(new Set(RESEARCH.map((r) => r.tier)))
            .sort((a, b) => a - b)
            .map((tier) => {
              const nodes = RESEARCH.filter((r) => r.tier === tier);
              const done = nodes.filter((n) => state.research[n.id]).length;
              return (
                <div key={tier} className="rounded-md border border-line bg-panel px-3 py-2">
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-muted">Tier {tier}</span>
                    <span className="text-ink">
                      {done}/{nodes.length}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={done / nodes.length} color="var(--blu)" />
                  </div>
                </div>
              );
            })}
        </div>
      </Section>

      <Section title="Next milestones" hint={`${MILESTONES.filter((m) => m.check(state)).length}/${MILESTONES.length} complete`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MILESTONES.filter((m) => !m.check(state))
            .slice(0, 3)
            .map((m) => (
              <div key={m.id} className="rounded-md border border-line bg-panel px-3 py-2.5">
                <div className="text-xs font-semibold text-term">{m.label}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-muted">{m.description}</div>
              </div>
            ))}
        </div>
      </Section>
    </div>
  );
}