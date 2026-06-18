import pytest

from fractionax_core import Money, add_money


def test_currency_is_normalized() -> None:
    assert Money(100, "usd").currency == "USD"


def test_add_matching_currencies() -> None:
    assert add_money(Money(100, "USD"), Money(50, "USD")).amount == 150


def test_currency_mismatch_raises() -> None:
    with pytest.raises(ValueError):
        add_money(Money(100, "USD"), Money(50, "EUR"))
