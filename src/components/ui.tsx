import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Variant = "primary" | "ghost" | "danger" | "cyan" | "amber";
export type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border border-term/40 bg-term/10 text-term hover:border-term/70 hover:bg-term/15",
  ghost:
    "border border-line2 text-muted hover:border-ink/60 hover:text-ink",
  danger: "border border-err/50 text-err hover:bg-err/10 hover:border-err",
  cyan: "border border-cyn/40 bg-cyn/10 text-cyn hover:border-cyn/70 hover:bg-cyn/15",
  amber: "border border-amb/50 bg-amb/10 text-amb hover:border-amb hover:bg-amb/15",
};

const SIZES: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1.5 text-[11px]",
  lg: "px-5 py-2.5 text-xs",
};

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  className,
  onClick,
  children,
  title,
}: {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-sm font-mono uppercase tracking-[0.12em] transition-colors",
        SIZES[size],
        VARIANTS[variant],
        disabled && "pointer-events-none cursor-not-allowed opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  right,
  accent,
  className,
  children,
}: {
  title?: string;
  right?: ReactNode;
  accent?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-line bg-panel",
        className,
      )}
    >
      {title != null && (
        <header className="flex items-center justify-between border-b border-line px-3 py-2">
          <div className="flex items-center gap-2">
            {accent && (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: accent }}
              />
            )}
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/90">
              {title}
            </h3>
          </div>
          {right}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}

export function Section({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("anim-fade-up", className)}>
      <div className="mb-3 flex items-baseline gap-3 border-b border-line pb-2">
        <span className="text-xs uppercase tracking-[0.22em] text-ink">{title}</span>
        {hint && <span className="text-[10px] uppercase tracking-wider text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-inset px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted">{label}</div>
      <div
        className="mt-1 truncate font-mono text-base leading-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {hint != null && <div className="mt-0.5 text-[10px] text-muted">{hint}</div>}
    </div>
  );
}

export function Bar({
  value,
  className,
  color = "var(--term)",
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-sm border border-line bg-inset",
        className,
      )}
    >
      <div
        className="bar-glint h-full rounded-sm transition-[width] duration-200"
        style={{
          width: `${clamped * 100}%`,
          background: color,
          opacity: 0.85,
        }}
      />
    </div>
  );
}

export function Badge({
  children,
  tone = "term",
}: {
  children: ReactNode;
  tone?: "term" | "cyn" | "blu" | "amb" | "err" | "muted";
}) {
  const tones: Record<string, string> = {
    term: "border-term/40 bg-term/10 text-term",
    cyn: "border-cyn/40 bg-cyn/10 text-cyn",
    blu: "border-blu/40 bg-blu/10 text-blu",
    amb: "border-amb/50 bg-amb/10 text-amb",
    err: "border-err/50 bg-err/10 text-err",
    muted: "border-line2 bg-inset text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function LockHint({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-1.5 rounded-sm border border-line bg-panel2 px-2 py-1.5 text-[10px] text-muted">
      <span className="mt-px text-amb">▲</span>
      <span>{children}</span>
    </div>
  );
}

export function Money({
  children,
  accent,
  className,
}: {
  children: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <span className={cn("font-mono", className)} style={accent ? { color: accent } : undefined}>
      {children}
    </span>
  );
}