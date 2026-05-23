"use client";
import { useTxStore } from "./store";
import {
  type TxRawStatus,
  type TxUiState,
  TX_POLL_INTERVAL_MS,
} from "./types";
import { createReadClient } from "../genlayer/client";
import { DEFAULT_NETWORK } from "../genlayer/contracts";


/**
 * Centralized polling loop for tracked transactions.
 *
 * The poller queries the RPC for every active TX (not yet finalized or
 * failed) at TX_POLL_INTERVAL_MS intervals. State updates flow into the
 * store, which the UI subscribes to.
 *
 * Design notes:
 *
 * - A single setInterval handles all active TXs, not one per TX. This
 *   keeps the timer count constant regardless of how many TXs the user
 *   has pending.
 *
 * - Each per-TX query runs concurrently with Promise.allSettled, so a
 *   slow or failing RPC call for one TX does not delay the others. If
 *   a tick takes longer than the interval, the next tick still fires
 *   on schedule and works on fresh data from the store.
 *
 * - Errors are logged but never thrown. A transient RPC failure should
 *   not stop the poller; we just retry on the next tick.
 *
 * - The SDK's `isDecidedState(status)` is the single source of truth
 *   for "should we stop polling this TX". It returns true for
 *   FINALIZED, CANCELED, UNDETERMINED, VALIDATORS_TIMEOUT, LEADER_TIMEOUT.
 */

/**
 * Maps a raw GenLayer transaction status to a user-facing UI state.
 * The 14 protocol states collapse into 4 visible buckets. See
 * docs/TX_LIFECYCLE.md for the full mapping rationale.
 */
/**
 * Local mapping from the numeric `status` field in receipts to the
 * GenLayer protocol state names. The SDK declares
 * `transactionsStatusNumberToName` but does not re-export it from the
 * package index, and `receipt.statusName` arrives undefined in practice
 * even though the SDK source claims to populate it. Maintaining this
 * array locally keeps the poller robust to SDK shape changes.
 *
 * Index order matches the TransactionStatus enum in the SDK.
 */
export const STATUS_NAMES: TxRawStatus[] = [
  "UNINITIALIZED",
  "PENDING",
  "PROPOSING",
  "COMMITTING",
  "REVEALING",
  "ACCEPTED",
  "UNDETERMINED",
  "FINALIZED",
  "CANCELED",
  "APPEAL_REVEALING",
  "APPEAL_COMMITTING",
  "READY_TO_FINALIZE",
  "VALIDATORS_TIMEOUT",
  "LEADER_TIMEOUT",
];

export function mapRawStatusToUiState(status: TxRawStatus): TxUiState {
  switch (status) {
    case "UNINITIALIZED":
    case "PENDING":
    case "PROPOSING":
    case "COMMITTING":
    case "REVEALING":
      return "submitted";
    case "ACCEPTED":
    case "READY_TO_FINALIZE":
    case "APPEAL_REVEALING":
    case "APPEAL_COMMITTING":
      return "accepted";
    case "FINALIZED":
      return "finalized";
    case "CANCELED":
    case "UNDETERMINED":
    case "VALIDATORS_TIMEOUT":
    case "LEADER_TIMEOUT":
      return "failed";
  }
}

/**
 * Polls a single TX once and updates the store with the latest state.
 * Returns silently if the TX is no longer tracked (e.g. user removed it
 * between scheduling and execution).
 */
async function pollOne(txHash: string): Promise<void> {
  const store = useTxStore.getState();
  const tracked = store.txs.find((t) => t.txHash === txHash);
  if (!tracked) return;

  try {
    const client = createReadClient(DEFAULT_NETWORK);
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash as unknown as `0x${string}` & { length: 66 },
      // retries: 1 so the SDK does not block on the Finality Window;
      // we just want the current status snapshot.
      retries: 1,
      interval: 1000,
    });

    
    const statusNum = typeof receipt.status === "number" ? receipt.status : Number(receipt.status ?? 0);
    const rawStatus = (STATUS_NAMES[statusNum] ?? "UNINITIALIZED") as TxRawStatus;
    const uiState = mapRawStatusToUiState(rawStatus);

    store.updateTx(txHash, {
      rawStatus,
      uiState,
      lastPolledAt: Date.now(),
    });
  } catch (err) {
    // Transient RPC errors are expected; just retry on the next tick.
    // We still update lastPolledAt so the UI knows we tried.
    if (typeof window !== "undefined" && window.location.search.includes("debug")) {
      console.warn(`[tx-poller] poll failed for ${txHash}:`, err);
    }
    store.updateTx(txHash, { lastPolledAt: Date.now() });
  }
}

/**
 * Runs one polling pass over all active TXs in parallel.
 */
async function pollAll(): Promise<void> {
  const activeTxs = useTxStore
    .getState()
    .txs.filter((t) => t.uiState !== "finalized" && t.uiState !== "failed");

  if (activeTxs.length === 0) return;

  await Promise.allSettled(activeTxs.map((t) => pollOne(t.txHash)));
}

let pollerHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the global polling loop. Idempotent: calling it twice has no
 * additional effect. Call once at app mount.
 *
 * Returns a `stop` function for symmetry; in practice the app does not
 * need to stop the poller, but stopping is useful for tests.
 */
export function startTxPoller(): () => void {
  if (pollerHandle !== null) {
    return stopTxPoller;
  }
  // Kick off an immediate poll on start so the user sees state without
  // waiting a full interval after returning to a tab.
  void pollAll();
  pollerHandle = setInterval(() => {
    void pollAll();
  }, TX_POLL_INTERVAL_MS);
  return stopTxPoller;
}

export function stopTxPoller(): void {
  if (pollerHandle !== null) {
    clearInterval(pollerHandle);
    pollerHandle = null;
  }
}
