"use client";

import { Scale, FileText, CheckCircle2 } from "lucide-react";
import type { TradeDetail } from "@/lib/hooks/useTrade";
import { formatGenBalance, truncateAddress } from "@/lib/wallet/format";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface DisputePanelProps {
  trade: TradeDetail;
}

/**
 * Surface for everything related to a dispute on a trade. Renders only
 * when the trade has been disputed at some point, regardless of the
 * current state (could be DISPUTED, COMPLETED, or REFUNDED post-resolution).
 *
 * Three sections rendered conditionally based on the dispute lifecycle:
 *   - Header with initiator and bond information.
 *   - Side-by-side evidence panels for buyer and seller.
 *   - LLM verdict and reasoning once the dispute has been resolved.
 */
export default function DisputePanel({ trade }: DisputePanelProps) {
  const initiatorSet =
    trade.dispute_initiator &&
    trade.dispute_initiator.toLowerCase() !== ZERO_ADDRESS;

  if (!trade.disputed && trade.state !== 3 && !initiatorSet) {
    return null;
  }

  const initiatorIsBuyer =
    initiatorSet &&
    trade.dispute_initiator.toLowerCase() === trade.buyer.toLowerCase();
  const initiatorLabel = initiatorIsBuyer ? "Buyer" : "Seller";

  const hasVerdict =
    trade.llm_verdict_reasoning && trade.llm_verdict_reasoning.length > 0;
  const winnerLabel = trade.llm_verdict_buyer_wins ? "Buyer" : "Seller";
  const winnerColor = trade.llm_verdict_buyer_wins
    ? "text-[var(--accent-primary)]"
    : "text-[var(--text-primary)]";
  const resolvedByDefault = Boolean(trade.resolved_by_default);

  return (
    <div className="p-6 rounded-xl bg-[var(--warning)]/5 border border-[var(--warning)]/20 space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
          <Scale size={18} className="text-[var(--warning)]" />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-[var(--warning)] mb-1">
            Dispute
          </div>
          <div className="text-sm text-[var(--text-primary)]">
            Initiated by <strong>{initiatorLabel}</strong> ({truncateAddress(trade.dispute_initiator)})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Buyer bond
          </div>
          <div className="text-sm font-medium text-[var(--text-primary)] font-mono">
            {trade.buyer_bond > 0n ? formatGenBalance(trade.buyer_bond) : "Not posted"}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Seller bond
          </div>
          <div className="text-sm font-medium text-[var(--text-primary)] font-mono">
            {trade.seller_bond > 0n ? formatGenBalance(trade.seller_bond) : "Not posted"}
          </div>
        </div>
      </div>

      {(trade.buyer_evidence || trade.seller_evidence) ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[var(--text-secondary)]" />
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Evidence
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Buyer evidence
              </div>
              {trade.buyer_evidence ? (
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">
                  {trade.buyer_evidence}
                </p>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)] italic">
                  No evidence submitted yet
                </p>
              )}
            </div>
            <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Seller evidence
              </div>
              {trade.seller_evidence ? (
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">
                  {trade.seller_evidence}
                </p>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)] italic">
                  No evidence submitted yet
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {hasVerdict ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[var(--text-secondary)]" />
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Verdict
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="text-sm text-[var(--text-primary)] mb-3">
              Winner: <strong className={winnerColor}>{winnerLabel}</strong>
              {resolvedByDefault ? (
                <span className="ml-2 text-xs text-[var(--text-secondary)]">
                  (resolved by default judgment)
                </span>
              ) : null}
            </div>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap break-words">
              {trade.llm_verdict_reasoning}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
