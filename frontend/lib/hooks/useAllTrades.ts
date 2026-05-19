"use client";

import { useQuery } from "@tanstack/react-query";
import { getTradeSummary, getListingDetails } from "@/lib/genlayer/reads";
import { createReadClient } from "@/lib/genlayer/client";
import { useMarketplaceMetrics } from "./useMarketplaceMetrics";

export type TradeListItem = {
  id: number;
  title: string;
  description: string;
  seller: string;
  buyer: string;
  price: bigint;
  state: number;
  shipped_at: number;
  disputed: boolean;
};

export function useAllTrades() {
  const { data: metrics } = useMarketplaceMetrics();
  const total = metrics?.totalTradesCreated ?? 0;

  return useQuery({
    queryKey: ["marketplace", "all-trades", total],
    queryFn: async (): Promise<TradeListItem[]> => {
      if (total === 0) return [];

      const client = createReadClient("studionet");
      const promises: Promise<TradeListItem>[] = [];
      for (let i = 0; i < total; i++) {
        promises.push(fetchTradeBundle(client, i));
      }
      return Promise.all(promises);
    },
    enabled: total > 0,
    staleTime: 30_000,
  });
}

import type { ReadClient } from "@/lib/genlayer/client";

async function fetchTradeBundle(client: ReadClient, id: number): Promise<TradeListItem> {
  const [listing, summary] = await Promise.all([
    getListingDetails(client, "studionet", id),
    getTradeSummary(client, "studionet", id),
  ]);
  return {
    id,
    title: listing.title,
    description: listing.description,
    seller: summary.seller,
    buyer: summary.buyer,
    price: BigInt(summary.price),
    state: Number(summary.state),
    shipped_at: Number(summary.shipped_at),
    disputed: Boolean(summary.was_disputed),
  };
}
