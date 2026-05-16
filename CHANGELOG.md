# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Trade contract (`contracts/Trade.py`) — per-trade escrow with state machine and LLM-arbitrated dispute resolution
- Architecture documentation (`docs/ARCHITECTURE.md`)
- Security threat model and mitigation map (`docs/SECURITY.md`)
- Future v3 roadmap for decentralized fiat escrow (`docs/FUTURE_FIAT_ESCROW.md`)
- Setup guide for local development and VPS deployment (`docs/SETUP.md`)
- Taskfile-based command orchestration (`Taskfile.yaml`)
- Project skeleton with `contracts/`, `tests/`, `scripts/`, `frontend/` directories

### Coming next
- `MarketplaceFactory.py` — singleton factory with metric aggregation
- `PredictionMarketFactory.py` and `PredictionMarket.py` contracts
- Security test suite (`tests/test_trade_*.py`)
- Deployment and demo scripts (`scripts/`)
- Next.js frontend (`frontend/`)
