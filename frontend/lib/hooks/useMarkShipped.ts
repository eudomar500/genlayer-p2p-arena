"use client";

import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { getAddresses } from "@/lib/genlayer/contracts";

/**
 * Wrapper hook for the marketplace mark_shipped write. The contract
 * enforces three preconditions: msg.sender must be the trade's seller,
 * the trade state must be PAID, and both tracking strings must match
 * the configured length bounds (tracking_number 4-100, carrier 1-50).
 * Bounds are duplicated client-side in the dialog so the user sees the
 * error before the transaction is sent and reverts.
 */
export function useMarkShipped() {
  const { execute, pending, error } = useWriteWithTracking();

  const markShipped = async (
    tradeId: number,
    trackingNumber: string,
    trackingCarrier: string,
  ): Promise<string> => {
    return execute({
      method: "mark_shipped",
      context: `Trade #${tradeId}`,
      write: async (client, network) => {
        const { marketplace } = getAddresses(network);
        const hash = await client.writeContract({
          address: marketplace,
          functionName: "mark_shipped",
          args: [BigInt(tradeId), trackingNumber, trackingCarrier],
          value: 0n,
        });
        return hash;
      },
    });
  };

  return { markShipped, pending, error };
}
