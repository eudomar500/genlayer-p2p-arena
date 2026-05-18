# Architecture

System-level documentation for `genlayer-p2p-arena`. Covers contract topology, cross-contract communication, state machines, storage model, and trust assumptions.

## Topology

Two singleton contracts on GenLayer:

```
Marketplace.py (v1.4.4)         PredictionMarket.py (v1.0.1)
  singleton                       singleton
  hosts all trades                hosts all markets
  emits objective metrics         creates markets over Marketplace state
  arbitrates disputes via LLM     resolves objective via Marketplace views
  collects 2% per trade           resolves subjective via LLM consensus
  receives external fees          forwards 1% of pool to Marketplace
```

The two contracts run independently. Trades on the Marketplace work without the PredictionMarket existing. Markets on the PredictionMarket require the Marketplace as a data source. The dependency is one-way.

### Why singleton, not factory

An earlier design used a factory pattern (one Marketplace contract per trade). It was discarded for the following reasons:

1. **Cost.** Each trade required a separate deploy with full bytecode.
2. **Observability.** Aggregate metrics required scanning a registry of N contracts.
3. **Cross-contract reads.** PredictionMarket would need to enumerate every trade contract to compute objective metrics, multiplying gas/consensus cost by N.
4. **Upgradability.** Fixing a bug in a deployed trade contract was impossible without forking the registry.

The singleton model concentrates all trades in `Marketplace.trades: TreeMap[u256, TradeData]` and all markets in `PredictionMarket.markets: TreeMap[u256, MarketData]`, indexed by sequential IDs. Metrics are derived from the singleton's storage in O(1) (`get_metrics`) or O(N) bounded by `MAX_ELIGIBLE_TRADES_LOOKBACK = 1000` (`get_*_in_window`). Upgrades are handled through each contract's `upgrade(new_code: bytes)` method, gated by admin.

## Deployed addresses (Studionet, chain 61999)

| Contract | Address | Version |
|---|---|---|
| Marketplace | `0x29f58D5ACC8b85250D3Dae2692DEADED346c6e67` | 1.4.4 |
| PredictionMarket | `0x2b0B5f76Db290D77DF53250B7f0540fc2D8cb48E` | 1.0.4 |

Wiring:
- `Marketplace.authorized_fee_sender = PredictionMarket address`
- `PredictionMarket.marketplace_address = Marketplace address`

Both wiring writes are one-time setup. `set_marketplace_address` is hard-coded as one-shot in PredictionMarket (cannot be changed once set; cannot be set after the first market is created). `set_authorized_fee_sender` is admin-mutable on Marketplace but documented as set-once at integration time.

### Intermediate PredictionMarket iterations (orphaned)

The path from v1.0.1 to v1.0.4 required three intermediate deploys to address two bugs surfaced only by on-chain execution and one product decision around demo timings. These intermediate contracts are deployed on Studionet but are not active; they hold no funds and have no users:

| Address | Version | Status |
|---|---|---|
| `0xa5dd7342e0cD204A159Dc3Ac2B7FEfE7D2c5d706` | 1.0.1 | Orphaned. `TreeMap[K,V]()` RHS instantiation bug in `place_bet` |
| `0x467CC533BfC06AB30D6Beb629f90782f344C0E0E` | 1.0.2 | Orphaned. Fix attempt failed; `KeyError` on nested TreeMap access |
| `0x33599843ba4695bb8F36F2b15904cF4a0e2b8526` | 1.0.3 | Orphaned. Both bugs fixed via `get_or_insert_default`, production timings (1h / 24h) |
| `0x2b0B5f76Db290D77DF53250B7f0540fc2D8cb48E` | 1.0.4 | **Active**. Fixes from v1.0.3 + reduced demo timings (5min / 5min) |

The intermediate contracts are preserved on-chain as evidence of the iterative debugging process. They each demonstrate a single observable issue:

- **v1.0.1 -> v1.0.2:** revealed that GenVM's storage runtime rejects `TreeMap[K, V]()` instantiation on the RHS of a nested map assignment, with descriptor mismatch enforcement at the `__type_desc__` level. The error is correct: a freshly-instantiated map has no storage descriptor matching the parent slot.

- **v1.0.2 -> v1.0.3:** revealed that the GenVM TreeMap does not auto-vivify nested entries on read (unlike Python's `defaultdict`). Accessing `self.bets[market_id]` for an absent `market_id` raises `KeyError` immediately. The canonical SDK method for lazy nested initialization is `TreeMap.get_or_insert_default(k)`.

- **v1.0.3 -> v1.0.4:** product decision (not a bug). Reduced `MIN_BETTING_WINDOW_SECONDS` and `SETTLEMENT_BUFFER_SECONDS` from production targets (1h, 24h) to demo values (5min, 5min) so that evaluators can observe the full market lifecycle in a single session. Restoration to production values is part of the mainnet preparation checklist. Documented in `docs/PREDICTION_MARKET_DESIGN.md` section "Demo timings disclosure".

## Cross-contract communication

### Read path: PredictionMarket -> Marketplace

PredictionMarket declares a typed interface and instantiates it at the Marketplace address held in storage:

```python
@gl.contract_interface
class MarketplaceIface:
    class View:
        def get_metrics(self) -> dict: ...
        def get_eligible_trade_count_in_window(self, window_start: u64, window_end: u64) -> dict: ...
        def get_volume_in_window(self, window_start: u64, window_end: u64) -> dict: ...
        def get_dispute_rate_in_window_bps(self, window_start: u64, window_end: u64) -> dict: ...
        def get_avg_price_in_window(self, window_start: u64, window_end: u64) -> dict: ...
        def get_trade_summary(self, trade_id: u256) -> dict: ...
        def get_listing_details(self, trade_id: u256) -> dict: ...
    class Write:
        def receive_fee(self) -> None: ...

# usage
marketplace = MarketplaceIface(self.marketplace_address)
summary = marketplace.view().get_trade_summary(target_trade_id)
```

`.view()` calls are synchronous within the consensus context. They return dicts that the resolver inspects for `truncated`, `total_count == 0`, and other edge conditions before acting.

### Write path: PredictionMarket -> Marketplace (fee forwarding)

When a market resolves to a winner, PredictionMarket forwards 1% of the total pool to the Marketplace via a payable cross-contract call:

```python
marketplace = MarketplaceIface(self.marketplace_address)
marketplace.emit(value=fee, on='finalized').receive_fee()
```

Pattern per the [official value transfer docs](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers). The call is asynchronous (`on='finalized'`) and idempotent. On the Marketplace side, `receive_fee()` validates:

1. `gl.message.value > 0`: rejects zero-value calls.
2. `authorized_fee_sender != 0x00..00`: rejects if integration was not configured.
3. `gl.message.sender_address == authorized_fee_sender`: rejects unauthorized senders.

Successful calls increment `received_external_fees` (a separate counter from the native `fees_collected` of the Marketplace's own trade fees). Both counters are independently withdrawable by the admin via `withdraw_fees` and `withdraw_external_fees`.

### Why `receive_fee` instead of `__receive__`

GenLayer supports a special `__receive__` method that is called automatically when a contract receives value with no specified method. The Marketplace originally used this pattern.

Two problems forced the migration to an explicit `receive_fee()` method:

1. **Studio incompatibility.** Studio's schema extractor fails with `Could not load contract schema` when a contract uses `__receive__`. The Marketplace became unusable in Studio for debugging.
2. **Linter false positive.** `genvm-lint v0.10.0` flags `__receive__` as `requires @gl.public.write decorator` even when decorated correctly with `@gl.public.write.payable`.

An explicit `receive_fee()` method with `@gl.public.write.payable` resolves both issues and is the pattern used in production protocols (Polymarket, Aave, Uniswap all use explicit receivers rather than fallback functions).

## Marketplace state machine

```
                +----------+
                |  LISTING |
                |   OPEN   | (state = 0)
                +----+-----+
                     |
        +------------+--------------+
        |                           |
    accept_listing            cancel_listing
        | (payable)                 |
        v                           v
   +---------+              +-----------+
   |  PAID   |              | CANCELLED |
   | (s = 1) |              |  (s = 5)  |
   +----+----+              +-----------+
        |
   +----+----------------+
   |                     |
mark_shipped     claim_unshipped_refund
   |                     | (after 30d)
   v                     v
+---------+         +----------+
| SHIPPED |         | REFUNDED |
| (s = 2) |         | (s = 6)  |
+----+----+         +----------+
     |
     +--------------------+--------------------+----------------+
     |                    |                    |                |
confirm_delivery   claim_after_window     open_dispute    (no action)
     |                    | (after 7d)        | (payable, w/bond)
     v                    v                    v
+-----------+        +-----------+      +-----------+
| COMPLETED |        | COMPLETED |      | DISPUTED  |
|  (s = 4)  |        |  (s = 4)  |      |  (s = 3)  |
+-----------+        +-----------+      +-----+-----+
                                              |
                +-----------------------------+----------------------+
                |                             |                      |
       respond_to_dispute            claim_dispute_default    force/public refund
                | (payable, w/bond,            | (after 14d)         | (after 30d/90d)
                |  triggers LLM)               |                      |
                v                              v                      v
            COMPLETED                      COMPLETED              REFUNDED
        (with LLM verdict)             (with default judgment)
```

Three terminal states: `COMPLETED (4)`, `CANCELLED (5)`, `REFUNDED (6)`.

The LLM dispute resolver runs only on `respond_to_dispute`. If the disputed party fails to respond within `DISPUTE_RESPONSE_WINDOW_SECONDS = 14 days`, the initiator can claim by default judgment with a 5% penalty on their bond. If both parties are stuck (no resolution path runs), admin can force a 50/50 refund after 30 days, and any caller can after 90 days.

### Fee distribution

- **Happy path (`confirm_delivery` or `claim_after_window`):** 98% to seller, 2% to `fees_collected`.
- **Dispute, seller wins:** seller gets (price - fee) + their bond + buyer's bond; 2% fee retained.
- **Dispute, buyer wins:** buyer gets full price + their bond + seller's bond; no fee charged.
- **Dispute default judgment (buyer wins by default):** buyer gets price + (their bond - 5% penalty); penalty added to `fees_collected`.
- **Dispute default judgment (seller wins by default):** seller gets (price - fee) + (their bond - 5% penalty); penalty added to `fees_collected`.
- **Stuck refund (admin or public):** price split 50/50 between buyer and seller, plus each party's bond returned.
- **Unshipped refund:** full price to buyer, no fee charged.

## PredictionMarket state machine

```
                       +---------+
                       |  OPEN   |  (state = 0)
                       | (accepting bets until betting_close_at)
                       +----+----+
                            |
                            | resolve_market (after settlement_at)
                            v
            +-------------------+----------------+
            |                   |                |
            v                   v                v
    +--------------+    +-------------+   +----------+
    | RESOLVED_YES |    | RESOLVED_NO |   | REFUNDED |
    |   (s = 1)    |    |   (s = 2)   |   |  (s = 3) |
    +-------+------+    +------+------+   +-----+----+
            |                  |                |
            v                  v                v
      claim_winnings    claim_winnings    refund_bet
        (YES bettors)    (NO bettors)    (any bettor)
```

Three terminal states. No state transitions out of terminal.

Refund conditions:
- Objective metric returned `truncated: true`
- Objective `DISPUTE_RATE` or `AVG_PRICE` with zero trades in window
- Subjective LLM returned `AMBIGUOUS`
- Subjective target trade not in terminal state at resolution time
- Subjective seller history scan returned zero matches
- Winning pool is empty (no bettors on the winning side)

## Storage model

### Marketplace

```
trades: TreeMap[u256, TradeData]
  // sequential trade IDs; never recycled
  // each TradeData stores full lifecycle data including
  // listing fields, evidence blobs, bond amounts, LLM verdict

first_seen: TreeMap[Address, u64]
  // records first interaction timestamp per address
  // used by eligibility window queries

eligible_trades: DynArray[u256]
  // append-only list of trade_ids that completed via the happy
  // path (release_to_seller). Used by all four window-aware
  // views with MAX_ELIGIBLE_TRADES_LOOKBACK = 1000 cap.
  // Disputed trades are NOT added. Disputes are excluded
  // from eligibility for objective markets.

counters: u256 each
  next_trade_id, fees_collected, received_external_fees,
  completed_count, disputed_count, refunded_count, total_volume
```

### PredictionMarket

```
markets: TreeMap[u256, MarketData]
  // sequential market IDs; never recycled

bets: TreeMap[u256, TreeMap[Address, BetData]]
  // bets[market_id][user] = BetData
  // BetData includes yes_amount, no_amount, claimed flag

user_correct_predictions: TreeMap[Address, u256]
user_total_predictions: TreeMap[Address, u256]
  // reputation counters; see PREDICTION_MARKET_DESIGN.md for rules

counters: u256, Address each
  next_market_id, marketplace_address, admin
```

### Storage growth and cleanup

The MVP does not implement pruning. Storage grows monotonically with trade and market count. Two mitigations:

1. **Bounded iteration.** Window-aware views iterate at most `MAX_ELIGIBLE_TRADES_LOOKBACK = 1000` records, regardless of total trade count. Markets older than the lookback are simply unreachable for windowed queries; they remain in storage but cease to affect aggregate metrics.
2. **`truncated` flag.** When the lookback cap is hit, views return `truncated: true`. PredictionMarket refunds any market whose resolution depends on a truncated metric. This forces honesty: when storage exceeds the cap, the protocol stops producing inferences over old data rather than producing wrong inferences.

Cleanup primitives (state pruning, archive) are deferred to a future contract version.

## Trust assumptions

### Admin powers

The admin (deployer by default; transferable via `transfer_admin`) on each contract can:

**Marketplace:**
- `pause` / `unpause` (halts new listings, accepts, dispute opens)
- `withdraw_fees` (both native and external)
- `transfer_admin`
- `upgrade` (replaces bytecode)
- `set_authorized_fee_sender` (mutable; documented as set-once)
- `force_refund_stuck_dispute` (after 30d)

**PredictionMarket:**
- `pause` / `unpause` (halts new bets and market creation)
- `transfer_admin`
- `upgrade`
- `create_objective_market` / `create_subjective_market` (admin-only in MVP)
- `set_marketplace_address` (one-shot, irrevocable after first market)

Admin cannot:
- Modify trade or market data
- Move user funds (bonds, payments, bets)
- Override LLM verdicts
- Change market outcomes
- Skip cooling-off windows

### Validator assumptions

GenLayer validators are responsible for executing the contract under Optimistic Democracy. The protocol assumes:

- A majority of the validator set is honest at the time of any specific consensus round.
- The LLMs run by validators produce semantically convergent outputs for clear cases (dispute resolutions, market questions). The leader-validator pattern in `gl.vm.run_nondet_unsafe` enforces validator-side classification matching the leader.s verdict; disagreement reverts the transaction.

The protocol does NOT assume:
- Validators run identical LLMs (heterogeneous models is the design goal).
- LLMs are correct in all cases (genuinely ambiguous cases route to `AMBIGUOUS` -> refund).
- LLMs cannot be prompt-injected (mitigated by sentinel delimiters + data-not-instructions guidance; not eliminated).

### User assumptions

The protocol assumes users:
- Verify the deployed addresses before interacting (the addresses in this document and the README are authoritative).
- Read listing descriptions before accepting trades; descriptions are evidence in disputes and LLM judgments.
- Submit honest evidence in disputes; fabricated evidence is detectable by validators and adverse rulings carry bond loss.
- Place bets they understand; markets resolve on objective Marketplace state or LLM consensus, both of which are documented.

## Failure modes and recovery

| Failure | Recovery |
|---|---|
| Marketplace dispute deadlocked (both parties unresponsive) | Admin force refund after 30 days; any caller after 90 days |
| Marketplace listing never shipped | Buyer claims unshipped refund after 30 days |
| Marketplace LLM consensus split | Transaction reverts; party retries; if persistent, falls into stuck-dispute path |
| PredictionMarket objective metric truncated | Market refunds automatically at resolution |
| PredictionMarket subjective LLM consensus split | Transaction reverts; permissionless `resolve_market` allows retry |
| PredictionMarket LLM verdict AMBIGUOUS | Market refunds automatically; users call `refund_bet` |
| Fee forward to Marketplace reverts | PredictionMarket `_finalize_resolution` reverts; user retries `resolve_market`. Marketplace's `receive_fee` will only revert if integration is misconfigured, which is a deploy-time concern |
| Contract bug requiring code change | Admin calls `upgrade(new_code)`; storage preserved across upgrade |

## Future work referenced from this design

- **Permissionless market creation with bond:** allow non-admin users to create PredictionMarket markets. Requires anti-spam bond.
- **Eligibility scanning beyond 1000 records:** off-chain indexer + cryptographic commitment scheme to prove metrics over arbitrary history.
- **Multi-outcome markets:** binary YES/NO is sufficient for MVP. Multi-bucket markets useful for price ranges, time buckets.
- **Marketplace dispute appeals:** current resolution is final. An appeal layer (different validator subset, different LLM tier) is plausible.
- **Cross-chain settlement:** the GenLayer side is the source of truth. EVM-side wrappers for buyer/seller off-ramps are future scope.
