# Contributing

## Toolchain

All toolchains are pinned in [`.prototools`](.prototools) and installed by
[proto](https://moonrepo.dev/proto). Do **not** rely on globally installed node/python.

```bash
proto install      # install pinned node, pnpm, python, uv, moon
pnpm run setup     # full bootstrap
```

## Cloning

The meta-repo has **nested** submodules (see below), so always clone recursively:

```bash
git clone --recurse-submodules https://github.com/fractionaxapp/fractionaxapp.git
# already cloned shallow? →
pnpm submodule:sync   # git submodule update --init --recursive --remote
```

## Submodule layout

Most submodules are flat (`apps/web`, `services/api`). The AI tier is **nested**:
the `ai` umbrella repo is a submodule of the meta-repo, and each AI service is a
submodule of `ai`:

```
ai/            → fractionaxapp/ai      (umbrella — just submodule pointers)
└── agents/    → fractionaxapp/agents  (the actual service; moon project "agents")
```

So `ai/agents` is **two** submodules deep. It still resolves at `ai/agents` and as
the moon project `agents`, so task commands are unchanged.

## Working in a submodule

Submodules are independent repos. To make and land a change:

```bash
cd ai/agents
git checkout main               # work on a branch, not detached HEAD
# …make changes, commit, and push in the submodule repo…
git push origin main
```

Then record the new SHA in every parent up to the meta-repo. For a flat submodule
that's one bump; for a nested one (`ai/agents`) it's the whole chain
(`agents → ai → meta`). The helper does the entire chain — checkout branch, stage,
commit, push — at each level:

```bash
pnpm submodule:bump ai/agents   # or: apps/web, services/api
```

Doing it by hand for a flat submodule:

```bash
git add apps/web
git commit -m "chore(web): Bump web submodule to <sha>"
git push
```

CI in the meta-repo pins submodules by SHA, so bumping the pointer is an explicit,
reviewable step. The bump helper only moves pointers — commit and push the
submodule's own changes first.

## Project conventions

Every project (in-repo package or submodule) MUST have a `moon.yml`. Tasks are
defined **inline per project** — moon 2.x merges any shared `.moon/tasks/*.yml`
into every project regardless of language, so we keep tasks local to avoid the
Node and Python task sets colliding. Use the templates below as a starting point.

**TypeScript project** (`packages/core/moon.yml` is the reference):

```yaml
layer: "library" # application | library | tool
language: "typescript"
stack: "infrastructure" # frontend | backend | infrastructure
tags: ["shared", "ts"]
toolchains:
  default: ["node"]
project:
  name: "<name>"
  description: "<one line>"
fileGroups:
  sources: ["src/**/*"]
  tests: ["src/**/*.test.ts"]
tasks:
  build: { command: "pnpm exec tsc --build", outputs: ["dist"] }
  lint: { command: "pnpm exec eslint ." }
  test: { command: "pnpm exec vitest run" }
  typecheck: { command: "pnpm exec tsc --noEmit" }
```

**Python project** (`libs/py-core/moon.yml` is the reference):

```yaml
layer: "library"
language: "python"
stack: "infrastructure"
tags: ["shared", "py"]
toolchains:
  default: ["python"]
project:
  name: "<name>"
  description: "<one line>"
tasks:
  install: { command: "uv sync --all-extras" }
  lint: { command: "uv run ruff check .", deps: ["~:install"] }
  test: { command: "uv run pytest", deps: ["~:install"] }
  typecheck: { command: "uv run mypy src", deps: ["~:install"] }
```

Node tasks run local binaries through `pnpm exec` so they resolve from the
workspace `node_modules`. Config-only packages (e.g. `tsconfig`, `config`)
declare no tasks.

## Quality gates

Before pushing:

```bash
moon run :lint --affected
moon run :typecheck --affected
moon run :test --affected
```

Or run the full per-project gate: `moon check --all`.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`,
`chore:`, `docs:`, `refactor:`, `test:`, `ci:`.
