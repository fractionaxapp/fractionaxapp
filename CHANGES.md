# Milestone 1 — Status & Deployment

**Date:** 2026-06-25
**Status:** Feature-complete (devnet). Remaining work is live-data wiring + production deploy.
**Reference:** [`GRANT.md`](./GRANT.md) → _Milestone 1 — AI Foundation, Copilot UX & Deal Infrastructure (Week 1–4)_

---

## 1. Architecture note — AI tier on Anthropic SDK + FastAPI (not Vercel AI SDK)

The grant named a Vercel AI toolchain (AI SDK v6, AI Gateway OIDC, AI Elements). We
build the AI tier on the **Anthropic Python SDK behind FastAPI** instead, with the
Next.js web app as a thin streaming client. This is a deliberate, kept decision.

- Structured output uses Anthropic **forced tool calls** validated into Pydantic
  models (`ai/agents/.../llm.py::extract_structured`) — the equivalent of `Output.object()`.
- A **MiniMax** provider is wired as automatic failover on Anthropic availability errors.
- The web streams the agent pipeline over **SSE** from a Next.js route proxy
  (`apps/web/app/api/copilot/stream`), rendered as `intent → deals → memo`.

| Grant wording | As built |
|---|---|
| AI SDK v6 + AI Gateway OIDC | Anthropic Python SDK + FastAPI; keys via env; MiniMax failover |
| AI Elements `<MessageResponse>` | Custom Next.js streaming UI (`components/copilot.tsx`) |
| `Output.object()` memo | Anthropic forced tool call → Pydantic `InvestmentMemo` |

---

## 2. Milestone 1 scorecard (as of 2026-06-25)

🟢 done · 🟡 partial · 🔴 missing

| M1 scope item | Status | Evidence |
|---|---|---|
| Scaffold (Next.js 16 + Tailwind/shadcn + Solana + Vercel) | 🟢 | `apps/web` (Next 16, Tailwind v4, shadcn-style UI); `@fractionax/solana` client; Vercel project linked |
| User Copilot Agent — intent parsing (NL → structured) | 🟢 | `agents/copilot.py::parse_intent` — forced tool call + deterministic regex backstop → `InvestmentIntent` |
| Deal Sourcing Agent — aggregate + filter | 🟢¹ | `agents/deals.py::source_deals` filters by risk/jurisdiction/yield/affordability over a seed catalogue |
| Investment memo generator (structured output) | 🟢 | `agents/memo.py::generate_memo` → Pydantic `InvestmentMemo`; valuation is NAV-derived, not LLM-guessed |
| Agent orchestration + streaming | 🟢 | `agents/copilot.py::run_copilot`/`stream_copilot`; `/copilot`, `/copilot/stream` (SSE), `/deals`, `/nav` |
| Oracle infra — NAV pricing (Pyth/Switchboard) | 🟡² | `agents/oracle.py`: real fundamental DCF/time-value NAV + illiquidity haircut; `PythNavOracle` adapter present, no feeds mapped yet |
| Alternative-asset data models (IP royalty, invoice, revenue-share) | 🟢 | `packages/domain/asset.ts` discriminated union + Pydantic parity in `libs/py-core` |
| Deal / Investor / NAV / Intent / Memo models | 🟢 | `packages/domain/*` (TS) ↔ `libs/py-core/.../domain.py` (Python) |
| Deal discovery dashboard + Copilot UX | 🟢 | `/deals`, `/copilot`, and a live Copilot on the home hero |
| On-chain program (devnet) | 🟢 | Anchor program `Aqvk9Br2PPoTzGZbnYVxnwgpGTzPZTdcowpN9gdkRXGP` deployed to devnet; `initialize` + `register_deal`; registry PDA live |
| Architecture documentation (agent system design) | 🟡 | Per-service READMEs + ADR-0001 (tooling); a dedicated agent-system design doc is still worth adding |

¹ Sourcing runs on a **seed catalogue** (5 assets/deals) — the filtering is real; live partner connectors are M2/M3.
² Pyth adapter makes a real Hermes call when an `asset_id → feed` is configured; with none mapped it falls back to the fundamental oracle.

**Overall: Milestone 1 is feature-complete on devnet.** The deliverables — live Copilot UX
(NL → deal discovery → memo), agent orchestration on devnet, and deal infrastructure ready
for onboarding — are met. What's left is production deploy + live-data wiring.

---

## 3. Remaining work

- [ ] **Go live** — deploy the web (Vercel) + agents (Render); see §4. *(needs dashboard credentials)*
- [ ] **Live deal connectors** — replace the seed catalogue with real sourcing (M2 boundary).
- [ ] **Map Pyth feeds** — populate `PYTH_FEEDS` (`asset_id → price-feed id`) to switch NAV from fundamental to live.
- [ ] **Memo unit test** — the only agent module without a direct test (`agents/memo.py`).
- [ ] **Agent-system design doc** — `docs/architecture/agent-system.md` (the 6-agent design, deal lifecycle).

---

## 4. Deployment runbook (production)

Everything is prepared; the steps below need Vercel/Render dashboard access.

**A. Agents service → Render** (`deploy/Dockerfile.agents`, `render.yaml`)
1. Render → New → Blueprint → select `github.com/fractionaxapp/fractionaxapp`.
2. Set secrets on the `fractionax-agents` service: `ANTHROPIC_API_KEY` (and/or `MINIMAX_API_KEY`).
3. Note the service URL, e.g. `https://fractionax-agents-XXXX.onrender.com`; verify `GET /health`.

**B. Web → Vercel** (project `fractionaxapp` already linked via `apps/web/.vercel/project.json`)
1. In Vercel project settings, set **Root Directory = `apps/web`** (it lives in a submodule, so Vercel must build from there).
2. Add env var **`AGENTS_URL`** = the Render URL from step A.
3. Deploy: push to `main` (Git integration) **or** run `cd apps/web && vercel --prod`. The app builds green locally (`moon run web:build`).

> The web degrades gracefully if the agents service is unset/unreachable — pages render and show a clear error, so it can go live before the agents service if needed.
