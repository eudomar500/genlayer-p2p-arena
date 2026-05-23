"use client";

import { useState } from "react";
import { useWalletStore } from "@/lib/wallet/store";
import { useTxStore } from "@/lib/tx/store";
import { createWriteClient, type WriteClient } from "@/lib/genlayer/client";
import type { TxMethod } from "@/lib/tx/types";
import type { Address } from "@/lib/genlayer/types";

interface ExecuteParams {
  method: TxMethod;
  context?: string;
  write: (client: WriteClient, network: "testnetBradbury") => Promise<string>;
}

export function useWriteWithTracking() {
  const { address, chainId, status } = useWalletStore();
  const { addTx } = useTxStore();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async ({ method, context, write }: ExecuteParams): Promise<string> => {
    if (status !== "connected" || !address) {
      throw new Error("Wallet not connected");
    }
    if (chainId !== 4221) {
      throw new Error("Wrong network: must be on Bradbury testnet");
    }

    setPending(true);
    setError(null);

    try {
      const client = createWriteClient("testnetBradbury", address as Address);
      const txHash = await write(client, "testnetBradbury");
      
      addTx({
        txHash,
        method,
        uiState: "submitted",
        rawStatus: "PENDING",
        submittedAt: Date.now(),
        lastPolledAt: 0,
        context,
      });

      return txHash;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setPending(false);
    }
  };

  return { execute, pending, error };
}
