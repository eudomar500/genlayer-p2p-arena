# Transaction Lifecycle and TX Tracking System

This document describes the transaction tracking system used by the PointMarket
frontend on Bradbury and the mapping between GenLayer protocol states and the
UI states that the user sees.

## Why this system exists

Bradbury transactions take roughly twenty-five minutes to traverse the
Finality Window from initial submission to FINALIZED. During that window a
single transaction passes through multiple protocol states and the user may
submit additional transactions in parallel. A naive "fire and forget" UI
that only displays a hash after submission would leave the user without any
feedback for the duration of the window and would not survive a page refresh.

The TX tracking system addresses three concrete problems:

1. Multi-step progress feedback while a write is in flight, so the user
   understands the transaction is moving rather than stuck.
2. Persistence across reloads. A user who refreshes the page mid-window does
   not lose visibility into the transactions they submitted.
3. Multi-transaction tracking. A single user session may have several writes
   in flight at the same time. The drawer keeps all of them visible.

The system is a UX cache. It is not the source of truth for any business
state. The contract on Bradbury remains the only authority on whether a
listing was created, a bet was placed, or a payout was issued.

## GenLayer transaction states

The protocol exposes fourteen states through the `TransactionStatus` enum in
genlayer-js. The states relevant to writes from this frontend, in normal
forward order, are:

| Index | Name                | Meaning                                                                 |
|-------|---------------------|-------------------------------------------------------------------------|
| 0     | UNINITIALIZED       | Default value before the receipt is populated.                          |
| 1     | PENDING             | Transaction received by the node, not yet picked by a leader.           |
| 2     | PROPOSING           | A leader is preparing the transaction for consensus.                    |
| 3     | COMMITTING          | Validators are committing votes.                                        |
| 4     | REVEALING           | Validators are revealing their votes.                                   |
| 5     | ACCEPTED            | Transaction was accepted by consensus. Still inside the Finality Window.|
| 6     | UNDETERMINED        | Consensus could not reach a verdict.                                    |
| 7     | FINALIZED           | Transaction is final. Finality Window expired without a successful appeal.|
| 8     | CANCELED            | Transaction was canceled before reaching consensus.                     |
| 9     | APPEAL_REVEALING    | An appeal is in progress, revealing phase.                              |
| 10    | APPEAL_COMMITTING   | An appeal is in progress, committing phase.                             |
| 11    | READY_TO_FINALIZE   | Internal state used by the node before transitioning to FINALIZED.      |
| 12    | VALIDATORS_TIMEOUT  | Validators did not respond in time.                                     |
| 13    | LEADER_TIMEOUT      | Leader did not respond in time.                                         |

For determinism, the frontend declares this order locally as `STATUS_NAMES`
in `lib/tx/poller.ts` rather than relying on `tx.statusName` from the SDK.
See the section on SDK quirks below.

## Mapping to UI states

The fourteen protocol states are collapsed into four UI states that the
drawer and the progress bar work with:

| UI state    | Source protocol states                                                                  | Meaning shown to user             |
|-------------|------------------------------------------------------------------------------------------|-----------------------------------|
| submitted   | UNINITIALIZED, PENDING, PROPOSING, COMMITTING, REVEALING                                | "Submitted, waiting on consensus" |
| accepted    | ACCEPTED, READY_TO_FINALIZE, APPEAL_REVEALING, APPEAL_COMMITTING                        | "Accepted, awaiting finality"     |
| finalized   | FINALIZED                                                                                | "Finalized"                       |
| failed      | UNDETERMINED, CANCELED, VALIDATORS_TIMEOUT, LEADER_TIMEOUT                              | "Failed"                          |

The collapse happens in `mapRawStatusToUiState` inside `lib/tx/poller.ts`.
The three nominal milestones in the UI are submitted -> accepted -> finalized.
A transaction in `failed` is rendered with an `XCircle` icon instead of the
progress bar.

The accepted-versus-finalized distinction matters because payouts in the
Marketplace and Prediction Market contracts are emitted on FINALIZED, not on
ACCEPTED. The drawer reflects this so users understand why funds have not
moved yet even though the transaction is "accepted."

## Architecture: eight modules

The system is split across `frontend/lib/tx/` and `frontend/components/tx/`.

### `lib/tx/types.ts`

Type definitions only. Exports `TxUiState`, `TxRawStatus`, `TxMethod` (the
enum of all 24 write methods this frontend will eventually track), and
`PendingTx`. Also exports the two operational constants:

- `TX_TTL_MS = 2 * 60 * 60 * 1000` (two hours). Transactions older than this
  are evicted from the store on next cleanup.
- `TX_POLL_INTERVAL_MS = 30_000` (thirty seconds). How often the poller
  refreshes each non-terminal transaction.

### `lib/tx/store.ts`

Zustand store with `persist` middleware writing to `localStorage` under the
key `pointmarket-pending-txs`, schema version 1. Exposes:

- `addTx` -- idempotent insert. If a hash already exists the call is a no-op.
- `updateTx` -- partial merge by hash.
- `removeTx` -- by hash.
- `clearAll` -- for debugging and a future user-facing "clear history" action.
- Selectors for active transactions versus terminal transactions.

The store is the only place that touches localStorage. Every other module
reads or writes through these actions.

### `lib/tx/poller.ts`

A single `setInterval` that runs every thirty seconds while the app is
mounted. On each tick it iterates the store's non-terminal transactions and
calls the SDK's `getTransaction` for each, using `Promise.allSettled` so that
one failing call does not stop the others. The raw status from the receipt
is normalized through `mapRawStatusToUiState` and the store is updated.

Exports `STATUS_NAMES` so that `cleanup.ts` can reuse the same enum order.

### `lib/tx/cleanup.ts`

Runs once on mount. Two responsibilities:

1. TTL eviction. Any transaction older than `TX_TTL_MS` is removed from the
   store regardless of state.
2. Reconciliation on cold start. For every non-terminal transaction in
   storage, immediately fetch the current state from the chain. This handles
   the case where the user closed the tab in `submitted` and reopens it
   thirty minutes later. Without this step the drawer would show a stale
   state until the next poll tick.

### `components/tx/TxRuntime.tsx`

Client wrapper that mounts the cleanup runner, the poller, and the drawer.
It also subscribes to the store and, when a transaction transitions into a
terminal state during the session, fires a single sonner toast via
`toast.success` or `toast.error`. The toast is the only ephemeral surface;
the drawer remains as a durable history list.

### `components/tx/TxDrawer.tsx`

Fixed at bottom-right of the viewport (`bottom-4 right-4`). Hidden when the
store is empty. Auto-expands for five seconds when a new transaction is
added so the user sees the start of the lifecycle without having to open
anything. Caps visible entries at six; older entries are scrollable.

### `components/tx/TxItem.tsx`

A single row in the drawer. Shows method label (from `METHOD_LABELS`),
truncated hash (`6+4` characters), elapsed time, and the progress bar.
Failed transactions render an `XCircle` instead of the bar.

### `components/tx/TxProgressBar.tsx`

A three-step stepper rendered horizontally inside each `TxItem`. The three
steps correspond to the three nominal milestones: submitted, accepted,
finalized. The `stepStatus` function accepts a `totalSteps` argument; when
the UI state is terminal (`finalized`) every step is rendered as `done`.

## End-to-end flow

Walking through `create_listing` as the canonical example:

1. User clicks "Create listing" in the marketplace header. The
   `CreateListingButton` opens `CreateListingDialog` via `createPortal`.
   The portal is required because Lenis smooth scroll breaks normal
   `position: fixed` modals.

2. User fills title, description, and price, then clicks the submit button.
   The dialog calls `useWriteWithTracking` which verifies the connected
   chainId is 4221, builds a write client via
   `createWriteClient("testnetBradbury", address)`, and invokes the SDK's
   `writeContract`.

3. The SDK returns a transaction hash. `useWriteWithTracking` calls
   `addTx({ hash, method: "create_listing", chainId: 4221, createdAt: now })`.
   The drawer becomes visible if it was hidden, auto-expands for five
   seconds, and renders the new `TxItem` in `submitted` state.

4. Thirty seconds later the poller fires its first tick. It calls
   `getTransaction(hash)`, reads the raw status from the receipt, maps it
   through `mapRawStatusToUiState`, and calls `updateTx`. The progress bar
   advances if the state changed.

5. Roughly one to two minutes after submission the transaction reaches
   ACCEPTED. The UI state collapses to `accepted`. The middle step in the
   stepper turns done and the rightmost step turns active.

6. Approximately twenty-five minutes after submission the Finality Window
   expires and the transaction transitions to FINALIZED. The UI state
   becomes `finalized`. All three steps render as done. `TxRuntime`
   detects the terminal transition and fires `toast.success`.

7. The user can click the explorer link on the `TxItem` at any point to
   verify the on-chain state directly at
   `https://explorer-bradbury.genlayer.com/tx/{hash}`.

If the user closes the tab between steps 4 and 6 and returns later,
`cleanup.ts` runs on mount, reads the persisted store, and immediately
fetches fresh receipts for any non-terminal entries. The drawer reflects
the current state within seconds of page load rather than waiting for the
next poll tick.

## Adding a new write

The pattern for the twenty-three remaining writes mirrors `create_listing`:

1. Add the method name to the `TxMethod` union in `lib/tx/types.ts`.
2. Add a human-readable label in `METHOD_LABELS` inside `TxItem.tsx`.
3. Build a thin wrapper hook in `lib/hooks/` that uses
   `useWriteWithTracking`. The hook takes typed arguments specific to the
   contract method and forwards them to the SDK write.
4. Build a UI surface for the write. For inline actions (a row-level
   "Cancel" button on an open listing) this is a small handler. For
   multi-field writes (creating a market, opening a dispute) this is a
   dialog component that mirrors `CreateListingDialog`.
5. Wire the surface into the relevant page or row component.

The polling, persistence, drawer rendering, and toast firing are handled
generically by the existing modules. There is no per-method polling logic.

Order suggested for replicating: `cancel_listing` is the simplest because it
takes only a `trade_id` and needs no dialog, only a confirmation. After that
the buyer-side flow (`accept_listing` -> `mark_shipped` -> `confirm_delivery`),
then disputes, then markets, then bets, then admin functions.

## Bradbury quirks worth documenting

### Finality Window is approximately twenty-five minutes

Validators emit appeals between ACCEPTED and FINALIZED. The exact length
varies with network conditions but plan UI copy and tests around
twenty-five minutes as the working figure. Do not assume FINALIZED arrives
seconds after ACCEPTED. Payouts in both contracts deliberately fire on
FINALIZED, not ACCEPTED, so the user-visible wait for funds matches the
visible wait in the drawer.

### Public RPC throttles concurrent gen_call

The hosted RPC at `rpc-bradbury.genlayer.com` rejects rapid concurrent reads
with `LimitExceededRpcError`. The first encounter with this was the
`useAllTrades` hook firing `Promise.all` over two trades and four parallel
reads, which intermittently emptied the marketplace list. The fix pattern,
already applied in `useAllTrades`, is the working template for any future
hook that reads several items:

- Serialize reads in a `for` loop instead of `Promise.all`.
- Insert a `sleep(250)` between consecutive calls.
- Wrap each call in `withRateLimitRetry` (one to three retries with
  one-second backoff steps).
- Make per-item failure recoverable by returning `null` and filtering at
  the end, so a single throttled read does not collapse the whole query.

Once the marketplace has more than a handful of items, the right answer is
batched reads through a future helper or a backend indexer. The current
pattern is explicitly a small-scale workaround and is commented as such in
the code.

### SDK statusName is undefined at runtime

The genlayer-js receipt type declares a `statusName` field but in practice
the runtime object only contains the numeric `status`. The SDK's internal
`transactionsStatusNumberToName` helper is not re-exported from the package
index, so we cannot import it. The frontend works around this by declaring
its own `STATUS_NAMES` array in `lib/tx/poller.ts`, indexed by the order of
the `TransactionStatus` enum, and looking up names locally via
`STATUS_NAMES[receipt.status]`. Any code reading status names from receipts
must use this lookup; reading `receipt.statusName` directly will yield
`undefined`.

### Always link to the explorer after a write

After any successful write the user gets a link of the form
`https://explorer-bradbury.genlayer.com/tx/{hash}`. The drawer renders this
automatically through `NETWORKS[DEFAULT_NETWORK].explorerUrl + "/tx/" + hash`.
Avoid hardcoding the explorer URL anywhere else and avoid the
`/transactions/` path; the correct prefix is `/tx/`.

## Why localStorage is acceptable here

GenLayer's design ethos is trust-everything-on-chain. PointMarket extends
that ethos with a separate `PointMarketLeaderboard` contract rather than an
off-chain indexer. Storing transaction metadata in `localStorage` may at
first read like a contradiction, so the boundary deserves to be drawn
explicitly.

The TX tracking store contains four kinds of fields per transaction:
the hash, the method name, the timestamp of submission, and the
currently-known UI state. Three of these are either already public on chain
(hash, method, timestamp via the receipt) or pure UI annotation (the
collapsed UI state). None of these fields would be authoritative if they
disagreed with the chain. If a user clears their browser cache and
revisits the marketplace, every business fact they care about is still on
chain. They lose visibility into the in-flight progress bar for any
transactions they had open, which is mildly inconvenient but not a state
loss.

In other words, this localStorage cache is doing the work a desktop client
would do in process memory, with the addition that closing the tab does not
destroy it. It is not a substitute for on-chain state, it does not need to
be Byzantine-fault-tolerant, and it never gates a user action that requires
trust. Everything that requires trust still goes through a contract call.

If at some point a richer history is needed (filterable by date range,
shareable across devices, queryable from another wallet), the right path is
an on-chain history surface or a contract event indexer, not an expansion
of localStorage. This module should remain a thin UX layer.
