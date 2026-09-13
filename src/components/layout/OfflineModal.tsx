"use client";

import { useGame } from "@/game/store";
import { formatDuration, formatNumber } from "@/game/numbers";
import { Button } from "@/components/ui";

export function OfflineModal() {
  const info = useGame((s) => s.offlineInfo);
  const dismiss = useGame((s) => s.dismissOffline);
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="anim-fade-up w-full max-w-sm rounded-md border border-term/40 bg-panel p-5 font-mono shadow-2xl shadow-black/60">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted">
          Offline production
        </div>
        <div className="mt-1 text-lg font-semibold text-term">RESTORE COMPLETE</div>

        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted">Time away</dt>
            <dd className="text-ink">{formatDuration(info.seconds)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Efficiency</dt>
            <dd className="text-cyn">{formatNumber(info.efficiency, 2)}x</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2">
            <dt className="text-muted">Cycles collected</dt>
            <dd className="text-lg text-term">{formatNumber(info.gained)}</dd>
          </div>
        </dl>

        <Button
          variant="primary"
          size="lg"
          className="mt-5 w-full"
          onClick={dismiss}
        >
          Collect
        </Button>
      </div>
    </div>
  );
}