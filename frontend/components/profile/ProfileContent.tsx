"use client";

import React from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import Identicon from "../wallet/Identicon";
import { truncateAddress, formatGenBalance } from "../../lib/wallet/format";
import { useProfileStats } from "../../lib/hooks/useProfileStats";
import { useWalletStore } from "../../lib/wallet/store";
import { toast } from "sonner";

interface ProfileContentProps {
  address: string;
}

export default function ProfileContent({ address }: ProfileContentProps) {
  const { data: stats, isLoading, isError, refetch } = useProfileStats(address);
  const { address: connectedAddress } = useWalletStore();
  const [copied, setCopied] = React.useState(false);

  const isYou = connectedAddress?.toLowerCase() === address.toLowerCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated-2)]" />
          <div className="space-y-3 flex-1">
            <div className="h-8 w-48 bg-[var(--bg-elevated-2)] rounded" />
            <div className="h-4 w-64 bg-[var(--bg-elevated-2)] rounded" />
          </div>
          <div className="w-32 h-20 bg-[var(--bg-elevated-2)] rounded-xl" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[var(--bg-elevated-2)] rounded-xl" />
          ))}
        </div>
        
        {/* Stats Grid 2 Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[var(--bg-elevated-2)] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-[var(--text-secondary)]">
        <p className="mb-4">Failed to fetch profile data</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const totalTrades = stats.marketplace.tradesAsBuyer + stats.marketplace.tradesAsSeller;
  const totalBets = stats.predictions.betsPlaced;
  const hasNoActivity = totalTrades === 0 && totalBets === 0;

  // Badges
  const badges = [];
  if (totalTrades >= 1) badges.push("First trade");
  if (totalTrades >= 10) badges.push("10+ trades");
  if (stats.predictions.reputationScore >= 70 && totalBets >= 5) badges.push("Top predictor");
  if (totalTrades + totalBets >= 20) badges.push("Active member");

  return (
    <div className="p-6 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-12">
        {/* Identicon + name + address */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Identicon address={address} size={80} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] font-medium text-[var(--text-primary)] mb-1">
              {truncateAddress(address)}
            </h1>
            <div className="flex items-start gap-2">
              <p className="text-[14px] text-[var(--text-secondary)] font-mono break-all m-0">
                {address}
              </p>
              <button
                onClick={handleCopy}
                className="p-1 flex-shrink-0 hover:text-[var(--text-primary)] transition-colors mt-[-2px]"
                title="Copy address"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            {isYou && (
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] rounded border border-[var(--accent-primary)]/20 font-bold">
                You
              </span>
            )}
          </div>
        </div>
        
        {/* Balance card -- full width below header */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4">
          <div className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">
            Balance
          </div>
          <div className="text-[28px] font-medium text-[var(--text-primary)]">
            {formatGenBalance(stats.balance)}
          </div>
        </div>
      </div>

      {hasNoActivity ? (
        <div className="text-center py-16 border border-dashed border-[var(--border-subtle)] rounded-2xl">
          <p className="text-[var(--text-primary)] font-medium mb-2">No activity yet</p>
          <p className="text-[var(--text-secondary)] text-sm">
            {isYou
              ? "Make your first trade or place your first prediction."
              : "This address has not yet participated in PointMarket."}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Marketplace Stats Grid */}
          <div>
            <h2 className="text-[18px] font-medium text-[var(--text-primary)] mb-4">Marketplace</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Trades as seller" value={stats.marketplace.tradesAsSeller} />
              <StatCard label="Trades as buyer" value={stats.marketplace.tradesAsBuyer} />
              <StatCard label="Completed trades" value={stats.marketplace.completedTrades} />
              <StatCard label="Disputed trades" value={stats.marketplace.disputedTrades} />
            </div>
            <div className="mt-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4">
              <div className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-medium">
                Total Volume
              </div>
              <div className="text-[20px] font-mono text-[var(--text-primary)]">
                {formatGenBalance(stats.marketplace.totalVolume, 0)}
              </div>
            </div>
          </div>

          {/* Predictions Stats Grid */}
          <div>
            <h2 className="text-[18px] font-medium text-[var(--text-primary)] mb-4">Predictions</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Bets placed" value={stats.predictions.betsPlaced} />
              <StatCard label="Win rate" value={stats.predictions.winRateStr} />
              <StatCard label="Reputation score" value={stats.predictions.reputationScore} />
              <StatCard label="Markets created" value={stats.predictions.marketsCreated} />
            </div>
          </div>

          {/* Badges Section */}
          {badges.length > 0 && (
            <div>
              <h2 className="text-[18px] font-medium text-[var(--text-primary)] mb-4">Badges</h2>
              <div className="flex flex-wrap gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge}
                    className="bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] px-3 py-1.5 rounded-full text-sm font-medium border border-[var(--accent-primary)]/20"
                  >
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="text-[18px] font-medium text-[var(--text-primary)] mb-4">Recent Activity</h2>
            {stats.recentActivity.length > 0 ? (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.map((activity, i) => (
                      <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated-2)] transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            activity.type === "Trade" 
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}>
                            {activity.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{activity.id}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{activity.status}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)] text-right">
                          {/* Fallback formatting for now */}
                          {activity.timestamp.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-[var(--text-secondary)] text-sm">No recent activity found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 min-w-0">
      <div className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-medium truncate">
        {label}
      </div>
      <div className="text-[20px] font-mono text-[var(--text-primary)] truncate">
        {value}
      </div>
    </div>
  );
}
