# PointMarket frontend

The dApp frontend for PointMarket, a decentralized P2P marketplace and meta-prediction market protocol on GenLayer.

Built with Next.js 15, TypeScript strict mode, Tailwind CSS v4, and GenLayerJS.

## Status

**Phase 0 (scaffold)**: complete.
Next phases: brand and landing, wallet connect, contract reads, write operations, dashboard.

## Setup

Requires Node.js 20 or higher and pnpm.

```
cd frontend
pnpm install
cp .env.local.example .env.local
pnpm dev
```

The dev server runs at http://localhost:3000.

## Architecture

```
frontend/
  app/                       Next.js App Router pages
  components/                React components organized by concern
  lib/
    genlayer/                SDK wrappers (typed reads, writes, client, types)
    hooks/                   React hooks for contract state
  config/                    Network metadata
  public/                    Static assets (logo SVGs, favicon, OG image)
```

The `lib/genlayer` module is the only place that touches the SDK. All reads and writes go through typed wrappers. UI code never imports `genlayer-js` directly.

## Deployed contracts

Studionet (chain 61999):

| Contract | Address |
|---|---|
| Marketplace | `0x29f58D5ACC8b85250D3Dae2692DEADED346c6e67` |
| PredictionMarket | `0x2b0B5f76Db290D77DF53250B7f0540fc2D8cb48E` |

Source code and protocol documentation: see `../contracts/` and `../docs/` in the repo root.

## Wallet support

The dApp uses EIP-6963 multi-wallet detection. Any EIP-1193 compatible browser wallet works. Tested with Rabby and MetaMask.

To use the GenLayer Studionet in your wallet:

1. Open wallet settings, add custom network
2. RPC URL: `https://studio.genlayer.com:8443/api`
3. Chain ID: `61999`
4. Currency symbol: GEN

## Code style

This frontend follows the same code style rules as the rest of the repo:

- No em-dashes, use `--`
- No Unicode arrows, use `->`
- No emojis in code, UI copy, or commit messages
- Factual prose tone, no marketing language
- Conventional Commits

## License

MIT
