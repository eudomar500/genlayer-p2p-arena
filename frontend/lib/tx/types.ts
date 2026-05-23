/**
 * Transaction tracking types for the GenLayer Finality Window UX.
 *
 * GenLayer transactions go through 13 internal states (see docs/TX_LIFECYCLE.md
 * for the full list). The UI surfaces only 3 of them as user-facing steps,
 * grouped from the underlying states:
 *
 *   submitted  = transaction sent, awaiting first validator round
 *                covers: PENDING, PROPOSING, COMMITTING, REVEALING
 *   accepted   = initial validator set agreed, inside Finality Window
 *                covers: ACCEPTED, READY_TO_FINALIZE, APPEAL_REVEALING,
 *                        APPEAL_COMMITTING
 *   finalized  = Finality Window closed, transaction is immutable
 *                covers: FINALIZED
 *
 * Failure states (CANCELED, UNDETERMINED, VALIDATORS_TIMEOUT,
 * LEADER_TIMEOUT) collapse into `failed`. UNINITIALIZED is a transient
 * placeholder before submission.
 */

export type TxUiState = "submitted" | "accepted" | "finalized" | "failed";

export type TxRawStatus =
  | "UNINITIALIZED"
  | "PENDING"
  | "PROPOSING"
  | "COMMITTING"
  | "REVEALING"
  | "ACCEPTED"
  | "READY_TO_FINALIZE"
  | "APPEAL_REVEALING"
  | "APPEAL_COMMITTING"
  | "FINALIZED"
  | "UNDETERMINED"
  | "CANCELED"
  | "VALIDATORS_TIMEOUT"
  | "LEADER_TIMEOUT";

/**
 * Labels for the contract method being called. Used to render
 * human-readable descriptions in the drawer (e.g. "Create listing").
 * Keep in sync with frontend/lib/genlayer/writes.ts.
 */
export type TxMethod =
  | "create_listing"
  | "cancel_listing"
  | "accept_listing"
  | "mark_shipped"
  | "confirm_delivery"
  | "claim_after_window"
  | "claim_unshipped_refund"
  | "open_dispute"
  | "respond_to_dispute"
  | "claim_dispute_default"
  | "force_refund_stuck_dispute"
  | "claim_stuck_dispute_refund"
  | "create_subjective_market"
  | "create_objective_market"
  | "place_bet"
  | "resolve_market"
  | "claim_winnings"
  | "refund_bet"
  | "pause_marketplace"
  | "unpause_marketplace"
  | "pause_prediction_market"
  | "unpause_prediction_market"
  | "withdraw_fees"
  | "withdraw_external_fees";

/**
 * One transaction tracked in the drawer. Persisted to localStorage by
 * the Zustand store. The `txHash` is the unique identifier; submittedAt
 * powers the TTL cleanup (2h).
 */
export interface PendingTx {
  txHash: string;
  method: TxMethod;
  uiState: TxUiState;
  rawStatus: TxRawStatus;
  submittedAt: number;
  lastPolledAt: number;
  context?: string;
}

/**
 * TTL for tracked transactions in localStorage. Anything older than this
 * is removed at app load without notification. 2 hours covers a normal
 * Bradbury Finality Window (~25-40 min) plus generous margin for appeals.
 */
export const TX_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Polling interval for individual TXs. The poller queries the RPC at
 * this rate until the TX reaches FINALIZED or a failure state.
 */
export const TX_POLL_INTERVAL_MS = 30 * 1000;
