"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import { GameShell } from "@/components/GameShell";

export default function Home() {
  const boot = useGame((s) => s.boot);
  const booted = useGame((s) => s.booted);

  useEffect(() => {
    boot();
  }, [boot]);

  if (!booted) {
    return (
      <div className="flex h-full items-center justify-center bg-bg font-mono">
        <div className="text-sm text-muted">
          <span className="text-term">RUNLOOP</span>
          <span className="text-muted">://booting kernel</span>
          <span className="cursor-blink text-term">_</span>
        </div>
      </div>
    );
  }

  return <GameShell />;
}