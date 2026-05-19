"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Identicon from "@/components/wallet/Identicon";
import StateBadge from "./StateBadge";
import { truncateAddress, formatGenBalance } from "@/lib/wallet/format";
import { formatRelativeTime } from "@/lib/utils/time";
import type { TradeListItem } from "@/lib/hooks/useAllTrades";

interface TradeTableProps {
  trades: TradeListItem[];
  isLoading: boolean;
}

export default function TradeTable({ trades, isLoading }: TradeTableProps) {
  const router = useRouter();
  
  if (isLoading) {
    return <TableSkeleton />;
  }
  
  if (trades.length === 0) {
    return (
      <div className="py-16 text-center border border-[var(--border-subtle)] rounded-xl">
        <p className="text-[var(--text-secondary)]">No trades yet</p>
      </div>
    );
  }
  
  return (
    <div className="border border-[var(--border-subtle)] rounded-xl overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
        <thead>
          <tr className="bg-[var(--bg-elevated)] text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            <th className="px-4 py-3 text-left font-medium sticky left-0 z-10 bg-[var(--bg-elevated)]">#</th>
            <th className="px-4 py-3 text-left font-medium">Title</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-left font-medium">Seller</th>
            <th className="px-4 py-3 text-left font-medium">Buyer</th>
            <th className="px-4 py-3 text-left font-medium">State</th>
            <th className="px-4 py-3 text-right font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              onClick={() => router.push(`/trade/${trade.id}`)}
              className="border-t border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]/50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 font-mono text-[var(--text-secondary)] sticky left-0 z-10 bg-[var(--bg-deep)] group-hover:bg-[var(--bg-elevated)]/50 transition-colors">
                #{trade.id}
              </td>
              <td className="px-4 py-3 text-[var(--text-primary)] max-w-[240px] truncate">
                {trade.title}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">
                {formatGenBalance(trade.price)}
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <Link 
                  href={`/u/${trade.seller}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit"
                >
                  <Identicon address={trade.seller} size={20} />
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {truncateAddress(trade.seller)}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                {trade.buyer && trade.buyer !== trade.seller ? (
                  <Link 
                    href={`/u/${trade.buyer}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit"
                  >
                    <Identicon address={trade.buyer} size={20} />
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      {truncateAddress(trade.buyer)}
                    </span>
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--text-tertiary)]">--</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StateBadge state={trade.state} />
              </td>
              <td className="px-4 py-3 text-right text-xs text-[var(--text-secondary)] font-mono">
                {trade.shipped_at > 0 ? formatRelativeTime(trade.shipped_at) : "--"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
      <div className="bg-[var(--bg-elevated)] h-12" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-t border-[var(--border-subtle)] h-12 p-3 flex items-center gap-4 animate-pulse">
          <div className="h-4 w-8 bg-[var(--bg-elevated-2)] rounded" />
          <div className="h-4 w-32 bg-[var(--bg-elevated-2)] rounded flex-1" />
          <div className="h-4 w-20 bg-[var(--bg-elevated-2)] rounded" />
          <div className="h-4 w-24 bg-[var(--bg-elevated-2)] rounded" />
          <div className="h-4 w-16 bg-[var(--bg-elevated-2)] rounded" />
        </div>
      ))}
    </div>
  );
}
