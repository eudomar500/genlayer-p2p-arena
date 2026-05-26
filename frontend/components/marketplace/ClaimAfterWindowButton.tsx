"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useClaimAfterWindow } from "@/lib/hooks/useClaimAfterWindow";
import { useCountdown, formatRemaining } from "@/lib/hooks/useCountdown";
import { useWalletStore } from "@/lib/wallet/store";
import { NETWORKS } from "@/config/networks";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { getMarketplaceTimings } from "@/lib/genlayer/timings";
import { formatGenBalance } from "@/lib/wallet/format";

interface ClaimAfterWindowButtonProps {
  tradeId: number;
  seller: string;
  state: number;
  shippedAt: number;
  price: bigint;
  title: string;
  disabled?: boolean;
  activeMethod?: string | null;
}

export default function ClaimAfterWindowButton({
  tradeId,
  seller,
  state,
  shippedAt,
  price,
  title,
  disabled,
  activeMethod,
}: ClaimAfterWindowButtonProps) {
  const { address, status } = useWalletStore();
  const { claimAfterWindow, pending } = useClaimAfterWindow();
  const [open, setOpen] = useState(false);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timings = getMarketplaceTimings(DEFAULT_NETWORK);
  const unlockAt = shippedAt + timings.disputeWindowSeconds;
  const { remainingSeconds, isReady } = useCountdown(unlockAt);

  const connected = status === "connected" && address;
  const isSeller = connected && address.toLowerCase() === seller.toLowerCase();
  const isShipped = state === 2;

  if (!isSeller || !isShipped) {
    return null;
  }

  const explorerBase = NETWORKS[DEFAULT_NETWORK].explorerUrl;
  const explorerLink = explorerBase + "/tx/" + (submittedHash ?? "");

  const handleConfirm = async () => {
    setErrorMsg(null);
    try {
      const hash = await claimAfterWindow(tradeId);
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
      return `Available in ${formatRemaining(remainingSeconds)}`;
    }
    return "Claim funds";
  })();

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
            Claim funds for #{tradeId}?
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
              Claim submitted. Track its progress in the drawer at the bottom
              right, or open it on the explorer. Funds release to your wallet
              once the transaction finalizes.
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
                Releasing to you
              </div>
              <div className="text-2xl font-medium text-[var(--text-primary)] font-mono">
                {formatGenBalance(price)}
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              The dispute window has elapsed without the buyer raising a
              dispute. Claiming releases the escrow to your wallet and closes
              the trade as completed. The protocol fee is withheld.
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
                {pending ? "Submitting..." : "Claim funds"}
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
