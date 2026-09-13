"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { CHALLENGES, isChallengeUnlocked } from "@/game/economy";
import {
  canSolveChallenge,
  challengeNextReward,
  challengeProgress,
  challengeTarget,
  computeProduction,
  getActiveChallenge,
} from "@/game/engine";
import { formatNumber, formatPercent, formatRate } from "@/game/numbers";
import { Badge, Bar, Button, Card, Section } from "@/components/ui";
import type { ChallengeDef } from "@/game/types";

function ChallengeCard({ def }: { def: ChallengeDef }) {
  const state = useGame();
  const solved = state.challenges[def.id] ?? 0;
  const unlocked = isChallengeUnlocked(state, def);
  const anyActive = state.activeChallenge != null;
  const target = challengeTarget(def, solved);
  const reward = challengeNextReward(state, def);

  return (
    <div
      className="flex flex-col rounded-md border border-line bg-panel px-3 py-3"
      style={unlocked ? undefined : { opacity: 0.55 }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{def.name}</span>
        <div className="flex items-center gap-1.5">
          <Badge tone={unlocked ? "amb" : "muted"}>{def.badge}</Badge>
          <Badge tone={solved > 0 ? "term" : "muted"}>
            {solved > 0 ? `T${solved} cleared` : "NEW"}
          </Badge>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted">{def.description}</p>
      <p className="mt-1.5 text-[11px] text-err">{def.flaw}</p>

      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-muted">Next target</div>
          <div className="text-ink">{formatNumber(target, 0)}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-muted">Next reward</div>
          <div className="text-term">+{formatPercent(reward, 0)} prod</div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[10px] text-muted">
          {unlocked
            ? `${state.prestige.refactors} refactors`
            : `requires ${def.unlockRefactors}+ refactors`}
        </span>
        <Button
          size="sm"
          variant={unlocked ? "amber" : "ghost"}
          disabled={!unlocked || anyActive}
          title={anyActive ? "Finish or abandon the active challenge first" : undefined}
          onClick={() => useGame.getState().actStartChallenge(def.id)}
        >
          Enter
        </Button>
      </div>
    </div>
  );
}

function ActiveChallengePanel() {
  const state = useGame();
  const def = getActiveChallenge(state);
  const [confirming, setConfirming] = useState(false);
  if (!def) return null;

  const target = challengeTarget(def, state.challenges[def.id] ?? 0);
  const progress = Math.min(1, challengeProgress(state, def));
  const solveable = canSolveChallenge(state);
  const production = computeProduction(state);

  return (
    <Section title="Active challenge" hint={def.flaw}>
      <Card accent="var(--err)" title={`${def.badge} · ${def.name}`} right={<Badge tone="err">active</Badge>}>
        <div className="grid gap-4 font-mono sm:grid-cols-3">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted">Run production</div>
            <div className="text-lg text-ink">{formatRate(production)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted">Cycles this run</div>
            <div className="text-lg text-ink">{formatNumber(state.totals.runCycles, 0)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted">Solve target</div>
            <div className="text-lg text-amb">{formatNumber(target, 0)}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-muted">
            <span>Challenge progress</span>
            <span className={solveable ? "text-amb" : "text-term"}>
              {formatPercent(progress, 1)}
            </span>
          </div>
          <Bar value={progress} color={solveable ? "var(--amb)" : "var(--cyn)"} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!confirming ? (
            <Button variant="amber" size="lg" disabled={!solveable} onClick={() => useGame.getState().actSolveChallenge()}>
              Solve challenge
            </Button>
          ) : null}
          {!confirming ? (
            <Button variant="danger" size="lg" onClick={() => setConfirming(true)}>
              Abandon
            </Button>
          ) : (
            <div className="rounded-md border border-err/40 bg-panel2 px-3 py-2.5">
              <span className="mr-3 text-[11px] text-muted">
                Abandoning clears this run with no reward.
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setConfirming(false);
                  useGame.getState().actAbandonChallenge();
                }}
              >
                Confirm abandon
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Keep going
              </Button>
            </div>
          )}
        </div>
        <p className="mt-3 text-[10px] text-muted">
          Refactor is suspended while a challenge is running. Solved challenges bank permanent
          production bonuses that apply in every run — including future challenges.
        </p>
      </Card>
    </Section>
  );
}

export function ChallengesView() {
  const state = useGame();
  const active = getActiveChallenge(state);
  const cleared = Object.values(state.challenges).reduce((a, b) => a + b, 0);
  const clearedOf = CHALLENGES.length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Section title="Challenges" hint={`${cleared} tiers cleared across ${clearedOf} protocols`}>
        <p className="mb-3 max-w-2xl text-[11px] leading-relaxed text-muted">
          A challenge is a constrained rebuild of your stack. Entering one wipes the current run
          and applies a handicap until you reach its target. Clearing a tier banks a permanent
          production bonus. Higher tiers raise the target — and never take a reward away.
        </p>

        {active && <ActiveChallengePanel />}

        {!active && (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {CHALLENGES.map((def) => (
              <ChallengeCard key={def.id} def={def} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}