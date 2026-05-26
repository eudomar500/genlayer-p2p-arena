# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This repository hosts two contracts versioned independently:

- `contracts/Marketplace.py`: current version `1.4.7`
- `contracts/PredictionMarket.py`: current version `1.1.5`

Each version entry lists the contracts whose source changed in that entry. Frontend changes are tracked under dated phase entries below. Documentation, scripts, and tests are tracked separately under each version.

## [Unreleased]

Phase F (write integration on Bradbury) in progress. The Marketplace happy path is covered end-to-end with five writes integrated and validated in vivo: `create_listing`, `cancel_listing`, `accept_listing`, `mark_shipped`, `confirm_delivery`.

20 writes remain pending in the frontend: 7 disputes and claims, 6 PredictionMarket, 6 admin. Next milestone: extend the `TradeActionsPanel` pattern to cover the disputes block. Validation of disputes is blocked by production timing constants on the live v1.4.7 contract; a demo deployment with reduced timing constants is planned.

## [Demo contracts] (2026-05-26)

### MarketplaceDemo.py and PredictionMarketDemo.py

Parallel demo variants of the production contracts (`Marketplace.py` and `PredictionMarket.py`). Created to enable rapid end-to-end validation of dispute and prediction flows on Bradbury without waiting for production timing windows (7 to 90 days for Marketplace, 30 min to 24h for PredictionMarket).

Originals untouched. Logic, storage layout, function signatures, decorators, types, and structure identical between each pair. Only timing constants and `CONTRACT_VERSION` differ.

### MarketplaceDemo.py

Reserved demo version `u16(900)`. Timing reductions:

| Constant | Production | Demo |
|---|---|---|
| `UPGRADE_TIMELOCK_SECONDS` | 48h | 5 min |
| `DISPUTE_WINDOW_SECONDS` | 7 days | 5 min |
| `DISPUTE_RESPONSE_WINDOW_SECONDS` | 14 days | 5 min |
| `ELIGIBILITY_PERIOD_SECONDS` | 7 days | 5 min |
| `MAX_SHIPPING_DELAY_SECONDS` | 30 days | 5 min |
| `ADMIN_FORCE_REFUND_DELAY_SECONDS` | 30 days | 10 min |
| `PUBLIC_FORCE_REFUND_DELAY_SECONDS` | 90 days | 15 min |

Cascade preserved: dispute window < response window < admin force refund < public force refund.

### PredictionMarketDemo.py

Reserved demo version `u16(901)`. Timing reductions:

| Constant | Bradbury current | Demo |
|---|---|---|
| `UPGRADE_TIMELOCK_SECONDS` | 48h | 5 min |
| `MIN_BETTING_WINDOW_SECONDS` | 30 min | 5 min |
| `MAX_BETTING_WINDOW_SECONDS` | 24h | 1h |
| `SETTLEMENT_BUFFER_SECONDS` | 1h | 5 min |

Inline comment block extended to document all timing profiles: production mainnet, Testnet Bradbury current, Studionet demo (legacy), Testnet Bradbury demo.

### Status

Files committed in `feat/contracts-demo-timings`. Not deployed to Bradbury yet. Deployment of demo contracts and frontend integration to support a network switch (production v1.4.7 versus demo v900/v901) tracked as next steps in the disputes validation roadmap.

## [Frontend Phase F continued] (2026-05-25)

### PR #16: `confirm_delivery` write flow

Buyer-side delivery confirmation that closes the trade and releases the escrow. The contract enforces `msg.sender == buyer` and state `SHIPPED`. `ConfirmDeliveryButton` surfaces the releasing amount and warns the action is final. `TradeActionsPanel` gains `canConfirm`. With four actions in the panel, the role and state matrix is fully exercised. Validated on Bradbury with trade #2.

### PR #15: `mark_shipped` write flow plus per-trade busy state

Seller-side shipping step with `carrier` and `tracking` text fields. Contract enforces length bounds (carrier 1-50, tracking 4-100) mirrored client-side. First action with a true form rather than a confirmation modal. Adds a double-submit guard: while any tracked transaction for a trade is in flight, every action button on its panel renders disabled. The store gains a `selectActiveByContext` selector consumed via `useMemo` to avoid the Zustand infinite-loop warning.

### PR #14: `accept_listing` write flow with role-aware actions

Buyer side of the marketplace primary flow. Payable call: `accept_listing` takes `trade_id` and the contract enforces `msg.value == trade.price`. `AcceptListingButton` hides for the seller. Modal surfaces the trade title and the exact GEN amount before signing. `TradeActionsPanel` now hosts two actions side by side via `canCancel` and `canAccept` flags. Validated on Bradbury with two wallets: seller saw only Cancel; a fresh buyer saw only Buy now with the price inline.

## [Frontend Phase F - Actions panel pattern] (2026-05-24)

### PR #13: `cancel_listing` write flow with actions panel

Establishes the pattern for the remaining 22 writes. `TradeActionsPanel` attaches to the right column of `/trade/[id]` and collapses to null when no action applies for the connected wallet and state. `useCancelListing` wraps `useWriteWithTracking`. Preconditions duplicated in the UI to avoid wasted transactions that would revert on chain. Confirm modal rendered via `createPortal` to sidestep Lenis smooth-scroll interference with `position: fixed`. `useTrade` gains a `TradeDetail` export for downstream action components.

## [Frontend Phase F - TX tracking system] (2026-05-23)

### PR #12: chore drop executable bit from TX_LIFECYCLE.md

Mode-only change. The bit was inherited from the source filesystem on initial commit and had no functional effect.

### PR #11: docs TX lifecycle and tracking system

Documents the system added in PR #8: mapping between GenLayer protocol states and the four UI states, the eight modules under `lib/tx` and `components/tx`, the end-to-end flow, and the pattern for replicating write integrations. Captures Bradbury-specific quirks: the ~25 minute Finality Window, public RPC throttling on concurrent `gen_call`, the SDK `statusName` field undefined at runtime, and the explorer URL convention.

### PR #10: fix tolerate Bradbury RPC rate limit when loading trades

The marketplace list was empty whenever the public Bradbury RPC throttled a `gen_call` request. The hook fired all listing and trade summary reads in parallel through `Promise.all`. Three changes make the read path resilient: sequential reads with a 250 ms gap, `withRateLimitRetry` with backoff (1s, 2s, 3s) on `LimitExceededRpcError`, and failure isolation (`fetchTradeBundle` returns `TradeListItem | null`, queryFn filters nulls).

### PR #9: `create_listing` write flow with tracking integration

First interactive write path on the marketplace. `lib/tx/useWriteWithTracking.ts` is the generic hook used by all 24 writes: verifies wallet and `chainId`, builds the write client, runs the write, and registers the resulting tx hash with the tracking store. `CreateListingDialog` validates title (1-100), description (1-500), price (0 to 1000 GEN) client-side. SDK quirk fix: `genlayer-js` declares `statusName` on receipts but does not populate it consistently. Code now reads `receipt.status` (numeric) and maps it through a local `STATUS_NAMES` array indexed by the `TransactionStatus` enum order. `TxProgressBar` fix: all three steps render as done at `finalized`.

### PR #8: transaction tracking for GenLayer Finality Window

GenLayer transactions stay in `ACCEPTED` for roughly 25 minutes on Bradbury while the appeal window runs, then settle to `FINALIZED`. The UI surfaces this lifecycle so users can submit a write, navigate away, and still see the progress. Architecture is 8 modules. `lib/tx/store.ts` is a Zustand store with `persist` to localStorage under `pointmarket-pending-txs`. `lib/tx/poller.ts` runs every 30 s, reconciles all active TXs in parallel via `waitForTransactionReceipt` with `retries: 1`. `mapRawStatusToUiState` collapses 14 protocol states into 4 UI states. `lib/tx/cleanup.ts` runs once at app load, drops TXs older than 2 hours, reconciles surviving active TXs against the RPC. `components/tx/TxRuntime.tsx` is mounted at the layout root and fires sonner toasts on terminal transitions. `QueryProvider` adjustments: `staleTime` 60s to 5 min, retry 1 to 3 with exponential backoff (1s, 2s, 4s, max 10s), `gcTime` 10 min.

## [Frontend Phase F - Bradbury wiring] (2026-05-21)

### PR #7: wire hooks and UI to active network (Bradbury)

Replaces hardcoded `studionet` references with dynamic `DEFAULT_NETWORK` lookups across `useAllTrades`, `useMarketplaceMetrics`, `useProfileStats`, `useTrade`, `lib/wallet/balance.ts`, `lib/wallet/format.ts`, and `NetworkSwitchBanner`. Fixes a bug where marketplace and profile views read from Studionet after `DEFAULT_NETWORK` was changed to `testnetBradbury`.

### PR #6: point at Bradbury LIVE deployment

Network metadata and contract addresses updated for Testnet Bradbury. `testnetBradbury` `chainId` 4222 to 4221 (verified via `genlayer network info`). RPC `testnet-bradbury.genlayer.com/api` to `rpc-bradbury.genlayer.com`. Explorer `explorer.genlayer.com` to `explorer-bradbury.genlayer.com`. Status planned to active. Addresses populated with deployed Marketplace v1.4.7 and PredictionMarket v1.1.5. `DEFAULT_NETWORK` `studionet` to `testnetBradbury`. PR note: Bradbury and Asimov share chainId 4221 but use independent RPC endpoints and consensus contracts.

## [Bradbury migration] (2026-05-21)

The primary deployment target moved from GenLayer Studionet (Chain 61999) to GenLayer Testnet Bradbury (Chain 4221). Studionet addresses in earlier entries remain archival. Live addresses for the project live in `frontend/lib/genlayer/contracts.ts` under the `testnetBradbury` key. Deployments to Bradbury were performed manually with the `genlayer` CLI. No deploy script was committed for these deployments.

### PR #5: contracts Marketplace v1.4.7 and PredictionMarket v1.1.5 mainnet-ready

Mainnet-ready contracts merged to main via the `feat/contracts-bradbury-v1.4.7` branch. Detail below.

## [v1.4.7 / PM v1.1.5] (2026-05-21)

### Marketplace 1.4.7: Mainnet-ready hardening

Hardening pass for production deployment. Storage layout is not upgrade-compatible with prior versions; mainnet must be a fresh deploy.

Two-step ownership transitions:

- `transfer_admin` stages a `pending_admin`. The new admin must call `accept_admin` to claim the role. Admin can call `cancel_pending_admin` to revert before acceptance.
- `set_authorized_fee_sender` stages a `pending_fee_sender`. The new fee sender must call `accept_fee_sender` to claim the role. Admin can call `cancel_pending_fee_sender` or `clear_authorized_fee_sender` for cleanup paths.

Upgrade timelock:

- New constant `UPGRADE_TIMELOCK_SECONDS = u64(48 * 60 * 60)`.
- `upgrade` replaced by `propose_upgrade`, `execute_upgrade`, and `cancel_pending_upgrade`. `propose_upgrade` stores the new code in `pending_upgrade_code` and sets `upgrade_unlock_at = now + UPGRADE_TIMELOCK_SECONDS`. `execute_upgrade` can only be called by admin once the timelock has passed.

Hardening fixes:

- L1: `receive_fee` now checks pause state.
- L2: `dispute_initiator` is initialized to `_ZERO_ADDRESS` instead of the seller placeholder.
- `get_contract_info` exposes `pending_fee_sender`, `pending_admin`, `upgrade_unlock_at`, and `has_pending_upgrade`.

Address parameter cleanup:

- `set_authorized_fee_sender`, `transfer_admin`, `withdraw_fees`, and `withdraw_external_fees` accept `Address` directly. Inline `Address(input)` conversion at the boundary was removed.

Eligible trades index fixes (described in the commit message as "from prior audit v146"):

- `_payout_dispute_seller_wins` appends to `eligible_trades`.
- `_payout_dispute_default` seller-wins branch appends to `eligible_trades`.
- `get_volume_in_window`, `get_dispute_rate_in_window_bps`, and `get_avg_price_in_window` apply the same `first_seen` eligibility filter as `get_eligible_trade_count_in_window`.

Marketplace deploy:

| Field | Value |
|---|---|
| Network | Testnet Bradbury (Chain 4221) |
| Address | `0x68546F0a8d2Af91d5917A03245c1D31296487b3F` |
| Admin | `0xF27E3A6d7Bf4BfC0A837020FD74E73055aF17D53` |
| `authorized_fee_sender` | `0x10717D9814Ace2098862299C26806a2899eAB204` |
| CONTRACT_VERSION | `u16(147)` |

Versions v1.4.5 and v1.4.6 are referenced in the v1.4.7 commit message ("from prior audit v146") but were not preserved as separate git commits. The cumulative changes from v1.4.4 to v1.4.7 are visible in commit `ea5e96e`.

### PredictionMarket 1.1.5: Mainnet-ready hardening and handshake completion

H1 fix: `_finalize_resolution` pre-validates Marketplace fee setup before emitting fee transfer. Reads `marketplace.get_contract_info()` and refunds the market if the read failed, if PM is not authorized as fee sender, or if Marketplace is paused.

H2 fix: `_resolve_subjective` filters to `STATE_COMPLETED` only. `REFUNDED` trades no longer feed into the LLM resolver, which avoids misleading verdicts on never-delivered goods.

C1 fix: new public method `accept_marketplace_fee_authorization` closes the 2-step `set_authorized_fee_sender` handshake on the Marketplace side. Without it, the Marketplace 2-step would never complete because PM as a contract cannot sign `accept_fee_sender` from its own address. `MarketplaceIface.Write` extended to declare `accept_fee_sender`.

Hardening matching Marketplace:

- 2-step `transfer_admin` with `accept_admin` and `cancel_pending_admin`.
- 48h upgrade timelock with `propose_upgrade`, `execute_upgrade`, `cancel_pending_upgrade`.
- L3: `MAX_TRADES_TO_SCAN` reduced from 200 to 100 to keep `_resolve_seller_trustworthy` within reasonable gas bounds.

Storage layout note: v1.1.5 is not upgrade-compatible with previous versions.

PredictionMarket deploy:

| Field | Value |
|---|---|
| Network | Testnet Bradbury (Chain 4221) |
| Address | `0x10717D9814Ace2098862299C26806a2899eAB204` |
| Admin | `0xF27E3A6d7Bf4BfC0A837020FD74E73055aF17D53` |
| `marketplace_address` | `0x68546F0a8d2Af91d5917A03245c1D31296487b3F` |
| CONTRACT_VERSION | `u16(115)` |

PM versions v1.0.5 through v1.1.4 were not preserved as separate git commits. The cumulative changes from v1.0.4 to v1.1.5 are visible in commit `fb44882`.

## [Frontend Phase 3] (2026-05-19)

### PR #4: read-only marketplace UI

Public marketplace listing and trade detail pages. Read-only. `/marketplace` shows aggregate stats and a dense table with search, state filter, and pagination (25 per page). `/trade/[id]` shows full detail with parties card, state badge, price, and a visual timeline. Dispute-resolved trades show the LLM verdict with reasoning. Components added: `StateBadge`, `TradeFilters`, `TradeTable`, `TradeTimeline`, `TradePartiesCard`. Data layer: `useMarketplaceMetrics`, `useAllTrades` (iterates trades client-side as a deliberate MVP approach; TODO marks the indexer migration for phase 7), `useTrade`.

## [Frontend Phase 2] (2026-05-19)

### PR #3: wallet connection and public profile drawer

EIP-6963 multi-wallet discovery, account state via Zustand, public profile drawer reading on-chain data via `genlayer-js` v1.2. Components: `ConnectWalletModal` (renders detected EIP-6963 providers with Rabby pinned via a Recommended badge, rendered through React Portal to escape `LenisProvider`), `AccountMenu`, `Identicon` (`boring-avatars` beam variant), `NetworkSwitchBanner`, `ProfileContent`. Routing uses Next.js parallel and intercepting routes: `/profile` redirects to `/u/[connected-address]`, `app/@profile/(.)u/[address]` intercepts navigation to render the profile as a slide-in drawer. SDK upgrade: `genlayer-js` 0.7.0 to 1.2.0. v0.7 did not export `studionet` as a first-class chain and routed RPC calls through simulator-specific methods that returned empty data on Studionet. Dependencies added: `zustand`, `boring-avatars`.

## [Frontend Phase 1] (2026-05-18 to 2026-05-21)

### PR #2: brand and landing page

Brand identity, landing page, and visual polish. Commits: `9f9cd18` (brand and landing) and `ecd88d5` (wordmark dot alignment, footer copy, hydration fix). No contract changes.

## [PM v1.0.4] (2026-05-17)

### PredictionMarket: Reduced timing constants for demo

- `MIN_BETTING_WINDOW_SECONDS` reduced from `60 * 60` (1 hour) to `5 * 60` (5 minutes).
- `SETTLEMENT_BUFFER_SECONDS` reduced from `24 * 60 * 60` (24 hours) to `5 * 60` (5 minutes).
- `MAX_BETTING_WINDOW_SECONDS` unchanged (14 days).
- In-code comments document both demo and production values.
- Documented as threat T-PM-24 in `SECURITY.md`. Must be restored before mainnet.

### Why this is a product decision, not a bug fix

The 1-hour and 24-hour values are calibrated for real-world user behavior (1h to deliberate on a bet) and Marketplace dispute settling time (24h max). For an evaluator to observe the full create -> bet -> resolve -> claim cycle in a single review session, those values force a 25-hour wait. The reduced values enable a ~15-minute end-to-end demo. Logic is identical; only wall-clock duration changes.

### Deployed

| Field | Value |
|---|---|
| Network | Studionet (Chain 61999) |
| Address | `0x2b0B5f76Db290D77DF53250B7f0540fc2D8cb48E` |
| Admin | `0xF27E3A6d7Bf4BfC0A837020FD74E73055aF17D53` |
| `marketplace_address` | `0x29f58D5ACC8b85250D3Dae2692DEADED346c6e67` (one-shot, immutable post-set) |
| CONTRACT_VERSION | `u16(104)` |
| Total lines | 805 |

### Marketplace: Re-wired

- `set_authorized_fee_sender` updated to point at the new PredictionMarket v1.0.4 address.

## [PM v1.0.3] (2026-05-17)

### PredictionMarket: Fixed nested TreeMap initialization

Two bugs surfaced by on-chain execution were fixed:

#### Bug 8: `TreeMap[K, V]()` instantiation on right-hand side (v1.0.1 -> attempted fix v1.0.2)

The original `place_bet` in v1.0.1 tried to lazy-create the per-market nested map with:

```python
if market_id not in self.bets:
    self.bets[market_id] = TreeMap[Address, BetData]()
```

This passed syntax and lint but reverted at runtime with `AssertionError: Is right the same storage type? TreeMap <- TreeMap` from GenVM's storage runtime. The newly-instantiated map has no storage descriptor attached to the parent slot.

v1.0.2 removed the explicit instantiation, assuming GenVM would auto-vivify on first access.

#### Bug 9: Nested TreeMap access raises KeyError (v1.0.2 -> fix v1.0.3)

The assumption in v1.0.2 was wrong. GenVM's TreeMap does NOT auto-vivify nested entries on read. Accessing `self.bets[market_id]` for an absent `market_id` raises `KeyError` immediately.

#### Final fix (v1.0.3)

Used the SDK-provided `TreeMap.get_or_insert_default(k)` API:

```python
bets_for_market = self.bets.get_or_insert_default(market_id)
if user not in bets_for_market:
    bets_for_market[user] = BetData(...)
```

This is the canonical pattern for lazy nested map initialization in GenVM. Read paths (`claim_winnings`, `refund_bet`, `get_user_bet`) were also refactored to consistently bind `bets_for_market = self.bets[market_id]` after the `if market_id not in self.bets` guard. Reference: [genlayer.py.storage.tree_map](https://sdk.genlayer.com/main/_modules/genlayer/py/storage/tree_map.html).

### Deployed

| Field | Value |
|---|---|
| Network | Studionet (Chain 61999) |
| Address | `0x33599843ba4695bb8F36F2b15904cF4a0e2b8526` |
| CONTRACT_VERSION | `u16(103)` |
| Total lines | 801 |
| Status | Orphaned. Superseded by v1.0.4 (timing reduction) |

## [PM v1.0.2] (2026-05-17)

### PredictionMarket: Attempted fix for Bug 8 (incomplete)

Removed `self.bets[market_id] = TreeMap[Address, BetData]()` from `place_bet`, assuming GenVM would auto-create the nested entry on first access. This assumption was incorrect; see Bug 9 in v1.0.3.

### Deployed

| Field | Value |
|---|---|
| Network | Studionet (Chain 61999) |
| Address | `0x467CC533BfC06AB30D6Beb629f90782f344C0E0E` |
| CONTRACT_VERSION | `u16(102)` |
| Total lines | 797 |
| Status | Orphaned. `KeyError` on first bet in a new market |

## [v1.4.4 / PM v1.0.1] (2026-05-17)

### Marketplace 1.4.4: Added

- `get_volume_in_window(window_start, window_end)` view. Returns `{volume, count, truncated, scanned, total_eligible_records}` for trades whose `delivered_at` falls in `[window_start, window_end]`.
- `get_dispute_rate_in_window_bps(window_start, window_end)` view. Returns the basis-point dispute rate over the window.
- `get_avg_price_in_window(window_start, window_end)` view. Returns the average eligible trade price over the window.

All three views iterate `eligible_trades` with the existing `MAX_ELIGIBLE_TRADES_LOOKBACK = 1000` cap and report a `truncated` flag. No storage changes from `v1.4.3`. Backward-compatible upgrade.

### Marketplace 1.4.4: Constants and structure

- `CONTRACT_VERSION = u16(144)`.
- Total lines: 833. No changes to any existing method.

### PredictionMarket 1.0.1: Initial deployment

New contract. Hosts binary prediction markets resolved against Marketplace state. Two categories:

- **Objective markets** read numeric metrics from the Marketplace's window-aware views.
- **Subjective markets** invoke LLM consensus via `gl.vm.run_nondet_unsafe` to evaluate a single trade.

Storage uses singleton `markets: TreeMap[u256, MarketData]` and nested `bets: TreeMap[u256, TreeMap[Address, BetData]]`. Reputation tracked per address.

#### Bugs fixed in v1.0.1 (pre-deployment audit)

| ID | Issue | Fix |
|---|---|---|
| 1 | Stuck funds when winning pool empty | `_finalize_resolution` refunds market if winning side has zero bettors |
| 2 | Fee forward pattern correctness | Verified `marketplace.emit(value=fee, on='finalized').receive_fee()` against official docs. Added `fee > 0` guard |
| 3 | Seller history scan DoS | Double cap: `MAX_SELLER_HISTORY_MATCHES = 30` and `MAX_TRADES_TO_SCAN = 200` |
| 4 | Objective metrics required window-aware views | Wired to the new `get_*_in_window` views on Marketplace. Each call checks `truncated` and refunds if true |
| 5 | `set_marketplace_address` was not one-shot | Two independent guards: existing non-zero address OR markets already created |
| 6 | Refunded markets penalized accuracy | `refund_bet` calls `_untrack_prediction(user)` |
| 7 | `AMBIGUOUS` LLM verdict used inline state mutation | Routes to centralized `_refund_market` |

#### PredictionMarket 1.0.1: Constants

- `CONTRACT_VERSION = u16(101)`. Total lines: 799.
- `MARKETPLACE_FEE_BPS = 100` (1% of pool to Marketplace).
- `MIN_BET_WEI = 10^15` (0.001 GEN).
- `MIN_BETTING_WINDOW_SECONDS = 3600` (1 hour).
- `SETTLEMENT_BUFFER_SECONDS = 86400` (24 hours between betting close and settlement).
- `MAX_BETTING_WINDOW_SECONDS = 14 days`.

### Marketplace 1.4.4: Deployed

| Field | Value |
|---|---|
| Network | Studionet (Chain 61999) |
| Address | `0x29f58D5ACC8b85250D3Dae2692DEADED346c6e67` |
| Admin | `0xF27E3A6d7Bf4BfC0A837020FD74E73055aF17D53` |
| `authorized_fee_sender` | PredictionMarket address |

### PredictionMarket 1.0.1: Deployed

| Field | Value |
|---|---|
| Network | Studionet (Chain 61999) |
| Address | `0xa5dd7342e0cD204A159Dc3Ac2B7FEfE7D2c5d706` |
| Admin | `0xF27E3A6d7Bf4BfC0A837020FD74E73055aF17D53` |
| `marketplace_address` | Marketplace v1.4.4 address (one-shot, immutable post-set) |
| Status | Orphaned. Bug 8 (`TreeMap[K,V]()` RHS) found during end-to-end testing |

### Documentation

- New: `docs/PREDICTION_MARKET_DESIGN.md` (378 lines). Full design: storage, API, settlement logic, pre-deployment bug audit, threat model T-PM-1 to T-PM-21.
- Rewritten: `docs/ARCHITECTURE.md` (315 lines). Singleton + cross-contract pattern, replaces the obsolete factory documentation. Documents the `receive_fee` migration from `__receive__` (Studio schema incompatibility and `genvm-lint v0.10.0` false positive).
- Extended: `docs/SECURITY.md` (370 lines). Marketplace threats T1-T8 (refreshed for v1.4.4), PredictionMarket threats T-PM-1 to T-PM-21, cross-contract threats T-CX-1 to T-CX-5.

### Removed

- Dead state `MARKET_PENDING_RESOLUTION` in PredictionMarket (collapsed into existing transitions).
- Metric `METRIC_LLM_TRADE_NO_DISPUTE` (was 101). Removed before deployment because the check is trivially objective. Subjective metric numbering compacted: `METRIC_LLM_TRADE_DESCRIPTION_HONEST = 100`, `METRIC_LLM_SELLER_TRUSTWORTHY = 101`.

## [v1.4.3] (2026-05-17)

Internal version. Not deployed. Subsumed by v1.4.4. The three window-aware Marketplace views were prototyped in v1.4.3 but not finalized; they ship in v1.4.4.

## [v1.4.2] (2026-05-17)

### Marketplace 1.4.2: Migrated from `__receive__` to `receive_fee`

- Renamed the inbound-value handler from the GenLayer special method `__receive__` to a normal `receive_fee()` method decorated with `@gl.public.write.payable`.
- Two reasons for the migration documented in `ARCHITECTURE.md`:
  1. Studio's schema extractor fails on contracts using `__receive__` (`Could not load contract schema`).
  2. `genvm-lint v0.10.0` produces a false-positive `__receive__ requires @gl.public.write decorator` error even when the dunder is correctly decorated. The lint error does not fire on the explicit method name.
- Behavior of the inbound fee handler is unchanged: validates `value > 0`, validates `sender == authorized_fee_sender`, increments `received_external_fees`.

## [v1.4.1] (2026-05-16)

### Marketplace 1.4.1: Stuck-funds gap closures

- Added `claim_unshipped_refund(trade_id)`. Allows buyer to recover their payment if the seller never ships within `MAX_SHIPPING_DELAY_SECONDS = 30 days` after payment.
- Added `claim_stuck_dispute_refund(trade_id)`. Permissionless 50/50 refund after `PUBLIC_FORCE_REFUND_DELAY_SECONDS = 90 days` if a dispute is opened but both parties remain unresponsive.
- Added `force_refund_stuck_dispute(trade_id)`. Admin can trigger the same 50/50 refund after `ADMIN_FORCE_REFUND_DELAY_SECONDS = 30 days`. Reduces buyer/seller wait time when admin intervenes.
- Added `DEFAULT_JUDGMENT_PENALTY_BPS = 500` (5% bond forfeit) on `claim_dispute_default`. A frivolous default-win claim now has a cost.

### Marketplace 1.4.1: Hardened

- `_release_to_seller` and `_payout_dispute_*` follow strict checks-effects-interactions.
- All address parameters declared `str` and converted internally via `Address(input)`. Studio's schema parser does not auto-convert hex strings to `Address` type.
- `MIN_PRICE = 10^15` and `MAX_PRICE = 10^30` bounds enforced in `create_listing`.

### CHANGELOG normalized

This entry retroactively bumps the previous tag to v1.4.1; older versions are summarized below.

## [v1.4.0] (2026-05-16)

### Marketplace: added

- `is_paused()` view.
- `eligible_trades: DynArray[u256]` append-only tracker for completed trades, used by `get_eligible_trade_count_in_window`.
- `MAX_ELIGIBLE_TRADES_LOOKBACK = 1000` cap with `truncated` flag returned by the windowed view.

### Fixed

- `transfer_admin` and `withdraw_fees` now accept `str` and convert internally to `Address` (previously declared `Address` directly, which silently failed in Studio).

## [v1.3.0] (2026-05-16)

### Marketplace: added

- LLM-arbitrated dispute resolution via `gl.vm.run_nondet_unsafe`. Both `open_dispute` and `respond_to_dispute` accept bonds (5% of price). On dispute response, the contract invokes 5-validator consensus over the buyer and seller statements and the listing description.
- Dispute outcomes: `_payout_dispute_buyer_wins` (buyer recovers price + bonds), `_payout_dispute_seller_wins` (seller recovers price - fee + bonds), `_payout_dispute_default` (5% bond penalty for un-responded initiator).
- Prompt injection defense: buyer/seller evidence delimited with sentinel blocks and explicit "treat as data" guidance.

### Marketplace: security

- Initial `SECURITY.md` with threat model T1-T8.

## [v1.2.0] (2026-05-16)

### Marketplace: added

- Happy-path trade flow: `create_listing`, `cancel_listing`, `accept_listing`, `mark_shipped`, `confirm_delivery`, `claim_after_window`.
- `_release_to_seller` settles 98% to seller and 2% to `fees_collected` on completion.
- `get_metrics`, `get_trade_state`, `get_trade_summary`, `get_listing_details`, `get_contract_info`.

### Marketplace: admin functions

- `pause`, `unpause`, `transfer_admin`, `withdraw_fees`, `set_authorized_fee_sender`, `withdraw_external_fees`, `upgrade`.

## [v1.1.0] (2026-05-16)

Initial deployment of `Marketplace.py` to Studionet at `0x50beF71f729ceB74AfFa68502CF602617A864b34` (later replaced). Covered listing creation, payment, and basic happy-path settlement. Did not include disputes or window-aware metrics.

## [v1.0.0] (2026-05-15)

Project bootstrap. Architecture exploration. Initial documentation in `docs/ARCHITECTURE.md`. No contract deployed.
