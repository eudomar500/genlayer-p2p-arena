"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useClaimDisputeDefault } from "@/lib/hooks/useClaimDisputeDefault";
import { useCountdown, formatRemaining } from "@/lib/hooks/useCountdown";
import { useWalletStore } from "@/lib/wallet/store";
import { NETWORKS } from "@/config/networks";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { getMarketplaceTimings } from "@/lib/genlayer/timings";
import { formatGenBalance } from "@/lib/wallet/format";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface ClaimDisputeDefaultButtonProps {
  tradeId: number;
  buyer: string;
  state: number;
  disputeInitiator: string;
  disputedAt: number;
  price: bigint;
  title: string;
  disabled?: boolean;
  activeMethod?: string | null;
}

export default function ClaimDisputeDefaultButton({
  tradeId,
  buyer,
  state,
  disputeInitiator,
  disputedAt,
  price,
  title,
  disabled,
  activeMethod,
}: ClaimDisputeDefaultButtonProps) {
  const { address, status } = useWalletStore();
  const { claimDisputeDefault, pending } = useClaimDisputeDefault();
  const [open, setOpen] = useState(false);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timings = getMarketplaceTimings(DEFAULT_NETWORK);
  const unlockAt = disputedAt + timings.disputeResponseWindowSeconds;
  const { remainingSeconds, isReady } = useCountdown(unlockAt);

  const connected = status === "connected" && address;
  const initiatorSet =
    disputeInitiator && disputeInitiator.toLowerCase() !== ZERO_ADDRESS;
  const isInitiator =
    connected &&
    initiatorSet &&
    address.toLowerCase() === disputeInitiator.toLowerCase();
  const isDisputed = state === 3;
  const initiatorIsBuyer =
    initiatorSet &&
    disputeInitiator.toLowerCase() === buyer.toLowerCase();

  if (!isInitiator || !isDisputed) {
    return null;
  }

  const explorerBase = NETWORKS[DEFAULT_NETWORK].explorerUrl;
  const explorerLink = explorerBase + "/tx/" + (submittedHash ?? "");

  const handleConfirm = async () => {
    setErrorMsg(null);
    try {
      const hash = await claimDisputeDefault(tradeId);
      setSubmittedHash(hash);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
    }
  };

  const handleClose = () => {
    if (pending) return;
    setOpen(false);
    setSubmittedHash(null);
    setErrorMsg(null);
  };

  const buttonLabel = (() => {
    if (disabled && activeMethod) {
      return `Processing ${activeMethod.replace(/_/g, " ")}...`;
    }
    if (!isReady) {
      return `Win by default in ${formatRemaining(remainingSeconds)}`;
    }
    return "Win by default";
  })();

  const outcomeText = initiatorIsBuyer
    ? "The trade will be refunded to you. Your bond is returned. The seller's bond is reduced by a penalty before going to fees."
    : "The trade funds will be released to you. Your bond is returned. The buyer's bond is reduced by a penalty before going to fees.";

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-medium text-[var(--text-primary)]">
            Win dispute by default for #{tradeId}?
          </h2>
          <button
            onClick={handleClose}
            disabled={pending}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {submittedHash ? (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Default judgment submitted. Track its progress in the drawer at the bottom right. Funds and your bond release to your wallet once the transaction finalizes.
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
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Trade price
              </div>
              <div className="text-2xl font-medium text-[var(--text-primary)] font-mono">
                {formatGenBalance(price)}
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              The other party did not respond within the response window. You opened this dispute and are entitled to win by default. {outcomeText}
            </p>

            {errorMsg ? (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {errorMsg}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={pending}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50"
              >
                {pending ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled || !isReady}
        className="w-full px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
      {open && typeof window !== "undefined" ? createPortal(modalContent, document.body) : null}
    </div>
  );
}
