"use client";

import { useGame } from "@/game/store";
import { GENERATORS, isGeneratorUnlocked, workerCost } from "@/game/economy";
import { workerEfficiency, automationSpeed } from "@/game/engine";
import { formatNumber, formatPercent } from "@/game/numbers";
import { Button, Card, LockHint, Section } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GeneratorDef } from "@/game/types";

const INTERVALS = [500, 1000, 2000, 5000];
const BUDGETS = [10, 25, 50, 75];

function AutoBuyerRow({ gen }: { gen: GeneratorDef }) {
  const ab = useGame((s) => s.autoBuyers[gen.id]);
  const balance = useGame((s) => s.resources.cycles);
  const buyer = ab ?? { enabled: false, interval: 1000, budget: 50 };
  const set = useGame.getState().actSetAutoBuyer;
  const speed = automationSpeed(useGame.getState());

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-md border bg-panel px-3 py-2.5",
        buyer.enabled ? "border-term/40" : "border-line",
      )}
    >
      <Button
        size="sm"
        variant={buyer.enabled ? "primary" : "ghost"}
        onClick={() => set(gen.id, { enabled: !buyer.enabled })}
        className="w-28"
      >
        {buyer.enabled ? "Armed" : "Arm"}
      </Button>

      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="text-xs font-semibold text-ink">{gen.name}</span>
        <span className="text-[10px] text-muted">
          owned {useGame.getState().generators[gen.id] ?? 0}
        </span>
      </div>

      <label className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
        t
        <select
          className="rounded-sm border border-line bg-inset px-1 py-0.5 text-[10px] text-ink"
          value={buyer.interval}
          onChange={(e) => set(gen.id, { interval: Number(e.target.value) })}
        >
          {INTERVALS.map((i) => (
            <option key={i} value={i}>
              {i}ms
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
        budget
        <select
          className="rounded-sm border border-line bg-inset px-1 py-0.5 text-[10px] text-ink"
          value={buyer.budget}
          onChange={(e) => set(gen.id, { budget: Number(e.target.value) })}
        >
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              {b}%
            </option>
          ))}
        </select>
      </label>

      <span
        className={cn(
          "font-mono text-[10px]",
          buyer.enabled && balance.gte(0) ? "text-term" : "text-muted",
        )}
      >
        {buyer.enabled ? "auto" : "manual"}
      </span>
      <span className="text-[9px] text-muted/60">{formatNumber(speed, 2)}x speed</span>
    </div>
  );
}

export function AutomationView() {
  const state = useGame();
  const efficiency = workerEfficiency(state);
  const workerContribution = state.workers * efficiency;
  const eff = formatPercent(1 + workerContribution, 1);
  const autoscale = !!state.research.autoscale;
  const unlockedGens = GENERATORS.filter((g) => isGeneratorUnlocked(state, g));
  const workerCostValue = workerCost(state.workers ?? 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Section title="Execution workers" hint="autonomous agents multiply throughput">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-cyn">{state.workers ?? 0}</span>
                <span className="text-xs text-muted">workers online</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Each worker autonomously executes jobs, adding{" "}
                <span className="text-term">{formatPercent(efficiency, 0)}</span> of production.
                Current contribution: <span className="text-term">{eff}</span>.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <div className="text-[9px] uppercase tracking-widest text-muted">Next worker</div>
                <div className="text-sm text-ink">{formatNumber(workerCostValue)}</div>
              </div>
              <Button
                size="lg"
                variant="cyan"
                disabled={!state.resources.cycles.gte(workerCostValue)}
                onClick={() => useGame.getState().actBuyWorker()}
              >
                Hire
              </Button>
            </div>
          </div>
        </Card>
      </Section>

      <Section
        title="Auto-buyers"
        hint={autoscale ? "autopilot firmware installed" : "locked until Auto Scaling research"}
      >
        {autoscale ? (
          <div className="flex flex-col gap-2">
            {unlockedGens.map((gen) => (
              <AutoBuyerRow key={gen.id} gen={gen} />
            ))}
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              A buyer will purchase its generator when the cost fits within the configured budget of
              your total balance. Interval is adjusted by your automation speed.
            </p>
          </div>
        ) : (
          <Card>
            <LockHint>
              Complete research: <span className="text-term">Auto Scaling</span> to enable automated
              purchasing.
            </LockHint>
          </Card>
        )}
      </Section>
    </div>
  );
}