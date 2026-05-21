"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarketplaceMetrics } from "@/lib/genlayer/reads";
import { createReadClient } from "@/lib/genlayer/client";

export function useMarketplaceMetrics() {
  return useQuery({
    queryKey: ["marketplace", "metrics"],
    queryFn: async () => {
      const client = createReadClient("studionet");
      const metrics = await getMarketplaceMetrics(client, "studionet");
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
