"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { SPECS, specCost, REFACTOR_THRESHOLD } from "@/game/economy";
import { computeProduction, getRefactorGain, offlineEfficiency, automationSpeed } from "@/game/engine";
import { formatNumber, formatRate, formatPercent } from "@/game/numbers";
import { Badge, Bar, Button, Card, Section } from "@/components/ui";
import type { SpecDef } from "@/game/types";

function SpecCard({ def }: { def: SpecDef }) {
  const state = useGame();
  const level = state.prestige.specs[def.id] ?? 0;
  const cost = specCost(level);
  const canBuy = state.prestige.architecturePoints >= cost;

  return (
    <div className="rounded-md border border-line bg-panel px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{def.name}</span>
        <Badge tone="cyn">Lv {level}</Badge>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted">{def.description}</p>
      <div className="mt-1 text-[11px] text-term">{def.effect}</div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted">{cost} AP</span>
        <Button
          size="sm"
          variant="cyan"
          disabled={!canBuy}
          onClick={() => useGame.getState().actBuySpec(def.id)}
        >
          Invest
        </Button>
      </div>
    </div>
  );
}

export function RefactorView() {
  const state = useGame();
  const [confirming, setConfirming] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const run = state.totals.runCycles;
  const production = computeProduction(state);
  const gain = getRefactorGain(state);
  const canRefactor = gain.gt(0);
  const progress = run.div(REFACTOR_THRESHOLD).toNumber();
  const ap = state.prestige.architecturePoints;

  const specSum = SPECS.reduce((a, s) => a + (state.prestige.specs[s.id] ?? 0), 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Section title="Refactor" hint="reset the stack for permanent architecture points">
        <Card
          accent="var(--amb)"
          title="Current architecture"
          right={
            canRefactor ? (
              <Badge tone="amb">refactor ready</Badge>
            ) : (
              <span className="text-[10px] text-muted">threshold {formatNumber(REFACTOR_THRESHOLD)}</span>
            )
          }
        >
          <div className="grid gap-4 font-mono sm:grid-cols-3">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted">Run production</div>
              <div className="text-lg text-ink">{formatRate(production)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted">Cycles this run</div>
              <div className="text-lg text-ink">{formatNumber(run)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted">Architecture points</div>
              <div className="text-lg text-amb">{ap.toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-muted">
              <span>Refactor threshold</span>
              <span className="text-amb">+{formatNumber(gain, 0)} AP now</span>
            </div>
            <Bar value={Math.min(progress, 1)} color="var(--amb)" />
          </div>

          <div className="mt-4">
            {!confirming ? (
              <Button
                variant="amber"
                size="lg"
                disabled={!canRefactor}
                onClick={() => setConfirming(true)}
              >
                Initiate refactor
              </Button>
            ) : (
              <div className="rounded-md border border-amb/40 bg-panel2 p-4">
                <div className="text-xs font-semibold text-amb">Confirm architecture rewrite</div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  This reset is permanent. You will lose all generators, upgrades, research,
                  workers and the current cycle balance.
                </p>
                <ul className="mt-2 list-inside list-disc text-[11px] text-muted">
                  <li>
                    Gain: <span className="text-amb">{formatNumber(gain, 0)} AP</span> +1
                    permanent refactor bonus
                  </li>
                  <li>Kept: architecture points, specializations, milestone progress</li>
                  <li>Your system will rebuild from a single Compile Core.</li>
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="amber"
                    size="sm"
                    onClick={() => {
                      setConfirming(false);
                      useGame.getState().actRefactor();
                    }}
                  >
                    Confirm rewrite
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </Section>

      <Section title="Specializations" hint={`invest ${ap} AP`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SPECS.map((def) => (
            <SpecCard key={def.id} def={def} />
          ))}
        </div>
      </Section>

      <Section title="Permanent bonuses">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <BonusStat
            label="Performance"
            value={formatPercent(0.05 * (state.prestige.specs.performance ?? 0), 1)}
          />
          <BonusStat
            label="Offline efficiency"
            value={formatPercent(offlineEfficiency(state) - 1, 1)}
            accent="var(--cyn)"
          />
          <BonusStat
            label="Auto speed"
            value={formatPercent(automationSpeed(state) - 1, 1)}
            accent="var(--blu)"
          />
          <BonusStat
            label="Refactor effort"
            value={`${state.prestige.refactors} runs`}
            accent="var(--amb)"
          />
        </div>
        <p className="mt-2 text-[10px] text-muted">
          {specSum} specialization points allocated over {state.prestige.refactors} refactors.
          Specializations never reset.
        </p>
      </Section>

      <Section title="Danger zone">
        <div className="flex items-center justify-between rounded-md border border-err/30 bg-panel px-3 py-2.5">
          <span className="text-[11px] text-muted">
            Wipe local save and start from a fresh kernel. This cannot be undone.
          </span>
          {!confirmingReset ? (
            <Button variant="danger" size="sm" onClick={() => setConfirmingReset(true)}>
              Hard reset
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setConfirmingReset(false);
                  useGame.getState().hardReset();
                }}
              >
                Confirm wipe
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function BonusStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-inset px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-1 text-sm" style={accent ? { color: accent } : { color: "var(--term)" }}>
        {value}
      </div>
    </div>
  );
}