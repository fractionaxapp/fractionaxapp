"""Domain models mirroring the TypeScript ``@fractionax/domain`` package.

Field names are idiomatic Python snake_case; the cross-service JSON contract is
defined by the agents API. Keep these in sync with ``packages/domain`` (a
schema-first codegen step is a future option once the model set grows).
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field

RiskTier = Literal["low", "medium", "high"]
AssetKind = Literal["ip_royalty", "invoice", "revenue_share"]
DealStatus = Literal["sourced", "screening", "open", "funded", "closed"]
NavSource = Literal["pyth", "switchboard", "manual"]
IntentAction = Literal["invest", "discover", "rebalance", "quote"]
Recommendation = Literal["invest", "pass", "watch"]


class _AssetBase(BaseModel):
    id: str
    name: str
    currency: str = Field(min_length=3, max_length=3)
    jurisdiction: str = Field(min_length=2, max_length=2)


class IpRoyaltyAsset(_AssetBase):
    """Income from licensed intellectual property."""

    kind: Literal["ip_royalty"] = "ip_royalty"
    licensor: str
    annual_royalty_minor: int = Field(ge=0)
    term_months: int = Field(gt=0)


class InvoiceAsset(_AssetBase):
    """A receivable purchased at a discount to face value."""

    kind: Literal["invoice"] = "invoice"
    debtor: str
    face_value_minor: int = Field(gt=0)
    due_date: str


class RevenueShareAsset(_AssetBase):
    """A share of a business's future revenue."""

    kind: Literal["revenue_share"] = "revenue_share"
    business: str
    share_pct: float = Field(ge=0, le=100)
    projected_monthly_revenue_minor: int = Field(ge=0)


Asset = Annotated[
    IpRoyaltyAsset | InvoiceAsset | RevenueShareAsset,
    Field(discriminator="kind"),
]


class Deal(BaseModel):
    """An investable opportunity backed by an Asset."""

    id: str
    asset_id: str
    title: str
    jurisdiction: str = Field(min_length=2, max_length=2)
    currency: str = Field(min_length=3, max_length=3)
    min_investment_minor: int = Field(gt=0)
    target_raise_minor: int = Field(gt=0)
    projected_yield_pct: float
    risk_tier: RiskTier
    status: DealStatus
    sourced_at: str
    # Asset class (e.g. "real-estate", "stocks"). Optional for legacy seed deals;
    # populated for catalogue deals so the discovery UI can group by class.
    asset_class: str | None = None


class DealFilter(BaseModel):
    """Criteria the Deal Sourcing Agent filters opportunities by."""

    jurisdiction: str | None = None
    risk_tier: RiskTier | None = None
    min_yield_pct: float | None = None
    asset_class: str | None = None
    max_min_investment_minor: int | None = None


class Investor(BaseModel):
    id: str
    display_name: str
    jurisdiction: str = Field(min_length=2, max_length=2)
    accredited: bool = False
    risk_appetite: RiskTier


class NavQuote(BaseModel):
    """A net-asset-value price point for an asset."""

    asset_id: str
    nav_minor: int = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)
    as_of: str
    source: NavSource


class MemoRisk(BaseModel):
    title: str
    severity: RiskTier
    detail: str


class InvestmentMemo(BaseModel):
    """The Underwriting Agent's structured output."""

    deal_id: str
    summary: str
    valuation_minor: int = Field(ge=0)
    projected_yield_pct: float
    risk_tier: RiskTier
    risks: list[MemoRisk]
    recommendation: Recommendation
    generated_at: str


class InvestmentIntent(BaseModel):
    """The structured action the User Copilot Agent parses NL into."""

    action: IntentAction
    amount_minor: int | None = Field(default=None, gt=0)
    currency: str | None = None
    risk_tier: RiskTier | None = None
    jurisdiction: str | None = None
    asset_kind: AssetKind | None = None
    min_yield_pct: float | None = Field(default=None, ge=0)
    asset_class: str | None = None
