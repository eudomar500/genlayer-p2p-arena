# Future: Decentralized Fiat Escrow

> **Status:** Roadmap document. Not implemented in v1. Targeted for v3.

## Vision

Replicate the user experience of Binance P2P fiat on/off ramps -- buy/sell crypto with bank transfers, mobile money, or cash -- but with the trust model decentralized. Instead of Binance arbitrating disputes between two strangers wiring fiat, GenLayer's validator quorum reads payment evidence and adjudicates.

This is the natural extension of the v1 escrow primitive from physical goods to fiat-for-crypto trades.

## Why this is interesting

**Binance P2P moves billions monthly in LATAM alone.** In Venezuela, it is the dominant on-ramp -- more reliable than any local bank, more accessible than centralized exchanges. The product-market fit is established. What is missing is the trust-minimized version.

**The gap competitors have not closed.** [LocalCryptos](https://localcryptos.com) (shut down), [Bisq](https://bisq.network), [HodlHodl](https://hodlhodl.com), and a handful of others have tried decentralized fiat escrow. All hit the same wall: dispute resolution requires a human arbiter (centralized) or a complex slow-moving DAO (Kleros-style, expensive and slow). GenLayer eliminates this wall.

**LATAM-specific edge.** Fiat escrow tools built for Venezuelan/Argentinian/Colombian rails (bank transfer screenshots in Spanish, Pago Móvil receipts, Mercado Pago confirmations) do not exist as decentralized primitives. A GenLayer-native solution that can read and adjudicate these payment artifacts is regional white space.

## Architecture sketch

The v1 `Trade` contract assumes physical goods with a tracking number. Fiat escrow needs a different proof artifact: a **payment receipt** that proves money moved from buyer to seller's bank/wallet outside the chain.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   FiatTrade lifecycle                                       │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Seller locks crypto in escrow                      │   │
│   └──────────────────────┬──────────────────────────────┘   │
│                          ▼                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Buyer sends fiat off-chain (bank, Pago Móvil, etc) │   │
│   └──────────────────────┬──────────────────────────────┘   │
│                          ▼                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Buyer uploads payment receipt as evidence          │   │
│   │   (image or PDF, base64-encoded into contract state)│   │
│   └──────────────────────┬──────────────────────────────┘   │
│                          ▼                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Seller confirms receipt of fiat                    │   │
│   │  → crypto releases to buyer                         │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   On dispute:                                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  LLM with vision capability reads the receipt image:│   │
│   │  - Is the amount correct?                           │   │
│   │  - Does the recipient match seller's claimed acct?  │   │
│   │  - Is the timestamp consistent with the trade?      │   │
│   │  - Does the receipt look forged?                    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technical building blocks (already in GenLayer)

- **Vision LLM:** `gl.nondet.exec_prompt(prompt, images=[receipt_bytes])`. GenLayer documents this as a first-class feature with a limit of 2 images per call. We can ask the model to read amounts, dates, account holders, and detect forgery cues (font inconsistency, pixel-level artifacts).

- **Web access for double-checking:** The contract can fetch the seller's claimed bank account from a public registry, verify exchange rates at the trade time against a public source, or pull blockchain confirmations for crypto-side receipts. All via `gl.nondet.web.get(url)` inside non-deterministic blocks.

- **Equivalence principle for image-based reasoning:** Vision model outputs are non-deterministic. The same `run_nondet_unsafe(leader_fn, validator_fn)` pattern from v1 dispute resolution applies, with the validator function checking semantic agreement on the binary "is this receipt valid?" question.

## Hard problems to solve before shipping

These are real blockers, not "implementation details":

### 1. Receipt forgery resistance

Modern image editing makes a believable forged bank screenshot trivial. The LLM can catch obvious tells (mismatched fonts, wrong sender name), but a careful adversary will defeat single-modal checks.

**Mitigation paths:**
- **Multi-source verification.** Cross-reference the receipt against a public bank API where available (some LATAM banks expose verification endpoints).
- **Cryptographic receipts.** Push banks/wallets to issue signed digital receipts. This requires bank cooperation -- slow but high-value.
- **Behavioral analysis.** A reputation system layered on top: serial submitters of forged receipts pattern-match over time even if each individual submission is hard to detect.

### 2. Legal exposure

Fiat-to-crypto exchange is regulated in every jurisdiction. Even a decentralized facilitator can become a target. Strategies:

- **Geoblocking via IP detection in the frontend** (does not protect against determined users, but reduces incidental exposure).
- **No KYC at the protocol level**, KYC handled by users via established off-ramps. The protocol is plumbing, not a financial institution.
- **Operate as a public good with no centralized monetization** -- fees go to the validator set, not a foundation or operator. Reduces "this is a money transmitter" arguments.

This is the area where serious legal consultation is required before deploying to mainnet with real users.

### 3. Liquidity bootstrapping

Day-one liquidity is a chicken-and-egg problem. Solutions:

- **Migrate existing Binance P2P traders.** Specifically target high-volume LATAM operators who already do this manually and offer them a less-intermediated alternative.
- **Maker incentives.** Subsidize early makers with GEN rewards (need foundation support or community treasury).
- **Integrate as a settlement layer** for existing P2P discovery platforms rather than build a new frontend.

### 4. Payment method diversity

Bank transfer in Argentina ≠ Pago Móvil in Venezuela ≠ Pix in Brazil ≠ Mercado Pago anywhere. Each has a different receipt format. The LLM needs to handle each.

**Approach:** Start with one rail (Pago Móvil in Venezuela), validate the model's accuracy, expand rail-by-rail. Each rail is a small per-prompt module loaded based on the trade's declared payment method.

## What v2 should do first

The bridge between v1 (physical goods) and v3 (fiat escrow) is **digital goods**: licenses, accounts, codes, files. Same trust problem ("did the buyer actually receive working access?"), much smaller forgery risk, no regulatory exposure. v2 will prove the dispute primitive on digital goods before tackling fiat.

## Why this matters for the v1 pitch

v1 stands on its own technically, but **v3 is the long-term thesis**. When pitching v1 to GenLayer Foundation or hackathon judges, the fiat escrow roadmap is the answer to "what's the long game?" -- and it is a credible answer because:

1. The market is real and large (LATAM P2P fiat ≥ $30B/year).
2. The trust gap is real and centrally arbitrated today.
3. GenLayer's vision LLM + web access primitives are uniquely positioned to close it.
4. The v1 dispute primitive proves the core mechanic before the higher-stakes fiat version.

Building v1 well **earns the right** to ship v3 later.
