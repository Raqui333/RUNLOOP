"use client";

import { useGame } from "@/game/store";
import type { GeneratorDef } from "@/game/types";
import { generatorCost, moduleCost, isGeneratorUnlocked, RESEARCH_BY_ID } from "@/game/economy";
import { productionPerGenerator } from "@/game/engine";
import { formatNumber, formatRate } from "@/game/numbers";
import { Button, LockHint } from "@/components/ui";
import { cn } from "@/lib/cn";

export function GeneratorCard({ gen }: { gen: GeneratorDef }) {
  const state = useGame();
  const balance = state.resources.cycles;
  const count = state.generators[gen.id] ?? 0;
  const moduleLevel = state.modules[gen.id] ?? 0;
  const unlocked = isGeneratorUnlocked(state, gen);
  const cost = generatorCost(gen, count);
  const affordable = unlocked && balance.gte(cost);
  const prod = productionPerGenerator(state, gen);

  const moduleLvl = moduleLevel;
  const moduleUnlocked = count >= 10;
  const moduleCostValue = moduleCost(gen, moduleLvl);

  let lockHint: string | null = null;
  if (!unlocked) {
    if (gen.unlockResearch && !state.research[gen.unlockResearch]) {
      const researchName = RESEARCH_BY_ID[gen.unlockResearch]?.name ?? gen.unlockResearch;
      lockHint = `Unlocks via research: ${researchName}`;
    }
    if (gen.unlockGenerator) {
      const prev = state.generators[gen.unlockGenerator] ?? 0;
      const prevName = gen.unlockGenerator;
      lockHint = lockHint
        ? `${lockHint}. Also via: ${gen.unlockCount} ${prevName} (${prev}/${gen.unlockCount}).`
        : `Unlocks via: ${gen.unlockCount} ${prevName} (${prev}/${gen.unlockCount}).`;
    }
  }

  return (
    <div
      className={cn(
        "rounded-md border bg-panel transition-colors",
        affordable ? "border-term/40" : "border-line",
        !unlocked && "opacity-70",
      )}
    >
      <div className="flex items-center gap-4 p-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-line2 bg-inset">
          <span className="font-mono text-[10px] font-semibold tracking-widest text-cyn">
            {gen.badge}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ink">{gen.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted">
              owned {count}
            </span>
          </div>
          <p className="truncate text-[11px] text-muted">{gen.description}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-[11px]">
            <span className="text-muted">
              yields <span className="text-term">{formatRate(prod)}</span>
            </span>
            <span className="text-muted">
              cost <span className="text-ink">{formatNumber(cost)}</span>
            </span>
            {moduleLvl > 0 && (
              <span className="text-cyn">module x{moduleLvl}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Button
            size="sm"
            variant="primary"
            disabled={!affordable}
            onClick={() => useGame.getState().actBuyGenerator(gen.id)}
          >
            Deploy
          </Button>
          {moduleUnlocked && (
            <Button
              size="sm"
              variant="ghost"
              disabled={!balance.gte(moduleCostValue)}
              onClick={() => useGame.getState().actBuyModule(gen.id)}
              title="Overclock: +15% production of this generator per level"
            >
              Mod +15%
              <span className="text-muted">{formatNumber(moduleCostValue)}</span>
            </Button>
          )}
        </div>
      </div>

      {lockHint && (
        <div className="border-t border-line px-3 py-2">
          <LockHint>{lockHint}</LockHint>
        </div>
      )}
    </div>
  );
}