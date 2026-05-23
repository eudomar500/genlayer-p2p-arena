"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTxStore } from "../../lib/tx/store";
import type { TxMethod, TxUiState } from "../../lib/tx/types";
import { runCleanup } from "../../lib/tx/cleanup";
import { startTxPoller } from "../../lib/tx/poller";
import TxDrawer from "./TxDrawer";

/**
 * Client-side runtime for the transaction tracking system.
 *
 * Mounts once at the root of the layout. Responsibilities:
 *
 * 1. Runs the one-shot cleanup pass at app load (TTL eviction and
 *    reconciliation of TXs that finalized while the tab was closed).
 *
 * 2. Starts the global polling loop. The loop survives navigation
 *    because the layout component does not remount across pages.
 *
 * 3. Renders the floating TxDrawer.
 *
 * 4. Watches the store for transitions into `finalized` or `failed`
 *    and surfaces them through the existing sonner Toaster. Using
 *    sonner keeps a single toast system for the whole app instead of
 *    introducing a parallel one.
 */

const METHOD_PAST_LABELS: Record<TxMethod, string> = {
  create_listing: "Listing created",
  cancel_listing: "Listing cancelled",
  accept_listing: "Listing accepted",
  mark_shipped: "Marked as shipped",
  confirm_delivery: "Delivery confirmed",
  claim_after_window: "Claimed after window",
  claim_unshipped_refund: "Unshipped refund claimed",
  open_dispute: "Dispute opened",
  respond_to_dispute: "Dispute response submitted",
  claim_dispute_default: "Dispute default claimed",
  force_refund_stuck_dispute: "Stuck dispute force-refunded",
  claim_stuck_dispute_refund: "Stuck dispute refund claimed",
  create_subjective_market: "Subjective market created",
  create_objective_market: "Objective market created",
  place_bet: "Bet placed",
  resolve_market: "Market resolved",
  claim_winnings: "Winnings claimed",
  refund_bet: "Bet refunded",
  pause_marketplace: "Marketplace paused",
  unpause_marketplace: "Marketplace unpaused",
  pause_prediction_market: "Prediction market paused",
  unpause_prediction_market: "Prediction market unpaused",
  withdraw_fees: "Fees withdrawn",
  withdraw_external_fees: "External fees withdrawn",
};

export default function TxRuntime() {
  const txs = useTxStore((s) => s.txs);
  const previousStatesRef = useRef<Map<string, TxUiState>>(new Map());
  const didInitRef = useRef(false);

  // One-shot init: cleanup then start poller. Strict-mode safe via the
  // didInitRef guard so we do not double-start the interval in dev.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    void runCleanup().finally(() => {
      startTxPoller();
    });
  }, []);

  // Toast emission on transition to terminal states. We compare each
  // tx's current ui state against the snapshot from the previous
  // render, kept in a ref-map so it survives across renders without
  // triggering re-renders itself.
  useEffect(() => {
    const prev = previousStatesRef.current;
    for (const tx of txs) {
      const last = prev.get(tx.txHash);
      const isTerminal = tx.uiState === "finalized" || tx.uiState === "failed";
      const wasTerminal = last === "finalized" || last === "failed";
      if (isTerminal && !wasTerminal && last !== undefined) {
        const label = METHOD_PAST_LABELS[tx.method];
        const description = tx.context ?? undefined;
        if (tx.uiState === "finalized") {
          toast.success(label, { description });
        } else {
          toast.error(`${label} (failed)`, { description });
        }
      }
      prev.set(tx.txHash, tx.uiState);
    }
    // Drop entries for TXs no longer tracked (cleared by user or TTL).
    const liveHashes = new Set(txs.map((t) => t.txHash));
    for (const hash of Array.from(prev.keys())) {
      if (!liveHashes.has(hash)) prev.delete(hash);
    }
  }, [txs]);

  return <TxDrawer />;
}
