"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PendingTx, TxUiState } from "./types";

/**
 * Global store for tracked transactions. Persisted to localStorage via
 * Zustand's `persist` middleware so that TXs survive page refresh and
 * tab close. TTL cleanup happens at app load (see lib/tx/cleanup.ts);
 * this store does not enforce expiry by itself.
 *
 * Design notes:
 *
 * - The store is the single source of truth in the client; components
 *   subscribe to it via the `useTxStore` hook. The poller updates it
 *   from RPC responses (see lib/tx/poller.ts).
 *
 * - localStorage is a UX cache, not authoritative state. Clearing it
 *   loses the visible drawer entries but the transactions still exist
 *   on Bradbury and can be inspected via explorer-bradbury.genlayer.com
 *   or reconstructed by querying the RPC.
 *
 * - The persisted JSON shape includes only `txs`. If we ever need to
 *   bump the schema (e.g. add new fields to PendingTx with defaults),
 *   raise `version` and add a `migrate` function in the persist config.
 */

const STORAGE_KEY = "pointmarket-pending-txs";
const STORAGE_VERSION = 1;

interface TxStoreState {
  txs: PendingTx[];
  addTx: (tx: PendingTx) => void;
  updateTx: (
    txHash: string,
    partial: Partial<Omit<PendingTx, "txHash">>,
  ) => void;
  removeTx: (txHash: string) => void;
  clearAll: () => void;
}

export const useTxStore = create<TxStoreState>()(
  persist(
    (set) => ({
      txs: [],
      addTx: (tx) =>
        set((state) => {
          // Idempotent: if a tx with the same hash is already tracked,
          // do nothing. Prevents duplicates if a write helper is called
          // twice with the same submission (e.g. double-click).
          if (state.txs.some((t) => t.txHash === tx.txHash)) {
            return state;
          }
          return { txs: [tx, ...state.txs] };
        }),
      updateTx: (txHash, partial) =>
        set((state) => ({
          txs: state.txs.map((t) =>
            t.txHash === txHash ? { ...t, ...partial } : t,
          ),
        })),
      removeTx: (txHash) =>
        set((state) => ({
          txs: state.txs.filter((t) => t.txHash !== txHash),
        })),
      clearAll: () => set({ txs: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Only persist the tx list. Actions are recreated on every load.
      partialize: (state) => ({ txs: state.txs }),
    },
  ),
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Returns the count of TXs that have not yet finalized or failed.
 * Useful for the drawer badge.
 */
export function selectActiveCount(state: TxStoreState): number {
  return state.txs.filter(
    (t) => t.uiState !== "finalized" && t.uiState !== "failed",
  ).length;
}

/**
 * Returns the TXs in a given UI state, in submission order (newest first).
 */
export function selectTxsByUiState(
  state: TxStoreState,
  uiState: TxUiState,
): PendingTx[] {
  return state.txs.filter((t) => t.uiState === uiState);
}

/**
 * Looks up a single TX by hash. Returns undefined if not tracked.
 */
export function selectTxByHash(
  state: TxStoreState,
  txHash: string,
): PendingTx | undefined {
  return state.txs.find((t) => t.txHash === txHash);
}

/**
 * Returns the TXs currently in flight (submitted or accepted, not yet
 * finalized or failed) whose context exactly matches the provided
 * string. Used by per-trade action buttons to disable themselves while
 * a write for the same trade is being processed, preventing
 * accidental duplicate submissions during the Bradbury Finality
 * Window. Context strings are produced by useWriteWithTracking with
 * the convention "Trade #N".
 */
export function selectActiveByContext(
  state: TxStoreState,
  context: string,
): PendingTx[] {
  return state.txs.filter(
    (t) =>
      t.context === context &&
      t.uiState !== "finalized" &&
      t.uiState !== "failed",
  );
}
