# ADR 0001: Polyglot meta-monorepo with moon + git submodules

- **Status:** Accepted
- **Date:** 2026-06-18

## Context

Fractionax spans many independent projects across heterogeneous stacks: Next/React web
apps, Python and Node API services, and Python-heavy AI/ML workloads. Each project needs
its own repository (independent history, CI, release cadence, access control), but we
also want a single place to orchestrate builds/tests, share configuration, and pin
toolchains so the whole system is reproducible.

## Decision

1. **Meta-monorepo via git submodules.** The top-level repo references each project as a
   submodule under `apps/`, `services/`, and `ai/`. Shared, vendored building blocks live
   in-repo under `packages/` (TS) and `libs/` (other languages).
2. **moon as the task orchestrator.** moon natively supports polyglot projects, a task
   dependency graph, content hashing/caching, and affected-project detection.
3. **proto for toolchain management.** `.prototools` pins node, pnpm, python, uv, and moon
   so every contributor and CI runner uses identical versions.
4. **pnpm workspaces** for JS/TS dependency linking; **uv** for Python environments.

## Alternatives considered

- **Turborepo / Nx:** Excellent JS/TS DX but Python is a second-class citizen. Rejected
  for a polyglot system where Python/AI is first-class.
- **Bazel / Buck2 / Pants:** Most powerful and hermetic, but high adoption cost
  (BUILD files everywhere) not justified at the current scale. Can be revisited if build
  graphs become very large.
- **Single giant repo (no submodules):** Loses per-project history, access control, and
  independent release cadence that the team requires.

## Consequences

- Cloning requires `--recurse-submodules`; CI checks out submodules recursively.
- Changing a project is a two-step flow: commit in the submodule, then bump its pinned
  SHA in the meta-repo (explicit and reviewable).
- moon gives one consistent command surface (`moon run :build`, `moon check --all`)
  regardless of a project's language.
