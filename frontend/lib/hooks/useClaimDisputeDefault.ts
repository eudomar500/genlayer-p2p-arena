"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace claim_dispute_default write. Lets
 * the dispute initiator close a stalled dispute and win by default
 * when the other party fails to respond within
 * DISPUTE_RESPONSE_WINDOW_SECONDS. The contract requires:
 *   - trade state is DISPUTED.
 *   - msg.sender is the dispute_initiator.
 *   - now >= disputed_at + DISPUTE_RESPONSE_WINDOW.
 * On success the initiator wins, the funds are released to them, their
 * bond is returned, and the absent party's bond suffers a
 * DEFAULT_JUDGMENT_PENALTY_BPS deduction before being added to fees.
 * The trade transitions to COMPLETED or REFUNDED depending on which
 * side initiated, and resolved_by_default is set to true.
 */
export function useClaimDisputeDefault() {
  const { execute, pending, error } = useWriteWithTracking();

  const claimDisputeDefault = async (tradeId: number): Promise<string> => {
    return execute({
      method: "claim_dispute_default",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "claim_dispute_default",
          args: [BigInt(tradeId)],
          value: 0n,
        });
        return hash;
      },
    });
  };

  return { claimDisputeDefault, pending, error };
}
