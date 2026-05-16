# Contracts

Intelligent Contracts for `genlayer-p2p-arena`, written in Python for the GenVM.

## Files

| File | Status | Purpose |
|------|--------|---------|
| `Trade.py` | v1 complete | Per-trade escrow contract. Holds GEN, manages state machine, invokes LLM on dispute. |
| `MarketplaceFactory.py` | in progress | Singleton factory. Deploys `Trade` instances, validates callbacks, tracks aggregate metrics. |
| `PredictionMarketFactory.py` |  planned | Singleton factory for daily prediction market windows. |
| `PredictionMarket.py` |  planned | Per-window binary prediction market. Settles by reading `MarketplaceFactory` state. |

## Conventions used in these contracts

- **English-only.** All identifiers, comments, and prompt text are in English. Reasoning: the LLM models backing GenLayer validators perform best on English prompts, and the codebase needs to be readable by international reviewers.
- **No decorative comments.** No ASCII art headers, no section dividers, no "FIX-X" markers. Comments only where logic is non-obvious.
- **Minimal NatSpec.** Method docstrings where professionally standard. No exhaustive parameter documentation that duplicates type hints.
- **State constants in UPPER_SNAKE.** Constants at module level, not class attributes.
- **Reverts use `gl.vm.UserError`** with short lowercase messages (`"only buyer can deposit"`, `"insufficient dispute bond"`).

## Why one contract per trade

Each `Trade` is its own deployed instance rather than an entry in a singleton mapping. The full rationale is in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md#why-factories-instead-of-singletons), but the short version:

1. The LLM dispute reasons over **one trade's data**, not a polluted shared context.
2. Appeals on one trade do not block others.
3. Storage layout is flat and trivial to audit.

The tradeoff is deployment cost per new trade. Acceptable for MVP; revisitable in v2.

## Storage layout reminders

GenLayer storage is **explicit**. Every field must be declared at the class level with a type, initialized in `__init__`, and uses type-specific accessors. Common types in this codebase:

- `Address` — wallet or contract address (20 bytes)
- `u256` — value amounts in wei (1 GEN = 10¹⁸ wei)
- `u64` — timestamps and counters
- `u8` — state enum values
- `bool` — flags
- `str` — UTF-8 strings (used for evidence, tracking numbers, etc.)

## Linting

Before committing changes to any contract:

```bash
task lint
```

This runs `genvm-lint` from the official [`genlayer-dev`](https://github.com/genlayerlabs/skills) plugin, which catches errors specific to the GenVM execution model that generic Python linters miss.

## Testing

```bash
task test:trade          # only Trade tests
task test:security       # full security suite
task test                # everything
```

See [`tests/README.md`](../tests/README.md) for the test taxonomy.
