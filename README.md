# Fractionax — Polyglot Meta-Monorepo

This repository is the **orchestration layer** for Fractionax. Each product, service,
and AI workload lives in its **own git repository** and is wired in here as a **git
submodule**. The top level provides shared configuration, a unified task runner, and
reproducible toolchains across every stack — TypeScript/React/Next, Python, AI/ML,
and API servers.

## Why this design

| Concern | Choice | Rationale |
| --- | --- | --- |
| Multi-language orchestration | **[moon](https://moonrepo.dev)** | Task graph, caching, and affected-detection across Node **and** Python (Turborepo is JS-only; Bazel is too heavy here). |
| Toolchain pinning | **[proto](https://moonrepo.dev/proto)** | One source of truth (`.prototools`) for node, pnpm, python, uv, moon — reproducible everywhere. |
| JS/TS dependencies | **pnpm workspaces** | Fast, strict, content-addressed; deep workspace linking. |
| Python dependencies | **[uv](https://docs.astral.sh/uv/)** | Fast, reproducible Python envs per project. |
| Project isolation | **git submodules** | Each project keeps its own repo, history, CI, and release cadence. |

See [`docs/adr/0001-monorepo-tooling.md`](docs/adr/0001-monorepo-tooling.md) for the
full decision record.

## Layout

```
fractionaxapp/
├── apps/         # User-facing apps          (submodules: web, mobile, admin…)
├── services/     # Backend services & APIs   (submodules: api, gateway…)   — polyglot
├── ai/           # AI tier — `ai` umbrella submodule, nested service submodules:
│   └── agents/   #   fractionaxapp/agents — Claude agents service (Python)
├── packages/     # Shared in-repo TS packages (NOT submodules)
│   ├── tsconfig/ #   @fractionax/tsconfig — base TS configs
│   ├── config/   #   @fractionax/config   — shared ESLint + Prettier
│   ├── core/     #   @fractionax/core     — shared TS utils/types
│   └── ui/       #   @fractionax/ui       — shared React component library
├── libs/         # Shared in-repo libs in other languages
│   └── py-core/  #   fractionax-core      — shared Python primitives
├── .moon/        # moon workspace & toolchain config (tasks are per-project)
├── .prototools   # pinned toolchain versions
└── scripts/      # automation (add-submodule, bump-submodule, …)
```

> **Submodules vs. packages:** `packages/` and `libs/` are vendored *in this repo* —
> shared building blocks. `apps/`, `services/`, and `ai/` hold *submodules* — independent
> repos referenced by commit SHA. The `ai` tier is **nested** (`ai` umbrella →
> `ai/agents`), so clone with `--recurse-submodules` and bump pointers with
> `pnpm submodule:bump <path>` (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Getting started

Prerequisites: [proto](https://moonrepo.dev/proto) (installs node, pnpm, python, uv,
moon from `.prototools`).

```bash
# 1. Clone with all submodules
git clone --recurse-submodules https://github.com/fractionaxapp/fractionaxapp.git
cd fractionaxapp

# 2. Install toolchains + dependencies + sync the moon graph
pnpm run setup        # == proto install && pnpm install && moon sync projects

# 3. Run everything (moon only rebuilds what changed)
moon run :build
moon run :test
moon check --all
```

Already cloned without submodules? Run `pnpm submodule:sync`.

## Common commands

| Command | What it does |
| --- | --- |
| `moon run :build` | Build every project that defines a `build` task |
| `moon run <project>:<task>` | Run one task for one project, e.g. `moon run core:test` |
| `moon run :test --affected` | Only test projects affected by your changes |
| `moon check --all` | Run each project's full quality gate |
| `pnpm submodule:add <url> <path>` | Add a new project as a submodule |
| `pnpm submodule:sync` | Pull latest for all submodules |

## Adding a new project

```bash
# A new Next.js app (its own repo):
pnpm submodule:add https://github.com/fractionaxapp/web.git apps/web

# A new Python AI service:
pnpm submodule:add https://github.com/fractionaxapp/ai-agents.git ai/agents
```

Then ensure the submodule has a `moon.yml` declaring its `language`, `stack`, `tags`,
and any `dependsOn` (e.g. `core`, `ui`, `py-core`). moon discovers it automatically via
the globs in `.moon/workspace.yml`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for conventions.
