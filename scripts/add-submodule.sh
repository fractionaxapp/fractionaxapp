#!/usr/bin/env bash
# Add a project to the monorepo as a git submodule.
#
# Usage: pnpm submodule:add <git-url> <path>
#   e.g. pnpm submodule:add https://github.com/fractionaxapp/web.git apps/web
set -euo pipefail

URL="${1:-}"
DEST="${2:-}"

if [[ -z "$URL" || -z "$DEST" ]]; then
  echo "Usage: pnpm submodule:add <git-url> <path>" >&2
  echo "  e.g. pnpm submodule:add https://github.com/fractionaxapp/web.git apps/web" >&2
  exit 1
fi

case "$DEST" in
  apps/*|services/*|ai/*|libs/*|packages/*) ;;
  *)
    echo "Error: submodules must live under apps/, services/, ai/, libs/ or packages/." >&2
    exit 1
    ;;
esac

echo "→ Adding submodule $URL at $DEST"
git submodule add "$URL" "$DEST"
git submodule update --init --recursive "$DEST"

echo "→ Syncing moon project graph"
moon sync projects || true

echo "✓ Done. If the submodule lacks a moon.yml, add one so moon can orchestrate it."
