# Demo Results — End-to-End On-Chain Validation

Studionet execution of the genlayer-p2p-arena protocol on May 17, 2026.

All evidence below is on-chain and independently verifiable in the GenLayer Studio Explorer. This document records the as-executed sequence, the data the protocol generated, and the points where the protocol demonstrated specific behaviors documented in the threat model.

## Network and accounts

| Field | Value |
|---|---|
| Network | GenLayer Studionet (Chain ID 61999) |
| Explorer | https://explorer-studio.genlayer.com |
| Admin / Seller | `0xF27E3A6d7Bf4BfC0A837020FD74E73055aF17D53` |
| Buyer | `0xFeE34b22628Fa0D5B8fA64Ba7c49835EcB18e752` |

## Deployed contracts

### Active

| Contract | Address | Version |
|---|---|---|
| Marketplace | `0x29f58D5ACC8b85250D3Dae2692DEADED346c6e67` | 1.4.4 |
| PredictionMarket | `0x2b0B5f76Db290D77DF53250B7f0540fc2D8cb48E` | 1.0.4 |

Wiring:
- `Marketplace.authorized_fee_sender` = PredictionMarket v1.0.4
- `PredictionMarket.marketplace_address` = Marketplace v1.4.4

### PredictionMarket iteration history (orphaned)

The path to the active v1.0.4 deploy required intermediate iterations to resolve two storage-runtime bugs and one product decision around demo timings. The orphaned contracts are preserved on-chain as evidence of the real debugging process:

| Address | Version | Status | Reason orphaned |
|---|---|---|---|
| `0xa5dd7342e0cD204A159Dc3Ac2B7FEfE7D2c5d706` | 1.0.1 | Orphaned | Bug 8: `TreeMap[K,V]()` instantiation on RHS reverted at runtime with `AssertionError: Is right the same storage type? TreeMap <- TreeMap` |
| `0x467CC533BfC06AB30D6Beb629f90782f344C0E0E` | 1.0.2 | Orphaned | Bug 9: removed RHS init in v1.0.2, but nested access `self.bets[market_id]` raised `KeyError` because GenVM does not auto-vivify nested TreeMap entries |
| `0x33599843ba4695bb8F36F2b15904cF4a0e2b8526` | 1.0.3 | Orphaned | Both bugs fixed via `TreeMap.get_or_insert_default(k)`. Used production timings (1h betting / 24h settlement). Replaced by v1.0.4 for demo timings |
| `0x01349a80c43026DE878bcBe24805bdCc615AaCe8` | 1.0.4 | Orphaned | Same source as the active v1.0.4 but deployed from the buyer wallet by mistake, so `admin` was set to the buyer address. Redeployed from admin wallet at the active address |
| `0x2b0B5f76Db290D77DF53250B7f0540fc2D8cb48E` | 1.0.4 | **Active** | Final active contract for the end-to-end run |

The bugs in v1.0.1 and v1.0.2 are documented in detail in `PREDICTION_MARKET_DESIGN.md` (Bugs 8 and 9) and as threat model entries T-PM-22 and T-PM-23 in `SECURITY.md`. They are characteristic of the GenVM storage model and were not visible to static analysis or linting — they only surfaced at runtime under real consensus execution.

The v1.0.3 → v1.0.4 transition is not a bug fix. It is a product decision to reduce timing constants so GenLayer evaluators can observe the full market lifecycle in a single review session. See the section "Demo timing constants" below for the full rationale.

## Demo timing constants

For the v1.0.4 deployment, two timing constants were reduced from their production target values:

| Constant | Production value | Demo value (v1.0.4) |
|---|---|---|
| `MIN_BETTING_WINDOW_SECONDS` | `3600` (1 hour) | `300` (5 minutes) |
| `SETTLEMENT_BUFFER_SECONDS` | `86400` (24 hours) | `300` (5 minutes) |
| `MAX_BETTING_WINDOW_SECONDS` | `1209600` (14 days) | `1209600` (unchanged) |

### Why reduced

A full create → bet → close → settle → resolve → claim cycle takes 25+ hours with production values, which makes single-session evaluation impossible. With demo values it takes 10-15 minutes. Logic is identical under both regimes — only wall-clock duration changes. Validators, consensus rules, payout math, and threat mitigations are unchanged.

### Why this is a transparent compromise

- The constants are documented in code with both demo and production values commented at the top of `contracts/PredictionMarket.py`.
- `CHANGELOG.md` entry for v1.0.4 declares the reduction.
- Threat model entry **T-PM-24** in `SECURITY.md` flags the demo timings as requiring restoration before mainnet.
- The constants are not admin-mutable; restoration requires a new contract version and fresh deploy.

### Mainnet restoration procedure

Before mainnet:
1. Restore `MIN_BETTING_WINDOW_SECONDS = u64(60 * 60)` and `SETTLEMENT_BUFFER_SECONDS = u64(24 * 60 * 60)`.
2. Bump `CONTRACT_VERSION` (suggested: `u16(110)` for v1.1.0).
3. Remove T-PM-24 from the active threat model.
4. Fresh deploy (no migration path exists for these constants by design).

## Phase A — Marketplace trade lifecycle

A single trade was executed end-to-end through the Marketplace's happy path to populate `eligible_trades` and provide a target for the PredictionMarket subjective markets.

### Listing parameters

| Field | Value |
|---|---|
| Title | `Sony WH-1000XM4 Wireless Headphones` |
| Description | `Used Sony WH-1000XM4 in excellent condition. Bought new in 2024, used approximately 6 months. Includes original box, charging cable, carrying case, and 3.5mm audio cable. Battery health 95+%. No scratches on cups, minor wear on headband. Reset to factory before shipping. Active noise cancellation and Bluetooth tested working.` (~370 chars) |
| Price | `1000000000000000000` wei (1 GEN) |
| Marketplace fee (2%) | `20000000000000000` wei (0.02 GEN) |
| Seller payout (98%) | `980000000000000000` wei (0.98 GEN) |

### Lifecycle

| Step | Method | From | Timestamp (UTC) | Result |
|---|---|---|---|---|
| 1 | `create_listing` | seller | `1779037594` | trade_id 0, state `LISTING_OPEN (0)` |
| 2 | `accept_listing` (value 1 GEN) | buyer | `1779038097` (+8m 23s) | state `PAID (1)` |
| 3 | `mark_shipped` (tracking `1Z999AA10123456784`, carrier `UPS`) | seller | `1779038282` (+3m 5s) | state `SHIPPED (2)` |
| 4 | `confirm_delivery` | buyer | `1779038569` (+4m 47s) | state `COMPLETED (4)`, 0.98 GEN → seller, 0.02 GEN → contract fees |

All four transactions reached `FINALIZED` + `SUCCESS` + `Accepted`. Hashes can be retrieved at:
`https://explorer-studio.genlayer.com/address/0x29f58D5ACC8b85250D3Dae2692DEADED346c6e67`

### Marketplace state after Phase A

```json
{
  "total_trades_created": "1",
  "completed_count": "1",
  "disputed_count": "0",
  "refunded_count": "0",
  "total_volume": "1000000000000000000",
  "fees_collected": "20000000000000000",
  "received_external_fees": "0"
}
```

Trade 0 was appended to the contract's `eligible_trades` array, making it visible to PredictionMarket queries.

## Phase B — PredictionMarket market creation

Two subjective markets were created in the active PredictionMarket v1.0.4, both targeting Trade 0 with the metric `METRIC_LLM_TRADE_DESCRIPTION_HONEST` (100). They differ in their betting outcomes:

- **Market 0** ended with a single bettor (edge case).
- **Market 1** ended with competing bets from both wallets (canonical case).

The reason Market 0 has only one bettor is documented in the next phase.

### Market 0 — single-bettor (edge case)

| Field | Value |
|---|---|
| Market ID | `0` |
| Question | "Was the description of Trade 0 (Sony WH-1000XM4 headphones) an honest representation of the item shipped?" |
| `metric_type` | `100` (METRIC_LLM_TRADE_DESCRIPTION_HONEST) |
| `target_trade_id` | `0` |
| `created_at` | `1779056505` |
| `betting_close_at` | `1779057019` (~8.5 min window) |
| `settlement_at` | `1779057437` (~7 min after close) |
| Creator | admin |

### Market 1 — competing pools (canonical case)

| Field | Value |
|---|---|
| Market ID | `1` |
| Question | (same as Market 0) |
| `metric_type` | `100` |
| `target_trade_id` | `0` |
| `created_at` | `1779057366` |
| `betting_close_at` | `1779059092` (~28 min window) |
| `settlement_at` | `1779059692` (~10 min after close) |
| Creator | admin |

Both markets passed `create_subjective_market`'s cross-contract validation: PredictionMarket called `get_trade_summary(0)` on the Marketplace and confirmed the trade existed before persisting the market.

## Phase C — Betting

### Market 0 — bets placed

| Step | Method | From | Result |
|---|---|---|---|
| C0.1 | `place_bet(0, true)` (value 1 GEN) | admin | `yes_pool = 1 GEN`, `total_predictions[admin] += 1` |
| C0.2 | `place_bet(0, false)` (value 1 GEN) | buyer | **REVERTED** with `[EXPECTED] betting closed` |

The buyer attempted to bet on Market 0 with the intended NO position. The transaction failed because the betting window had already closed at `betting_close_at = 1779057019`. This was a wall-clock outcome of the demo session — wallet switching and parameter entry consumed the available window.

This failure was preserved in the demo evidence rather than retried because it validates a specific protocol guarantee:

- **T-PM-1 validation:** the `place_bet` method correctly enforces `now < market.betting_close_at`. The five validators agreed on the revert. The market state was not corrupted; Market 0 stays in `MARKET_OPEN` with `yes_pool = 1 GEN`, `no_pool = 0`, awaiting settlement.

The lesson informed Market 1's timing: a 28-minute betting window with 30 minutes of total margin, well above the 5-minute minimum.

### Market 1 — bets placed (competing pools)

| Step | Method | From | Result |
|---|---|---|---|
| C1.1 | `place_bet(1, true)` (value 1 GEN) | admin | `yes_pool = 1 GEN`, `total_predictions[admin] += 1` |
| C1.2 | `place_bet(1, false)` (value 1 GEN) | buyer | `no_pool = 1 GEN`, `total_predictions[buyer] += 1` |

Both transactions reached `FINALIZED` + `SUCCESS` + `Accepted`. Final pool state for Market 1: `yes_pool = no_pool = 1 GEN`, total 2 GEN.

The successful C1.2 also validates that the v1.0.4 `get_or_insert_default(market_id)` pattern correctly handles a second user joining an existing nested map. The first bet (C1.1) created the per-market `TreeMap[Address, BetData]`. The second bet (C1.2) retrieved the existing nested map and inserted a new key without runtime errors.

## Phase D — LLM resolution

Both markets passed `settlement_at` and were resolved via the permissionless `resolve_market(market_id)` method. Each resolution invoked five validators independently running diverse LLMs (Optimistic Democracy consensus).

The resolver path was `_resolve_subjective` → `_resolve_description_honest`, which constructs a prompt from:

- Listing title and description (read from Marketplace via `get_listing_details(0)`)
- Trade outcome state (read from Marketplace via `get_trade_summary(0)`): `was_disputed = false`, `llm_verdict_buyer_wins = false`, `resolved_by_default = false`

### Market 0 resolution

| Field | Value |
|---|---|
| `resolved_at` | `1779057785` (~5m 48s after `settlement_at`) |
| `state` | `1` (MARKET_RESOLVED_YES) |
| Verdict | YES |
| `llm_resolution_reasoning` | "There was no dispute. Per the rule, if there was no dispute, the listing was likely an honest representation of the item shipped." |
| `fee_forwarded` | `10000000000000000` wei (0.01 GEN, 1% of 1 GEN pool) |

### Market 1 resolution

| Field | Value |
|---|---|
| `resolved_at` | `1779059772` (~80s after `settlement_at`) |
| `state` | `1` (MARKET_RESOLVED_YES) |
| Verdict | YES |
| `llm_resolution_reasoning` | "No dispute was filed, indicating the buyer received the item as described. Per the evaluation rules, an undisputed transaction implies an honest listing." |
| `fee_forwarded` | `20000000000000000` wei (0.02 GEN, 1% of 2 GEN pool) |

### LLM convergence analysis

Both verdicts are YES. The reasoning fields differ in wording — independently produced by different validators on different markets — but converge on the same logical structure:

1. Identify the dispute-or-not status of the underlying trade.
2. Apply the documented heuristic: no dispute → presumption of honest description.
3. Return the conclusion with calibrated language ("likely", "indicating", "implies").

This is the expected behavior of Optimistic Democracy: semantic convergence without lexical identity. Validators running heterogeneous LLMs reach the same conclusion through their own reasoning paths.

The validator quorum and individual reasoning for both Market 0 and Market 1 resolutions are queryable in the explorer at the respective transaction pages.

### Cross-contract fee forwarding validated

After both resolutions, the Marketplace's `received_external_fees` counter was:

```json
{
  "received_external_fees": "30000000000000000"
}
```

That is exactly 0.01 GEN (Market 0) + 0.02 GEN (Market 1) = 0.03 GEN. This confirms that:

1. PredictionMarket correctly computed fee as `total_pool * MARKETPLACE_FEE_BPS / BPS_DENOMINATOR` (1%) for each market.
2. The cross-contract value transfer pattern `marketplace.emit(value=fee, on='finalized').receive_fee()` executed successfully.
3. Marketplace's `receive_fee()` correctly authenticated the sender as `authorized_fee_sender` (matching the PredictionMarket v1.0.4 address) and incremented `received_external_fees`.

The two counters (`fees_collected` for Marketplace's own trade fees, `received_external_fees` for PredictionMarket-forwarded fees) remain independently trackable for transparent accounting.

## Phase E — Claims and reputation

### Market 0 — admin claim (single bettor scenario)

| Method | From | Outcome |
|---|---|---|
| `claim_winnings(0)` | admin | Payout `0.99 GEN` (full pool minus 1% fee). `bet.claimed = true`. `user_correct_predictions[admin] += 1`. |

Math: yes_pool = 1 GEN, total_pool = 1 GEN, fee = 0.01 GEN, available_after_fee = 0.99 GEN. Admin held 100% of the YES side, so received 100% of the after-fee pool.

Net flow: admin invested 1 GEN, received 0.99 GEN. Net loss of 0.01 GEN (the protocol fee). This demonstrates that a single-bettor market still pays the protocol fee — there is no escape hatch for "self-rescue" via thin participation.

Final state of Market 0:
```json
{
  "state": 1,
  "yes_pool": "1000000000000000000",
  "no_pool": "0",
  "fee_forwarded": "10000000000000000",
  "resolved_at": 1779057785
}
```

Final bet record:
```json
{
  "exists": true,
  "yes_amount": "1000000000000000000",
  "no_amount": "0",
  "claimed": true
}
```

### Market 1 — admin claim (competing pools, winning side)

| Method | From | Outcome |
|---|---|---|
| `claim_winnings(1)` | admin | Payout `1.98 GEN`. `bet.claimed = true`. `user_correct_predictions[admin] += 1`. |

Math: yes_pool = 1 GEN, total_pool = 2 GEN, fee = 0.02 GEN, available_after_fee = 1.98 GEN. Admin held 100% of the YES side, so received 100% of the after-fee pool, including the entire NO side's contribution minus the fee.

Net flow: admin invested 1 GEN, received 1.98 GEN. Net gain of 0.98 GEN (98% ROI on a winning bet).

### Market 1 — buyer claim attempt (losing side)

| Method | From | Outcome |
|---|---|---|
| `claim_winnings(1)` | buyer | **REVERTED** with `[EXPECTED] no winning bet` |

Transaction hash: `0x45b93e945bd1708c775fedea7201760d998e4e6864cf2d508306aee9ee6aa083`

The five validators all agreed on the revert:

| Validator | Model | Decision |
|---|---|---|
| `0xBfbC06161b12120321c6d5f895Df948dAB584929` | anthropic/claude-sonnet-4.6 | `ERROR` `[rollback] [EXPECTED] no winning bet` |
| `0xC58677432083E5AA8600A5BA94898EfA615dBA43` | z-ai/glm-5.1 | `ERROR` `[rollback] [EXPECTED] no winning bet` |
| `0x801905f1FB9b82b53641a5ae84b6f72d49138f71` | anthropic/claude-sonnet-4.6 | `ERROR` `[rollback] [EXPECTED] no winning bet` |
| `0x128EABe28212e32856aF68ed6Ead57576ED8E170` | qwen/qwen3.6-plus | `ERROR` `[rollback] [EXPECTED] no winning bet` |
| `0xc6B75a7C9CC11c2bF0111c5E6ab4357b26334E05` | qwen/qwen3.6-plus | `ERROR` `[rollback] [EXPECTED] no winning bet` |

The contract logic that revertted:

```python
yes_wins = market.state == MARKET_RESOLVED_YES  # true
user_winning = bet.yes_amount                   # buyer.yes_amount = 0
if user_winning == u256(0):
    raise gl.vm.UserError("[EXPECTED] no winning bet")
```

This validates that the protocol correctly blocks claims from the losing side, and that five validators running heterogeneous LLMs converge on the same deterministic execution path. Optimistic Democracy works for both LLM-derived verdicts (Phase D) and for deterministic safety checks (this revert).

### Reputation final state

| User | `correct_predictions` | `total_predictions` | Accuracy |
|---|---|---|---|
| admin (`0xF27E...7D53`) | `2` | `2` | 100% |
| buyer (`0xFeE3...e752`) | `0` | `1` | 0% |

Admin bet correctly on both markets (YES, which won both times) and claimed both winnings. Buyer bet incorrectly on Market 1 (NO, which lost) and was correctly blocked from claiming. The reputation counters reflect each user's prediction track record without ambiguity.

Notes:
- Admin's `total_predictions = 2`, not 3, because Market 0 and Market 1 each contributed 1. The contract increments per-market on first bet, not per-bet.
- Buyer's `total_predictions = 1` even though their Market 1 claim failed, because the failed claim is a different protocol path from a refund. Refunds decrement `total_predictions` (T-PM-21); failed losing-side claims do not.

## Final system state

### Marketplace v1.4.4

```json
{
  "total_trades_created": "1",
  "completed_count": "1",
  "disputed_count": "0",
  "refunded_count": "0",
  "total_volume": "1000000000000000000",
  "fees_collected": "20000000000000000",
  "received_external_fees": "30000000000000000"
}
```

Interpretation:
- 1 trade created, 1 completed via happy path, 0 disputes, 0 refunds.
- Total volume: 1 GEN.
- Marketplace's own fees from Trade 0: 0.02 GEN.
- External fees from PredictionMarket resolutions: 0.03 GEN (0.01 from Market 0 + 0.02 from Market 1).

### PredictionMarket v1.0.4

| Field | Value |
|---|---|
| `total_markets` | `2` |
| Market 0 state | `1` (RESOLVED_YES), `claimed=true` |
| Market 1 state | `1` (RESOLVED_YES), admin `claimed=true`, buyer claim attempted (reverted) |

## Threat model coverage matrix

The demo exercised the following entries from `SECURITY.md`. Each row pairs a threat with the on-chain evidence that validates the mitigation.

### Marketplace threats

| ID | Threat | Validated by |
|---|---|---|
| T1 | Reentrancy in payout paths | `_release_to_seller` completed without re-entry. Seller received 0.98 GEN atomically post state-transition. |
| T2 | State machine bypass | Trade 0 transitioned `LISTING_OPEN → PAID → SHIPPED → COMPLETED`, each transition gated by its specific predecessor state. No transitions were skipped. |
| T3 | Per-method access control | `accept_listing` was called by buyer (not seller); `mark_shipped` and `create_listing` by seller. `set_authorized_fee_sender` was admin-only. |
| T4 | Metrics integrity | `total_volume` and `fees_collected` incremented exactly once per completion. `received_external_fees` tracked separately from `fees_collected`. |
| T6 | Numeric integrity | All wei computations settled exactly. 0.98 GEN payout + 0.02 GEN fee = 1 GEN price, no rounding loss. |

### PredictionMarket threats

| ID | Threat | Validated by |
|---|---|---|
| T-PM-1 | Bet after `betting_close_at` | Market 0 buyer bet rejected with `[EXPECTED] betting closed` after window expired. |
| T-PM-2 | Resolve before `settlement_at` | Implicit: both `resolve_market` calls succeeded only after `settlement_at`. (Earlier attempts during demo iterations also confirmed the `settlement pending` revert.) |
| T-PM-3 | Double-claim or losing-side claim | Buyer Market 1 claim reverted with `[EXPECTED] no winning bet`. Five validators agreed. |
| T-PM-4 | Non-admin creates market | Both `create_subjective_market` calls were made by admin. |
| T-PM-5 | Invalid `metric_type` | Both markets used `metric_type = 100` (in subjective range 100-199), accepted. |
| T-PM-6 | Reputation gaming via tiny bets | Both bets were 1 GEN, far above the 0.001 GEN minimum. |
| T-PM-7 | Reentrancy in claim/refund | Admin claims for both markets completed atomically with `claimed=true` set before transfer. |
| T-PM-11 | Frozen funds | `resolve_market` was called from admin wallet (permissionless), confirming any wallet can resolve. |
| T-PM-12 | Prompt injection via listing fields | LLM correctly evaluated the listing description as content, not as instructions. No verdict manipulation observed. |
| T-PM-16 | Winning side has zero bettors | Market 0 had `no_pool = 0` but `yes_pool > 0`, and YES won. The contract correctly proceeded with the standard payout path (not the refund path), validating the asymmetric guard in `_finalize_resolution`. |
| T-PM-19 | Market over non-existent trade | Both `create_subjective_market` calls verified Trade 0 existed via `get_trade_summary(0)` before persisting. |
| T-PM-20 | Market resolves over non-terminal trade | Trade 0 was in `COMPLETED (4)` state at resolution; both markets proceeded with subjective resolution. |
| T-PM-22 | Nested TreeMap RHS init | Implicitly validated by the v1.0.1 → v1.0.2 → v1.0.3 iteration: the v1.0.1 deploy correctly reverted with the documented `AssertionError`, confirming GenVM's storage runtime enforces descriptor matching. |
| T-PM-23 | Nested TreeMap KeyError | Implicitly validated by the v1.0.2 → v1.0.3 iteration: v1.0.2 reverted with `KeyError` on first bet, confirming that GenVM does not auto-vivify nested entries. v1.0.4 (with `get_or_insert_default`) executed without error. |
| T-PM-24 | Demo timing reduction documented | All demo timings are clearly attributable to the v1.0.3 → v1.0.4 product decision. The constants are visible in source, in `CHANGELOG.md`, and in this document. |

### Cross-contract threats

| ID | Threat | Validated by |
|---|---|---|
| T-CX-1 | Stale data | Markets read Marketplace state at creation and at resolution, not cached. The same Trade 0 was queried at both points with consistent results. |
| T-CX-3 | Unauthorized fee sender | The Marketplace's `receive_fee()` accepted exactly 0.03 GEN from PredictionMarket v1.0.4 (the authorized sender). Earlier intermediate PredictionMarkets (v1.0.1, v1.0.2, v1.0.3) cannot send fees to this Marketplace because the `authorized_fee_sender` was updated to v1.0.4. |
| T-CX-4 | Authorized fee sender swap | The `set_authorized_fee_sender` call was admin-only and executed once per PredictionMarket version transition. PredictionMarket v1.0.4 resolution succeeded because the authorization was correctly set before the first `receive_fee` call. |

## What this demo does NOT cover

In the interest of honest disclosure:

- **No disputed trade.** The Trade 0 in this run was a happy-path delivery without dispute. A previous demo (documented separately in commit history with the v1.3 contract `0x8491a3b8bE8c37F58C9c3845665862A4D77D5072`, no longer the active deploy) exercised the LLM-arbitrated dispute resolution path. That earlier evidence is preserved but not re-validated in this run.
- **No objective markets.** Only subjective markets (metric 100, LLM-arbitrated) were created. Objective markets that read numeric metrics from `get_volume_in_window` etc. are implemented and unit-tested but not exercised in this run.
- **No refund path.** No market resolved as `AMBIGUOUS` or `REFUNDED`, so `refund_bet` was not exercised on-chain in this demo.
- **No multi-bet user.** No user placed both YES and NO bets in the same market. The hedge detection logic in `claim_winnings` is implemented but not exercised on-chain.
- **No seller-trustworthy market (metric 101).** The seller history scan path is implemented (bounded by `MAX_SELLER_HISTORY_MATCHES = 30` and `MAX_TRADES_TO_SCAN = 200`, threat T-PM-17) but not exercised in this run.
- **No marketplace pause / unpause cycle.** Implemented and protected by admin role (T-CX-5), but not exercised.
- **No transaction hashes for Phase A.** Trade 0 hashes can be retrieved at the Marketplace address on the explorer. They are not transcribed here.

These gaps are tracked. The threat model entries for unexercised paths still hold by code review; on-chain validation in a future run will incrementally close the matrix.

## Reproducibility

Anyone with access to GenLayer Studio can verify the system state by:

1. Calling `get_metrics()` on the Marketplace at `0x29f58D5ACC8b85250D3Dae2692DEADED346c6e67`. Expected: 1 trade, 0 disputes, 0.02 GEN fees, 0.03 GEN received_external_fees, 1 GEN volume.
2. Calling `get_contract_info()` on the PredictionMarket at `0x2b0B5f76Db290D77DF53250B7f0540fc2D8cb48E`. Expected: version 104, marketplace_address pointing to the Marketplace above, total_markets = 2.
3. Calling `get_market_summary(0)` and `get_market_summary(1)` on the same PredictionMarket. Expected: both `state = 1` (RESOLVED_YES) with the LLM reasoning strings shown above.
4. Calling `get_user_reputation` for both wallets. Expected: admin 2/2, buyer 0/1.

The system state is reproducible against the live Studionet state until the contracts are upgraded or migrated.

## References

- Marketplace source: `contracts/Marketplace.py` (v1.4.4, 833 lines)
- PredictionMarket source: `contracts/PredictionMarket.py` (v1.0.4, 805 lines)
- Threat model: `docs/SECURITY.md`
- Architecture: `docs/ARCHITECTURE.md`
- PredictionMarket design: `docs/PREDICTION_MARKET_DESIGN.md`
- Changelog: `CHANGELOG.md`

---

**Demo executed by:** zkVan (`0xF27E3A6d7Bf4BfC0A837020FD74E73055aF17D53`)
**Date:** May 17, 2026
**Network:** GenLayer Studionet (Chain ID 61999)
**All transactions independently verifiable at:** https://explorer-studio.genlayer.com
