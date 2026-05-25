# Scripts

Operational scripts for deployment and demonstration.

## Files (planned for next phase)

| Script | Purpose |
|--------|---------|
| `deploy_factories.py` | Deploy `MarketplaceFactory` and `PredictionMarketFactory` to a given network. Writes resulting addresses to `deployments/{network}.json`. |
| `demo_happy_path.py` | End-to-end demo: create a listing, accept a trade, deposit, ship, confirm, payout. No LLM invocation. |
| `demo_dispute.py` | End-to-end demo with a forced dispute. Both parties submit evidence, LLM adjudicates, payout follows the verdict. |
| `demo_prediction.py` | Opens a daily prediction market, places sample bets, advances time, settles. |

## Usage

All scripts read network configuration from `.env`. Make sure `.env` exists (copy from `.env.example`) and `GENLAYER_NETWORK` is set before running.

```bash
task deploy:local                 # deploy to local Studio
task deploy:testnet               # deploy to testnet Asimov

task demo:happy-path              # happy-path demo
task demo:dispute                 # dispute demo
task demo:prediction              # prediction market demo
```

## Why separate demos

Each demo script exercises a different code path and tells a different story for the hackathon pitch:

- **Happy path** demonstrates that the protocol is fast and cheap when both parties cooperate. No LLM, fast finalization, minimal fees.
- **Dispute demo** is the *interesting* one for GenLayer -- it shows the AI validator quorum doing actual adjudication. This is the visual moment in the pitch.
- **Prediction market demo** demonstrates the meta-layer: a second use case for the same data, with self-settlement and no oracles.
