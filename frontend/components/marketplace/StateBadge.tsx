"use client";

import { TRADE_STATE_LABELS, type TradeStateValue } from "@/lib/genlayer/types";

interface StateBadgeProps {
  state: number;
  size?: "sm" | "md";
}

export default function StateBadge({ state, size = "sm" }: StateBadgeProps) {
  const label = TRADE_STATE_LABELS[state as TradeStateValue] ?? "UNKNOWN";
  const colorClass = getStateColor(state);
  const sizeClass = size === "sm" 
    ? "text-[10px] px-2 py-0.5" 
    : "text-xs px-2.5 py-1";
  
  return (
    <span className={`inline-block font-mono uppercase tracking-wider rounded ${colorClass} ${sizeClass}`}>
      {label}
    </span>
  );
}

function getStateColor(state: number): string {
  switch (state) {
    case 0: // LISTING_OPEN
      return "bg-[var(--bg-elevated-2)] text-[var(--text-secondary)]";
    case 1: // PAID
    case 2: // SHIPPED
      return "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]";
    case 3: // DISPUTED
      return "bg-[var(--warning)]/15 text-[var(--warning)]";
    case 4: // COMPLETED
      return "bg-[var(--success)]/15 text-[var(--success)]";
    case 5: // CANCELLED
      return "bg-[var(--bg-elevated-2)] text-[var(--text-tertiary)]";
    case 6: // REFUNDED
      return "bg-[var(--text-secondary)]/15 text-[var(--text-secondary)]";
    default:
      return "bg-[var(--bg-elevated-2)] text-[var(--text-secondary)]";
  }
}
