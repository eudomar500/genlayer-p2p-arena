"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAcceptListing } from "@/lib/hooks/useAcceptListing";
import { useWalletStore } from "@/lib/wallet/store";
import { NETWORKS } from "@/config/networks";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { formatGenBalance } from "@/lib/wallet/format";

interface AcceptListingButtonProps {
  tradeId: number;
  seller: string;
  state: number;
  price: bigint;
  title: string;
}

export default function AcceptListingButton({
  tradeId,
  seller,
  state,
  price,
  title,
}: AcceptListingButtonProps) {
  const { address, status } = useWalletStore();
  const { acceptListing, pending } = useAcceptListing();
  const [open, setOpen] = useState(false);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const connected = status === "connected" && address;
  const isSeller = connected && address.toLowerCase() === seller.toLowerCase();
  const isOpen = state === 0;

  if (!connected || isSeller || !isOpen) {
    return null;
  }

  const explorerBase = NETWORKS[DEFAULT_NETWORK].explorerUrl;
  const explorerLink = explorerBase + "/tx/" + (submittedHash ?? "");

  const handleConfirm = async () => {
    setErrorMsg(null);
    try {
      const hash = await acceptListing(tradeId, price);
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
            Buy this listing?
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
              Payment submitted. Track its progress in the drawer at the bottom
              right, or open it on the explorer.
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
                You will pay
              </div>
              <div className="text-2xl font-medium text-[var(--text-primary)] font-mono">
                {formatGenBalance(price)}
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              The payment is escrowed by the contract until the seller marks
              the item shipped and you confirm delivery. If the seller never
              ships, you can reclaim the funds after the timeout. Bradbury
              finalizes payments in about thirty-five minutes.
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
                {pending ? "Submitting..." : "Confirm and pay"}
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
        className="w-full px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors"
      >
        Buy now ({formatGenBalance(price)})
      </button>
      {open && typeof window !== "undefined" ? createPortal(modalContent, document.body) : null}
    </div>
  );
}
