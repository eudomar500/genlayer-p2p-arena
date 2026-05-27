"use client";

import { useState } from "react";
import { useRespondToDispute } from "@/lib/hooks/useRespondToDispute";
import { useWalletStore } from "@/lib/wallet/store";
import DisputeEvidenceDialog from "./DisputeEvidenceDialog";

const DISPUTE_BOND_BPS = 500n;
const BPS_DENOMINATOR = 10000n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface RespondToDisputeButtonProps {
  tradeId: number;
  buyer: string;
  seller: string;
  state: number;
  disputeInitiator: string;
  price: bigint;
  title: string;
  disabled?: boolean;
  activeMethod?: string | null;
}

export default function RespondToDisputeButton({
  tradeId,
  buyer,
  seller,
  state,
  disputeInitiator,
  price,
  title,
  disabled,
  activeMethod,
}: RespondToDisputeButtonProps) {
  const { address, status } = useWalletStore();
  const { respondToDispute } = useRespondToDispute();
  const [open, setOpen] = useState(false);

  const connected = status === "connected" && address;
  const isBuyer = connected && address.toLowerCase() === buyer.toLowerCase();
  const isSeller = connected && address.toLowerCase() === seller.toLowerCase();
  const isParty = isBuyer || isSeller;
  const isDisputed = state === 3;
  const initiatorSet =
    disputeInitiator && disputeInitiator.toLowerCase() !== ZERO_ADDRESS;
  const isInitiator =
    connected &&
    initiatorSet &&
    address.toLowerCase() === disputeInitiator.toLowerCase();

  if (!isParty || !isDisputed || !initiatorSet || isInitiator) {
    return null;
  }

  const bond = (price * DISPUTE_BOND_BPS) / BPS_DENOMINATOR;

  const buttonLabel = (() => {
    if (disabled && activeMethod) {
      return `Processing ${activeMethod.replace(/_/g, " ")}...`;
    }
    return "Respond to dispute";
  })();

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-deep)] font-medium hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
      {open ? (
        <DisputeEvidenceDialog
          mode="respond"
          tradeId={tradeId}
          title={title}
          price={price}
          bond={bond}
          onClose={() => setOpen(false)}
          onSubmit={(evidence) => respondToDispute(tradeId, evidence, bond)}
        />
      ) : null}
    </div>
  );
}
