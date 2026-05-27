"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace force_refund_stuck_dispute write.
 * Admin-only escape hatch for disputes that have stalled past
 * ADMIN_FORCE_REFUND_DELAY_SECONDS. The contract requires:
 *   - msg.sender is the contract admin.
 *   - trade state is DISPUTED.
 *   - now >= disputed_at + ADMIN_FORCE_REFUND_DELAY.
 * On success the trade is refunded to the buyer, both bonds are
 * returned to their posters, and the trade transitions to REFUNDED.
 * This exists for cases where the LLM resolution stalls (validator
 * disagreement, indefinite appeal cycles, infrastructure issues) and
 * the admin needs to unblock the funds without favoring either party.
 */
export function useForceRefundStuckDispute() {
  const { execute, pending, error } = useWriteWithTracking();

  const forceRefundStuckDispute = async (tradeId: number): Promise<string> => {
    return execute({
      method: "force_refund_stuck_dispute",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "force_refund_stuck_dispute",
          args: [BigInt(tradeId)],
          value: 0n,
        });
        return hash;
      },
    });
  };

  return { forceRefundStuckDispute, pending, error };
}
