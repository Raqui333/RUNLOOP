import Decimal from "break_infinity.js";

export { Decimal };

export type DecimalSource = Decimal | number | string;

export function toDecimal(value: DecimalSource): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

const SUFFIXES = [
  "",
  "K",
  "M",
  "B",
  "T",
  "Qa",
  "Qi",
  "Sx",
  "Sp",
  "Oc",
  "No",
  "Dc",
  "UDc",
  "DDc",
  "TDc",
  "QaDc",
  "QiDc",
  "SxDc",
  "SpDc",
  "OcDc",
  "NoDc",
  "Vg",
  "UVg",
  "DVg",
  "TVg",
  "QaVg",
  "QiVg",
  "SxVg",
  "SpVg",
  "OcVg",
  "NoVg",
  "Tg",
  "UTg",
  "DTg",
  "TTg",
  "QaTg",
  "QiTg",
  "SxTg",
  "SpTg",
  "OcTg",
  "NoTg",
];

const SUFFIX_LIMIT = SUFFIXES.length;

function trimZeros(value: string): string {
  return value.indexOf(".") >= 0 ? value.replace(/\.?0+$/, "") : value;
}

export function formatNumber(value: DecimalSource, decimals = 2): string {
  const d = toDecimal(value);
  if (!d.gte(0)) return "0";
  if (d.lt(1)) {
    return trimZeros(d.toFixed(d.lt(0.001) ? 0 : 3));
  }
  const exponent = d.log10();
  if (exponent < 3) {
    return trimZeros(d.toFixed(d.lt(10) ? 2 : d.lt(1000) ? 1 : 0));
  }
  const group = Math.floor(exponent / 3);
  if (group < SUFFIX_LIMIT) {
    const mantissa = d.div(Decimal.pow(10, group * 3)).toNumber();
    return `${mantissa.toFixed(mantissa >= 100 ? 1 : decimals)}${SUFFIXES[group]}`;
  }
  return d.toExponential(decimals).replace("e+", "e");
}

export function formatRate(value: DecimalSource): string {
  return `${formatNumber(value, 2)}/s`;
}

export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function formatClock(now = Date.now()): string {
  const date = new Date(now);
  return date.toTimeString().slice(0, 8);
}

export function safeDecimal(value: unknown, fallback: DecimalSource = 0): Decimal {
  try {
    const d = value instanceof Decimal ? value : new Decimal(value as DecimalSource);
    if (!Number.isFinite(d.m) || !Number.isFinite(d.e)) return toDecimal(fallback);
    if (d.e > 1e12 || d.e < -1e12) return toDecimal(fallback);
    if (d.sign() < 0) return toDecimal(fallback);
    return d;
  } catch {
    return toDecimal(fallback);
  }
}