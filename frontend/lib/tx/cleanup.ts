"use client";
import { useTxStore } from "./store";
import { type TxRawStatus, TX_TTL_MS } from "./types";
import { mapRawStatusToUiState, STATUS_NAMES } from "./poller";
import { createReadClient } from "../genlayer/client";
import { DEFAULT_NETWORK } from "../genlayer/contracts";

/**
 * One-shot cleanup that runs at app load before the poller starts.
 *
 * Two responsibilities:
 *
 * 1. Drop TXs older than TX_TTL_MS (2 hours by default). These are
 *    abandoned entries from browser crashes, very long sessions, or
 *    transactions that somehow never finalized. We do not notify the
 *    user; this is silent garbage collection.
 *
 * 2. For surviving active TXs, run a one-time reconciliation query
 *    against the RPC. If a TX finalized while the tab was closed, we
 *    update the store immediately so the user sees the resolved state
 *    on load (the toast machinery will handle notification).
 *
 * Failures are swallowed. A bad RPC response during cleanup should
 * never block the app from rendering.
 */
export async function runCleanup(): Promise<void> {
  const store = useTxStore.getState();
  const now = Date.now();

  // Phase 1: TTL eviction.
  const expired = store.txs.filter((t) => now - t.submittedAt > TX_TTL_MS);
  for (const tx of expired) {
    store.removeTx(tx.txHash);
  }

  // Phase 2: reconciliation of surviving active TXs.
  const survivors = useTxStore
    .getState()
    .txs.filter((t) => t.uiState !== "finalized" && t.uiState !== "failed");

  if (survivors.length === 0) return;

  const client = createReadClient(DEFAULT_NETWORK);

  await Promise.allSettled(
    survivors.map(async (tx) => {
      try {
        const receipt = await client.waitForTransactionReceipt({
          hash: tx.txHash as unknown as `0x${string}` & { length: 66 },
          retries: 1,
          interval: 1000,
        });
        const statusNum = typeof receipt.status === "number" ? receipt.status : Number(receipt.status ?? 0);
        const rawStatus = (STATUS_NAMES[statusNum] ?? "UNINITIALIZED") as TxRawStatus;
        const uiState = mapRawStatusToUiState(rawStatus);
        if (rawStatus !== tx.rawStatus) {
          useTxStore.getState().updateTx(tx.txHash, {
            rawStatus,
            uiState,
            lastPolledAt: now,
          });
        }
      } catch {
        // Silent. The regular poller will catch up shortly.
      }
    }),
  );
}
