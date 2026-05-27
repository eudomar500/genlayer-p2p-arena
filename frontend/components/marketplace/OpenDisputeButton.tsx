"use client";

import { useState } from "react";
import { useOpenDispute } from "@/lib/hooks/useOpenDispute";
import { useWalletStore } from "@/lib/wallet/store";
import { useCountdown, formatRemaining } from "@/lib/hooks/useCountdown";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { getMarketplaceTimings } from "@/lib/genlayer/timings";
import DisputeEvidenceDialog from "./DisputeEvidenceDialog";

const DISPUTE_BOND_BPS = 500n;
const BPS_DENOMINATOR = 10000n;

interface OpenDisputeButtonProps {
  tradeId: number;
  buyer: string;
  seller: string;
  state: number;
  shippedAt: number;
  price: bigint;
  title: string;
  disabled?: boolean;
  activeMethod?: string | null;
}

export default function OpenDisputeButton({
  tradeId,
  buyer,
  seller,
  state,
  shippedAt,
  price,
  title,
  disabled,
  activeMethod,
}: OpenDisputeButtonProps) {
  const { address, status } = useWalletStore();
  const { openDispute } = useOpenDispute();
  const [open, setOpen] = useState(false);

  const timings = getMarketplaceTimings(DEFAULT_NETWORK);
  const closeAt = shippedAt + timings.disputeWindowSeconds;
  const { remainingSeconds, isReady: windowClosed } = useCountdown(closeAt);
  const windowOpen = !windowClosed;

  const connected = status === "connected" && address;
  const isBuyer = connected && address.toLowerCase() === buyer.toLowerCase();
  const isSeller = connected && address.toLowerCase() === seller.toLowerCase();
  const isParty = isBuyer || isSeller;
  const isShipped = state === 2;

  if (!isParty || !isShipped || !windowOpen) {
    return null;
  }

  const bond = (price * DISPUTE_BOND_BPS) / BPS_DENOMINATOR;

  const buttonLabel = (() => {
    if (disabled && activeMethod) {
      return `Processing ${activeMethod.replace(/_/g, " ")}...`;
    }
    return `Open dispute (${formatRemaining(remainingSeconds)} left)`;
  })();

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
      {open ? (
        <DisputeEvidenceDialog
          mode="open"
          tradeId={tradeId}
          title={title}
          price={price}
          bond={bond}
          onClose={() => setOpen(false)}
          onSubmit={(evidence) => openDispute(tradeId, evidence, bond)}
        />
      ) : null}
    </div>
  );
}
