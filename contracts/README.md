# Contracts

Intelligent Contracts for `genlayer-p2p-arena`, written in Python for the GenVM.

## Files

| File | Status | Purpose |
|------|--------|---------|
| `Marketplace.py` | v1 complete | Singleton marketplace. Holds all trades in storage, manages state machine per trade, invokes LLM on dispute, aggregates metrics for the prediction market. |
| `PredictionMarket.py` | next | Singleton prediction market. Holds binary markets per daily window, settles by reading `Marketplace` metrics. |

## Architecture rationale

This codebase uses a **singleton + struct-in-storage** design (one `Marketplace` contract holds all trades in a `TreeMap[u256, TradeData]`) instead of the more obvious **factory + per-trade-instance** design.

Why:

- **GenLayer Studio is single-contract focused.** The Studio UI assumes "load one contract, deploy it, interact with it." A factory-per-trade pattern would force reviewers and judges to orchestrate deployment scripts outside Studio, breaking the demo flow.
- **No documented contract-to-contract dynamic deployment.** The GenLayer documentation describes contract deployment via CLI, deploy scripts (TypeScript), and tests. It does not document `new Contract(...)` semantics from within an Intelligent Contract.
- **TreeMap is the canonical pattern.** GenLayer's storage primitives (`TreeMap[K, V]`, `DynArray[T]`, `@allow_storage @dataclass`) are explicitly designed for this layout. Community utilities (`genlayer-utils`) include `treemap_paginate()` and `treemap_count()` confirming it as a known pattern.

The full design rationale and trade-off analysis is in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Conventions used

- **English-only.** All identifiers, comments, and prompt text are in English. Reasoning: the LLM models backing GenLayer validators perform best on English prompts, and the codebase needs to be readable by international reviewers.
- **No decorative comments.** No ASCII art headers, no section dividers, no "FIX-X" markers. Comments only where logic is non-obvious.
- **Reverts use `gl.vm.UserError`** with short lowercase messages (`"only buyer can confirm delivery"`, `"insufficient dispute bond"`).
- **Sized integer types everywhere.** `u256` for monetary amounts, `u64` for timestamps, `u8` for state enums. `int` is forbidden in persistent storage by GenLayer.

## Storage rules applied

GenLayer's storage system has strict rules that this codebase follows:

- All persistent fields are declared in the class body with type annotations.
- `list[T]` is replaced with `DynArray[T]`. `dict[K, V]` is replaced with `TreeMap[K, V]`.
- Custom dataclasses used in storage are decorated with `@allow_storage`.
- Before passing storage objects to non-deterministic blocks (LLM calls), they are copied to memory with `gl.storage.copy_to_memory(...)`.
- Field mutations like `self.trades[id].field = x` work in-place — they are views into storage, not copies.

## Upgradability

`Marketplace.py` uses GenLayer's native upgradability via `gl.storage.Root`. In v1, the deployer is the sole upgrader. v2 will migrate to a multisig + timelock.

To freeze the contract permanently, the admin can call `transfer_admin(zero_address)` and the upgrader address loses all power. This path is documented and reserved for post-audit production deployment.

## Linting

Before committing changes to any contract:

```bash
task lint
```

This runs `genvm-lint` from the official [`genlayer-dev`](https://github.com/genlayerlabs/skills) plugin, which catches errors specific to the GenVM execution model that generic Python linters miss.

## Testing

```bash
task test:marketplace    # only Marketplace contract tests
task test:security       # full security suite
task test                # everything
```

See [`tests/README.md`](../tests/README.md) for the test taxonomy.
