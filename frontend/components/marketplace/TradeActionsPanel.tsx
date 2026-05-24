"use client";

import { useWalletStore } from "@/lib/wallet/store";
import CancelListingButton from "./CancelListingButton";
import type { TradeDetail } from "@/lib/hooks/useTrade";

interface TradeActionsPanelProps {
  trade: TradeDetail;
}

/**
 * Aggregates write actions available on a trade for the connected
 * wallet. Each child button still decides whether to render itself, but
 * this wrapper checks the same conditions upfront so the panel
 * collapses to null when no action is applicable. Future actions
 * (accept_listing, mark_shipped, etc.) get listed in hasAnyAction.
 */
export default function TradeActionsPanel({ trade }: TradeActionsPanelProps) {
  const { address, status } = useWalletStore();
  const connected = status === "connected" && address;

  if (!connected) return null;

  const isSeller = address.toLowerCase() === trade.seller.toLowerCase();
  const isOpen = trade.state === 0; // STATE_LISTING_OPEN

  // Add a clause here whenever a new action becomes possible.
  const canCancel = isSeller && isOpen;
  const hasAnyAction = canCancel;

  if (!hasAnyAction) return null;

  return (
    <div className="p-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
      <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-4">
        Actions
      </div>
      <div className="flex flex-col gap-3">
        <CancelListingButton
          tradeId={trade.id}
          seller={trade.seller}
          state={trade.state}
        />
      </div>
    </div>
  );
}
