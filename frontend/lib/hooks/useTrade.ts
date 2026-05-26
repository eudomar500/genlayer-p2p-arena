"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { getTradeSummary, getListingDetails } from "@/lib/genlayer/reads";
import { createReadClient } from "@/lib/genlayer/client";

export interface TradeDetail {
  id: number;
  title: string;
  description: string;
  seller: string;
  buyer: string;
  price: bigint;
  state: number;
  paid_at: number;
  shipped_at: number;
  disputed_at: number;
  dispute_initiator: string;
  buyer_bond: bigint;
  seller_bond: bigint;
  disputed: boolean;
  llm_verdict_buyer_wins: boolean;
  llm_verdict_reasoning: string;
}

export function useTrade(tradeId: number) {
  return useQuery<TradeDetail>({
    queryKey: ["marketplace", "trade", tradeId],
    queryFn: async (): Promise<TradeDetail> => {
      const client = createReadClient(DEFAULT_NETWORK);
      const [listing, summary] = await Promise.all([
        getListingDetails(client, DEFAULT_NETWORK, tradeId),
        getTradeSummary(client, DEFAULT_NETWORK, tradeId),
      ]);
      return {
        id: tradeId,
        title: listing.title,
        description: listing.description,
        seller: summary.seller,
        buyer: summary.buyer,
        price: BigInt(summary.price),
        state: Number(summary.state),
        paid_at: Number(summary.paid_at),
        shipped_at: Number(summary.shipped_at),
        disputed_at: Number(summary.disputed_at),
        dispute_initiator: summary.dispute_initiator,
        buyer_bond: BigInt(summary.buyer_bond),
        seller_bond: BigInt(summary.seller_bond),
        disputed: Boolean(summary.disputed),
        llm_verdict_buyer_wins: Boolean(summary.llm_verdict_buyer_wins),
        llm_verdict_reasoning: String(summary.llm_verdict_reasoning ?? ""),
      };
    },
    staleTime: 30_000,
  });
}
