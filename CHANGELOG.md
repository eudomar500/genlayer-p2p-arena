# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Architecture refactor: factory-per-trade → singleton.** After validating against GenLayer Studio's single-contract deployment model and confirming the absence of documented contract-to-contract dynamic deployment in the runtime, consolidated `Trade.py` + `MarketplaceFactory.py` into a single `Marketplace.py` holding all trades in `TreeMap[u256, TradeData]`. Threat model T1–T10 preserved; T4 updated (no more factory callback surface). See `docs/ARCHITECTURE.md` "Why singleton instead of factories" for full rationale.

### Added
- `Marketplace.py` (452 lines) — singleton marketplace contract with state machine, LLM dispute resolution, fee aggregation, and native upgradability via `gl.storage.Root`.
- `MIN_PRICE` and `MAX_PRICE` bounds enforced on `create_listing()` — closes T6 (u256 overflow) at code level instead of deferring to v1.1.
- Admin role (deployer) with `withdraw_fees()`, `transfer_admin()`, and `upgrade()`. Documented in `docs/SECURITY.md` Trust assumptions.
- `create_listing` and `accept_listing` flow — sellers publish first, buyers accept later (more MercadoLibre-style than the prior "deploy-on-acceptance" pattern).

### Removed
- `Trade.py` — its logic is preserved inside `Marketplace.py` per-trade methods.

### Coming next
- `PredictionMarket.py` — singleton binary prediction market reading `Marketplace.get_eligible_trade_count_in_window()`
- Security test suite (`tests/test_marketplace_*.py`)
- Deployment and demo scripts (`scripts/`)
- Next.js frontend (`frontend/`)
