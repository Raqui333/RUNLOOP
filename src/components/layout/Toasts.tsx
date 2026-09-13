"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import type { ToastKind } from "@/game/types";
import { cn } from "@/lib/cn";

const KIND_STYLE: Record<ToastKind, string> = {
  success: "border-term/50 bg-panel text-term",
  error: "border-err/50 bg-panel text-err",
  info: "border-cyn/50 bg-panel text-cyn",
};

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame.getState().dismissToast;

  useEffect(() => {
    if (toasts.length === 0) return;
    const id = setTimeout(
      () => useGame.getState().dismissToast(toasts[0].id),
      2800,
    );
    return () => clearTimeout(id);
  }, [toasts]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          className={cn(
            "anim-toast pointer-events-auto cursor-pointer rounded-sm border px-3 py-2 font-mono text-[11px] leading-snug shadow-lg shadow-black/40",
            KIND_STYLE[toast.kind],
          )}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}