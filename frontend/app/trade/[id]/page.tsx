"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTrade } from "@/lib/hooks/useTrade";
import { formatGenBalance } from "@/lib/wallet/format";
import StateBadge from "@/components/marketplace/StateBadge";
import TradeTimeline from "@/components/marketplace/TradeTimeline";
import TradeActionsPanel from "@/components/marketplace/TradeActionsPanel";
import TradePartiesCard from "@/components/marketplace/TradePartiesCard";
import DisputePanel from "@/components/marketplace/DisputePanel";

export default function TradeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const tradeId = typeof id === "string" ? Number(id) : NaN;
  
  if (isNaN(tradeId) || tradeId < 0) {
    return <NotFoundView />;
  }
  
  return <TradeDetailContent tradeId={tradeId} />;
}

function TradeDetailContent({ tradeId }: { tradeId: number }) {
  const { data: trade, isLoading, error } = useTrade(tradeId);
  
  if (isLoading) {
    return (
      <main className="pt-24 pb-16 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-[var(--bg-elevated)] rounded" />
          <div className="h-10 w-2/3 bg-[var(--bg-elevated)] rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-64 bg-[var(--bg-elevated)] rounded-xl" />
            <div className="h-64 bg-[var(--bg-elevated)] rounded-xl" />
          </div>
        </div>
      </main>
    );
  }
  
  if (error || !trade) {
    return <NotFoundView />;
  }
  
  return (
    <main className="pt-24 pb-16 px-6 md:px-12 max-w-6xl mx-auto">
      <Link 
        href="/marketplace" 
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to marketplace
      </Link>
      
      <header className="mb-10">
        <div className="text-sm font-mono text-[var(--text-secondary)] mb-2">
          Trade #{trade.id}
        </div>
        <h1 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] break-words">
          {trade.title}
        </h1>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: description + parties */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Description
            </div>
            <p className="text-[var(--text-primary)] whitespace-pre-wrap">
              {trade.description}
            </p>
          </div>
          
          <TradePartiesCard seller={trade.seller} buyer={trade.buyer} />
          
          <DisputePanel trade={trade} />
        </div>
        
        {/* Right column: status + timeline */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Status
            </div>
            <div className="mb-4">
              <StateBadge state={trade.state} size="md" />
            </div>
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2 mt-6">
              Price
            </div>
            <div className="text-2xl font-medium text-[var(--text-primary)] font-mono">
              {formatGenBalance(trade.price)}
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Timeline
            </div>
            <TradeTimeline trade={trade} />
          </div>

          <TradeActionsPanel trade={trade} />
        </div>
      </div>
    </main>
  );
}

function NotFoundView() {
  return (
    <main className="pt-24 pb-16 px-6 md:px-12 max-w-6xl mx-auto text-center">
      <h1 className="text-3xl font-medium text-[var(--text-primary)] mb-3">
        Trade not found
      </h1>
      <p className="text-[var(--text-secondary)] mb-8">
        This trade ID does not exist or has not been deployed.
      </p>
      <Link 
        href="/marketplace"
        className="inline-block px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors"
      >
        Browse marketplace
      </Link>
    </main>
  );
}
