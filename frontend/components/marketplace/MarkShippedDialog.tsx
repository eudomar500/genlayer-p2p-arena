"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useMarkShipped } from "@/lib/hooks/useMarkShipped";
import { useWalletStore } from "@/lib/wallet/store";
import { NETWORKS } from "@/config/networks";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";

interface MarkShippedDialogProps {
  tradeId: number;
  seller: string;
  state: number;
  disabled?: boolean;
  activeMethod?: string | null;
}

const MIN_TRACKING = 4;
const MAX_TRACKING = 100;
const MIN_CARRIER = 1;
const MAX_CARRIER = 50;

export default function MarkShippedDialog({ tradeId, seller, state, disabled, activeMethod }: MarkShippedDialogProps) {
  const { address, status } = useWalletStore();
  const { markShipped, pending } = useMarkShipped();
  const [open, setOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const connected = status === "connected" && address;
  const isSeller = connected && address.toLowerCase() === seller.toLowerCase();
  const isPaid = state === 1;

  if (!isSeller || !isPaid) {
    return null;
  }

  const explorerBase = NETWORKS[DEFAULT_NETWORK].explorerUrl;
  const explorerLink = explorerBase + "/tx/" + (submittedHash ?? "");

  const tn = trackingNumber.trim();
  const tc = trackingCarrier.trim();
  const tnValid = tn.length >= MIN_TRACKING && tn.length <= MAX_TRACKING;
  const tcValid = tc.length >= MIN_CARRIER && tc.length <= MAX_CARRIER;
  const formValid = tnValid && tcValid;

  const handleSubmit = async () => {
    if (!formValid) return;
    setErrorMsg(null);
    try {
      const hash = await markShipped(tradeId, tn, tc);
      setSubmittedHash(hash);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
    }
  };

  const handleClose = () => {
    if (pending) return;
    setOpen(false);
    setTrackingNumber("");
    setTrackingCarrier("");
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
            Mark trade #{tradeId} as shipped
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
              Shipping recorded on chain. Track its progress in the drawer at
              the bottom right, or open it on the explorer.
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
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Record the tracking information on chain. The buyer can use it to
              follow the package and to challenge the shipment later if it
              never arrives.
            </p>

            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Carrier
              </label>
              <input
                type="text"
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                disabled={pending}
                maxLength={MAX_CARRIER}
                placeholder="USPS, DHL, FedEx, MRW..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-50"
              />
              <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                {tc.length} / {MAX_CARRIER}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Tracking number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={pending}
                maxLength={MAX_TRACKING}
                placeholder="1Z999AA10123456784"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-50 font-mono"
              />
              <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                {tn.length} / {MAX_TRACKING} (minimum {MIN_TRACKING})
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
                disabled={pending}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={pending || !formValid}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50"
              >
                {pending ? "Submitting..." : "Confirm shipment"}
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
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled && activeMethod ? `Processing ${activeMethod.replace(/_/g, " ")}...` : "Mark as shipped"}
      </button>
      {open && typeof window !== "undefined" ? createPortal(modalContent, document.body) : null}
    </div>
  );
}
