"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import { computeProduction } from "@/game/engine";
import { getScaleTier } from "@/game/economy";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { LogPanel } from "@/components/layout/LogPanel";
import { Toasts } from "@/components/layout/Toasts";
import { OfflineModal } from "@/components/layout/OfflineModal";
import { OverviewView } from "@/components/views/OverviewView";
import { ComputeView } from "@/components/views/ComputeView";
import { AutomationView } from "@/components/views/AutomationView";
import { ResearchView } from "@/components/views/ResearchView";
import { UpgradesView } from "@/components/views/UpgradesView";
import { MetricsView } from "@/components/views/MetricsView";
import { ChallengesView } from "@/components/views/ChallengesView";
import { RefactorView } from "@/components/views/RefactorView";

export function GameShell() {
  const state = useGame();
  const view = state.view;

  const production = computeProduction(state);
  const tier = getScaleTier(production);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", tier.accent);
  }, [tier.accent]);

  return (
    <div className="flex h-full flex-col font-mono">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-5">
          {view === "overview" && <OverviewView />}
          {view === "compute" && <ComputeView />}
          {view === "automation" && <AutomationView />}
          {view === "research" && <ResearchView />}
          {view === "upgrades" && <UpgradesView />}
          {view === "metrics" && <MetricsView />}
          {view === "challenges" && <ChallengesView />}
          {view === "refactor" && <RefactorView />}
        </main>
      </div>
      <LogPanel />
      <Toasts />
      <OfflineModal />
    </div>
  );
}