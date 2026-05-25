"use client";
import { useWalletStore } from "@/lib/wallet/store";
import CancelListingButton from "./CancelListingButton";
import AcceptListingButton from "./AcceptListingButton";
import type { TradeDetail } from "@/lib/hooks/useTrade";

interface TradeActionsPanelProps {
  trade: TradeDetail;
}

/**
 * Aggregates write actions available on a trade for the connected
 * wallet. Each child button still decides whether to render itself,
 * but this wrapper checks the same conditions upfront so the panel
 * collapses to null when no action is applicable. Future actions
 * (mark_shipped, confirm_delivery, etc.) get added by extending
 * hasAnyAction with another canX flag.
 */
export default function TradeActionsPanel({ trade }: TradeActionsPanelProps) {
  const { address, status } = useWalletStore();
  const connected = status === "connected" && address;
  if (!connected) return null;

  const isSeller = address.toLowerCase() === trade.seller.toLowerCase();
  const isOpen = trade.state === 0;

  const canCancel = isSeller && isOpen;
  const canAccept = !isSeller && isOpen;

  const hasAnyAction = canCancel || canAccept;
  if (!hasAnyAction) return null;

  return (
    <div className="p-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
      <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-4">
        Actions
      </div>
      <div className="flex flex-col gap-3">
        <AcceptListingButton
          tradeId={trade.id}
          seller={trade.seller}
          state={trade.state}
          price={trade.price}
          title={trade.title}
        />
        <CancelListingButton
          tradeId={trade.id}
          seller={trade.seller}
          state={trade.state}
        />
      </div>
    </div>
  );
}
