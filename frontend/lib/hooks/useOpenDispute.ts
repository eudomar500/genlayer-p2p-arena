"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace open_dispute write. Lets either the
 * buyer or the seller open a formal dispute on a SHIPPED trade within
 * the dispute window. The contract requires:
 *   - msg.sender is the buyer or the seller.
 *   - trade state is SHIPPED.
 *   - now < shipped_at + DISPUTE_WINDOW.
 *   - evidence length is 1 to 4000 characters.
 *   - msg.value >= price * DISPUTE_BOND_BPS / BPS_DENOMINATOR (5%).
 * On success the trade transitions to DISPUTED and the sender's evidence
 * and bond are recorded. The other party then has DISPUTE_RESPONSE_WINDOW
 * to respond, after which the LLM resolves or the initiator can claim by
 * default. The bond is returned to the winner after resolution and
 * forfeited by the loser (loser's bond also takes a penalty if the
 * dispute was resolved by default).
 */
export function useOpenDispute() {
  const { execute, pending, error } = useWriteWithTracking();

  const openDispute = async (
    tradeId: number,
    evidence: string,
    bond: bigint,
  ): Promise<string> => {
    return execute({
      method: "open_dispute",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "open_dispute",
          args: [BigInt(tradeId), evidence],
          value: bond,
        });
        return hash;
      },
    });
  };

  return { openDispute, pending, error };
}
