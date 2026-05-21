import type {
  Address,
  ContractInfo,
  ListingDetails,
  MarketSummary,
  MarketplaceMetrics,
  TradeStateValue,
  TradeSummary,
  UserBet,
  UserReputation,
  WindowedViewResult,
} from "./types";
import { getAddresses, type NetworkKey } from "./contracts";
import type { ReadClient } from "./client";

/**
 * Typed wrappers around client.readContract() for every view method on both
 * contracts. Names mirror the Python contract methods exactly.
 *
 * The SDK returns CalldataEncodable for all reads. We cast via unknown
 * because the runtime shape matches our interfaces exactly (contracts emit
 * dicts with the documented field names), but TypeScript cannot verify the
 * structural overlap statically. This is the same pattern every viem
 * wrapper uses for typed reads.
 */

// =============================================================================
// Marketplace reads
// =============================================================================

export async function getMarketplaceMetrics(
  client: ReadClient,
  network: NetworkKey,
): Promise<MarketplaceMetrics> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_metrics",
    args: [],
  });
  return result as unknown as MarketplaceMetrics;
}

export async function getMarketplaceContractInfo(
  client: ReadClient,
  network: NetworkKey,
): Promise<ContractInfo> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_contract_info",
    args: [],
  });
  return result as unknown as ContractInfo;
}

export async function isMarketplacePaused(
  client: ReadClient,
  network: NetworkKey,
): Promise<boolean> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "is_paused",
    args: [],
  });
  return result as unknown as boolean;
}

export async function getTradeState(
  client: ReadClient,
  network: NetworkKey,
  tradeId: bigint | number,
): Promise<TradeStateValue> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_trade_state",
    args: [BigInt(tradeId)],
  });
  return result as unknown as TradeStateValue;
}

export async function getTradeSummary(
  client: ReadClient,
  network: NetworkKey,
  tradeId: bigint | number,
): Promise<TradeSummary> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_trade_summary",
    args: [BigInt(tradeId)],
  });
  return result as unknown as TradeSummary;
}

export async function getListingDetails(
  client: ReadClient,
  network: NetworkKey,
  tradeId: bigint | number,
): Promise<ListingDetails> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_listing_details",
    args: [BigInt(tradeId)],
  });
  return result as unknown as ListingDetails;
}

export async function getVolumeInWindow(
  client: ReadClient,
  network: NetworkKey,
  windowStart: bigint | number,
  windowEnd: bigint | number,
): Promise<WindowedViewResult> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_volume_in_window",
    args: [BigInt(windowStart), BigInt(windowEnd)],
  });
  return result as unknown as WindowedViewResult;
}

export async function getDisputeRateInWindow(
  client: ReadClient,
  network: NetworkKey,
  windowStart: bigint | number,
  windowEnd: bigint | number,
): Promise<WindowedViewResult> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_dispute_rate_in_window_bps",
    args: [BigInt(windowStart), BigInt(windowEnd)],
  });
  return result as unknown as WindowedViewResult;
}

export async function getAvgPriceInWindow(
  client: ReadClient,
  network: NetworkKey,
  windowStart: bigint | number,
  windowEnd: bigint | number,
): Promise<WindowedViewResult> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_avg_price_in_window",
    args: [BigInt(windowStart), BigInt(windowEnd)],
  });
  return result as unknown as WindowedViewResult;
}

export async function getEligibleTradeCountInWindow(
  client: ReadClient,
  network: NetworkKey,
  windowStart: bigint | number,
  windowEnd: bigint | number,
): Promise<WindowedViewResult> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "get_eligible_trade_count_in_window",
    args: [BigInt(windowStart), BigInt(windowEnd)],
  });
  return result as unknown as WindowedViewResult;
}

export async function isMarketplaceAdmin(
  client: ReadClient,
  network: NetworkKey,
  address: Address,
): Promise<boolean> {
  const { marketplace } = getAddresses(network);
  const result = await client.readContract({
    address: marketplace,
    functionName: "is_admin",
    args: [address],
  });
  return result as unknown as boolean;
}

// =============================================================================
// PredictionMarket reads
// =============================================================================

export async function getPredictionMarketContractInfo(
  client: ReadClient,
  network: NetworkKey,
): Promise<ContractInfo> {
  const { predictionMarket } = getAddresses(network);
  const result = await client.readContract({
    address: predictionMarket,
    functionName: "get_contract_info",
    args: [],
  });
  return result as unknown as ContractInfo;
}

export async function isPredictionMarketPaused(
  client: ReadClient,
  network: NetworkKey,
): Promise<boolean> {
  const { predictionMarket } = getAddresses(network);
  const result = await client.readContract({
    address: predictionMarket,
    functionName: "is_paused",
    args: [],
  });
  return result as unknown as boolean;
}

export async function getMarketSummary(
  client: ReadClient,
  network: NetworkKey,
  marketId: bigint | number,
): Promise<MarketSummary> {
  const { predictionMarket } = getAddresses(network);
  const result = await client.readContract({
    address: predictionMarket,
    functionName: "get_market_summary",
    args: [BigInt(marketId)],
  });
  return result as unknown as MarketSummary;
}

export async function getUserBet(
  client: ReadClient,
  network: NetworkKey,
  marketId: bigint | number,
  user: Address,
): Promise<UserBet> {
  const { predictionMarket } = getAddresses(network);
  const result = await client.readContract({
    address: predictionMarket,
    functionName: "get_user_bet",
    args: [BigInt(marketId), user],
  });
  return result as unknown as UserBet;
}

export async function getUserReputation(
  client: ReadClient,
  network: NetworkKey,
  user: Address,
): Promise<UserReputation> {
  const { predictionMarket } = getAddresses(network);
  const result = await client.readContract({
    address: predictionMarket,
    functionName: "get_user_reputation",
    args: [user],
  });
  return result as unknown as UserReputation;
}

export async function getNextMarketId(
  client: ReadClient,
  network: NetworkKey,
): Promise<bigint> {
  const { predictionMarket } = getAddresses(network);
  const result = await client.readContract({
    address: predictionMarket,
    functionName: "get_next_market_id",
    args: [],
  });
  return result as unknown as bigint;
}

export async function getMarketplaceAddress(
  client: ReadClient,
  network: NetworkKey,
): Promise<Address> {
  const { predictionMarket } = getAddresses(network);
  const result = await client.readContract({
    address: predictionMarket,
    functionName: "get_marketplace_address",
    args: [],
  });
  return result as unknown as Address;
}

export async function isPredictionMarketAdmin(
  client: ReadClient,
  network: NetworkKey,
  address: Address,
): Promise<boolean> {
  const { predictionMarket } = getAddresses(network);
  const result = await client.readContract({
    address: predictionMarket,
    functionName: "is_admin",
    args: [address],
  });
  return result as unknown as boolean;
}

export async function getNextTradeId(
  client: ReadClient,
  network: NetworkKey,
): Promise<bigint> {
  const metrics = await getMarketplaceMetrics(client, network);
  return BigInt(metrics.total_trades_created);
}
