"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useCancelListing } from "@/lib/hooks/useCancelListing";
import { useWalletStore } from "@/lib/wallet/store";
import { NETWORKS } from "@/config/networks";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";

interface CancelListingButtonProps {
  tradeId: number;
  seller: string;
  state: number;
}

export default function CancelListingButton({ tradeId, seller, state }: CancelListingButtonProps) {
  const { address, status } = useWalletStore();
  const { cancelListing, pending } = useCancelListing();
  const [open, setOpen] = useState(false);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const connected = status === "connected" && address;
  const isSeller = connected && address.toLowerCase() === seller.toLowerCase();
  const isOpen = state === 0; // STATE_LISTING_OPEN

  if (!isSeller || !isOpen) {
    return null;
  }

  const explorerBase = NETWORKS[DEFAULT_NETWORK].explorerUrl;
  const explorerLink = explorerBase + "/tx/" + (submittedHash ?? "");

  const handleConfirm = async () => {
    setErrorMsg(null);
    try {
      const hash = await cancelListing(tradeId);
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
            Cancel listing #{tradeId}?
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
              Transaction submitted. Track its progress in the drawer at the
              bottom right, or open it on the explorer.
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
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              This will remove the listing from the marketplace. The action is
              on-chain and takes about twenty-five minutes to finalize on Bradbury.
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
                Keep listing
              </button>
              <button
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {pending ? "Submitting..." : "Cancel listing"}
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
        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated-2)] transition-colors"
      >
        Cancel listing
      </button>
      {open && typeof window !== "undefined" ? createPortal(modalContent, document.body) : null}
    </div>
  );
}
