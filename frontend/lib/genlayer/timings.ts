import type { NetworkKey } from "./contracts";

/**
 * Timing constants used by the Marketplace contract. Mirrors the
 * hardcoded values in `Marketplace.py` and `MarketplaceDemo.py`.
 *
 * Production mainnet values match `Marketplace.py` (target deployment).
 * Demo values match `MarketplaceDemo.py` deployed at v903 on Bradbury,
 * which uses reduced timings (1-3 hours instead of days) for end-to-end
 * validation of dispute flows during development.
 */
export interface MarketplaceTimings {
  disputeWindowSeconds: number;
  disputeResponseWindowSeconds: number;
  eligibilityPeriodSeconds: number;
  maxShippingDelaySeconds: number;
  adminForceRefundDelaySeconds: number;
  publicForceRefundDelaySeconds: number;
}

const MARKETPLACE_TIMINGS: Record<NetworkKey, MarketplaceTimings> = {
  studionet: {
    disputeWindowSeconds: 300,
    disputeResponseWindowSeconds: 300,
    eligibilityPeriodSeconds: 300,
    maxShippingDelaySeconds: 300,
    adminForceRefundDelaySeconds: 600,
    publicForceRefundDelaySeconds: 900,
  },
  testnetAsimov: {
    disputeWindowSeconds: 300,
    disputeResponseWindowSeconds: 300,
    eligibilityPeriodSeconds: 300,
    maxShippingDelaySeconds: 300,
    adminForceRefundDelaySeconds: 600,
    publicForceRefundDelaySeconds: 900,
  },
  testnetBradbury: {
    disputeWindowSeconds: 7 * 86400,
    disputeResponseWindowSeconds: 14 * 86400,
    eligibilityPeriodSeconds: 7 * 86400,
    maxShippingDelaySeconds: 30 * 86400,
    adminForceRefundDelaySeconds: 30 * 86400,
    publicForceRefundDelaySeconds: 90 * 86400,
  },
  testnetBradburyDemo: {
    disputeWindowSeconds: 3600,
    disputeResponseWindowSeconds: 3600,
    eligibilityPeriodSeconds: 3600,
    maxShippingDelaySeconds: 3600,
    adminForceRefundDelaySeconds: 7200,
    publicForceRefundDelaySeconds: 10800,
  },
};

export function getMarketplaceTimings(network: NetworkKey): MarketplaceTimings {
  return MARKETPLACE_TIMINGS[network];
}
