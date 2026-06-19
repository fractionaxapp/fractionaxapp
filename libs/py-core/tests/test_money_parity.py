import json
from pathlib import Path

from fractionax_core import Money

# Shared fixtures, also asserted by @fractionax/core's money.parity.test.ts, so the
# Python and TS money implementations stay in parity.
_CASES = json.loads(
    (Path(__file__).parents[3] / "test-fixtures" / "money-cases.json").read_text()
)


def test_money_normalization_parity() -> None:
    for case in _CASES["normalize"]:
        m = Money(case["amount"], case["currency"])
        assert {"amount": m.amount, "currency": m.currency} == case["expected"]
