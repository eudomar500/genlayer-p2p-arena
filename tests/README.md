# Tests

Test taxonomy for `genlayer-p2p-arena`.

## Two modes

GenLayer tests run in two distinct modes. We use both, for different reasons.

### Direct mode (`tests/*.py`)

Loads the contract as a Python module and executes methods in-memory with mocked validators. **Fast** (milliseconds per test) and **deterministic** (LLM calls are stubbed unless explicitly invoked). Used for:

- State machine coverage
- Access control
- Reentrancy patterns
- Storage assertions
- Overflow boundaries

### Integration mode (`tests/integration/*.py`)

Runs against a live GenLayer Studio (localnet) with real validators and real LLM inference. **Slow** (seconds per test, sometimes minutes) but **realistic**. Used for:

- End-to-end happy paths
- LLM dispute adjudication with real prompt injection corpora
- Multi-contract interactions through the factory
- Settlement timing under real finality delays

Run direct mode for development iteration; run integration mode before deployment to testnet.

## Security test suite

The security tests are the ones that earn this repo the right to claim "designed with adversarial review in mind." They live alongside functional tests and run under `task test:security`.

| Test file | Threats covered (see [SECURITY.md](../docs/SECURITY.md)) |
|-----------|---------------------------------------------------------|
| `test_trade_state_machine.py` | T2 -- every (state, action) pair |
| `test_trade_access_control.py` | T3 -- sender_address impersonation |
| `test_trade_reentrancy.py` | T1 -- payout path re-entry |
| `test_trade_prompt_injection.py` | T5 -- known injection patterns + LLM resistance |
| `test_trade_overflow.py` | T6 -- u256 boundary fuzzing |
| `test_factory_callback_auth.py` | T4 -- fake Trade impersonation |
| `test_prediction_wash_economics.py` | T8 -- wash trading break-even simulation |
| `test_prediction_settlement_timing.py` | T9 -- settlement window race |

## How to run

```bash
# All tests, direct mode
task test

# Security tests only
task test:security

# Specific contract
task test:trade
task test:factory
task test:prediction

# Integration mode (requires Studio running)
task studio:up
task test:integration
```

## Writing new tests

Direct-mode tests follow this pattern:

```python
# tests/test_trade_something.py
import pytest
from genlayer_test.direct import DirectClient

@pytest.fixture
def client():
    return DirectClient()

def test_some_behavior(client):
    addr = client.deploy(
        "contracts/Trade.py",
        constructor_args=[
            factory_addr,
            seller_addr,
            buyer_addr,
            price,
            "Title",
            "Description",
        ],
    )
    # Call methods, assert state...
```

Integration tests use the `Network` fixture from `genlayer-test` instead of `DirectClient`.
