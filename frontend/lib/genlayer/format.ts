import type { Address } from "./types";

/**
 * Conversion and formatting helpers for on-chain values.
 *
 * GEN amounts are stored as u256 wei (10^18 base) per contract convention.
 * Always parse and format at the rendering boundary, never store unscaled
 * floats in app state.
 */

const WEI_PER_GEN = 1_000_000_000_000_000_000n;

export function weiToGen(wei: bigint | string): number {
  const w = typeof wei === "string" ? BigInt(wei) : wei;
  // Avoid precision loss for large amounts: do integer division for the whole
  // part and computation modulo for the fractional, then combine.
  const whole = w / WEI_PER_GEN;
  const frac = w % WEI_PER_GEN;
  return Number(whole) + Number(frac) / 1e18;
}

export function genToWei(gen: number): bigint {
  if (!Number.isFinite(gen) || gen < 0) {
    throw new Error(`Invalid GEN amount: ${gen}`);
  }
  // Multiply by 10^18 with rounding to avoid floating-point error.
  const rounded = Math.round(gen * 1e18);
  return BigInt(rounded);
}

export function formatGen(
  wei: bigint | string,
  options: { decimals?: number; showUnit?: boolean } = {},
): string {
  const { decimals = 3, showUnit = true } = options;
  const value = weiToGen(wei);
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showUnit ? `${formatted} GEN` : formatted;
}

export function formatWei(wei: bigint | string): string {
  const w = typeof wei === "string" ? BigInt(wei) : wei;
  return w.toLocaleString("en-US");
}

export function truncateAddress(
  addr: Address | string,
  options: { left?: number; right?: number } = {},
): string {
  const { left = 6, right = 4 } = options;
  if (addr.length <= left + right) return addr;
  return `${addr.slice(0, left)}...${addr.slice(-right)}`;
}

export function isZeroAddress(addr: string): boolean {
  return /^0x0+$/i.test(addr);
}

/**
 * Format a Unix-seconds timestamp as a UTC string.
 * Returns an empty string for the sentinel value 0 (uninitialized).
 */
export function formatTimestamp(unixSeconds: number | string): string {
  const n = typeof unixSeconds === "string" ? Number(unixSeconds) : unixSeconds;
  if (n === 0 || Number.isNaN(n)) return "";
  return new Date(n * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

/**
 * Format a Unix-seconds timestamp as a relative time string.
 * Returns "" for sentinel value 0.
 */
export function formatRelativeTime(unixSeconds: number | string): string {
  const n = typeof unixSeconds === "string" ? Number(unixSeconds) : unixSeconds;
  if (n === 0 || Number.isNaN(n)) return "";

  const nowSec = Math.floor(Date.now() / 1000);
  const diff = nowSec - n;

  if (diff < 0) {
    const future = -diff;
    if (future < 60) return `in ${future}s`;
    if (future < 3600) return `in ${Math.floor(future / 60)}m`;
    if (future < 86400) return `in ${Math.floor(future / 3600)}h`;
    return `in ${Math.floor(future / 86400)}d`;
  }

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 30 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return formatTimestamp(unixSeconds);
}
