"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace claim_unshipped_refund write. Lets
 * the buyer recover their escrowed payment when the seller never marks
 * the trade as shipped within the configured window. The contract
 * requires msg.sender to be the trade buyer, the trade state to be
 * PAID, and now >= paid_at + MAX_SHIPPING_DELAY. On success the full
 * price is refunded to the buyer and the trade transitions to REFUNDED.
 * The payout is emitted at FINALIZED.
 */
export function useClaimUnshippedRefund() {
  const { execute, pending, error } = useWriteWithTracking();

  const claimUnshippedRefund = async (tradeId: number): Promise<string> => {
    return execute({
      method: "claim_unshipped_refund",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "claim_unshipped_refund",
          args: [BigInt(tradeId)],
          value: 0n,
        });
        return hash;
      },
    });
  };

  return { claimUnshippedRefund, pending, error };
}
