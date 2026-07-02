# ADR 0003: Compliant-investing vertical (Compliance Agent + on-chain credential gate)

- **Status:** Accepted
- **Date:** 2026-07-02

## Context

Milestone 3 ("Compliance, Portfolio Management & Secondary Market") delivers
compliant investing: KYC/AML, jurisdiction-aware rules, an accredited-investor
tier system, and transfer restrictions (Reg D/S/A-equivalent). We are building
this vertical **end-to-end first** — agent logic, API, on-chain enforcement, and
web UX — ahead of the rest of M2/M3, because the "compliant investing" story spans
every layer and is the grant's M3 headline.

The full M3 on-chain surface (SPL tokenization, investor registry, yield) is not
built yet. The compliance vertical needs only a thin slice of that: a per-investor
on-chain **credential** and a **gated instruction** that enforces it. We build that
slice and defer the rest.

## Decision

1. **The compliance decision is deterministic and authoritative.** A pure
   rules engine (`ai/agents/.../compliance.py`) decides ALLOW/DENY from KYC status,
   sanctions screening, jurisdiction, accreditation tier, and deal risk tier. The
   LLM never decides eligibility — it only writes the investor-facing *rationale*,
   and even that has a deterministic fallback so the gate works with **no API key**
   configured (consistent with `/deals` and `/nav`). This mirrors the underwriting
   agent, where the NAV valuation is deterministic and the LLM only narrates.

2. **KYC/AML runs behind a pluggable provider.** `KycProvider` is a protocol; the
   default `MockKycProvider` screens deterministically (sanctioned jurisdictions
   fail, a watchlist rejects, everyone else verifies). A real vendor (Sumsub /
   Persona / etc.) implements the same protocol and drops in later — no call-site
   changes.

3. **Regime is inferred from the deal jurisdiction.** US deals → Reg D (accredited
   US only); non-US deals → Reg S (offshore, non-US persons, retail-friendly). The
   rules live as inspectable data (`GET /compliance/rules`), and an onboarding flow
   can later carry an explicit regime per deal to override the inference.

4. **On-chain enforcement via a credential + gate.** The `fractionax` program gains
   an `InvestorCredential` PDA (seeds `["investor", wallet]`) written by the
   compliance authority after off-chain screening (`set_investor_credential`,
   upsert; `revoke_investor_credential`), plus `assert_compliant` — a gated
   instruction that a real invest/transfer instruction requires (directly or via
   CPI) before moving value. The credential PDA is bound to the signer's key, so an
   investor proves ownership of the wallet the credential was issued for.

5. **The web gates the invest CTA on the decision.** The deal page's `InvestPanel`
   runs the eligibility check first and only reveals the existing "express interest"
   flow on ALLOW; on DENY it shows the reasons. Same gate, three layers (agent →
   API → on-chain), one source of truth.

## Alternatives considered

- **Let the LLM decide eligibility.** Rejected: compliance must be deterministic,
  auditable, and reproducible; an LLM verdict is none of those. The LLM is confined
  to narrating a decision it cannot change.
- **Enforce compliance only off-chain.** Rejected: the grant's thesis is that agent
  decisions become *enforceable on-chain*. The credential + `assert_compliant` gate
  is the minimal primitive that makes the off-chain decision binding at settlement.
- **Build the full M2 investor registry + tokenization first.** Deferred: the
  credential PDA is the smallest on-chain slice that makes the vertical real; the
  broader registry and SPL minting land with M2 and reuse this seam.
- **`init` + separate `update` instruction instead of `init_if_needed`.** Rejected
  for ergonomics: re-screening is a normal event, so upsert semantics fit; the
  instruction is authority-gated, so the re-init footgun does not apply.

## Consequences

- A new `/compliance/*` API surface, a `compliance.py` agent module, four new
  on-chain instructions/accounts, and an `InvestPanel` web component — all covered
  by unit tests (Python rules + FastAPI routes, Rust gate predicate).
- Enabling the `init-if-needed` Anchor feature; documented above.
- Secondary-market transfer restrictions (M3) reuse `check_transfer` and the same
  on-chain gate, so that work is now mostly wiring.
