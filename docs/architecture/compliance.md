# Architecture: Compliance Vertical (M3)

- **Status:** Living document
- **Date:** 2026-07-02
- **Scope:** The compliant-investing vertical — the Compliance Agent, the
  jurisdiction rules engine, the on-chain investor credential + gate, and how the
  web invest flow is gated on the decision. See [ADR 0003](../adr/0003-compliance-vertical.md)
  for the decisions behind this design and [agent-system](./agent-system.md) for
  the wider agent context.

> Status tags: **[built]** = implemented and tested today; **[planned]** = designed
> here, delivered later in M3.

---

## 1. Purpose

Compliant investing is M3's headline: only investors who pass KYC/AML, sit in a
permitted jurisdiction, and hold the required accreditation tier may invest in a
given deal — and that decision must be enforceable **on-chain**, not just in the
UI. The vertical is built end-to-end (agent → API → chain → web) so the whole path
is demonstrable.

## 2. The decision is deterministic [built]

The core is a pure rules engine in `ai/agents/src/fractionax_agents/compliance.py`.
`verify_investor(investor, deal)` returns a `ComplianceDecision` whose `outcome`
(`allow` / `deny`) is a deterministic function of:

| Check | Source | Deny reason code |
|---|---|---|
| Sanctions screen | investor jurisdiction ∉ sanctioned set | `sanctions_hit` |
| KYC verified | KYC provider | `kyc_not_verified` |
| Jurisdiction permitted for regime | rules engine | `jurisdiction_blocked` / `jurisdiction_not_permitted` |
| Accreditation ≥ regime minimum | tier compare | `accreditation_below_minimum` |
| Deal risk tier gating | rule (`high` ⇒ accredited) | `risk_tier_requires_accreditation` |

The LLM **never** decides eligibility. It only writes the human-readable
`rationale`, and that call falls back to a deterministic sentence when no provider
key is configured — so the gate works with zero API keys (like `/deals`, `/nav`).
This mirrors the underwriting agent (deterministic NAV, LLM narrates).

## 3. Securities-exemption regimes [built]

The regime is inferred from the deal's jurisdiction (`deal_regime`):

- **Reg D** — US deals: US **accredited** (or institutional) investors only.
- **Reg S** — non-US deals: **non-US** persons, open to retail.
- **Reg A** — retail offering, open within permitted jurisdictions (available in
  the rules table for deals onboarded under it).

Rules are data (`JURISDICTION_RULES`), inspectable via `GET /compliance/rules`, so
they are testable and auditable rather than buried in branches.

## 4. KYC/AML provider [built]

`KycProvider` is a protocol; `MockKycProvider` is the deterministic default
(sanctioned jurisdiction → sanctions fail; watchlisted id/name → rejected;
otherwise verified). A real vendor implements `screen()` and is injected into
`verify_investor` / `check_transfer` — no call-site change.

## 5. On-chain credential + gate [built]

The `fractionax` Anchor program (`onchain/programs/fractionax/src/lib.rs`) carries
the minimal M2 slice this vertical needs:

- **`InvestorCredential` PDA** — seeds `["investor", wallet]`: jurisdiction, and
  `kyc_verified` / `accredited` / `sanctions_clear` / `revoked` flags.
- **`set_investor_credential`** (authority-gated upsert) — the write seam the
  Compliance Agent uses to mirror its off-chain decision on-chain.
- **`revoke_investor_credential`** (authority-gated) — failed re-screening.
- **`assert_compliant(require_accredited)`** — the gated enforcement seam. A real
  invest/transfer instruction requires this (directly or via CPI) before moving
  value. The predicate `check_credential` is factored out and unit-tested.

The credential PDA is bound to the signing investor's key, so a caller proves
ownership of the wallet the credential was issued for.

## 6. Web: gated invest flow [built]

The deal detail page renders `InvestPanel` (`apps/web/components/invest-panel.tsx`)
instead of the raw invest CTA. The investor supplies a minimal profile; the panel
POSTs to `/api/compliance/verify` (proxy → agents `/compliance/verify`) and:

- on **allow** → reveals the existing `ExpressInterest` flow;
- on **deny** → shows the regime, tier, and the specific reasons.

Same decision, enforced at every layer.

## 7. Transfer restrictions (secondary market) [planned]

`check_transfer(deal, seller, buyer)` already holds a would-be buyer to the same
bar as a primary investor (and requires the seller to be in good standing),
returning a `TransferCheck`. Wiring it into the P2P transfer path — with the
on-chain gate CPI'd from the SPL transfer instruction — is the remaining M3 step,
once M2 tokenization lands.

## 8. Tests

- **Python** — `ai/agents/tests/test_compliance.py` (rule matrix, transfer
  predicate) and `test_server.py` (the `/compliance/*` routes).
- **Rust** — `check_credential` unit tests in `lib.rs` (KYC / sanctions / revoked /
  accreditation gate).
