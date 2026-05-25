"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace accept_listing write. The contract
 * is payable and enforces three preconditions on chain: trade must be
 * LISTING_OPEN, msg.value must exactly match trade.price, and the
 * sender must not be the seller. The price argument here is the exact
 * BigInt amount the contract expects in wei-equivalent (1 GEN = 1e18).
 */
export function useAcceptListing() {
  const { execute, pending, error } = useWriteWithTracking();

  const acceptListing = async (tradeId: number, price: bigint): Promise<string> => {
    return execute({
      method: "accept_listing",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "accept_listing",
          args: [BigInt(tradeId)],
          value: price,
        });
        return hash;
      },
    });
  };

  return { acceptListing, pending, error };
}
