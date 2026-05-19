"use client";

import { useQuery } from "@tanstack/react-query";
import { getTradeSummary, getListingDetails } from "@/lib/genlayer/reads";
import { createReadClient } from "@/lib/genlayer/client";

export function useTrade(tradeId: number) {
  return useQuery({
    queryKey: ["marketplace", "trade", tradeId],
    queryFn: async () => {
      const client = createReadClient("studionet");
      const [listing, summary] = await Promise.all([
        getListingDetails(client, "studionet", tradeId),
        getTradeSummary(client, "studionet", tradeId),
      ]);
      return {
        id: tradeId,
        title: listing.title,
        description: listing.description,
        seller: summary.seller,
        buyer: summary.buyer,
        price: BigInt(summary.price),
        state: Number(summary.state),
        shipped_at: Number(summary.shipped_at),
        disputed: Boolean(summary.was_disputed),
        llm_verdict_buyer_wins: Boolean(summary.llm_verdict_buyer_wins),
        llm_verdict_reasoning: String(listing.llm_resolution_reasoning ?? ""),
      };
    },
    staleTime: 30_000,
  });
}
