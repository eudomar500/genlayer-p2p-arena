"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace confirm_delivery write. The
 * contract enforces two preconditions: msg.sender must be the trade's
 * buyer, and the trade state must be SHIPPED. The successful path
 * settles the escrow: the seller receives the trade price net of the
 * protocol fee, the marketplace accrues that fee for later
 * withdrawal, and the trade transitions to COMPLETED. Payouts are
 * emitted at FINALIZED rather than ACCEPTED, so the seller's balance
 * does not move until the Bradbury Finality Window expires.
 */
export function useConfirmDelivery() {
  const { execute, pending, error } = useWriteWithTracking();

  const confirmDelivery = async (tradeId: number): Promise<string> => {
    return execute({
      method: "confirm_delivery",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "confirm_delivery",
          args: [BigInt(tradeId)],
          value: 0n,
        });
        return hash;
      },
    });
  };

  return { confirmDelivery, pending, error };
}
