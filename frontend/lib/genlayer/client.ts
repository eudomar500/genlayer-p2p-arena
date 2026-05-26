import { studionet, testnetAsimov, testnetBradbury } from "genlayer-js/chains";
import { createClient } from "genlayer-js";
import type { Address } from "./types";
import type { NetworkKey } from "./contracts";

const CHAIN_BY_NETWORK: Record<NetworkKey, any> = {
  studionet: studionet,
  testnetAsimov: testnetAsimov,
  testnetBradbury: testnetBradbury,
  testnetBradburyDemo: testnetBradbury,
};

export function createReadClient(network: NetworkKey) {
  return createClient({ chain: CHAIN_BY_NETWORK[network] });
}

export function createWriteClient(network: NetworkKey, account: Address) {
  return createClient({
    chain: CHAIN_BY_NETWORK[network],
    account,
  });
}

export type ReadClient = ReturnType<typeof createReadClient>;
export type WriteClient = ReturnType<typeof createWriteClient>;
