"use client";

import { useGame } from "@/game/store";
import {
  UPGRADES,
  RESEARCH,
  isResearchAvailable,
  isUpgradeUnlocked,
  upgradeCost,
  researchCost,
} from "@/game/economy";
import { getRefactorGain, canSolveChallenge } from "@/game/engine";
import type { ViewId } from "@/game/types";
import { cn } from "@/lib/cn";

const NAV: Array<{ id: ViewId; glyph: string; label: string }> = [
  { id: "overview", glyph: "◈", label: "Overview" },
  { id: "compute", glyph: "⬢", label: "Compute" },
  { id: "automation", glyph: "⬡", label: "Automation" },
  { id: "research", glyph: "≋", label: "Research" },
  { id: "upgrades", glyph: "▲", label: "Upgrades" },
  { id: "challenges", glyph: "⚠", label: "Challenges" },
  { id: "metrics", glyph: "▤", label: "Metrics" },
  { id: "refactor", glyph: "◇", label: "Refactor" },
];

export function Sidebar() {
  const state = useGame();
  const view = state.view;
  const setView = useGame.getState().setView;
  const balance = state.resources.cycles;

  const affordableResearch = RESEARCH.filter(
    (r) => isResearchAvailable(state, r) && balance.gte(researchCost(r)),
  ).length;

  const affordableUpgrades = UPGRADES.filter(
    (u) => isUpgradeUnlocked(state, u) && balance.gte(upgradeCost(u, state.upgrades[u.id] ?? 0)),
  ).length;

  const canRefactor = getRefactorGain(state).gt(0);
  const challengeReady = canSolveChallenge(state);
  const ap = state.prestige.architecturePoints ?? 0;

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-line bg-panel sm:w-52">
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map((item) => {
          const active = view === item.id;
          let badge: React.ReactNode = null;
          if (item.id === "research" && affordableResearch > 0) {
            badge = <span className="text-cyn">{affordableResearch}</span>;
          }
          if (item.id === "upgrades" && affordableUpgrades > 0) {
            badge = <span className="text-term">{affordableUpgrades}</span>;
          }
          if (item.id === "refactor" && canRefactor) {
            badge = <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-amb" />;
          }
          if (item.id === "challenges" && challengeReady) {
            badge = <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-err" />;
          }
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-sm border px-2.5 py-2 font-mono text-left text-xs transition-colors",
                active
                  ? "border-term/40 bg-inset text-term"
                  : "border-transparent text-muted hover:bg-inset/60 hover:text-ink",
              )}
            >
              <span className={cn("w-3", active ? "text-term" : "text-line2")}>{item.glyph}</span>
              <span className="flex-1 uppercase tracking-wider">{item.label}</span>
              {badge}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-line p-3 font-mono text-[10px] leading-relaxed text-muted">
        <div className="flex justify-between">
          <span className="uppercase tracking-wider">AP</span>
          <span className="text-amb">{ap}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="uppercase tracking-wider">Refactors</span>
          <span className="text-ink">{state.prestige.refactors}</span>
        </div>
        <div className="mt-2 border-t border-line pt-1.5 opacity-80">
          <span className="text-term">RUNLOOP</span> v0.1.0
        </div>
      </div>
    </aside>
  );
}