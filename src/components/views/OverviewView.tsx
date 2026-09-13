"use client";

import { useRef, useState } from "react";
import { useGame } from "@/game/store";
import {
  computeProduction,
  getNextMilestone,
  buildGain,
  getRefactorGain,
  upgradeLevelsTotal,
} from "@/game/engine";
import {
  MILESTONES,
  SCALE_TIERS,
  getScaleIndex,
  getScaleTier,
  RESEARCH,
} from "@/game/economy";
import { formatDuration, formatNumber, formatRate } from "@/game/numbers";
import { Button, Card, Section, Stat } from "@/components/ui";
import { cn } from "@/lib/cn";

function BuildButton() {
  const state = useGame();
  const [floaters, setFloaters] = useState<{ id: number; text: string }[]>([]);
  const seqRef = useRef(0);

  const handleBuild = () => {
    const gain = buildGain(state);
    useGame.getState().actExecuteBuild();
    if (gain.gt(0)) {
      const id = seqRef.current++;
      const text = `+${formatNumber(gain)}`;
      setFloaters((prev) => [...prev.slice(-4), { id, text }]);
      window.setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id));
      }, 1100);
    }
  };

  return (
    <div className="relative">
      <Button variant="primary" size="lg" onClick={handleBuild}>
        Execute build
        <span className="text-[10px] opacity-70">+{formatNumber(buildGain(state))}</span>
      </Button>
      {floaters.map((f) => (
        <span
          key={f.id}
          className="anim-float-up pointer-events-none absolute -top-1 right-2 font-mono text-xs text-term"
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}

export function OverviewView() {
  const state = useGame();
  const production = computeProduction(state);
  const tier = getScaleTier(production);
  const balance = state.resources.cycles;
  const next = getNextMilestone(state);
  const canRefactor = getRefactorGain(state).gt(0);
  const scaleIndex = getScaleIndex(production);
  const researchDone = Object.values(state.research).filter(Boolean).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <section
        className="rounded-md border bg-panel p-5"
        style={{ borderColor: `${tier.accent}55` }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted">
              System designation
            </div>
            <div
              key={tier.name}
              className="anim-tier-pulse mt-1 inline-block rounded-sm px-1 text-2xl font-semibold tracking-tight"
              style={{ color: tier.accent }}
            >
              {tier.name}
            </div>
            <div className="mt-3 flex items-baseline gap-6 font-mono">
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted">
                  Production
                </div>
                <div className="text-xl text-term">{formatRate(production)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted">
                  Balance
                </div>
                <div className="text-xl text-ink">{formatNumber(balance)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted">
                  Run earned
                </div>
                <div className="text-xl text-cyn">{formatNumber(state.totals.runCycles)}</div>
              </div>
            </div>
          </div>
          <BuildButton />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Generators" value={Object.values(state.generators).reduce((a, b) => a + b, 0)} />
        <Stat label="Workers" value={state.workers} accent="var(--cyn)" />
        <Stat label="Upgrade LvL" value={upgradeLevelsTotal(state)} />
        <Stat label="Research" value={`${researchDone}/${RESEARCH.length}`} accent="var(--blu)" />
        <Stat label="Builds" value={state.totals.builds} />
        <Stat label="Uptime" value={formatDuration(state.stats.runtimeSeconds)} />
      </div>

      {canRefactor && (
        <Section title="Refactor available">
          <Card
            title="Architectural debt accumulated"
            accent="var(--amb)"
            right={
              <Button size="sm" variant="amber" onClick={() => useGame.getState().setView("refactor")}>
                Open refactor
              </Button>
            }
          >
            <p className="text-xs leading-relaxed text-muted">
              The system has grown complex enough that a full rewrite of the architecture would
              yield permanent bonuses. Reset generators, research and upgrades in exchange for
              Architecture Points.
            </p>
          </Card>
        </Section>
      )}

      {next ? (
        <Section title="Next milestone">
          <Card>
            <div className="text-sm font-semibold text-term">{next.label}</div>
            <div className="mt-0.5 text-xs text-muted">{next.description}</div>
          </Card>
        </Section>
      ) : null}

      <Section
        title="Milestones"
        hint={`${MILESTONES.filter((m) => m.check(state)).length}/${MILESTONES.length} complete`}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MILESTONES.map((m) => {
            const done = m.check(state);
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-start gap-2 rounded-sm border px-3 py-2",
                  done ? "border-term/40 bg-inset" : "border-line bg-panel",
                )}
              >
                <span className={cn("mt-0.5 text-xs", done ? "text-term" : "text-line2")}>
                  {done ? "▣" : "□"}
                </span>
                <div>
                  <div className={cn("text-xs", done ? "text-term" : "text-ink/80")}>{m.label}</div>
                  <div className="text-[10px] leading-snug text-muted">{m.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Evolution path">
        <div className="grid gap-1">
          {SCALE_TIERS.map((s, i) => {
            const reached = i <= scaleIndex;
            const current = i === scaleIndex;
            return (
              <div
                key={s.name}
                className={cn(
                  "flex items-center gap-3 rounded-sm border px-3 py-1.5 text-xs",
                  current
                    ? "border-term/50 bg-inset"
                    : reached
                      ? "border-line bg-panel"
                      : "border-line bg-panel opacity-45",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: reached ? s.accent : "var(--line-2)" }}
                />
                <span
                  className={cn("uppercase tracking-wider", current ? "font-semibold" : "")}
                  style={{ color: current ? s.accent : undefined }}
                >
                  {s.name}
                </span>
                {current && (
                  <span className="ml-auto text-[9px] uppercase tracking-widest text-term">
                    current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}