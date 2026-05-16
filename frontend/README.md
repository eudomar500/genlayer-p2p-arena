# Frontend

Next.js 14 application that consumes the deployed `MarketplaceFactory` and `PredictionMarketFactory` via [GenLayerJS](https://docs.genlayer.com/api-references/genlayer-js).

## Status

Not yet implemented. Scaffolding pending.

## Planned stack

- **Next.js 14** (App Router)
- **GenLayerJS** for contract reads/writes and wallet integration
- **Tailwind CSS** for styling
- **shadcn/ui** for component primitives
- **TanStack Query** for async state and caching

## Planned pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page + active listings |
| `/listings/new` | Create a listing (seller) |
| `/listings/[id]` | Listing detail + accept-trade (buyer) |
| `/trades/[address]` | Per-trade dashboard: state, actions, dispute UI |
| `/markets` | Active prediction markets |
| `/markets/[address]` | Per-market detail: bet, history, resolution |
| `/dashboard` | Connected user's trades and bets |

## Setup (once implemented)

```bash
cd frontend
pnpm install
cp ../.env.example .env.local
# fill in contract addresses
pnpm dev
```
