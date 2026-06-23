"""Tests for the shared domain models (mirror of packages/domain)."""

from __future__ import annotations

import pytest
from pydantic import TypeAdapter, ValidationError

from fractionax_core import Asset, Deal, InvestmentIntent, InvestmentMemo, IpRoyaltyAsset

asset_adapter: TypeAdapter[Asset] = TypeAdapter(Asset)


def test_asset_discriminates_ip_royalty() -> None:
    asset = asset_adapter.validate_python(
        {
            "kind": "ip_royalty",
            "id": "ast_1",
            "name": "Catalog A",
            "currency": "USD",
            "jurisdiction": "US",
            "licensor": "Label X",
            "annual_royalty_minor": 1_200_000,
            "term_months": 36,
        }
    )
    assert isinstance(asset, IpRoyaltyAsset)


def test_asset_rejects_unknown_kind() -> None:
    with pytest.raises(ValidationError):
        asset_adapter.validate_python({"kind": "real_estate", "id": "x"})


def test_deal_rejects_non_positive_minimum() -> None:
    with pytest.raises(ValidationError):
        Deal.model_validate(
            {
                "id": "deal_1",
                "asset_id": "ast_1",
                "title": "Catalog A - Q3",
                "jurisdiction": "US",
                "currency": "USD",
                "min_investment_minor": 0,
                "target_raise_minor": 5_000_000,
                "projected_yield_pct": 8.5,
                "risk_tier": "low",
                "status": "open",
                "sourced_at": "2026-06-23T00:00:00Z",
            }
        )


def test_intent_parses_minimal_discover() -> None:
    intent = InvestmentIntent.model_validate(
        {"action": "discover", "risk_tier": "low", "jurisdiction": "MY"}
    )
    assert intent.action == "discover"
    assert intent.jurisdiction == "MY"


def test_memo_requires_recommendation() -> None:
    with pytest.raises(ValidationError):
        InvestmentMemo.model_validate(
            {
                "deal_id": "deal_1",
                "summary": "Solid catalog.",
                "valuation_minor": 4_800_000,
                "projected_yield_pct": 8.5,
                "risk_tier": "low",
                "risks": [],
                "generated_at": "2026-06-23T00:00:00Z",
            }
        )
