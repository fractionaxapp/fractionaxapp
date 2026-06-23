# Architecture: Fractionax Agent System

- **Status:** Living document
- **Date:** 2026-06-24
- **Scope:** The agentic RWA-investment system — the agents, how they are
  orchestrated, the deal lifecycle, and how the AI tier connects to the web app,
  the domain models, the NAV oracle, and (later) the on-chain programs.

> Status tags below: **[built]** = implemented and in CI today (Milestone 1);
> **[planned]** = designed here, delivered in a later milestone.

---

## 1. Purpose

Fractionax automates the full lifecycle of real-world-asset (RWA) investing with a
system of AI agents: source deals, underwrite them, structure compliant fractional
ownership, execute on-chain, and manage portfolios. A user expresses intent in
natural language ("invest $1,000 in low-risk Malaysian opportunities") and the
agents do the work, **but every on-chain action requires explicit user approval**
unless the user has pre-authorized an auto-execution rule within their risk
parameters. The platform is a technology and aggregation layer — it does not
custody assets or hold user funds.

This document describes the agent system that realizes that vision and what is
actually built today.

---

## 2. System context

```
                ┌──────────────────────────────────────────────┐
 Users ───────► │  apps/web (Next.js 16)   apps/mobile (Expo)   │  presentation
                │  Copilot UX · deal dashboard · (planned wallet)│
                └───────────────┬──────────────────────────────┘
                                │ HTTP (JSON)
                ┌───────────────▼──────────────────────────────┐
                │  services/gateway  →  services/api (Fastify)  │  edge + BFF
                └───────────────┬──────────────────────────────┘
                                │ HTTP
                ┌───────────────▼──────────────────────────────┐
                │  ai/agents (FastAPI)   ai/inference (FastAPI) │  AI tier
                │  Copilot · Sourcing · Underwriting · NAV oracle│
                └───────────────┬──────────────────────────────┘
                                │ (planned) RPC / tx signing
                ┌───────────────▼──────────────────────────────┐
                │  onchain (Solana / Anchor)  [planned wiring]  │  settlement
                │  registry · tokenization · yield distribution │
                └──────────────────────────────────────────────┘

   Shared across tiers: packages/domain (TS) + libs/py-core (Python) — one
   contract for Asset, Deal, Investor, InvestmentMemo, InvestmentIntent, NavQuote.
```

Today the web Copilot calls the AI tier directly via a Next.js route handler
(`apps/web/app/api/copilot/route.ts` → `ai/agents` `/copilot`). The gateway/API
tier and the on-chain wiring are scaffolded for later milestones.

---

## 3. The agent system

The grant defines six agents. They are **modules inside the `ai/agents` service**
behind an orchestrator — not separate deployables — so they share domain models,
the provider layer, and the NAV oracle.

| Agent | Responsibility | Status | Where |
| --- | --- | --- | --- |
| **User Copilot** | Parse natural language into a structured action; orchestrate the others; return intent + deals + memo | **[built]** | `copilot.py` |
| **Deal Sourcing** | Aggregate opportunities and filter by yield / risk / jurisdiction / affordability | **[built]** (seed catalogue; live connectors planned) | `deals.py` |
| **Underwriting** | Produce a structured, NAV-grounded investment memo with risks and a recommendation | **[built]** | `memo.py` + `oracle.py` |
| **Compliance** | KYC/AML, jurisdiction rules, accreditation tiers, transfer restrictions (Reg D/S/A) | **[planned — M3]** | — |
| **Execution** | Convert approved deals into tokenized instruments; execute escrow/settlement on-chain | **[planned — M2/M3]** | `onchain/` (program scaffolded) |
| **Portfolio Manager** | Rebalance by risk appetite, yield, and market conditions | **[planned — M3]** | — |

All agents are file paths under `ai/agents/src/fractionax_agents/`.

---

## 4. Copilot orchestration

The Copilot is the spine of the Milestone-1 demo. `run_copilot()` runs a fixed
pipeline; each step is a specialized agent.

```
 user message
     │
     ▼
 ┌──────────────────────┐   structured output (forced tool call)
 │ parse_intent()       │   NL ──► InvestmentIntent {action, amount_minor,
 │  (Copilot/intent)    │          currency, risk_tier, jurisdiction, asset_kind}
 └──────────┬───────────┘   + deterministic backstop (_enrich_intent)
            │
            ▼
 ┌──────────────────────┐   intent_to_filter() ──► DealFilter
 │ source_deals()       │   filter + rank the catalogue by projected yield
 │  (Deal Sourcing)     │
 └──────────┬───────────┘
            │ top match (for invest/discover intents)
            ▼
 ┌──────────────────────┐   NAV oracle prices the asset, then the LLM writes the
 │ generate_memo()      │   memo around the deterministic illiquidity-adjusted NAV
 │  (Underwriting)      │
 └──────────┬───────────┘
            ▼
   CopilotResult { intent, deals[], memo? }
```

- **Intent parsing** uses *structured output via a forced tool call* (§6), then a
  **deterministic backstop** fills high-confidence fields the model missed
  (`$`→USD, "Malaysian"→MY, "low-risk"→low). This keeps extraction reliable even
  on the fallback provider. See `parse_intent` / `_enrich_intent` in `copilot.py`.
- **Deal sourcing** is deterministic: `intent_to_filter` maps the intent to a
  `DealFilter`; `source_deals` filters the seed catalogue and ranks by yield.
- **Underwriting** is NAV-grounded (§7): the memo's `valuation_minor` is computed,
  not invented by the model.

API surface (`server.py`): `POST /copilot`, `POST /chat` (legacy tool loop),
`GET /deals`, `GET /nav`, `GET /health`.

---

## 5. Deal lifecycle

```
 sourced ──► screening ──► open ──► funded ──► closed
    │            │           │         │
 Sourcing     Underwriting  Copilot   Execution[planned]
 (catalogue)  (memo+NAV)    surfaces  tokenize · escrow · settle on-chain
                                       │
                                       ▼
                              yield distribution[planned — M2]
```

`DealStatus` (`sourced | screening | open | funded | closed`) is already part of
the shared `Deal` model; the M1 catalogue ships deals in `open`. Tokenization,
funding, and yield distribution are on-chain steps delivered in M2.

---

## 6. LLM provider layer (failover + structured output)

The AI tier is built on the **Anthropic Python SDK** behind FastAPI, *not* the
Vercel AI SDK (see [ADR 0002](../adr/0002-ai-tier-stack.md)). The provider layer
(`llm.py`) gives every call automatic failover:

- **Primary:** Anthropic (Claude, default `claude-opus-4-8`).
- **Fallback:** **MiniMax** via its OpenAI-compatible API (`MiniMax-M2`).
  Failover fires **only on availability errors** — connection, timeout, 429, 5xx,
  529 overloaded — never on client errors (400/auth) that would fail anywhere. The
  service can also run on MiniMax alone.

**Structured output** is obtained by giving the model a single tool whose schema is
the target Pydantic model and *forcing* the call (`tool_choice`), so the reply
validates directly into that model (`extract_structured`). Both providers support
this (Anthropic tool use; MiniMax/OpenAI function calling). This is how intent
parsing and memo generation return typed objects without depending on any SDK's
evolving `parse()` surface.

**Why a deterministic backstop?** The fallback model extracts less reliably than
Claude. `_enrich_intent` guarantees the obvious field mappings with keyword/regex
rules and **never overrides** what the model already set — LLM understanding plus a
deterministic floor.

---

## 7. NAV pricing oracle

Valuation is grounded in a pricing oracle (`oracle.py`) behind a `NavOracle`
protocol, so the memo's valuation is deterministic infrastructure rather than an
LLM guess:

- **FundamentalNavOracle** *(default, source `manual`)* — values an asset from its
  cash flows: a discounted cash-flow for royalty and revenue-share streams, and a
  time-value discount for invoices.
- **PythNavOracle** *(source `pyth`)* — the live-feed seam: once an asset is
  tokenized and has a price feed, map `asset_id → feed_id` and the NAV is read from
  Pyth's Hermes endpoint; unmapped assets fall back to fundamentals.
- **Switchboard** — a future provider behind the same protocol.

The Underwriting Agent computes `NAV → illiquidity-adjusted valuation` (haircut by
risk tier) and the memo carries that figure. Selected via `NAV_ORACLE_PROVIDER`.
Exposed directly at `GET /nav`.

---

## 8. Domain model

One contract, two languages, kept in parity by hand (`packages/domain` in
TypeScript/Zod for the web; `libs/py-core` in Python/Pydantic for the AI tier; a
schema-first codegen step is a future option). Core types:

- **Asset** — discriminated union: `ip_royalty`, `invoice`, `revenue_share`.
- **Deal** — an investable wrapper over an asset (min ticket, target raise, yield,
  risk tier, status).
- **InvestmentIntent** — the structured action parsed from natural language.
- **InvestmentMemo** — the Underwriting Agent's output (valuation, risks,
  recommendation).
- **NavQuote** — a net-asset-value point (`pyth | switchboard | manual`).
- **Investor**, **DealFilter** — supporting models.

> Parity note: unset optional fields serialize as `null` (Pydantic `None`), so the
> TypeScript schemas use `.nullish()` for them.

---

## 9. Hybrid execution & regulatory posture

The agents are **advisory and preparatory**; they do not move funds autonomously.
The intended on-chain flow (M2/M3):

1. Agents source → underwrite → propose an action (the M1 demo ends here).
2. The user **explicitly approves** the transaction (or it matches a pre-set
   auto-execution rule within their risk parameters).
3. The Execution Agent submits the transaction; settlement and yield distribution
   happen in the `onchain` Solana programs.

Fractionax does not custody assets, hold user funds, or make unilateral investment
decisions. All investments execute through licensed/regulated partner platforms.
The Compliance Agent (M3) enforces jurisdiction-aware rules and transfer
restrictions. This bounds regulatory exposure to a technology/aggregation layer.

---

## 10. Repository map

| Concern | Location |
| --- | --- |
| Copilot UX, deal dashboard | `apps/web/app/{copilot,deals}`, `apps/web/components` |
| Agent orchestrator + agents | `ai/agents/src/fractionax_agents/{copilot,deals,memo,oracle}.py` |
| Provider failover + structured output | `ai/agents/src/fractionax_agents/{llm,structured}.py` |
| Single-shot inference | `ai/inference/` |
| Shared domain models | `packages/domain` (TS), `libs/py-core` (Python) |
| Edge + BFF | `services/gateway`, `services/api` |
| On-chain programs | `onchain/` (Anchor) |
| Monorepo orchestration | `README.md`, [ADR 0001](../adr/0001-monorepo-tooling.md) |

---

## 11. Milestone mapping

- **M1 (built):** Copilot UX, intent parsing (+ backstop), Deal Sourcing (seed),
  Underwriting with NAV-grounded valuation, NAV oracle, the alternative-asset
  domain models, deal discovery dashboard, provider failover, this documentation.
- **M2 (next):** RWA tokenization + SPL minting, investor registry, automated yield
  distribution (USDC), the Execution Agent, devnet deployment, live deal onboarding.
- **M3:** Compliance Agent (KYC/AML, jurisdiction rules, transfer restrictions),
  Portfolio Manager Agent (rebalancing), secondary market, mainnet-beta.

See [`GRANT.md`](../../GRANT.md) for the full milestone definitions and KPIs.
