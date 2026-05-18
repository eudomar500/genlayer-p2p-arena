# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This repository hosts two contracts versioned independently:

- `contracts/Marketplace.py`: current version `1.4.4`
- `contracts/PredictionMarket.py`: current version `1.0.4`

Each version entry lists the contracts whose source changed in that entry. Documentation, scripts, and tests are tracked separately under each version.

## [Unreleased]

End-to-end Studionet validation completed on May 17, 2026. Two prediction markets resolved via LLM consensus. Full evidence in `docs/DEMO_RESULTS.md`. Next milestone: restore production timing constants in v1.1.0 in preparation for mainnet.

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
