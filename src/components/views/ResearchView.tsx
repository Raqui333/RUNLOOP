"use client";

import { useGame } from "@/game/store";
import { RESEARCH, RESEARCH_BY_ID, researchCost } from "@/game/economy";
import { isResearchAvailable } from "@/game/economy";
import { countResearch } from "@/game/engine";
import { formatNumber } from "@/game/numbers";
import { Badge, Button, Section } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ResearchDef, ResearchEffect } from "@/game/types";

function effectLabel(effect: ResearchEffect): string {
  switch (effect.type) {
    case "prodMul":
      return `+${Math.round(effect.value * 100)}% total production`;
    case "workerEfficiency":
      return `Workers now give +${Math.round(effect.value * 100)}% each`;
    case "offlineMul":
      return `+${Math.round(effect.value * 100)}% offline production`;
    case "clickMul":
      return `Execute Build gains +${Math.round(effect.value * 100)}%`;
    case "unlockGenerator": {
      const gen = effect.generatorId;
      const name = gen
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());
      return `Unlocks generator: ${name}`;
    }
    case "unlockAutobuy":
      return "Unlocks auto-buyer automation";
    case "unlockReliability":
      return "Unlocks reliability systems";
  }
}

function ResearchCard({ def }: { def: ResearchDef }) {
  const state = useGame();
  const done = !!state.research[def.id];
  const available = isResearchAvailable(state, def);
  const cost = researchCost(def);
  const affordable = state.resources.cycles.gte(cost);
  const prereqName = def.prereq ? RESEARCH_BY_ID[def.prereq]?.name : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border bg-panel px-3 py-2.5",
        done && "border-term/40",
        !done && available && affordable && "border-cyn/40",
        !done && available && !affordable && "border-line",
        !done && !available && "border-line opacity-55",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border font-mono text-[13px]",
          done ? "border-term/40 text-term" : available ? "border-cyn/40 text-cyn" : "border-line2 text-muted",
        )}
      >
        {done ? "✓" : available ? "▸" : "◇"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={cn("text-sm font-semibold", done ? "text-term" : "text-ink")}>
            {def.name}
          </span>
          {done && <Badge tone="term">Complete</Badge>}
        </div>
        <p className="text-[11px] leading-snug text-muted">{def.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px]">
          <span className="text-cyn">{effectLabel(def.effect)}</span>
          <span className="text-muted">
            cost <span className="text-ink">{formatNumber(cost)}</span>
          </span>
          {!available && prereqName && (
            <span className="text-amb">requires {prereqName}</span>
          )}
        </div>
      </div>

      <Button
        size="sm"
        variant={available && affordable ? "cyan" : "ghost"}
        disabled={done || !available || !affordable}
        onClick={() => useGame.getState().actBuyResearch(def.id)}
        className="shrink-0"
      >
        {done ? "Done" : "Research"}
      </Button>
    </div>
  );
}

export function ResearchView() {
  const state = useGame();
  const total = RESEARCH.length;
  const done = countResearch(state);
  const tiers = Array.from(new Set(RESEARCH.map((r) => r.tier))).sort((a, b) => a - b);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Section
        title="Research tree"
        hint={`${done}/${total} nodes complete`}
      >
        <div className="flex flex-col gap-6">
          {tiers.map((tier) => {
            const nodes = RESEARCH.filter((r) => r.tier === tier);
            if (nodes.length === 0) return null;
            return (
              <div key={tier}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted">
                    Tier {tier}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {nodes.map((def) => (
                    <ResearchCard key={def.id} def={def} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}