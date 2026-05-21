import type { Address as ViemAddress } from "viem";

/**
 * Type mirrors for Marketplace.py and PredictionMarket.py contract responses.
 * Field names match the Python contracts exactly to avoid mapping logic.
 *
 * Address is re-exported from viem because genlayer-js uses viem's nominal
 * Address type internally. Using viem's type keeps everything assignable.
 */

export type Address = ViemAddress;

// Marketplace trade states (u8 enum mirrored from contract).
export const TradeState = {
  LISTING_OPEN: 0,
  PAID: 1,
  SHIPPED: 2,
  DISPUTED: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  REFUNDED: 6,
} as const;

export type TradeStateValue = (typeof TradeState)[keyof typeof TradeState];

export const TRADE_STATE_LABELS: Record<TradeStateValue, string> = {
  0: "LISTING OPEN",
  1: "PAID",
  2: "SHIPPED",
  3: "DISPUTED",
  4: "COMPLETED",
  5: "CANCELLED",
  6: "REFUNDED",
};

export const MarketState = {
  OPEN: 0,
  RESOLVED_YES: 1,
  RESOLVED_NO: 2,
  REFUNDED: 3,
} as const;

export type MarketStateValue = (typeof MarketState)[keyof typeof MarketState];

export const MARKET_STATE_LABELS: Record<MarketStateValue, string> = {
  0: "OPEN",
  1: "RESOLVED YES",
  2: "RESOLVED NO",
  3: "REFUNDED",
};

export const SubjectiveMetric = {
  TRADE_DESCRIPTION_HONEST: 100,
  SELLER_TRUSTWORTHY: 101,
} as const;

export type SubjectiveMetricValue =
  (typeof SubjectiveMetric)[keyof typeof SubjectiveMetric];

export const ObjectiveMetric = {
  VOLUME_THRESHOLD: 0,
  DISPUTE_RATE_BELOW: 1,
  AVG_PRICE_ABOVE: 2,
  TRADE_COUNT_ABOVE: 3,
} as const;

export interface TradeSummary {
  exists: boolean;
  trade_id: string;
  seller: Address;
  buyer: Address;
  price: string;
  state: TradeStateValue;
  created_at: number;
  paid_at: number;
  shipped_at: number;
  delivered_at: number;
  disputed_at: number;
  resolved_at: number;
  was_disputed: boolean;
  llm_verdict_buyer_wins: boolean;
  resolved_by_default: boolean;
  buyer_bond: string;
  seller_bond: string;
}

export interface ListingDetails {
  exists: boolean;
  title: string;
  description: string;
  tracking_number: string;
  tracking_carrier: string;
  buyer_evidence: string;
  seller_evidence: string;
  llm_resolution_reasoning: string;
}

export interface MarketplaceMetrics {
  total_trades_created: string;
  completed_count: string;
  disputed_count: string;
  refunded_count: string;
  total_volume: string;
  fees_collected: string;
  received_external_fees: string;
}

export interface ContractInfo {
  admin: Address;
  paused: boolean;
  version: number;
  authorized_fee_sender?: Address;
  total_trades?: string;
  marketplace_address?: Address;
  total_markets?: string;
}

export interface WindowedViewResult {
  truncated: boolean;
  scanned: string;
  total_eligible_records: string;
  volume?: string;
  count?: string;
  dispute_rate_bps?: string;
  avg_price?: string;
}

export interface MarketSummary {
  exists: boolean;
  creator: Address;
  question: string;
  metric_type: number;
  threshold: string;
  target_trade_id: string;
  window_start: number;
  window_end: number;
  betting_close_at: number;
  settlement_at: number;
  state: MarketStateValue;
  yes_pool: string;
  no_pool: string;
  fee_forwarded: string;
  llm_resolution_reasoning: string;
  created_at: number;
  resolved_at: number;
}

export interface UserBet {
  exists: boolean;
  yes_amount: string;
  no_amount: string;
  claimed: boolean;
}

export interface UserReputation {
  correct_predictions: string;
  total_predictions: string;
}

export const TxPhase = {
  IDLE: "idle",
  SIGNING: "signing",
  PENDING: "pending",
  PROPOSING: "proposing",
  COMMITTING: "committing",
  REVEALING: "revealing",
  ACCEPTED: "accepted",
  FINALIZED: "finalized",
  ERROR: "error",
} as const;

export type TxPhaseValue = (typeof TxPhase)[keyof typeof TxPhase];

export const TX_PHASE_LABELS: Record<TxPhaseValue, string> = {
  idle: "Submit",
  signing: "Confirm in wallet...",
  pending: "Transaction submitted...",
  proposing: "Validators proposing outcome...",
  committing: "Validators committing votes...",
  revealing: "Validators revealing votes...",
  accepted: "Accepted by consensus",
  finalized: "Finalized",
  error: "Transaction failed",
};
