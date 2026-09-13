"use client";

import { useGame } from "@/game/store";
import {
  UPGRADES,
  BREAKTHROUGHS,
  RESEARCH_BY_ID,
  upgradeCost,
  breakthroughCost,
  isUpgradeUnlocked,
  isBreakthroughUnlocked,
} from "@/game/economy";
import { countUpgrades } from "@/game/engine";
import { formatNumber, formatPercent } from "@/game/numbers";
import { Badge, Button, Section } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { BreakthroughDef, UpgradeDef } from "@/game/types";

function UpgradeCard({ def }: { def: UpgradeDef }) {
  const state = useGame();
  const level = state.upgrades[def.id] ?? 0;
  const unlocked = isUpgradeUnlocked(state, def);
  const cost = upgradeCost(def, level);
  const affordable = unlocked && state.resources.cycles.gte(cost);
  const prereqName = def.unlockResearch ? RESEARCH_BY_ID[def.unlockResearch]?.name : null;

  return (
    <div
      className={cn(
        "rounded-md border bg-panel px-3 py-2.5",
        affordable ? "border-term/40" : "border-line",
        !unlocked && "opacity-55",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-sm border border-line2 bg-inset px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-cyn">
            {def.badge}
          </span>
          <span className="text-sm font-semibold text-ink">{def.name}</span>
        </div>
        <span className="font-mono text-xs text-muted">Lv {level}</span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted">{def.description}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] text-term">
          {formatPercent(def.perLevel * level, 1)} total
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">{formatNumber(cost)}</span>
          <Button
            size="sm"
            variant="primary"
            disabled={!affordable}
            onClick={() => useGame.getState().actBuyUpgrade(def.id)}
          >
            Upgrade
          </Button>
        </div>
      </div>
      {!unlocked && prereqName && (
        <div className="mt-1.5 text-[10px] text-amb">requires research: {prereqName}</div>
      )}
    </div>
  );
}

function BreakthroughCard({ def }: { def: BreakthroughDef }) {
  const state = useGame();
  const bought = !!state.breakthroughs[def.id];
  const unlocked = isBreakthroughUnlocked(state, def);
  const cost = breakthroughCost(def);
  const affordable = unlocked && state.resources.cycles.gte(cost);
  const prereqName = def.unlockResearch ? RESEARCH_BY_ID[def.unlockResearch]?.name : null;

  return (
    <div
      className={cn(
        "rounded-md border bg-panel px-3 py-2.5",
        bought ? "border-term/40" : affordable ? "border-cyn/40" : "border-line",
        !unlocked && "opacity-55",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-sm border border-line2 bg-inset px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-amb">
            {def.badge}
          </span>
          <span className="text-sm font-semibold text-ink">{def.name}</span>
        </div>
        {bought && <Badge tone="term">Applied</Badge>}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted">{def.description}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] text-cyn">+{Math.round(def.prodMul * 100)}%</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">{formatNumber(cost)}</span>
          <Button
            size="sm"
            variant={affordable ? "cyan" : "ghost"}
            disabled={bought || !affordable}
            onClick={() => useGame.getState().actBuyBreakthrough(def.id)}
          >
            {bought ? "Active" : "Adopt"}
          </Button>
        </div>
      </div>
      {!unlocked && prereqName && (
        <div className="mt-1.5 text-[10px] text-amb">requires research: {prereqName}</div>
      )}
    </div>
  );
}

export function UpgradesView() {
  const state = useGame();
  const levels = countUpgrades(state);
  const applied = Object.values(state.breakthroughs).filter(Boolean).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Section title="Optimizations" hint={`${levels} levels deployed`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {UPGRADES.map((def) => (
            <UpgradeCard key={def.id} def={def} />
          ))}
        </div>
      </Section>

      <Section title="Breakthroughs" hint={`${applied}/${BREAKTHROUGHS.length} adopted`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BREAKTHROUGHS.map((def) => (
            <BreakthroughCard key={def.id} def={def} />
          ))}
        </div>
      </Section>
    </div>
  );
}