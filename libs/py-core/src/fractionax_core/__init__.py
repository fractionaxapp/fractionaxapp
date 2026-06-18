"""Shared Python primitives for Fractionax services."""

from __future__ import annotations

from dataclasses import dataclass

__all__ = ["Money", "add_money"]


@dataclass(frozen=True, slots=True)
class Money:
    """Money in integer minor units to avoid floating-point drift."""

    amount: int
    currency: str

    def __post_init__(self) -> None:
        if not isinstance(self.amount, int):
            raise TypeError("Money.amount must be an integer in minor units")
        object.__setattr__(self, "currency", self.currency.upper())


def add_money(a: Money, b: Money) -> Money:
    if a.currency != b.currency:
        raise ValueError(f"Currency mismatch: {a.currency} vs {b.currency}")
    return Money(a.amount + b.amount, a.currency)
