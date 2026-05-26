"use client";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { getTradeSummary, getListingDetails } from "@/lib/genlayer/reads";
import { createReadClient } from "@/lib/genlayer/client";
import type { ReadClient } from "@/lib/genlayer/client";
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

const READ_DELAY_MS = 250;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  attempt = 0,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimit = message.toLowerCase().includes("rate limit");
    if (isRateLimit && attempt < MAX_RETRIES) {
      const backoff = (attempt + 1) * 1000;
      await sleep(backoff);
      return withRateLimitRetry(fn, attempt + 1);
    }
    throw err;
  }
}

async function fetchTradeBundle(
  client: ReadClient,
  id: number,
): Promise<TradeListItem | null> {
  try {
    const listing = await withRateLimitRetry(() =>
      getListingDetails(client, DEFAULT_NETWORK, id),
    );
    await sleep(READ_DELAY_MS);
    const summary = await withRateLimitRetry(() =>
      getTradeSummary(client, DEFAULT_NETWORK, id),
    );
    return {
      id,
      title: listing.title,
      description: listing.description,
      seller: summary.seller,
      buyer: summary.buyer,
      price: BigInt(summary.price),
      state: Number(summary.state),
      shipped_at: Number(summary.shipped_at),
      disputed: Boolean(summary.disputed),
    };
  } catch {
    // After retries, give up on this trade but do not block the others.
    return null;
  }
}

export function useAllTrades() {
  const { data: metrics } = useMarketplaceMetrics();
  const total = metrics?.totalTradesCreated ?? 0;
  return useQuery({
    queryKey: ["marketplace", "all-trades", total],
    queryFn: async (): Promise<TradeListItem[]> => {
      if (total === 0) return [];
      const client = createReadClient(DEFAULT_NETWORK);
      const results: TradeListItem[] = [];
      // Sequential reads with a small inter-trade pause. Bradbury's
      // public RPC throttles concurrent gen_call requests; serializing
      // keeps us within its limits while we have a small marketplace.
      // When the marketplace grows, this should move to batched reads
      // or a backend indexer.
      for (let i = 0; i < total; i++) {
        const trade = await fetchTradeBundle(client, i);
        if (trade !== null) {
          results.push(trade);
        }
        if (i < total - 1) {
          await sleep(READ_DELAY_MS);
        }
      }
      return results;
    },
    enabled: total > 0,
    staleTime: 30_000,
  });
}
