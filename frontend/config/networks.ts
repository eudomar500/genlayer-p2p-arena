/**
 * Network selector and metadata. The actual chain configs live in
 * genlayer-js/chains; this file is for UI display and metadata.
 */

import type { NetworkKey } from "@/lib/genlayer/contracts";

export interface NetworkMetadata {
  key: NetworkKey;
  displayName: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string | null;
  status: "active" | "planned";
}

export const NETWORKS: Record<NetworkKey, NetworkMetadata> = {
  studionet: {
    key: "studionet",
    displayName: "Studionet",
    chainId: 61999,
    rpcUrl: "https://studio.genlayer.com:8443/api",
    explorerUrl: "https://explorer-studio.genlayer.com",
    status: "active",
  },
  testnetAsimov: {
    key: "testnetAsimov",
    displayName: "Testnet Asimov",
    chainId: 4221,
    rpcUrl: "https://rpc-asimov.genlayer.com",
    explorerUrl: "https://explorer-asimov.genlayer.com",
    status: "planned",
  },
  testnetBradbury: {
    key: "testnetBradbury",
    displayName: "Testnet Bradbury",
    chainId: 4221,
    rpcUrl: "https://rpc-bradbury.genlayer.com",
    explorerUrl: "https://explorer-bradbury.genlayer.com",
    status: "active",
  },
};
