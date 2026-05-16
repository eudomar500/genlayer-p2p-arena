"""Direct-mode tests for the dispute machinery in contracts/Marketplace.py.

Covers the two pieces of logic added in the e329897 fix:

  1. claim_dispute_default() — initiator wins by default after the response
     window if the counterparty never responds.
  2. Bond redistribution — the loser's dispute bond is transferred to the
     winner (in addition to the winner's own bond being returned).

These tests run leader-side only. Validator agreement is exercised in the
integration suite, not here.
"""

import json
import pytest


CONTRACT_PATH = "contracts/Marketplace.py"

# Mirror the on-chain state enum (see contracts/Marketplace.py).
STATE_LISTING_OPEN = 0
STATE_PAID = 1
STATE_SHIPPED = 2
STATE_DISPUTED = 3
STATE_COMPLETED = 4
STATE_CANCELLED = 5

# Mirror the on-chain economic parameters.
ONE_ETH = 10**18
PRICE = ONE_ETH                                          # 1 ETH per trade
FEE_BPS = 200
DISPUTE_BOND_BPS = 500
BOND = (PRICE * DISPUTE_BOND_BPS) // 10_000              # 0.05 ETH
FEE = (PRICE * FEE_BPS) // 10_000                        # 0.02 ETH

# Time windows (must match the contract).
DISPUTE_WINDOW = 7 * 24 * 60 * 60
RESPONSE_WINDOW = 7 * 24 * 60 * 60


# ---------- helpers ----------

def _ship_trade(contract, vm, seller, buyer):
    """Create → accept → ship a trade. Returns trade_id."""
    vm.sender = seller
    trade_id = contract.create_listing("Vintage Item", "Description goes here", PRICE)

    vm.sender = buyer
    vm.value = PRICE
    contract.accept_listing(trade_id)
    vm.value = 0

    vm.sender = seller
    contract.mark_shipped(trade_id, "TRACK-1234", "DHL")
    return trade_id


# ---------- claim_dispute_default ----------

def test_claim_dispute_default_buyer_wins_after_window(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    """Buyer opens a dispute, seller stays silent → buyer wins by default."""
    direct_vm.sender = direct_owner
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.deal(direct_alice, 10 * ONE_ETH)  # seller
    direct_vm.deal(direct_bob, 10 * ONE_ETH)    # buyer

    trade_id = _ship_trade(contract, direct_vm, seller=direct_alice, buyer=direct_bob)

    # Buyer opens dispute, posts bond.
    direct_vm.sender = direct_bob
    direct_vm.value = BOND
    contract.open_dispute(trade_id, "item arrived damaged")
    direct_vm.value = 0

    assert contract.get_trade_state(trade_id) == STATE_DISPUTED

    # Before the window closes the default cannot be claimed.
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("response window still open"):
        contract.claim_dispute_default(trade_id)

    # Advance past the response window.
    direct_vm.warp(seconds=RESPONSE_WINDOW + 1)

    direct_vm.sender = direct_bob
    contract.claim_dispute_default(trade_id)

    summary = contract.get_trade_summary(trade_id)
    assert summary["state"] == STATE_COMPLETED
    assert summary["llm_verdict_buyer_wins"] is True
    assert summary["disputed"] is True
    assert "default judgment" in summary["llm_verdict_reasoning"]


def test_claim_dispute_default_seller_wins_after_window(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    """Seller opens dispute, buyer never responds → seller wins by default."""
    direct_vm.sender = direct_owner
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.deal(direct_alice, 10 * ONE_ETH)
    direct_vm.deal(direct_bob, 10 * ONE_ETH)

    trade_id = _ship_trade(contract, direct_vm, seller=direct_alice, buyer=direct_bob)

    direct_vm.sender = direct_alice
    direct_vm.value = BOND
    contract.open_dispute(trade_id, "buyer is lying about damage")
    direct_vm.value = 0

    direct_vm.warp(seconds=RESPONSE_WINDOW + 1)

    direct_vm.sender = direct_alice
    contract.claim_dispute_default(trade_id)

    summary = contract.get_trade_summary(trade_id)
    assert summary["state"] == STATE_COMPLETED
    assert summary["llm_verdict_buyer_wins"] is False


def test_claim_dispute_default_only_initiator(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob, direct_charlie
):
    """Non-initiators (including the counterparty) cannot claim the default."""
    direct_vm.sender = direct_owner
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.deal(direct_alice, 10 * ONE_ETH)
    direct_vm.deal(direct_bob, 10 * ONE_ETH)
    direct_vm.deal(direct_charlie, 10 * ONE_ETH)

    trade_id = _ship_trade(contract, direct_vm, seller=direct_alice, buyer=direct_bob)

    direct_vm.sender = direct_bob
    direct_vm.value = BOND
    contract.open_dispute(trade_id, "item arrived damaged")
    direct_vm.value = 0

    direct_vm.warp(seconds=RESPONSE_WINDOW + 1)

    direct_vm.sender = direct_alice  # counterparty
    with direct_vm.expect_revert("only initiator can claim default judgment"):
        contract.claim_dispute_default(trade_id)

    direct_vm.sender = direct_charlie  # unrelated third party
    with direct_vm.expect_revert("only initiator can claim default judgment"):
        contract.claim_dispute_default(trade_id)


def test_claim_dispute_default_requires_active_dispute(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    direct_vm.sender = direct_owner
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.deal(direct_alice, 10 * ONE_ETH)
    direct_vm.deal(direct_bob, 10 * ONE_ETH)

    trade_id = _ship_trade(contract, direct_vm, seller=direct_alice, buyer=direct_bob)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("no active dispute"):
        contract.claim_dispute_default(trade_id)


# ---------- bond redistribution via LLM verdict ----------

def _mock_llm_verdict(direct_vm, verdict: str, reasoning: str = "ok"):
    """Force the dispute LLM to return a known verdict."""
    direct_vm.mock_llm(
        r".*impartial dispute arbitrator.*",
        json.dumps({"verdict": verdict, "confidence": 90, "reasoning": reasoning}),
    )


def test_bond_redistribution_buyer_wins_via_llm(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    """When buyer wins the LLM verdict, they recover price + own bond + seller's bond."""
    direct_vm.sender = direct_owner
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.deal(direct_alice, 10 * ONE_ETH)
    direct_vm.deal(direct_bob, 10 * ONE_ETH)

    trade_id = _ship_trade(contract, direct_vm, seller=direct_alice, buyer=direct_bob)

    direct_vm.sender = direct_bob
    direct_vm.value = BOND
    contract.open_dispute(trade_id, "item not as described")
    direct_vm.value = 0

    buyer_balance_before = direct_vm.balance_of(direct_bob)

    _mock_llm_verdict(direct_vm, "BUYER", "evidence supports buyer")

    direct_vm.sender = direct_alice
    direct_vm.value = BOND
    contract.respond_to_dispute(trade_id, "we shipped exactly what was listed")
    direct_vm.value = 0

    summary = contract.get_trade_summary(trade_id)
    assert summary["state"] == STATE_COMPLETED
    assert summary["llm_verdict_buyer_wins"] is True

    # Buyer recovers: refund (PRICE) + own bond + seller bond.
    expected_credit = PRICE + BOND + BOND
    buyer_balance_after = direct_vm.balance_of(direct_bob)
    assert buyer_balance_after == buyer_balance_before + expected_credit

    # Metrics: completed_count and disputed_count must both increment.
    # total_volume stays zero because the trade was refunded.
    metrics = contract.get_metrics()
    assert metrics["completed_count"] == "1"
    assert metrics["disputed_count"] == "1"
    assert metrics["total_volume"] == "0"
    assert metrics["fees_collected"] == "0"


def test_bond_redistribution_seller_wins_via_llm(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    """When seller wins, they receive (price - fee) + own bond + buyer's bond."""
    direct_vm.sender = direct_owner
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.deal(direct_alice, 10 * ONE_ETH)
    direct_vm.deal(direct_bob, 10 * ONE_ETH)

    trade_id = _ship_trade(contract, direct_vm, seller=direct_alice, buyer=direct_bob)

    direct_vm.sender = direct_bob
    direct_vm.value = BOND
    contract.open_dispute(trade_id, "claim that may not hold up")
    direct_vm.value = 0

    seller_balance_before = direct_vm.balance_of(direct_alice)

    _mock_llm_verdict(direct_vm, "SELLER", "buyer's evidence is weak")

    direct_vm.sender = direct_alice
    direct_vm.value = BOND
    contract.respond_to_dispute(trade_id, "tracking proves delivery; item matched description")
    direct_vm.value = 0

    summary = contract.get_trade_summary(trade_id)
    assert summary["state"] == STATE_COMPLETED
    assert summary["llm_verdict_buyer_wins"] is False

    # Seller receives (price - fee) + own bond + buyer's forfeited bond.
    expected_credit = (PRICE - FEE) + BOND + BOND
    seller_balance_after = direct_vm.balance_of(direct_alice)
    assert seller_balance_after == seller_balance_before + expected_credit

    metrics = contract.get_metrics()
    assert metrics["completed_count"] == "1"
    assert metrics["disputed_count"] == "1"
    assert metrics["total_volume"] == str(PRICE)
    assert metrics["fees_collected"] == str(FEE)


# ---------- default judgment bond accounting ----------

def test_default_judgment_pays_only_initiator_bond(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    """When seller never responds, no seller_bond exists; buyer recovers price + own bond only."""
    direct_vm.sender = direct_owner
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.deal(direct_alice, 10 * ONE_ETH)
    direct_vm.deal(direct_bob, 10 * ONE_ETH)

    trade_id = _ship_trade(contract, direct_vm, seller=direct_alice, buyer=direct_bob)

    direct_vm.sender = direct_bob
    direct_vm.value = BOND
    contract.open_dispute(trade_id, "no response coming")
    direct_vm.value = 0

    buyer_balance_before = direct_vm.balance_of(direct_bob)

    direct_vm.warp(seconds=RESPONSE_WINDOW + 1)
    direct_vm.sender = direct_bob
    contract.claim_dispute_default(trade_id)

    # Buyer recovers PRICE + own bond. There is no seller_bond to forfeit.
    expected_credit = PRICE + BOND
    buyer_balance_after = direct_vm.balance_of(direct_bob)
    assert buyer_balance_after == buyer_balance_before + expected_credit
