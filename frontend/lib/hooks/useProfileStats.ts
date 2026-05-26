"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { fetchGenBalance } from "../wallet/balance";
import { createReadClient } from "../genlayer/client";
import {
  getNextTradeId,
  getTradeSummary,
  getNextMarketId,
  getUserBet,
  getUserReputation,
} from "../genlayer/reads";
import type { Address } from "../genlayer/types";

export type ProfileStats = {
  balance: bigint;
  marketplace: {
    tradesAsSeller: number;
    tradesAsBuyer: number;
    completedTrades: number;
    disputedTrades: number;
    totalVolume: bigint;
  };
  predictions: {
    marketsCreated: number; // Placeholder, as predicting markets created is not trivially iterated from existing reads unless we add it
    betsPlaced: number;
    winRateStr: string;
    reputationScore: number;
  };
  recentActivity: {
    id: string;
    type: "Trade" | "Market";
    status: string;
    timestamp: Date;
  }[];
};

export function useProfileStats(address: string) {
  return useQuery({
    queryKey: ["profileStats", address],
    queryFn: async (): Promise<ProfileStats> => {
      const client = createReadClient(DEFAULT_NETWORK);
      const userAddr = address as Address;

      // 1. Balance
      const balance = await fetchGenBalance(address);

      // 2. Reputation
      const reputation = await getUserReputation(client, DEFAULT_NETWORK, userAddr);
      const totalBets = Number(reputation.total_predictions);
      const correctBets = Number(reputation.correct_predictions);
      const winRate = totalBets > 0 ? (correctBets / totalBets) * 100 : 0;
      const winRateStr = `${winRate.toFixed(0)}% (${correctBets}/${totalBets})`;
      // Win rate calculated as percentage. Returns 0 if no predictions made.
      const total = Number(reputation.total_predictions);
      const correct = Number(reputation.correct_predictions);
      const reputationScore = total > 0 ? (correct / total) * 100 : 0;

      // 3. Marketplace Stats
      // TODO: replace with indexer in Phase 7
      const nextTradeId = await getNextTradeId(client, DEFAULT_NETWORK);
      let tradesAsSeller = 0;
      let tradesAsBuyer = 0;
      let completedTrades = 0;
      let disputedTrades = 0;
      let totalVolume = 0n;

      const recentActivity = [];

      for (let i = 0; i < Number(nextTradeId); i++) {
        try {
          const trade = await getTradeSummary(client, DEFAULT_NETWORK, i);
          const isSeller = trade.seller.toLowerCase() === address.toLowerCase();
          const isBuyer = trade.buyer.toLowerCase() === address.toLowerCase();

          if (isSeller || isBuyer) {
            if (isSeller) tradesAsSeller++;
            if (isBuyer) tradesAsBuyer++;

            if (trade.state === 4) {
              completedTrades++;
              totalVolume += BigInt(trade.price);
            }
            if (trade.state === 3 || trade.disputed) {
              disputedTrades++;
            }

            // Pseudo-activity for MVP
            recentActivity.push({
              id: `T-${i}`,
              type: "Trade" as const,
              status: ["Created", "Committed", "Appealed", "Disputed", "Completed", "Canceled"][trade.state] || "Unknown",
              timestamp: new Date(Number(trade.created_at) * 1000),
            });
          }
        } catch (e) {
          // Ignore failed reads for individual trades
        }
      }

      // 4. Predictions Stats
      // TODO: replace with indexer in Phase 7
      const nextMarketId = await getNextMarketId(client, DEFAULT_NETWORK);
      let betsPlaced = 0;
      for (let i = 0; i < Number(nextMarketId); i++) {
        try {
          const bet = await getUserBet(client, DEFAULT_NETWORK, i, userAddr);
          // A bet exists if the user has placed any amount on yes OR no
          if (bet && bet.exists && (BigInt(bet.yes_amount) > 0n || BigInt(bet.no_amount) > 0n)) {
            betsPlaced++;
            recentActivity.push({
              id: `M-${i}`,
              type: "Market" as const,
              status: "Bet Placed",
              timestamp: new Date(), // We don't have bet timestamp from contract, using current
            });
          }
        } catch (e) {
          // Ignore failed reads
        }
      }

      recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        balance,
        marketplace: {
          tradesAsSeller,
          tradesAsBuyer,
          completedTrades,
          disputedTrades,
          totalVolume,
        },
        predictions: {
          marketsCreated: 0, // Cannot easily get markets created from current reads
          betsPlaced,
          winRateStr,
          reputationScore,
        },
        recentActivity: recentActivity.slice(0, 10),
      };
    },
    enabled: !!address,
  });
}
