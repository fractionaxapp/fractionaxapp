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

Every project (in-repo package or submodule) MUST have a `moon.yml` with:

```yaml
type: "application" | "library" | "tool"
language: "typescript" | "python" | "go" | ...
stack: "frontend" | "backend" | "infrastructure"
tags: ["..."]          # used for task filtering & boundary enforcement
dependsOn: ["core"]    # other projects this depends on
```

- **TypeScript** projects inherit `build/dev/test/lint/typecheck` from
  [`.moon/tasks/node.yml`](.moon/tasks/node.yml).
- **Python** projects inherit `install/dev/test/lint/format/typecheck` from
  [`.moon/tasks/python.yml`](.moon/tasks/python.yml).

Override or add tasks per project in its own `moon.yml`.

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
