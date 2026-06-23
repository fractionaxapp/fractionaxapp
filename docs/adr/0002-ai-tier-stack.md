# ADR 0002: AI tier on the Anthropic SDK + FastAPI (with MiniMax failover)

- **Status:** Accepted
- **Date:** 2026-06-24

## Context

Milestone 1 originally named a specific Vercel toolchain for the AI tier — AI SDK
v6, AI Gateway with OIDC, and AI Elements for the chat UI. As we built the Copilot,
the agent logic (intent parsing, deal sourcing, NAV-grounded underwriting) turned
out to be Python-shaped: it lives next to numeric valuation and the shared
`libs/py-core` domain models, and benefits from Pydantic-validated structured
output. We need to record what we actually build against so a reviewer evaluates
the real system.

## Decision

1. **The AI tier runs on the Anthropic Python SDK behind FastAPI** (`ai/agents`,
   `ai/inference`), not the Vercel AI SDK. The Next.js web app is a thin client
   that calls the agents service through a route handler.
2. **Structured output via forced tool calls.** The model is given one tool whose
   schema is the target Pydantic model and is forced to call it, so replies
   validate directly into typed objects. This replaces the Vercel SDK's
   `Output.object()` and avoids depending on any SDK's evolving `parse()` surface.
3. **MiniMax is the failover provider**, via its OpenAI-compatible API. Failover
   triggers only on availability errors (connection, timeout, 429, 5xx, 529); the
   service can also run on MiniMax alone. Secrets are plain environment variables
   (`ANTHROPIC_API_KEY`, `MINIMAX_API_KEY`) — no AI Gateway / OIDC dependency.
4. **Default model:** Anthropic `claude-opus-4-8`; fallback `MiniMax-M2`.

## Alternatives considered

- **Vercel AI SDK v6 + AI Gateway (OIDC):** Great Next.js DX and a clean
  `Output.object()`, but it pulls the agent logic into TypeScript/Edge, away from
  the Python domain/valuation code, and couples us to Vercel's gateway. Rejected
  for the AI tier; the web app still streams from our own service.
- **LangChain / LlamaIndex orchestration:** Unneeded abstraction for a small, fixed
  agent pipeline; we keep an explicit, debuggable orchestrator.
- **Single provider (Anthropic only):** Simpler, but a provider outage takes the
  Copilot down. The failover layer is cheap and keeps the demo resilient.

## Consequences

- Provider concerns are centralized in `ai/agents/.../llm.py` (and a mirror in
  `ai/inference`); adding a provider is a localized change.
- A second provider means a quality gap on the fallback path — mitigated by a
  deterministic intent backstop (`_enrich_intent`) and by grounding the memo
  valuation in the NAV oracle rather than the model.
- The web app and AI tier evolve independently over HTTP; streaming/AI-Elements-style
  UX can be added on the web side without changing the provider layer.
- The Milestone-1 scope wording is updated to match this stack; see
  [`docs/architecture/agent-system.md`](../architecture/agent-system.md).
