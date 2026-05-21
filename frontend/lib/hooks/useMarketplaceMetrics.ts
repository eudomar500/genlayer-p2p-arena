"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { getMarketplaceMetrics } from "@/lib/genlayer/reads";
import { createReadClient } from "@/lib/genlayer/client";

export function useMarketplaceMetrics() {
  return useQuery({
    queryKey: ["marketplace", "metrics"],
    queryFn: async () => {
      const client = createReadClient(DEFAULT_NETWORK);
      const metrics = await getMarketplaceMetrics(client, DEFAULT_NETWORK);
      return {
        totalTradesCreated: Number(metrics.total_trades_created),
        completedCount: Number(metrics.completed_count),
        disputedCount: Number(metrics.disputed_count),
        totalVolume: BigInt(metrics.total_volume),
        feesCollected: BigInt(metrics.fees_collected),
      };
    },
    staleTime: 30_000,
  });
}
