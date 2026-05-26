import type { Address } from "./types";

/**
 * Deployed contract addresses per network. Studionet is the primary
 * deployment target for the MVP.
 *
 * The `getAddresses` helper returns `any` for the address fields because
 * genlayer-js v0.7 uses a branded internal Address type that is not
 * exported. Treating addresses as opaque here is the documented workaround
 * (matches the boilerplate at genlayerlabs/genlayer-project-boilerplate
 * which uses Vue + JS, not TS strict).
 */

export type NetworkKey = "studionet" | "testnetAsimov" | "testnetBradbury" | "testnetBradburyDemo";

export interface NetworkAddresses {
  marketplace: Address;
  predictionMarket: Address;
}

export const ADDRESSES: Record<NetworkKey, NetworkAddresses | null> = {
  studionet: {
    marketplace: "0x29f58D5ACC8b85250D3Dae2692DEADED346c6e67" as Address,
    predictionMarket:
      "0x2b0B5f76Db290D77DF53250B7f0540fc2D8cb48E" as Address,
  },
  testnetAsimov: null,
  testnetBradbury: {
    marketplace: "0x68546F0a8d2Af91d5917A03245c1D31296487b3F" as Address,
    predictionMarket:
      "0x10717D9814Ace2098862299C26806a2899eAB204" as Address,
  },
  testnetBradburyDemo: {
    marketplace: "0x42071e9F1d9DD65c8Fbbf1e84AeE5d1A1C58aEdf" as Address,
    predictionMarket:
      "0x19A008165570Af40eFc0e1CE2AA95CfBC10335F3" as Address,
  },
};

export const DEFAULT_NETWORK: NetworkKey = "testnetBradburyDemo";

/**
 * Returns the contract addresses for a given network. The return type uses
 * `any` for address fields to allow direct interop with the genlayer-js SDK
 * `Address` type, which is a branded `0x${string} & { length: 42 }` and is
 * not publicly exported.
 */
export function getAddresses(network: NetworkKey): {
  marketplace: any;
  predictionMarket: any;
} {
  const entry = ADDRESSES[network];
  if (entry === null) {
    throw new Error(
      `PointMarket has no deployed contracts on ${network} yet. ` +
        `Switch to studionet or check config/networks.ts.`,
    );
  }
  return entry;
}
