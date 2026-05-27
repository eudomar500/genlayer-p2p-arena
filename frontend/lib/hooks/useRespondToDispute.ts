"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace respond_to_dispute write. Lets the
 * non-initiator party submit their counter-evidence and bond. The
 * contract requires:
 *   - trade state is DISPUTED.
 *   - msg.sender is not the dispute_initiator.
 *   - msg.sender is the buyer or the seller.
 *   - msg.value >= the same bond as open_dispute (5% of price).
 *   - evidence length is 1 to 4000 characters.
 * On success the sender's evidence and bond are recorded, and the
 * contract immediately invokes the LLM arbitration via Optimistic
 * Democracy. The LLM evaluates both evidences and returns a verdict
 * which the contract uses to release funds and bonds accordingly.
 * The verdict reasoning ends up in summary.llm_verdict_reasoning once
 * the underlying transaction reaches consensus.
 */
export function useRespondToDispute() {
  const { execute, pending, error } = useWriteWithTracking();

  const respondToDispute = async (
    tradeId: number,
    evidence: string,
    bond: bigint,
  ): Promise<string> => {
    return execute({
      method: "respond_to_dispute",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "respond_to_dispute",
          args: [BigInt(tradeId), evidence],
          value: bond,
        });
        return hash;
      },
    });
  };

  return { respondToDispute, pending, error };
}
