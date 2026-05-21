import type { Address } from "./types";
import { getAddresses, type NetworkKey } from "./contracts";
import type { WriteClient } from "./client";

/**
 * Typed wrappers around client.writeContract() for every state-modifying
 * method on both contracts. Each returns the transaction hash; consumers
 * use client.waitForTransactionReceipt() to track lifecycle.
 *
 * The genlayer-js writeContract signature requires `value: bigint`. For
 * non-payable methods, pass 0n. Payable methods accept the bond/payment as
 * an explicit bigint argument.
 */

const ZERO_VALUE = 0n;

// =============================================================================
// Marketplace writes
// =============================================================================

export async function createListing(
  client: WriteClient,
  network: NetworkKey,
  args: { title: string; description: string; price: bigint },
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "create_listing",
    args: [args.title, args.description, args.price],
    value: ZERO_VALUE,
  });
}

export async function cancelListing(
  client: WriteClient,
  network: NetworkKey,
  tradeId: bigint,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "cancel_listing",
    args: [tradeId],
    value: ZERO_VALUE,
  });
}

export async function acceptListing(
  client: WriteClient,
  network: NetworkKey,
  tradeId: bigint,
  value: bigint,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "accept_listing",
    args: [tradeId],
    value,
  });
}

export async function markShipped(
  client: WriteClient,
  network: NetworkKey,
  args: { tradeId: bigint; trackingNumber: string; trackingCarrier: string },
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "mark_shipped",
    args: [args.tradeId, args.trackingNumber, args.trackingCarrier],
    value: ZERO_VALUE,
  });
}

export async function confirmDelivery(
  client: WriteClient,
  network: NetworkKey,
  tradeId: bigint,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "confirm_delivery",
    args: [tradeId],
    value: ZERO_VALUE,
  });
}

export async function claimAfterWindow(
  client: WriteClient,
  network: NetworkKey,
  tradeId: bigint,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "claim_after_window",
    args: [tradeId],
    value: ZERO_VALUE,
  });
}

export async function claimUnshippedRefund(
  client: WriteClient,
  network: NetworkKey,
  tradeId: bigint,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "claim_unshipped_refund",
    args: [tradeId],
    value: ZERO_VALUE,
  });
}

export async function openDispute(
  client: WriteClient,
  network: NetworkKey,
  args: { tradeId: bigint; evidence: string; bond: bigint },
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "open_dispute",
    args: [args.tradeId, args.evidence],
    value: args.bond,
  });
}

export async function respondToDispute(
  client: WriteClient,
  network: NetworkKey,
  args: { tradeId: bigint; evidence: string; bond: bigint },
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "respond_to_dispute",
    args: [args.tradeId, args.evidence],
    value: args.bond,
  });
}

export async function claimDisputeDefault(
  client: WriteClient,
  network: NetworkKey,
  tradeId: bigint,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "claim_dispute_default",
    args: [tradeId],
    value: ZERO_VALUE,
  });
}

export async function forceRefundStuckDispute(
  client: WriteClient,
  network: NetworkKey,
  tradeId: bigint,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "force_refund_stuck_dispute",
    args: [tradeId],
    value: ZERO_VALUE,
  });
}

export async function claimStuckDisputeRefund(
  client: WriteClient,
  network: NetworkKey,
  tradeId: bigint,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "claim_stuck_dispute_refund",
    args: [tradeId],
    value: ZERO_VALUE,
  });
}

// =============================================================================
// PredictionMarket writes
// =============================================================================

export async function createSubjectiveMarket(
  client: WriteClient,
  network: NetworkKey,
  args: {
    question: string;
    metricType: number;
    targetTradeId: bigint;
    bettingCloseAt: bigint;
    settlementAt: bigint;
  },
) {
  const { predictionMarket } = getAddresses(network);
  return await client.writeContract({
    address: predictionMarket,
    functionName: "create_subjective_market",
    args: [
      args.question,
      args.metricType,
      args.targetTradeId,
      args.bettingCloseAt,
      args.settlementAt,
    ],
    value: ZERO_VALUE,
  });
}

export async function createObjectiveMarket(
  client: WriteClient,
  network: NetworkKey,
  args: {
    question: string;
    metricType: number;
    threshold: bigint;
    windowStart: bigint;
    windowEnd: bigint;
    bettingCloseAt: bigint;
    settlementAt: bigint;
  },
) {
  const { predictionMarket } = getAddresses(network);
  return await client.writeContract({
    address: predictionMarket,
    functionName: "create_objective_market",
    args: [
      args.question,
      args.metricType,
      args.threshold,
      args.windowStart,
      args.windowEnd,
      args.bettingCloseAt,
      args.settlementAt,
    ],
    value: ZERO_VALUE,
  });
}

export async function placeBet(
  client: WriteClient,
  network: NetworkKey,
  args: { marketId: bigint; predictYes: boolean; value: bigint },
) {
  const { predictionMarket } = getAddresses(network);
  return await client.writeContract({
    address: predictionMarket,
    functionName: "place_bet",
    args: [args.marketId, args.predictYes],
    value: args.value,
  });
}

export async function resolveMarket(
  client: WriteClient,
  network: NetworkKey,
  marketId: bigint,
) {
  const { predictionMarket } = getAddresses(network);
  return await client.writeContract({
    address: predictionMarket,
    functionName: "resolve_market",
    args: [marketId],
    value: ZERO_VALUE,
  });
}

export async function claimWinnings(
  client: WriteClient,
  network: NetworkKey,
  marketId: bigint,
) {
  const { predictionMarket } = getAddresses(network);
  return await client.writeContract({
    address: predictionMarket,
    functionName: "claim_winnings",
    args: [marketId],
    value: ZERO_VALUE,
  });
}

export async function refundBet(
  client: WriteClient,
  network: NetworkKey,
  marketId: bigint,
) {
  const { predictionMarket } = getAddresses(network);
  return await client.writeContract({
    address: predictionMarket,
    functionName: "refund_bet",
    args: [marketId],
    value: ZERO_VALUE,
  });
}

// =============================================================================
// Admin writes
// =============================================================================

export async function pauseMarketplace(
  client: WriteClient,
  network: NetworkKey,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "pause",
    args: [],
    value: ZERO_VALUE,
  });
}

export async function unpauseMarketplace(
  client: WriteClient,
  network: NetworkKey,
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "unpause",
    args: [],
    value: ZERO_VALUE,
  });
}

export async function pausePredictionMarket(
  client: WriteClient,
  network: NetworkKey,
) {
  const { predictionMarket } = getAddresses(network);
  return await client.writeContract({
    address: predictionMarket,
    functionName: "pause",
    args: [],
    value: ZERO_VALUE,
  });
}

export async function unpausePredictionMarket(
  client: WriteClient,
  network: NetworkKey,
) {
  const { predictionMarket } = getAddresses(network);
  return await client.writeContract({
    address: predictionMarket,
    functionName: "unpause",
    args: [],
    value: ZERO_VALUE,
  });
}

export async function withdrawFees(
  client: WriteClient,
  network: NetworkKey,
  args: { recipient: Address; amount: bigint },
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "withdraw_fees",
    args: [args.recipient, args.amount],
    value: ZERO_VALUE,
  });
}

export async function withdrawExternalFees(
  client: WriteClient,
  network: NetworkKey,
  args: { recipient: Address; amount: bigint },
) {
  const { marketplace } = getAddresses(network);
  return await client.writeContract({
    address: marketplace,
    functionName: "withdraw_external_fees",
    args: [args.recipient, args.amount],
    value: ZERO_VALUE,
  });
}
