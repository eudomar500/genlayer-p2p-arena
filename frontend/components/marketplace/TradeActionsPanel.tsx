"use client";
import { useMemo } from "react";
import { useWalletStore } from "@/lib/wallet/store";
import { useTxStore } from "@/lib/tx/store";
import CancelListingButton from "./CancelListingButton";
import AcceptListingButton from "./AcceptListingButton";
import MarkShippedDialog from "./MarkShippedDialog";
import ConfirmDeliveryButton from "./ConfirmDeliveryButton";
import ClaimAfterWindowButton from "./ClaimAfterWindowButton";
import ClaimUnshippedRefundButton from "./ClaimUnshippedRefundButton";
import OpenDisputeButton from "./OpenDisputeButton";
import RespondToDisputeButton from "./RespondToDisputeButton";
import ClaimDisputeDefaultButton from "./ClaimDisputeDefaultButton";
import ForceRefundStuckDisputeButton from "./ForceRefundStuckDisputeButton";
import ClaimStuckDisputeRefundButton from "./ClaimStuckDisputeRefundButton";
import type { TradeDetail } from "@/lib/hooks/useTrade";

interface TradeActionsPanelProps {
  trade: TradeDetail;
}

/**
 * Aggregates write actions available on a trade for the connected
 * wallet. Each child button still decides whether to render itself,
 * but this wrapper checks the same conditions upfront so the panel
 * collapses to null when no action is applicable.
 *
 * The panel also subscribes to the TX store for any in-flight write
 * targeting this trade. While such a TX exists (submitted or accepted
 * but not yet finalized), every action button is rendered in a busy
 * state. The on-chain state has not changed yet during the Finality
 * Window, so without this guard a user could double-submit the same
 * action and burn gas on a transaction that will revert.
 */
export default function TradeActionsPanel({ trade }: TradeActionsPanelProps) {
  const { address, status } = useWalletStore();
  const context = `Trade #${trade.id}`;
  const allTxs = useTxStore((s) => s.txs);
  const { hasActiveTx, activeMethod } = useMemo(() => {
    const active = allTxs.filter(
      (t) =>
        t.context === context &&
        t.uiState !== "finalized" &&
        t.uiState !== "failed",
    );
    return {
      hasActiveTx: active.length > 0,
      activeMethod: active.length > 0 ? active[0].method : null,
    };
  }, [allTxs, context]);

  const connected = status === "connected" && address;
  if (!connected) return null;

  const isSeller = address.toLowerCase() === trade.seller.toLowerCase();
  const isBuyer = address.toLowerCase() === trade.buyer.toLowerCase();
  const isOpen = trade.state === 0;
  const isPaid = trade.state === 1;
  const isShipped = trade.state === 2;

  const isDisputed = trade.state === 3;

  const canCancel = isSeller && isOpen;
  const canAccept = !isSeller && isOpen;
  const canShip = isSeller && isPaid;
  const canConfirm = isBuyer && isShipped;
  const canClaimAfterWindow = isSeller && isShipped;
  const canClaimUnshippedRefund = isBuyer && isPaid;
  const canOpenDispute = (isBuyer || isSeller) && isShipped;
  const canRespondOrClaimDispute = (isBuyer || isSeller) && isDisputed;
  const canPublicRefund = isDisputed;

  const hasAnyAction =
    canCancel ||
    canAccept ||
    canShip ||
    canConfirm ||
    canClaimAfterWindow ||
    canClaimUnshippedRefund ||
    canOpenDispute ||
    canRespondOrClaimDispute ||
    canPublicRefund;
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
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <MarkShippedDialog
          tradeId={trade.id}
          seller={trade.seller}
          state={trade.state}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <ConfirmDeliveryButton
          tradeId={trade.id}
          buyer={trade.buyer}
          state={trade.state}
          price={trade.price}
          title={trade.title}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <ClaimAfterWindowButton
          tradeId={trade.id}
          seller={trade.seller}
          state={trade.state}
          shippedAt={trade.shipped_at}
          price={trade.price}
          title={trade.title}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <ClaimUnshippedRefundButton
          tradeId={trade.id}
          buyer={trade.buyer}
          state={trade.state}
          paidAt={trade.paid_at}
          price={trade.price}
          title={trade.title}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <OpenDisputeButton
          tradeId={trade.id}
          buyer={trade.buyer}
          seller={trade.seller}
          state={trade.state}
          shippedAt={trade.shipped_at}
          price={trade.price}
          title={trade.title}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <RespondToDisputeButton
          tradeId={trade.id}
          buyer={trade.buyer}
          seller={trade.seller}
          state={trade.state}
          disputeInitiator={trade.dispute_initiator}
          price={trade.price}
          title={trade.title}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <ClaimDisputeDefaultButton
          tradeId={trade.id}
          buyer={trade.buyer}
          state={trade.state}
          disputeInitiator={trade.dispute_initiator}
          disputedAt={trade.disputed_at}
          price={trade.price}
          title={trade.title}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <ForceRefundStuckDisputeButton
          tradeId={trade.id}
          state={trade.state}
          disputedAt={trade.disputed_at}
          price={trade.price}
          title={trade.title}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <ClaimStuckDisputeRefundButton
          tradeId={trade.id}
          state={trade.state}
          disputedAt={trade.disputed_at}
          price={trade.price}
          title={trade.title}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
        <CancelListingButton
          tradeId={trade.id}
          seller={trade.seller}
          state={trade.state}
          disabled={hasActiveTx}
          activeMethod={activeMethod}
        />
      </div>
    </div>
  );
}
