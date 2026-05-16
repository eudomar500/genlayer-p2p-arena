# Genlayer-p2p-arena

A trust-minimized P2P marketplace with an integrated meta-prediction market, built on [GenLayer](https://genlayer.com) Intelligent Contracts.

> **Status:** MVP in active development. Not audited. Not for production funds.

---

## What this is?

Two products that share one substrate:

**1. Escrow-backed P2P marketplace.** Buyers and sellers transact physical goods peer-to-peer. Payment is locked in a per-trade Intelligent Contract until delivery is confirmed. When disputes occur, an AI-validator quorum reads both parties' evidence and adjudicates — no human arbiter, no centralized appeals.

**2. Meta-prediction market on marketplace activity.** Users place binary bets on objective marketplace metrics (daily completed trades, dispute rate, fee volume). Each market self-settles by reading on-chain marketplace state — no oracles, no manual resolution.

The two products compound: the marketplace generates the verifiable data stream the prediction market needs, and the prediction market gives the marketplace a second usage primitive that drives volume and stickiness.

---

## Why GenLayer?

This design is intractable on EVM and tractable on GenLayer for one specific reason: **dispute resolution requires subjective judgment** ("did the item match the description?", "is this evidence credible?"). Solidity can't make that call without an external oracle or human arbiter, and both centralize the trust model.

GenLayer's [Optimistic Democracy](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy) makes the validator quorum itself the arbiter. The AI consensus replaces the centralized resolution layer that every existing P2P escrow ([Kleros](https://kleros.io), [Binance P2P](https://p2p.binance.com), MercadoLibre Mercado Pago) requires.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌───────────────────────┐         ┌────────────────────────┐  │
│   │  MarketplaceFactory   │◄────────┤  PredictionMarket      │  │
│   │  - deploys Trades     │  reads  │  Factory               │  │
│   │  - tracks metrics     │ metrics │  - deploys Markets     │  │
│   │  - collects fees (2%) │         │    per daily window    │  │
│   └──────────┬────────────┘         └────────────┬───────────┘  │
│              │ deploys                            │ deploys     │
│              ▼                                    ▼             │
│   ┌────────────────────┐              ┌────────────────────┐    │
│   │  Trade (1-per-     │              │  PredictionMarket  │    │
│   │  trade instance)   │              │  (1-per-window)    │    │
│   │                    │              │                    │    │
│   │  - escrow GEN      │              │  - binary YES/NO   │    │
│   │  - state machine   │              │  - settles from    │    │
│   │  - LLM dispute     │              │    Factory state   │    │
│   └────────────────────┘              └────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Four contracts, all in Python under `contracts/`. Each `Trade` is its own deployed instance — this isolates the LLM dispute context per trade and keeps the equivalence-principle scope small. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.

---

## Trade lifecycle

```
DRAFT → AWAITING_PAYMENT → PAID → SHIPPED → DELIVERED → COMPLETED
                                     │
                                     ├─→ (no confirmation in 7d) → seller claims → COMPLETED
                                     │
                                     └─→ DISPUTED → both submit evidence
                                                          │
                                                          ▼
                                                    LLM adjudicates
                                                          │
                                                  ┌───────┴───────┐
                                                  ▼               ▼
                                          RESOLVED_BUYER    RESOLVED_SELLER
                                          (full refund +    (price - fee +
                                          bond returned)    bond returned)
```

Key design decisions:

- **Happy path never invokes the LLM.** Inference cost only fires when both parties submit dispute evidence.
- **Dispute bond = 5% of price**, posted by both sides. Winner recovers it, loser forfeits. This auto-funds the system and filters frivolous disputes.
- **The LLM verdict ships with reasoning** stored on-chain — disputes are transparent and explainable.
- **Settlement window of 24h after market close** for the prediction market, to outlast the GenLayer appeal window before paying out.

---

## Stack

| Layer | Tech |
|-------|------|
| Contracts | Python on GenVM ([GenLayer SDK](https://sdk.genlayer.com)) |
| Frontend | Next.js 14 + GenLayerJS + Tailwind |
| Testing | `genlayer-test` (direct mode + integration) |
| Linting | `genvm-lint` from the official `genlayer-dev` plugin |
| Orchestration | [Task](https://taskfile.dev) (Taskfile.yaml) |
| Target network | Testnet Asimov / Bradbury |
| Native token | GEN (testnet) |

---

## Security posture

This is not a toy project. The repo includes a documented threat model and a security test suite covering:

- State machine bypasses
- Reentrancy in payout paths
- Access control on factory callbacks
- Prompt injection in dispute evidence
- u256 overflow/underflow on bond calculations
- Wash-trading economics in the prediction market

See [docs/SECURITY.md](docs/SECURITY.md) for the full threat model and `tests/` for the corresponding test files.

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/genlayer-p2p-arena
cd genlayer-p2p-arena
task setup

# 2. Run security tests (direct mode, fast, in-memory)
task test:security

# 3. Spin up local GenLayer Studio
task studio:up

# 4. Deploy factories to local Studio
task deploy:local

# 5. Run demo (creates a trade, ships it, confirms, releases payout)
task demo:happy-path

# 6. Frontend (separate terminal)
cd frontend && pnpm dev
```

Full instructions in [docs/SETUP.md](docs/SETUP.md).

---

## Roadmap

**v1 (this MVP):**
- Escrow with LLM-arbitrated dispute resolution
- Prediction market on objective marketplace metrics
- Frontend with wallet connection, listing creation, trade dashboard

**v2 (post-hackathon):**
- Reputation tier system (mitigates v1 wash-trading vector at scale)
- Subjective prediction markets ("best-selling category this week")
- Cross-chain payments via GenLayer Rollup Integration

**v3 (long-term):**
- **Decentralized fiat escrow** — Binance-P2P-style on/off ramps adjudicated by GenLayer instead of centralized exchanges. See [docs/FUTURE_FIAT_ESCROW.md](docs/FUTURE_FIAT_ESCROW.md).

---

## License

MIT — see [LICENSE](LICENSE).

---

## Author

Built by @zkVan — DeFi security researcher exploring trust-minimized adjudication primitives.
