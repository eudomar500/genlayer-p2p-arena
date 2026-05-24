"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace cancel_listing write. The contract
 * enforces two preconditions: msg.sender must be the listing's seller,
 * and the trade state must still be LISTING_OPEN. Either of these
 * raises a UserError on chain and the transaction transitions to a
 * failure state in the drawer. The UI should hide the button when
 * those preconditions are not met to avoid wasted transactions.
 */
export function useCancelListing() {
  const { execute, pending, error } = useWriteWithTracking();

  const cancelListing = async (tradeId: number): Promise<string> => {
    return execute({
      method: "cancel_listing",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "cancel_listing",
          args: [BigInt(tradeId)],
          value: 0n,
        });
        return hash;
      },
    });
  };

  return { cancelListing, pending, error };
}
