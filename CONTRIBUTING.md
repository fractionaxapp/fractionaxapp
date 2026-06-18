# Contributing

## Toolchain

All toolchains are pinned in [`.prototools`](.prototools) and installed by
[proto](https://moonrepo.dev/proto). Do **not** rely on globally installed node/python.

```bash
proto install      # install pinned node, pnpm, python, uv, moon
pnpm run setup     # full bootstrap
```

## Working in a submodule

Submodules are independent repos. To make changes:

```bash
cd apps/web
git checkout -b my-feature      # work on a real branch, not detached HEAD
# …commit & push in the submodule repo…
cd ../..
git add apps/web                # record the new submodule SHA in the meta-repo
git commit -m "chore: bump apps/web to <sha>"
```

CI in the meta-repo pins submodules by SHA, so bumping the pointer is an explicit,
reviewable step.

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
