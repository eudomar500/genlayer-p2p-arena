"use client";

import { useState, useMemo } from "react";
import { useAllTrades } from "@/lib/hooks/useAllTrades";
import { useMarketplaceMetrics } from "@/lib/hooks/useMarketplaceMetrics";
import { formatGenBalance } from "@/lib/wallet/format";
import TradeTable from "@/components/marketplace/TradeTable";
import TradeFilters from "@/components/marketplace/TradeFilters";

const PAGE_SIZE = 25;

export default function MarketplacePage() {
  const { data: trades = [], isLoading } = useAllTrades();
  const { data: metrics } = useMarketplaceMetrics();
  
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  
  const filtered = useMemo(() => {
    return trades.filter((trade) => {
      if (stateFilter !== null && trade.state !== stateFilter) return false;
      if (search && !trade.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [trades, search, stateFilter]);
  
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  
  return (
    <main className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-3">
          Marketplace
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Trustless P2P trades on GenLayer Studionet. All trades settle on-chain with optional LLM-arbitrated disputes.
        </p>
      </header>
      
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="Total trades" value={metrics?.totalTradesCreated?.toString() ?? "--"} />
        <StatCard label="Completed" value={metrics?.completedCount?.toString() ?? "--"} />
        <StatCard label="Disputed" value={metrics?.disputedCount?.toString() ?? "--"} />
        <StatCard label="Total volume" value={metrics?.totalVolume !== undefined ? `${formatGenBalance(metrics.totalVolume)}` : "--"} />
      </div>
      
      <TradeFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        stateFilter={stateFilter}
        onStateFilterChange={(v) => { setStateFilter(v); setPage(0); }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        resultsCount={filtered.length}
      />
      
      <TradeTable trades={paginated} isLoading={isLoading} />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
      <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
        {label}
      </div>
      <div className="text-2xl font-medium text-[var(--text-primary)] font-mono">
        {value}
      </div>
    </div>
  );
}
