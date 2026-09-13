"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import type { LogKind } from "@/game/types";
import { formatClock } from "@/game/numbers";
import { cn } from "@/lib/cn";

const KIND_COLOR: Record<LogKind, string> = {
  info: "text-ink",
  success: "text-term",
  warn: "text-amb",
  debug: "text-muted",
};

export function LogPanel() {
  const logs = useGame((s) => s.logs);
  const logLevel = useGame((s) => s.settings.logLevel);
  const toggle = useGame((s) => s.toggleLogLevel);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <footer className="flex h-36 shrink-0 flex-col border-t border-line bg-panel md:h-44">
      <div className="flex items-center gap-3 border-b border-line px-3 py-1">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
          SYSTEM LOG <span className="text-line2">[{logs.length}]</span>
        </span>
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-term" />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => toggle()}
          className={cn(
            "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors",
            logLevel === "detailed"
              ? "border-cyn/40 bg-cyn/10 text-cyn"
              : "border-line2 text-muted hover:text-ink",
          )}
        >
          {logLevel === "detailed" ? "Detailed log" : "Quiet log"}
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[11px] leading-5">
        {logs.map((log) => (
          <div key={log.id} className={cn("flex gap-2 whitespace-pre-wrap", KIND_COLOR[log.kind])}>
            <span className="shrink-0 text-muted/70">[{formatClock(log.time)}]</span>
            <span>{log.text}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}