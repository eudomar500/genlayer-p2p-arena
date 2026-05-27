"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { formatGenBalance } from "@/lib/wallet/format";
import { NETWORKS } from "@/config/networks";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";

const MIN_EVIDENCE_LENGTH = 1;
const MAX_EVIDENCE_LENGTH = 4000;

interface DisputeEvidenceDialogProps {
  mode: "open" | "respond";
  tradeId: number;
  title: string;
  price: bigint;
  bond: bigint;
  onClose: () => void;
  onSubmit: (evidence: string) => Promise<string>;
}

export default function DisputeEvidenceDialog({
  mode,
  tradeId,
  title,
  price,
  bond,
  onClose,
  onSubmit,
}: DisputeEvidenceDialogProps) {
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const evidenceLength = evidence.length;
  const evidenceValid =
    evidenceLength >= MIN_EVIDENCE_LENGTH &&
    evidenceLength <= MAX_EVIDENCE_LENGTH;

  const explorerBase = NETWORKS[DEFAULT_NETWORK].explorerUrl;
  const explorerLink = explorerBase + "/tx/" + (submittedHash ?? "");

  const headerText =
    mode === "open" ? `Open dispute on #${tradeId}?` : `Respond to dispute on #${tradeId}?`;

  const explainerText =
    mode === "open"
      ? "Opening a dispute escalates the trade to LLM arbitration. Submit a clear, factual statement of why the trade is not acceptable to you (damaged item, wrong product, never delivered, etc). The other party will have a response window to submit their own evidence, after which the LLM evaluates both sides and decides who keeps the funds. The bond is returned if you win, forfeited if you lose."
      : "Submit your counter-evidence. Once you confirm, the LLM immediately evaluates both sides and releases funds and bonds accordingly. Be factual and specific. The bond is returned if the LLM finds in your favor, forfeited if not.";

  const placeholderText =
    mode === "open"
      ? "Example: Item arrived broken in two pieces. The seller listed it as 'mint condition' but the photos I took on arrival (link below) clearly show damage. I notified the seller within 2 hours of receiving the package and they have not responded. Tracking confirms the package was handled normally with no impact damage in transit."
      : "Example: Item was shipped in original packaging with documented inspection photos taken before handoff to the carrier (link below). The damage claimed by the buyer is not consistent with the packaging condition on arrival shown in tracking. I am willing to refund partially if there is a legitimate carrier-caused issue but the evidence does not support full refund.";

  const submitLabel = mode === "open" ? "Open dispute" : "Submit response";

  const handleSubmit = async () => {
    if (!evidenceValid) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const hash = await onSubmit(evidence);
      setSubmittedHash(hash);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const dialogContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-medium text-[var(--text-primary)]">
            {headerText}
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {submittedHash ? (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {mode === "open"
                ? "Dispute submitted. Track its progress in the drawer at the bottom right. Once finalized, the other party has the response window to submit their evidence."
                : "Response submitted. The LLM will now evaluate both sides. Verdict and reasoning will appear on this page once the resolution transaction finalizes."}
            </p>
            <div className="mb-6 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-secondary)] break-all">
              {submittedHash}
            </div>
            <div className="flex gap-3">
                <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)] transition-colors text-center"
              >
                Open in explorer
              </a>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Trade #{tradeId}
              </div>
              <div className="text-base text-[var(--text-primary)] mb-3 break-words">
                {title}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Trade price
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)] font-mono">
                    {formatGenBalance(price)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Required bond (5%)
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)] font-mono">
                    {formatGenBalance(bond)}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {explainerText}
            </p>

            <div className="mb-4">
              <label className="text-xs uppercase tracking-wider text-[var(--text-secondary)] block mb-2">
                Your evidence
              </label>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                disabled={submitting}
                placeholder={placeholderText}
                rows={8}
                maxLength={MAX_EVIDENCE_LENGTH}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-y font-sans disabled:opacity-50"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-[var(--text-secondary)]">
                  {evidenceLength === 0
                    ? `Required: ${MIN_EVIDENCE_LENGTH}-${MAX_EVIDENCE_LENGTH} chars`
                    : `${evidenceLength} / ${MAX_EVIDENCE_LENGTH} chars`}
                </span>
                {evidenceLength > 0 && !evidenceValid ? (
                  <span className="text-xs text-red-400">Too long</span>
                ) : null}
              </div>
            </div>

            {errorMsg ? (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {errorMsg}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !evidenceValid}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : submitLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(dialogContent, document.body);
}
