"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace claim_stuck_dispute_refund write.
 * Permissionless escape hatch for disputes that have stalled past
 * PUBLIC_FORCE_REFUND_DELAY_SECONDS, callable by anyone (typically the
 * buyer who is stuck waiting for their money). The contract requires:
 *   - trade state is DISPUTED.
 *   - now >= disputed_at + PUBLIC_FORCE_REFUND_DELAY.
 * On success the trade is refunded to the buyer, both bonds are
 * returned, and the trade transitions to REFUNDED. The contract does
 * not require msg.sender to be the admin or a trade party; this is
 * the censorship-resistant fallback that ensures funds never get
 * stuck indefinitely even if both the admin and the LLM fail to act.
 */
export function useClaimStuckDisputeRefund() {
  const { execute, pending, error } = useWriteWithTracking();

  const claimStuckDisputeRefund = async (tradeId: number): Promise<string> => {
    return execute({
      method: "claim_stuck_dispute_refund",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "claim_stuck_dispute_refund",
          args: [BigInt(tradeId)],
          value: 0n,
        });
        return hash;
      },
    });
  };

  return { claimStuckDisputeRefund, pending, error };
}
