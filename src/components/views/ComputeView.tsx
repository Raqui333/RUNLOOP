"use client";

import { useGame } from "@/game/store";
import { GENERATORS, isGeneratorUnlocked } from "@/game/economy";
import { computeProduction, totalParts } from "@/game/engine";
import { formatRate } from "@/game/numbers";
import { Section, Stat } from "@/components/ui";
import { GeneratorCard } from "@/components/game/GeneratorCard";

export function ComputeView() {
  const state = useGame();
  const production = computeProduction(state);

  const ordered = [...GENERATORS];

  const specsLocked = ordered.filter((g) => !isGeneratorUnlocked(state, g)).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="grid grid-cols-3 gap-3 lg:w-1/2">
        <Stat label="Systems" value={totalParts(state)} />
        <Stat label="Throughput" value={formatRate(production)} accent="var(--term)" />
        <Stat label="Locked" value={specsLocked} accent="var(--muted)" />
      </div>

      <Section title="Compute units" hint="deploy hardware to generate cycles">
        <div className="flex flex-col gap-2.5">
          {ordered.map((gen) => (
            <GeneratorCard key={gen.id} gen={gen} />
          ))}
        </div>
      </Section>
    </div>
  );
}