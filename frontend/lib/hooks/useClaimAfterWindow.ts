"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace claim_after_window write. Lets the
 * seller close a SHIPPED trade once the dispute window has elapsed
 * without the buyer either confirming delivery or opening a dispute.
 * The contract requires msg.sender to be the trade seller, the trade
 * state to be SHIPPED, and now >= shipped_at + DISPUTE_WINDOW. On
 * success, the escrow releases to the seller and the trade transitions
 * to COMPLETED. The payout is emitted at FINALIZED.
 */
export function useClaimAfterWindow() {
  const { execute, pending, error } = useWriteWithTracking();

  const claimAfterWindow = async (tradeId: number): Promise<string> => {
    return execute({
      method: "claim_after_window",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "claim_after_window",
          args: [BigInt(tradeId)],
          value: 0n,
        });
        return hash;
      },
    });
  };

  return { claimAfterWindow, pending, error };
}
