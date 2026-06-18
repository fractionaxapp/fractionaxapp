# ai/

AI / ML workloads, each added as a **git submodule**: model-serving services,
training pipelines, agent frameworks, RAG indexers, eval harnesses.

```bash
pnpm submodule:add https://github.com/fractionaxapp/ai-agents.git ai/agents
```

Typically Python (`language: python`, managed by uv). Share domain logic with the
rest of the monorepo via `libs/py-core` or language-agnostic contracts.

> When building LLM features here, default to the latest Claude models
> (Opus 4.8 / Sonnet 4.6 / Haiku 4.5) via the `@anthropic-ai/sdk` or `anthropic`
> Python package. See the repo's AI conventions before wiring a provider.
