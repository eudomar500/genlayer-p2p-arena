import { createClient } from "genlayer-js";
import { localnet } from "genlayer-js/chains";
import type { Address } from "./types";
import type { NetworkKey } from "./contracts";

/**
 * GenLayer client factory.
 *
 * genlayer-js v0.7 exports only `localnet` and `simulator` as chains.
 * Studionet and the public testnets are not yet first-class entries, so
 * we build custom chain configs by extending the localnet shape and
 * pointing the RPC URL at the right endpoint per network.
 *
 * Two client variants:
 *   - Read-only client (no account): used for view methods.
 *   - Wallet-bound client (account: address): write methods route through
 *     EIP-1193 (window.ethereum). The injected wallet handles signing.
 */

interface ChainOverride {
  id: number;
  name: string;
  rpcUrl: string;
}

const CHAIN_OVERRIDES: Record<NetworkKey, ChainOverride> = {
  studionet: {
    id: 61999,
    name: "GenLayer Studionet",
    rpcUrl: "https://studio.genlayer.com:8443/api",
  },
  testnetAsimov: {
    id: 4221,
    name: "GenLayer Testnet Asimov",
    rpcUrl: "https://testnet-asimov.genlayer.com/api",
  },
  testnetBradbury: {
    id: 4222,
    name: "GenLayer Testnet Bradbury",
    rpcUrl: "https://testnet-bradbury.genlayer.com/api",
  },
};

function buildChain(network: NetworkKey) {
  const override = CHAIN_OVERRIDES[network];
  return {
    ...localnet,
    id: override.id,
    name: override.name,
    rpcUrls: {
      default: {
        http: [override.rpcUrl] as readonly string[],
      },
    },
  };
}

export function createReadClient(network: NetworkKey) {
  return createClient({ chain: buildChain(network) });
}

export function createWriteClient(network: NetworkKey, account: Address) {
  return createClient({
    chain: buildChain(network),
    account,
  });
}

export type ReadClient = ReturnType<typeof createReadClient>;
export type WriteClient = ReturnType<typeof createWriteClient>;
