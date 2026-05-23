"use client";
import React from "react";
import { ExternalLink, XCircle } from "lucide-react";
import type { PendingTx, TxMethod } from "../../lib/tx/types";
import { DEFAULT_NETWORK } from "../../lib/genlayer/contracts";
import { NETWORKS } from "../../config/networks";
import TxProgressBar from "./TxProgressBar";

/**
 * Single row in the TxDrawer. Shows what the transaction does, where it
 * is in the GenLayer lifecycle, and a link to the explorer for the user
 * to inspect it directly. Failure cases render an error indicator
 * instead of the progress bar.
 *
 * Labels for method names are kept in this file because they are pure
 * presentation concerns; types.ts stays free of UI strings.
 */

const METHOD_LABELS: Record<TxMethod, string> = {
  create_listing: "Create listing",
  cancel_listing: "Cancel listing",
  accept_listing: "Accept listing",
  mark_shipped: "Mark shipped",
  confirm_delivery: "Confirm delivery",
  claim_after_window: "Claim after dispute window",
  claim_unshipped_refund: "Claim unshipped refund",
  open_dispute: "Open dispute",
  respond_to_dispute: "Respond to dispute",
  claim_dispute_default: "Claim dispute default",
  force_refund_stuck_dispute: "Force refund stuck dispute",
  claim_stuck_dispute_refund: "Claim stuck dispute refund",
  create_subjective_market: "Create subjective market",
  create_objective_market: "Create objective market",
  place_bet: "Place bet",
  resolve_market: "Resolve market",
  claim_winnings: "Claim winnings",
  refund_bet: "Refund bet",
  pause_marketplace: "Pause marketplace",
  unpause_marketplace: "Unpause marketplace",
  pause_prediction_market: "Pause prediction market",
  unpause_prediction_market: "Unpause prediction market",
  withdraw_fees: "Withdraw fees",
  withdraw_external_fees: "Withdraw external fees",
};

function formatElapsed(submittedAt: number): string {
  const elapsedMs = Date.now() - submittedAt;
  const seconds = Math.floor(elapsedMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

interface TxItemProps {
  tx: PendingTx;
}

export default function TxItem({ tx }: TxItemProps) {
  const explorer = NETWORKS[DEFAULT_NETWORK].explorerUrl;
  const explorerUrl = explorer ? `${explorer}/tx/${tx.txHash}` : null;
  const label = METHOD_LABELS[tx.method];

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div
            className="truncate font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </div>
          {tx.context && (
            <div
              className="truncate text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {tx.context}
            </div>
          )}
        </div>
        {explorerUrl && (
          <a
          
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--text-tertiary)" }}
            title={tx.txHash}
          >
            {truncateHash(tx.txHash)}
            <ExternalLink size={12} aria-hidden />
          </a>
        )}
      </div>

      {tx.uiState === "failed" ? (
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "#ef4444" }}
        >
          <XCircle size={14} aria-hidden />
          <span>Transaction failed ({tx.rawStatus})</span>
        </div>
      ) : (
        <TxProgressBar uiState={tx.uiState} />
      )}

      <div
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        <span>{formatElapsed(tx.submittedAt)}</span>
        <span style={{ color: "var(--text-tertiary)" }}>
          {tx.uiState === "accepted" && "Finalizing"}
          {tx.uiState === "submitted" && "Validating"}
          {tx.uiState === "finalized" && "Finalized"}
        </span>
      </div>
    </div>
  );
}
